import React, { useState } from 'react'
import { useBoothStore } from '../../store/useBoothStore'
import { BUNDLED_FRAMES } from '../../core/frames'
import { FrameThumbnail } from './FrameThumbnail'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'
import { sound } from '../../services/soundService'

export const PreCaptureFrameStep: React.FC = () => {
  const {
    selectedFrame,
    selectFrame,
    selectedLayout,
    goToFilterSelect,
    goToCameraPrep,
    resetSession,
  } = useBoothStore()

  // Default to Christmas category so the 40 Christmas frames are front and center
  const [activeCategory, setActiveCategory] = useState<string>('Christmas')

  const categories = [
    { id: 'Christmas', label: '🎄 Christmas (40)' },
    { id: 'All', label: 'All (76)' },
    { id: 'Classic Studio', label: 'Classic' },
    { id: 'Creative Editions', label: 'Creative' },
    { id: 'Cyber & Y2K', label: 'Y2K' },
    { id: 'Pastel & Cute', label: 'Pastel' },
    { id: 'Minimal & Editorial', label: 'Editorial' },
  ]

  const filteredFrames =
    activeCategory === 'All'
      ? BUNDLED_FRAMES
      : BUNDLED_FRAMES.filter(f => f.category === activeCategory)

  return (
    <div className="min-h-screen bg-[#08080B] text-[#F3F3F6] flex flex-col justify-between p-4 sm:p-6 select-none max-w-6xl mx-auto">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-full bg-[#FF385C]/20 border border-[#FF385C]/30 text-[#FF385C] text-xs font-bold uppercase tracking-wider">
            Step 2 of 4
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white">Choose Frame Design</h1>
            <p className="text-xs text-white/50">40 Holiday editions & classic studio layouts</p>
          </div>
        </div>

        <button
          onClick={() => {
            sound.playClick()
            resetSession()
          }}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 transition-colors cursor-pointer"
          title="Exit"
        >
          <X size={18} />
        </button>
      </div>

      {/* Frame Category Selector */}
      <div className="my-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                sound.playClick()
                setActiveCategory(cat.id)
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? cat.id === 'Christmas'
                    ? 'bg-gradient-to-r from-[#DC2626] to-[#15803D] text-white shadow-lg shadow-red-500/20'
                    : 'bg-white text-black shadow'
                  : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Selected Frame Quick Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: selectedFrame.gradientColors[0] || selectedFrame.backgroundColor }}
          />
          <span className="font-semibold text-white truncate max-w-[150px]">
            {selectedFrame.name}
          </span>
        </div>
      </div>

      {/* Frame Cards Gallery */}
      <div className="flex-1 overflow-y-auto max-h-[60vh] p-2 rounded-2xl bg-[#0D0D12] border border-white/5">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
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

      {/* Bottom Navigation Toolbar */}
      <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-4">
        <button
          onClick={() => {
            sound.playClick()
            goToFilterSelect()
          }}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
        >
          <ArrowLeft size={15} />
          <span>Back to Filters</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-xs text-white/50 text-right">
            <div>Selected: <span className="font-semibold text-white">{selectedFrame.name}</span></div>
            <div className="text-[10px] text-white/40">4 Photos · 3s Timer</div>
          </div>

          <button
            onClick={() => {
              sound.playClick()
              goToCameraPrep()
            }}
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#FF385C] hover:bg-[#E02649] text-white font-bold text-xs shadow-xl shadow-[#FF385C]/25 transition-all transform active:scale-95 cursor-pointer"
          >
            <span>Next: Camera Setup</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
