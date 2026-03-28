import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { readProjectsFromSheet, upsertProjectToSheet, writeIdToSheetColumn } from '@/lib/googleSheets'

// GET: スプレッドシート → アプリ（Vercel Cron or 手動）
export async function GET() {
  try {
    const rows = await readProjectsFromSheet()
    let created = 0
    let updated = 0

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const colIndex = i + 1 // B列=1, C列=2, ...

      if (row.id) {
        // IDあり → 既存案件を更新
        const existing = await prisma.project.findUnique({ where: { id: row.id } })
        if (existing) {
          await prisma.project.update({
            where: { id: row.id },
            data: {
              title: row.title || existing.title,
              description: row.description || existing.description,
            },
          })
          updated++
        }
      } else {
        // IDなし → 新規作成してIDをスプレッドシートに書き戻す
        const existing = await prisma.project.findFirst({
          where: { title: row.title },
        })
        if (existing) {
          // 同名の案件が既にある場合はIDを書き戻すだけ
          await writeIdToSheetColumn(colIndex, existing.id)
          updated++
        } else {
          const project = await prisma.project.create({
            data: {
              title: row.title,
              description: row.description || null,
              status: 'RECRUITING',
            },
          })
          await writeIdToSheetColumn(colIndex, project.id)
          created++
        }
      }
    }

    return NextResponse.json({ ok: true, created, updated })
  } catch (e) {
    console.error('[sync/sheets GET]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// POST: アプリ → スプレッドシート（全件）
export async function POST() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'asc' },
      select: { id: true, title: true, description: true },
    })

    for (const p of projects) {
      await upsertProjectToSheet(p)
    }

    return NextResponse.json({ ok: true, count: projects.length })
  } catch (e) {
    console.error('[sync/sheets POST]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
