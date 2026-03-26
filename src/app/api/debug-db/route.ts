import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const result = await prisma.candidate.findMany({
      take: 1,
      include: { skillDetails: true, documents: { take: 1 } },
    })
    return NextResponse.json({ ok: true, count: result.length })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
