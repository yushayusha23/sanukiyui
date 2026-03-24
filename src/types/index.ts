// ステータス定義

export const CANDIDATE_STATUS = {
  APPLIED: '応募あり',
  REGISTERED: 'システム登録済み',
  SKILLSHEET_RECV: 'スキルシート受領済み',
  INTRODUCING: '案件紹介中',
  INTERVIEW_DATE_COLLECTING: '面談日回収',
  INTERVIEW_DATE_CONFIRMED: '面談日確定',
  INTERVIEWED: '面談実施',
  PASSED: '合格',
  FAILED: '不合格',
  ON_HOLD: '保留',
} as const

export type CandidateStatusKey = keyof typeof CANDIDATE_STATUS

export const CANDIDATE_STATUS_COLORS: Record<CandidateStatusKey, string> = {
  APPLIED: 'bg-gray-100 text-gray-700',
  REGISTERED: 'bg-blue-100 text-blue-700',
  SKILLSHEET_RECV: 'bg-indigo-100 text-indigo-700',
  INTRODUCING: 'bg-purple-100 text-purple-700',
  INTERVIEW_DATE_COLLECTING: 'bg-yellow-100 text-yellow-700',
  INTERVIEW_DATE_CONFIRMED: 'bg-orange-100 text-orange-700',
  INTERVIEWED: 'bg-cyan-100 text-cyan-700',
  PASSED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
  ON_HOLD: 'bg-gray-100 text-gray-500',
}

export const PROJECT_STATUS = {
  RECRUITING: '募集中',
  PROPOSING: '候補者提案中',
  INTERVIEWING: '面談中',
  DECIDED: '決定',
  CLOSED: '終了',
} as const

export type ProjectStatusKey = keyof typeof PROJECT_STATUS

export const PROJECT_STATUS_COLORS: Record<ProjectStatusKey, string> = {
  RECRUITING: 'bg-green-100 text-green-700',
  PROPOSING: 'bg-blue-100 text-blue-700',
  INTERVIEWING: 'bg-yellow-100 text-yellow-700',
  DECIDED: 'bg-indigo-100 text-indigo-700',
  CLOSED: 'bg-gray-100 text-gray-500',
}

export const WORK_STYLE_OPTIONS = [
  'フルリモート',
  '一部出社',
  '出社',
] as const

export const WORK_HOURS_OPTIONS = [
  'フルタイム',
  '160時間',
  '120時間',
  '時短',
] as const

export const CONTACT_TYPE = {
  PHONE: '電話',
  EMAIL: 'メール',
  LINE: 'LINE',
  SMS: 'SMS',
} as const

export type ContactTypeKey = keyof typeof CONTACT_TYPE

export const INTERVIEW_RESULT = {
  PENDING: '未実施',
  PASSED: '合格',
  FAILED: '不合格',
  ON_HOLD: '保留',
} as const

// Prisma 型の拡張
export type CandidateWithDetails = {
  id: string
  name: string
  age: number | null
  company: string | null
  address: string | null
  preferredWorkStyle: string | null
  desiredHourlyRate: number | null
  minimumHourlyRate: number | null
  workHistory: string | null
  availableStartDate: Date | null
  confirmedInterviewDate: Date | null
  status: string
  notes: string | null
  lineUserId: string | null
  createdAt: Date
  updatedAt: Date
  skillDetails: {
    isYears: number | null
    ifYears: number | null
    saasYears: number | null
    otherBpoExperience: string | null
    tools: string | null
    strengths: string | null
    freeSkillNote: string | null
  } | null
  documents: {
    id: string
    fileName: string
    filePath: string
    fileType: string
    createdAt: Date
  }[]
  _count?: {
    communications: number
    interviews: number
  }
}

export type ProjectWithCounts = {
  id: string
  title: string
  clientName: string | null
  sourceClientName: string | null
  description: string | null
  requiredSkills: string | null
  workStyle: string | null
  workHours: string | null
  rateType: string | null
  rateMin: number | null
  rateMax: number | null
  desiredRate: number | null
  minimumRate: number | null
  workConditions: string | null
  recruitmentStatus: string | null
  startDate: Date | null
  status: string
  createdAt: Date
  updatedAt: Date
  _count?: {
    interviews: number
    matches: number
  }
}

export type MatchResult = {
  id: string
  score: number
  matchedReasons: string[]
  status: string
  candidate?: CandidateWithDetails
  project?: ProjectWithCounts
}
