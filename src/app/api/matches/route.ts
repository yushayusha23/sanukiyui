import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { matchCandidateToProjects, matchProjectToCandidates } from '@/lib/matching'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const candidateId = searchParams.get('candidateId')
  const projectId = searchParams.get('projectId')

  if (candidateId) {
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: { skillDetails: true },
    })
    if (!candidate) return NextResponse.json({ error: '求職者が見つかりません' }, { status: 404 })

    const projects = await prisma.project.findMany({
      where: { status: { in: ['RECRUITING', 'PROPOSING'] } },
    })

    const matches = matchCandidateToProjects(candidate, projects)
    return NextResponse.json(matches)
  }

  if (projectId) {
    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) return NextResponse.json({ error: '案件が見つかりません' }, { status: 404 })

    const candidates = await prisma.candidate.findMany({
      where: { status: { in: ['REGISTERED', 'SKILLSHEET_RECV', 'INTRODUCING'] } },
      include: { skillDetails: true },
    })

    const matches = matchProjectToCandidates(project, candidates)
    return NextResponse.json(matches)
  }

  return NextResponse.json({ error: 'candidateId または projectId が必要です' }, { status: 400 })
}
