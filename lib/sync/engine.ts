import { createHash } from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { fetchNotionRows, createNotionPage, updateNotionPage, isWritableNotionType } from './notion'
import {
  writeToSheet,
  readFromSheet,
  updateSheetRow,
  appendSheetRows,
  refreshGoogleToken,
} from './google'
import { FieldMapping, SyncDirection } from '@/lib/types'
import { getLimits, currentMonth } from '@/lib/billing/plans'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/** Compute a short deterministic hash over a key→value map */
function computeHash(data: Record<string, string>): string {
  const str = Object.keys(data)
    .sort()
    .map(k => `${k}=${data[k]}`)
    .join('&')
  return createHash('sha256').update(str).digest('hex').slice(0, 16)
}

export async function runSync(
  jobId: string
): Promise<{ success: boolean; message: string; rowsSynced?: number }> {
  const supabase = getSupabase()

  const { data: job, error: jobError } = await supabase
    .from('sync_jobs')
    .select('*, users(notion_access_token, google_access_token, google_refresh_token)')
    .eq('id', jobId)
    .single()

  if (jobError || !job) return { success: false, message: 'Sync job not found' }

  const user = (job as any).users
  if (!user?.notion_access_token) return { success: false, message: 'Notion not connected' }
  if (!user?.google_access_token && !user?.google_refresh_token)
    return { success: false, message: 'Google Sheets not connected' }

  // Check row limit before starting
  const { data: userPlan } = await supabase
    .from('users').select('plan').eq('id', job.user_id).single()
  const plan = userPlan?.plan ?? 'free'
  const limits = getLimits(plan)
  if (limits.max_rows_per_month !== -1) {
    const month = currentMonth()
    const { data: usage } = await supabase
      .from('usage_monthly')
      .select('rows_processed')
      .eq('user_id', job.user_id)
      .eq('month', month)
      .single()
    const rowsUsed = usage?.rows_processed ?? 0
    if (rowsUsed >= limits.max_rows_per_month) {
      return {
        success: false,
        message: `Monthly row limit reached (${rowsUsed}/${limits.max_rows_per_month}). Upgrade your plan to continue syncing.`,
      }
    }
  }

  await supabase.from('sync_logs').insert({
    sync_job_id: jobId,
    status: 'running',
    message: 'Sync started',
  })

  try {
    // Refresh Google token
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

    const direction: SyncDirection = job.sync_direction || 'notion_to_sheets'
    const mapping: FieldMapping[] = job.mapping_json || []

    let rowsSynced = 0

    if (direction === 'notion_to_sheets') {
      rowsSynced = await syncNotionToSheets(supabase, job, googleToken, mapping)
    } else if (direction === 'sheets_to_notion') {
      rowsSynced = await syncSheetsToNotion(supabase, job, googleToken, mapping, user.notion_access_token)
    } else {
      rowsSynced = await syncBidirectional(supabase, job, googleToken, mapping, user.notion_access_token)
    }

    await supabase
      .from('sync_jobs')
      .update({ last_synced_at: new Date().toISOString(), status: 'active' })
      .eq('id', jobId)

    const dirLabel =
      direction === 'notion_to_sheets'
        ? 'Notion → Sheets'
        : direction === 'sheets_to_notion'
        ? 'Sheets → Notion'
        : 'bidirectional'

    await logSync(supabase, jobId, 'success', `[${dirLabel}] Synced ${rowsSynced} rows`, rowsSynced)

    // Track usage (fire-and-forget, never fail the sync)
    if (rowsSynced > 0) {
      const month = currentMonth()
      await Promise.all([
        supabase.from('usage_records').insert({
          user_id: job.user_id,
          sync_job_id: jobId,
          sync_runs: 1,
          rows_processed: rowsSynced,
        }),
        supabase.rpc('increment_monthly_usage', {
          p_user_id: job.user_id,
          p_month: month,
          p_sync_runs: 1,
          p_rows_processed: rowsSynced,
        }),
      ]).catch(() => {})
    }

    return { success: true, message: `Synced ${rowsSynced} rows`, rowsSynced }
  } catch (err: any) {
    const msg = err?.message || 'Unknown error'
    await logSync(supabase, jobId, 'error', msg)
    await updateJobStatus(supabase, jobId, 'error')
    return { success: false, message: msg }
  }
}

// ---------------------------------------------------------------------------
// Direction: Notion → Sheets (one-way, full overwrite — same as before)
// ---------------------------------------------------------------------------
async function syncNotionToSheets(
  supabase: ReturnType<typeof getSupabase>,
  job: any,
  googleToken: string,
  mapping: FieldMapping[]
): Promise<number> {
  const notionRows = await fetchNotionRows(job.users.notion_access_token, job.notion_db_id)
  if (notionRows.length === 0) return 0

  const headers = mapping.map(m => m.sheet_column)
  const rows = notionRows.map(row => mapping.map(m => String(row[m.notion_field] ?? '')))

  await writeToSheet(googleToken, job.google_sheet_id, headers, rows)
  return rows.length
}

// ---------------------------------------------------------------------------
// Direction: Sheets → Notion (one-way)
// ---------------------------------------------------------------------------
async function syncSheetsToNotion(
  supabase: ReturnType<typeof getSupabase>,
  job: any,
  googleToken: string,
  mapping: FieldMapping[],
  notionToken: string
): Promise<number> {
  const { headers, rows } = await readFromSheet(googleToken, job.google_sheet_id)
  if (rows.length === 0) return 0

  // Load existing state records
  const { data: existingStates } = await supabase
    .from('sync_row_state')
    .select('*')
    .eq('sync_job_id', job.id)

  const stateByRowIndex = new Map<number, any>(
    (existingStates || []).map((s: any) => [s.sheet_row_index, s])
  )

  // Map sheet header name → column index
  const headerIndex = new Map<string, number>(headers.map((h, i) => [h, i]))

  let synced = 0

  for (let i = 0; i < rows.length; i++) {
    const sheetRowIndex = i + 2 // 1-based; row 1 = header
    const row = rows[i]

    // Build field data from this row
    const rowData: Record<string, string> = {}
    for (const m of mapping) {
      const colIdx = headerIndex.get(m.sheet_column)
      rowData[m.sheet_column] = colIdx !== undefined ? (row[colIdx] ?? '') : ''
    }

    const currentSheetHash = computeHash(rowData)
    const state = stateByRowIndex.get(sheetRowIndex)

    if (state) {
      // Existing row — check if sheet changed
      if (currentSheetHash === state.sheet_hash) continue // no change

      // Sheet changed → update Notion
      const fields = buildNotionFields(mapping, rowData)
      await updateNotionPage(notionToken, state.notion_page_id, fields)
      await supabase
        .from('sync_row_state')
        .update({
          sheet_hash: currentSheetHash,
          sheet_last_modified: new Date().toISOString(),
          status: 'synced',
        })
        .eq('id', state.id)
    } else {
      // New sheet row → create Notion page
      const fields = buildNotionFields(mapping, rowData)
      const pageId = await createNotionPage(notionToken, job.notion_db_id, fields)
      await supabase.from('sync_row_state').insert({
        sync_job_id: job.id,
        notion_page_id: pageId,
        sheet_row_index: sheetRowIndex,
        sheet_hash: currentSheetHash,
        notion_hash: currentSheetHash, // treat as synced
        sheet_last_modified: new Date().toISOString(),
        status: 'synced',
      })
    }

    synced++
  }

  return synced
}

// ---------------------------------------------------------------------------
// Direction: Bidirectional
// ---------------------------------------------------------------------------
async function syncBidirectional(
  supabase: ReturnType<typeof getSupabase>,
  job: any,
  googleToken: string,
  mapping: FieldMapping[],
  notionToken: string
): Promise<number> {
  // 1. Fetch both sources in parallel
  const [notionRows, sheetData] = await Promise.all([
    fetchNotionRows(notionToken, job.notion_db_id),
    readFromSheet(googleToken, job.google_sheet_id),
  ])

  const { headers: sheetHeaders, rows: sheetRows } = sheetData

  // 2. Load state records
  const { data: existingStates } = await supabase
    .from('sync_row_state')
    .select('*')
    .eq('sync_job_id', job.id)

  const states: any[] = existingStates || []
  const stateByNotionId = new Map<string, any>(states.map((s: any) => [s.notion_page_id, s]))
  const stateByRowIndex = new Map<number, any>(states.map((s: any) => [s.sheet_row_index, s]))

  // Build lookup maps
  const notionById = new Map<string, Record<string, any>>(
    notionRows.map(r => [r._id as string, r])
  )
  const headerIndex = new Map<string, number>(sheetHeaders.map((h, i) => [h, i]))

  // Helper: extract mapped data from a Notion row
  const notionRowToData = (row: Record<string, any>) => {
    const d: Record<string, string> = {}
    for (const m of mapping) d[m.notion_field] = String(row[m.notion_field] ?? '')
    return d
  }

  // Helper: extract mapped data from a sheet row
  const sheetRowToData = (row: string[]) => {
    const d: Record<string, string> = {}
    for (const m of mapping) {
      const idx = headerIndex.get(m.sheet_column)
      d[m.sheet_column] = idx !== undefined ? (row[idx] ?? '') : ''
    }
    return d
  }

  // Rows to append to Sheets (batched)
  const rowsToAppend: { values: string[]; notionPageId: string; notionHash: string }[] = []

  let synced = 0

  // -------------------------------------------------------------------------
  // FIRST SYNC (no states): initialise state, then fall through to diff loop.
  //
  // We set sheet_hash = hash of Notion values projected to sheet columns.
  // This represents "the sheet and Notion were last in agreement at these values."
  //
  // Two sub-cases:
  //  A) Sheet is EMPTY  → write Notion→Sheet to populate it, then we're done.
  //  B) Sheet already has data (e.g. from a prior notion_to_sheets sync, or the
  //     user already edited it) → DON'T overwrite the sheet. The diff loop below
  //     will detect any divergence between current sheet content and the Notion
  //     baseline and apply the right changes (e.g. sheet edited → update Notion).
  // -------------------------------------------------------------------------
  if (states.length === 0 && notionRows.length > 0) {
    const stateInserts = notionRows.map((row, i) => {
      const notionData = notionRowToData(row)
      const sheetDataObj: Record<string, string> = {}
      mapping.forEach(m => { sheetDataObj[m.sheet_column] = String(row[m.notion_field] ?? '') })
      return {
        sync_job_id: job.id,
        notion_page_id: row._id as string,
        sheet_row_index: i + 2,
        notion_hash: computeHash(notionData),
        sheet_hash: computeHash(sheetDataObj), // Notion-projected baseline
        notion_last_modified: (row._last_edited_time as string) || null,
        status: 'synced' as const,
      }
    })

    const { data: insertedStates } = await supabase
      .from('sync_row_state')
      .insert(stateInserts)
      .select()

    // Sub-case A: sheet is empty → populate it with Notion data and finish.
    if (sheetRows.length === 0) {
      const headers = mapping.map(m => m.sheet_column)
      const rows = notionRows.map(row => mapping.map(m => String(row[m.notion_field] ?? '')))
      await writeToSheet(googleToken, job.google_sheet_id, headers, rows)
      return notionRows.length
    }

    // Sub-case B: sheet already has data → update local state maps and fall
    // through to the diff loop so divergences are handled in this same sync.
    if (insertedStates) {
      insertedStates.forEach((s: any) => {
        stateByNotionId.set(s.notion_page_id, s)
        stateByRowIndex.set(s.sheet_row_index, s)
        states.push(s)
      })
    }
  }

  if (states.length === 0) return 0

  // -------------------------------------------------------------------------
  // DIFF LOOP (first sync sub-case B + all subsequent syncs)
  // -------------------------------------------------------------------------

  // Track which Notion page IDs and sheet row indices we've already processed
  const processedNotionIds = new Set<string>()

  // Process existing state records
  for (const state of states) {
    const notionRow = notionById.get(state.notion_page_id)
    const sheetRowIndex = state.sheet_row_index
    const sheetRow = sheetRows[sheetRowIndex - 2] // convert to 0-based array index

    const notionData = notionRow ? notionRowToData(notionRow) : null
    const sheetData2 = sheetRow ? sheetRowToData(sheetRow) : null

    const currentNotionHash = notionData ? computeHash(notionData) : null
    const currentSheetHash = sheetData2 ? computeHash(sheetData2) : null

    // Use hash-only comparison for change detection.
    // Do NOT compare timestamps: Postgres normalises timestamptz to a different
    // string format than the Notion API returns, so the strings never match and
    // notionChanged would always be true (the original bug that caused Notion to
    // always overwrite the Sheet).
    const notionChanged = notionRow != null && currentNotionHash !== state.notion_hash
    const sheetChanged = sheetRow != null && currentSheetHash !== state.sheet_hash

    if (notionRow) processedNotionIds.add(state.notion_page_id)

    if (!notionChanged && !sheetChanged) continue // nothing to do

    if (notionChanged && !sheetChanged) {
      // Update Sheet from Notion
      const newSheetValues = mapping.map(m => String(notionRow![m.notion_field] ?? ''))
      await updateSheetRow(googleToken, job.google_sheet_id, sheetRowIndex, newSheetValues)
      const newSheetData: Record<string, string> = {}
      mapping.forEach((m, j) => { newSheetData[m.sheet_column] = newSheetValues[j] })
      await supabase
        .from('sync_row_state')
        .update({
          notion_hash: currentNotionHash,
          sheet_hash: computeHash(newSheetData),
          notion_last_modified: notionRow!._last_edited_time || state.notion_last_modified,
          status: 'synced',
        })
        .eq('id', state.id)
      synced++
    } else if (sheetChanged && !notionChanged) {
      // Update Notion from Sheet
      const fields = buildNotionFields(mapping, sheetData2!)
      await updateNotionPage(notionToken, state.notion_page_id, fields)
      // Also update notion_hash to the expected post-write value.
      // Without this, the next sync would see notion_hash mismatch and incorrectly
      // think Notion changed, causing it to overwrite the Sheet again.
      const expectedNotionData: Record<string, string> = {}
      for (const m of mapping) {
        expectedNotionData[m.notion_field] = sheetData2![m.sheet_column] ?? ''
      }
      await supabase
        .from('sync_row_state')
        .update({
          sheet_hash: currentSheetHash,
          notion_hash: computeHash(expectedNotionData),
          sheet_last_modified: new Date().toISOString(),
          status: 'synced',
        })
        .eq('id', state.id)
      synced++
    } else if (notionChanged && sheetChanged) {
      // CONFLICT: Notion wins (reliable timestamps)
      const newSheetValues = mapping.map(m => String(notionRow![m.notion_field] ?? ''))
      await updateSheetRow(googleToken, job.google_sheet_id, sheetRowIndex, newSheetValues)
      const newSheetData: Record<string, string> = {}
      mapping.forEach((m, j) => { newSheetData[m.sheet_column] = newSheetValues[j] })
      await supabase
        .from('sync_row_state')
        .update({
          notion_hash: currentNotionHash,
          sheet_hash: computeHash(newSheetData),
          notion_last_modified: notionRow!._last_edited_time || state.notion_last_modified,
          status: 'synced',
        })
        .eq('id', state.id)
      synced++
    }
  }

  // -------------------------------------------------------------------------
  // NEW Notion rows (not in state) → append to Sheet
  // -------------------------------------------------------------------------
  const nextSheetRowIndex =
    states.length > 0
      ? Math.max(...states.map((s: any) => s.sheet_row_index)) + 1
      : 2

  const newNotionRows = notionRows.filter(r => !processedNotionIds.has(r._id as string))

  if (newNotionRows.length > 0) {
    const newSheetRowValues = newNotionRows.map(row =>
      mapping.map(m => String(row[m.notion_field] ?? ''))
    )

    const firstAppendedRow = await appendSheetRows(googleToken, job.google_sheet_id, newSheetRowValues)
    const resolvedStart = firstAppendedRow > 0 ? firstAppendedRow : nextSheetRowIndex

    const stateInserts = newNotionRows.map((row, i) => {
      const notionData = notionRowToData(row)
      const sheetValues = mapping.map(m => String(row[m.notion_field] ?? ''))
      const sheetDataObj: Record<string, string> = {}
      mapping.forEach((m, j) => { sheetDataObj[m.sheet_column] = sheetValues[j] })
      return {
        sync_job_id: job.id,
        notion_page_id: row._id,
        sheet_row_index: resolvedStart + i,
        notion_hash: computeHash(notionData),
        sheet_hash: computeHash(sheetDataObj),
        notion_last_modified: row._last_edited_time || null,
        status: 'synced',
      }
    })

    await supabase.from('sync_row_state').insert(stateInserts)
    synced += newNotionRows.length
  }

  // -------------------------------------------------------------------------
  // NEW Sheet rows (data rows with no state record) → create Notion pages
  // -------------------------------------------------------------------------
  const processedRowIndices = new Set(states.map((s: any) => s.sheet_row_index))

  for (let i = 0; i < sheetRows.length; i++) {
    const sheetRowIndex = i + 2
    if (processedRowIndices.has(sheetRowIndex)) continue

    const row = sheetRows[i]
    const rowData = sheetRowToData(row)

    // Skip fully empty rows
    if (Object.values(rowData).every(v => v === '')) continue

    const fields = buildNotionFields(mapping, rowData)
    const hasWritableContent = Object.values(fields).some(f => f.value !== '')
    if (!hasWritableContent) continue

    const pageId = await createNotionPage(notionToken, job.notion_db_id, fields)
    const hash = computeHash(rowData)
    await supabase.from('sync_row_state').insert({
      sync_job_id: job.id,
      notion_page_id: pageId,
      sheet_row_index: sheetRowIndex,
      sheet_hash: hash,
      notion_hash: hash,
      sheet_last_modified: new Date().toISOString(),
      status: 'synced',
    })
    synced++
  }

  return synced
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildNotionFields(
  mapping: FieldMapping[],
  rowData: Record<string, string>
): Record<string, { type: string; value: string }> {
  const fields: Record<string, { type: string; value: string }> = {}
  for (const m of mapping) {
    if (!isWritableNotionType(m.notion_type)) continue
    const value = rowData[m.sheet_column] ?? ''
    fields[m.notion_field] = { type: m.notion_type, value }
  }
  return fields
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
    const due =
      !lastSync || now.getTime() - lastSync.getTime() >= job.interval_minutes * 60000
    if (due) {
      await runSync(job.id)
    }
  }
}
