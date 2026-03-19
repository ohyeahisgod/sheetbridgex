import { NotionDatabase, NotionProperty } from '@/lib/types'

export async function getNotionDatabases(accessToken: string): Promise<NotionDatabase[]> {
  const res = await fetch('https://api.notion.com/v1/search', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
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
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Notion-Version': '2022-06-28',
    },
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
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
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

function flattenNotionPage(page: any): Record<string, any> {
  const flat: Record<string, any> = { _id: page.id }
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
