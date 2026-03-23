'use client'

import { useState } from 'react'
import { MessageCircle, Send, X, CheckCircle, AlertCircle } from 'lucide-react'

interface LineSendButtonProps {
  candidateId: string
  candidateName: string
  hasLineId: boolean
}

type SendState = 'idle' | 'sending' | 'success' | 'error'

export function LineSendButton({
  candidateId,
  candidateName,
  hasLineId,
}: LineSendButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [state, setState] = useState<SendState>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  function openModal() {
    setIsOpen(true)
    setState('idle')
    setMessage('')
    setErrorMsg('')
  }

  function closeModal() {
    setIsOpen(false)
    setState('idle')
    setMessage('')
    setErrorMsg('')
  }

  async function handleSend() {
    if (!message.trim() || state === 'sending') return

    setState('sending')
    setErrorMsg('')

    try {
      const res = await fetch('/api/line/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId, message: message.trim() }),
      })

      const data = await res.json()

      if (res.ok) {
        setState('success')
        setMessage('')
        // 1.5秒後に自動クローズ
        setTimeout(() => closeModal(), 1500)
      } else {
        setState('error')
        setErrorMsg(data.error ?? 'エラーが発生しました')
      }
    } catch {
      setState('error')
      setErrorMsg('ネットワークエラーが発生しました')
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Ctrl+Enter または Cmd+Enter で送信
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* LINEで送信ボタン */}
      <button
        type="button"
        onClick={hasLineId ? openModal : undefined}
        disabled={!hasLineId}
        title={!hasLineId ? 'LINE IDが未設定です（編集画面で設定してください）' : 'LINEでメッセージを送信'}
        className={`btn-sm flex items-center gap-1.5 transition-colors ${
          hasLineId
            ? 'bg-[#06C755] hover:bg-[#05a848] text-white'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        <MessageCircle className="w-3.5 h-3.5" />
        LINEで送信
      </button>

      {/* 送信モーダル */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            {/* ヘッダー */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-[#06C755] rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{candidateName}</p>
                  <p className="text-xs text-gray-500">LINEメッセージを送信</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 本文 */}
            <div className="p-5 space-y-4">
              {state === 'success' ? (
                <div className="flex flex-col items-center py-6 gap-3 text-green-600">
                  <CheckCircle className="w-12 h-12" />
                  <p className="font-medium">送信しました</p>
                  <p className="text-sm text-gray-500">連絡履歴に自動記録されました</p>
                </div>
              ) : (
                <>
                  <div>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      rows={6}
                      className="form-textarea resize-none"
                      placeholder={`${candidateName} さんへのメッセージを入力...\n\n(Ctrl+Enter で送信)`}
                      autoFocus
                      disabled={state === 'sending'}
                    />
                    <p className="text-xs text-gray-400 mt-1 text-right">
                      {message.length} 文字
                    </p>
                  </div>

                  {state === 'error' && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">{errorMsg}</p>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="btn-secondary btn-sm"
                      disabled={state === 'sending'}
                    >
                      キャンセル
                    </button>
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={!message.trim() || state === 'sending'}
                      className="btn-sm flex items-center gap-1.5 bg-[#06C755] hover:bg-[#05a848] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {state === 'sending' ? '送信中...' : '送信する'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
