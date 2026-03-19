import { GoogleSheet } from '@/lib/types'

const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets'
const DRIVE_BASE = 'https://www.googleapis.com/drive/v3'

export async function refreshGoogleToken(refreshToken: string): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!res.ok) throw new Error('Failed to refresh Google token')
  const data = await res.json()
  return data.access_token
}

export async function getGoogleSheets(accessToken: string): Promise<GoogleSheet[]> {
  const res = await fetch(
    `${DRIVE_BASE}/files?q=mimeType='application/vnd.google-apps.spreadsheet'&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!res.ok) throw new Error('Failed to fetch Google Sheets')
  const data = await res.json()
  return data.files || []
}

export async function writeToSheet(
  accessToken: string,
  sheetId: string,
  headers: string[],
  rows: string[][]
): Promise<void> {
  // Clear existing content
  await fetch(`${SHEETS_BASE}/${sheetId}/values/A1:ZZ10000:clear`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  const values = [headers, ...rows]

  const res = await fetch(
    `${SHEETS_BASE}/${sheetId}/values/A1?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values }),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Failed to write to Google Sheet: ${err}`)
  }
}

export async function createGoogleSheet(accessToken: string, title: string): Promise<string> {
  const res = await fetch(SHEETS_BASE, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ properties: { title } }),
  })

  if (!res.ok) throw new Error('Failed to create Google Sheet')
  const data = await res.json()
  return data.spreadsheetId
}
