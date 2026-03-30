import { google } from 'googleapis'

const SPREADSHEET_ID = (process.env.GOOGLE_SHEETS_SPREADSHEET_ID ?? '').trim()
const SHEET_GID = (process.env.GOOGLE_SHEETS_GID ?? '0').trim()

function getAuth() {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (serviceAccountJson) {
    const creds = JSON.parse(serviceAccountJson)
    return new google.auth.GoogleAuth({
      credentials: creds,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })
  }
  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_B64
  const privateKey = b64
    ? Buffer.from(b64, 'base64').toString('utf-8')
    : (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ?? '').replace(/\\n/g, '\n')

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? '').trim(),
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
  const found = meta.data.sheets?.find(s => s.properties?.sheetId === targetGid)
  return found?.properties?.title ?? meta.data.sheets?.[0]?.properties?.title ?? 'Sheet1'
}

// 列インデックス（0始まり）→ A, B, C... 形式に変換
function colLetter(index: number): string {
  let letter = ''
  let n = index
  do {
    letter = String.fromCharCode(65 + (n % 26)) + letter
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return letter
}

// 全案件の列データを読み込む（列ごと: row1=日付, row2=案件名, row3=案件詳細, row4=AppID）
async function readAllColumns(sheetName: string) {
  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${sheetName}'!A1:ZZ4`,
    majorDimension: 'COLUMNS', // 列ごとに読み込む
  })
  return res.data.values ?? []
}

// グリッドを必要なサイズに拡張
async function expandGrid(sheetId: number, needRows: number, needCols: number) {
  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID })
  const sheet = meta.data.sheets?.find(s => s.properties?.sheetId === sheetId)
  const currentRows = sheet?.properties?.gridProperties?.rowCount ?? 0
  const currentCols = sheet?.properties?.gridProperties?.columnCount ?? 0

  const requests = []
  if (needRows > currentRows) {
    requests.push({ appendDimension: { sheetId, dimension: 'ROWS', length: needRows - currentRows } })
  }
  if (needCols > currentCols) {
    requests.push({ appendDimension: { sheetId, dimension: 'COLUMNS', length: needCols - currentCols } })
  }
  if (requests.length > 0) {
    await sheets.spreadsheets.batchUpdate({ spreadsheetId: SPREADSHEET_ID, requestBody: { requests } })
  }
}

// アプリ → スプレッドシート（1件追加/更新）
export async function upsertProjectToSheet(project: {
  id: string
  title: string
  description?: string | null
}) {
  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })
  const sheetName = await getSheetName()
  const sheetGid = parseInt(SHEET_GID, 10)

  // 全列を読んでIDが一致する列を探す（row4 = AppID）
  const columns = await readAllColumns(sheetName)

  // 列インデックス（A=0）からIDを検索（row4 = index 3）
  let targetColIndex = -1
  for (let i = 1; i < columns.length; i++) {
    const col = columns[i] ?? []
    if (col[3] === project.id) {
      targetColIndex = i
      break
    }
  }

  const date = new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' })

  if (targetColIndex >= 0) {
    // 既存列を更新（行1=日付, 行2=案件名, 行3=案件詳細）
    const col = colLetter(targetColIndex)
    await expandGrid(sheetGid, 4, targetColIndex + 1)
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        valueInputOption: 'RAW',
        data: [
          { range: `'${sheetName}'!${col}1`, values: [[date]] },
          { range: `'${sheetName}'!${col}2`, values: [[project.title]] },
          { range: `'${sheetName}'!${col}3`, values: [[project.description ?? '']] },
        ],
      },
    })
  } else {
    // C列（インデックス2）に新しい列を挿入（既存データは右にシフト）
    const insertColIndex = 2 // C列
    await expandGrid(sheetGid, 4, insertColIndex + 1)

    // C列に新しい列を挿入
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{
          insertDimension: {
            range: { sheetId: sheetGid, dimension: 'COLUMNS', startIndex: insertColIndex, endIndex: insertColIndex + 1 },
            inheritFromBefore: false,
          }
        }]
      }
    })

    const col = colLetter(insertColIndex)
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        valueInputOption: 'RAW',
        data: [
          { range: `'${sheetName}'!${col}1`, values: [[date]] },
          { range: `'${sheetName}'!${col}2`, values: [[project.title]] },
          { range: `'${sheetName}'!${col}3`, values: [[project.description ?? '']] },
          { range: `'${sheetName}'!${col}4`, values: [[project.id]] },
        ],
      },
    })
  }
}

// スプレッドシート → アプリ（全件読み込み）
export async function readProjectsFromSheet(): Promise<{
  id: string | null
  title: string
  description: string
}[]> {
  const sheetName = await getSheetName()
  const columns = await readAllColumns(sheetName)

  const results: { id: string | null; title: string; description: string }[] = []

  // 列Aはラベル列なのでスキップ、B列（インデックス1）以降を処理
  for (let i = 1; i < columns.length; i++) {
    const col = columns[i] ?? []
    const title = String(col[1] ?? '').trim()   // row2 = 案件名
    if (!title) continue

    const description = String(col[2] ?? '').trim() // row3 = 案件詳細
    const appId = col[3] ? String(col[3]).trim() : null // row4 = AppID

    results.push({ id: appId, title, description })
  }

  return results
}

// スプレッドシートの特定列にIDを書き込む（新規作成後）
export async function writeIdToSheetColumn(colIndex: number, id: string) {
  const sheetName = await getSheetName()
  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })
  const col = colLetter(colIndex)

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${sheetName}'!${col}4`,
    valueInputOption: 'RAW',
    requestBody: { values: [[id]] },
  })
}
