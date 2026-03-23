'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '../prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth'

async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  return session
}

export async function createProject(formData: FormData) {
  await requireAuth()
  const data = extractProjectData(formData)

  const project = await prisma.project.create({ data })

  revalidatePath('/projects')
  redirect(`/projects/${project.id}`)
}

export async function updateProject(id: string, formData: FormData) {
  await requireAuth()
  const data = extractProjectData(formData)

  await prisma.project.update({ where: { id }, data })

  revalidatePath(`/projects/${id}`)
  revalidatePath('/projects')
  redirect(`/projects/${id}`)
}

export async function deleteProject(id: string) {
  await requireAuth()
  await prisma.project.delete({ where: { id } })
  revalidatePath('/projects')
  redirect('/projects')
}

function extractProjectData(formData: FormData) {
  const getString = (key: string) => {
    const val = formData.get(key)
    return typeof val === 'string' && val.trim() ? val.trim() : null
  }
  const getInt = (key: string) => {
    const val = formData.get(key)
    if (!val || val === '') return null
    const n = parseInt(String(val), 10)
    return isNaN(n) ? null : n
  }

  return {
    title: getString('title') || '',
    clientName: getString('clientName'),
    sourceClientName: getString('sourceClientName'),
    description: getString('description'),
    requiredSkills: getString('requiredSkills'),
    workStyle: getString('workStyle'),
    workHours: getString('workHours'),
    desiredRate: getInt('desiredRate'),
    minimumRate: getInt('minimumRate'),
    workConditions: getString('workConditions'),
    recruitmentStatus: getString('recruitmentStatus'),
    status: getString('status') || 'RECRUITING',
  }
}
