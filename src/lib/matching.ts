/**
 * ルールベースのマッチングアルゴリズム
 * 求職者と案件を条件一致で照合し、スコア＋理由を返す
 */

type CandidateForMatch = {
  id: string
  name: string
  preferredWorkStyle: string | null
  desiredHourlyRate: number | null
  minimumHourlyRate: number | null
  skillDetails: {
    isYears: number | null
    ifYears: number | null
    saasYears: number | null
    tools: string | null
    freeSkillNote: string | null
    strengths: string | null
  } | null
}

type ProjectForMatch = {
  id: string
  title: string
  workStyle: string | null
  workHours: string | null
  desiredRate: number | null
  minimumRate: number | null
  requiredSkills: string | null
}

export type MatchScore = {
  candidateId: string
  projectId: string
  score: number
  matchedReasons: string[]
}

// 候補者 → 案件マッチング
export function matchCandidateToProjects(
  candidate: CandidateForMatch,
  projects: ProjectForMatch[]
): MatchScore[] {
  return projects
    .map((project) => scoreMatch(candidate, project))
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
}

// 案件 → 候補者マッチング
export function matchProjectToCandidates(
  project: ProjectForMatch,
  candidates: CandidateForMatch[]
): MatchScore[] {
  return candidates
    .map((candidate) => scoreMatch(candidate, project))
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
}

function scoreMatch(
  candidate: CandidateForMatch,
  project: ProjectForMatch
): MatchScore {
  let score = 0
  const reasons: string[] = []

  // 1. スキル一致 (最大30点)
  if (candidate.skillDetails && project.requiredSkills) {
    const requiredLower = project.requiredSkills.toLowerCase()
    const skillScore = calcSkillScore(candidate.skillDetails, requiredLower)
    if (skillScore > 0) {
      score += skillScore
      reasons.push('スキル一致')
    }
  }

  // 2. 単価範囲 (最大25点)
  const rateScore = calcRateScore(
    candidate.desiredHourlyRate,
    candidate.minimumHourlyRate,
    project.desiredRate,
    project.minimumRate
  )
  if (rateScore > 0) {
    score += rateScore
    if (rateScore >= 20) {
      reasons.push('単価範囲内')
    } else {
      reasons.push('単価近似')
    }
  }

  // 3. 勤務形態一致 (20点)
  if (
    candidate.preferredWorkStyle &&
    project.workStyle &&
    candidate.preferredWorkStyle === project.workStyle
  ) {
    score += 20
    reasons.push(`${project.workStyle}希望一致`)
  }

  return {
    candidateId: candidate.id,
    projectId: project.id,
    score,
    matchedReasons: reasons,
  }
}

function calcSkillScore(
  skillDetails: CandidateForMatch['skillDetails'],
  requiredLower: string
): number {
  if (!skillDetails) return 0

  let score = 0

  // IS経験
  if (skillDetails.isYears && skillDetails.isYears > 0) {
    if (
      requiredLower.includes('is') ||
      requiredLower.includes('インサイドセールス') ||
      requiredLower.includes('テレアポ')
    ) {
      score += Math.min(15, skillDetails.isYears * 5)
    }
  }

  // IF経験
  if (skillDetails.ifYears && skillDetails.ifYears > 0) {
    if (
      requiredLower.includes('if') ||
      requiredLower.includes('インフォメーション') ||
      requiredLower.includes('カスタマーサポート') ||
      requiredLower.includes('cs')
    ) {
      score += Math.min(15, skillDetails.ifYears * 5)
    }
  }

  // SaaS経験
  if (skillDetails.saasYears && skillDetails.saasYears > 0) {
    if (requiredLower.includes('saas')) {
      score += Math.min(10, skillDetails.saasYears * 5)
    }
  }

  // ツール一致
  if (skillDetails.tools) {
    const tools = skillDetails.tools.toLowerCase().split(/[,、\s]+/)
    const toolMatches = tools.filter(
      (t) => t.length > 1 && requiredLower.includes(t)
    )
    if (toolMatches.length > 0) {
      score += Math.min(10, toolMatches.length * 5)
    }
  }

  // 自由記述スキルとの一致
  if (skillDetails.freeSkillNote) {
    const keywords = skillDetails.freeSkillNote.toLowerCase().split(/[\s、,]+/)
    const matches = keywords.filter((k) => k.length > 1 && requiredLower.includes(k))
    if (matches.length > 0) {
      score += Math.min(5, matches.length * 2)
    }
  }

  return Math.min(score, 30)
}

function calcRateScore(
  candidateDesired: number | null,
  candidateMinimum: number | null,
  projectDesired: number | null,
  projectMinimum: number | null
): number {
  if (!projectMinimum || !projectDesired) return 0
  if (!candidateDesired && !candidateMinimum) return 0

  const cDesired = candidateDesired ?? 0
  const cMin = candidateMinimum ?? cDesired * 0.9

  // 候補者の最低希望単価が案件の希望単価以下 → 完全一致
  if (cMin <= projectDesired && cDesired >= projectMinimum) {
    return 25
  }

  // 候補者の最低単価が案件の最低単価以下 → ほぼ一致
  if (cMin <= projectDesired) {
    return 15
  }

  // 候補者の希望単価が案件の希望単価の±20%以内 → 近似
  if (Math.abs(cDesired - projectDesired) / projectDesired <= 0.2) {
    return 8
  }

  return 0
}
