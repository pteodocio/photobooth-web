import React, { useState } from 'react'
import { Search, X, QrCode } from 'lucide-react'
import { sound } from '../../services/soundService'

interface SessionRetrieveModalProps {
  isOpen: boolean
  onClose: () => void
  onRetrieve: (sessionId: string) => void
}

export const SessionRetrieveModal: React.FC<SessionRetrieveModalProps> = ({
  isOpen,
  onClose,
  onRetrieve,
}) => {
  const [inputVal, setInputVal] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputVal.trim()) return
    sound.playClick()

    // Extract session id if full URL was pasted
    let cleanId = inputVal.trim()
    if (cleanId.includes('?s=')) {
      cleanId = cleanId.split('?s=')[1].split('&')[0]
    }
    onRetrieve(cleanId)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md bg-[#121217] border border-[#262635] rounded-3xl p-6 shadow-2xl">
        <button
          onClick={() => {
            sound.playClick()
            onClose()
          }}
          className="absolute top-4 right-4 text-white/50 hover:text-white cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-2.5 rounded-xl bg-[#FF385C]/10 border border-[#FF385C]/30 text-[#FF385C]">
            <QrCode size={18} />
          </div>
          <h3 className="text-base font-bold text-white font-sans">
            사진 스트립 찾기 Find My Strip
          </h3>
        </div>
        <p className="text-xs text-[#808092] mb-5 font-mono">
          포토부스 영수증 QR 링크 또는 핀 코드를 입력하세요.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-mono font-semibold text-white/70 mb-1.5">
              세션 코드 또는 URL (Session ID)
            </label>
            <input
              type="text"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              placeholder="예: session_1730000000000 또는 https://photobooth.app/strip?s=..."
              className="w-full px-4 py-3 rounded-xl bg-[#0A0A0D] border border-[#262635] text-white placeholder-white/30 text-xs font-mono focus:outline-none focus:border-[#FF385C] transition-colors"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => {
                sound.playClick()
                onClose()
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-mono text-white/60 hover:text-white cursor-pointer"
            >
              취소 Cancel
            </button>
            <button
              type="submit"
              disabled={!inputVal.trim()}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#FF385C] hover:bg-[#E02649] disabled:opacity-40 text-white text-xs font-mono font-bold tracking-wide shadow-lg shadow-[#FF385C]/25 transition-all cursor-pointer"
            >
              <Search size={14} />
              스트립 열기 View
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
