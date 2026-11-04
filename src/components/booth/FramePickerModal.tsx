import React, { useState } from 'react'
import { BUNDLED_FRAMES } from '../../core/frames'
import { LayoutType } from '../../core/types'
import { useBoothStore } from '../../store/useBoothStore'
import { FrameThumbnail } from './FrameThumbnail'
import { Layers, Camera, X } from 'lucide-react'
import { sound } from '../../services/soundService'

interface FramePickerModalProps {
  isOpen: boolean
  onClose: () => void
}

const CATEGORIES = [
  'All',
  'Christmas',
  'Creative Editions',
  'Classic Film',
  'Pastel Aesthetic',
  'Vintage & Earth',
  'Vibrant & Pop',
  'Cyber & Moody',
]

export const FramePickerModal: React.FC<FramePickerModalProps> = ({ isOpen, onClose }) => {
  const { selectedFrame, selectFrame, selectedLayout, setLayout, goToFilterSelect } = useBoothStore()
  const [activeCategory, setActiveCategory] = useState('All')

  if (!isOpen) return null

  const filteredFrames =
    activeCategory === 'All'
      ? BUNDLED_FRAMES
      : BUNDLED_FRAMES.filter(f => f.category === activeCategory)

  const handleStart = () => {
    sound.playClick()
    goToFilterSelect()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-xs animate-in fade-in select-none">
      <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-white border border-black/[0.1] rounded-3xl shadow-lg overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06] bg-[#FAF8F5]">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#1C1917] tracking-tight">
              Select Frame
            </h2>
            <p className="text-xs text-[#78716C] mt-0.5">
              Choose your favorite frame to begin.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* 4-Cut / 6-Cut Layout Switcher */}
            <div className="flex items-center p-0.5 bg-black/[0.03] rounded-xl border border-black/[0.05]">
              <button
                type="button"
                onClick={() => {
                  sound.playClick()
                  setLayout(LayoutType.fourCut)
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-[background-color,color] duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D] ${
                  selectedLayout.id === 'fourCut'
                    ? 'bg-white text-[#FF4D6D] shadow-xs'
                    : 'text-[#78716C] hover:text-[#1C1917]'
                }`}
              >
                <Layers size={13} />
                <span>4-Cut</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playClick()
                  setLayout(LayoutType.sixCut)
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-[background-color,color] duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D] ${
                  selectedLayout.id === 'sixCut'
                    ? 'bg-white text-[#FF4D6D] shadow-xs'
                    : 'text-[#78716C] hover:text-[#1C1917]'
                }`}
              >
                <Layers size={13} />
                <span>6-Cut</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                sound.playClick()
                onClose()
              }}
              aria-label="Close modal"
              className="p-1.5 text-[#78716C] hover:text-[#1C1917] rounded-xl hover:bg-black/[0.04] transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D]"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Category Filter Bar */}
        <div className="flex items-center gap-2 px-6 py-2.5 border-b border-black/[0.05] bg-white overflow-x-auto scrollbar-none">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                sound.playClick()
                setActiveCategory(cat)
              }}
              className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-[background-color,color] duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D] ${
                activeCategory === cat
                  ? 'bg-[#1C1917] text-white shadow-xs'
                  : 'bg-[#FAF8F5] text-[#78716C] hover:text-[#1C1917] hover:bg-[#F4F1EC] border border-black/[0.04]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid of Frames */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#FAF8F5] scrollbar-thin">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {filteredFrames.map(frame => (
              <FrameThumbnail
                key={frame.id}
                frame={frame}
                layout={selectedLayout}
                isSelected={selectedFrame.id === frame.id}
                onClick={() => selectFrame(frame)}
              />
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-black/[0.06] bg-[#FAF8F5]">
          <div className="text-xs text-[#78716C]">
            Selected: <span className="font-semibold text-[#1C1917]">{selectedFrame.name}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#78716C] hover:text-[#1C1917] hover:bg-black/[0.03] transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleStart}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF4D6D] hover:bg-[#E11D48] text-white text-xs font-semibold shadow-xs transition-transform duration-150 transform active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D]"
            >
              <Camera size={14} />
              <span>Start Session</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
