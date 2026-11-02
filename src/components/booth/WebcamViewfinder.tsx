import React, { useEffect, useRef, useState, useCallback } from 'react'
import { CameraService } from '../../services/cameraService'
import { useBoothStore } from '../../store/useBoothStore'
import { CountdownRing } from './CountdownRing'
import { RollingFilmstrip } from './RollingFilmstrip'
import { AppConstants } from '../../core/constants'
import { Camera, X, RefreshCw } from 'lucide-react'

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
    // Flash effect
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
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'))
  }

  return (
    <div className="relative w-full h-full min-h-screen bg-[#0A0A0C] flex flex-col justify-between p-4 sm:p-6 overflow-hidden select-none">
      {/* Flash overlay */}
      {isFlashing && (
        <div className="fixed inset-0 z-50 bg-white camera-flash-effect pointer-events-none" />
      )}

      {/* Top Controls Bar */}
      <div className="relative z-20 flex items-center justify-between w-full max-w-4xl mx-auto">
        {/* Frame Info Pill */}
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-black/60 border border-white/10 backdrop-blur-md">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: selectedFrame.gradientColors[0] || selectedFrame.backgroundColor }}
          />
          <span className="text-xs font-semibold text-white">{selectedFrame.name}</span>
          <span className="text-[11px] text-[#FF5252] font-medium">({selectedFrame.koreanTitle})</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleCamera}
            title="Switch Camera"
            className="p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white/70 hover:text-white border border-white/10 backdrop-blur-md transition-colors"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={onExit}
            title="Exit Booth"
            className="p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white/70 hover:text-white border border-white/10 backdrop-blur-md transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main 4:3 Korean Viewfinder Stage */}
      <div className="relative z-10 flex-1 flex items-center justify-center my-3">
        <div
          data-testid="viewfinder-framing-mask"
          className="relative aspect-[4/3] w-full max-w-2xl max-h-[64vh] rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black"
        >
          {/* Video Stream */}
          <video
            ref={videoRef}
            playsInline
            autoPlay
            muted
            className="w-full h-full object-cover transform -scale-x-100"
          />

          {/* Camera Error Fallback */}
          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/85">
              <Camera size={36} className="text-white/40 mb-3" />
              <p className="text-sm font-semibold text-white/80">{cameraError}</p>
              <p className="text-xs text-white/50 mt-1">Please allow camera permissions or test in a supported browser.</p>
            </div>
          )}

          {/* Korean Photobooth Corner Brackets & Framing Marks */}
          <div className="absolute inset-4 pointer-events-none">
            {/* Top-Left Bracket */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#FF5252] rounded-tl-lg" />
            {/* Top-Right Bracket */}
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#FF5252] rounded-tr-lg" />
            {/* Bottom-Left Bracket */}
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#FF5252] rounded-bl-lg" />
            {/* Bottom-Right Bracket */}
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#FF5252] rounded-br-lg" />

            {/* Center Crosshair */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-40">
              <div className="w-6 h-0.5 bg-white/70 mx-auto" />
              <div className="h-6 w-0.5 bg-white/70 mx-auto -mt-3.5" />
            </div>
          </div>

          {/* Countdown Ring Centered Floating Overlay */}
          <div className="absolute top-6 left-6 pointer-events-none drop-shadow-xl">
            <CountdownRing
              secondsRemaining={secondsRemaining}
              totalSeconds={AppConstants.defaultShotIntervalSeconds}
            />
          </div>
        </div>
      </div>

      {/* Bottom Control Dock */}
      <div className="relative z-20 flex flex-col items-center gap-4 w-full max-w-4xl mx-auto">
        {/* Rolling Filmstrip Progress */}
        <RollingFilmstrip photos={capturedPhotos} layout={selectedLayout} />

        {/* Floating Remote Clicker "찰칵 Shoot Now" Button */}
        <button
          onClick={triggerCapture}
          className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#FF5252] hover:bg-[#FF3838] text-white font-bold text-sm shadow-xl shadow-[#FF5252]/30 transition-all transform active:scale-95"
        >
          <Camera size={18} />
          찰칵 Shoot Now
        </button>
      </div>
    </div>
  )
}
