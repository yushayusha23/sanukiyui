import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

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

  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'PDFファイルのみアップロード可能です' }, { status: 400 })
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'ファイルサイズは10MB以下にしてください' }, { status: 400 })
  }

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', candidateId)
  await mkdir(uploadDir, { recursive: true })

  const fileName = `${Date.now()}_${file.name}`
  const filePath = path.join(uploadDir, fileName)
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(filePath, buffer)

  const doc = await prisma.candidateDocument.create({
    data: {
      candidateId,
      fileName: file.name,
      filePath: `/uploads/${candidateId}/${fileName}`,
      fileType: 'pdf',
    },
  })

  return NextResponse.json({ success: true, document: doc })
}
