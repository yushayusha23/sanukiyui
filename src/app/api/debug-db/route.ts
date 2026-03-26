import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const results: Record<string, unknown> = {}
  
  try {
    results.candidateCount = await prisma.candidate.count()
  } catch (e) { results.candidateCountError = String(e) }

  try {
    const c = await prisma.candidate.findFirst({
      include: {
        skillDetails: true,
        client: { select: { name: true, codeName: true } },
        documents: { select: { id: true, fileName: true, filePath: true }, take: 1 },
      },
    })
    results.candidateQuery = c ? 'ok' : 'empty'
    results.hasActionStatus = c ? ('actionStatus' in c) : null
    results.skillKeys = c?.skillDetails ? Object.keys(c.skillDetails) : null
  } catch (e) { results.candidateQueryError = String(e) }

  try {
    await prisma.stickyNote.findFirst()
    results.stickyNote = 'ok'
  } catch (e) { results.stickyNoteError = String(e) }

  return NextResponse.json(results)
}
