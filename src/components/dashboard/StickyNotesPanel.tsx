'use client'

import { useState, useEffect } from 'react'
import { Plus, X, ChevronDown, StickyNote } from 'lucide-react'

type Note = {
  id: string
  content: string
  color: string
  createdAt: string
}

const COLOR_OPTIONS = [
  { value: 'yellow', label: '黄', bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-900', dot: 'bg-yellow-400' },
  { value: 'green',  label: '緑', bg: 'bg-green-100',  border: 'border-green-300',  text: 'text-green-900',  dot: 'bg-green-400' },
  { value: 'pink',   label: '桃', bg: 'bg-pink-100',   border: 'border-pink-300',   text: 'text-pink-900',   dot: 'bg-pink-400' },
  { value: 'blue',   label: '青', bg: 'bg-blue-100',   border: 'border-blue-300',   text: 'text-blue-900',   dot: 'bg-blue-400' },
]

function getColorStyle(color: string) {
  return COLOR_OPTIONS.find(c => c.value === color) ?? COLOR_OPTIONS[0]
}

export function StickyNotesPanel() {
  const [notes, setNotes] = useState<Note[]>([])
  const [open, setOpen] = useState(true)
  const [adding, setAdding] = useState(false)
  const [newContent, setNewContent] = useState('')
  const [newColor, setNewColor] = useState('yellow')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/sticky-notes')
      .then(r => r.json())
      .then(data => setNotes(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  async function addNote() {
    if (!newContent.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/sticky-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent, color: newColor }),
      })
      const note = await res.json()
      setNotes(prev => [note, ...prev])
      setNewContent('')
      setNewColor('yellow')
      setAdding(false)
    } finally {
      setLoading(false)
    }
  }

  async function deleteNote(id: string) {
    await fetch(`/api/sticky-notes/${id}`, { method: 'DELETE' })
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  return (
    <div className="card p-4 mb-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 text-left"
        >
          <span className="text-lg">📌</span>
          <h3 className="section-title mb-0">付箋メモ</h3>
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform ${open ? '' : '-rotate-90'}`}
          />
        </button>
        {open && (
          <button
            onClick={() => setAdding(a => !a)}
            className="flex items-center gap-1 text-xs text-green-700 hover:text-green-900 font-medium"
          >
            <Plus className="w-4 h-4" />
            追加
          </button>
        )}
      </div>

      {open && (
        <>
          {/* 追加フォーム */}
          {adding && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
              <textarea
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                placeholder="メモを入力..."
                rows={3}
                className="w-full text-sm border border-gray-300 rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                autoFocus
              />
              <div className="flex items-center justify-between">
                {/* カラー選択 */}
                <div className="flex items-center gap-1">
                  {COLOR_OPTIONS.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setNewColor(c.value)}
                      className={`w-6 h-6 rounded-full ${c.dot} border-2 transition-transform ${newColor === c.value ? 'border-gray-700 scale-125' : 'border-transparent'}`}
                      title={c.label}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setAdding(false); setNewContent('') }}
                    className="text-xs px-3 py-1 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={addNote}
                    disabled={loading || !newContent.trim()}
                    className="text-xs px-3 py-1 rounded-lg bg-green-700 text-white hover:bg-green-800 disabled:opacity-50"
                  >
                    貼る 📌
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 付箋一覧 */}
          {notes.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">
              📌 付箋がありません。「追加」で貼ってみよう！
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {notes.map(note => {
                const cs = getColorStyle(note.color)
                return (
                  <div
                    key={note.id}
                    className={`relative ${cs.bg} ${cs.border} border rounded-lg p-3 shadow-sm`}
                    style={{ minHeight: '80px' }}
                  >
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="absolute top-1.5 right-1.5 p-0.5 rounded hover:bg-black/10 text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <p className={`text-xs ${cs.text} whitespace-pre-wrap pr-4 leading-relaxed`}>
                      {note.content}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
