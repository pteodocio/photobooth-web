import React, { useEffect, useState } from 'react'
import { SyncService } from '../../services/syncService'
import type { SessionData } from '../../services/syncService'
import { Download, Share2, ArrowLeft, Check, Film } from 'lucide-react'
import { sound } from '../../services/soundService'

interface StripViewerRouteProps {
  sessionId: string
  onBack: () => void
}

export const StripViewerRoute: React.FC<StripViewerRouteProps> = ({ sessionId, onBack }) => {
  const [data, setData] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let active = true
    SyncService.fetchSession(sessionId).then(res => {
      if (active) {
        setData(res)
        setLoading(false)
      }
    })
    return () => {
      active = false
    }
  }, [sessionId])

  const handleDownload = () => {
    sound.playClick()
    if (!data) return
    const a = document.createElement('a')
    a.href = data.compositeUrl
    a.download = `photobooth_strip_${sessionId}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleShare = async () => {
    sound.playClick()
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Korean 4-Cut Photobooth Strip',
          text: '인생네컷 포토 스트립을 확인하세요!',
          url: window.location.href,
        })
      } catch {
        // User cancelled share
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="w-full min-h-screen bg-[#09090C] text-[#F3F3F6] p-4 sm:p-8 flex flex-col justify-between max-w-4xl mx-auto select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#1C1C26]">
        <button
          onClick={() => {
            sound.playClick()
            onBack()
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#14141B] hover:bg-[#1C1C24] text-xs font-mono font-semibold text-white/70 hover:text-white border border-[#23232E] transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>홈으로 돌아가기 Home</span>
        </button>

        <div className="flex items-center gap-2">
          <Film size={15} className="text-[#FF385C]" />
          <span className="text-xs font-mono font-bold text-white tracking-wider">
            인생네컷 · 4-CUT RETRIEVAL
          </span>
        </div>
      </div>

      {/* Main View Area */}
      <div className="my-8 flex-1 flex flex-col items-center justify-center">
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#FF385C] border-t-transparent animate-spin" />
            <p className="text-xs font-mono text-white/50">고화질 포토 스트립을 불러오는 중...</p>
          </div>
        ) : data ? (
          <div className="flex flex-col items-center gap-4">
            <div className="photo-card-shadow rounded-2xl overflow-hidden max-h-[70vh] border border-[#242432] bg-[#0E0E12]">
              <img
                src={data.compositeUrl}
                alt="Retrieved Photo Strip"
                className="h-full max-h-[68vh] w-auto object-contain block"
              />
            </div>

            <div className="text-center">
              <h3 className="text-sm font-bold text-white font-sans">
                {data.frameName} · {data.koreanTitle}
              </h3>
              <p className="text-[11px] text-[#7A7A8A] font-mono mt-0.5">Session: {sessionId}</p>
            </div>
          </div>
        ) : (
          <div className="text-center p-8 bg-[#121217] rounded-3xl border border-[#23232E]">
            <p className="text-sm text-white/70 font-mono">해당 세션의 사진을 찾을 수 없습니다.</p>
          </div>
        )}
      </div>

      {/* Bottom Download and Share Actions */}
      <div className="pt-4 border-t border-[#1C1C26] flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={handleShare}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#14141B] hover:bg-[#1E1E28] text-white text-xs font-mono font-bold border border-[#242432] transition-colors cursor-pointer"
        >
          {copied ? <Check size={15} className="text-emerald-400" /> : <Share2 size={15} />}
          <span>{copied ? '링크 복사됨 Copied' : '공유하기 Share'}</span>
        </button>

        <button
          onClick={handleDownload}
          disabled={loading || !data}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[#FF385C] hover:bg-[#E02649] disabled:opacity-40 text-white text-xs font-mono font-bold tracking-wide shadow-xl shadow-[#FF385C]/25 transition-all transform active:scale-95 cursor-pointer"
        >
          <Download size={15} />
          <span>사진 다운로드 (Download Strip)</span>
        </button>
      </div>
    </div>
  )
}
