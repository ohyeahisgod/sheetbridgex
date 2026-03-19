import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runSync } from '@/lib/sync/engine'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { jobId } = await request.json()
  if (!jobId) {
    return NextResponse.json({ error: 'jobId required' }, { status: 400 })
  }

  // Verify ownership
  const { data: job } = await supabase
    .from('sync_jobs')
    .select('id')
    .eq('id', jobId)
    .eq('user_id', user.id)
    .single()

  if (!job) {
    return NextResponse.json({ error: 'Sync job not found' }, { status: 404 })
  }

  const result = await runSync(jobId)
  return NextResponse.json(result)
}
