import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { put } from '@vercel/blob'

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

  const blob = await put(`skillsheets/${candidateId}/${Date.now()}_${file.name}`, file, {
    access: 'public',
  })

  const doc = await prisma.candidateDocument.create({
    data: {
      candidateId,
      fileName: file.name,
      filePath: blob.url,
      fileType: file.name.split('.').pop() ?? 'pdf',
    },
  })

  return NextResponse.json({ success: true, document: doc })
}
