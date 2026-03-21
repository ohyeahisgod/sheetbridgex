'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { NotionDatabase, GoogleSheet, FieldMapping, SyncDirection } from '@/lib/types'

type Step = 'notion' | 'database' | 'sheets' | 'mapping' | 'direction' | 'schedule'

const STEPS: { id: Step; label: string }[] = [
  { id: 'notion', label: 'Connect Notion' },
  { id: 'database', label: 'Select database' },
  { id: 'sheets', label: 'Connect Sheets' },
  { id: 'mapping', label: 'Map fields' },
  { id: 'direction', label: 'Sync direction' },
  { id: 'schedule', label: 'Schedule' },
]

export function CreateSyncWizard({
  hasNotion,
  hasGoogle,
  plan,
}: {
  hasNotion: boolean
  hasGoogle: boolean
  plan: string
}) {
  const router = useRouter()
  const [step, setStep] = useState<Step>(hasNotion ? 'database' : 'notion')
  const [databases, setDatabases] = useState<NotionDatabase[]>([])
  const [selectedDb, setSelectedDb] = useState<NotionDatabase | null>(null)
  const [sheets, setSheets] = useState<GoogleSheet[]>([])
  const [selectedSheet, setSelectedSheet] = useState<GoogleSheet | null>(null)
  const [mapping, setMapping] = useState<FieldMapping[]>([])
  const [syncDirection, setSyncDirection] = useState<SyncDirection>('notion_to_sheets')
  const [syncName, setSyncName] = useState('')
  const [interval, setInterval] = useState(30)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const stepIndex = STEPS.findIndex(s => s.id === step)

  async function loadDatabases() {
    setLoading(true)
    try {
      const res = await fetch('/api/notion/databases')
      const data = await res.json()
      if (data.databases) {
        setDatabases(data.databases)
        setStep('database')
      }
    } catch {
      setError('Failed to load Notion databases')
    } finally {
      setLoading(false)
    }
  }

  async function loadSheets() {
    setLoading(true)
    try {
      const res = await fetch('/api/google/sheets')
      const data = await res.json()
      if (data.sheets) {
        setSheets(data.sheets)
        setStep('sheets')
      }
    } catch {
      setError('Failed to load Google Sheets')
    } finally {
      setLoading(false)
    }
  }

  function selectDatabase(db: NotionDatabase) {
    setSelectedDb(db)
    setSyncName(db.title)
    const props = Object.values(db.properties)
    setMapping(props.map(p => ({ notion_field: p.name, sheet_column: p.name, notion_type: p.type })))
  }

  function updateMapping(index: number, field: keyof FieldMapping, value: string) {
    setMapping(prev => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)))
  }

  async function createSync() {
    if (!selectedDb || !selectedSheet || mapping.length === 0) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/sync/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: syncName || selectedDb.title,
          notion_db_id: selectedDb.id,
          notion_db_name: selectedDb.title,
          google_sheet_id: selectedSheet.id,
          google_sheet_name: selectedSheet.name,
          mapping_json: mapping.filter(m => m.sheet_column.trim()),
          sync_direction: syncDirection,
          interval_minutes: interval,
        }),
      })
      const data = await res.json()
      if (data.id) {
        router.push(`/dashboard/sync/${data.id}`)
      } else {
        setError(data.error || 'Failed to create sync')
      }
    } catch {
      setError('Failed to create sync')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Step indicators */}
      <div className="flex items-center gap-0 mb-8">
        {STEPS.map((s, i) => {
          const completed = i < stepIndex
          const active = s.id === step
          return (
            <div key={s.id} className="flex items-center">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold',
                    completed ? 'bg-gray-900 text-white' : active ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'
                  )}
                >
                  {completed ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span className={cn('text-sm', active ? 'font-medium text-gray-900' : 'text-gray-400')}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && <div className="w-8 h-px bg-gray-200 mx-3" />}
            </div>
          )
        })}
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Step: Notion */}
      {step === 'notion' && (
        <div className="bg-white border border-gray-200 rounded-xl p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Connect Notion</h2>
          <p className="text-sm text-gray-500 mb-6">
            Authorize SheetBridgeX to read your Notion databases.
          </p>
          <div className="flex gap-3">
            <a
              href="/api/auth/notion"
              className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Connect Notion
            </a>
            {hasNotion && (
              <Button variant="outline" onClick={() => { loadDatabases() }}>
                Already connected — continue
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Step: Database */}
      {step === 'database' && (
        <div className="bg-white border border-gray-200 rounded-xl p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Select a Notion database</h2>
          <p className="text-sm text-gray-500 mb-6">Choose which database to sync to Google Sheets.</p>
          {databases.length === 0 ? (
            <Button onClick={loadDatabases} loading={loading}>Load databases</Button>
          ) : (
            <div className="space-y-2 mb-6">
              {databases.map((db) => (
                <button
                  key={db.id}
                  onClick={() => selectDatabase(db)}
                  className={cn(
                    'w-full text-left border rounded-lg px-4 py-3 text-sm transition-colors',
                    selectedDb?.id === db.id
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <p className="font-medium text-gray-900">{db.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{Object.keys(db.properties).length} properties</p>
                </button>
              ))}
            </div>
          )}
          {selectedDb && (
            <Button onClick={() => { hasGoogle ? loadSheets() : setStep('sheets') }} loading={loading}>
              Continue
            </Button>
          )}
        </div>
      )}

      {/* Step: Sheets */}
      {step === 'sheets' && (
        <div className="bg-white border border-gray-200 rounded-xl p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Connect Google Sheets</h2>
          <p className="text-sm text-gray-500 mb-6">Select a spreadsheet to write data into.</p>
          {!hasGoogle ? (
            <div className="flex gap-3">
              <a
                href="/api/auth/google"
                className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Connect Google
              </a>
            </div>
          ) : sheets.length === 0 ? (
            <Button onClick={loadSheets} loading={loading}>Load spreadsheets</Button>
          ) : (
            <div className="space-y-2 mb-6">
              {sheets.map((sheet) => (
                <button
                  key={sheet.id}
                  onClick={() => setSelectedSheet(sheet)}
                  className={cn(
                    'w-full text-left border rounded-lg px-4 py-3 text-sm transition-colors',
                    selectedSheet?.id === sheet.id
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <p className="font-medium text-gray-900">{sheet.name}</p>
                </button>
              ))}
            </div>
          )}
          {selectedSheet && (
            <Button onClick={() => setStep('mapping')}>Continue</Button>
          )}
        </div>
      )}

      {/* Step: Mapping */}
      {step === 'mapping' && (
        <div className="bg-white border border-gray-200 rounded-xl p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Map fields</h2>
          <p className="text-sm text-gray-500 mb-6">
            Define how Notion properties map to sheet columns. Leave the column name empty to skip a field.
          </p>
          <div className="space-y-3 mb-6 max-h-80 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4 text-xs font-medium text-gray-500 px-1 mb-1">
              <span>Notion field</span>
              <span>Sheet column</span>
            </div>
            {mapping.map((m, i) => (
              <div key={i} className="grid grid-cols-2 gap-4 items-center">
                <div className="flex items-center gap-2">
                  <span className="flex-1 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 truncate">
                    {m.notion_field}
                  </span>
                  <span className="text-xs text-gray-400 flex-shrink-0">{m.notion_type}</span>
                </div>
                <input
                  type="text"
                  value={m.sheet_column}
                  onChange={(e) => updateMapping(i, 'sheet_column', e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="Skip field"
                />
              </div>
            ))}
          </div>
          <Button onClick={() => setStep('direction')}>Continue</Button>
        </div>
      )}

      {/* Step: Direction */}
      {step === 'direction' && (
        <div className="bg-white border border-gray-200 rounded-xl p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Sync direction</h2>
          <p className="text-sm text-gray-500 mb-6">
            Choose how data flows between Notion and Google Sheets.
          </p>
          <div className="space-y-3 mb-6">
            {[
              {
                value: 'notion_to_sheets' as SyncDirection,
                label: 'Notion → Sheets',
                description: 'Data flows one-way from Notion into your spreadsheet.',
              },
              {
                value: 'sheets_to_notion' as SyncDirection,
                label: 'Sheets → Notion',
                description: 'Changes made in the spreadsheet are pushed back to Notion.',
              },
              {
                value: 'bidirectional' as SyncDirection,
                label: 'Bidirectional (2-way)',
                description: 'Changes on either side are synced to the other. Notion wins on conflict.',
              },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setSyncDirection(opt.value)}
                className={cn(
                  'w-full text-left border rounded-lg px-4 py-3 text-sm transition-colors',
                  syncDirection === opt.value
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <p className="font-medium text-gray-900">{opt.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{opt.description}</p>
              </button>
            ))}
          </div>
          <Button onClick={() => setStep('schedule')}>Continue</Button>
        </div>
      )}

      {/* Step: Schedule */}
      {step === 'schedule' && (
        <div className="bg-white border border-gray-200 rounded-xl p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Configure sync</h2>
          <p className="text-sm text-gray-500 mb-6">Name your sync and set the auto-sync interval.</p>
          <div className="space-y-4 mb-6">
            <Input
              label="Sync name"
              value={syncName}
              onChange={(e) => setSyncName(e.target.value)}
              placeholder="My sync"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Auto-sync interval</label>
              <select
                value={interval}
                onChange={(e) => setInterval(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                {plan === 'pro' && <option value={5}>Every 5 minutes (Pro)</option>}
                {plan === 'pro' && <option value={15}>Every 15 minutes (Pro)</option>}
                <option value={30}>Every 30 minutes</option>
                <option value={60}>Every hour</option>
              </select>
              {plan === 'free' && (
                <p className="mt-1 text-xs text-gray-400">
                  Upgrade to Pro for 5-minute sync intervals.{' '}
                  <a href="/dashboard/billing" className="text-gray-900 hover:underline">Upgrade →</a>
                </p>
              )}
            </div>
          </div>
          <Button onClick={createSync} loading={loading}>
            Create sync
          </Button>
        </div>
      )}
    </div>
  )
}
