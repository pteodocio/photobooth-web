import React, { useState } from 'react'
import { BUNDLED_FRAMES } from '../../core/frames'
import { LayoutType } from '../../core/types'
import { FrameThumbnail } from '../booth/FrameThumbnail'
import { useBoothStore } from '../../store/useBoothStore'
import { Layers, Film, ArrowRight } from 'lucide-react'
import { sound } from '../../services/soundService'

interface FrameShowcaseProps {
  onSelectFrameAndStart: () => void
}

const SHOWCASE_CATEGORIES = [
  'All',
  'Creative Editions',
  'Classic Film',
  'Pastel Aesthetic',
  'Vintage & Earth',
  'Cyber & Moody',
]

export const FrameShowcase: React.FC<FrameShowcaseProps> = ({ onSelectFrameAndStart }) => {
  const { selectedFrame, selectFrame } = useBoothStore()
  const [activeCategory, setActiveCategory] = useState('All')
  const [previewLayout, setPreviewLayout] = useState(LayoutType.fourCut)

  const filteredFrames =
    activeCategory === 'All'
      ? BUNDLED_FRAMES
      : BUNDLED_FRAMES.filter(f => f.category === activeCategory)

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-12 border-t border-[#181822]">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#FF385C] tracking-wider uppercase mb-2">
            <Film size={14} />
            <span>STUDIO ARCHIVE · 36 THEMES</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            한국 스트리트 포토 프레임 셀렉션
          </h2>
          <p className="text-xs sm:text-sm text-[#888898] mt-1 max-w-xl">
            하루필름의 쿨블루부터 포토이즘 클래식 흑백, 사이버 네온까지.
            원하는 테마를 클릭하면 즉시 촬영 부스로 연결됩니다.
          </p>
        </div>

        {/* Layout Switcher (4-Cut vs 6-Cut Preview) */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-white/50 hidden sm:inline">VIEW MODE:</span>
          <div className="flex items-center p-1 bg-[#14141B] rounded-xl border border-[#23232E]">
            <button
              onClick={() => {
                sound.playClick()
                setPreviewLayout(LayoutType.fourCut)
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                previewLayout.id === 'fourCut'
                  ? 'bg-[#FF385C] text-white shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Layers size={13} />
              4-Cut (1x4)
            </button>
            <button
              onClick={() => {
                sound.playClick()
                setPreviewLayout(LayoutType.sixCut)
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                previewLayout.id === 'sixCut'
                  ? 'bg-[#FF385C] text-white shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Layers size={13} />
              6-Cut (2x3)
            </button>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 pb-4 mb-6 overflow-x-auto scrollbar-none border-b border-[#1A1A24]">
        {SHOWCASE_CATEGORIES.map(category => (
          <button
            key={category}
            onClick={() => {
              sound.playClick()
              setActiveCategory(category)
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-all cursor-pointer ${
              activeCategory === category
                ? 'bg-white text-black font-bold shadow'
                : 'bg-[#15151C] text-white/60 hover:text-white hover:bg-[#1C1C24] border border-[#22222D]'
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
            isSelected={selectedFrame.id === frame.id}
            onClick={() => {
              selectFrame(frame)
              onSelectFrameAndStart()
            }}
          />
        ))}
      </div>

      {/* Footer Banner */}
      <div className="mt-10 p-5 rounded-2xl bg-[#121217] border border-[#20202A] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#FF385C]/10 border border-[#FF385C]/30 flex items-center justify-center text-[#FF385C] font-mono font-bold text-xs">
            36
          </div>
          <div>
            <div className="text-xs font-bold text-white">동일한 프레임이 모바일 앱에서도 완벽하게 동기화됩니다.</div>
            <div className="text-[11px] text-[#7A7A8A]">웹에서 촬영한 모든 사진은 QR 코드로 휴대폰에 즉시 저장됩니다.</div>
          </div>
        </div>

        <button
          onClick={() => {
            sound.playClick()
            onSelectFrameAndStart()
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1C1C26] hover:bg-[#252534] text-white text-xs font-mono font-bold border border-[#2E2E3E] transition-all cursor-pointer"
        >
          <span>전체 프레임으로 부스 시작</span>
          <ArrowRight size={14} className="text-[#FF385C]" />
        </button>
      </div>
    </section>
  )
}
