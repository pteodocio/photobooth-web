import React, { useState, useEffect, useRef } from 'react'
import { useBoothStore } from '../../store/useBoothStore'
import { CameraService } from '../../services/cameraService'
import { getCssFilter, PHOTO_FILTERS } from '../../core/filters'
import { COUNTDOWN_OPTIONS } from '../../core/types'
import { Camera, RefreshCw, ArrowLeft, Sparkles, Info, Timer, Check, Video } from 'lucide-react'
import { sound } from '../../services/soundService'
import { PhotoboothStepHeader } from './PhotoboothStepHeader'

export const CameraPrepStep: React.FC = () => {
  const {
    selectedFilter,
    filterIntensity,
    selectedFrame,
    selectedCountdown,
    setCountdown,
    goToFrameSelect,
    startCapture,
    resetSession,
  } = useBoothStore()

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [cameraError, setCameraError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const activeCssFilter = getCssFilter(selectedFilter, filterIntensity)
  const filterName = PHOTO_FILTERS.find(f => f.id === selectedFilter)?.displayName || 'Original'

  const activeOption = COUNTDOWN_OPTIONS.find(opt => opt.seconds === selectedCountdown) || COUNTDOWN_OPTIONS[0]

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
    <div className="min-h-screen bg-[#08080B] text-[#F3F3F6] flex flex-col justify-between p-3 sm:p-6 select-none max-w-5xl mx-auto">
      {/* Unified 7-Stage Header */}
      <PhotoboothStepHeader
        currentStep={3}
        stepTitle="Camera Preparation"
        stepSubtitle="Choose your pose timer and align in the studio viewfinder"
        legacyStepText="Step 3 of 4"
        onExit={resetSession}
      />

      {/* Main Viewfinder Stage with Live Filter & Framing Guides */}
      <div className="my-2 flex-1 flex flex-col items-center justify-center">
        <div className="relative aspect-[4/3] w-full max-w-2xl max-h-[52vh] bg-black rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
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
            <div className="absolute top-0 left-0 w-7 h-7 border-t-2 border-l-2 border-[#FF385C] rounded-tl-sm" />
            <div className="absolute top-0 right-0 w-7 h-7 border-t-2 border-r-2 border-[#FF385C] rounded-tr-sm" />
            <div className="absolute bottom-0 left-0 w-7 h-7 border-b-2 border-l-2 border-[#FF385C] rounded-bl-sm" />
            <div className="absolute bottom-0 right-0 w-7 h-7 border-b-2 border-r-2 border-[#FF385C] rounded-br-sm" />

            {/* Subtle center crosshair */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-35 pointer-events-none">
              <div className="w-10 h-[1.5px] bg-white mx-auto" />
              <div className="h-10 w-[1.5px] bg-white mx-auto -mt-[21px]" />
            </div>

            {/* Oval Face Alignment Guide */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-60 border border-dashed border-white/25 rounded-full pointer-events-none opacity-50" />
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
              type="button"
              onClick={toggleCamera}
              className="pointer-events-auto p-2 rounded-full bg-black/70 hover:bg-black/90 text-white/80 hover:text-white border border-white/15 backdrop-blur-md transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF385C]"
              title="Switch Camera"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Countdown Timer Selector (Requirement 1, 2, 3) */}
        <div className="w-full max-w-2xl mt-3.5">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider">
              <Timer size={14} className="text-[#FF385C]" />
              <span>Choose Countdown Timer</span>
            </div>
            <span className="text-[11px] text-white/50 font-mono">Applies to all 4 shots</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {COUNTDOWN_OPTIONS.map(option => {
              const isSelected = selectedCountdown === option.seconds
              return (
                <button
                  key={option.seconds}
                  type="button"
                  data-testid={`timer-option-${option.seconds}`}
                  onClick={() => {
                    sound.playClick()
                    setCountdown(option.seconds)
                  }}
                  className={`p-3 rounded-2xl border text-left transition-[background-color,border-color,transform] duration-150 cursor-pointer flex flex-col justify-between gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF385C] ${
                    isSelected
                      ? 'bg-[#FF385C]/10 border-[#FF385C] ring-1 ring-[#FF385C] shadow-lg shadow-[#FF385C]/15 text-white'
                      : 'bg-white/5 border-white/10 hover:border-white/20 text-white/70 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-base font-bold font-mono tracking-tight flex items-center gap-1.5">
                      <span className={`text-lg font-black ${isSelected ? 'text-[#FF385C]' : 'text-white'}`}>
                        {option.seconds}s
                      </span>
                      <span className="text-xs font-semibold text-white/90">{option.label}</span>
                    </span>
                    {isSelected ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FF385C] text-white text-[9px] font-bold font-mono tracking-wider">
                        <Check size={10} strokeWidth={3} />
                        SELECTED
                      </span>
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full border border-white/30" />
                    )}
                  </div>

                  <p className="text-[11px] text-white/60 leading-tight">
                    {option.description}
                  </p>

                  <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono mt-0.5">
                    <Video size={10} />
                    <span>{option.estimatedBtsDuration}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Session Configuration Summary */}
        <div className="w-full max-w-2xl mt-3 p-3 sm:p-3.5 rounded-2xl bg-[#111116] border border-white/10 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-bold text-white/80 border-b border-white/5 pb-1.5">
            <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px] text-white/90">
              <Sparkles size={12} className="text-[#FF385C]" />
              Session Summary
            </span>
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Locked for Session
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {/* Filter */}
            <div className="flex flex-col p-2 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] text-white/40 uppercase">Selected Filter</span>
              <span className="font-semibold text-white truncate mt-0.5">{filterName}</span>
            </div>

            {/* Frame */}
            <div className="flex flex-col p-2 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] text-white/40 uppercase">Selected Frame</span>
              <span className="font-semibold text-white truncate mt-0.5">{selectedFrame.name}</span>
            </div>

            {/* Countdown Timer */}
            <div className="flex flex-col p-2 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] text-white/40 uppercase">Countdown Timer</span>
              <span className="font-bold text-[#FF385C] font-mono truncate mt-0.5">
                {activeOption.label}
              </span>
            </div>

            {/* BTS Recording */}
            <div className="flex flex-col p-2 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] text-white/40 uppercase">BTS Recording</span>
              <span className="font-semibold text-emerald-400 text-[11px] truncate mt-0.5">
                Active ({activeOption.estimatedBtsDuration})
              </span>
            </div>
          </div>
        </div>

        {/* Clear Instructions Banner */}
        <div className="mt-3 max-w-2xl w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2.5 text-xs text-white/70">
          <Info size={15} className="text-[#FF385C] shrink-0" />
          <span>
            Get ready for <strong className="text-white">4 automatic shots</strong> with a <strong className="text-white">{selectedCountdown}-second countdown</strong> each. Change poses between shots!
          </span>
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => {
            sound.playClick()
            goToFrameSelect()
          }}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF385C]"
        >
          <ArrowLeft size={15} />
          <span>Change Frame</span>
        </button>

        <button
          type="button"
          onClick={handleStartShooting}
          className="flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-[#FF385C] hover:bg-[#E02649] text-white font-bold text-sm shadow-xl shadow-[#FF385C]/30 transition-transform duration-150 transform active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF385C]"
        >
          <Camera size={16} />
          <span>Start Photobooth (4 Shots)</span>
        </button>
      </div>
    </div>
  )
}
