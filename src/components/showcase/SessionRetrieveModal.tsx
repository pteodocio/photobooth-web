import React, { useState, useEffect, useRef } from 'react'
import {
  X,
  KeyRound,
  QrCode,
  History,
  Camera,
  Upload,
  AlertCircle,
  Loader2,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { sound } from '../../services/soundService'
import { SyncService, type RecentSessionItem } from '../../services/syncService'
import { QrScannerService } from '../../services/qrScannerService'

interface SessionRetrieveModalProps {
  isOpen: boolean
  onClose: () => void
  onRetrieve: (token: string, type?: 'video' | 'strip') => void
}

type TabType = 'code' | 'scan' | 'recent'

export const SessionRetrieveModal: React.FC<SessionRetrieveModalProps> = ({
  isOpen,
  onClose,
  onRetrieve,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('code')

  // Passcode tab state
  const [digits, setDigits] = useState<string[]>(['', '', '', ''])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const digitInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  // Scanner tab state
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isProcessingFile, setIsProcessingFile] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanLoopRef = useRef<number | null>(null)

  // Recent tab state
  const [recentSessions, setRecentSessions] = useState<RecentSessionItem[]>([])

  // Load recent sessions on open and reset inputs
  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', ''])
      setSearchError(null)
      setIsSearching(false)
      const recents = SyncService.getRecentSessions()
      setRecentSessions(recents)

      // Auto-focus first digit input after brief animation delay
      setTimeout(() => {
        digitInputRefs[0].current?.focus()
      }, 150)
    } else {
      stopCamera()
    }
  }, [isOpen])

  // Stop camera when switching away from scan tab
  useEffect(() => {
    if (activeTab === 'scan' && isOpen) {
      startCamera()
    } else {
      stopCamera()
    }
  }, [activeTab, isOpen])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  // Start live webcam for QR scanning
  const startCamera = async () => {
    setCameraError(null)
    setCameraActive(false)
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        setCameraError('Camera access is not supported on this browser.')
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      })

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play().catch(() => {})
        setCameraActive(true)
        beginScanLoop()
      }
    } catch {
      setCameraError('Camera permission denied or camera unavailable. You can upload a photo of your strip below.')
    }
  }

  const stopCamera = () => {
    if (scanLoopRef.current) {
      cancelAnimationFrame(scanLoopRef.current)
      scanLoopRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
  }

  // Live video QR detection loop
  const beginScanLoop = () => {
    const checkFrame = async () => {
      if (!videoRef.current || !streamRef.current) return

      try {
        const scanResult = await QrScannerService.scanVideoFrame(videoRef.current)
        if (scanResult) {
          sound.playClick()
          stopCamera()
          handleScannedResult(scanResult.value, scanResult.type)
          return
        }
      } catch {
        // Frame scan failed; continue loop
      }

      scanLoopRef.current = requestAnimationFrame(checkFrame)
    }

    scanLoopRef.current = requestAnimationFrame(checkFrame)
  }

  // Handle scanned token or code from camera or uploaded image
  const handleScannedResult = async (val: string, type: 'video' | 'strip' | 'passcode' | 'token') => {
    if (type === 'passcode' || (/^\d{4}$/.test(val))) {
      await lookupByPasscode(val)
      return
    }

    if (type === 'video') {
      onRetrieve(val, 'video')
      onClose()
      return
    }

    if (type === 'strip') {
      onRetrieve(val, 'strip')
      onClose()
      return
    }

    onRetrieve(val, 'video')
    onClose()
  }

  // Handle photo file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsProcessingFile(true)
    setCameraError(null)

    try {
      const scanResult = await QrScannerService.scanImageFile(file)
      if (scanResult) {
        sound.playClick()
        handleScannedResult(scanResult.value, scanResult.type)
      } else {
        setCameraError('No photobooth QR code detected in that photo. Please try another image or enter the 4-digit code directly.')
      }
    } catch {
      setCameraError('Could not process that image. Please try entering your 4-digit code.')
    } finally {
      setIsProcessingFile(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Digit input handling
  const handleDigitChange = (index: number, value: string) => {
    const cleanVal = value.replace(/[^0-9]/g, '').slice(-1)
    const newDigits = [...digits]
    newDigits[index] = cleanVal
    setDigits(newDigits)
    setSearchError(null)

    if (cleanVal && index < 3) {
      digitInputRefs[index + 1].current?.focus()
    }

    // Auto-submit when all 4 digits entered
    if (cleanVal && index === 3) {
      const fullPin = newDigits.join('')
      if (fullPin.length === 4) {
        lookupByPasscode(fullPin)
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      digitInputRefs[index - 1].current?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 4)
    if (!pasted) return

    const newDigits = ['', '', '', '']
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i]
    }
    setDigits(newDigits)
    setSearchError(null)

    if (pasted.length === 4) {
      digitInputRefs[3].current?.focus()
      lookupByPasscode(pasted)
    } else {
      digitInputRefs[pasted.length]?.current?.focus()
    }
  }

  const lookupByPasscode = async (code: string) => {
    setIsSearching(true)
    setSearchError(null)

    try {
      const result = await SyncService.fetchByPasscode(code)
      if (result) {
        onRetrieve(result.token, result.isVideo ? 'video' : 'strip')
        onClose()
      } else {
        setSearchError(`No photos found for code ${code}. Please double check the 4 digits printed on your strip.`)
      }
    } catch {
      setSearchError('Connection issue. Please verify your connection and try again.')
    } finally {
      setIsSearching(false)
    }
  }

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const fullPin = digits.join('')
    if (fullPin.length === 4) {
      lookupByPasscode(fullPin)
    }
  }

  const formatRelativeTime = (timestamp: number): string => {
    const diffSeconds = Math.floor((Date.now() - timestamp) / 1000)
    if (diffSeconds < 60) return 'Just now'
    const diffMinutes = Math.floor(diffSeconds / 60)
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in select-none">
      <div className="relative w-full max-w-lg bg-white border border-black/[0.08] rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col max-h-[90vh]">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            sound.playClick()
            onClose()
          }}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-black/[0.03] hover:bg-black/[0.06] flex items-center justify-center text-[#78716C] hover:text-[#1C1917] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D]"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-2xl bg-[#FFF0F3] border border-[#FF4D6D]/20 flex items-center justify-center text-[#FF4D6D]">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1C1917] tracking-tight leading-tight">
              Find Your Photos
            </h3>
            <p className="text-xs text-[#78716C] mt-0.5">
              Access your strip or live motion video
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center p-1 bg-black/[0.03] rounded-2xl border border-black/[0.04] mb-5" role="tablist">
          <button
            type="button"
            onClick={() => {
              sound.playClick()
              setActiveTab('code')
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-[background-color,color] duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D] ${
              activeTab === 'code'
                ? 'bg-white text-[#FF4D6D] shadow-xs font-semibold'
                : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            <KeyRound size={13} />
            <span>Photo Code</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick()
              setActiveTab('scan')
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-[background-color,color] duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D] ${
              activeTab === 'scan'
                ? 'bg-white text-[#FF4D6D] shadow-xs font-semibold'
                : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            <QrCode size={13} />
            <span>Scan QR</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick()
              setActiveTab('recent')
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-[background-color,color] duration-150 cursor-pointer relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D] ${
              activeTab === 'recent'
                ? 'bg-white text-[#FF4D6D] shadow-xs font-semibold'
                : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            <History size={13} />
            <span>Recent</span>
            {recentSessions.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#FFF0F3] text-[#FF4D6D] text-[10px] flex items-center justify-center font-bold">
                {recentSessions.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: 4-Digit Passcode Input */}
        {activeTab === 'code' && (
          <form onSubmit={handlePasscodeSubmit} className="space-y-5 flex-1 flex flex-col justify-between">
            <div className="text-center py-1">
              <label className="block text-xs font-medium text-[#1C1917] mb-1">
                Enter the 4-digit code printed on your strip
              </label>
              <p className="text-[11px] text-[#A8A29E] mb-5">
                Look for <span className="font-mono font-semibold text-[#1C1917]">CODE: XXXX</span> at the bottom of your strip
              </p>

              {/* 4 Digit Boxes */}
              <div className="flex items-center justify-center gap-3 sm:gap-4 my-2">
                {digits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={digitInputRefs[idx]}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleDigitChange(idx, e.target.value)}
                    onKeyDown={e => handleKeyDown(idx, e)}
                    onPaste={handlePaste}
                    className="w-13 h-16 sm:w-16 sm:h-20 text-center font-mono text-2xl sm:text-3xl font-bold rounded-2xl bg-black/[0.02] border-2 border-black/[0.08] text-[#1C1917] focus:border-[#FF4D6D] focus:bg-white focus:outline-none transition-[border-color,background-color] duration-150 shadow-inner"
                    autoComplete="off"
                  />
                ))}
              </div>

              {/* Error Message */}
              {searchError && (
                <div className="mt-4 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2 text-left">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{searchError}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-black/[0.06]">
              <button
                type="button"
                onClick={() => {
                  sound.playClick()
                  onClose()
                }}
                className="px-4 py-2 rounded-xl text-xs text-[#78716C] hover:text-[#1C1917] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D]"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={digits.join('').length !== 4 || isSearching}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#FF4D6D] hover:bg-[#E11D48] disabled:opacity-40 text-white text-xs font-semibold shadow-xs transition-transform duration-150 active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D]"
              >
                {isSearching ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <span>View Photos</span>
                    <ArrowRight size={13} />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Camera QR Scan & Photo Upload */}
        {activeTab === 'scan' && (
          <div className="space-y-4 flex-1 flex flex-col justify-between overflow-y-auto">
            <div className="flex flex-col items-center">
              {/* Camera Viewfinder Box */}
              <div className="relative w-full aspect-video sm:aspect-[4/3] max-w-sm rounded-2xl overflow-hidden bg-black border border-black/[0.08] flex items-center justify-center">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Reticle Target Overlay */}
                {cameraActive && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-40 h-40 sm:w-48 sm:h-48 border-2 border-dashed border-[#FF4D6D] rounded-2xl relative animate-pulse flex items-center justify-center">
                      <div className="w-full h-0.5 bg-[#FF4D6D]/60 absolute top-1/2 transform -translate-y-1/2" />
                    </div>
                  </div>
                )}

                {!cameraActive && !cameraError && (
                  <div className="text-center p-4">
                    <Camera size={26} className="mx-auto text-white/40 mb-1.5 animate-pulse" />
                    <span className="text-xs text-white/60">Starting camera preview...</span>
                  </div>
                )}
              </div>

              {cameraError && (
                <div className="w-full mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{cameraError}</span>
                </div>
              )}

              <p className="text-[11px] text-[#A8A29E] text-center mt-2.5">
                Point your camera at the QR badge on your printed photobooth strip
              </p>
            </div>

            {/* Photo File Upload Alternative */}
            <div className="pt-3 border-t border-black/[0.06] flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => {
                  sound.playClick()
                  fileInputRef.current?.click()
                }}
                disabled={isProcessingFile}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-black/[0.02] hover:bg-black/[0.05] border border-black/[0.06] text-xs font-medium text-[#1C1917] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D]"
              >
                {isProcessingFile ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Analyzing Image...</span>
                  </>
                ) : (
                  <>
                    <Upload size={13} className="text-[#0EA5E9]" />
                    <span>Upload Photo of Strip</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playClick()
                  onClose()
                }}
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs text-[#78716C] hover:text-[#1C1917] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Recent Photos on This Device */}
        {activeTab === 'recent' && (
          <div className="flex-1 flex flex-col justify-between overflow-hidden">
            {recentSessions.length > 0 ? (
              <div className="overflow-y-auto max-h-[50vh] pr-1 grid grid-cols-2 sm:grid-cols-3 gap-2.5 my-1">
                {recentSessions.map((session, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      sound.playClick()
                      onRetrieve(session.token, session.videoUrl ? 'video' : 'strip')
                      onClose()
                    }}
                    className="group relative flex flex-col rounded-2xl bg-[#FAF8F5] border border-black/[0.06] hover:border-[#FF4D6D] overflow-hidden p-2 text-left transition-[border-color,transform] duration-150 active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D]"
                  >
                    {/* Thumbnail */}
                    <div className="w-full aspect-[9/16] max-h-36 bg-neutral-100 rounded-xl overflow-hidden mb-1.5 relative">
                      <img
                        src={session.compositeUrl}
                        alt={session.frameName}
                        className="w-full h-full object-contain group-hover:scale-102 transition-transform duration-150"
                        loading="lazy"
                      />
                      {session.videoUrl && (
                        <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-[#FF4D6D] text-[8px] font-bold text-white shadow-xs">
                          VIDEO
                        </div>
                      )}
                    </div>

                    <div className="px-1">
                      <span className="block text-xs font-semibold text-[#1C1917] truncate">
                        {session.frameName}
                      </span>
                      <div className="flex items-center justify-between text-[10px] text-[#78716C] mt-0.5">
                        <span>{formatRelativeTime(session.timestamp)}</span>
                        {session.passcode && (
                          <span className="font-mono text-[#FF4D6D] font-medium">
                            #{session.passcode}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-2xl bg-black/[0.03] border border-black/[0.05] flex items-center justify-center text-[#A8A29E] mb-2.5">
                  <History size={20} />
                </div>
                <h4 className="text-xs font-semibold text-[#1C1917] mb-0.5">
                  No Recent Photos Found
                </h4>
                <p className="text-xs text-[#78716C] max-w-xs mb-3">
                  Photos captured on this device will automatically appear here.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick()
                    setActiveTab('code')
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-black/[0.04] hover:bg-black/[0.08] text-[#1C1917] text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D]"
                >
                  Enter Photo Code
                </button>
              </div>
            )}

            <div className="flex items-center justify-end pt-3 border-t border-black/[0.06]">
              <button
                type="button"
                onClick={() => {
                  sound.playClick()
                  onClose()
                }}
                className="px-4 py-2 rounded-xl text-xs text-[#78716C] hover:text-[#1C1917] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D]"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
