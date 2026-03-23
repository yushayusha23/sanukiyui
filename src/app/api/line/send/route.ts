/**
 * LINE メッセージ送信 API
 * POST /api/line/send
 * Body: { candidateId: string, message: string }
 *
 * 求職者のLINE IDにメッセージを送信し、連絡履歴に自動記録します。
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendLineTextMessage, isLineConfigured } from '@/lib/line'

export async function POST(req: NextRequest) {
  // 認証チェック
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  // LINE設定チェック
  if (!isLineConfigured()) {
    return NextResponse.json(
      { error: 'LINE連携が設定されていません。.env に LINE_CHANNEL_ACCESS_TOKEN と LINE_CHANNEL_SECRET を設定してください。' },
      { status: 503 }
    )
  }

  const body = await req.json()
  const { candidateId, message } = body as { candidateId?: string; message?: string }

  if (!candidateId || !message?.trim()) {
    return NextResponse.json(
      { error: 'candidateId と message は必須です' },
      { status: 400 }
    )
  }

  // 求職者取得
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    select: { id: true, name: true, lineUserId: true },
  })

  if (!candidate) {
    return NextResponse.json({ error: '求職者が見つかりません' }, { status: 404 })
  }

  if (!candidate.lineUserId) {
    return NextResponse.json(
      { error: `${candidate.name} の LINE ID が未設定です。求職者編集画面で設定してください。` },
      { status: 400 }
    )
  }

  // LINE送信
  try {
    await sendLineTextMessage(candidate.lineUserId, message.trim())
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'LINE送信エラー'
    console.error('[LINE Send]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  // 連絡履歴に自動記録
  const comm = await prisma.communication.create({
    data: {
      candidateId,
      type: 'LINE',
      contactedAt: new Date(),
      memo: `[LINE送信] ${message.trim()}`,
      replied: false,
    },
  })

  return NextResponse.json({
    success: true,
    communicationId: comm.id,
    message: `${candidate.name} にLINEを送信しました`,
  })
}
