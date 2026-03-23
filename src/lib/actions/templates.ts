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

export async function createTemplate(formData: FormData) {
  await requireAuth()

  const title    = String(formData.get('title')    || '')
  const category = String(formData.get('category') || 'OTHER')
  const body     = String(formData.get('body')     || '')
  const memo     = String(formData.get('memo')     || '') || null

  if (!title || !body) return

  await prisma.template.create({ data: { title, category, body, memo } })

  revalidatePath('/templates')
  redirect('/templates')
}

export async function updateTemplate(id: string, formData: FormData) {
  await requireAuth()

  const title    = String(formData.get('title')    || '')
  const category = String(formData.get('category') || 'OTHER')
  const body     = String(formData.get('body')     || '')
  const memo     = String(formData.get('memo')     || '') || null

  if (!title || !body) return

  await prisma.template.update({ where: { id }, data: { title, category, body, memo } })

  revalidatePath('/templates')
  redirect('/templates')
}

export async function deleteTemplate(id: string) {
  await requireAuth()
  await prisma.template.delete({ where: { id } })
  revalidatePath('/templates')
}
