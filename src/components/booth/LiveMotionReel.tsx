import React, { useEffect, useState } from 'react'
import type { CapturedPhoto, FrameTemplate } from '../../core/types'

interface LiveMotionReelProps {
  photos: CapturedPhoto[]
  frame: FrameTemplate
}

export const LiveMotionReel: React.FC<LiveMotionReelProps> = ({ photos, frame }) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (photos.length === 0) return
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % photos.length)
    }, 650)
    return () => clearInterval(interval)
  }, [photos.length])

  if (photos.length === 0) return null

  const currentPhoto = photos[currentIndex]

  return (
    <div className="relative aspect-[4/3] w-full max-w-md mx-auto rounded-2xl overflow-hidden border-2 border-[#2E2E3E] photo-card-shadow bg-black select-none">
      {/* Photo Frame Animation */}
      <img
        src={currentPhoto.dataUrl}
        alt={`Reel frame ${currentIndex + 1}`}
        className="w-full h-full object-cover transition-opacity duration-150"
      />

      {/* Top Header Badge */}
      <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FF385C] text-white text-[10px] font-mono font-black tracking-wider uppercase shadow-md">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          LIVE REEL
        </div>

        <div className="px-2.5 py-1 rounded-md bg-black/75 text-white/90 font-mono text-[10px] font-bold border border-white/10">
          {currentIndex + 1}/{photos.length}
        </div>
      </div>

      {/* Bottom Frame Badge */}
      <div className="absolute bottom-3 inset-x-4 pointer-events-none text-center">
        <div className="inline-block px-3 py-1 rounded-lg bg-black/80 backdrop-blur-md text-[11px] font-sans font-semibold text-white/95 border border-white/10">
          {frame.name} · {frame.koreanTitle}
        </div>
      </div>
    </div>
  )
}
