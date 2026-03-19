import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const jobId = request.nextUrl.searchParams.get('jobId')
  if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 })

  // Verify ownership
  const { data: job } = await supabase
    .from('sync_jobs')
    .select('id')
    .eq('id', jobId)
    .eq('user_id', user.id)
    .single()

  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: logs } = await supabase
    .from('sync_logs')
    .select('*')
    .eq('sync_job_id', jobId)
    .order('created_at', { ascending: false })
    .limit(50)

  return NextResponse.json({ logs })
}
