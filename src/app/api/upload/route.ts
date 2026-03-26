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

  let filePath: string

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    // 本番: Vercel Blob
    const { put } = await import('@vercel/blob')
    const blob = await put(`skillsheets/${candidateId}/${Date.now()}_${file.name}`, file, {
      access: 'public',
    })
    filePath = blob.url
  } else {
    // ローカル開発: ファイルシステム
    const { writeFile, mkdir } = await import('fs/promises')
    const path = await import('path')
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', candidateId)
    await mkdir(uploadDir, { recursive: true })
    const fileName = `${Date.now()}_${file.name}`
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(path.join(uploadDir, fileName), buffer)
    filePath = `/uploads/${candidateId}/${fileName}`
  }

  const doc = await prisma.candidateDocument.create({
    data: {
      candidateId,
      fileName: file.name,
      filePath,
      fileType: file.name.split('.').pop() ?? 'pdf',
    },
  })

  return NextResponse.json({ success: true, document: doc })
}
