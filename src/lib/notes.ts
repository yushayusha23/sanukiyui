export type NoteEntry = { text: string; at: string; by: string }

export function parseNotes(raw: string | null): NoteEntry[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
  } catch {}
  // レガシー文字列はそのまま1エントリとして扱う
  return [{ text: raw, at: '', by: '' }]
}
