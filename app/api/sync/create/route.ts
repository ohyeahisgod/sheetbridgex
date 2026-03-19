import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check plan limits
  const { data: userData } = await supabase
    .from('users')
    .select('plan')
    .eq('id', user.id)
    .single()

  const plan = userData?.plan || 'free'

  if (plan === 'free') {
    const { count } = await supabase
      .from('sync_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if ((count || 0) >= 1) {
      return NextResponse.json(
        { error: 'Free plan limited to 1 sync. Upgrade to Pro for unlimited syncs.' },
        { status: 403 }
      )
    }
  }

  const body = await request.json()
  const { name, notion_db_id, notion_db_name, google_sheet_id, google_sheet_name, mapping_json, interval_minutes } = body

  // Enforce minimum interval per plan
  const minInterval = plan === 'pro' ? 5 : 30
  const safeInterval = Math.max(interval_minutes || minInterval, minInterval)

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
