import React, { useState, useEffect, useRef } from 'react'
import { useBoothStore } from '../../store/useBoothStore'
import { CameraService } from '../../services/cameraService'
import { getCssFilter, PHOTO_FILTERS } from '../../core/filters'
import { Camera, RefreshCw, ArrowLeft, Sparkles, X, Info } from 'lucide-react'
import { sound } from '../../services/soundService'

export const CameraPrepStep: React.FC = () => {
  const {
    selectedFilter,
    filterIntensity,
    selectedFrame,
    goToFrameSelect,
    startCapture,
    resetSession,
  } = useBoothStore()

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [cameraError, setCameraError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const activeCssFilter = getCssFilter(selectedFilter, filterIntensity)
  const filterName = PHOTO_FILTERS.find(f => f.id === selectedFilter)?.displayName || 'Original'

  useEffect(() => {
    let isMounted = true
    async function startCamera() {
      if (videoRef.current) {
        try {
          await CameraService.startCamera(videoRef.current, facingMode)
          if (isMounted) setCameraError(null)
        } catch (err: unknown) {
          if (isMounted) {
            setCameraError(err instanceof Error ? err.message : 'Camera access failed')
          }
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

  const handleStartShooting = () => {
    sound.playClick()
    startCapture()
  }

  return (
    <div className="min-h-screen bg-[#08080B] text-[#F3F3F6] flex flex-col justify-between p-4 sm:p-6 select-none max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-full bg-[#FF385C]/20 border border-[#FF385C]/30 text-[#FF385C] text-xs font-bold uppercase tracking-wider">
            Step 3 of 4
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white">Camera Preparation</h1>
            <p className="text-xs text-white/50">Align your face inside the framing guide</p>
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

      {/* Main Viewfinder Stage with Live Filter */}
      <div className="my-4 flex-1 flex flex-col items-center justify-center">
        <div className="relative aspect-[4/3] w-full max-w-2xl max-h-[60vh] bg-black rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
          {/* Mirrored live video stream with active CSS filter */}
          <video
            ref={videoRef}
            playsInline
            autoPlay
            muted
            style={{ filter: activeCssFilter }}
            className="w-full h-full object-cover transform -scale-x-100"
          />

          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/90">
              <Camera size={36} className="text-white/40 mb-3" />
              <p className="text-sm font-semibold text-white/90">{cameraError}</p>
              <p className="text-xs text-white/50 mt-1">Please allow camera permissions or test in a supported browser.</p>
            </div>
          )}

          {/* Framing Guides and Head Alignment Silhouette */}
          <div className="absolute inset-4 pointer-events-none">
            {/* Corners */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#FF385C] rounded-tl-sm" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#FF385C] rounded-tr-sm" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#FF385C] rounded-bl-sm" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#FF385C] rounded-br-sm" />

            {/* Subtle center crosshair */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-35 pointer-events-none">
              <div className="w-10 h-[1.5px] bg-white mx-auto" />
              <div className="h-10 w-[1.5px] bg-white mx-auto -mt-[21px]" />
            </div>

            {/* Oval Face Alignment Guide */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-64 border border-dashed border-white/25 rounded-full pointer-events-none opacity-50" />
          </div>

          {/* Top Info Bar inside Viewfinder */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
            {/* Filter & Frame Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/70 border border-white/15 backdrop-blur-md">
              <Sparkles size={12} className="text-[#FF385C]" />
              <span className="text-xs font-semibold text-white">{filterName}</span>
              <span className="text-xs text-white/50">·</span>
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: selectedFrame.gradientColors[0] || selectedFrame.backgroundColor }}
              />
              <span className="text-xs font-semibold text-white">{selectedFrame.name}</span>
            </div>

            {/* Switch Camera Button */}
            <button
              onClick={toggleCamera}
              className="pointer-events-auto p-2 rounded-full bg-black/70 hover:bg-black/90 text-white/80 hover:text-white border border-white/15 backdrop-blur-md transition-colors cursor-pointer"
              title="Switch Camera"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Clear Instructions Banner */}
        <div className="mt-3 max-w-md w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2.5 text-xs text-white/70">
          <Info size={16} className="text-[#FF385C] shrink-0" />
          <span>
            Get ready for <strong className="text-white">4 automatic shots</strong> with a <strong className="text-white">3-second countdown</strong> each. Change poses between shots!
          </span>
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-4">
        <button
          onClick={() => {
            sound.playClick()
            goToFrameSelect()
          }}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
        >
          <ArrowLeft size={15} />
          <span>Change Frame</span>
        </button>

        <button
          onClick={handleStartShooting}
          className="flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-[#FF385C] hover:bg-[#E02649] text-white font-bold text-sm shadow-xl shadow-[#FF385C]/30 transition-all transform active:scale-95 cursor-pointer"
        >
          <Camera size={16} />
          <span>Start Photobooth (4 Shots)</span>
        </button>
      </div>
    </div>
  )
}
