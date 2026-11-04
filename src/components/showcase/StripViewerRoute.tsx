import React, { useEffect, useState, useRef } from 'react'
import { SyncService } from '../../services/syncService'
import type { SessionData } from '../../services/syncService'
import { Download, Share2, ArrowLeft, Check, Camera, Video, Film } from 'lucide-react'
import { sound } from '../../services/soundService'
import { LiveMotionReel } from '../booth/LiveMotionReel'

interface StripViewerRouteProps {
  sessionId: string
  onBack: () => void
}

export const StripViewerRoute: React.FC<StripViewerRouteProps> = ({ sessionId, onBack }) => {
  const [data, setData] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'strip' | 'video'>('strip')
  const [isDownloadingVideo, setIsDownloadingVideo] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    let active = true
    SyncService.fetchSession(sessionId).then(res => {
      if (active) {
        setData(res)
        setLoading(false)
        // If session has video, start on video tab or strip
        if (res?.videoUrl) {
          // Keep strip as initial or switchable
        }
      }
    })
    return () => {
      active = false
    }
  }, [sessionId])

  const handleDownloadStrip = () => {
    sound.playClick()
    if (!data) return
    const a = document.createElement('a')
    a.href = data.compositeUrl
    a.download = `photobooth_strip_${sessionId}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleDownloadVideo = async () => {
    sound.playClick()
    if (!data?.videoUrl) return

    setIsDownloadingVideo(true)
    try {
      const res = await fetch(data.videoUrl)
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const isMp4 = blob.type.includes('mp4') || data.videoUrl.endsWith('.mp4')
      const ext = isMp4 ? 'mp4' : 'webm'

      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `photobooth_bts_${sessionId}.${ext}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(blobUrl), 2000)
    } catch {
      // Direct fallback
      const a = document.createElement('a')
      a.href = data.videoUrl
      a.download = `photobooth_bts_${sessionId}.webm`
      a.target = '_blank'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } finally {
      setIsDownloadingVideo(false)
    }
  }

  const handleShare = async () => {
    sound.playClick()
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Korean 4-Cut Photobooth Strip & BTS Video',
          text: 'Check out my photobooth strip and behind-the-scenes video!',
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

  const hasVideo = Boolean(data?.videoUrl)

  return (
    <div className="w-full min-h-screen bg-[#FAF8F5] text-[#1C1917] p-4 sm:p-6 flex flex-col justify-between max-w-4xl mx-auto select-none">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-black/[0.06]">
        <button
          onClick={() => {
            sound.playClick()
            onBack()
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#F4F1EC] text-xs font-semibold text-[#78716C] hover:text-[#1C1917] border border-black/[0.06] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D]"
        >
          <ArrowLeft size={14} />
          <span>Back to Photobooth</span>
        </button>

        <div className="flex items-center gap-2">
          <Camera size={15} className="text-[#FF4D6D]" />
          <span className="text-xs font-semibold text-[#1C1917]">
            Korean 4-Cut Studio
          </span>
        </div>
      </div>

      {/* View Mode Toggle: Photo Strip vs BTS Video */}
      {!loading && data && (
        <div className="mt-4 flex items-center justify-center">
          <div className="flex items-center gap-1.5 p-1 bg-white rounded-2xl border border-black/[0.06] shadow-xs">
            <button
              onClick={() => {
                sound.playClick()
                setActiveTab('strip')
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D] ${
                activeTab === 'strip'
                  ? 'bg-[#FF4D6D] text-white shadow-xs'
                  : 'text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAF8F5]'
              }`}
            >
              <Film size={14} />
              <span>4-Cut Photo Strip</span>
            </button>

            <button
              onClick={() => {
                sound.playClick()
                setActiveTab('video')
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D] ${
                activeTab === 'video'
                  ? 'bg-[#FF4D6D] text-white shadow-xs'
                  : 'text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAF8F5]'
              }`}
            >
              <Video size={14} />
              <span>Short Video (BTS)</span>
              {hasVideo && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Main Display Area */}
      <div className="my-6 flex-1 flex flex-col items-center justify-center">
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-9 h-9 rounded-full border-2 border-[#FF4D6D] border-t-transparent animate-spin" />
            <p className="text-xs text-[#78716C]">Retrieving your photos &amp; video…</p>
          </div>
        ) : data ? (
          <div className="flex flex-col items-center gap-4 w-full">
            {activeTab === 'strip' ? (
              /* Photo Strip View */
              <div className="photo-card-shadow rounded-2xl overflow-hidden max-h-[68vh] border border-black/[0.06] bg-white animate-in fade-in duration-200">
                <img
                  src={data.compositeUrl}
                  alt="Korean 4-Cut Photo Strip"
                  className="h-full max-h-[66vh] w-auto object-contain block"
                />
              </div>
            ) : (
              /* Short Video (BTS) View */
              <div className="w-full max-w-md aspect-[4/3] rounded-2xl overflow-hidden border border-black/[0.06] bg-white shadow-sm relative flex items-center justify-center animate-in fade-in duration-200">
                {hasVideo ? (
                  <video
                    ref={videoRef}
                    src={data.videoUrl}
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover block"
                  />
                ) : data.photoUrls && data.photoUrls.length > 0 ? (
                  /* Fallback photo motion reel if direct video is unavailable */
                  <LiveMotionReel
                    photos={data.photoUrls.map((url, idx) => ({
                      id: `photo_${idx}`,
                      dataUrl: url,
                      index: idx,
                      timestamp: Date.now(),
                    }))}
                    frame={{
                      id: 'default',
                      name: data.frameName,
                      koreanTitle: data.koreanTitle,
                      category: 'Classic',
                      backgroundColor: '#121212',
                      captionColor: '#FFF',
                      gradientColors: ['#121212'],
                      themeStyle: 'classic',
                      englishTitle: data.frameName,
                      slotBorderColor: '#FFF',
                      slotBorderWidth: 4,
                      slotCornerRadius: 8,
                    }}
                  />
                ) : (
                  <div className="p-8 text-center text-[#78716C] text-xs">
                    <Video size={32} className="mx-auto mb-2 text-[#A8A29E]" />
                    <span>Video preview is preparing or unavailable for this session.</span>
                  </div>
                )}
              </div>
            )}

            {/* Session Metadata Label */}
            <div className="text-center">
              <h3 className="text-sm font-semibold text-[#1C1917] flex items-center justify-center gap-1.5">
                <span>{data.frameName}</span>
                <span className="text-xs text-[#78716C] font-normal">· {data.koreanTitle}</span>
              </h3>
            </div>
          </div>
        ) : (
          <div className="text-center p-8 bg-white rounded-2xl border border-black/[0.06] shadow-xs max-w-sm">
            <p className="text-sm text-[#1C1917] font-semibold">Photobooth strip not found</p>
            <p className="text-xs text-[#78716C] mt-1">
              Please check your QR code or scan again.
            </p>
          </div>
        )}
      </div>

      {/* Bottom Download & Share Action Bar */}
      <div className="pt-4 border-t border-black/[0.06] flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={handleShare}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-[#F4F1EC] text-[#1C1917] text-xs font-semibold border border-black/[0.06] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D]"
        >
          {copied ? <Check size={15} className="text-emerald-600" /> : <Share2 size={15} />}
          <span>{copied ? 'Link Copied' : 'Share'}</span>
        </button>

        <button
          onClick={handleDownloadStrip}
          disabled={loading || !data}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-white hover:bg-[#F4F1EC] disabled:opacity-40 text-[#1C1917] text-xs font-semibold border border-black/[0.06] shadow-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D]"
        >
          <Download size={15} className="text-[#FF4D6D]" />
          <span>Download Photo Strip</span>
        </button>

        {hasVideo && (
          <button
            onClick={handleDownloadVideo}
            disabled={loading || !hasVideo || isDownloadingVideo}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#FF4D6D] hover:bg-[#E11D48] disabled:opacity-40 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D]"
          >
            <Download size={15} />
            <span className="whitespace-nowrap">{isDownloadingVideo ? 'Downloading…' : 'Download Video (BTS)'}</span>
          </button>
        )}
      </div>
    </div>
  )
}
