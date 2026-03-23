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
    ifYears: number | null   // FS経験年数
    saasYears: number | null
    tools: string | null
    freeSkillNote: string | null
    strengths: string | null
    otherBpoExperience: string | null
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
  isYearsRequired: number | null
  fsYearsRequired: number | null
  saasYearsRequired: number | null
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

  const sd = candidate.skillDetails

  // 1. IS経験年数マッチング (最大20点)
  if (sd?.isYears && sd.isYears > 0) {
    const required = project.isYearsRequired ?? detectRequiredYears(project.requiredSkills, ['is', 'インサイドセールス', 'inside sales', 'テレアポ'])
    if (required !== null && required > 0) {
      const s = calcYearsScore(sd.isYears, required, 20)
      if (s > 0) {
        score += s
        reasons.push(`IS経験${sd.isYears}年 (必要${required}年)`)
      }
    } else if (keywordMatch(project.requiredSkills, ['is', 'インサイドセールス', 'inside sales', 'テレアポ'])) {
      // 必要年数未設定だがキーワード一致
      score += Math.min(15, sd.isYears * 4)
      reasons.push(`IS経験${sd.isYears}年`)
    }
  }

  // 2. FS経験年数マッチング (最大20点)
  if (sd?.ifYears && sd.ifYears > 0) {
    const required = project.fsYearsRequired ?? detectRequiredYears(project.requiredSkills, ['fs', 'フィールドセールス', 'field sales'])
    if (required !== null && required > 0) {
      const s = calcYearsScore(sd.ifYears, required, 20)
      if (s > 0) {
        score += s
        reasons.push(`FS経験${sd.ifYears}年 (必要${required}年)`)
      }
    } else if (keywordMatch(project.requiredSkills, ['fs', 'フィールドセールス', 'field sales'])) {
      score += Math.min(15, sd.ifYears * 4)
      reasons.push(`FS経験${sd.ifYears}年`)
    }
  }

  // 3. SaaS経験年数マッチング (最大15点)
  if (sd?.saasYears && sd.saasYears > 0) {
    const required = project.saasYearsRequired ?? detectRequiredYears(project.requiredSkills, ['saas', 'さーす'])
    if (required !== null && required > 0) {
      const s = calcYearsScore(sd.saasYears, required, 15)
      if (s > 0) {
        score += s
        reasons.push(`SaaS経験${sd.saasYears}年 (必要${required}年)`)
      }
    } else if (keywordMatch(project.requiredSkills, ['saas', 'さーす'])) {
      score += Math.min(10, sd.saasYears * 4)
      reasons.push(`SaaS経験${sd.saasYears}年`)
    }
  }

  // 4. ツール一致 (最大10点)
  if (sd?.tools && project.requiredSkills) {
    const requiredLower = project.requiredSkills.toLowerCase()
    const tools = sd.tools.toLowerCase().split(/[,、\s]+/)
    const toolMatches = tools.filter((t) => t.length > 1 && requiredLower.includes(t))
    if (toolMatches.length > 0) {
      score += Math.min(10, toolMatches.length * 4)
      reasons.push(`ツール一致: ${toolMatches.join(', ')}`)
    }
  }

  // 5. 得意領域・その他BPO経験・自由記述とのキーワード一致 (最大8点)
  if (project.requiredSkills) {
    const requiredLower = project.requiredSkills.toLowerCase()
    const textFields = [sd?.strengths, sd?.otherBpoExperience, sd?.freeSkillNote]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    if (textFields) {
      const keywords = textFields.split(/[\s、,，。]+/).filter((k) => k.length > 1)
      const matches = keywords.filter((k) => requiredLower.includes(k))
      if (matches.length > 0) {
        score += Math.min(8, matches.length * 2)
        reasons.push('スキル詳細一致')
      }
    }
  }

  // 6. 単価範囲 (最大25点)
  const rateScore = calcRateScore(
    candidate.desiredHourlyRate,
    candidate.minimumHourlyRate,
    project.desiredRate,
    project.minimumRate
  )
  if (rateScore > 0) {
    score += rateScore
    reasons.push(rateScore >= 20 ? '単価範囲内' : '単価近似')
  }

  // 7. 勤務形態一致 (20点)
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

/**
 * 必要スキルテキストから年数を検出（例: "IS経験2年以上" → 2）
 */
function detectRequiredYears(requiredSkills: string | null, keywords: string[]): number | null {
  if (!requiredSkills) return null
  const lower = requiredSkills.toLowerCase()
  for (const kw of keywords) {
    if (!lower.includes(kw)) continue
    // キーワード周辺の数字を探す（例: "IS2年", "IS経験2年以上"）
    const pattern = new RegExp(`${kw}[^0-9]*([0-9]+(?:\\.[0-9]+)?)\\s*年`, 'i')
    const m = lower.match(pattern)
    if (m) return parseFloat(m[1])
    // 逆順（例: "2年以上のIS経験"）
    const idx = lower.indexOf(kw)
    const before = lower.slice(Math.max(0, idx - 20), idx)
    const m2 = before.match(/([0-9]+(?:\.[0-9]+)?)\s*年/)
    if (m2) return parseFloat(m2[1])
  }
  return null
}

/**
 * テキストにキーワードが含まれるか
 */
function keywordMatch(text: string | null, keywords: string[]): boolean {
  if (!text) return false
  const lower = text.toLowerCase()
  return keywords.some((kw) => lower.includes(kw))
}

/**
 * 経験年数スコア計算
 * - 必要年数以上: 満点
 * - 必要年数の75%以上: 満点の70%
 * - 必要年数の50%以上: 満点の40%
 * - それ以下: 0
 */
function calcYearsScore(actual: number, required: number, maxScore: number): number {
  if (actual >= required) return maxScore
  if (actual >= required * 0.75) return Math.round(maxScore * 0.7)
  if (actual >= required * 0.5) return Math.round(maxScore * 0.4)
  return 0
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

  if (cMin <= projectDesired && cDesired >= projectMinimum) return 25
  if (cMin <= projectDesired) return 15
  if (Math.abs(cDesired - projectDesired) / projectDesired <= 0.2) return 8

  return 0
}
