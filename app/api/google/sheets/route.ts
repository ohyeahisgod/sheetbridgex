import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGoogleSheets, refreshGoogleToken } from '@/lib/sync/google'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userData } = await supabase
    .from('users')
    .select('google_access_token, google_refresh_token')
    .eq('id', user.id)
    .single()

  if (!userData?.google_access_token && !userData?.google_refresh_token) {
    return NextResponse.json({ error: 'Google not connected' }, { status: 400 })
  }

  let token = userData.google_access_token
  if (userData.google_refresh_token) {
    try {
      token = await refreshGoogleToken(userData.google_refresh_token)
      await supabase.from('users').update({ google_access_token: token }).eq('id', user.id)
    } catch {}
  }

  try {
    const sheets = await getGoogleSheets(token)
    return NextResponse.json({ sheets })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
