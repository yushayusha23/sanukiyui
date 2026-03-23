'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error('Unauthorized')
}

export async function createClient(formData: FormData) {
  await requireAuth()
  await prisma.client.create({
    data: {
      name: formData.get('name') as string,
      codeName: (formData.get('codeName') as string) || null,
      type: (formData.get('type') as string) || 'BOTH',
      caution: formData.get('caution') === 'on',
      cautionNote: (formData.get('cautionNote') as string) || null,
      memo: (formData.get('memo') as string) || null,
    },
  })
  revalidatePath('/clients')
  redirect('/clients')
}

export async function updateClient(id: string, formData: FormData) {
  await requireAuth()
  await prisma.client.update({
    where: { id },
    data: {
      name: formData.get('name') as string,
      codeName: (formData.get('codeName') as string) || null,
      type: (formData.get('type') as string) || 'BOTH',
      caution: formData.get('caution') === 'on',
      cautionNote: (formData.get('cautionNote') as string) || null,
      memo: (formData.get('memo') as string) || null,
    },
  })
  revalidatePath('/clients')
  redirect('/clients')
}

export async function deleteClient(id: string) {
  await requireAuth()
  await prisma.client.delete({ where: { id } })
  revalidatePath('/clients')
}
