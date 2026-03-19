import { createClient } from '@supabase/supabase-js'
import { fetchNotionRows } from './notion'
import { writeToSheet, refreshGoogleToken } from './google'
import { FieldMapping } from '@/lib/types'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function runSync(jobId: string): Promise<{ success: boolean; message: string; rowsSynced?: number }> {
  const supabase = getSupabase()

  // Fetch job
  const { data: job, error: jobError } = await supabase
    .from('sync_jobs')
    .select('*, users(notion_access_token, google_access_token, google_refresh_token)')
    .eq('id', jobId)
    .single()

  if (jobError || !job) {
    return { success: false, message: 'Sync job not found' }
  }

  const user = (job as any).users
  if (!user?.notion_access_token) {
    return { success: false, message: 'Notion not connected' }
  }
  if (!user?.google_access_token && !user?.google_refresh_token) {
    return { success: false, message: 'Google Sheets not connected' }
  }

  // Log start
  await supabase.from('sync_logs').insert({
    sync_job_id: jobId,
    status: 'running',
    message: 'Sync started',
  })

  try {
    // Get fresh Google token
    let googleToken = user.google_access_token
    if (user.google_refresh_token) {
      try {
        googleToken = await refreshGoogleToken(user.google_refresh_token)
        await supabase
          .from('users')
          .update({ google_access_token: googleToken })
          .eq('id', job.user_id)
      } catch {
        // Use existing token
      }
    }

    // Fetch Notion data
    const notionRows = await fetchNotionRows(user.notion_access_token, job.notion_db_id)

    if (notionRows.length === 0) {
      await logSync(supabase, jobId, 'success', 'No rows found in Notion database', 0)
      await updateJobStatus(supabase, jobId, 'active')
      return { success: true, message: 'No rows to sync', rowsSynced: 0 }
    }

    // Apply mapping
    const mapping: FieldMapping[] = job.mapping_json || []
    const headers = mapping.map(m => m.sheet_column)
    const rows = notionRows.map(row =>
      mapping.map(m => String(row[m.notion_field] ?? ''))
    )

    // Write to Google Sheet
    await writeToSheet(googleToken, job.google_sheet_id, headers, rows)

    // Update job
    await supabase
      .from('sync_jobs')
      .update({ last_synced_at: new Date().toISOString(), status: 'active' })
      .eq('id', jobId)

    await logSync(supabase, jobId, 'success', `Synced ${rows.length} rows successfully`, rows.length)

    return { success: true, message: `Synced ${rows.length} rows`, rowsSynced: rows.length }
  } catch (err: any) {
    const msg = err?.message || 'Unknown error'
    await logSync(supabase, jobId, 'error', msg)
    await updateJobStatus(supabase, jobId, 'error')
    return { success: false, message: msg }
  }
}

async function logSync(
  supabase: ReturnType<typeof getSupabase>,
  jobId: string,
  status: 'success' | 'error' | 'running',
  message: string,
  rowsSynced?: number
) {
  await supabase.from('sync_logs').insert({
    sync_job_id: jobId,
    status,
    message,
    rows_synced: rowsSynced,
  })
}

async function updateJobStatus(
  supabase: ReturnType<typeof getSupabase>,
  jobId: string,
  status: 'active' | 'error' | 'paused'
) {
  await supabase.from('sync_jobs').update({ status }).eq('id', jobId)
}

export async function runDueJobs(): Promise<void> {
  const supabase = getSupabase()

  const { data: jobs } = await supabase
    .from('sync_jobs')
    .select('id, interval_minutes, last_synced_at, status')
    .eq('status', 'active')

  if (!jobs) return

  const now = new Date()
  for (const job of jobs) {
    const lastSync = job.last_synced_at ? new Date(job.last_synced_at) : null
    const due = !lastSync || (now.getTime() - lastSync.getTime()) >= job.interval_minutes * 60000
    if (due) {
      await runSync(job.id)
    }
  }
}
