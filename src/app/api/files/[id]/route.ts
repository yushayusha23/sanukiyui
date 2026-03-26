import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const MIME_MAP: Record<string, string> = {
  pdf:  'application/pdf',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls:  'application/vnd.ms-excel',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  doc:  'application/msword',
  csv:  'text/csv',
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return new NextResponse('Unauthorized', { status: 401 })

  const doc = await prisma.candidateDocument.findUnique({ where: { id: params.id } })
  if (!doc || !doc.fileData) return new NextResponse('Not found', { status: 404 })

  const mime = MIME_MAP[doc.fileType?.toLowerCase() ?? 'pdf'] ?? 'application/octet-stream'
  const buffer = Buffer.from(doc.fileData, 'base64')

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': mime,
      'Content-Disposition': `inline; filename="${doc.fileName}"`,
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
