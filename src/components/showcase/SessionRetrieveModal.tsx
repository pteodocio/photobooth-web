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
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 640 } },
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
      // Lookup by passcode
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

    // Default to video/strip token
    onRetrieve(val, 'video')
    onClose()
  }

  // Handle photo file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    sound.playClick()
    setIsProcessingFile(true)
    setCameraError(null)

    try {
      const scanResult = await QrScannerService.scanImageFile(file)
      if (scanResult) {
        handleScannedResult(scanResult.value, scanResult.type)
      } else {
        setCameraError('No QR code found in this photo. Please ensure the QR code on the strip is clear and well-lit.')
      }
    } catch {
      setCameraError('Unable to scan this photo file. Please enter the 4-digit code printed on your strip instead.')
    } finally {
      setIsProcessingFile(false)
      if (e.target) e.target.value = ''
    }
  }

  // Passcode input handlers
  const handleDigitChange = (index: number, val: string) => {
    // Only accept numeric characters
    const clean = val.replace(/\D/g, '')

    if (!clean) {
      const newDigits = [...digits]
      newDigits[index] = ''
      setDigits(newDigits)
      return
    }

    // Handle pasting 4 digits into one slot
    if (clean.length >= 4) {
      const pasted = clean.slice(0, 4).split('')
      setDigits(pasted)
      digitInputRefs[3].current?.focus()
      lookupByPasscode(clean.slice(0, 4))
      return
    }

    const newDigits = [...digits]
    newDigits[index] = clean[clean.length - 1]
    setDigits(newDigits)
    setSearchError(null)

    // Advance focus
    if (index < 3) {
      digitInputRefs[index + 1].current?.focus()
    } else {
      // All 4 digits entered, trigger automatic search
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
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4)
    if (pasted.length > 0) {
      const nextDigits = ['', '', '', '']
      for (let i = 0; i < pasted.length; i++) {
        nextDigits[i] = pasted[i]
      }
      setDigits(nextDigits)
      if (pasted.length === 4) {
        lookupByPasscode(pasted)
      } else {
        digitInputRefs[Math.min(pasted.length, 3)].current?.focus()
      }
    }
  }

  const lookupByPasscode = async (code: string) => {
    if (code.length !== 4) return
    sound.playClick()
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in select-none">
      <div className="relative w-full max-w-lg bg-[#141419] border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={() => {
            sound.playClick()
            onClose()
          }}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-[#FF385C]/15 border border-[#FF385C]/30 flex items-center justify-center text-[#FF385C]">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight leading-tight">
              Find Your Photos
            </h3>
            <p className="text-xs text-white/50 mt-0.5">
              Access your strip or live motion video
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center p-1 bg-black/40 rounded-2xl border border-white/10 mb-6" role="tablist">
          <button
            onClick={() => {
              sound.playClick()
              setActiveTab('code')
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'code'
                ? 'bg-[#FF385C] text-white shadow-lg shadow-[#FF385C]/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <KeyRound size={14} />
            <span>Photo Code</span>
          </button>

          <button
            onClick={() => {
              sound.playClick()
              setActiveTab('scan')
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'scan'
                ? 'bg-[#FF385C] text-white shadow-lg shadow-[#FF385C]/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <QrCode size={14} />
            <span>Scan QR</span>
          </button>

          <button
            onClick={() => {
              sound.playClick()
              setActiveTab('recent')
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer relative ${
              activeTab === 'recent'
                ? 'bg-[#FF385C] text-white shadow-lg shadow-[#FF385C]/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <History size={14} />
            <span>Recent</span>
            {recentSessions.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center font-bold">
                {recentSessions.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: 4-Digit Passcode Input */}
        {activeTab === 'code' && (
          <form onSubmit={handlePasscodeSubmit} className="space-y-6 flex-1 flex flex-col justify-between">
            <div className="text-center py-2">
              <label className="block text-xs font-medium text-white/80 mb-1.5">
                Enter the 4-digit code printed on your strip
              </label>
              <p className="text-[11px] text-white/40 mb-6">
                Look for <span className="font-mono font-semibold text-white/70">CODE: XXXX</span> at the bottom of your physical film strip
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
                    className="w-13 h-16 sm:w-16 sm:h-20 text-center font-mono text-2xl sm:text-3xl font-bold rounded-2xl bg-black/50 border-2 border-white/10 text-white focus:border-[#FF385C] focus:bg-[#1E1E28] focus:outline-none transition-all shadow-inner"
                    autoComplete="off"
                  />
                ))}
              </div>

              {/* Error Message */}
              {searchError && (
                <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 text-left">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{searchError}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  sound.playClick()
                  onClose()
                }}
                className="px-4 py-2.5 rounded-xl text-xs text-white/60 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={digits.join('').length !== 4 || isSearching}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#FF385C] hover:bg-[#E02649] disabled:opacity-40 text-white text-xs font-bold shadow-lg shadow-[#FF385C]/20 transition-all active:scale-95 cursor-pointer"
              >
                {isSearching ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <span>View Photos</span>
                    <ArrowRight size={14} />
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
              <div className="relative w-full aspect-video sm:aspect-[4/3] max-w-sm rounded-2xl overflow-hidden bg-black/60 border border-white/10 flex items-center justify-center">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Reticle Target Overlay */}
                {cameraActive && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-44 h-44 sm:w-52 sm:h-52 border-2 border-dashed border-[#FF385C] rounded-2xl relative animate-pulse flex items-center justify-center">
                      <div className="w-full h-0.5 bg-[#FF385C]/60 absolute shadow-[0_0_8px_#FF385C] top-1/2 transform -translate-y-1/2" />
                    </div>
                  </div>
                )}

                {/* Fallback state if camera inactive or permission pending */}
                {!cameraActive && !cameraError && (
                  <div className="text-center p-4">
                    <Camera size={28} className="mx-auto text-white/30 mb-2 animate-bounce" />
                    <span className="text-xs text-white/50">Starting camera preview...</span>
                  </div>
                )}
              </div>

              {cameraError && (
                <div className="w-full mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{cameraError}</span>
                </div>
              )}

              <p className="text-[11px] text-white/40 text-center mt-3">
                Point your camera at the QR badge on your printed photobooth strip
              </p>
            </div>

            {/* Photo File Upload Alternative */}
            <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
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
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/90 hover:text-white transition-colors cursor-pointer"
              >
                {isProcessingFile ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Analyzing Image...</span>
                  </>
                ) : (
                  <>
                    <Upload size={14} className="text-[#00F0FF]" />
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
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs text-white/60 hover:text-white transition-colors cursor-pointer"
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
              <div className="overflow-y-auto max-h-[50vh] pr-1 grid grid-cols-2 sm:grid-cols-3 gap-3 my-1">
                {recentSessions.map((session, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      sound.playClick()
                      onRetrieve(session.token, session.videoUrl ? 'video' : 'strip')
                      onClose()
                    }}
                    className="group relative flex flex-col rounded-2xl bg-black/40 border border-white/10 hover:border-[#FF385C] overflow-hidden p-2 text-left transition-all active:scale-95 cursor-pointer"
                  >
                    {/* Thumbnail */}
                    <div className="w-full aspect-[9/16] max-h-36 bg-[#0E0E12] rounded-xl overflow-hidden mb-2 relative">
                      <img
                        src={session.compositeUrl}
                        alt={session.frameName}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      {session.videoUrl && (
                        <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-[#FF385C] text-[9px] font-bold text-white shadow">
                          VIDEO
                        </div>
                      )}
                    </div>

                    <div className="px-1">
                      <span className="block text-xs font-bold text-white truncate">
                        {session.frameName}
                      </span>
                      <div className="flex items-center justify-between text-[10px] text-white/40 mt-0.5">
                        <span>{formatRelativeTime(session.timestamp)}</span>
                        {session.passcode && (
                          <span className="font-mono text-[#FF385C] font-semibold">
                            #{session.passcode}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 mb-3">
                  <History size={22} />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">
                  No Recent Photos Found
                </h4>
                <p className="text-xs text-white/40 max-w-xs mb-4">
                  Photos captured on this device will automatically appear here for rapid access.
                </p>
                <button
                  onClick={() => {
                    sound.playClick()
                    setActiveTab('code')
                  }}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
                >
                  Enter Photo Code
                </button>
              </div>
            )}

            <div className="flex items-center justify-end pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  sound.playClick()
                  onClose()
                }}
                className="px-4 py-2 rounded-xl text-xs text-white/60 hover:text-white transition-colors cursor-pointer"
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
