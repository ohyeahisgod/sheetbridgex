import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { SyncDetailClient } from './client'

export default async function SyncDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: job } = await supabase
    .from('sync_jobs')
    .select('*')
    .eq('id', id)
    .eq('user_id', user!.id)
    .single()

  if (!job) notFound()

  const { data: logs } = await supabase
    .from('sync_logs')
    .select('*')
    .eq('sync_job_id', id)
    .order('created_at', { ascending: false })
    .limit(50)

  return <SyncDetailClient job={job} logs={logs || []} />
}
