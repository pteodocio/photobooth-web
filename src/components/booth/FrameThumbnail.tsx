import React, { useEffect, useRef } from 'react'
import type { FrameTemplate, LayoutTypeConfig } from '../../core/types'
import { Check } from 'lucide-react'
import { sound } from '../../services/soundService'
import { renderFrameToCanvas } from '../../services/compositorService'

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
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current) {
      renderFrameToCanvas(canvasRef.current, frame, layout)
    }
  }, [frame, layout])

  const handleClick = () => {
    sound.playClick()
    onClick()
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
      className={`relative group cursor-pointer flex flex-col items-center p-2 rounded-xl transition-[transform,opacity,border-color,background-color] duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF385C] ${
        isSelected
          ? 'bg-[#181824] ring-2 ring-[#FF385C] shadow-xl shadow-[#FF385C]/25 scale-[1.03]'
          : 'bg-[#121217] hover:bg-[#1A1A22] border border-white/10 hover:border-white/20'
      }`}
    >
      {/* Selected Indicator Stamp */}
      {isSelected && (
        <div className="absolute top-2 right-2 z-20 bg-[#FF385C] text-white p-1 rounded-md shadow-md">
          <Check size={12} strokeWidth={3} />
        </div>
      )}

      {/* Actual 1:3 Canvas Rendering of the Frame Artwork */}
      <div className="w-24 sm:w-28 aspect-[1/3] rounded-lg overflow-hidden shadow-md bg-black/60 relative">
        <canvas
          ref={canvasRef}
          width={180}
          height={540}
          className="w-full h-full object-cover block transition-transform duration-150 group-hover:scale-[1.02]"
        />
      </div>

      {/* Frame Name */}
      <div className="mt-2 text-center w-full px-1">
        <h4 className="text-[11px] sm:text-xs font-semibold text-white/95 truncate">
          {frame.name}
        </h4>
      </div>
    </div>
  )
}
