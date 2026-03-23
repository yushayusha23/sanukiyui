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

/** 案件を求職者に紐付け（なければ作成、あれば更新） */
export async function upsertMatch(formData: FormData) {
  await requireAuth()

  const candidateId = String(formData.get('candidateId') ?? '')
  const projectId = String(formData.get('projectId') ?? '')
  const status = String(formData.get('status') ?? 'SUGGESTED')

  if (!candidateId || !projectId) return

  await prisma.match.upsert({
    where: { candidateId_projectId: { candidateId, projectId } },
    update: { status },
    create: { candidateId, projectId, status, score: 0 },
  })

  revalidatePath(`/candidates/${candidateId}`)
}

/** マッチのステータスを更新 */
export async function updateMatchStatus(formData: FormData) {
  await requireAuth()

  const matchId = String(formData.get('matchId') ?? '')
  const status = String(formData.get('status') ?? '')
  const candidateId = String(formData.get('candidateId') ?? '')

  if (!matchId || !status) return

  await prisma.match.update({
    where: { id: matchId },
    data: { status },
  })

  revalidatePath(`/candidates/${candidateId}`)
}

/** マッチを削除 */
export async function deleteMatch(formData: FormData) {
  await requireAuth()

  const matchId = String(formData.get('matchId') ?? '')
  const candidateId = String(formData.get('candidateId') ?? '')

  if (!matchId) return

  await prisma.match.delete({ where: { id: matchId } })

  revalidatePath(`/candidates/${candidateId}`)
}
