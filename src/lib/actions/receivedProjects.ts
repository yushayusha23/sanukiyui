'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '../prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth'

async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
}

export async function addReceivedProject(formData: FormData) {
  await requireAuth()

  const projectId  = String(formData.get('projectId')  || '')
  const sourceName = String(formData.get('sourceName') || '').trim()
  const title      = String(formData.get('title')      || '').trim() || null
  const description = String(formData.get('description') || '').trim() || null
  const memo       = String(formData.get('memo')       || '').trim() || null
  const receivedAt = String(formData.get('receivedAt') || '')

  if (!projectId || !sourceName) return

  await prisma.receivedProject.create({
    data: {
      projectId,
      sourceName,
      title,
      description,
      memo,
      receivedAt: receivedAt ? new Date(receivedAt) : new Date(),
    },
  })

  revalidatePath(`/projects/${projectId}`)
}

export async function deleteReceivedProject(formData: FormData) {
  await requireAuth()

  const id        = String(formData.get('id')        || '')
  const projectId = String(formData.get('projectId') || '')

  if (!id) return

  await prisma.receivedProject.delete({ where: { id } })
  revalidatePath(`/projects/${projectId}`)
}
