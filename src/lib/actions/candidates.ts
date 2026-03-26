'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '../prisma'
import { parseNotes, type NoteEntry } from '../notes'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth'

async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  return session
}

export async function createCandidate(formData: FormData) {
  await requireAuth()

  const data = extractCandidateData(formData)

  const candidate = await prisma.candidate.create({
    data: {
      name: data.name,
      age: data.age,
      company: data.company,
      address: data.address,
      preferredWorkStyle: data.preferredWorkStyle,
      preferredWorkHours: data.preferredWorkHours,
      desiredHourlyRate: data.desiredHourlyRate,
      minimumHourlyRate: data.minimumHourlyRate,
      workHistory: data.workHistory,
      availableStartDate: data.availableStartDate,
      confirmedInterviewDate: data.confirmedInterviewDate,
      status: data.status || 'APPLIED',
      actionStatus: data.actionStatus,
      notes: data.notes,
      lineUserId: data.lineUserId,
      clientId: data.clientId || null,
    },
  })

  await prisma.candidateSkillDetail.create({
    data: {
      candidateId: candidate.id,
      isYears: data.isYears,
      ifYears: data.ifYears,
      saasYears: data.saasYears,
      toBYears: data.toBYears,
      toCYears: data.toCYears,
      customExperiences: data.customExperiences,
      otherBpoExperience: data.otherBpoExperience,
      tools: data.tools,
      strengths: data.strengths,
      freeSkillNote: data.freeSkillNote,
    },
  })

  // 手動添付ファイルがあれば保存
  const skillSheetFile = formData.get('skillSheetFile') as File | null
  if (skillSheetFile && skillSheetFile.size > 0) {
    try {
      let filePath: string
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        const { put } = await import('@vercel/blob')
        const blob = await put(`skillsheets/${candidate.id}/${Date.now()}_${skillSheetFile.name}`, skillSheetFile, { access: 'public' })
        filePath = blob.url
      } else {
        const { writeFile, mkdir } = await import('fs/promises')
        const path = await import('path')
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', candidate.id)
        await mkdir(uploadDir, { recursive: true })
        const bytes = await skillSheetFile.arrayBuffer()
        const localPath = path.join(uploadDir, skillSheetFile.name)
        await writeFile(localPath, Buffer.from(bytes))
        filePath = `/uploads/${candidate.id}/${skillSheetFile.name}`
      }
      await prisma.candidateDocument.create({
        data: {
          candidateId: candidate.id,
          fileName: skillSheetFile.name,
          filePath,
          fileType: skillSheetFile.name.split('.').pop() || 'pdf',
        },
      })
    } catch (e) {
      console.error('[File Upload Error]', e)
    }
  }

  revalidatePath('/candidates')
  redirect(`/candidates/${candidate.id}`)
}

export async function updateCandidate(id: string, formData: FormData) {
  await requireAuth()

  const data = extractCandidateData(formData)

  await prisma.candidate.update({
    where: { id },
    data: {
      name: data.name,
      age: data.age,
      company: data.company,
      address: data.address,
      preferredWorkStyle: data.preferredWorkStyle,
      preferredWorkHours: data.preferredWorkHours,
      desiredHourlyRate: data.desiredHourlyRate,
      minimumHourlyRate: data.minimumHourlyRate,
      workHistory: data.workHistory,
      availableStartDate: data.availableStartDate,
      confirmedInterviewDate: data.confirmedInterviewDate,
      status: data.status ?? undefined,
      actionStatus: data.actionStatus,
      notes: data.notes,
      lineUserId: data.lineUserId,
      clientId: data.clientId || null,
    },
  })

  const skillData = {
    isYears: data.isYears,
    ifYears: data.ifYears,
    saasYears: data.saasYears,
    toBYears: data.toBYears,
    toCYears: data.toCYears,
    customExperiences: data.customExperiences,
    otherBpoExperience: data.otherBpoExperience,
    tools: data.tools,
    strengths: data.strengths,
    freeSkillNote: data.freeSkillNote,
  }
  await prisma.candidateSkillDetail.upsert({
    where: { candidateId: id },
    update: skillData,
    create: { candidateId: id, ...skillData },
  })

  revalidatePath(`/candidates/${id}`)
  revalidatePath('/candidates')
  redirect(`/candidates/${id}`)
}

export async function updateActionStatus(id: string, actionStatus: string | null) {
  await requireAuth()
  await prisma.candidate.update({
    where: { id },
    data: { actionStatus: actionStatus || null },
  })
  revalidatePath('/candidates')
  revalidatePath(`/candidates/${id}`)
}

export async function addNote(id: string, text: string, author: string) {
  await requireAuth()
  const candidate = await prisma.candidate.findUnique({ where: { id }, select: { notes: true } })
  const existing = parseNotes(candidate?.notes ?? null)
  const newEntry: NoteEntry = { text: text.trim(), at: new Date().toISOString(), by: author.trim() }
  const updated = [...existing, newEntry]
  await prisma.candidate.update({
    where: { id },
    data: { notes: JSON.stringify(updated) },
  })
  revalidatePath('/candidates')
  revalidatePath(`/candidates/${id}`)
}

export async function deleteNote(id: string, index: number) {
  await requireAuth()
  const candidate = await prisma.candidate.findUnique({ where: { id }, select: { notes: true } })
  const existing = parseNotes(candidate?.notes ?? null)
  existing.splice(index, 1)
  await prisma.candidate.update({
    where: { id },
    data: { notes: existing.length ? JSON.stringify(existing) : null },
  })
  revalidatePath('/candidates')
  revalidatePath(`/candidates/${id}`)
}


export async function deleteCandidate(id: string) {
  await requireAuth()
  await prisma.candidate.delete({ where: { id } })
  revalidatePath('/candidates')
  redirect('/candidates')
}

function extractCandidateData(formData: FormData) {
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
  const getFloat = (key: string) => {
    const val = formData.get(key)
    if (!val || val === '') return null
    const n = parseFloat(String(val))
    return isNaN(n) ? null : n
  }
  const getDate = (key: string) => {
    const val = formData.get(key)
    if (!val || val === '') return null
    const d = new Date(String(val))
    return isNaN(d.getTime()) ? null : d
  }
  // experienceData JSON を解析
  type ExpItem = { id: string; label: string; years: string; active: boolean; fixed: boolean }
  let expItems: ExpItem[] = []
  try {
    const raw = formData.get('experienceData')
    if (raw && typeof raw === 'string') expItems = JSON.parse(raw)
  } catch { /* ignore */ }

  const getExp = (id: string): number | null => {
    const item = expItems.find((e) => e.id === id && e.active)
    if (!item) return null
    const y = parseFloat(item.years)
    return isNaN(y) ? 0 : y  // チェックあり・年数なし → 0
  }

  const customItems = expItems.filter((e) => !e.fixed && e.active && e.label.trim())
  const customExperiences = customItems
    .map((e) => `${e.label.trim()}:${e.years}`)
    .join('|') || null

  return {
    name: getString('name') || '',
    age: getInt('age'),
    company: getString('company'),
    address: getString('address'),
    preferredWorkStyle: getString('preferredWorkStyle'),
    preferredWorkHours: getString('preferredWorkHours'),
    desiredHourlyRate: getInt('desiredHourlyRate'),
    minimumHourlyRate: getInt('minimumHourlyRate'),
    workHistory: getString('workHistory'),
    availableStartDate: getDate('availableStartDate'),
    confirmedInterviewDate: getDate('confirmedInterviewDate'),
    status: getString('status'),
    actionStatus: getString('actionStatus'),
    notes: getString('notes'),
    lineUserId: getString('lineUserId'),
    clientId: getString('clientId'),
    isYears: getExp('is'),
    ifYears: getExp('fs'),
    saasYears: getExp('saas'),
    toBYears: getExp('tob'),
    toCYears: getExp('toc'),
    customExperiences,
    otherBpoExperience: getString('otherBpoExperience'),
    tools: getString('tools'),
    strengths: getString('strengths'),
    freeSkillNote: getString('freeSkillNote'),
  }
}
