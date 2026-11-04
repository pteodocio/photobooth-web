import React, { useState, useEffect, useRef } from 'react'
import { useBoothStore } from '../../store/useBoothStore'
import { PHOTO_FILTERS, FILTER_CATEGORIES, getCssFilter } from '../../core/filters'
import { CameraService } from '../../services/cameraService'
import { Sliders, RotateCcw, ArrowRight, Camera, RefreshCw } from 'lucide-react'
import { sound } from '../../services/soundService'
import { PhotoboothStepHeader } from './PhotoboothStepHeader'

export const PreCaptureFilterStep: React.FC = () => {
  const {
    selectedFilter,
    setFilter,
    filterIntensity,
    setFilterIntensity,
    goToFrameSelect,
    resetSession,
  } = useBoothStore()

  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [cameraActive, setCameraActive] = useState<boolean>(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    let isMounted = true
    async function startCamera() {
      if (videoRef.current) {
        try {
          await CameraService.startCamera(videoRef.current, facingMode)
          if (isMounted) setCameraActive(true)
        } catch {
          if (isMounted) setCameraActive(false)
        }
      }
    }
    startCamera()

    return () => {
      isMounted = false
      CameraService.stopCamera()
    }
  }, [facingMode])

  const toggleCamera = () => {
    sound.playClick()
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'))
  }

  const activeCssFilter = getCssFilter(selectedFilter, filterIntensity)

  const filteredList =
    activeCategory === 'all'
      ? PHOTO_FILTERS
      : PHOTO_FILTERS.filter(f => f.category === activeCategory || f.id === 'none')

  const currentFilterObj = PHOTO_FILTERS.find(f => f.id === selectedFilter) || PHOTO_FILTERS[0]

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1917] flex flex-col justify-between p-3 sm:p-6 select-none max-w-6xl mx-auto">
      {/* Minimal Studio Header */}
      <PhotoboothStepHeader
        currentStep={1}
        stepTitle="Choose Photo Filter"
        stepSubtitle="Select from 40 authentic Korean studio filters"
        legacyStepText="Step 1 of 4"
        onExit={resetSession}
      />

      {/* Main Content Area: Live Viewfinder + Filter Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 my-2 flex-1 items-start">
        {/* Left Column: Live Camera Filter Viewfinder (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="relative aspect-[4/3] w-full bg-[#1C1917] rounded-2xl overflow-hidden border border-black/[0.06] shadow-sm">
            {/* Live Video with filter applied */}
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              style={{ filter: activeCssFilter }}
              className="w-full h-full object-cover transform -scale-x-100"
            />

            {!cameraActive && (
              <div
                style={{ filter: activeCssFilter }}
                className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#F4F1EC]"
              >
                <div className="w-14 h-14 rounded-full bg-black/[0.05] flex items-center justify-center mb-2.5">
                  <Camera size={24} className="text-[#78716C]" />
                </div>
                <p className="text-sm font-medium text-[#1C1917]">Live Camera Preview</p>
                <p className="text-xs text-[#78716C] mt-0.5">Filter simulation active</p>
              </div>
            )}

            {/* Filter Name Badge */}
            <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/90 backdrop-blur-xs border border-black/[0.06] text-xs font-medium text-[#1C1917] flex items-center gap-1.5 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF4D6D]" />
              <span>{currentFilterObj.displayName}</span>
              {selectedFilter !== 'none' && (
                <span className="text-[10px] text-[#78716C] font-mono">
                  {Math.round(filterIntensity * 100)}%
                </span>
              )}
            </div>

            {/* Camera switch button */}
            {cameraActive && (
              <button
                type="button"
                onClick={toggleCamera}
                className="absolute top-3 right-3 p-2 rounded-full bg-white/80 hover:bg-white text-[#1C1917] border border-black/[0.06] backdrop-blur-xs cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D] shadow-xs"
                title="Switch Camera"
              >
                <RefreshCw size={12} />
              </button>
            )}
          </div>

          {/* Intensity Slider Control */}
          <div className="p-3 rounded-2xl bg-white border border-black/[0.06] shadow-xs flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-medium text-[#1C1917]">
                <Sliders size={13} className="text-[#FF4D6D]" />
                <span>Filter Intensity</span>
              </div>
              <span className="font-mono text-[#FF4D6D] font-semibold text-xs">
                {Math.round(filterIntensity * 100)}%
              </span>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={filterIntensity}
                onChange={e => setFilterIntensity(parseFloat(e.target.value))}
                className="flex-1 accent-[#FF4D6D] h-1.5 bg-black/[0.06] rounded-lg appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D]"
              />
              <button
                type="button"
                onClick={() => {
                  sound.playClick()
                  setFilter('none')
                  setFilterIntensity(1.0)
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/[0.03] hover:bg-black/[0.06] text-[11px] text-[#78716C] hover:text-[#1C1917] border border-black/[0.04] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D]"
              >
                <RotateCcw size={11} />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: 40 Filter Swatch Library (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-2.5">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
            {FILTER_CATEGORIES.map(cat => (
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
                {cat.name}
              </button>
            ))}
          </div>

          {/* 40 Filters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[50vh] overflow-y-auto p-1 scrollbar-thin">
            {filteredList.map(filter => {
              const isSelected = selectedFilter === filter.id
              const previewCss = getCssFilter(filter.id, 1.0)

              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => {
                    sound.playClick()
                    setFilter(filter.id)
                  }}
                  className={`group relative flex flex-col items-center p-2 rounded-xl transition-[transform,opacity,border-color,background-color] duration-150 cursor-pointer text-left border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D] ${
                    isSelected
                      ? 'bg-white border-[#FF4D6D] ring-2 ring-[#FF4D6D]/20 shadow-xs'
                      : 'bg-white hover:bg-[#FDFBF7] border-black/[0.06] hover:border-black/[0.12]'
                  }`}
                >
                  {/* Swatch Preview Box */}
                  <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-neutral-100 mb-1.5 relative">
                    <div
                      style={{ filter: previewCss }}
                      className="w-full h-full bg-gradient-to-tr from-amber-100 via-rose-100 to-sky-100 flex items-center justify-center"
                    >
                      <div className="w-5 h-5 rounded-full bg-white/50 backdrop-blur-xs" />
                    </div>
                    {isSelected && (
                      <div className="absolute inset-0 bg-[#FF4D6D]/10 border-2 border-[#FF4D6D] rounded-lg" />
                    )}
                  </div>

                  <span className="text-xs font-medium text-[#1C1917] truncate w-full">
                    {filter.displayName}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="pt-3 border-t border-black/[0.06] flex items-center justify-between gap-4">
        <div className="text-xs text-[#78716C]">
          Selected: <span className="font-semibold text-[#1C1917]">{currentFilterObj.displayName}</span>
          {selectedFilter !== 'none' && ` · ${Math.round(filterIntensity * 100)}%`}
        </div>

        <button
          type="button"
          onClick={() => {
            sound.playClick()
            goToFrameSelect()
          }}
          className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#FF4D6D] hover:bg-[#E11D48] text-white font-semibold text-xs shadow-xs transition-transform duration-150 transform active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D]"
        >
          <span>Next: Choose Frame</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}
