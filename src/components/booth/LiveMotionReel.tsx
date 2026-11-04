import React, { useEffect, useState } from 'react'
import type { CapturedPhoto, FrameTemplate } from '../../core/types'

interface LiveMotionReelProps {
  photos: CapturedPhoto[]
  frame: FrameTemplate
}

export const LiveMotionReel: React.FC<LiveMotionReelProps> = ({ photos, frame }) => {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (photos.length === 0) return
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % photos.length)
    }, 700)
    return () => clearInterval(interval)
  }, [photos.length])

  if (photos.length === 0) return null

  const backgroundStyle = frame.gradientColors && frame.gradientColors.length >= 2
    ? { background: `linear-gradient(to bottom, ${frame.gradientColors.join(', ')})` }
    : { backgroundColor: frame.backgroundColor || '#121216' }

  return (
    <div
      style={backgroundStyle}
      className="relative w-full max-w-[240px] sm:max-w-[280px] aspect-[1/3] max-h-[64vh] mx-auto rounded-3xl overflow-hidden border border-white/10 photo-card-shadow flex flex-col justify-between p-3.5 select-none animate-in fade-in"
    >
      {/* Top Header Banner */}
      <div className="flex items-center justify-between pb-1 px-1">
        <span
          style={{ color: frame.captionColor || '#FFF' }}
          className="text-[11px] font-bold tracking-wider uppercase truncate max-w-[120px]"
        >
          {frame.englishTitle || frame.name}
        </span>

        {/* Live Reel Badge (matching test requirement) */}
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FF385C] text-white text-[9px] font-mono font-black tracking-wider uppercase shadow">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span>LIVE REEL</span>
        </div>
      </div>

      {/* 4 Strip Slots in Motion */}
      <div className="flex-1 my-2 flex flex-col justify-between gap-2">
        {photos.slice(0, 4).map((photo, idx) => {
          const isActive = idx === activeIndex
          return (
            <div
              key={photo.id || idx}
              style={{
                borderColor: isActive ? '#FF385C' : (frame.slotBorderColor || 'rgba(255,255,255,0.4)'),
                borderWidth: isActive ? 2 : (frame.slotBorderWidth ? 1.5 : 1),
                borderRadius: Math.max(frame.slotCornerRadius / 3, 6),
              }}
              className={`relative flex-1 rounded-xl overflow-hidden bg-black/60 transition-all duration-300 ${
                isActive ? 'scale-[1.03] shadow-lg shadow-[#FF385C]/25 ring-1 ring-[#FF385C]' : 'opacity-90'
              }`}
            >
              <img
                src={photo.dataUrl}
                alt={`Shot ${idx + 1}`}
                className="w-full h-full object-cover block"
              />

              {isActive && (
                <div className="absolute top-1 right-1 px-1.5 py-0.2 rounded bg-black/70 backdrop-blur-sm text-[8px] font-mono text-white/90">
                  {idx + 1}/4
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer Branding & Animated Heart Sticker */}
      <div className="pt-1 px-1 text-center flex flex-col items-center">
        <span
          style={{ color: frame.captionColor || '#FFF' }}
          className="text-[9px] font-mono opacity-80"
        >
          KOREAN 4-CUT STUDIO
        </span>
        <div className="mt-0.5 animate-pulse text-[#FF385C] text-xs">
          ♥
        </div>
      </div>
    </div>
  )
}
