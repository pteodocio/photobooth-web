import React, { useState } from 'react'
import { BUNDLED_FRAMES } from '../../core/frames'
import { LayoutType } from '../../core/types'
import { FrameThumbnail } from '../booth/FrameThumbnail'
import { useBoothStore } from '../../store/useBoothStore'
import { Layers } from 'lucide-react'
import { sound } from '../../services/soundService'

interface FrameShowcaseProps {
  onSelectFrameAndStart: () => void
}

const CATEGORIES = [
  'All',
  'Christmas',
  'Creative Editions',
  'Classic Film',
  'Pastel Aesthetic',
  'Vintage & Earth',
  'Cyber & Moody',
]

export const FrameShowcase: React.FC<FrameShowcaseProps> = ({ onSelectFrameAndStart }) => {
  const { selectFrame } = useBoothStore()
  const [activeCategory, setActiveCategory] = useState('All')
  const [previewLayout, setPreviewLayout] = useState(LayoutType.fourCut)

  const filteredFrames =
    activeCategory === 'All'
      ? BUNDLED_FRAMES
      : BUNDLED_FRAMES.filter(f => f.category === activeCategory)

  return (
    <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-12 border-t border-black/[0.06] select-none">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#1C1917] tracking-tight">
            Frame Collection
          </h2>
          <p className="text-xs text-[#78716C] mt-0.5">
            Pick a frame style to start your photobooth session.
          </p>
        </div>

        {/* Layout Switcher (4-Cut vs 6-Cut) */}
        <div className="flex items-center p-0.5 bg-black/[0.03] rounded-xl border border-black/[0.04] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              sound.playClick()
              setPreviewLayout(LayoutType.fourCut)
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-[background-color,color] duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D] ${
              previewLayout.id === 'fourCut'
                ? 'bg-white text-[#FF4D6D] font-semibold shadow-xs'
                : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            <Layers size={12} />
            4-Cut (1x4)
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playClick()
              setPreviewLayout(LayoutType.sixCut)
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-[background-color,color] duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D] ${
              previewLayout.id === 'sixCut'
                ? 'bg-white text-[#FF4D6D] font-semibold shadow-xs'
                : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            <Layers size={12} />
            6-Cut (2x3)
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 pb-2 mb-6 overflow-x-auto scrollbar-none">
        {CATEGORIES.map(category => (
          <button
            key={category}
            type="button"
            onClick={() => {
              sound.playClick()
              setActiveCategory(category)
            }}
            className={`px-3 py-1 rounded-lg text-xs whitespace-nowrap transition-[background-color,color] duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D] ${
              activeCategory === category
                ? 'bg-[#1C1917] text-white font-medium shadow-xs'
                : 'bg-white text-[#78716C] hover:text-[#1C1917] hover:bg-black/[0.03] border border-black/[0.05]'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Frames Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {filteredFrames.map(frame => (
          <FrameThumbnail
            key={frame.id}
            frame={frame}
            layout={previewLayout}
            isSelected={false}
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
