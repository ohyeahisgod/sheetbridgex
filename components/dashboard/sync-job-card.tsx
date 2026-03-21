'use client'

import { useState } from 'react'
import Link from 'next/link'
import { RefreshCw, ChevronRight, Clock, Pause, Play, ArrowRight, ArrowLeft, ArrowLeftRight } from 'lucide-react'
import { SyncJob, SyncDirection } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatRelativeTime } from '@/lib/utils'

function DirectionBadge({ direction }: { direction: SyncDirection }) {
  if (direction === 'notion_to_sheets') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-2 py-0.5">
        <ArrowRight className="w-3 h-3" /> Notion → Sheets
      </span>
    )
  }
  if (direction === 'sheets_to_notion') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-purple-700 bg-purple-50 border border-purple-100 rounded-full px-2 py-0.5">
        <ArrowLeft className="w-3 h-3" /> Sheets → Notion
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-100 rounded-full px-2 py-0.5">
      <ArrowLeftRight className="w-3 h-3" /> Bidirectional
    </span>
  )
}

export function SyncJobCard({ job }: { job: SyncJob }) {
  const [syncing, setSyncing] = useState(false)
  const [status, setStatus] = useState(job.status)
  const [lastSynced, setLastSynced] = useState(job.last_synced_at)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [toggling, setToggling] = useState(false)

  async function handleSync() {
    setSyncing(true)
    setSyncError(null)
    try {
      const res = await fetch('/api/sync/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id }),
      })
      const data = await res.json()
      if (data.success) {
        setStatus('active')
        setLastSynced(new Date().toISOString())
      } else {
        setStatus('error')
        setSyncError(data.message || 'Sync failed')
      }
    } catch {
      setStatus('error')
      setSyncError('Network error')
    } finally {
      setSyncing(false)
    }
  }

  async function togglePause() {
    setToggling(true)
    const nextStatus = status === 'paused' ? 'active' : 'paused'
    try {
      const res = await fetch(`/api/sync/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })
      if (res.ok) setStatus(nextStatus)
    } finally {
      setToggling(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <h3 className="font-semibold text-gray-900 truncate">{job.name}</h3>
            <Badge variant={status === 'active' ? 'success' : status === 'error' ? 'error' : 'warning'}>
              {status}
            </Badge>
            <DirectionBadge direction={job.sync_direction || 'notion_to_sheets'} />
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
            <span className="truncate max-w-xs">{job.notion_db_name} ↔ {job.google_sheet_name}</span>
            <span className="flex items-center gap-1 flex-shrink-0">
              <Clock className="w-3 h-3" />
              Every {job.interval_minutes}m
            </span>
            <span className="flex-shrink-0">
              {lastSynced ? `Last synced ${formatRelativeTime(lastSynced)}` : 'Never synced'}
            </span>
          </div>
          {syncError && (
            <p className="mt-1.5 text-xs text-red-600">{syncError}</p>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={togglePause}
            loading={toggling}
            title={status === 'paused' ? 'Resume' : 'Pause'}
          >
            {status === 'paused' ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            loading={syncing}
            disabled={status === 'paused'}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sync
          </Button>
          <Link href={`/dashboard/sync/${job.id}`}>
            <Button variant="ghost" size="sm">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
