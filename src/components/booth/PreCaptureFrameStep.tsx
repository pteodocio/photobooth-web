import React, { useState, useEffect, useRef } from 'react'
import { useBoothStore } from '../../store/useBoothStore'
import { BUNDLED_FRAMES } from '../../core/frames'
import { FrameThumbnail } from './FrameThumbnail'
import { ArrowLeft, ArrowRight, Sparkles, Eye } from 'lucide-react'
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
    <div className="min-h-screen bg-[#08080B] text-[#F3F3F6] flex flex-col justify-between p-3 sm:p-6 select-none max-w-7xl mx-auto">
      {/* Unified 7-Stage Header */}
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
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 rounded-2xl bg-[#0D0D14] border border-white/10 shadow-2xl relative">
          <div className="flex items-center justify-between w-full mb-3 pb-2 border-b border-white/10 text-xs">
            <div className="flex items-center gap-2">
              <Eye size={14} className="text-[#FF385C]" />
              <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                Live Composition Preview
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[11px] text-white/80">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: selectedFrame.gradientColors[0] || selectedFrame.backgroundColor }}
              />
              <span className="font-semibold truncate max-w-[140px]">{selectedFrame.name}</span>
            </div>
          </div>

          {/* Actual 1:3 Canvas Rendering of the Large Strip */}
          <div className="w-full max-w-[280px] sm:max-w-[320px] aspect-[1/3] rounded-xl overflow-hidden shadow-2xl bg-black border border-white/15 relative">
            <canvas
              ref={largeCanvasRef}
              width={400}
              height={1200}
              className="w-full h-full object-contain block"
            />
          </div>

          <div className="mt-2.5 text-center text-[11px] text-white/50 flex items-center justify-center gap-1.5">
            <Sparkles size={11} className="text-[#FACC15]" />
            <span>Actual photobooth composition with sample photos & graphics</span>
          </div>
        </div>

        {/* Right Column: Organized Visual Frame Gallery (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
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
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-[background-color,color] duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF385C] ${
                  activeCategory === cat.id
                    ? cat.id === 'Christmas'
                      ? 'bg-gradient-to-r from-[#DC2626] to-[#15803D] text-white shadow-lg shadow-red-500/25'
                      : 'bg-white text-black shadow'
                    : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/5'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Scrollable Gallery Grid */}
          <div className="flex-1 overflow-y-auto max-h-[62vh] p-2.5 rounded-2xl bg-[#0D0D14] border border-white/5 scrollbar-thin">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
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
      <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => {
            sound.playClick()
            goToFilterSelect()
          }}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF385C]"
        >
          <ArrowLeft size={15} />
          <span>Back to Filters</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-xs text-white/50 text-right">
            <div>
              Selected: <span className="font-semibold text-white">{selectedFrame.name}</span>
            </div>
            <div className="text-[10px] text-white/40">4 Photos · Customizable Timer</div>
          </div>

          <button
            type="button"
            onClick={() => {
              sound.playClick()
              goToCameraPrep()
            }}
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#FF385C] hover:bg-[#E02649] text-white font-bold text-xs shadow-xl shadow-[#FF385C]/25 transition-transform duration-150 transform active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF385C]"
          >
            <span>Confirm & Next: Camera Setup</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
