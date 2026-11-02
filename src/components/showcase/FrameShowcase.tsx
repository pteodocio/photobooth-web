import React from 'react'
import { BUNDLED_FRAMES } from '../../core/frames'
import { LayoutType } from '../../core/types'
import { FrameThumbnail } from '../booth/FrameThumbnail'
import { useBoothStore } from '../../store/useBoothStore'
import { Sparkles } from 'lucide-react'

interface FrameShowcaseProps {
  onSelectFrameAndStart: () => void
}

export const FrameShowcase: React.FC<FrameShowcaseProps> = ({ onSelectFrameAndStart }) => {
  const { selectedFrame, selectFrame } = useBoothStore()
  const creativeFrames = BUNDLED_FRAMES.filter(f => f.category === 'Creative Editions')

  return (
    <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#FF5252] tracking-wider uppercase mb-1">
            <Sparkles size={14} />
            Creative 16 Series
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Explore Aesthetic Korean Frames
          </h2>
        </div>
        <p className="text-xs text-white/50 max-w-md">
          Each design features custom color palettes, vector accents, Korean typography, and balanced 4-Cut & 6-Cut geometries.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3.5">
        {creativeFrames.map(frame => (
          <FrameThumbnail
            key={frame.id}
            frame={frame}
            layout={LayoutType.fourCut}
            isSelected={selectedFrame.id === frame.id}
            onClick={() => {
              selectFrame(frame)
              onSelectFrameAndStart()
            }}
          />
        ))}
      </div>
    </section>
  )
}
