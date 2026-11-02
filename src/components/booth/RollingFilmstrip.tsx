import React from 'react'
import { CapturedPhoto, LayoutTypeConfig } from '../../core/types'
import { Camera } from 'lucide-react'

interface RollingFilmstripProps {
  photos: CapturedPhoto[]
  layout: LayoutTypeConfig
}

export const RollingFilmstrip: React.FC<RollingFilmstripProps> = ({ photos, layout }) => {
  const currentCount = photos.length
  const totalCount = layout.burstCount

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-xs font-bold text-white/80 tracking-widest uppercase flex items-center gap-1.5">
        <Camera size={14} className="text-[#FF5252]" />
        <span>SHOT {Math.min(currentCount + 1, totalCount)}/{totalCount}</span>
      </div>

      <div className="flex items-center gap-2 p-2 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg">
        {Array.from({ length: totalCount }).map((_, idx) => {
          const photo = photos[idx]
          const isDone = !!photo
          const isCurrent = idx === currentCount

          return (
            <div
              key={idx}
              className={`relative w-12 h-16 rounded-lg overflow-hidden border transition-all duration-200 ${
                isDone
                  ? 'border-white/30 bg-black'
                  : isCurrent
                  ? 'border-[#FF5252] bg-[#FF5252]/10 ring-2 ring-[#FF5252]/40 scale-105'
                  : 'border-white/5 bg-white/5'
              }`}
            >
              {isDone ? (
                <img
                  src={photo.dataUrl}
                  alt={`Shot ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] font-mono text-white/30 font-bold">
                  {idx + 1}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
