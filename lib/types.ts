export type Plan = 'free' | 'pro'

export type SyncDirection = 'notion_to_sheets' | 'sheets_to_notion' | 'bidirectional'

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
  sync_direction: SyncDirection
  created_at: string
}

export interface FieldMapping {
  notion_field: string
  sheet_column: string
  notion_type: string
  /** Per-field sync direction; defaults to the job-level direction */
  field_direction?: SyncDirection
}

export interface SyncRowState {
  id: string
  sync_job_id: string
  notion_page_id: string
  sheet_row_index: number
  notion_hash: string | null
  sheet_hash: string | null
  notion_last_modified: string | null
  sheet_last_modified: string | null
  status: 'synced' | 'conflict' | 'pending'
  created_at: string
  updated_at: string
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
