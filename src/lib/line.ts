/**
 * LINE Messaging API ユーティリティ
 * 公式ドキュメント: https://developers.line.biz/ja/docs/messaging-api/
 */
import crypto from 'crypto'

const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET ?? ''
const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN ?? ''

/** LINE設定済みかどうか */
export function isLineConfigured(): boolean {
  return !!(CHANNEL_SECRET && CHANNEL_ACCESS_TOKEN)
}

/**
 * Webhookの署名検証 (HMAC-SHA256)
 * X-Line-Signature ヘッダーと body を照合
 */
export function verifyLineSignature(rawBody: string, signature: string): boolean {
  if (!CHANNEL_SECRET) return false
  const hash = crypto
    .createHmac('SHA256', CHANNEL_SECRET)
    .update(rawBody)
    .digest('base64')
  return hash === signature
}

/**
 * 1対1でテキストメッセージを送信 (Push Message)
 */
export async function sendLineTextMessage(
  lineUserId: string,
  text: string
): Promise<void> {
  if (!CHANNEL_ACCESS_TOKEN) {
    throw new Error('LINE_CHANNEL_ACCESS_TOKEN が設定されていません')
  }

  const res = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      to: lineUserId,
      messages: [{ type: 'text', text }],
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`LINE API エラー (${res.status}): ${body}`)
  }
}

/**
 * Replyトークンで返信 (Reply Message)
 * Webhookイベントの replyToken を使って返信する
 */
export async function replyLineMessage(
  replyToken: string,
  text: string
): Promise<void> {
  if (!CHANNEL_ACCESS_TOKEN) {
    throw new Error('LINE_CHANNEL_ACCESS_TOKEN が設定されていません')
  }

  const res = await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: 'text', text }],
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`LINE Reply API エラー (${res.status}): ${body}`)
  }
}

// ---- LINE Webhook イベント型定義 ----

export interface LineSource {
  type: 'user' | 'group' | 'room'
  userId: string
  groupId?: string
  roomId?: string
}

export interface LineTextMessage {
  type: 'text'
  id: string
  text: string
}

export interface LineEvent {
  type: 'message' | 'follow' | 'unfollow' | 'join' | 'leave' | 'postback'
  mode: 'active' | 'standby'
  timestamp: number
  source: LineSource
  replyToken?: string
  message?: LineTextMessage | { type: string; id: string }
}

export interface LineWebhookBody {
  destination: string
  events: LineEvent[]
}
