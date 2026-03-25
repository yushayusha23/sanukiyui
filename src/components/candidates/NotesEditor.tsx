'use client'

import { useState, useTransition } from 'react'
import { addNote, deleteNote, type NoteEntry } from '@/lib/actions/candidates'
import { Trash2, Plus } from 'lucide-react'

const AUTHORS = ['峠', '佐貫']

function formatAt(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${y}/${mo}/${day} ${h}:${m}`
}

export function NotesEditor({
  candidateId,
  initialNotes,
}: {
  candidateId: string
  initialNotes: NoteEntry[]
}) {
  const [notes, setNotes] = useState<NoteEntry[]>(initialNotes)
  const [text, setText] = useState('')
  const [author, setAuthor] = useState(AUTHORS[0])
  const [isPending, startTransition] = useTransition()

  function handleAdd() {
    if (!text.trim()) return
    const newEntry: NoteEntry = { text: text.trim(), at: new Date().toISOString(), by: author }
    setNotes((prev) => [...prev, newEntry])
    setText('')
    startTransition(() => addNote(candidateId, text.trim(), author))
  }

  function handleDelete(index: number) {
    setNotes((prev) => prev.filter((_, i) => i !== index))
    startTransition(() => deleteNote(candidateId, index))
  }

  return (
    <div>
      {/* 付箋一覧 */}
      {notes.length > 0 && (
        <div className="space-y-2 mb-3">
          {notes.map((n, i) => (
            <div
              key={i}
              className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 flex items-start gap-2 group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">{n.text}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {n.by && <span className="font-medium text-gray-500 mr-1.5">{n.by}</span>}
                  {n.at && formatAt(n.at)}
                </p>
              </div>
              <button
                onClick={() => handleDelete(i)}
                disabled={isPending}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400 flex-shrink-0 mt-0.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 入力エリア */}
      <div className="flex flex-col gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="付箋を追加..."
          rows={2}
          className="form-input text-sm resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAdd()
          }}
        />
        <div className="flex items-center gap-2">
          {/* 名前プリセット */}
          <div className="flex gap-1">
            {AUTHORS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAuthor(a)}
                className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                  author === a
                    ? 'bg-gray-700 text-white border-gray-700'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!text.trim() || isPending}
            className="btn-primary btn-sm flex items-center gap-1 ml-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            追加
          </button>
        </div>
      </div>
    </div>
  )
}
