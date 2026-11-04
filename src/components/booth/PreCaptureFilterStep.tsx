import React, { useState, useEffect, useRef } from 'react'
import { useBoothStore } from '../../store/useBoothStore'
import { PHOTO_FILTERS, FILTER_CATEGORIES, getCssFilter } from '../../core/filters'
import { CameraService } from '../../services/cameraService'
import { Sparkles, Sliders, RotateCcw, ArrowRight, Camera, RefreshCw } from 'lucide-react'
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

  // Start camera preview
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
    <div className="min-h-screen bg-[#08080B] text-[#F3F3F6] flex flex-col justify-between p-3 sm:p-6 select-none max-w-6xl mx-auto">
      {/* Unified 7-Stage Header */}
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
          <div className="relative aspect-[4/3] w-full bg-black rounded-2xl overflow-hidden border border-white/15 shadow-2xl">
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
                className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#1A1A24] to-[#0E0E14]"
              >
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-3">
                  <Camera size={28} className="text-white/60" />
                </div>
                <p className="text-sm font-semibold text-white">Live Camera Preview</p>
                <p className="text-xs text-white/40 mt-1">Real-time studio filter simulation</p>
              </div>
            )}

            {/* Filter Name Badge */}
            <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/15 text-xs font-semibold text-white flex items-center gap-2">
              <Sparkles size={12} className="text-[#FF385C]" />
              <span>{currentFilterObj.displayName}</span>
              {selectedFilter !== 'none' && (
                <span className="text-[10px] text-white/60 font-mono">
                  {Math.round(filterIntensity * 100)}%
                </span>
              )}
            </div>

            {/* Camera switch button */}
            {cameraActive && (
              <button
                type="button"
                onClick={toggleCamera}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white/70 hover:text-white border border-white/15 backdrop-blur-md cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF385C]"
                title="Switch Camera"
              >
                <RefreshCw size={13} />
              </button>
            )}

            {/* Viewfinder corner guides */}
            <div className="absolute inset-3 pointer-events-none opacity-40">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white rounded-tl-sm" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white rounded-tr-sm" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white rounded-bl-sm" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white rounded-br-sm" />
            </div>
          </div>

          {/* Intensity Slider Control */}
          <div className="p-3.5 rounded-2xl bg-[#121218] border border-white/10 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-white/90">
                <Sliders size={13} className="text-[#FF385C]" />
                <span>Filter Intensity</span>
              </div>
              <span className="font-mono text-[#FF385C] font-bold">
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
                className="flex-1 accent-[#FF385C] h-2 bg-white/20 rounded-lg appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF385C]"
              />
              <button
                type="button"
                onClick={() => {
                  sound.playClick()
                  setFilter('none')
                  setFilterIntensity(1.0)
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-white/60 hover:text-white border border-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF385C]"
              >
                <RotateCcw size={11} />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: 40 Filter Swatch Library (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
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
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-[background-color,color] duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF385C] ${
                  activeCategory === cat.id
                    ? 'bg-white text-black shadow-md'
                    : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
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
                  className={`group relative flex flex-col items-center p-2.5 rounded-xl transition-[transform,opacity,border-color,background-color] duration-150 cursor-pointer text-left border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF385C] ${
                    isSelected
                      ? 'bg-[#1E1E28] ring-2 ring-[#FF385C] border-transparent shadow-lg shadow-[#FF385C]/20 scale-[1.02]'
                      : 'bg-[#13131A] hover:bg-[#1A1A24] border-white/5 hover:border-white/15'
                  }`}
                >
                  {/* Swatch Preview Box */}
                  <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-neutral-800 mb-2 relative">
                    <div
                      style={{ filter: previewCss }}
                      className="w-full h-full bg-gradient-to-tr from-amber-200 via-rose-300 to-sky-300 flex items-center justify-center"
                    >
                      <div className="w-6 h-6 rounded-full bg-white/40 backdrop-blur-xs" />
                    </div>
                    {isSelected && (
                      <div className="absolute inset-0 bg-[#FF385C]/15 border-2 border-[#FF385C] rounded-lg" />
                    )}
                  </div>

                  <span className="text-xs font-semibold text-white/95 truncate w-full">
                    {filter.displayName}
                  </span>
                  <span className="text-[10px] text-white/40 truncate w-full">
                    {filter.description}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-4">
        <div className="text-xs text-white/50">
          Selected: <span className="font-semibold text-white">{currentFilterObj.displayName}</span>
          {selectedFilter !== 'none' && ` · ${Math.round(filterIntensity * 100)}%`}
        </div>

        <button
          type="button"
          onClick={() => {
            sound.playClick()
            goToFrameSelect()
          }}
          className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#FF385C] hover:bg-[#E02649] text-white font-bold text-xs shadow-xl shadow-[#FF385C]/25 transition-transform duration-150 transform active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF385C]"
        >
          <span>Next: Choose Frame</span>
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  )
}
