import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const ISSUE_LABELS: Record<string, string> = {
  sync_error:      'Sync Error',
  billing:         'Billing / Upgrade',
  connection:      'Connection Issue',
  data:            'Data / Mapping',
  other:           'Other',
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { issueType, message, jobId } = await request.json()

  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  const userEmail = user?.email ?? 'anonymous'
  const issueLabel = ISSUE_LABELS[issueType] ?? issueType ?? 'General'

  const body = [
    `Issue type: ${issueLabel}`,
    `From: ${userEmail}`,
    jobId ? `Sync job: ${jobId}` : null,
    '',
    message.trim(),
  ].filter(Boolean).join('\n')

  const { error } = await resend.emails.send({
    from: 'SheetBridgeX Support <onboarding@resend.dev>',
    to: 'support@satosushi.co',
    replyTo: userEmail !== 'anonymous' ? userEmail : undefined,
    subject: `[SheetBridgeX Support] ${issueLabel}`,
    text: body,
  })

  if (error) {
    console.error('Resend error:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
