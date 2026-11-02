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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-[#101015] border border-[#23232E] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E1E28] bg-[#14141B]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FF385C]/10 border border-[#FF385C]/30 flex items-center justify-center text-[#FF385C] font-mono font-bold text-sm">
              4C
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 font-sans">
                포토부스 프레임 선택
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#20202A] text-[#A0A0B0] font-normal border border-[#2B2B38]">
                  36 Themes Available
                </span>
              </h2>
              <p className="text-xs text-[#808090] mt-0.5 font-mono">
                프레임은 시작 시 확정되며, 촬영 종료 후 스트립에 자동 합성됩니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* 4-Cut / 6-Cut Layout Switcher */}
            <div className="flex items-center p-1 bg-[#0A0A0D] rounded-xl border border-[#22222D]">
              <button
                onClick={() => {
                  sound.playClick()
                  setLayout(LayoutType.fourCut)
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
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
              className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-2 px-6 py-2.5 border-b border-[#1A1A24] bg-[#121217] overflow-x-auto scrollbar-none">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => {
                sound.playClick()
                setActiveCategory(cat)
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === cat
                  ? 'bg-white text-black font-bold shadow'
                  : 'bg-[#181820] text-white/60 hover:bg-[#20202A] hover:text-white border border-[#252530]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Scrollable Frame Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 darkroom-grid">
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-[#1E1E28] bg-[#14141B]">
          <div className="flex items-center gap-2 sm:gap-3 text-xs font-mono text-left w-full sm:w-auto">
            <span className="text-[#888898]">SELECTED:</span>
            <span className="font-bold text-white">{selectedFrame.name}</span>
            <span className="text-[#FF385C] font-semibold">({selectedFrame.koreanTitle})</span>
            <span className="text-white/40">· {selectedLayout.displayName}</span>
          </div>

          <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
            <button
              onClick={() => {
                sound.playClick()
                onClose()
              }}
              className="px-4 py-2 rounded-xl text-xs font-mono text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleStart}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#FF385C] hover:bg-[#E02649] text-white text-xs font-mono font-bold tracking-wide shadow-lg shadow-[#FF385C]/25 transition-all transform active:scale-95 cursor-pointer"
            >
              <Camera size={15} />
              이 프레임으로 촬영 시작
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
