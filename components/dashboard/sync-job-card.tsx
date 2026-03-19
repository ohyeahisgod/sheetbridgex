'use client'

import { useState } from 'react'
import Link from 'next/link'
import { RefreshCw, ChevronRight, Clock } from 'lucide-react'
import { SyncJob } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatRelativeTime } from '@/lib/utils'

export function SyncJobCard({ job }: { job: SyncJob }) {
  const [syncing, setSyncing] = useState(false)
  const [status, setStatus] = useState(job.status)
  const [lastSynced, setLastSynced] = useState(job.last_synced_at)

  async function handleSync() {
    setSyncing(true)
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
      }
    } catch {
      setStatus('error')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between hover:border-gray-300 transition-colors">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 truncate">{job.name}</h3>
            <Badge variant={status === 'active' ? 'success' : status === 'error' ? 'error' : 'warning'}>
              {status}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="truncate">{job.notion_db_name} → {job.google_sheet_name}</span>
            <span className="flex items-center gap-1 flex-shrink-0">
              <Clock className="w-3 h-3" />
              Every {job.interval_minutes}m
            </span>
            <span className="flex-shrink-0">Last synced: {formatRelativeTime(lastSynced)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          loading={syncing}
          className="flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Sync now
        </Button>
        <Link href={`/dashboard/sync/${job.id}`}>
          <Button variant="ghost" size="sm">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
