import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getLimits } from '@/lib/billing/plans'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch user's plan
  const { data: userData } = await supabase
    .from('users')
    .select('plan')
    .eq('id', user.id)
    .single()

  const plan = userData?.plan ?? 'free'
  const limits = getLimits(plan)

  // Check connection limit
  if (limits.max_connections !== -1) {
    const { count } = await supabase
      .from('sync_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if ((count ?? 0) >= limits.max_connections) {
      return NextResponse.json(
        { error: `Connection limit reached (${count}/${limits.max_connections}). Upgrade your plan to add more syncs.` },
        { status: 403 }
      )
    }
  }

  const body = await request.json()
  const {
    name,
    notion_db_id,
    notion_db_name,
    google_sheet_id,
    google_sheet_name,
    mapping_json,
    sync_direction,
    interval_minutes,
  } = body

  const validDirections = ['notion_to_sheets', 'sheets_to_notion', 'bidirectional']
  const safeDirection = validDirections.includes(sync_direction) ? sync_direction : 'notion_to_sheets'

  // Gate bidirectional sync to paid plans
  if (safeDirection === 'bidirectional' || safeDirection === 'sheets_to_notion') {
    if (!limits.bidirectional_sync) {
      return NextResponse.json(
        { error: 'Bidirectional and Sheets→Notion sync require Pro or Business plan. Upgrade to enable.' },
        { status: 403 }
      )
    }
  }

  // Enforce minimum interval per plan
  const safeInterval = Math.max(interval_minutes || limits.min_interval_minutes, limits.min_interval_minutes)

  const { data: job, error } = await supabase
    .from('sync_jobs')
    .insert({
      user_id: user.id,
      name,
      notion_db_id,
      notion_db_name,
      google_sheet_id,
      google_sheet_name,
      mapping_json,
      sync_direction: safeDirection,
      interval_minutes: safeInterval,
      status: 'active',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(job)
}
