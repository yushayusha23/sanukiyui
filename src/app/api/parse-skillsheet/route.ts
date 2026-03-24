/**
 * スキルシートPDF解析API
 * POST /api/parse-skillsheet
 * FormData: { file: File }
 * → Claude APIでテキスト解析 → 人材情報JSONを返す
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 30

async function parsePdf(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfParseModule = await import('pdf-parse') as any
  const pdfParse = pdfParseModule.default ?? pdfParseModule
  const result = await pdfParse(buffer)
  return result.text
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

  // PDFからテキスト抽出
  const buffer = Buffer.from(await file.arrayBuffer())
  let pdfText = ''
  try {
    pdfText = await parsePdf(buffer)
  } catch (e) {
    console.error('[PDF Parse Error]', e)
    return NextResponse.json({ error: 'PDF読み取りに失敗しました' }, { status: 400 })
  }

  if (!pdfText.trim()) {
    return NextResponse.json({ error: 'PDFからテキストを取得できませんでした（画像PDFは非対応）' }, { status: 400 })
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
${pdfText.slice(0, 8000)}`

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
