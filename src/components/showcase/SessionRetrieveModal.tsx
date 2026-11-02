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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-[#141419] border border-white/10 rounded-2xl p-6 shadow-2xl">
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
          <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-[#FF385C]">
            <QrCode size={18} />
          </div>
          <h3 className="text-base font-bold text-white">
            Find Your Strip
          </h3>
        </div>
        <p className="text-xs text-white/50 mb-5">
          Enter your session ID or paste the photo link.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5">
              Session ID or URL
            </label>
            <input
              type="text"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              placeholder="e.g. session_1730000000000 or link"
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder-white/30 text-xs focus:outline-none focus:border-[#FF385C] transition-colors"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                sound.playClick()
                onClose()
              }}
              className="px-4 py-2.5 rounded-xl text-xs text-white/60 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!inputVal.trim()}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#FF385C] hover:bg-[#E02649] disabled:opacity-40 text-white text-xs font-bold transition-all cursor-pointer"
            >
              <Search size={14} />
              <span>View Strip</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
