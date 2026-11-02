import React, { useState } from 'react'
import { BUNDLED_FRAMES } from '../../core/frames'
import { LayoutType } from '../../core/types'
import { useBoothStore } from '../../store/useBoothStore'
import { FrameThumbnail } from './FrameThumbnail'
import { Sparkles, Layers, X } from 'lucide-react'

interface FramePickerModalProps {
  isOpen: boolean
  onClose: () => void
}

const CATEGORIES = [
  'All',
  'Creative Editions',
  'Classic Film',
  'Pastel Aesthetic',
  'Vintage & Earth',
  'Vibrant & Pop',
  'Cyber & Moody',
]

export const FramePickerModal: React.FC<FramePickerModalProps> = ({ isOpen, onClose }) => {
  const { selectedFrame, selectFrame, selectedLayout, setLayout, startSession } = useBoothStore()
  const [activeCategory, setActiveCategory] = useState('All')

  if (!isOpen) return null

  const filteredFrames =
    activeCategory === 'All'
      ? BUNDLED_FRAMES
      : BUNDLED_FRAMES.filter(f => f.category === activeCategory)

  const handleStart = () => {
    startSession()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-[#0F0F12] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-[#141418]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#FF5252]/10 text-[#FF5252] rounded-xl">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                포토부스 프레임 선택
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70 font-normal">
                  36 Themes
                </span>
              </h2>
              <p className="text-xs text-white/50 mt-0.5">
                프레임은 시작할 때 한 번만 선택하며, 촬영 후 결과물에 자동 적용됩니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* 4-Cut / 6-Cut Layout Switcher */}
            <div className="flex items-center p-1 bg-black/40 rounded-xl border border-white/10">
              <button
                onClick={() => setLayout(LayoutType.fourCut)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedLayout.id === 'fourCut'
                    ? 'bg-[#FF5252] text-white shadow'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Layers size={14} />
                4-Cut
              </button>
              <button
                onClick={() => setLayout(LayoutType.sixCut)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedLayout.id === 'sixCut'
                    ? 'bg-[#FF5252] text-white shadow'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Layers size={14} />
                6-Cut
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-white/5 bg-[#121215] overflow-x-auto scrollbar-none">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? 'bg-white text-black font-semibold shadow'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Scrollable Frame Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
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

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-[#141418]">
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/60">Selected:</span>
            <span className="text-sm font-semibold text-white">{selectedFrame.name}</span>
            <span className="text-xs text-[#FF5252] font-medium">({selectedFrame.koreanTitle})</span>
            <span className="text-xs text-white/40">· {selectedLayout.displayName}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white/70 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleStart}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#FF5252] hover:bg-[#FF3838] text-white text-xs font-bold shadow-lg shadow-[#FF5252]/25 transition-all transform active:scale-95"
            >
              <Sparkles size={14} />
              이 프레임으로 촬영 시작
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
