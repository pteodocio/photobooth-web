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
  const { selectedFrame, selectFrame, selectedLayout, setLayout, startSession } = useBoothStore()
  const [activeCategory, setActiveCategory] = useState('All')

  if (!isOpen) return null

  const filteredFrames =
    activeCategory === 'All'
      ? BUNDLED_FRAMES
      : BUNDLED_FRAMES.filter(f => f.category === activeCategory)

  const handleStart = () => {
    sound.playClick()
    startSession()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-[#121217] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#16161D]">
          <div>
            <h2 className="text-lg font-bold text-white">Select Frame</h2>
            <p className="text-xs text-white/50 mt-0.5">Choose your favorite frame to begin.</p>
          </div>

          <div className="flex items-center gap-3">
            {/* 4-Cut / 6-Cut Layout Switcher */}
            <div className="flex items-center p-1 bg-black/40 rounded-xl border border-white/10">
              <button
                onClick={() => {
                  sound.playClick()
                  setLayout(LayoutType.fourCut)
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedLayout.id === 'fourCut'
                    ? 'bg-[#FF385C] text-white shadow'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Layers size={13} />
                4-Cut
              </button>
              <button
                onClick={() => {
                  sound.playClick()
                  setLayout(LayoutType.sixCut)
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedLayout.id === 'sixCut'
                    ? 'bg-[#FF385C] text-white shadow'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Layers size={13} />
                6-Cut
              </button>
            </div>

            <button
              onClick={() => {
                sound.playClick()
                onClose()
              }}
              className="p-1.5 text-white/50 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Category Filter Bar */}
        <div className="flex items-center gap-2 px-6 py-2.5 border-b border-white/5 bg-[#14141A] overflow-x-auto scrollbar-none">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => {
                sound.playClick()
                setActiveCategory(cat)
              }}
              className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all cursor-pointer ${
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
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

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-[#16161D]">
          <div className="text-xs text-white/70">
            Selected: <span className="font-bold text-white">{selectedFrame.name}</span>
            <span className="text-white/40"> · {selectedLayout.displayName}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.playClick()
                onClose()
              }}
              className="px-4 py-2 rounded-xl text-xs text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleStart}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF385C] hover:bg-[#E02649] text-white text-xs font-bold transition-all shadow-md shadow-[#FF385C]/20 active:scale-95 cursor-pointer"
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
