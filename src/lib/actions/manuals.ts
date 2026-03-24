'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createManual(formData: FormData) {
  const title = formData.get('title') as string
  const folder = (formData.get('folder') as string) || '一般'
  const content = formData.get('content') as string
  const memo = formData.get('memo') as string

  if (!title?.trim()) return

  await prisma.manual.create({
    data: {
      title: title.trim(),
      folder: folder.trim() || '一般',
      content: content || null,
      memo: memo || null,
    },
  })

  revalidatePath('/manuals')
}

export async function updateManual(id: string, formData: FormData) {
  const title = formData.get('title') as string
  const folder = (formData.get('folder') as string) || '一般'
  const content = formData.get('content') as string
  const memo = formData.get('memo') as string

  await prisma.manual.update({
    where: { id },
    data: {
      title: title.trim(),
      folder: folder.trim() || '一般',
      content: content || null,
      memo: memo || null,
    },
  })

  revalidatePath('/manuals')
}

export async function deleteManual(id: string) {
  await prisma.manual.delete({ where: { id } })
  revalidatePath('/manuals')
}
