import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { SyncJobCard } from '@/components/dashboard/sync-job-card'
import { SyncJob } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: jobs } = await supabase
    .from('sync_jobs')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div className="px-8 py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Syncs</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your Notion → Google Sheets sync jobs</p>
        </div>
        <Link
          href="/dashboard/create"
          className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New sync
        </Link>
      </div>

      {!jobs || jobs.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <div className="w-12 h-12 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Plus className="w-5 h-5 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">No syncs yet</h3>
          <p className="text-sm text-gray-500 mb-6">Create your first sync to start moving data from Notion to Google Sheets.</p>
          <Link
            href="/dashboard/create"
            className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create sync
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {(jobs as SyncJob[]).map((job) => (
            <SyncJobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  )
}
