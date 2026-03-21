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

/** Read all data from a sheet. Returns headers (row 1) and data rows (rows 2+). */
export async function readFromSheet(
  accessToken: string,
  sheetId: string
): Promise<{ headers: string[]; rows: string[][] }> {
  const res = await fetch(
    `${SHEETS_BASE}/${sheetId}/values/A1:ZZ10000`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Failed to read Google Sheet: ${err}`)
  }

  const data = await res.json()
  const values: string[][] = data.values || []

  if (values.length === 0) return { headers: [], rows: [] }

  const headers = values[0].map(h => String(h ?? ''))
  const rows = values.slice(1).map(row => {
    // Pad short rows to match header length
    const padded = [...row]
    while (padded.length < headers.length) padded.push('')
    return padded.map(v => String(v ?? ''))
  })

  return { headers, rows }
}

/**
 * Update a specific row in a sheet (1-based row index, row 1 = header).
 * Values length must match headers length.
 */
export async function updateSheetRow(
  accessToken: string,
  sheetId: string,
  rowIndex: number,
  values: string[]
): Promise<void> {
  const range = `A${rowIndex}`
  const res = await fetch(
    `${SHEETS_BASE}/${sheetId}/values/${range}?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [values] }),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Failed to update sheet row ${rowIndex}: ${err}`)
  }
}

/**
 * Append rows to the sheet after the last row with data.
 * Returns the 1-based row index of the first appended row.
 */
export async function appendSheetRows(
  accessToken: string,
  sheetId: string,
  rows: string[][]
): Promise<number> {
  const res = await fetch(
    `${SHEETS_BASE}/${sheetId}/values/A1:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: rows }),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Failed to append sheet rows: ${err}`)
  }

  const data = await res.json()
  // updatedRange looks like "Sheet1!A5:G6" — extract start row
  const updatedRange: string = data.updates?.updatedRange || ''
  const match = updatedRange.match(/[A-Z]+(\d+)/)
  return match ? parseInt(match[1], 10) : -1
}
