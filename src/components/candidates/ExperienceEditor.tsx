'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'

export type ExpItem = {
  id: string
  label: string
  years: string   // "" = 年数不明 / "3" = 3年
  active: boolean
  fixed: boolean  // true = IS/FS/SaaS/BtoB/BtoC（削除不可）
}

const FIXED_ITEMS = [
  { id: 'is',   label: 'IS' },
  { id: 'fs',   label: 'FS' },
  { id: 'saas', label: 'SaaS' },
  { id: 'tob',  label: 'BtoB' },
  { id: 'toc',  label: 'BtoC' },
]

interface ExperienceEditorProps {
  defaultData?: {
    isYears?: number | null
    ifYears?: number | null
    saasYears?: number | null
    toBYears?: number | null
    toCYears?: number | null
    customExperiences?: string | null
  }
}

function yearsToStr(v: number | null | undefined): { active: boolean; years: string } {
  if (v == null) return { active: false, years: '' }
  return { active: true, years: v > 0 ? String(v) : '' }
}

export function ExperienceEditor({ defaultData }: ExperienceEditorProps) {
  const [items, setItems] = useState<ExpItem[]>(() => {
    const fixed: ExpItem[] = FIXED_ITEMS.map(({ id, label }) => {
      let raw: { active: boolean; years: string }
      if (id === 'is')   raw = yearsToStr(defaultData?.isYears)
      else if (id === 'fs')   raw = yearsToStr(defaultData?.ifYears)
      else if (id === 'saas') raw = yearsToStr(defaultData?.saasYears)
      else if (id === 'tob')  raw = yearsToStr(defaultData?.toBYears)
      else                    raw = yearsToStr(defaultData?.toCYears)
      return { id, label, ...raw, fixed: true }
    })

    const custom: ExpItem[] = (defaultData?.customExperiences ?? '')
      .split('|')
      .filter(Boolean)
      .map((part, i) => {
        const colonIdx = part.indexOf(':')
        const label = colonIdx >= 0 ? part.slice(0, colonIdx) : part
        const years = colonIdx >= 0 ? part.slice(colonIdx + 1) : ''
        return { id: `c_${i}`, label, years, active: true, fixed: false }
      })

    return [...fixed, ...custom]
  })

  function toggle(id: string) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, active: !it.active, years: '' } : it))
  }

  function setYears(id: string, years: string) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, years } : it))
  }

  function setLabel(id: string, label: string) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, label } : it))
  }

  function addItem() {
    const id = `c_${Date.now()}`
    setItems(prev => [...prev, { id, label: '', years: '', active: true, fixed: false }])
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(it => it.id !== id))
  }

  return (
    <div>
      <input type="hidden" name="experienceData" value={JSON.stringify(items)} />

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2 min-h-[32px]">
            {/* チェックボックス */}
            <input
              type="checkbox"
              checked={item.active}
              onChange={() => toggle(item.id)}
              className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 flex-shrink-0 cursor-pointer"
            />

            {/* ラベル */}
            {item.fixed ? (
              <span className={`text-sm font-medium w-14 flex-shrink-0 ${item.active ? 'text-gray-800' : 'text-gray-400'}`}>
                {item.label}
              </span>
            ) : (
              <input
                type="text"
                value={item.label}
                onChange={(e) => setLabel(item.id, e.target.value)}
                placeholder="経験名を入力"
                className="form-input text-sm py-1 w-36 flex-shrink-0"
              />
            )}

            {/* 年数入力（チェック時のみ） */}
            {item.active && (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={item.years}
                  onChange={(e) => setYears(item.id, e.target.value)}
                  min="0"
                  step="0.5"
                  placeholder="年数"
                  className="form-input text-sm py-1 w-20"
                />
                <span className="text-xs text-gray-400 flex-shrink-0">年</span>
              </div>
            )}

            {/* カスタム項目の削除ボタン */}
            {!item.fixed && (
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="ml-auto p-1 text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addItem}
        className="mt-3 flex items-center gap-1.5 text-xs text-green-600 hover:text-green-800 font-medium transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        経験を追加
      </button>
    </div>
  )
}
