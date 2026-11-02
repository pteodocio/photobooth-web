import React from 'react'
import type { CapturedPhoto, LayoutTypeConfig } from '../../core/types'
import { Camera } from 'lucide-react'

interface RollingFilmstripProps {
  photos: CapturedPhoto[]
  layout: LayoutTypeConfig
}

export const RollingFilmstrip: React.FC<RollingFilmstripProps> = ({ photos, layout }) => {
  const currentCount = photos.length
  const totalCount = layout.burstCount

  return (
    <div className="flex flex-col items-center gap-2 select-none">
      {/* Shot Counter Stamp */}
      <div className="text-xs font-mono font-bold text-white/90 tracking-widest uppercase flex items-center gap-2 bg-[#121217] px-3 py-1 rounded-full border border-[#23232E]">
        <Camera size={13} className="text-[#FF385C]" />
        <span>
          SHOT {Math.min(currentCount + 1, totalCount)}/{totalCount}
        </span>
        <span className="text-[10px] text-white/40">· KOREAN CUTS</span>
      </div>

      {/* Film Strip Negative with Sprocket Holes */}
      <div className="relative flex items-center gap-2 p-2 bg-[#0E0E12] rounded-xl border border-[#22222D] shadow-2xl">
        {Array.from({ length: totalCount }).map((_, idx) => {
          const photo = photos[idx]
          const isDone = !!photo
          const isCurrent = idx === currentCount

          return (
            <div
              key={idx}
              className={`relative w-11 sm:w-13 h-14 sm:h-16 rounded-md overflow-hidden border transition-all duration-200 ${
                isDone
                  ? 'border-white/40 bg-black shadow-inner'
                  : isCurrent
                  ? 'border-[#FF385C] bg-[#FF385C]/15 ring-2 ring-[#FF385C]/50 scale-105'
                  : 'border-[#22222D] bg-[#16161D]'
              }`}
            >
              {isDone ? (
                <img
                  src={photo.dataUrl}
                  alt={`Shot ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center font-mono text-[10px] text-white/30 font-bold">
                  <span>0{idx + 1}</span>
                  {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-[#FF385C] mt-1 animate-pulse" />}
                </div>
              )}

              {/* Mini corner index */}
              <div className="absolute top-0.5 left-0.5 text-[8px] font-mono text-white/60 bg-black/60 px-1 rounded-sm">
                #{idx + 1}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
