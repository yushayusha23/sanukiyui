import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const notes = await prisma.stickyNote.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(notes)
  } catch {
    return NextResponse.json({ error: '取得失敗' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { content, color, author } = await req.json()
    if (!content?.trim()) {
      return NextResponse.json({ error: '内容を入力してください' }, { status: 400 })
    }
    const note = await prisma.stickyNote.create({
      data: { content: content.trim(), color: color ?? 'yellow', author: author ?? '' },
    })
    return NextResponse.json(note)
  } catch {
    return NextResponse.json({ error: '作成失敗' }, { status: 500 })
  }
}
