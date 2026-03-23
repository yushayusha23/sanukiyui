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

export async function createCommunication(formData: FormData) {
  await requireAuth()

  const candidateId = String(formData.get('candidateId') || '')
  const type = String(formData.get('type') || 'PHONE')
  const contactedAt = new Date(String(formData.get('contactedAt') || new Date().toISOString()))
  const memo = String(formData.get('memo') || '') || null
  const replied = formData.get('replied') === 'true'
  const nextContactDateRaw = formData.get('nextContactDate')
  const nextContactDate =
    nextContactDateRaw && String(nextContactDateRaw).trim()
      ? new Date(String(nextContactDateRaw))
      : null

  await prisma.communication.create({
    data: {
      candidateId,
      type,
      contactedAt,
      memo,
      replied,
      nextContactDate,
    },
  })

  revalidatePath('/communications')
  revalidatePath(`/candidates/${candidateId}`)

  const redirectTo = String(formData.get('redirectTo') || '/communications')
  redirect(redirectTo)
}

export async function updateCommunication(id: string, formData: FormData) {
  await requireAuth()

  const type = String(formData.get('type') || 'PHONE')
  const contactedAt = new Date(String(formData.get('contactedAt') || ''))
  const memo = String(formData.get('memo') || '') || null
  const replied = formData.get('replied') === 'true'
  const nextContactDateRaw = formData.get('nextContactDate')
  const nextContactDate =
    nextContactDateRaw && String(nextContactDateRaw).trim()
      ? new Date(String(nextContactDateRaw))
      : null

  const comm = await prisma.communication.update({
    where: { id },
    data: { type, contactedAt, memo, replied, nextContactDate },
  })

  revalidatePath('/communications')
  revalidatePath(`/candidates/${comm.candidateId}`)
  redirect('/communications')
}

export async function deleteCommunication(id: string, candidateId: string) {
  await requireAuth()
  await prisma.communication.delete({ where: { id } })
  revalidatePath('/communications')
  revalidatePath(`/candidates/${candidateId}`)
}
