'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '../prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

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
      desiredHourlyRate: data.desiredHourlyRate,
      minimumHourlyRate: data.minimumHourlyRate,
      workHistory: data.workHistory,
      availableStartDate: data.availableStartDate,
      confirmedInterviewDate: data.confirmedInterviewDate,
      status: data.status || 'APPLIED',
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
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', candidate.id)
      await mkdir(uploadDir, { recursive: true })
      const bytes = await skillSheetFile.arrayBuffer()
      const filePath = path.join(uploadDir, skillSheetFile.name)
      await writeFile(filePath, Buffer.from(bytes))
      await prisma.candidateDocument.create({
        data: {
          candidateId: candidate.id,
          fileName: skillSheetFile.name,
          filePath: `/uploads/${candidate.id}/${skillSheetFile.name}`,
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
      desiredHourlyRate: data.desiredHourlyRate,
      minimumHourlyRate: data.minimumHourlyRate,
      workHistory: data.workHistory,
      availableStartDate: data.availableStartDate,
      confirmedInterviewDate: data.confirmedInterviewDate,
      status: data.status ?? undefined,
      notes: data.notes,
      lineUserId: data.lineUserId,
      clientId: data.clientId || null,
    },
  })

  await prisma.candidateSkillDetail.upsert({
    where: { candidateId: id },
    update: {
      isYears: data.isYears,
      ifYears: data.ifYears,
      saasYears: data.saasYears,
      otherBpoExperience: data.otherBpoExperience,
      tools: data.tools,
      strengths: data.strengths,
      freeSkillNote: data.freeSkillNote,
    },
    create: {
      candidateId: id,
      isYears: data.isYears,
      ifYears: data.ifYears,
      saasYears: data.saasYears,
      otherBpoExperience: data.otherBpoExperience,
      tools: data.tools,
      strengths: data.strengths,
      freeSkillNote: data.freeSkillNote,
    },
  })

  revalidatePath(`/candidates/${id}`)
  revalidatePath('/candidates')
  redirect(`/candidates/${id}`)
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

  return {
    name: getString('name') || '',
    age: getInt('age'),
    company: getString('company'),
    address: getString('address'),
    preferredWorkStyle: getString('preferredWorkStyle'),
    desiredHourlyRate: getInt('desiredHourlyRate'),
    minimumHourlyRate: getInt('minimumHourlyRate'),
    workHistory: getString('workHistory'),
    availableStartDate: getDate('availableStartDate'),
    confirmedInterviewDate: getDate('confirmedInterviewDate'),
    status: getString('status'),
    notes: getString('notes'),
    lineUserId: getString('lineUserId'),
    clientId: getString('clientId'),
    isYears: getFloat('isYears'),
    ifYears: getFloat('ifYears'),
    saasYears: getFloat('saasYears'),
    otherBpoExperience: getString('otherBpoExperience'),
    tools: getString('tools'),
    strengths: getString('strengths'),
    freeSkillNote: getString('freeSkillNote'),
  }
}
