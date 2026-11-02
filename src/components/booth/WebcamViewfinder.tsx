import React, { useEffect, useRef, useState, useCallback } from 'react'
import { CameraService } from '../../services/cameraService'
import { useBoothStore } from '../../store/useBoothStore'
import { CountdownRing } from './CountdownRing'
import { RollingFilmstrip } from './RollingFilmstrip'
import { AppConstants } from '../../core/constants'
import { Camera, X, RefreshCw, Eye } from 'lucide-react'
import { sound } from '../../services/soundService'

interface WebcamViewfinderProps {
  onExit: () => void
}

export const WebcamViewfinder: React.FC<WebcamViewfinderProps> = ({ onExit }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const { selectedFrame, selectedLayout, capturedPhotos, recordShot } = useBoothStore()

  const [secondsRemaining, setSecondsRemaining] = useState(AppConstants.defaultCountdownSeconds)
  const [isFlashing, setIsFlashing] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')

  // Trigger snapshot
  const triggerCapture = useCallback(() => {
    // Sound & Flash effect
    sound.playShutterSound()
    setIsFlashing(true)
    setTimeout(() => setIsFlashing(false), AppConstants.flashDurationMs + 40)

    let photoDataUrl = 'data:image/png;base64,mockShot'
    if (videoRef.current) {
      try {
        photoDataUrl = CameraService.captureFrame(videoRef.current)
      } catch {
        photoDataUrl = 'data:image/png;base64,captured'
      }
    }

    recordShot(photoDataUrl)
    setSecondsRemaining(AppConstants.defaultShotIntervalSeconds)
  }, [recordShot])

  // Camera setup
  useEffect(() => {
    let active = true

    async function initCamera() {
      if (videoRef.current) {
        try {
          await CameraService.startCamera(videoRef.current, facingMode)
          if (active) setCameraError(null)
        } catch (err: unknown) {
          if (active) {
            setCameraError(err instanceof Error ? err.message : 'Camera access failed')
          }
        }
      }
    }

    initCamera()

    return () => {
      active = false
      CameraService.stopCamera()
    }
  }, [facingMode])

  // Automated Countdown Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 4 && prev > 1) {
          sound.playCountdownBeep(false)
        } else if (prev === 1) {
          sound.playCountdownBeep(true)
        }

        if (prev <= 1) {
          triggerCapture()
          return AppConstants.defaultShotIntervalSeconds
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [triggerCapture])

  const toggleCamera = () => {
    sound.playClick()
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'))
  }

  const handleManualShoot = () => {
    sound.playClick()
    triggerCapture()
  }

  return (
    <div className="relative w-full h-full min-h-screen bg-[#08080B] flex flex-col justify-between p-3 sm:p-6 overflow-hidden select-none">
      {/* Studio Strobe Flash overlay */}
      {isFlashing && (
        <div className="fixed inset-0 z-50 bg-white camera-flash-effect pointer-events-none" />
      )}

      {/* Top Controls Bar */}
      <div className="relative z-20 flex items-center justify-between w-full max-w-4xl mx-auto">
        {/* Frame Info Pill */}
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg bg-[#14141B] border border-[#23232E]">
          <div
            className="w-3 h-3 rounded-full shadow-sm"
            style={{ backgroundColor: selectedFrame.gradientColors[0] || selectedFrame.backgroundColor }}
          />
          <span className="text-xs font-mono font-bold text-white">{selectedFrame.name}</span>
          <span className="text-[11px] text-[#FF385C] font-semibold">({selectedFrame.koreanTitle})</span>
          <span className="text-[10px] text-white/40 hidden sm:inline">· {selectedLayout.displayName}</span>
        </div>

        {/* Live Studio Indicators & Action Buttons */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#14141B] border border-[#23232E] text-[11px] font-mono text-emerald-400">
            <Eye size={12} />
            <span>MIRROR VIEW (거울 모드)</span>
          </div>

          <button
            onClick={toggleCamera}
            title="Switch Camera"
            className="p-2.5 rounded-lg bg-[#14141B] hover:bg-[#1E1E28] text-white/70 hover:text-white border border-[#23232E] transition-colors cursor-pointer"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => {
              sound.playClick()
              onExit()
            }}
            title="Exit Booth"
            className="p-2.5 rounded-lg bg-[#14141B] hover:bg-[#1E1E28] text-white/70 hover:text-white border border-[#23232E] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Main 4:3 Korean Viewfinder Stage */}
      <div className="relative z-10 flex-1 flex items-center justify-center my-2">
        <div
          data-testid="viewfinder-framing-mask"
          className="relative aspect-[4/3] w-full max-w-2xl max-h-[64vh] rounded-2xl overflow-hidden border-2 border-[#2C2C3A] shadow-2xl bg-black"
        >
          {/* Video Stream (Mirrored for photobooth selfie natural feel) */}
          <video
            ref={videoRef}
            playsInline
            autoPlay
            muted
            className="w-full h-full object-cover transform -scale-x-100"
          />

          {/* Camera Error Fallback */}
          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#0F0F14]">
              <Camera size={36} className="text-white/40 mb-3" />
              <p className="text-sm font-semibold text-white/80">{cameraError}</p>
              <p className="text-xs text-white/50 mt-1">Please allow camera permissions or test in a supported browser.</p>
            </div>
          )}

          {/* Studio Viewfinder Corner Framing Brackets */}
          <div className="absolute inset-4 pointer-events-none">
            {/* Top-Left Bracket */}
            <div className="absolute top-0 left-0 w-7 h-7 border-t-3 border-l-3 border-[#FF385C] rounded-tl-md" />
            {/* Top-Right Bracket */}
            <div className="absolute top-0 right-0 w-7 h-7 border-t-3 border-r-3 border-[#FF385C] rounded-tr-md" />
            {/* Bottom-Left Bracket */}
            <div className="absolute bottom-0 left-0 w-7 h-7 border-b-3 border-l-3 border-[#FF385C] rounded-bl-md" />
            {/* Bottom-Right Bracket */}
            <div className="absolute bottom-0 right-0 w-7 h-7 border-b-3 border-r-3 border-[#FF385C] rounded-br-md" />

            {/* Subtle Viewfinder Center Crosshair */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30">
              <div className="w-8 h-[1px] bg-white mx-auto" />
              <div className="h-8 w-[1px] bg-white mx-auto -mt-[17px]" />
            </div>

            {/* Camera Technical Telemetry Readout */}
            <div className="absolute bottom-1 left-2 font-mono text-[9px] text-white/50 tracking-wider">
              REC ● 4:3 RATIO · RAW 300DPI
            </div>
          </div>

          {/* Countdown Ring Floating Overlay */}
          <div className="absolute top-4 left-4 pointer-events-none drop-shadow-2xl">
            <CountdownRing
              secondsRemaining={secondsRemaining}
              totalSeconds={AppConstants.defaultShotIntervalSeconds}
            />
          </div>
        </div>
      </div>

      {/* Bottom Control Dock: Filmstrip + Handheld Remote Shutter */}
      <div className="relative z-20 flex flex-col items-center gap-3 w-full max-w-4xl mx-auto">
        {/* Rolling Filmstrip Progress */}
        <RollingFilmstrip photos={capturedPhotos} layout={selectedLayout} />

        {/* Handheld Cable-Release Styled Remote Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleManualShoot}
            className="group relative flex items-center gap-3 px-8 py-3.5 rounded-2xl bg-[#FF385C] hover:bg-[#E02649] text-white font-mono font-bold text-sm shadow-2xl shadow-[#FF385C]/35 border border-[#FF6680]/50 transition-all transform active:scale-95 cursor-pointer"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-white animate-ping opacity-75" />
            <span>찰칵 Shoot Now</span>
            <span className="text-[10px] opacity-70 font-normal">({secondsRemaining}s)</span>
          </button>
        </div>
      </div>
    </div>
  )
}
