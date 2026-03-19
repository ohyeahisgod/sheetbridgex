import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getNotionDatabases } from '@/lib/sync/notion'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userData } = await supabase
    .from('users')
    .select('notion_access_token')
    .eq('id', user.id)
    .single()

  if (!userData?.notion_access_token) {
    return NextResponse.json({ error: 'Notion not connected' }, { status: 400 })
  }

  try {
    const databases = await getNotionDatabases(userData.notion_access_token)
    return NextResponse.json({ databases })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
