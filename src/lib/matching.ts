/**
 * ルールベースのマッチングアルゴリズム
 * 求職者と案件を条件一致で照合し、スコア＋理由を返す
 *
 * スコア配分（最大155点）:
 *   IS経験年数:        最大20点
 *   FS経験年数:        最大20点
 *   SaaS経験年数:      最大15点
 *   ツール一致:        最大10点
 *   スキル・職歴一致:   最大15点
 *   ToB/ToC経験:      最大10点
 *   カスタムタグ:      最大 8点
 *   単価範囲:          最大25点
 *   勤務形態:          最大20点（近似も部分点）
 *   稼働時間:          最大 8点
 *   稼働開始日:        最大 4点
 */

type CandidateForMatch = {
  id: string
  name: string
  preferredWorkStyle: string | null
  preferredWorkHours?: string | null
  desiredHourlyRate: number | null
  minimumHourlyRate: number | null
  availableStartDate?: Date | string | null
  workHistory?: string | null
  skillDetails: {
    isYears: number | null
    ifYears: number | null   // FS経験年数
    saasYears: number | null
    hasToBExperience?: boolean
    hasToCExperience?: boolean
    customTags?: string | null
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
  rateType: string | null
  rateMin: number | null
  rateMax: number | null
  desiredRate: number | null
  minimumRate: number | null
  requiredSkills: string | null
  description?: string | null
  workConditions?: string | null
  isYearsRequired: number | null
  fsYearsRequired: number | null
  saasYearsRequired: number | null
  startDate?: Date | string | null
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

/** 案件の全テキスト（必須スキル + 詳細 + 勤務条件）を結合 */
function getProjectText(project: ProjectForMatch): string {
  return [project.requiredSkills, project.description, project.workConditions]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

/** 候補者の全スキルテキスト（スキル詳細 + 職歴 + カスタムタグ）を結合 */
function getCandidateSkillText(candidate: CandidateForMatch): string {
  const sd = candidate.skillDetails
  return [
    sd?.strengths,
    sd?.otherBpoExperience,
    sd?.freeSkillNote,
    sd?.customTags,
    candidate.workHistory,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function scoreMatch(
  candidate: CandidateForMatch,
  project: ProjectForMatch
): MatchScore {
  let score = 0
  const reasons: string[] = []

  const sd = candidate.skillDetails
  const projectText = getProjectText(project)

  // ===== 1. IS経験年数マッチング (最大20点) =====
  if (sd?.isYears && sd.isYears > 0) {
    const required =
      project.isYearsRequired ??
      detectRequiredYears(project.requiredSkills, ['is', 'インサイドセールス', 'inside sales', 'テレアポ'])
    if (required !== null && required > 0) {
      const s = calcYearsScore(sd.isYears, required, 20)
      if (s > 0) {
        score += s
        reasons.push(`IS経験${sd.isYears}年 (必要${required}年)`)
      }
    } else if (keywordMatch(projectText, ['is', 'インサイドセールス', 'inside sales', 'テレアポ'])) {
      score += Math.min(15, sd.isYears * 4)
      reasons.push(`IS経験${sd.isYears}年`)
    }
  } else if (project.isYearsRequired && project.isYearsRequired > 0) {
    reasons.push(`⚠ IS経験不足 (必要${project.isYearsRequired}年)`)
  }

  // ===== 2. FS経験年数マッチング (最大20点) =====
  if (sd?.ifYears && sd.ifYears > 0) {
    const required =
      project.fsYearsRequired ??
      detectRequiredYears(project.requiredSkills, ['fs', 'フィールドセールス', 'field sales'])
    if (required !== null && required > 0) {
      const s = calcYearsScore(sd.ifYears, required, 20)
      if (s > 0) {
        score += s
        reasons.push(`FS経験${sd.ifYears}年 (必要${required}年)`)
      }
    } else if (keywordMatch(projectText, ['fs', 'フィールドセールス', 'field sales'])) {
      score += Math.min(15, sd.ifYears * 4)
      reasons.push(`FS経験${sd.ifYears}年`)
    }
  } else if (project.fsYearsRequired && project.fsYearsRequired > 0) {
    reasons.push(`⚠ FS経験不足 (必要${project.fsYearsRequired}年)`)
  }

  // ===== 3. SaaS経験年数マッチング (最大15点) =====
  if (sd?.saasYears && sd.saasYears > 0) {
    const required =
      project.saasYearsRequired ??
      detectRequiredYears(project.requiredSkills, ['saas', 'さーす'])
    if (required !== null && required > 0) {
      const s = calcYearsScore(sd.saasYears, required, 15)
      if (s > 0) {
        score += s
        reasons.push(`SaaS経験${sd.saasYears}年 (必要${required}年)`)
      }
    } else if (keywordMatch(projectText, ['saas', 'さーす'])) {
      score += Math.min(10, sd.saasYears * 4)
      reasons.push(`SaaS経験${sd.saasYears}年`)
    }
  } else if (project.saasYearsRequired && project.saasYearsRequired > 0) {
    reasons.push(`⚠ SaaS経験不足 (必要${project.saasYearsRequired}年)`)
  }

  // ===== 4. ツール一致 (最大10点) =====
  if (sd?.tools && projectText) {
    const tools = sd.tools.toLowerCase().split(/[,、\s]+/)
    const toolMatches = tools.filter((t) => t.length > 1 && projectText.includes(t))
    if (toolMatches.length > 0) {
      score += Math.min(10, toolMatches.length * 4)
      reasons.push(`ツール一致: ${toolMatches.join(', ')}`)
    }
  }

  // ===== 5. スキル詳細 + 職歴とのキーワード一致 (最大15点) =====
  if (projectText) {
    const candidateText = getCandidateSkillText(candidate)
    if (candidateText) {
      const keywords = candidateText.split(/[\s、,，。・]+/).filter((k) => k.length > 1)
      const matches = Array.from(new Set(keywords.filter((k) => projectText.includes(k))))
      if (matches.length > 0) {
        score += Math.min(15, matches.length * 2)
        reasons.push('スキル詳細一致')
      }
    }
  }

  // ===== 6. ToB/ToC経験マッチング (最大10点) =====
  const toBKeywords = ['btob', 'b2b', 'tob', '法人営業', '法人向け', '企業向け', 'エンタープライズ', 'enterprise']
  const toCKeywords = ['btoc', 'b2c', 'toc', '個人営業', '個人向け', 'コンシューマ', 'consumer']

  if (sd?.hasToBExperience && keywordMatch(projectText, toBKeywords)) {
    score += 10
    reasons.push('BtoB経験あり')
  } else if (sd?.hasToBExperience && !keywordMatch(projectText, toCKeywords)) {
    // ToB経験があり、ToC特化案件でない場合は軽くボーナス
    score += 4
    reasons.push('BtoB経験あり')
  }

  if (sd?.hasToCExperience && keywordMatch(projectText, toCKeywords)) {
    score += 8
    reasons.push('BtoC経験あり')
  }

  // ===== 7. カスタムタグ マッチング (最大8点) =====
  if (sd?.customTags && projectText) {
    const tags = sd.customTags.toLowerCase().split(/[,、\s]+/).filter((t) => t.length > 1)
    const tagMatches = tags.filter((t) => projectText.includes(t))
    if (tagMatches.length > 0) {
      score += Math.min(8, tagMatches.length * 3)
      reasons.push(`タグ一致: ${tagMatches.join(', ')}`)
    }
  }

  // ===== 8. 単価範囲 (最大25点) =====
  const rateScore = calcRateScore(
    candidate.desiredHourlyRate,
    candidate.minimumHourlyRate,
    project
  )
  if (rateScore > 0) {
    score += rateScore
    reasons.push(rateScore >= 20 ? '単価範囲内' : '単価近似')
  }

  // ===== 9. 勤務形態マッチング (最大20点) =====
  const workStyleScore = calcWorkStyleScore(candidate.preferredWorkStyle, project.workStyle)
  if (workStyleScore > 0) {
    score += workStyleScore
    if (workStyleScore >= 20) {
      reasons.push(`${project.workStyle}希望一致`)
    } else {
      reasons.push(`勤務形態近似 (希望: ${candidate.preferredWorkStyle} / 案件: ${project.workStyle})`)
    }
  }

  // ===== 10. 稼働時間マッチング (最大8点) =====
  if (candidate.preferredWorkHours && project.workHours) {
    const whScore = calcWorkHoursScore(candidate.preferredWorkHours, project.workHours)
    if (whScore > 0) {
      score += whScore
      reasons.push(whScore >= 8 ? `稼働時間一致 (${project.workHours})` : `稼働時間近似`)
    }
  }

  // ===== 11. 稼働開始日マッチング (最大4点) =====
  if (candidate.availableStartDate && project.startDate) {
    const startScore = calcStartDateScore(candidate.availableStartDate, project.startDate)
    if (startScore > 0) {
      score += startScore
      reasons.push(startScore >= 4 ? '稼働開始日OK' : '稼働開始日近似')
    }
  }

  return {
    candidateId: candidate.id,
    projectId: project.id,
    score,
    matchedReasons: reasons,
  }
}

/**
 * 勤務形態マッチングスコア
 * - 完全一致: 20点
 * - フルリモート希望 × 一部出社案件: 8点（リモートも含む）
 * - 一部出社希望 × フルリモート案件: 10点（完全リモートも対応可）
 * - 一部出社希望 × 出社案件: 5点
 * - 出社希望 × 一部出社案件: 8点
 */
function calcWorkStyleScore(
  candidateStyle: string | null,
  projectStyle: string | null
): number {
  if (!candidateStyle || !projectStyle) return 0
  if (candidateStyle === projectStyle) return 20

  const remote = 'フルリモート'
  const hybrid = '一部出社'
  const onsite = '出社'

  if (candidateStyle === remote && projectStyle === hybrid) return 8
  if (candidateStyle === hybrid && projectStyle === remote) return 10
  if (candidateStyle === hybrid && projectStyle === onsite) return 5
  if (candidateStyle === onsite && projectStyle === hybrid) return 8

  return 0
}

/**
 * 稼働時間マッチングスコア
 * - 完全一致: 8点
 * - フルタイム ⟷ 160時間: 5点（ほぼ同じ）
 * - 時短 ⟷ 120時間: 5点
 */
function calcWorkHoursScore(
  candidateHours: string,
  projectHours: string
): number {
  if (candidateHours === projectHours) return 8

  const ch = candidateHours.toLowerCase()
  const ph = projectHours.toLowerCase()

  // フルタイム系の近似
  if ((ch.includes('フルタイム') || ch.includes('160')) &&
      (ph.includes('フルタイム') || ph.includes('160'))) return 5

  // 時短系の近似
  if ((ch.includes('時短') || ch.includes('120')) &&
      (ph.includes('時短') || ph.includes('120'))) return 5

  return 0
}

/**
 * 稼働開始日スコア
 * - 候補者の稼働可能日が案件開始日以前: 4点
 * - 2週間以内の遅れ: 2点
 */
function calcStartDateScore(
  availableDate: Date | string,
  projectStartDate: Date | string
): number {
  const avail = new Date(availableDate).getTime()
  const start = new Date(projectStartDate).getTime()
  const diffDays = (avail - start) / (1000 * 60 * 60 * 24)

  if (diffDays <= 0) return 4
  if (diffDays <= 14) return 2
  return 0
}

/**
 * 必要スキルテキストから年数を検出（例: "IS経験2年以上" → 2）
 */
function detectRequiredYears(requiredSkills: string | null, keywords: string[]): number | null {
  if (!requiredSkills) return null
  const lower = requiredSkills.toLowerCase()
  for (const kw of keywords) {
    if (!lower.includes(kw)) continue
    const pattern = new RegExp(`${kw}[^0-9]*([0-9]+(?:\\.[0-9]+)?)\\s*年`, 'i')
    const m = lower.match(pattern)
    if (m) return parseFloat(m[1])
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

/**
 * 単価スコア計算（新旧フィールド両対応）
 * 新: rateMin（最低額）/ rateMax（上限額）
 * 旧: desiredRate / minimumRate
 */
function calcRateScore(
  candidateDesired: number | null,
  candidateMinimum: number | null,
  project: Pick<ProjectForMatch, 'rateType' | 'rateMin' | 'rateMax' | 'desiredRate' | 'minimumRate'>
): number {
  if (!candidateDesired && !candidateMinimum) return 0

  const pMin = project.rateMin ?? project.minimumRate
  const pMax = project.rateMax ?? project.desiredRate

  if (!pMin && !pMax) return 0

  const cDesired = candidateDesired ?? 0
  const cMin = candidateMinimum ?? (cDesired ? Math.round(cDesired * 0.9) : 0)

  if (pMin && pMax) {
    if (cMin <= pMax && cDesired >= pMin) return 25
    if (cMin <= pMax) return 15
    if (Math.abs(cDesired - pMax) / pMax <= 0.2) return 8
    return 0
  }

  if (pMax) {
    if (cDesired <= pMax) return 20
    if (cMin <= pMax) return 12
    if (Math.abs(cDesired - pMax) / pMax <= 0.1) return 5
    return 0
  }

  if (pMin) {
    if (cDesired >= pMin) return 20
    if (cDesired >= pMin * 0.9) return 12
    if (cDesired >= pMin * 0.75) return 5
    return 0
  }

  return 0
}
