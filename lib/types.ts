export type Plan = 'free' | 'pro'

export interface User {
  id: string
  email: string
  plan: Plan
  notion_access_token?: string
  google_access_token?: string
  google_refresh_token?: string
  stripe_customer_id?: string
  stripe_subscription_id?: string
}

export interface SyncJob {
  id: string
  user_id: string
  name: string
  notion_db_id: string
  notion_db_name: string
  google_sheet_id: string
  google_sheet_name: string
  mapping_json: FieldMapping[]
  interval_minutes: number
  last_synced_at: string | null
  status: 'active' | 'error' | 'paused'
  created_at: string
}

export interface FieldMapping {
  notion_field: string
  sheet_column: string
  notion_type: string
}

export interface SyncLog {
  id: string
  sync_job_id: string
  status: 'success' | 'error' | 'running'
  message: string
  rows_synced?: number
  created_at: string
}

export interface NotionDatabase {
  id: string
  title: string
  properties: Record<string, NotionProperty>
}

export interface NotionProperty {
  id: string
  name: string
  type: string
}

export interface GoogleSheet {
  id: string
  name: string
}
