'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { SyncJob } from '@/lib/types'
import { PlanLimits } from '@/lib/billing/plans'
import { SyncJobCard } from './sync-job-card'
import { UpgradeModal } from './upgrade-modal'

interface DashboardShellProps {
  jobs: SyncJob[]
  plan: string
  limits: PlanLimits
  connectionsUsed: number
}

export function DashboardShell({ jobs, plan, limits, connectionsUsed }: DashboardShellProps) {
  const router = useRouter()
  const [upgradeReason, setUpgradeReason] = useState<'connection_limit' | null>(null)

  const atConnectionLimit = limits.max_connections !== -1 && connectionsUsed >= limits.max_connections

  function handleNewSync() {
    if (atConnectionLimit) {
      setUpgradeReason('connection_limit')
    } else {
      router.push('/dashboard/create')
    }
  }

  return (
    <>
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Syncs</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {jobs.length} active sync{jobs.length !== 1 ? 's' : ''}
            {limits.max_connections !== -1 ? ` · ${connectionsUsed} of ${limits.max_connections} connections used` : ''}
          </p>
        </div>
        <button
          onClick={handleNewSync}
          className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New sync
        </button>
      </div>

      {/* Sync job list */}
      {jobs.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <div className="w-12 h-12 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Plus className="w-5 h-5 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">No syncs yet</h3>
          <p className="text-sm text-gray-500 mb-6">
            Create your first sync to start moving data between Notion and Google Sheets.
          </p>
          <button
            onClick={handleNewSync}
            className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create sync
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job, index) => (
            <SyncJobCard
              key={job.id}
              job={job}
              plan={plan}
              connectionIndex={index + 1}
              maxConnections={limits.max_connections}
              bidirectionalEnabled={limits.bidirectional_sync}
            />
          ))}
        </div>
      )}

      {/* Upgrade modal */}
      {upgradeReason && (
        <UpgradeModal
          reason={upgradeReason}
          onClose={() => setUpgradeReason(null)}
        />
      )}
    </>
  )
}
