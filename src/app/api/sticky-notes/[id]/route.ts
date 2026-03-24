import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.stickyNote.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: '削除失敗' }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { content } = await req.json()
    const note = await prisma.stickyNote.update({
      where: { id: params.id },
      data: { content },
    })
    return NextResponse.json(note)
  } catch {
    return NextResponse.json({ error: '更新失敗' }, { status: 500 })
  }
}
