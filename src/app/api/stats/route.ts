import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // ?month=YYYY-MM
  const monthParam = req.nextUrl.searchParams.get('month')
  let monthStart: Date
  let monthEnd: Date

  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split('-').map(Number)
    monthStart = new Date(y, m - 1, 1)
    monthEnd = new Date(y, m, 1)
  } else {
    const now = new Date()
    monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  }

  const [
    candidates,
    projects,
    interviews,
    passed,
    failed,
    proposals,
    applications,
  ] = await Promise.all([
    prisma.candidate.count({ where: { createdAt: { gte: monthStart, lt: monthEnd } } }),
    prisma.project.count({ where: { createdAt: { gte: monthStart, lt: monthEnd } } }),
    prisma.interview.count({ where: { interviewDateTime: { gte: monthStart, lt: monthEnd } } }),
    prisma.interview.count({ where: { interviewDateTime: { gte: monthStart, lt: monthEnd }, result: 'PASSED' } }),
    prisma.interview.count({ where: { interviewDateTime: { gte: monthStart, lt: monthEnd }, result: 'FAILED' } }),
    prisma.match.count({ where: { createdAt: { gte: monthStart, lt: monthEnd }, status: { in: ['SUGGESTED', 'ACCEPTED'] } } }),
    prisma.match.count({ where: { createdAt: { gte: monthStart, lt: monthEnd }, status: 'ACCEPTED' } }),
  ])

  return NextResponse.json({
    candidates,
    projects,
    interviews,
    passed,
    failed,
    proposals,
    applications,
  })
}
