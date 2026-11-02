import React, { useEffect, useRef, useState, useCallback } from 'react'
import { CameraService } from '../../services/cameraService'
import { useBoothStore } from '../../store/useBoothStore'
import { CountdownRing } from './CountdownRing'
import { RollingFilmstrip } from './RollingFilmstrip'
import { AppConstants } from '../../core/constants'
import { Camera, X, RefreshCw } from 'lucide-react'
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
      <div className="relative z-20 flex items-center justify-between w-full max-w-3xl mx-auto">
        {/* Frame Info Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-white/10 backdrop-blur-md">
          <div
            className="w-2.5 h-2.5 rounded-full shadow-sm"
            style={{ backgroundColor: selectedFrame.gradientColors[0] || selectedFrame.backgroundColor }}
          />
          <span className="text-xs font-semibold text-white">{selectedFrame.name}</span>
          <span className="text-xs text-white/50">· {selectedLayout.displayName}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleCamera}
            title="Switch Camera"
            className="p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white/70 hover:text-white border border-white/10 backdrop-blur-md transition-colors cursor-pointer"
          >
            <RefreshCw size={15} />
          </button>
          <button
            onClick={() => {
              sound.playClick()
              onExit()
            }}
            title="Exit Booth"
            className="p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white/70 hover:text-white border border-white/10 backdrop-blur-md transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Main 4:3 Viewfinder Stage */}
      <div className="relative z-10 flex-1 flex items-center justify-center my-2">
        <div
          data-testid="viewfinder-framing-mask"
          className="relative aspect-[4/3] w-full max-w-2xl max-h-[64vh] rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-black"
        >
          {/* Mirrored Video Stream */}
          <video
            ref={videoRef}
            playsInline
            autoPlay
            muted
            className="w-full h-full object-cover transform -scale-x-100"
          />

          {/* Camera Error Fallback */}
          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/90">
              <Camera size={36} className="text-white/40 mb-3" />
              <p className="text-sm font-semibold text-white/80">{cameraError}</p>
              <p className="text-xs text-white/50 mt-1">Please allow camera permissions or test in a supported browser.</p>
            </div>
          )}

          {/* Corner Framing Marks */}
          <div className="absolute inset-4 pointer-events-none">
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#FF385C] rounded-tl-sm" />
            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#FF385C] rounded-tr-sm" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#FF385C] rounded-bl-sm" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#FF385C] rounded-br-sm" />

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30">
              <div className="w-6 h-[1px] bg-white mx-auto" />
              <div className="h-6 w-[1px] bg-white mx-auto -mt-[13px]" />
            </div>
          </div>

          {/* Countdown Ring */}
          <div className="absolute top-4 left-4 pointer-events-none drop-shadow-xl">
            <CountdownRing
              secondsRemaining={secondsRemaining}
              totalSeconds={AppConstants.defaultShotIntervalSeconds}
            />
          </div>
        </div>
      </div>

      {/* Bottom Control Dock: Filmstrip + Take Photo Button */}
      <div className="relative z-20 flex flex-col items-center gap-3 w-full max-w-3xl mx-auto">
        <RollingFilmstrip photos={capturedPhotos} layout={selectedLayout} />

        <button
          onClick={handleManualShoot}
          className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#FF385C] hover:bg-[#E02649] text-white font-bold text-sm shadow-xl shadow-[#FF385C]/30 transition-all transform active:scale-95 cursor-pointer"
        >
          <Camera size={16} />
          <span>Take Photo</span>
          <span className="text-xs opacity-70 font-normal">({secondsRemaining}s)</span>
        </button>
      </div>
    </div>
  )
}
