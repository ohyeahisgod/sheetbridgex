import { NotionDatabase, NotionProperty } from '@/lib/types'

const NOTION_VERSION = '2022-06-28'

function notionHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type': 'application/json',
  }
}

export async function getNotionDatabases(accessToken: string): Promise<NotionDatabase[]> {
  const res = await fetch('https://api.notion.com/v1/search', {
    method: 'POST',
    headers: notionHeaders(accessToken),
    body: JSON.stringify({
      filter: { value: 'database', property: 'object' },
      sort: { direction: 'descending', timestamp: 'last_edited_time' },
    }),
  })

  if (!res.ok) throw new Error('Failed to fetch Notion databases')

  const data = await res.json()
  return data.results.map((db: any) => ({
    id: db.id,
    title: db.title?.[0]?.plain_text || 'Untitled',
    properties: parseProperties(db.properties),
  }))
}

export async function getNotionDatabase(accessToken: string, dbId: string): Promise<NotionDatabase> {
  const res = await fetch(`https://api.notion.com/v1/databases/${dbId}`, {
    headers: notionHeaders(accessToken),
  })

  if (!res.ok) throw new Error('Failed to fetch Notion database')

  const db = await res.json()
  return {
    id: db.id,
    title: db.title?.[0]?.plain_text || 'Untitled',
    properties: parseProperties(db.properties),
  }
}

function parseProperties(props: Record<string, any>): Record<string, NotionProperty> {
  const result: Record<string, NotionProperty> = {}
  for (const [key, val] of Object.entries(props)) {
    result[key] = { id: val.id, name: key, type: val.type }
  }
  return result
}

export async function fetchNotionRows(accessToken: string, dbId: string): Promise<Record<string, any>[]> {
  const rows: Record<string, any>[] = []
  let cursor: string | undefined

  do {
    const body: any = { page_size: 100 }
    if (cursor) body.start_cursor = cursor

    const res = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
      method: 'POST',
      headers: notionHeaders(accessToken),
      body: JSON.stringify(body),
    })

    if (!res.ok) throw new Error('Failed to query Notion database')

    const data = await res.json()
    for (const page of data.results) {
      rows.push(flattenNotionPage(page))
    }

    cursor = data.has_more ? data.next_cursor : undefined
  } while (cursor)

  return rows
}

export function flattenNotionPage(page: any): Record<string, any> {
  const flat: Record<string, any> = {
    _id: page.id,
    _last_edited_time: page.last_edited_time,
  }
  for (const [key, prop] of Object.entries<any>(page.properties)) {
    flat[key] = extractPropertyValue(prop)
  }
  return flat
}

function extractPropertyValue(prop: any): any {
  switch (prop.type) {
    case 'title':
      return prop.title?.map((t: any) => t.plain_text).join('') || ''
    case 'rich_text':
      return prop.rich_text?.map((t: any) => t.plain_text).join('') || ''
    case 'number':
      return prop.number ?? ''
    case 'select':
      return prop.select?.name || ''
    case 'multi_select':
      return prop.multi_select?.map((s: any) => s.name).join(', ') || ''
    case 'date':
      return prop.date?.start || ''
    case 'checkbox':
      return prop.checkbox ? 'Yes' : 'No'
    case 'url':
      return prop.url || ''
    case 'email':
      return prop.email || ''
    case 'phone_number':
      return prop.phone_number || ''
    case 'formula':
      return extractPropertyValue(prop.formula) || ''
    case 'relation':
      return prop.relation?.map((r: any) => r.id).join(', ') || ''
    case 'people':
      return prop.people?.map((p: any) => p.name || p.id).join(', ') || ''
    case 'files':
      return prop.files?.map((f: any) => f.name).join(', ') || ''
    case 'created_time':
      return prop.created_time || ''
    case 'last_edited_time':
      return prop.last_edited_time || ''
    case 'status':
      return prop.status?.name || ''
    default:
      return ''
  }
}

/** Types that can be written back to Notion from sheet values */
const WRITABLE_TYPES = new Set([
  'title', 'rich_text', 'number', 'select', 'multi_select',
  'date', 'checkbox', 'url', 'email', 'phone_number', 'status',
])

export function isWritableNotionType(type: string): boolean {
  return WRITABLE_TYPES.has(type)
}

function buildNotionProperty(type: string, value: string): any {
  const v = String(value ?? '')
  switch (type) {
    case 'title':
      return { title: [{ text: { content: v } }] }
    case 'rich_text':
      return { rich_text: [{ text: { content: v } }] }
    case 'number': {
      const n = parseFloat(v)
      return { number: isNaN(n) ? null : n }
    }
    case 'select':
      return { select: v ? { name: v } : null }
    case 'multi_select':
      return {
        multi_select: v.split(',').map(s => s.trim()).filter(Boolean).map(name => ({ name })),
      }
    case 'date':
      return { date: v ? { start: v } : null }
    case 'checkbox':
      return { checkbox: v === 'Yes' || v === 'true' || v === '1' }
    case 'url':
      return { url: v || null }
    case 'email':
      return { email: v || null }
    case 'phone_number':
      return { phone_number: v || null }
    case 'status':
      return { status: v ? { name: v } : null }
    default:
      return null
  }
}

/**
 * Create a new page in a Notion database.
 * fields: { [notionFieldName]: { type, value } }
 * Returns the new page ID.
 */
export async function createNotionPage(
  accessToken: string,
  dbId: string,
  fields: Record<string, { type: string; value: string }>
): Promise<string> {
  const properties: Record<string, any> = {}
  for (const [fieldName, { type, value }] of Object.entries(fields)) {
    if (!isWritableNotionType(type)) continue
    const prop = buildNotionProperty(type, value)
    if (prop !== null) properties[fieldName] = prop
  }

  const res = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: notionHeaders(accessToken),
    body: JSON.stringify({
      parent: { database_id: dbId },
      properties,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Failed to create Notion page: ${err}`)
  }

  const page = await res.json()
  return page.id
}

/**
 * Update an existing Notion page's properties.
 * fields: { [notionFieldName]: { type, value } }
 */
export async function updateNotionPage(
  accessToken: string,
  pageId: string,
  fields: Record<string, { type: string; value: string }>
): Promise<void> {
  const properties: Record<string, any> = {}
  for (const [fieldName, { type, value }] of Object.entries(fields)) {
    if (!isWritableNotionType(type)) continue
    const prop = buildNotionProperty(type, value)
    if (prop !== null) properties[fieldName] = prop
  }

  if (Object.keys(properties).length === 0) return

  const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: 'PATCH',
    headers: notionHeaders(accessToken),
    body: JSON.stringify({ properties }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Failed to update Notion page ${pageId}: ${err}`)
  }
}
