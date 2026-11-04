import React, { useState, useEffect, useRef } from 'react'
import { useBoothStore } from '../../store/useBoothStore'
import { BUNDLED_FRAMES } from '../../core/frames'
import { FrameThumbnail } from './FrameThumbnail'
import { ArrowLeft, ArrowRight, Eye } from 'lucide-react'
import { sound } from '../../services/soundService'
import { renderFrameToCanvas, getSamplePhotos } from '../../services/compositorService'
import { PhotoboothStepHeader } from './PhotoboothStepHeader'

export const PreCaptureFrameStep: React.FC = () => {
  const {
    selectedFrame,
    selectFrame,
    selectedLayout,
    selectedFilter,
    filterIntensity,
    goToFilterSelect,
    goToCameraPrep,
    resetSession,
  } = useBoothStore()

  // Default to Christmas category so the 40 Christmas frames are front and center
  const [activeCategory, setActiveCategory] = useState<string>('Christmas')
  const largeCanvasRef = useRef<HTMLCanvasElement>(null)

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

  // Render the larger frame preview whenever selectedFrame, layout, or filter changes
  useEffect(() => {
    if (largeCanvasRef.current) {
      const samplePhotos = getSamplePhotos()
      renderFrameToCanvas(largeCanvasRef.current, selectedFrame, selectedLayout, samplePhotos, {
        filter: selectedFilter,
        filterIntensity,
      })
    }
  }, [selectedFrame, selectedLayout, selectedFilter, filterIntensity])

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1917] flex flex-col justify-between p-3 sm:p-6 select-none max-w-7xl mx-auto">
      {/* Minimal Studio Header */}
      <PhotoboothStepHeader
        currentStep={2}
        stepTitle="Choose Frame Design"
        stepSubtitle="Pick from 40 festive Christmas and studio frames"
        legacyStepText="Step 2 of 4"
        onExit={resetSession}
      />

      {/* Main Split-Screen Stage: Left Large Preview Inspector + Right Frame Gallery */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 my-2 flex-1 items-start">
        {/* Left Column: Larger Frame Preview Inspector (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-black/[0.06] shadow-xs relative">
          <div className="flex items-center justify-between w-full mb-3 pb-2 border-b border-black/[0.05] text-xs">
            <div className="flex items-center gap-1.5">
              <Eye size={13} className="text-[#FF4D6D]" />
              <span className="font-semibold text-[#1C1917] text-[11px]">
                Live Preview
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/[0.03] border border-black/[0.04] text-[11px] text-[#78716C]">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: selectedFrame.gradientColors[0] || selectedFrame.backgroundColor }}
              />
              <span className="font-medium truncate max-w-[140px]">{selectedFrame.name}</span>
            </div>
          </div>

          {/* Actual 1:3 Canvas Rendering of the Large Strip */}
          <div className="w-full max-w-[260px] aspect-[1/3] rounded-xl overflow-hidden shadow-sm bg-neutral-100 border border-black/[0.06] relative">
            <canvas
              ref={largeCanvasRef}
              width={400}
              height={1200}
              aria-hidden="true"
              className="w-full h-full object-contain block"
            />
          </div>

          <div className="mt-2 text-center text-[11px] text-[#A8A29E]">
            Authentic Korean 4-cut composition preview
          </div>
        </div>

        {/* Right Column: Organized Visual Frame Gallery (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-2.5">
          {/* Frame Category Selector Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  sound.playClick()
                  setActiveCategory(cat.id)
                }}
                className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-[background-color,color] duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D] ${
                  activeCategory === cat.id
                    ? 'bg-[#1C1917] text-white shadow-xs'
                    : 'bg-white text-[#78716C] hover:text-[#1C1917] hover:bg-black/[0.03] border border-black/[0.04]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Scrollable Gallery Grid */}
          <div className="flex-1 overflow-y-auto max-h-[62vh] p-2.5 rounded-2xl bg-white border border-black/[0.06] shadow-xs scrollbar-thin">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
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
        </div>
      </div>

      {/* Bottom Navigation Toolbar */}
      <div className="pt-3 border-t border-black/[0.06] flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => {
            sound.playClick()
            goToFilterSelect()
          }}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-black/[0.03] text-[#78716C] hover:text-[#1C1917] text-xs font-medium border border-black/[0.06] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D]"
        >
          <ArrowLeft size={14} />
          <span>Back to Filters</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-xs text-[#78716C] text-right">
            Selected: <span className="font-semibold text-[#1C1917]">{selectedFrame.name}</span>
          </div>

          <button
            type="button"
            onClick={() => {
              sound.playClick()
              goToCameraPrep()
            }}
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#FF4D6D] hover:bg-[#E11D48] text-white font-semibold text-xs whitespace-nowrap shadow-xs transition-transform duration-150 transform active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D]"
          >
            <span>Confirm & Next: Camera Setup</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
