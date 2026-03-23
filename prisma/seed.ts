import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 シードデータを投入中...')

  // ユーザー作成
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin1234'
  const passwordHash = await bcrypt.hash(adminPassword, 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: '管理者',
      email: 'admin@example.com',
      passwordHash,
      role: 'admin',
    },
  })

  await prisma.user.upsert({
    where: { email: 'staff@example.com' },
    update: {},
    create: {
      name: '田中 花子',
      email: 'staff@example.com',
      passwordHash: await bcrypt.hash('staff1234', 12),
      role: 'staff',
    },
  })

  console.log('✅ ユーザー作成完了')

  // 求職者ダミーデータ
  const candidates = [
    {
      name: '山田 太郎',
      age: 32,
      company: 'NTTコミュニケーションズ',
      address: '東京都渋谷区',
      preferredWorkStyle: 'フルリモート',
      desiredHourlyRate: 2500,
      minimumHourlyRate: 2000,
      workHistory: '前職: NTTコミュニケーションズ コールセンター 3年\n前々職: ソフトバンク テレアポ 2年',
      status: 'SKILLSHEET_RECV',
      notes: 'コミュニケーション能力高い。IS経験豊富。',
      availableStartDate: new Date('2024-08-01'),
      skillDetails: {
        isYears: 3.0,
        ifYears: 1.5,
        saasYears: 0.5,
        otherBpoExperience: 'テレアポ、メール対応',
        tools: 'Salesforce, Zendesk, Slack',
        strengths: 'インサイドセールス、顧客対応',
        freeSkillNote: 'SaaS系プロダクトのIS経験あり。KPI管理経験あり。',
      },
    },
    {
      name: '鈴木 美咲',
      age: 28,
      company: '楽天株式会社',
      address: '神奈川県横浜市',
      preferredWorkStyle: '一部出社',
      desiredHourlyRate: 2200,
      minimumHourlyRate: 1800,
      workHistory: '前職: 楽天 カスタマーサポート 2年\n前々職: フリーランス ライター 1年',
      status: 'INTRODUCING',
      notes: 'メール対応が得意。英語も少し話せる。',
      availableStartDate: new Date('2024-07-15'),
      skillDetails: {
        isYears: 1.0,
        ifYears: 2.0,
        saasYears: 1.0,
        otherBpoExperience: 'チャットサポート、FAQ作成',
        tools: 'Zendesk, Freshdesk, ChatGPT',
        strengths: 'メール対応、ドキュメント作成',
        freeSkillNote: 'EC系のカスタマーサポート経験あり。',
      },
    },
    {
      name: '佐藤 健一',
      age: 40,
      company: 'フリーランス',
      address: '大阪府大阪市',
      preferredWorkStyle: 'フルリモート',
      desiredHourlyRate: 3000,
      minimumHourlyRate: 2500,
      workHistory: '前職: 大手通信会社 マネージャー 5年\n現職: フリーランス コンサル 3年',
      status: 'INTERVIEW_DATE_CONFIRMED',
      confirmedInterviewDate: new Date('2024-07-10T14:00:00'),
      notes: 'マネジメント経験豊富。即戦力。',
      availableStartDate: new Date('2024-08-01'),
      skillDetails: {
        isYears: 5.0,
        ifYears: 3.0,
        saasYears: 2.0,
        otherBpoExperience: 'チームマネジメント、KPI設計',
        tools: 'Salesforce, HubSpot, Teams',
        strengths: 'マネジメント、IS設計',
        freeSkillNote: '大規模コールセンターの立ち上げ経験あり。',
      },
    },
    {
      name: '田中 裕子',
      age: 25,
      company: '医療法人',
      address: '東京都新宿区',
      preferredWorkStyle: 'フルリモート',
      desiredHourlyRate: 1800,
      minimumHourlyRate: 1500,
      workHistory: '前職: 医療事務 2年',
      status: 'REGISTERED',
      notes: '未経験からBPO希望。明るく積極的。',
      availableStartDate: new Date('2024-07-01'),
      skillDetails: {
        isYears: 0,
        ifYears: 0,
        saasYears: 0,
        otherBpoExperience: '医療事務、受付対応',
        tools: 'Excel, Word',
        strengths: '丁寧な対応、事務作業',
        freeSkillNote: 'BPO未経験だが向上心あり。研修対応可。',
      },
    },
    {
      name: '伊藤 翔太',
      age: 35,
      company: 'トヨタ系列BPO',
      address: '愛知県名古屋市',
      preferredWorkStyle: '出社',
      desiredHourlyRate: 2800,
      minimumHourlyRate: 2300,
      workHistory: '前職: トヨタ系列 BPO 7年',
      status: 'APPLIED',
      notes: '製造業BPO特化。名古屋在住のため出社希望。',
      skillDetails: {
        isYears: 2.0,
        ifYears: 5.0,
        saasYears: 1.0,
        otherBpoExperience: '製造業BPO、データ入力、品質管理',
        tools: 'SAP, Excel, PowerPoint',
        strengths: '品質管理、製造業プロセス',
        freeSkillNote: 'メーカー向けBPOの専門知識あり。',
      },
    },
  ]

  for (const c of candidates) {
    const { skillDetails, ...candidateData } = c
    const candidate = await prisma.candidate.create({
      data: candidateData,
    })
    if (skillDetails) {
      await prisma.candidateSkillDetail.create({
        data: {
          candidateId: candidate.id,
          ...skillDetails,
        },
      })
    }
  }

  console.log('✅ 求職者データ作成完了')

  // 案件ダミーデータ
  const projects = [
    {
      title: 'SaaS企業 インサイドセールス',
      clientName: '株式会社テックベンチャー',
      sourceClientName: '人材紹介会社A',
      description: 'SaaSプロダクトの新規顧客開拓。テレアポ・メール営業中心。',
      requiredSkills: 'IS経験2年以上, Salesforce, SaaS知識',
      workStyle: 'フルリモート',
      workHours: 'フルタイム',
      desiredRate: 2500,
      minimumRate: 2000,
      workConditions: '週5日 9:00-18:00、PCレンタル可',
      status: 'RECRUITING',
    },
    {
      title: '通信会社 カスタマーサポート',
      clientName: '大手通信会社B',
      sourceClientName: null,
      description: '月〜金 電話・メール対応。顧客からの問い合わせ対応全般。',
      requiredSkills: 'コールセンター経験1年以上, Excel基本操作',
      workStyle: '一部出社',
      workHours: '160時間',
      desiredRate: 2000,
      minimumRate: 1700,
      workConditions: '週3日出社（渋谷オフィス）',
      status: 'PROPOSING',
    },
    {
      title: 'EC会社 チャット・メールサポート',
      clientName: 'ECサイト運営C社',
      sourceClientName: '人材紹介会社B',
      description: '商品問い合わせ、返品対応、レビュー管理。',
      requiredSkills: 'メール・チャット対応経験, Zendesk経験あれば尚可',
      workStyle: 'フルリモート',
      workHours: '120時間',
      desiredRate: 2200,
      minimumRate: 1800,
      workConditions: '週4日 10:00-17:00',
      status: 'INTERVIEWING',
    },
    {
      title: '保険会社 バックオフィス支援',
      clientName: '大手保険会社D',
      sourceClientName: null,
      description: '書類確認、データ入力、電話対応。保険知識は不要。',
      requiredSkills: 'データ入力, 電話応対, 細かい作業が得意な方',
      workStyle: '出社',
      workHours: 'フルタイム',
      desiredRate: 1900,
      minimumRate: 1600,
      workConditions: '大阪市内オフィス勤務',
      status: 'RECRUITING',
    },
    {
      title: 'IT企業 テクニカルサポート（リーダー候補）',
      clientName: 'スタートアップE社',
      sourceClientName: '人材紹介会社A',
      description: 'カスタマーサポートチームのリーダー業務。KPI管理、メンバー育成込み。',
      requiredSkills: 'CS/IS経験5年以上, マネジメント経験, SaaS業界知識',
      workStyle: 'フルリモート',
      workHours: 'フルタイム',
      desiredRate: 3200,
      minimumRate: 2800,
      workConditions: '月次報告あり。裁量大きい環境。',
      status: 'RECRUITING',
    },
  ]

  const createdProjects = []
  for (const p of projects) {
    const project = await prisma.project.create({ data: p })
    createdProjects.push(project)
  }

  console.log('✅ 案件データ作成完了')

  // 全候補者を取得
  const allCandidates = await prisma.candidate.findMany()

  // 面談ダミーデータ
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(14, 0, 0, 0)

  const dayAfter = new Date()
  dayAfter.setDate(dayAfter.getDate() + 3)
  dayAfter.setHours(10, 0, 0, 0)

  await prisma.interview.create({
    data: {
      candidateId: allCandidates[2].id,
      projectId: createdProjects[0].id,
      interviewDateTime: tomorrow,
      interviewer: '田中 花子',
      memo: '希望単価確認必要。リモート経験を詳しく聞く。',
      result: 'PENDING',
    },
  })

  await prisma.interview.create({
    data: {
      candidateId: allCandidates[1].id,
      projectId: createdProjects[2].id,
      interviewDateTime: dayAfter,
      interviewer: '管理者',
      memo: 'Zendesk経験について確認。稼働可能日の確認。',
      result: 'PENDING',
    },
  })

  const pastInterview = new Date()
  pastInterview.setDate(pastInterview.getDate() - 5)
  await prisma.interview.create({
    data: {
      candidateId: allCandidates[0].id,
      projectId: createdProjects[1].id,
      interviewDateTime: pastInterview,
      interviewer: '田中 花子',
      memo: 'コミュニケーション能力高い印象。',
      evaluation: '非常に良い',
      result: 'PASSED',
    },
  })

  console.log('✅ 面談データ作成完了')

  // 連絡履歴ダミーデータ
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const threeDaysAgo = new Date()
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const tomorrowContact = new Date()
  tomorrowContact.setDate(tomorrowContact.getDate() + 1)

  const overdueContact = new Date()
  overdueContact.setDate(overdueContact.getDate() - 3)

  await prisma.communication.createMany({
    data: [
      {
        candidateId: allCandidates[0].id,
        type: 'EMAIL',
        contactedAt: threeDaysAgo,
        memo: 'スキルシート受領。面談日程の調整を依頼。',
        replied: true,
        nextContactDate: tomorrowContact,
      },
      {
        candidateId: allCandidates[1].id,
        type: 'LINE',
        contactedAt: yesterday,
        memo: '案件Cについて紹介。返信待ち。',
        replied: false,
        nextContactDate: overdueContact, // 過去の日付 → 連絡漏れ候補
      },
      {
        candidateId: allCandidates[2].id,
        type: 'PHONE',
        contactedAt: weekAgo,
        memo: '面談日程確定の電話。14時〜で確認。',
        replied: true,
        nextContactDate: tomorrowContact,
      },
      {
        candidateId: allCandidates[3].id,
        type: 'EMAIL',
        contactedAt: weekAgo,
        memo: '登録完了のお礼メール。案件紹介予告。',
        replied: false,
        nextContactDate: overdueContact, // 過去の日付 → 連絡漏れ候補
      },
      {
        candidateId: allCandidates[4].id,
        type: 'PHONE',
        contactedAt: threeDaysAgo,
        memo: '求人応募の確認電話。スキルシート依頼。',
        replied: true,
        nextContactDate: null,
      },
    ],
  })

  console.log('✅ 連絡履歴データ作成完了')

  console.log('')
  console.log('🎉 シード完了!')
  console.log('')
  console.log('ログイン情報:')
  console.log('  管理者:  admin@example.com / admin1234')
  console.log('  スタッフ: staff@example.com / staff1234')
}

main()
  .catch((e) => {
    console.error('❌ シードエラー:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
