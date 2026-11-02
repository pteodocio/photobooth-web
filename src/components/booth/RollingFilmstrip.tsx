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
      {/* Shot Counter */}
      <div className="text-xs font-semibold text-white/80 tracking-wider uppercase flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-full border border-white/10">
        <Camera size={13} className="text-[#FF385C]" />
        <span>
          SHOT {Math.min(currentCount + 1, totalCount)}/{totalCount}
        </span>
      </div>

      {/* Film Strip Progress Slots */}
      <div className="flex items-center gap-2 p-1.5 bg-black/40 rounded-xl border border-white/10">
        {Array.from({ length: totalCount }).map((_, idx) => {
          const photo = photos[idx]
          const isDone = !!photo
          const isCurrent = idx === currentCount

          return (
            <div
              key={idx}
              className={`relative w-11 sm:w-12 h-14 sm:h-16 rounded-lg overflow-hidden border transition-all duration-200 ${
                isDone
                  ? 'border-white/40 bg-black'
                  : isCurrent
                  ? 'border-[#FF385C] bg-[#FF385C]/15 ring-2 ring-[#FF385C]/50 scale-105'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              {isDone ? (
                <img
                  src={photo.dataUrl}
                  alt={`Shot ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-[10px] text-white/30 font-bold">
                  <span>{idx + 1}</span>
                  {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-[#FF385C] mt-1 animate-pulse" />}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
