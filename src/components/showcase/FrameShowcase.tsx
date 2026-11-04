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
    <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-12 border-t border-white/5 select-none">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Frame Collection
          </h2>
          <p className="text-xs text-white/50 mt-1">
            Pick a frame style to start your photobooth session.
          </p>
        </div>

        {/* Layout Switcher (4-Cut vs 6-Cut) */}
        <div className="flex items-center p-1 bg-white/5 rounded-xl border border-white/10 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              sound.playClick()
              setPreviewLayout(LayoutType.fourCut)
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-[background-color,color] duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF385C] ${
              previewLayout.id === 'fourCut'
                ? 'bg-[#FF385C] text-white shadow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Layers size={13} />
            4-Cut (1x4)
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playClick()
              setPreviewLayout(LayoutType.sixCut)
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-[background-color,color] duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF385C] ${
              previewLayout.id === 'sixCut'
                ? 'bg-[#FF385C] text-white shadow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Layers size={13} />
            6-Cut (2x3)
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 pb-3 mb-6 overflow-x-auto scrollbar-none">
        {CATEGORIES.map(category => (
          <button
            key={category}
            type="button"
            onClick={() => {
              sound.playClick()
              setActiveCategory(category)
            }}
            className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-[background-color,color] duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF385C] ${
              activeCategory === category
                ? 'bg-white text-black font-semibold shadow'
                : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Frames Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
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
