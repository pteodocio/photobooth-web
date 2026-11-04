import React, { useEffect, useState, useRef } from 'react'
import { SyncService } from '../../services/syncService'
import { Download, ArrowLeft, Check, Camera, Play, Pause, Volume2, VolumeX, AlertCircle } from 'lucide-react'
import { sound } from '../../services/soundService'

interface VideoViewerPageProps {
  token: string
  onBack?: () => void
}

export const VideoViewerPage: React.FC<VideoViewerPageProps> = ({ token, onBack }) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [title, setTitle] = useState<string>('Your Photobooth Video')
  const [loading, setLoading] = useState<boolean>(true)
  const [isDownloading, setIsDownloading] = useState<boolean>(false)
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false)
  const [isPlaying, setIsPlaying] = useState<boolean>(true)
  const [isMuted, setIsMuted] = useState<boolean>(true)
  const [error, setError] = useState<boolean>(false)

  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    let active = true

    async function loadVideo() {
      setLoading(true)
      setError(false)
      try {
        const result = await SyncService.fetchVideo(token)
        if (active) {
          if (result && result.videoUrl) {
            setVideoUrl(result.videoUrl)
            if (result.title) setTitle(result.title)
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

    loadVideo()
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

  const handleDownload = async () => {
    sound.playClick()
    if (!videoUrl || isDownloading) return

    setIsDownloading(true)
    setDownloadSuccess(false)

    try {
      const response = await fetch(videoUrl)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const isMp4 = blob.type.includes('mp4') || videoUrl.endsWith('.mp4')
      const ext = isMp4 ? 'mp4' : 'webm'

      const anchor = document.createElement('a')
      anchor.href = blobUrl
      anchor.download = `photobooth_video.${ext}`
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)

      setDownloadSuccess(true)
      setTimeout(() => setDownloadSuccess(false), 2500)
      setTimeout(() => URL.revokeObjectURL(blobUrl), 3000)
    } catch {
      // Fallback direct anchor click
      const anchor = document.createElement('a')
      anchor.href = videoUrl
      anchor.download = 'photobooth_video.webm'
      anchor.target = '_blank'
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      setDownloadSuccess(true)
      setTimeout(() => setDownloadSuccess(false), 2500)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#08080B] text-[#F3F3F6] flex flex-col justify-between p-4 sm:p-6 max-w-xl mx-auto select-none">
      {/* Top Studio Brand Header */}
      <header className="flex items-center justify-between pb-3 border-b border-white/10 w-full">
        {onBack ? (
          <button
            onClick={() => {
              sound.playClick()
              onBack()
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white/70 hover:text-white border border-white/10 transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Home</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#141419] border border-white/10 flex items-center justify-center font-bold text-[#FF385C] text-xs">
              4C
            </div>
            <div>
              <h1 className="text-xs font-bold text-white tracking-wide uppercase leading-tight">
                Korean 4-Cut
              </h1>
              <p className="text-[10px] text-white/40">Studio Reel</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-white/70">
          <Camera size={12} className="text-[#FF385C]" />
          <span>Photobooth Video</span>
        </div>
      </header>

      {/* Main Video View Area */}
      <div className="my-auto py-6 flex flex-col items-center justify-center w-full">
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <div className="w-10 h-10 rounded-full border-2 border-[#FF385C] border-t-transparent animate-spin" />
            <p className="text-xs text-white/60 font-medium">Opening your video...</p>
          </div>
        ) : error || !videoUrl ? (
          <div className="w-full max-w-sm p-6 rounded-2xl bg-[#111116] border border-white/10 text-center shadow-xl">
            <AlertCircle size={32} className="mx-auto mb-3 text-[#FF385C]" />
            <h2 className="text-sm font-bold text-white">Video Not Found</h2>
            <p className="text-xs text-white/50 mt-1">
              Please check your QR code or scan again from the photobooth print.
            </p>
            {onBack && (
              <button
                onClick={onBack}
                className="mt-4 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Return to Studio
              </button>
            )}
          </div>
        ) : (
          <div className="w-full flex flex-col items-center gap-5">
            {/* 4:3 Korean Photobooth Video Frame */}
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-black border border-white/15 shadow-2xl group">
              <video
                ref={videoRef}
                src={videoUrl}
                autoPlay
                loop
                muted={isMuted}
                playsInline
                className="w-full h-full object-cover block cursor-pointer"
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
                  {title}
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

            {/* The Dedicated Download Button */}
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className={`w-full max-w-sm flex items-center justify-center gap-2.5 py-4 px-8 rounded-2xl font-bold text-sm shadow-xl transition-all transform active:scale-95 cursor-pointer ${
                downloadSuccess
                  ? 'bg-emerald-500 text-white shadow-emerald-500/25'
                  : 'bg-[#FF385C] hover:bg-[#E02649] text-white shadow-[#FF385C]/30'
              } disabled:opacity-60`}
            >
              {isDownloading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Downloading Video...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <Check size={18} strokeWidth={3} />
                  <span>Video Downloaded!</span>
                </>
              ) : (
                <>
                  <Download size={18} strokeWidth={2.5} />
                  <span>Download Video</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Clean Footer Note */}
      <footer className="pt-3 border-t border-white/10 text-center text-[11px] text-white/40">
        <span>Tap video to pause · Tap Download Video to save to your device</span>
      </footer>
    </main>
  )
}
