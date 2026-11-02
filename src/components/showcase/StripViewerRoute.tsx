import React, { useEffect, useState } from 'react'
import { SyncService } from '../../services/syncService'
import type { SessionData } from '../../services/syncService'
import { Download, Share2, ArrowLeft, Check, Camera } from 'lucide-react'
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
          text: 'Check out my photobooth strip!',
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
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <button
          onClick={() => {
            sound.playClick()
            onBack()
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-white/70 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back to Home</span>
        </button>

        <div className="flex items-center gap-2">
          <Camera size={15} className="text-[#FF385C]" />
          <span className="text-xs font-bold text-white tracking-wider">
            Korean 4-Cut Strip
          </span>
        </div>
      </div>

      {/* Main View Area */}
      <div className="my-8 flex-1 flex flex-col items-center justify-center">
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#FF385C] border-t-transparent animate-spin" />
            <p className="text-xs text-white/50">Loading photo strip...</p>
          </div>
        ) : data ? (
          <div className="flex flex-col items-center gap-4">
            <div className="photo-card-shadow rounded-2xl overflow-hidden max-h-[70vh] border border-white/10 bg-[#0E0E12]">
              <img
                src={data.compositeUrl}
                alt="Retrieved Photo Strip"
                className="h-full max-h-[68vh] w-auto object-contain block"
              />
            </div>

            <div className="text-center">
              <h3 className="text-sm font-bold text-white">
                {data.frameName}
              </h3>
              <p className="text-xs text-white/40 mt-0.5">Session: {sessionId}</p>
            </div>
          </div>
        ) : (
          <div className="text-center p-8 bg-white/5 rounded-2xl border border-white/10">
            <p className="text-sm text-white/70">Photo strip not found.</p>
          </div>
        )}
      </div>

      {/* Bottom Download and Share Actions */}
      <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={handleShare}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
        >
          {copied ? <Check size={15} className="text-emerald-400" /> : <Share2 size={15} />}
          <span>{copied ? 'Link Copied' : 'Share'}</span>
        </button>

        <button
          onClick={handleDownload}
          disabled={loading || !data}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-[#FF385C] hover:bg-[#E02649] disabled:opacity-40 text-white text-xs font-bold shadow-xl shadow-[#FF385C]/20 transition-all active:scale-95 cursor-pointer"
        >
          <Download size={15} />
          <span>Download Strip</span>
        </button>
      </div>
    </div>
  )
}
