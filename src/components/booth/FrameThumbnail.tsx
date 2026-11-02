import React from 'react'
import type { FrameTemplate, LayoutTypeConfig } from '../../core/types'
import { Check } from 'lucide-react'
import { sound } from '../../services/soundService'

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

  const handleClick = () => {
    sound.playClick()
    onClick()
  }

  return (
    <div
      onClick={handleClick}
      className={`relative group cursor-pointer flex flex-col items-center p-2.5 rounded-xl transition-all duration-200 select-none ${
        isSelected
          ? 'bg-[#181822] ring-2 ring-[#FF385C] shadow-lg shadow-[#FF385C]/20 scale-[1.02]'
          : 'bg-[#121216] hover:bg-[#1A1A20] border border-white/5 hover:border-white/15'
      }`}
    >
      {/* Selected Indicator Stamp */}
      {isSelected && (
        <div className="absolute top-2 right-2 z-20 bg-[#FF385C] text-white p-1 rounded-md shadow">
          <Check size={11} strokeWidth={3} />
        </div>
      )}

      {/* Miniature 1:3 Physical Photo Strip Silhouette */}
      <div
        style={bgStyle}
        className="w-24 h-60 rounded-lg p-2 flex flex-col justify-between shadow-md relative overflow-hidden transition-transform duration-200 group-hover:scale-[1.03] border border-black/10"
      >
        {/* Top title label */}
        <div
          style={{ color: frame.captionColor }}
          className="text-[8px] font-bold text-center tracking-wider truncate uppercase opacity-80"
        >
          {frame.englishTitle || frame.name}
        </div>

        {/* Slot Silhouettes */}
        <div className="flex-1 my-1.5 flex flex-col justify-between">
          {layout.id === 'fourCut' ? (
            <div className="flex flex-col gap-1.5 h-full justify-between">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    borderRadius: Math.min(frame.slotCornerRadius / 3, 3),
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
                    borderRadius: Math.min(frame.slotCornerRadius / 3, 2),
                    borderColor: frame.slotBorderColor || 'transparent',
                    borderWidth: frame.slotBorderWidth > 0 ? 1 : 0,
                  }}
                  className="w-full h-full bg-black/40 border"
                />
              ))}
            </div>
          )}
        </div>

        {/* Bottom title */}
        <div
          style={{ color: frame.captionColor }}
          className="text-[8px] font-semibold text-center truncate opacity-80 uppercase"
        >
          {frame.englishTitle || 'PHOTO STRIP'}
        </div>
      </div>

      {/* Card Text Info */}
      <div className="mt-2 text-center w-full">
        <h4 className="text-xs font-semibold text-white/95 truncate">{frame.name}</h4>
      </div>
    </div>
  )
}
