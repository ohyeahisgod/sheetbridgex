import { NextRequest, NextResponse } from 'next/server'
import { runDueJobs } from '@/lib/sync/engine'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await runDueJobs()
  return NextResponse.json({ success: true, timestamp: new Date().toISOString() })
}

// Also allow GET for Vercel cron
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await runDueJobs()
  return NextResponse.json({ success: true, timestamp: new Date().toISOString() })
}
