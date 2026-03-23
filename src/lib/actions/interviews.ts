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

export async function createInterview(formData: FormData) {
  await requireAuth()

  const candidateId = String(formData.get('candidateId') || '')
  const projectId = String(formData.get('projectId') || '') || null
  const interviewDateTime = new Date(String(formData.get('interviewDateTime') || ''))
  const interviewer = String(formData.get('interviewer') || '') || null
  const memo = String(formData.get('memo') || '') || null
  const evaluation = String(formData.get('evaluation') || '') || null
  const result = String(formData.get('result') || 'PENDING')

  await prisma.interview.create({
    data: {
      candidateId,
      projectId,
      interviewDateTime,
      interviewer,
      memo,
      evaluation,
      result,
    },
  })

  revalidatePath('/interviews')
  revalidatePath(`/candidates/${candidateId}`)

  const redirectTo = String(formData.get('redirectTo') || '/interviews')
  redirect(redirectTo)
}

export async function updateInterview(id: string, formData: FormData) {
  await requireAuth()

  const projectId = String(formData.get('projectId') || '') || null
  const interviewDateTime = new Date(String(formData.get('interviewDateTime') || ''))
  const interviewer = String(formData.get('interviewer') || '') || null
  const memo = String(formData.get('memo') || '') || null
  const evaluation = String(formData.get('evaluation') || '') || null
  const result = String(formData.get('result') || 'PENDING')

  const interview = await prisma.interview.update({
    where: { id },
    data: { projectId, interviewDateTime, interviewer, memo, evaluation, result },
  })

  const redirectTo = String(formData.get('redirectTo') || '/interviews')
  revalidatePath('/interviews')
  revalidatePath(`/candidates/${interview.candidateId}`)
  redirect(redirectTo)
}

export async function deleteInterview(id: string, candidateId: string) {
  await requireAuth()
  await prisma.interview.delete({ where: { id } })
  revalidatePath('/interviews')
  revalidatePath(`/candidates/${candidateId}`)
}

/** 候補者詳細ページからインライン登録（リダイレクトなし） */
export async function addInterviewInline(formData: FormData) {
  await requireAuth()

  const candidateId = String(formData.get('candidateId') || '')
  const projectId = String(formData.get('projectId') || '') || null
  const interviewDateTime = new Date(String(formData.get('interviewDateTime') || ''))
  const interviewer = String(formData.get('interviewer') || '') || null
  const memo = String(formData.get('memo') || '') || null
  const evaluation = String(formData.get('evaluation') || '') || null
  const result = String(formData.get('result') || 'PENDING')

  if (!candidateId || isNaN(interviewDateTime.getTime())) return

  await prisma.interview.create({
    data: { candidateId, projectId, interviewDateTime, interviewer, memo, evaluation, result },
  })

  revalidatePath('/interviews')
  revalidatePath(`/candidates/${candidateId}`)
}

/** 候補者詳細ページからインライン削除 */
export async function deleteInterviewInline(formData: FormData) {
  await requireAuth()

  const id = String(formData.get('interviewId') || '')
  const candidateId = String(formData.get('candidateId') || '')

  if (!id) return

  await prisma.interview.delete({ where: { id } })
  revalidatePath('/interviews')
  revalidatePath(`/candidates/${candidateId}`)
}
