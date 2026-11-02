import React from 'react'
import { FrameTemplate, LayoutTypeConfig } from '../../core/types'
import { Check } from 'lucide-react'

interface FrameThumbnailProps {
  frame: FrameTemplate
  layout: LayoutTypeConfig
  isSelected: boolean
  onClick: () => void
}

export const FrameThumbnail: React.FC<FrameThumbnailProps> = ({
  frame,
  layout,
  isSelected,
  onClick,
}) => {
  const isGradient = frame.gradientColors && frame.gradientColors.length >= 2
  const bgStyle = isGradient
    ? { backgroundImage: `linear-gradient(to bottom, ${frame.gradientColors.join(', ')})` }
    : { backgroundColor: frame.backgroundColor }

  return (
    <div
      onClick={onClick}
      className={`relative group cursor-pointer flex flex-col items-center p-3 rounded-2xl transition-all duration-200 ${
        isSelected
          ? 'bg-[#1C1C22] ring-2 ring-[#FF5252] shadow-lg shadow-[#FF5252]/20 scale-[1.02]'
          : 'bg-[#141418] hover:bg-[#1A1A20] border border-white/5 hover:border-white/20'
      }`}
    >
      {/* Selected Indicator Pill */}
      {isSelected && (
        <div className="absolute top-2 right-2 z-10 bg-[#FF5252] text-white p-1 rounded-full shadow-md">
          <Check size={12} strokeWidth={3} />
        </div>
      )}

      {/* Miniature 1:3 Photo Strip Silhouette */}
      <div
        style={bgStyle}
        className="w-24 h-64 rounded-xl p-2 flex flex-col justify-between shadow-inner relative overflow-hidden transition-transform duration-200 group-hover:scale-[1.03]"
      >
        {/* Top title label */}
        <div
          style={{ color: frame.captionColor }}
          className="text-[8px] font-bold text-center tracking-wider truncate uppercase opacity-80"
        >
          {frame.englishTitle || frame.name}
        </div>

        {/* Slot Silhouettes */}
        <div className="flex-1 my-1 flex flex-col justify-between">
          {layout.id === 'fourCut' ? (
            <div className="flex flex-col gap-1.5 h-full justify-between">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    borderRadius: Math.min(frame.slotCornerRadius / 3, 4),
                    borderColor: frame.slotBorderColor || 'transparent',
                    borderWidth: frame.slotBorderWidth > 0 ? 1 : 0,
                  }}
                  className="w-full flex-1 bg-black/40 border"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1 h-full">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    borderRadius: Math.min(frame.slotCornerRadius / 3, 3),
                    borderColor: frame.slotBorderColor || 'transparent',
                    borderWidth: frame.slotBorderWidth > 0 ? 1 : 0,
                  }}
                  className="w-full h-full bg-black/40 border"
                />
              ))}
            </div>
          )}
        </div>

        {/* Bottom Korean title */}
        <div
          style={{ color: frame.captionColor }}
          className="text-[8px] font-medium text-center truncate opacity-90"
        >
          {frame.koreanTitle || '인생네컷'}
        </div>
      </div>

      {/* Card Text Info */}
      <div className="mt-2.5 text-center w-full">
        <h4 className="text-xs font-semibold text-white truncate">{frame.name}</h4>
        <p className="text-[10px] text-white/50 truncate mt-0.5">{frame.koreanTitle || frame.category}</p>
      </div>
    </div>
  )
}
