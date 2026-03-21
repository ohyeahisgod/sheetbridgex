'use client'

import { useState } from 'react'
import { X, Loader2, CheckCircle2 } from 'lucide-react'

const ISSUE_TYPES = [
  { value: 'sync_error',  label: 'Sync error or failure' },
  { value: 'billing',     label: 'Billing or upgrade question' },
  { value: 'connection',  label: 'Connection issue' },
  { value: 'data',        label: 'Data or mapping problem' },
  { value: 'other',       label: 'Other' },
]

interface SupportModalProps {
  onClose: () => void
  defaultIssueType?: string
  jobId?: string
}

export function SupportModal({ onClose, defaultIssueType = 'other', jobId }: SupportModalProps) {
  const [issueType, setIssueType] = useState(defaultIssueType)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueType, message, jobId }),
      })
      const data = await res.json()
      if (data.success) {
        setSent(true)
      } else {
        setError(data.error ?? 'Something went wrong. Please try again.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />

      {/* Panel */}
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-[15px] font-semibold text-gray-900">Contact support</h2>
            <p className="text-[12px] text-gray-400 mt-0.5">We'll reply to your account email.</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {sent ? (
          /* Success state */
          <div className="px-6 py-10 flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-[14px] font-semibold text-gray-900 mb-1">Message sent</p>
            <p className="text-[13px] text-gray-400 mb-6">
              We'll get back to you as soon as possible.
            </p>
            <button
              onClick={onClose}
              className="text-[13px] font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {/* Issue type */}
            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1.5">
                Issue type
              </label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full text-[13px] text-gray-900 bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-colors"
              >
                {ISSUE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Message */}
            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1.5">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue…"
                rows={4}
                required
                className="w-full text-[13px] text-gray-900 bg-white border border-gray-200 rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-colors placeholder:text-gray-300"
              />
            </div>

            {error && (
              <p className="text-[12px] text-red-600">{error}</p>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-1">
              <a
                href="mailto:support@satosushi.co"
                className="text-[12px] text-gray-400 hover:text-gray-600 transition-colors"
              >
                support@satosushi.co
              </a>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-[13px] font-medium text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !message.trim()}
                  className="inline-flex items-center gap-1.5 text-[13px] font-medium bg-gray-900 text-white px-4 py-1.5 rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Send message
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
