import React, { useEffect, useRef, useState, useCallback } from 'react'
import { CameraService } from '../../services/cameraService'
import { useBoothStore } from '../../store/useBoothStore'
import { CountdownRing } from './CountdownRing'
import { RollingFilmstrip } from './RollingFilmstrip'
import { AppConstants } from '../../core/constants'
import { Camera, X, RefreshCw, Loader2 } from 'lucide-react'
import { sound } from '../../services/soundService'
import { getCssFilter, PHOTO_FILTERS } from '../../core/filters'
import { renderStrip } from '../../services/compositorService'
import { SyncService } from '../../services/syncService'
import { VideoRecorderService } from '../../services/videoRecorderService'

interface WebcamViewfinderProps {
  onExit: () => void
}

export const WebcamViewfinder: React.FC<WebcamViewfinderProps> = ({ onExit }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const isCapturingRef = useRef(false)
  const {
    selectedFrame,
    selectedLayout,
    selectedPrintFormat,
    selectedFilter,
    filterIntensity,
    selectedStamp,
    selectedCountdown,
    sessionId,
    passcode,
    capturedPhotos,
    recordShot,
    attachBtsClipToPhoto,
    setCompositeDataUrl,
    setVideoBlob,
    setVideoUrl,
  } = useBoothStore()

  const [secondsRemaining, setSecondsRemaining] = useState<number>(selectedCountdown)
  const [isFlashing, setIsFlashing] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isCompositing, setIsCompositing] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')

  const activeCssFilter = getCssFilter(selectedFilter, filterIntensity)
  const currentFilterObj = PHOTO_FILTERS.find(f => f.id === selectedFilter) || PHOTO_FILTERS[0]

  // Trigger snapshot & BTS clip recording
  const triggerCapture = useCallback(async () => {
    if (isCapturingRef.current) return
    isCapturingRef.current = true

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

    const photoIndex = capturedPhotos.length
    recordShot(photoDataUrl)

    // Stop BTS clip recording immediately when the photo is captured so the video duration dynamically matches the countdown timer
    let clipUrl: string | undefined
    try {
      const shotBlob = await VideoRecorderService.stopShotRecording()
      if (shotBlob) {
        clipUrl = URL.createObjectURL(shotBlob)
        attachBtsClipToPhoto(photoIndex, clipUrl)
      }
    } catch (err) {
      console.warn('VideoRecorderService: Could not stop shot recording:', err)
    }

    const nextCount = photoIndex + 1
    if (nextCount >= selectedLayout.slotCount) {
      // Completed all shots! Auto-composite strip immediately and transition to exportReady
      setIsCompositing(true)
      try {
        const allPhotos = [...capturedPhotos.map(p => p.dataUrl), photoDataUrl]
        const statePhotos = useBoothStore.getState().capturedPhotos
        const allClips = statePhotos.map(p => p.btsClipUrl).filter((u): u is string => !!u)
        const today = new Date()
        const dateString = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`
        const videoQrUrl = SyncService.getVideoPageUrl(sessionId)

        const rawVideoBlob = await VideoRecorderService.stopRecording()
        let videoBlob = await VideoRecorderService.createMotionStripVideo({
          rawVideoBlob,
          btsClipBlobs: allClips,
          photoDataUrls: allPhotos,
          frame: selectedFrame,
          layout: selectedLayout,
          filter: selectedFilter,
          filterIntensity,
          stampText: selectedStamp,
          dateString,
          passcode,
          durationSeconds: selectedCountdown,
        })
        if (!videoBlob) {
          videoBlob = rawVideoBlob
        }

        if (videoBlob) {
          setVideoBlob(videoBlob)
          const localUrl = URL.createObjectURL(videoBlob)
          setVideoUrl(localUrl)
        }

        const compositeUrl = await renderStrip({
          photoDataUrls: allPhotos,
          frame: selectedFrame,
          layout: selectedLayout,
          printFormat: selectedPrintFormat,
          filter: selectedFilter,
          filterIntensity,
          stampText: selectedStamp,
          dateString,
          studioWatermark: 'KOREAN 4-CUT STUDIO',
          qrData: videoQrUrl,
          passcode,
        })

        setCompositeDataUrl(compositeUrl)

        SyncService.uploadSession(
          sessionId,
          compositeUrl,
          selectedFrame.name,
          selectedFrame.englishTitle || selectedFrame.name,
          selectedLayout.id,
          selectedFilter,
          selectedStamp,
          videoBlob,
          passcode
        ).catch(() => {})
      } catch (err) {
        console.error('Failed to composite strip:', err)
      } finally {
        isCapturingRef.current = false
      }
    } else {
      // Short pause between shots
      setIsPaused(true)
      setTimeout(() => {
        setIsPaused(false)
        isCapturingRef.current = false
        setSecondsRemaining(selectedCountdown)
        if (streamRef.current) {
          VideoRecorderService.startShotRecording(streamRef.current, nextCount)
        }
      }, 1000)
    }
  }, [
    capturedPhotos,
    recordShot,
    selectedLayout,
    selectedFrame,
    selectedPrintFormat,
    selectedFilter,
    filterIntensity,
    selectedStamp,
    selectedCountdown,
    sessionId,
    passcode,
    attachBtsClipToPhoto,
    setCompositeDataUrl,
    setVideoBlob,
    setVideoUrl,
  ])

  // Camera setup
  useEffect(() => {
    let active = true

    async function initCamera() {
      if (videoRef.current) {
        try {
          const stream = await CameraService.startCamera(videoRef.current, facingMode)
          if (active) {
            setCameraError(null)
            streamRef.current = stream || null
            if (stream) {
              VideoRecorderService.startRecording(stream)
              VideoRecorderService.startShotRecording(stream, 0)
            }
          }
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
      VideoRecorderService.stopShotRecording().catch(() => {})
      CameraService.stopCamera()
    }
  }, [facingMode])

  // Automated Countdown Timer
  useEffect(() => {
    if (isCompositing || isPaused) return

    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          triggerCapture()
          return selectedCountdown
        }

        // Sound cues for countdown
        sound.playCountdownBeep(prev === 2 || prev === 1)
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [triggerCapture, isCompositing, isPaused, selectedCountdown])

  const toggleCamera = () => {
    sound.playClick()
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'))
  }

  const handleManualShoot = () => {
    sound.playClick()
    triggerCapture()
  }

  const currentShotIndex = Math.min(capturedPhotos.length + 1, selectedLayout.slotCount)

  return (
    <div className="relative w-full h-full min-h-screen bg-[#18181B] flex flex-col justify-between p-3 sm:p-6 overflow-hidden select-none">
      {/* Studio Strobe Flash overlay */}
      {isFlashing && (
        <div className="fixed inset-0 z-50 bg-white camera-flash-effect pointer-events-none" />
      )}

      {/* Printing Loading Overlay */}
      {isCompositing && (
        <div className="fixed inset-0 z-50 bg-[#18181B]/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
          <Loader2 size={36} className="text-[#FF4D6D] animate-spin mb-3" />
          <h3 className="text-lg font-semibold text-white mb-0.5">Printing Film Strip…</h3>
          <p className="text-xs text-white/50">{currentFilterObj.displayName} · {selectedFrame.name}</p>
        </div>
      )}

      {/* Top Controls Bar */}
      <div className="relative z-20 flex items-center justify-between w-full max-w-3xl mx-auto">
        {/* Frame & Filter Info Pill */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-white/10 backdrop-blur-xs">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: selectedFrame.gradientColors[0] || selectedFrame.backgroundColor }}
          />
          <span className="text-xs font-medium text-white">{selectedFrame.name}</span>
          <span className="text-xs text-white/40">·</span>
          <span className="text-xs text-white/80">{currentFilterObj.displayName}</span>
          <span className="text-xs text-white/40">·</span>
          <span className="text-xs text-white font-mono font-medium">
            {selectedCountdown}s
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleCamera}
            title="Switch Camera"
            className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white/80 hover:text-white border border-white/10 backdrop-blur-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D]"
          >
            <RefreshCw size={14} />
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playClick()
              onExit()
            }}
            title="Exit Booth"
            className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white/80 hover:text-white border border-white/10 backdrop-blur-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D]"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Main 4:3 Viewfinder Stage - Undisputed Hero */}
      <div className="relative z-10 flex-1 flex items-center justify-center my-2">
        <div
          data-testid="viewfinder-framing-mask"
          className="relative aspect-[4/3] w-full max-w-2xl max-h-[66vh] rounded-2xl overflow-hidden border border-white/15 shadow-lg bg-black"
        >
          {/* Mirrored Video Stream with Filter Applied */}
          <video
            ref={videoRef}
            playsInline
            autoPlay
            muted
            style={{ filter: activeCssFilter }}
            className="w-full h-full object-cover transform -scale-x-100"
          />

          {/* Camera Error Fallback */}
          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/90">
              <Camera size={32} className="text-white/40 mb-2" />
              <p className="text-sm font-medium text-white/90">{cameraError}</p>
              <p className="text-xs text-white/50 mt-0.5">Please allow camera permissions.</p>
            </div>
          )}

          {/* Pause Notification Between Shots */}
          {isPaused && (
            <div className="absolute inset-0 z-30 bg-black/40 backdrop-blur-xs flex flex-col items-center justify-center text-center animate-in fade-in">
              <div className="px-4 py-2 rounded-full bg-white text-[#1C1917] font-semibold text-xs shadow-lg">
                Photo {capturedPhotos.length} of {selectedLayout.slotCount} Captured!
              </div>
              <p className="text-xs text-white/70 mt-1.5 font-medium">Get ready for next shot…</p>
            </div>
          )}

          {/* Minimal Corner Framing Marks */}
          <div className="absolute inset-4 pointer-events-none opacity-40">
            <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-white rounded-tl-sm" />
            <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-white rounded-tr-sm" />
            <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-white rounded-bl-sm" />
            <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-white rounded-br-sm" />
          </div>

          {/* Countdown Ring */}
          {!isPaused && !isCompositing && (
            <div className="absolute top-4 left-4 pointer-events-none drop-shadow-md flex items-center gap-2">
              <CountdownRing
                secondsRemaining={secondsRemaining}
                totalSeconds={selectedCountdown}
              />
              <div className="px-2.5 py-1 rounded-lg bg-black/50 border border-white/10 text-[11px] font-semibold text-white">
                <span>Photo {currentShotIndex} of {selectedLayout.slotCount}</span>
                <span className="sr-only">SHOT {currentShotIndex}/{selectedLayout.slotCount}</span>
              </div>
            </div>
          )}

          {/* BTS Recording Live Indicator */}
          {!isCompositing && (
            <div
              data-testid="bts-recording-indicator"
              className="absolute top-4 right-4 pointer-events-none drop-shadow-md flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 border border-white/10 backdrop-blur-xs"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF4D6D] motion-safe:animate-pulse" />
              <span className="text-[10px] font-medium tracking-normal text-white">
                REC BTS ({selectedCountdown}s)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Control Dock: Filmstrip + Take Photo Button */}
      <div className="relative z-20 flex flex-col items-center gap-2.5 w-full max-w-3xl mx-auto">
        <RollingFilmstrip photos={capturedPhotos} layout={selectedLayout} />

        <button
          type="button"
          onClick={handleManualShoot}
          disabled={isCompositing || isPaused}
          className="flex items-center gap-2 px-7 py-3 rounded-full bg-[#FF4D6D] hover:bg-[#E11D48] text-white font-semibold text-xs shadow-md transition-transform duration-150 transform active:scale-95 cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D]"
        >
          <Camera size={15} />
          <span>Take Photo</span>
          <span className="text-xs opacity-80 font-normal">({secondsRemaining}s)</span>
        </button>
      </div>
    </div>
  )
}
