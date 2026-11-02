import React, { useEffect, useState } from 'react'
import { SyncService } from '../../services/syncService'
import type { SessionData } from '../../services/syncService'
import { Download, Share2, ArrowLeft, Sparkles, Check } from 'lucide-react'

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
    if (!data) return
    const a = document.createElement('a')
    a.href = data.compositeUrl
    a.download = `photobooth_strip_${sessionId}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleShare = async () => {
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
    <div className="w-full min-h-screen bg-[#0A0A0C] text-white p-4 sm:p-8 flex flex-col justify-between max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} />
          홈으로 돌아가기 Home
        </button>

        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-[#FF5252]" />
          <span className="text-xs font-bold text-white tracking-wider">인생네컷 · 4-CUT PHOTOBOOTH</span>
        </div>
      </div>

      {/* Main View Area */}
      <div className="my-8 flex-1 flex flex-col items-center justify-center">
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#FF5252] border-t-transparent animate-spin" />
            <p className="text-xs text-white/50">고화질 포토 스트립을 불러오는 중...</p>
          </div>
        ) : data ? (
          <div className="flex flex-col items-center gap-4">
            <div className="shadow-2xl rounded-2xl overflow-hidden max-h-[70vh] border border-white/15 bg-black">
              <img
                src={data.compositeUrl}
                alt="Retrieved Photo Strip"
                className="h-full max-h-[68vh] w-auto object-contain block"
              />
            </div>

            <div className="text-center">
              <h3 className="text-sm font-bold text-white">{data.frameName} · {data.koreanTitle}</h3>
              <p className="text-[11px] text-white/40 font-mono mt-0.5">Session: {sessionId}</p>
            </div>
          </div>
        ) : (
          <div className="text-center p-8 bg-white/5 rounded-3xl border border-white/10">
            <p className="text-sm text-white/70">해당 세션의 사진을 찾을 수 없습니다.</p>
          </div>
        )}
      </div>

      {/* Bottom Download and Share Actions */}
      <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={handleShare}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/10 transition-colors"
        >
          {copied ? <Check size={16} className="text-green-400" /> : <Share2 size={16} />}
          {copied ? '링크 복사됨 Copied' : '공유하기 Share'}
        </button>

        <button
          onClick={handleDownload}
          disabled={loading || !data}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[#FF5252] hover:bg-[#FF3838] disabled:opacity-40 text-white text-xs font-bold shadow-xl shadow-[#FF5252]/25 transition-all transform active:scale-95"
        >
          <Download size={16} />
          ⬇ 사진 다운로드 (Download Strip)
        </button>
      </div>
    </div>
  )
}
