import { prisma } from '@/lib/prisma'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { formatDate, formatRate } from '@/lib/utils'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { PROJECT_STATUS } from '@/types'
import { ProjectListClient } from '@/components/projects/ProjectListClient'

interface SearchParams {
  q?: string
  status?: string
}

async function getProjects(params: SearchParams) {
  const where: Record<string, unknown> = {}

  if (params.q) {
    const words = params.q.trim().split(/\s+/).filter(Boolean)
    where.AND = words.map((word) => ({
      OR: [
        { title: { contains: word } },
        { clientName: { contains: word } },
        { requiredSkills: { contains: word } },
        { description: { contains: word } },
        { workConditions: { contains: word } },
      ],
    }))
  }

  if (params.status) {
    where.status = params.status
  }

  return prisma.project.findMany({
    where,
    include: {
      _count: { select: { interviews: true, matches: true } },
      receivedProjects: { orderBy: { receivedAt: 'desc' } },
    },
    orderBy: { updatedAt: 'desc' },
  })
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const projects = await getProjects(searchParams)

  return (
    <DashboardShell title="案件管理">
      <div className="space-y-4">
        {/* ヘッダー操作バー */}
        <div className="flex flex-col sm:flex-row gap-3">
          <form className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                name="q"
                defaultValue={searchParams.q}
                placeholder="案件名・クライアント・スキルで検索..."
                className="form-input pl-9"
              />
            </div>
            <select name="status" defaultValue={searchParams.status ?? ''} className="form-select w-auto">
              <option value="">全ステータス</option>
              {Object.entries(PROJECT_STATUS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <button type="submit" className="btn-secondary">絞込</button>
          </form>
          <Link href="/projects/new" className="btn-primary whitespace-nowrap">
            <Plus className="w-4 h-4" />
            新規登録
          </Link>
        </div>

        <p className="text-sm text-gray-500">{projects.length}件</p>

        <ProjectListClient projects={projects} />
      </div>
    </DashboardShell>
  )
}
