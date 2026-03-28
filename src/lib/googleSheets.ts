import { google } from 'googleapis'

const SPREADSHEET_ID = (process.env.GOOGLE_SHEETS_SPREADSHEET_ID ?? '').trim()
const SHEET_GID = (process.env.GOOGLE_SHEETS_GID ?? '0').trim()

function getAuth() {
  // JSON全体を環境変数から取得（最も確実な方法）
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (serviceAccountJson) {
    const creds = JSON.parse(serviceAccountJson)
    return new google.auth.GoogleAuth({
      credentials: creds,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })
  }

  // フォールバック: B64エンコード版
  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_B64
  const privateKey = b64
    ? Buffer.from(b64, 'base64').toString('utf-8')
    : (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ?? '').replace(/\\n/g, '\n')

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}

export async function getSheetName(): Promise<string> {
  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID })
  const targetGid = parseInt(SHEET_GID, 10)
  const found = meta.data.sheets?.find(
    s => s.properties?.sheetId === targetGid
  )
  return found?.properties?.title ?? meta.data.sheets?.[0]?.properties?.title ?? 'Sheet1'
}

// スプレッドシートのヘッダー確認＆初期化
export async function ensureHeaders(sheetName: string) {
  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A1:D1`,
  })
  const row = res.data.values?.[0] ?? []
  if (row[0] !== '案件名') {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1:D1`,
      valueInputOption: 'RAW',
      requestBody: { values: [['案件名', '案件内容', 'ID', '最終更新']] },
    })
  }
}

// アプリ → スプレッドシート（1件）
export async function upsertProjectToSheet(project: {
  id: string
  title: string
  description?: string | null
}) {
  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })
  const sheetName = await getSheetName()
  await ensureHeaders(sheetName)

  // 既存行を検索（C列 = ID）
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!C:C`,
  })
  const ids = res.data.values ?? []
  const rowIndex = ids.findIndex(r => r[0] === project.id)

  const values = [[
    project.title,
    project.description ?? '',
    project.id,
    new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
  ]]

  if (rowIndex >= 1) {
    // 既存行を更新（rowIndex は 0始まり、シートは 1始まり）
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A${rowIndex + 1}:D${rowIndex + 1}`,
      valueInputOption: 'RAW',
      requestBody: { values },
    })
  } else {
    // 新規行を追加
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:D`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values },
    })
  }
}

// スプレッドシート → アプリ（全件読み込み）
export async function readProjectsFromSheet(): Promise<{
  id: string | null
  title: string
  description: string
}[]> {
  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })
  const sheetName = await getSheetName()

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A2:D`,  // 2行目以降（1行目はヘッダー）
  })

  return (res.data.values ?? [])
    .filter(row => row[0])  // 案件名が空の行はスキップ
    .map(row => ({
      title: String(row[0] ?? ''),
      description: String(row[1] ?? ''),
      id: row[2] ? String(row[2]) : null,
    }))
}

// スプレッドシートにIDを書き戻す（新規作成後）
export async function writeIdToSheet(sheetName: string, rowIndex: number, id: string) {
  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!C${rowIndex}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[id]] },
  })
}
