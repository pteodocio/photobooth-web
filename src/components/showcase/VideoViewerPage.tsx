import React, { useEffect, useState, useRef } from 'react'
import { SyncService } from '../../services/syncService'
import {
  Download,
  ArrowLeft,
  Check,
  Camera,
  Play,
  Pause,
  Volume2,
  VolumeX,
  AlertCircle,
  Film,
  Video,
  Share2,
} from 'lucide-react'
import { sound } from '../../services/soundService'

interface VideoViewerPageProps {
  token: string
  onBack?: () => void
}

export const VideoViewerPage: React.FC<VideoViewerPageProps> = ({ token, onBack }) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [compositeUrl, setCompositeUrl] = useState<string | null>(null)
  const [title, setTitle] = useState<string>('Your Photobooth Strip & Video')
  const [passcode, setPasscode] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  // Download states
  const [isDownloadingVideo, setIsDownloadingVideo] = useState<boolean>(false)
  const [downloadVideoSuccess, setDownloadVideoSuccess] = useState<boolean>(false)
  const [isDownloadingStrip, setIsDownloadingStrip] = useState<boolean>(false)
  const [downloadStripSuccess, setDownloadStripSuccess] = useState<boolean>(false)
  const [copiedLink, setCopiedLink] = useState<boolean>(false)

  // Player controls
  const [isPlaying, setIsPlaying] = useState<boolean>(true)
  const [isMuted, setIsMuted] = useState<boolean>(true)
  const [error, setError] = useState<boolean>(false)

  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    let active = true

    async function loadMedia() {
      setLoading(true)
      setError(false)
      try {
        const result = await SyncService.fetchVideo(token)
        if (active) {
          if (result && (result.videoUrl || result.compositeUrl)) {
            if (result.videoUrl) setVideoUrl(result.videoUrl)
            if (result.compositeUrl) setCompositeUrl(result.compositeUrl)
            if (result.title) setTitle(result.title)
            if (result.passcode) setPasscode(result.passcode)
          } else {
            setError(true)
          }
          setLoading(false)
        }
      } catch {
        if (active) {
          setError(true)
          setLoading(false)
        }
      }
    }

    loadMedia()
    return () => {
      active = false
    }
  }, [token])

  const togglePlay = () => {
    sound.playClick()
    if (!videoRef.current) return
    if (videoRef.current.paused) {
      videoRef.current.play()
      setIsPlaying(true)
    } else {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }

  const toggleMute = () => {
    sound.playClick()
    if (!videoRef.current) return
    videoRef.current.muted = !videoRef.current.muted
    setIsMuted(videoRef.current.muted)
  }

  const handleDownloadStrip = async () => {
    sound.playClick()
    if (!compositeUrl || isDownloadingStrip) return

    setIsDownloadingStrip(true)
    setDownloadStripSuccess(false)

    try {
      const response = await fetch(compositeUrl)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)

      const anchor = document.createElement('a')
      anchor.href = blobUrl
      anchor.download = `photobooth_strip_${passcode || 'print'}.png`
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)

      setDownloadStripSuccess(true)
      setTimeout(() => setDownloadStripSuccess(false), 2500)
      setTimeout(() => URL.revokeObjectURL(blobUrl), 3000)
    } catch {
      const anchor = document.createElement('a')
      anchor.href = compositeUrl
      anchor.download = 'photobooth_strip.png'
      anchor.target = '_blank'
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      setDownloadStripSuccess(true)
      setTimeout(() => setDownloadStripSuccess(false), 2500)
    } finally {
      setIsDownloadingStrip(false)
    }
  }

  const handleDownloadVideo = async () => {
    sound.playClick()
    if (!videoUrl || isDownloadingVideo) return

    setIsDownloadingVideo(true)
    setDownloadVideoSuccess(false)

    try {
      const response = await fetch(videoUrl)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const isMp4 = blob.type.includes('mp4') || videoUrl.endsWith('.mp4')
      const ext = isMp4 ? 'mp4' : 'webm'

      const anchor = document.createElement('a')
      anchor.href = blobUrl
      anchor.download = `photobooth_bts_${passcode || 'video'}.${ext}`
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)

      setDownloadVideoSuccess(true)
      setTimeout(() => setDownloadVideoSuccess(false), 2500)
      setTimeout(() => URL.revokeObjectURL(blobUrl), 3000)
    } catch {
      const anchor = document.createElement('a')
      anchor.href = videoUrl
      anchor.download = 'photobooth_video.webm'
      anchor.target = '_blank'
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      setDownloadVideoSuccess(true)
      setTimeout(() => setDownloadVideoSuccess(false), 2500)
    } finally {
      setIsDownloadingVideo(false)
    }
  }

  const handleShare = async () => {
    sound.playClick()
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${title} - Korean 4-Cut Studio`,
          text: 'Check out my photobooth strip and behind-the-scenes video!',
          url: window.location.href,
        })
        return
      } catch {
        // Fallback to clipboard
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  return (
    <main className="min-h-screen bg-[#08080B] text-[#F3F3F6] flex flex-col justify-between p-4 sm:p-6 max-w-6xl mx-auto select-none">
      {/* Top Studio Brand Header */}
      <header className="flex items-center justify-between pb-4 border-b border-white/10 w-full gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={() => {
                sound.playClick()
                onBack()
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white/70 hover:text-white border border-white/10 transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                {title}
              </h1>
              {passcode && (
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/10 font-mono text-xs font-semibold text-white/90">
                  CODE: {passcode}
                </span>
              )}
            </div>
            <p className="text-[11px] text-white/40">Korean 4-Cut Studio Memories</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/80 hover:text-white transition-colors cursor-pointer"
            title="Share or Copy Link"
          >
            {copiedLink ? (
              <>
                <Check size={13} className="text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Share2 size={13} />
                <span className="hidden sm:inline">Share</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white/60">
            <Camera size={13} className="text-[#FF385C]" />
            <span className="hidden sm:inline">Studio</span>
          </div>
        </div>
      </header>

      {/* Main Side-by-Side Media Stage */}
      <div className="flex-1 my-auto py-6 sm:py-8 w-full flex flex-col justify-center">
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-24">
            <div className="w-10 h-10 rounded-full border-2 border-[#FF385C] border-t-transparent animate-spin" />
            <p className="text-xs text-white/60 font-medium">Opening your strip & video...</p>
          </div>
        ) : error || (!videoUrl && !compositeUrl) ? (
          <div className="w-full max-w-sm mx-auto p-6 rounded-3xl bg-[#111116] border border-white/10 text-center shadow-xl">
            <AlertCircle size={32} className="mx-auto mb-3 text-[#FF385C]" />
            <h2 className="text-sm font-bold text-white">Video Not Found</h2>
            <p className="text-xs text-white/50 mt-1">
              Please check your 4-digit code or QR code and try again.
            </p>
            {onBack && (
              <button
                onClick={onBack}
                className="mt-4 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Return to Studio
              </button>
            )}
          </div>
        ) : (
          <div
            className={`w-full grid gap-6 sm:gap-8 items-start ${
              compositeUrl && videoUrl
                ? 'grid-cols-1 md:grid-cols-2'
                : 'grid-cols-1 max-w-lg mx-auto'
            }`}
          >
            {/* COLUMN 1: Photo Strip + Download Button */}
            {compositeUrl && (
              <section className="flex flex-col items-center gap-3 w-full">
                <div className="w-full flex items-center justify-between px-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-white tracking-wide uppercase">
                    <Film size={14} className="text-[#FF385C]" />
                    <span>Photo Strip</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/60 font-medium">
                    Print Ready
                  </span>
                </div>

                {/* Strip Container */}
                <div className="w-full flex items-center justify-center p-3 sm:p-4 rounded-3xl bg-[#0E0E14] border border-white/10 shadow-2xl min-h-[300px]">
                  <img
                    src={compositeUrl}
                    alt="Photo Strip"
                    className="max-h-[58vh] sm:max-h-[64vh] w-auto object-contain rounded-xl block photo-card-shadow"
                  />
                </div>

                {/* Download Strip Button */}
                <button
                  type="button"
                  onClick={handleDownloadStrip}
                  disabled={isDownloadingStrip}
                  className={`w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl font-bold text-xs sm:text-sm shadow-xl transition-all transform active:scale-95 cursor-pointer ${
                    downloadStripSuccess
                      ? 'bg-emerald-500 text-white shadow-emerald-500/25'
                      : 'bg-[#FF385C] hover:bg-[#E02649] text-white shadow-[#FF385C]/30'
                  } disabled:opacity-60`}
                >
                  {isDownloadingStrip ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Downloading Strip...</span>
                    </>
                  ) : downloadStripSuccess ? (
                    <>
                      <Check size={17} strokeWidth={3} />
                      <span>Strip Downloaded!</span>
                    </>
                  ) : (
                    <>
                      <Download size={17} strokeWidth={2.5} />
                      <span>Download Strip</span>
                    </>
                  )}
                </button>
              </section>
            )}

            {/* COLUMN 2: BTS Video + Download Button */}
            {videoUrl && (
              <section className="flex flex-col items-center gap-3 w-full">
                <div className="w-full flex items-center justify-between px-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-white tracking-wide uppercase">
                    <Video size={14} className="text-[#00F0FF]" />
                    <span>Behind-the-Scenes Video</span>
                  </div>
                  <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live Motion
                  </span>
                </div>

                {/* Video Player Container */}
                <div className="w-full flex items-center justify-center p-3 sm:p-4 rounded-3xl bg-[#0E0E14] border border-white/10 shadow-2xl min-h-[300px]">
                  <div className="relative max-h-[58vh] sm:max-h-[64vh] w-auto flex items-center justify-center rounded-xl overflow-hidden group">
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      autoPlay
                      loop
                      muted={isMuted}
                      playsInline
                      className="max-h-[58vh] sm:max-h-[64vh] w-auto object-contain rounded-xl block photo-card-shadow cursor-pointer"
                      onClick={togglePlay}
                    />

                    {/* Minimalist In-Video Floating Controls */}
                    <div className="absolute bottom-3 inset-x-3 flex items-center justify-between pointer-events-none">
                      <button
                        type="button"
                        onClick={togglePlay}
                        className="pointer-events-auto p-2 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md text-white border border-white/10 transition-transform active:scale-90 cursor-pointer"
                        title={isPlaying ? 'Pause' : 'Play'}
                      >
                        {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                      </button>

                      <div className="px-3 py-1 rounded-xl bg-black/60 backdrop-blur-md text-[11px] font-semibold text-white/90 border border-white/10 truncate max-w-[180px]">
                        Live Motion
                      </div>

                      <button
                        type="button"
                        onClick={toggleMute}
                        className="pointer-events-auto p-2 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md text-white border border-white/10 transition-transform active:scale-90 cursor-pointer"
                        title={isMuted ? 'Unmute' : 'Mute'}
                      >
                        {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Download Video Button */}
                <button
                  type="button"
                  onClick={handleDownloadVideo}
                  disabled={isDownloadingVideo}
                  className={`w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl font-bold text-xs sm:text-sm shadow-xl transition-all transform active:scale-95 cursor-pointer ${
                    downloadVideoSuccess
                      ? 'bg-emerald-500 text-white shadow-emerald-500/25'
                      : 'bg-white/10 hover:bg-white/15 border border-white/10 text-white hover:text-white'
                  } disabled:opacity-60`}
                >
                  {isDownloadingVideo ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Downloading Video...</span>
                    </>
                  ) : downloadVideoSuccess ? (
                    <>
                      <Check size={17} strokeWidth={3} />
                      <span>Video Downloaded!</span>
                    </>
                  ) : (
                    <>
                      <Download size={17} strokeWidth={2.5} />
                      <span>Download Video</span>
                    </>
                  )}
                </button>
              </section>
            )}
          </div>
        )}
      </div>

      {/* Clean Footer Note */}
      <footer className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-white/40">
        <span>Korean 4-Cut Studio · High Resolution Prints & Behind-the-Scenes Video</span>
        <span>Tap Download buttons to save directly to your camera roll or device</span>
      </footer>
    </main>
  )
}
