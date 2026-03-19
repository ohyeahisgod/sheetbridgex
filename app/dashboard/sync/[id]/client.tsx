'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, RefreshCw, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { SyncJob, SyncLog } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { formatDate, formatRelativeTime } from '@/lib/utils'

export function SyncDetailClient({ job, logs: initialLogs }: { job: SyncJob; logs: SyncLog[] }) {
  const [syncing, setSyncing] = useState(false)
  const [logs, setLogs] = useState(initialLogs)
  const [jobStatus, setJobStatus] = useState(job.status)
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

      // Refresh logs
      const logsRes = await fetch(`/api/sync/logs?jobId=${job.id}`)
      const logsData = await logsRes.json()
      if (logsData.logs) setLogs(logsData.logs)

      if (data.success) {
        setJobStatus('active')
        setLastSynced(new Date().toISOString())
      } else {
        setJobStatus('error')
      }
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="px-8 py-8 max-w-4xl">
      <div className="mb-6">
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to syncs
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{job.name}</h1>
              <Badge variant={jobStatus === 'active' ? 'success' : jobStatus === 'error' ? 'error' : 'warning'}>
                {jobStatus}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {job.notion_db_name} → {job.google_sheet_name}
            </p>
          </div>
          <Button onClick={handleSync} loading={syncing} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Sync now
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-gray-500 mb-1">Last synced</p>
            <p className="font-semibold text-gray-900">{formatRelativeTime(lastSynced)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-gray-500 mb-1">Sync interval</p>
            <p className="font-semibold text-gray-900 flex items-center gap-1">
              <Clock className="w-4 h-4 text-gray-400" /> Every {job.interval_minutes}m
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-gray-500 mb-1">Field mappings</p>
            <p className="font-semibold text-gray-900">{job.mapping_json?.length || 0} fields</p>
          </CardContent>
        </Card>
      </div>

      {/* Field Mapping */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Field mapping</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {job.mapping_json?.map((m, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="bg-gray-50 border border-gray-200 rounded px-2 py-1 text-gray-700 font-mono text-xs">
                  {m.notion_field}
                </span>
                <span className="text-gray-400">→</span>
                <span className="bg-gray-50 border border-gray-200 rounded px-2 py-1 text-gray-700 font-mono text-xs">
                  {m.sheet_column}
                </span>
                <span className="text-xs text-gray-400">{m.notion_type}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Logs */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Sync history</h2>
        </CardHeader>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-400">No sync runs yet</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 px-6 py-3">
                  {log.status === 'success' && <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />}
                  {log.status === 'error' && <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />}
                  {log.status === 'running' && <Loader2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0 animate-spin" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{log.message}</p>
                    {log.rows_synced !== undefined && (
                      <p className="text-xs text-gray-400 mt-0.5">{log.rows_synced} rows synced</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(log.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
