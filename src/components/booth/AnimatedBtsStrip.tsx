import React, { useRef, useState, useEffect } from 'react'
import type { CapturedPhoto, FrameTemplate, LayoutTypeConfig } from '../../core/types'
import { getCssFilter } from '../../core/filters'
import { Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles } from 'lucide-react'
import { sound } from '../../services/soundService'

export interface AnimatedBtsStripProps {
  photos: CapturedPhoto[]
  frame: FrameTemplate
  layout: LayoutTypeConfig
  filter?: string
  filterIntensity?: number
  stampText?: string
  dateString?: string
  passcode?: string
  className?: string
}

export const AnimatedBtsStrip: React.FC<AnimatedBtsStripProps> = ({
  photos,
  frame,
  layout,
  filter = 'none',
  filterIntensity = 1.0,
  stampText,
  dateString,
  passcode,
  className = '',
}) => {
  const isSixCut = layout.id === 'sixCut'
  const slotCount = isSixCut ? 6 : 4
  const activeCssFilter = getCssFilter(filter, filterIntensity)

  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(true)
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])

  // Ensure all videos play simultaneously when mounted
  useEffect(() => {
    videoRefs.current.forEach(v => {
      if (v) {
        v.muted = isMuted
        if (isPlaying) {
          try {
            const p = v.play()
            if (p && typeof p.catch === 'function') {
              p.catch(() => {})
            }
          } catch {}
        } else {
          v.pause()
        }
      }
    })
  }, [isPlaying, isMuted, photos])

  const handleTogglePlay = () => {
    sound.playClick()
    const nextPlaying = !isPlaying
    setIsPlaying(nextPlaying)
    videoRefs.current.forEach(v => {
      if (v) {
        if (nextPlaying) {
          try {
            const p = v.play()
            if (p && typeof p.catch === 'function') {
              p.catch(() => {})
            }
          } catch {}
        } else {
          v.pause()
        }
      }
    })
  }

  const handleReplay = () => {
    sound.playClick()
    setIsPlaying(true)
    videoRefs.current.forEach(v => {
      if (v) {
        v.currentTime = 0
        try {
          const p = v.play()
          if (p && typeof p.catch === 'function') {
            p.catch(() => {})
          }
        } catch {}
      }
    })
  }

  const handleToggleMute = () => {
    sound.playClick()
    const nextMuted = !isMuted
    setIsMuted(nextMuted)
    videoRefs.current.forEach(v => {
      if (v) {
        v.muted = nextMuted
      }
    })
  }

  const backgroundStyle =
    frame.gradientColors && frame.gradientColors.length >= 2
      ? { background: `linear-gradient(to bottom, ${frame.gradientColors.join(', ')})` }
      : { backgroundColor: frame.backgroundColor || '#141419' }

  const todayStr = dateString || new Date().toISOString().slice(0, 10).replace(/-/g, '.')
  const displayPhotos = photos.slice(0, slotCount)

  return (
    <div className={`flex flex-col items-center gap-3 w-full ${className}`}>
      {/* Physical Photobooth Strip Frame */}
      <div
        data-testid="animated-bts-strip-frame"
        style={backgroundStyle}
        className={`relative w-full ${
          isSixCut ? 'max-w-[340px] sm:max-w-[380px] aspect-[2/3]' : 'max-w-[240px] sm:max-w-[280px] aspect-[1/3]'
        } max-h-[64vh] mx-auto rounded-3xl overflow-hidden border border-white/10 photo-card-shadow flex flex-col justify-between p-3 sm:p-4 select-none animate-in fade-in`}
      >
        {/* Strip Header: Title & Live BTS Badge */}
        <div className="flex items-center justify-between pb-1 px-1">
          <div className="flex flex-col text-left">
            <span
              style={{ color: frame.captionColor || '#FFF' }}
              className="text-[11px] sm:text-xs font-bold tracking-wider uppercase truncate max-w-[130px]"
            >
              {frame.englishTitle || frame.name}
            </span>
            {frame.koreanTitle && (
              <span
                style={{ color: frame.captionColor || '#FFF' }}
                className="text-[8px] opacity-70 font-medium"
              >
                {frame.koreanTitle}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#FF385C] text-white text-[9px] font-mono font-black tracking-wider uppercase shadow">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>LIVE BTS</span>
            <span className="opacity-75">·</span>
            <span>LIVE REEL</span>
          </div>
        </div>

        {/* Simultaneous Video Slots Grid (4 vertical cuts or 2x3 balanced cuts) */}
        <div
          className={`flex-1 my-2 grid ${
            isSixCut ? 'grid-cols-2 grid-rows-3 gap-2' : 'grid-cols-1 grid-rows-4 gap-2'
          }`}
        >
          {Array.from({ length: slotCount }).map((_, idx) => {
            const photo = displayPhotos[idx]
            const btsUrl = photo?.btsClipUrl
            const dataUrl = photo?.dataUrl

            return (
              <div
                key={photo?.id || idx}
                data-testid={`bts-slot-${idx}`}
                style={{
                  borderColor: frame.slotBorderColor || 'rgba(255,255,255,0.3)',
                  borderWidth: frame.slotBorderWidth ? Math.max(frame.slotBorderWidth / 2, 1) : 1,
                  borderRadius: Math.max(frame.slotCornerRadius / 3, 6),
                }}
                className="relative rounded-xl overflow-hidden bg-black/80 flex items-center justify-center shadow-inner group"
              >
                {btsUrl ? (
                  <video
                    ref={el => {
                      videoRefs.current[idx] = el
                    }}
                    src={btsUrl}
                    autoPlay
                    loop
                    muted={isMuted}
                    playsInline
                    style={{ filter: activeCssFilter }}
                    className="w-full h-full object-cover block"
                  />
                ) : dataUrl ? (
                  <img
                    src={dataUrl}
                    alt={`Photo ${idx + 1}`}
                    style={{ filter: activeCssFilter }}
                    className="w-full h-full object-cover block animate-pulse"
                  />
                ) : (
                  <div className="w-full h-full bg-[#18181D] flex items-center justify-center">
                    <span className="text-[10px] text-white/40 font-mono">Cut {idx + 1}</span>
                  </div>
                )}

                {/* Subtle Shot Number Tag */}
                <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[8px] font-mono text-white/80 pointer-events-none">
                  {idx + 1}
                </div>
              </div>
            )
          })}
        </div>

        {/* Strip Footer: Stamp, Date, Passcode & Korean Heart Sticker */}
        <div className="pt-1 px-1 text-center flex flex-col items-center">
          {stampText && (
            <span
              style={{ color: frame.captionColor || '#FFF' }}
              className="text-[10px] font-bold font-mono tracking-wider truncate max-w-[180px]"
            >
              {stampText}
            </span>
          )}
          <span
            style={{ color: frame.captionColor || '#FFF' }}
            className="text-[8px] font-mono opacity-80 mt-0.5"
          >
            KOREAN 4-CUT STUDIO · {todayStr}
          </span>
          {passcode && (
            <span className="text-[8px] font-mono font-bold text-[#FF385C] mt-0.5">
              CODE: {passcode}
            </span>
          )}
          {/* Animated Pulsing Heart matching authentic Korean photobooths */}
          <div className="mt-0.5 animate-pulse text-[#FF385C] text-xs font-bold leading-none">
            ♥
          </div>
        </div>
      </div>

      {/* Floating Media Controls Toolbar (Play/Pause, Replay, Mute, Status) */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md shadow-lg">
        <button
          type="button"
          onClick={handleTogglePlay}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-transform active:scale-90 cursor-pointer"
          title={isPlaying ? 'Pause All' : 'Play All'}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
        </button>

        <button
          type="button"
          onClick={handleReplay}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-transform active:scale-90 cursor-pointer"
          title="Replay from Beginning"
        >
          <RotateCcw size={14} />
        </button>

        <button
          type="button"
          onClick={handleToggleMute}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-transform active:scale-90 cursor-pointer"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>

        <div className="px-3 py-1 text-[11px] font-medium text-white/70 flex items-center gap-1.5 border-l border-white/10 pl-2.5">
          <Sparkles size={11} className="text-[#FF385C]" />
          <span>4 BTS Moments Synced</span>
        </div>
      </div>
    </div>
  )
}
