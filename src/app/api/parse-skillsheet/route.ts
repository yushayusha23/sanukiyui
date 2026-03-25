/**
 * スキルシート解析API（PDF / Excel / Word 対応）
 * POST /api/parse-skillsheet
 * FormData: { file: File }
 * → Claude APIでテキスト解析 → 人材情報JSONを返す
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 30

/** PDF → テキスト */
async function parsePdf(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfParseModule = await import('pdf-parse') as any
  const pdfParse = pdfParseModule.default ?? pdfParseModule
  const result = await pdfParse(buffer)
  return result.text
}

/** Excel (.xlsx / .xls) → テキスト */
async function parseExcel(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const XLSX = await import('xlsx') as any
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const lines: string[] = []
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    const csv = XLSX.utils.sheet_to_csv(sheet)
    lines.push(`[シート: ${sheetName}]\n${csv}`)
  }
  return lines.join('\n\n')
}

/** Word (.docx) → テキスト */
async function parseWord(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mammoth = await import('mammoth') as any
  const result = await mammoth.extractRawText({ buffer })
  return result.value
}

/** ファイル種別を判定してテキスト抽出 */
async function extractText(buffer: Buffer, filename: string, mimeType: string): Promise<string> {
  const name = filename.toLowerCase()

  // PDF
  if (mimeType === 'application/pdf' || mimeType === 'application/x-pdf' || name.endsWith('.pdf')) {
    return await parsePdf(buffer)
  }
  // Excel / Google Sheets エクスポート
  if (name.endsWith('.xlsx') || name.endsWith('.xls') ||
      mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mimeType === 'application/vnd.ms-excel') {
    return await parseExcel(buffer)
  }
  // CSV（Google Sheetsのエクスポート含む）
  if (name.endsWith('.csv') || mimeType === 'text/csv') {
    return buffer.toString('utf-8')
  }
  // Word / Google Docs エクスポート
  if (name.endsWith('.docx') || name.endsWith('.doc') ||
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword') {
    return await parseWord(buffer)
  }
  // テキストファイル
  if (name.endsWith('.txt') || mimeType === 'text/plain') {
    return buffer.toString('utf-8')
  }
  throw new Error('対応していないファイル形式です（PDF / Excel / Word / CSV に対応）')
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY が設定されていません' },
      { status: 503 }
    )
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'ファイルがありません' }, { status: 400 })

  // テキスト抽出
  const buffer = Buffer.from(await file.arrayBuffer())
  let fileText = ''
  try {
    fileText = await extractText(buffer, file.name, file.type)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'ファイル読み取りに失敗しました'
    console.error('[Parse Error]', e)
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  if (!fileText.trim()) {
    return NextResponse.json({ error: 'ファイルからテキストを取得できませんでした（画像のみのファイルは非対応）' }, { status: 400 })
  }

  // Claude APIで情報抽出
  const client = new Anthropic({ apiKey })

  const prompt = `以下のスキルシート（職務経歴書）から人材情報を抽出してください。

必ずJSON形式のみで返答してください。説明文は不要です。

抽出する項目：
- name: 氏名（文字列）
- age: 年齢（数値、なければnull）
- address: 住所・居住エリア（文字列、なければnull）
- workHistory: 職務経歴の要約（200字以内、文字列）
- isYears: インサイドセールス経験年数（数値、なければnull）
- fsYears: フィールドセールス（FS）経験年数（数値、なければnull）
- saasYears: SaaS経験年数（数値、なければnull）
- desiredHourlyRate: 希望時給（数値、円単位、なければnull）
- availableStartDate: 稼働開始可能日（YYYY-MM-DD形式、なければnull）
- notes: その他特記事項（文字列、なければnull）
- preferredWorkStyle: 希望勤務形態（「フルリモート」「一部出社」「出社」のいずれか、不明ならnull）

スキルシート内容：
${fileText.slice(0, 8000)}`

  const message = await client.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

  // JSONを抽出
  let extracted: Record<string, unknown> = {}
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      extracted = JSON.parse(jsonMatch[0])
    }
  } catch {
    return NextResponse.json({ error: 'AI解析結果の読み取りに失敗しました' }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: extracted })
}
