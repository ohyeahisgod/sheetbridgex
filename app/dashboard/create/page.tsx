import { createClient } from '@/lib/supabase/server'
import { CreateSyncWizard } from './wizard'

export default async function CreateSyncPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: userData } = await supabase
    .from('users')
    .select('notion_access_token, google_access_token, google_refresh_token, plan')
    .eq('id', user!.id)
    .single()

  return (
    <div className="px-8 py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Create sync</h1>
        <p className="mt-1 text-sm text-gray-500">Connect Notion to Google Sheets in a few steps</p>
      </div>
      <CreateSyncWizard
        hasNotion={!!userData?.notion_access_token}
        hasGoogle={!!(userData?.google_access_token || userData?.google_refresh_token)}
        plan={userData?.plan || 'free'}
      />
    </div>
  )
}
