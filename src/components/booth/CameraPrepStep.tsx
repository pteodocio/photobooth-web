import React, { useState, useEffect, useRef } from 'react'
import { useBoothStore } from '../../store/useBoothStore'
import { CameraService } from '../../services/cameraService'
import { getCssFilter, PHOTO_FILTERS } from '../../core/filters'
import { COUNTDOWN_OPTIONS } from '../../core/types'
import { Camera, RefreshCw, ArrowLeft, Timer, Check, Video, Info } from 'lucide-react'
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
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1917] flex flex-col justify-between p-3 sm:p-6 select-none max-w-6xl mx-auto">
      {/* Minimal Studio Header */}
      <PhotoboothStepHeader
        currentStep={3}
        stepTitle="Camera Preparation"
        stepSubtitle="Choose your pose timer and check your framing"
        legacyStepText="Step 3 of 4"
        onExit={resetSession}
      />

      {/* Main Responsive Grid: Left Viewfinder Mirror, Right Timer & Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 my-2 flex-1 items-start">
        {/* Left Column: Live Mirrored Camera Viewfinder (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-2.5">
          <div className="relative aspect-[4/3] w-full bg-[#1C1917] rounded-2xl overflow-hidden border border-black/[0.06] shadow-sm">
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
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#F4F1EC]">
                <Camera size={32} className="text-[#78716C] mb-2" />
                <p className="text-sm font-medium text-[#1C1917]">{cameraError}</p>
                <p className="text-xs text-[#78716C] mt-0.5">Please allow camera permissions.</p>
              </div>
            )}

            {/* Framing Guides and Head Alignment Silhouette */}
            <div className="absolute inset-4 pointer-events-none">
              {/* Corners */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white/70 rounded-tl-sm" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white/70 rounded-tr-sm" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white/70 rounded-bl-sm" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white/70 rounded-br-sm" />

              {/* Subtle center crosshair */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30 pointer-events-none">
                <div className="w-8 h-[1px] bg-white mx-auto" />
                <div className="h-8 w-[1px] bg-white mx-auto -mt-[17px]" />
              </div>

              {/* Oval Face Alignment Guide */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 sm:w-44 h-52 sm:h-64 border border-dashed border-white/30 rounded-full pointer-events-none opacity-60" />
            </div>

            {/* Top Info Bar inside Viewfinder */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
              {/* Filter & Frame Pill */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-xs border border-black/[0.06] shadow-xs text-xs font-medium text-[#1C1917]">
                <span>{filterName}</span>
                <span className="text-[#A8A29E]">·</span>
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: selectedFrame.gradientColors[0] || selectedFrame.backgroundColor }}
                />
                <span>{selectedFrame.name}</span>
              </div>

              {/* Switch Camera Button */}
              <button
                type="button"
                onClick={toggleCamera}
                className="pointer-events-auto p-2 rounded-full bg-white/80 hover:bg-white text-[#1C1917] border border-black/[0.06] backdrop-blur-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D] shadow-xs"
                title="Switch Camera"
              >
                <RefreshCw size={12} />
              </button>
            </div>
          </div>

          {/* Quick instructions banner */}
          <div className="px-3.5 py-2 rounded-xl bg-white border border-black/[0.06] shadow-xs flex items-center gap-2 text-xs text-[#78716C]">
            <Info size={14} className="text-[#FF4D6D] shrink-0" />
            <span>
              Get ready for <strong className="text-[#1C1917] font-semibold">4 automatic shots</strong> with a <strong className="text-[#1C1917] font-semibold">{selectedCountdown}-second countdown</strong> each.
            </span>
          </div>
        </div>

        {/* Right Column: Timer Selection, Session Summary, and Actions (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          {/* Countdown Timer Selector (3 simple clear options) */}
          <div className="p-4 rounded-2xl bg-white border border-black/[0.06] shadow-xs">
            <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-black/[0.05]">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1C1917]">
                <Timer size={13} className="text-[#FF4D6D]" />
                <span>Choose Countdown Timer</span>
              </div>
              <span className="text-[11px] text-[#78716C]">Applies to all 4 shots</span>
            </div>

            <div className="flex flex-col gap-2">
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
                    className={`p-3 rounded-xl border text-left transition-[background-color,border-color,transform] duration-150 cursor-pointer flex flex-col justify-between gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D] ${
                      isSelected
                        ? 'bg-[#FFF0F3] border-[#FF4D6D] ring-2 ring-[#FF4D6D]/20 shadow-xs'
                        : 'bg-white border-black/[0.06] hover:border-black/[0.12] hover:bg-[#FAF8F5] text-[#78716C]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm font-semibold tracking-tight flex items-center gap-1.5 text-[#1C1917]">
                        <span className={`text-base font-bold ${isSelected ? 'text-[#FF4D6D]' : 'text-[#1C1917]'}`}>
                          {option.seconds}s
                        </span>
                        <span className="text-xs">{option.label}</span>
                      </span>
                      {isSelected ? (
                        <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#FF4D6D] text-white text-[9px] font-semibold">
                          <Check size={9} strokeWidth={3} />
                          Selected
                        </span>
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-black/20" />
                      )}
                    </div>

                    <p className="text-[11px] text-[#78716C] leading-snug">
                      {option.description}
                    </p>

                    <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-mono mt-0.5">
                      <Video size={10} />
                      <span>{option.estimatedBtsDuration}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Minimal Session Configuration Summary */}
          <div className="p-3.5 rounded-2xl bg-white border border-black/[0.06] shadow-xs flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-semibold text-[#1C1917] border-b border-black/[0.04] pb-1.5">
              <span>Session Summary</span>
              <span className="text-[10px] text-emerald-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 motion-safe:animate-pulse" />
                Ready
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex flex-col p-2 rounded-xl bg-[#FAF8F5] border border-black/[0.03]">
                <span className="text-[10px] text-[#A8A29E]">Selected Filter</span>
                <span className="font-medium text-[#1C1917] truncate mt-0.5">{filterName}</span>
              </div>

              <div className="flex flex-col p-2 rounded-xl bg-[#FAF8F5] border border-black/[0.03]">
                <span className="text-[10px] text-[#A8A29E]">Selected Frame</span>
                <span className="font-medium text-[#1C1917] truncate mt-0.5">{selectedFrame.name}</span>
              </div>

              <div className="flex flex-col p-2 rounded-xl bg-[#FAF8F5] border border-black/[0.03]">
                <span className="text-[10px] text-[#A8A29E]">Countdown Timer</span>
                <span className="font-semibold text-[#FF4D6D] truncate mt-0.5">
                  {activeOption.label}
                </span>
              </div>

              <div className="flex flex-col p-2 rounded-xl bg-[#FAF8F5] border border-black/[0.03]">
                <span className="text-[10px] text-[#A8A29E]">BTS Recording</span>
                <span className="font-medium text-emerald-600 text-[11px] truncate mt-0.5">
                  Active ({activeOption.estimatedBtsDuration})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div className="pt-3 border-t border-black/[0.06] flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => {
            sound.playClick()
            goToFrameSelect()
          }}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-black/[0.03] text-[#78716C] hover:text-[#1C1917] text-xs font-medium border border-black/[0.06] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D]"
        >
          <ArrowLeft size={14} />
          <span>Change Frame</span>
        </button>

        <button
          type="button"
          onClick={handleStartShooting}
          className="flex items-center gap-2 px-7 py-2.5 rounded-xl bg-[#FF4D6D] hover:bg-[#E11D48] text-white font-semibold text-xs whitespace-nowrap shadow-xs transition-transform duration-150 transform active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D]"
        >
          <Camera size={15} />
          <span>Start Photobooth (4 Shots)</span>
        </button>
      </div>
    </div>
  )
}
