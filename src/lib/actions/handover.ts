'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error('Unauthorized')
}

export async function createHandoverNote(formData: FormData) {
  await requireAuth()
  await prisma.handoverNote.create({
    data: {
      title: formData.get('title') as string,
      body: (formData.get('body') as string) || null,
      assignee: (formData.get('assignee') as string) || null,
      status: 'PENDING',
    },
  })
  revalidatePath('/handover')
}

export async function toggleHandoverStatus(id: string, currentStatus: string) {
  await requireAuth()
  await prisma.handoverNote.update({
    where: { id },
    data: { status: currentStatus === 'DONE' ? 'PENDING' : 'DONE' },
  })
  revalidatePath('/handover')
}

export async function deleteHandoverNote(id: string) {
  await requireAuth()
  await prisma.handoverNote.delete({ where: { id } })
  revalidatePath('/handover')
}
