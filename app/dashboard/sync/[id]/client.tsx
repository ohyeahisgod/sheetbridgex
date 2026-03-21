'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, RefreshCw, Clock, CheckCircle, XCircle, Loader2,
  Pause, Play, Trash2, Save, ArrowRight, ArrowLeftRight,
} from 'lucide-react'
import { SyncJob, SyncLog, FieldMapping, SyncDirection } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatDate, formatRelativeTime } from '@/lib/utils'

function directionLabel(d: SyncDirection) {
  if (d === 'notion_to_sheets') return 'Notion → Sheets'
  if (d === 'sheets_to_notion') return 'Sheets → Notion'
  return 'Bidirectional'
}

function directionIcon(d: SyncDirection) {
  if (d === 'notion_to_sheets') return <ArrowRight className="w-4 h-4" />
  if (d === 'sheets_to_notion') return <ArrowLeft className="w-4 h-4" />
  return <ArrowLeftRight className="w-4 h-4" />
}

export function SyncDetailClient({
  job: initialJob,
  logs: initialLogs,
}: {
  job: SyncJob
  logs: SyncLog[]
}) {
  const router = useRouter()
  const [job, setJob] = useState(initialJob)
  const [syncing, setSyncing] = useState(false)
  const [logs, setLogs] = useState(initialLogs)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [toggling, setToggling] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Mapping editor state
  const [mapping, setMapping] = useState<FieldMapping[]>(job.mapping_json || [])
  const [savingMapping, setSavingMapping] = useState(false)
  const [mappingSaved, setMappingSaved] = useState(false)

  // Name / interval edit
  const [name, setName] = useState(job.name)
  const [intervalMinutes, setIntervalMinutes] = useState(job.interval_minutes)
  const [savingSettings, setSavingSettings] = useState(false)

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

      const logsRes = await fetch(`/api/sync/logs?jobId=${job.id}`)
      const logsData = await logsRes.json()
      if (logsData.logs) setLogs(logsData.logs)

      if (data.success) {
        setJob(j => ({ ...j, status: 'active', last_synced_at: new Date().toISOString() }))
      } else {
        setJob(j => ({ ...j, status: 'error' }))
        setSyncError(data.message || 'Sync failed')
      }
    } finally {
      setSyncing(false)
    }
  }

  async function togglePause() {
    setToggling(true)
    const nextStatus = job.status === 'paused' ? 'active' : 'paused'
    try {
      const res = await fetch(`/api/sync/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })
      if (res.ok) setJob(j => ({ ...j, status: nextStatus }))
    } finally {
      setToggling(false)
    }
  }

  async function saveSettings() {
    setSavingSettings(true)
    try {
      const res = await fetch(`/api/sync/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, interval_minutes: intervalMinutes }),
      })
      if (res.ok) {
        const updated = await res.json()
        setJob(j => ({ ...j, name: updated.name, interval_minutes: updated.interval_minutes }))
      }
    } finally {
      setSavingSettings(false)
    }
  }

  async function saveMapping() {
    setSavingMapping(true)
    setMappingSaved(false)
    try {
      const res = await fetch(`/api/sync/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mapping_json: mapping.filter(m => m.sheet_column.trim()) }),
      })
      if (res.ok) setMappingSaved(true)
    } finally {
      setSavingMapping(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await fetch(`/api/sync/${job.id}`, { method: 'DELETE' })
      router.push('/dashboard')
    } finally {
      setDeleting(false)
    }
  }

  const settingsChanged = name !== job.name || intervalMinutes !== job.interval_minutes

  return (
    <div className="px-8 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to syncs
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{job.name}</h1>
              <Badge variant={job.status === 'active' ? 'success' : job.status === 'error' ? 'error' : 'warning'}>
                {job.status}
              </Badge>
              <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
                {directionIcon(job.sync_direction || 'notion_to_sheets')}
                {directionLabel(job.sync_direction || 'notion_to_sheets')}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {job.notion_db_name} ↔ {job.google_sheet_name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={togglePause}
              loading={toggling}
              title={job.status === 'paused' ? 'Resume' : 'Pause'}
            >
              {job.status === 'paused' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </Button>
            <Button
              onClick={handleSync}
              loading={syncing}
              disabled={job.status === 'paused'}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Sync now
            </Button>
          </div>
        </div>
        {syncError && (
          <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {syncError}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-gray-500 mb-1">Last synced</p>
            <p className="font-semibold text-gray-900">
              {job.last_synced_at ? formatRelativeTime(job.last_synced_at) : 'Never'}
            </p>
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
            <p className="font-semibold text-gray-900">{mapping.length} fields</p>
          </CardContent>
        </Card>
      </div>

      {/* Settings */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Settings</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Input
              label="Sync name"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Interval (minutes)</label>
              <select
                value={intervalMinutes}
                onChange={e => setIntervalMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value={5}>5 minutes (Pro)</option>
                <option value={15}>15 minutes (Pro)</option>
                <option value={30}>30 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={120}>2 hours</option>
              </select>
            </div>
          </div>
          {settingsChanged && (
            <Button size="sm" onClick={saveSettings} loading={savingSettings} className="flex items-center gap-2">
              <Save className="w-3.5 h-3.5" /> Save settings
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Mapping editor */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="font-semibold text-gray-900">Field mapping</h2>
          <Button size="sm" variant="outline" onClick={saveMapping} loading={savingMapping} className="flex items-center gap-2">
            <Save className="w-3.5 h-3.5" />
            {mappingSaved ? 'Saved!' : 'Save mapping'}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-xs font-medium text-gray-500 px-1 mb-2">
            <span>Notion field</span>
            <span>Sheet column</span>
          </div>
          <div className="space-y-2">
            {mapping.map((m, i) => (
              <div key={i} className="grid grid-cols-2 gap-3 items-center">
                <div className="flex items-center gap-2">
                  <span className="flex-1 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded px-2 py-1.5 truncate">
                    {m.notion_field}
                  </span>
                  <span className="text-xs text-gray-400 flex-shrink-0">{m.notion_type}</span>
                </div>
                <input
                  type="text"
                  value={m.sheet_column}
                  onChange={e => setMapping(prev =>
                    prev.map((x, j) => j === i ? { ...x, sheet_column: e.target.value } : x)
                  )}
                  className="text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="Skip field"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sync history */}
      <Card className="mb-6">
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
                    {log.rows_synced != null && log.rows_synced > 0 && (
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

      {/* Danger zone */}
      <Card className="border-red-100">
        <CardHeader>
          <h2 className="font-semibold text-red-700">Danger zone</h2>
        </CardHeader>
        <CardContent>
          {!showDeleteConfirm ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete sync
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <p className="text-sm text-gray-700">This will permanently delete this sync. Are you sure?</p>
              <Button
                size="sm"
                onClick={handleDelete}
                loading={deleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Yes, delete
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
