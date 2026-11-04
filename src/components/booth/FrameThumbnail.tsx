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
      className={`relative group cursor-pointer flex flex-col items-center p-2 rounded-xl transition-[transform,opacity,border-color,background-color] duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D] ${
        isSelected
          ? 'bg-white border-[#FF4D6D] ring-2 ring-[#FF4D6D]/20 shadow-xs'
          : 'bg-white hover:bg-[#FDFBF7] border border-black/[0.06] hover:border-black/[0.12]'
      }`}
    >
      {/* Selected Indicator Stamp */}
      {isSelected && (
        <div className="absolute top-2 right-2 z-20 bg-[#FF4D6D] text-white p-1 rounded-full shadow-xs">
          <Check size={10} strokeWidth={3} />
        </div>
      )}

      {/* Actual 1:3 Canvas Rendering of the Frame Artwork */}
      <div className="w-22 sm:w-24 aspect-[1/3] rounded-lg overflow-hidden shadow-xs bg-neutral-100 relative">
        <canvas
          ref={canvasRef}
          width={180}
          height={540}
          aria-hidden="true"
          className="w-full h-full object-cover block transition-transform duration-150 group-hover:scale-[1.01]"
        />
      </div>

      {/* Frame Name */}
      <div className="mt-1.5 text-center w-full px-1">
        <h4 className="text-[11px] font-medium text-[#1C1917] truncate">
          {frame.name}
        </h4>
      </div>
    </div>
  )
}
