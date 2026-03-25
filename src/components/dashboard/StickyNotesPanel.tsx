'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, X, ChevronDown, Check } from 'lucide-react'

type Note = {
  id: string
  content: string
  color: string
  author: string
  createdAt: string
}

type EditState = {
  id: string
  content: string
  color: string
  author: string
}

const COLOR_OPTIONS = [
  { value: 'yellow', bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-900', dot: 'bg-yellow-400' },
  { value: 'green',  bg: 'bg-green-100',  border: 'border-green-300',  text: 'text-green-900',  dot: 'bg-green-400' },
  { value: 'pink',   bg: 'bg-pink-100',   border: 'border-pink-300',   text: 'text-pink-900',   dot: 'bg-pink-400' },
  { value: 'blue',   bg: 'bg-blue-100',   border: 'border-blue-300',   text: 'text-blue-900',   dot: 'bg-blue-400' },
]

const AUTHORS = ['峠', '佐貫']

function getColorStyle(color: string) {
  return COLOR_OPTIONS.find(c => c.value === color) ?? COLOR_OPTIONS[0]
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${mo}/${day} ${h}:${m}`
}

export function StickyNotesPanel() {
  const [notes, setNotes] = useState<Note[]>([])
  const [open, setOpen] = useState(true)
  const [adding, setAdding] = useState(false)
  const [newContent, setNewContent] = useState('')
  const [newColor, setNewColor] = useState('yellow')
  const [newAuthor, setNewAuthor] = useState(AUTHORS[0])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<EditState | null>(null)

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
        body: JSON.stringify({ content: newContent, color: newColor, author: newAuthor }),
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

  async function saveEdit() {
    if (!editing || !editing.content.trim()) return
    const res = await fetch(`/api/sticky-notes/${editing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: editing.content, color: editing.color, author: editing.author }),
    })
    const updated = await res.json()
    setNotes(prev => prev.map(n => n.id === editing.id ? { ...n, ...updated } : n))
    setEditing(null)
  }

  async function deleteNote(id: string) {
    await fetch(`/api/sticky-notes/${id}`, { method: 'DELETE' })
    setNotes(prev => prev.filter(n => n.id !== id))
    if (editing?.id === id) setEditing(null)
  }

  return (
    <div className="card p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 text-left">
          <span className="text-lg">📌</span>
          <h3 className="section-title mb-0">付箋メモ</h3>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? '' : '-rotate-90'}`} />
        </button>
        {open && (
          <button
            onClick={() => setAdding(a => !a)}
            className="flex items-center gap-1 text-xs text-green-700 hover:text-green-900 font-medium"
          >
            <Plus className="w-4 h-4" />追加
          </button>
        )}
      </div>

      {open && (
        <>
          {/* 新規追加フォーム */}
          {adding && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
              <textarea
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                placeholder="メモを入力..."
                rows={3}
                className="w-full text-sm border border-gray-300 rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addNote() }}
              />
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1">
                  {COLOR_OPTIONS.map(c => (
                    <button key={c.value} onClick={() => setNewColor(c.value)}
                      className={`w-6 h-6 rounded-full ${c.dot} border-2 transition-transform ${newColor === c.value ? 'border-gray-700 scale-125' : 'border-transparent'}`} />
                  ))}
                </div>
                <div className="flex gap-1">
                  {AUTHORS.map(a => (
                    <button key={a} onClick={() => setNewAuthor(a)}
                      className={`px-2.5 py-0.5 rounded text-xs font-medium border transition-colors ${newAuthor === a ? 'bg-gray-700 text-white border-gray-700' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}>
                      {a}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 ml-auto">
                  <button onClick={() => { setAdding(false); setNewContent('') }}
                    className="text-xs px-3 py-1 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100">
                    キャンセル
                  </button>
                  <button onClick={addNote} disabled={loading || !newContent.trim()}
                    className="text-xs px-3 py-1 rounded-lg bg-green-700 text-white hover:bg-green-800 disabled:opacity-50">
                    貼る 📌
                  </button>
                </div>
              </div>
            </div>
          )}

          {notes.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">📌 付箋がありません。「追加」で貼ってみよう！</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {notes.map(note => {
                const isEditing = editing?.id === note.id
                const cs = getColorStyle(isEditing ? editing.color : note.color)

                return (
                  <div key={note.id}
                    className={`relative flex flex-col ${cs.bg} ${cs.border} border rounded-lg p-3 shadow-sm transition-shadow ${isEditing ? 'ring-2 ring-gray-400' : ''}`}
                    style={{ minHeight: '80px' }}
                  >
                    {isEditing ? (
                      /* 編集モード */
                      <>
                        <textarea
                          value={editing.content}
                          onChange={e => setEditing(prev => prev ? { ...prev, content: e.target.value } : prev)}
                          rows={3}
                          autoFocus
                          className={`w-full text-xs ${cs.text} bg-transparent resize-none focus:outline-none leading-relaxed flex-1`}
                          onKeyDown={e => { if (e.key === 'Escape') setEditing(null) }}
                        />
                        <div className="mt-2 space-y-1.5">
                          {/* カラー変更 */}
                          <div className="flex items-center gap-1">
                            {COLOR_OPTIONS.map(c => (
                              <button key={c.value}
                                onClick={() => setEditing(prev => prev ? { ...prev, color: c.value } : prev)}
                                className={`w-4 h-4 rounded-full ${c.dot} border transition-transform ${editing.color === c.value ? 'border-gray-600 scale-125' : 'border-transparent'}`} />
                            ))}
                          </div>
                          {/* 名前変更 */}
                          <div className="flex gap-1">
                            {AUTHORS.map(a => (
                              <button key={a}
                                onClick={() => setEditing(prev => prev ? { ...prev, author: a } : prev)}
                                className={`px-1.5 py-0 rounded text-[10px] font-medium border ${editing.author === a ? 'bg-gray-700 text-white border-gray-700' : 'bg-white/50 text-gray-500 border-gray-300'}`}>
                                {a}
                              </button>
                            ))}
                          </div>
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => setEditing(null)}
                              className="text-[10px] px-2 py-0.5 rounded border border-gray-300 text-gray-500 hover:bg-gray-100">
                              キャンセル
                            </button>
                            <button onClick={saveEdit}
                              className="text-[10px] px-2 py-0.5 rounded bg-green-700 text-white hover:bg-green-800 flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5" />保存
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      /* 表示モード */
                      <>
                        <button
                          onClick={() => deleteNote(note.id)}
                          className="absolute top-1.5 right-1.5 p-0.5 rounded hover:bg-black/10 text-gray-500 hover:text-gray-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <p
                          onClick={() => setEditing({ id: note.id, content: note.content, color: note.color, author: note.author })}
                          className={`text-xs ${cs.text} whitespace-pre-wrap pr-4 leading-relaxed flex-1 cursor-pointer`}
                        >
                          {note.content}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-2">
                          {note.author && <span className="font-medium mr-1">{note.author}</span>}
                          {note.createdAt && formatDate(note.createdAt)}
                        </p>
                      </>
                    )}
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
