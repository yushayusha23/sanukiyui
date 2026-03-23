import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')
  const status = searchParams.get('status')

  const candidates = await prisma.candidate.findMany({
    where: {
      ...(q ? {
        OR: [
          { name: { contains: q } },
          { address: { contains: q } },
        ],
      } : {}),
      ...(status ? { status } : {}),
    },
    include: { skillDetails: true },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json(candidates)
}
