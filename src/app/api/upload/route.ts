import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File
  const candidateId = formData.get('candidateId') as string

  if (!file || !candidateId) {
    return NextResponse.json({ error: 'ファイルまたは求職者IDが必要です' }, { status: 400 })
  }

  const name = file.name.toLowerCase()
  const supported = name.endsWith('.pdf') || name.endsWith('.xlsx') || name.endsWith('.xls') ||
    name.endsWith('.docx') || name.endsWith('.doc') || name.endsWith('.csv')
  if (!supported) {
    return NextResponse.json({ error: 'PDF / Excel / Word / CSV のみアップロード可能です' }, { status: 400 })
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'ファイルサイズは10MB以下にしてください' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const base64 = buffer.toString('base64')

  const doc = await prisma.candidateDocument.create({
    data: {
      candidateId,
      fileName: file.name,
      filePath: '',          // あとで id 確定後に更新
      fileData: base64,
      fileType: file.name.split('.').pop() ?? 'pdf',
    },
  })

  // filePathにAPIルートのURLをセット
  const updatedDoc = await prisma.candidateDocument.update({
    where: { id: doc.id },
    data: { filePath: `/api/files/${doc.id}` },
  })

  return NextResponse.json({ success: true, document: updatedDoc })
}
