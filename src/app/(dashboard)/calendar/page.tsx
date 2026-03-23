import { prisma } from '@/lib/prisma'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { CalendarView } from '@/components/calendar/CalendarView'
import { InterviewReminderBanner } from '@/components/calendar/InterviewReminderBanner'

async function getInterviewsForCalendar() {
  const interviews = await prisma.interview.findMany({
    include: {
      candidate: { select: { id: true, name: true } },
      project: { select: { id: true, title: true } },
    },
    orderBy: { interviewDateTime: 'asc' },
  })

  // シリアライズ可能な形式に変換
  return interviews.map((iv) => ({
    id: iv.id,
    interviewDateTime: iv.interviewDateTime.toISOString(),
    candidateId: iv.candidateId,
    candidateName: iv.candidate.name,
    projectTitle: iv.project?.title ?? null,
    projectId: iv.projectId ?? null,
    interviewer: iv.interviewer ?? null,
    result: iv.result ?? null,
    memo: iv.memo ?? null,
  }))
}

export default async function CalendarPage() {
  const interviews = await getInterviewsForCalendar()

  // 今日の面談
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const todayInterviews = interviews.filter(
    (iv) => iv.interviewDateTime.startsWith(todayStr)
  )

  return (
    <DashboardShell title="面談カレンダー">
      <div className="space-y-4">
        {/* 当日リマインドバナー */}
        <InterviewReminderBanner todayInterviews={todayInterviews} />

        {/* カレンダー本体 */}
        <CalendarView interviews={interviews} />
      </div>
    </DashboardShell>
  )
}
