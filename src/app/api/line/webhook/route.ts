/**
 * LINE Messaging API Webhook エンドポイント
 *
 * LINEプラットフォームからのイベントを受信し、以下を処理します:
 * - テキストメッセージ受信 → 求職者の連絡履歴に自動登録
 * - フォロー (友達追加) → lineUserId をログ出力 (管理者が手動紐付け)
 * - アンフォロー → ログ出力
 *
 * Webhook URL: https://your-domain/api/line/webhook
 * LINEコンソールで設定してください。
 */
import { NextRequest, NextResponse } from 'next/server'
import {
  verifyLineSignature,
  isLineConfigured,
  LineWebhookBody,
  LineEvent,
} from '@/lib/line'
import { prisma } from '@/lib/prisma'

/** LINE の疎通確認 GET */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    configured: isLineConfigured(),
    message: 'LINE Webhook エンドポイント',
  })
}

/** LINE からの Webhook POST */
export async function POST(req: NextRequest) {
  // 署名検証
  const signature = req.headers.get('x-line-signature')
  if (!signature) {
    return NextResponse.json(
      { error: 'X-Line-Signature ヘッダーがありません' },
      { status: 401 }
    )
  }

  const rawBody = await req.text()

  if (isLineConfigured() && !verifyLineSignature(rawBody, signature)) {
    console.error('[LINE Webhook] 署名検証失敗')
    return NextResponse.json({ error: '署名が不正です' }, { status: 401 })
  }

  let body: LineWebhookBody
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'JSON パースエラー' }, { status: 400 })
  }

  // 各イベントを処理
  for (const event of body.events) {
    try {
      await handleLineEvent(event)
    } catch (err) {
      console.error('[LINE Webhook] イベント処理エラー:', err)
    }
  }

  // LINEは200を期待する
  return NextResponse.json({ status: 'ok' })
}

async function handleLineEvent(event: LineEvent) {
  const lineUserId = event.source.userId

  switch (event.type) {
    case 'message': {
      if (!event.message || event.message.type !== 'text') break
      const text = (event.message as { type: string; text?: string }).text ?? ''

      console.log(`[LINE] メッセージ受信 userId=${lineUserId} text="${text}"`)

      // lineUserId で求職者を検索
      const candidate = await prisma.candidate.findFirst({
        where: { lineUserId },
        select: { id: true, name: true },
      })

      if (candidate) {
        // 連絡履歴に自動登録
        await prisma.communication.create({
          data: {
            candidateId: candidate.id,
            type: 'LINE',
            contactedAt: new Date(event.timestamp),
            memo: `[LINE受信] ${text}`,
            replied: false,
          },
        })
        console.log(`[LINE] 連絡履歴登録: ${candidate.name}`)
      } else {
        // 未紐付けユーザー: ログのみ (管理者が求職者編集画面でLINE IDを手動設定)
        console.warn(
          `[LINE] 未紐付けユーザーからメッセージ: userId=${lineUserId} ` +
          `→ 求職者詳細画面でLINE IDに "${lineUserId}" を設定してください`
        )
      }
      break
    }

    case 'follow': {
      // 友達追加イベント
      console.info(
        `[LINE] フォロー: userId=${lineUserId} ` +
        `→ 求職者編集画面のLINE IDに "${lineUserId}" を設定してください`
      )

      // lineUserId が既に登録済みか確認
      const existing = await prisma.candidate.findFirst({
        where: { lineUserId },
        select: { id: true, name: true },
      })
      if (existing) {
        console.info(`[LINE] 既存求職者: ${existing.name}`)
      }
      break
    }

    case 'unfollow': {
      console.info(`[LINE] アンフォロー: userId=${lineUserId}`)
      break
    }

    default:
      break
  }
}
