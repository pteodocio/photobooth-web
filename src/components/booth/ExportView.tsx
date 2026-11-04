import React, { useState, useEffect } from 'react'
import { useBoothStore } from '../../store/useBoothStore'
import { AnimatedBtsStrip } from './AnimatedBtsStrip'
import { Download, QrCode as QrIcon, RotateCcw, X, Copy, Check, Camera, Video, Film, Sparkles } from 'lucide-react'
import QRCode from 'qrcode'
import confetti from 'canvas-confetti'
import { sound } from '../../services/soundService'
import { SyncService } from '../../services/syncService'
import { VideoRecorderService } from '../../services/videoRecorderService'
import { PhotoboothStepHeader } from './PhotoboothStepHeader'

export const ExportView: React.FC = () => {
  const {
    compositeDataUrl,
    capturedPhotos,
    selectedPhotoIds,
    selectedFrame,
    selectedLayout,
    selectedFilter,
    filterIntensity,
    selectedStamp,
    selectedPrintFormat,
    videoUrl,
    sessionId,
    passcode,
    setVideoBlob,
    setVideoUrl,
    resetSession,
    retakePhotos,
  } = useBoothStore()

  const [activeTab, setActiveTab] = useState<'strip' | 'reel'>('strip')
  const [showQrModal, setShowQrModal] = useState(false)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [isExportingVideo, setIsExportingVideo] = useState(false)

  const downloadUrl = SyncService.getVideoPageUrl(sessionId)

  // Sound whirr + celebration on mount
  useEffect(() => {
    sound.playPrinterWhirr()

    try {
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        confetti({
          particleCount: 35,
          spread: 55,
          origin: { y: 0.65 },
          colors: ['#FF385C', '#1A3B6B', '#F6F4EE', '#FFFFFF'],
        })
      }
    } catch {
      // Ignore in test environment
    }

    try {
      QRCode.toDataURL(downloadUrl, {
        margin: 1,
        color: { dark: '#111116', light: '#FFFFFF' },
      }).then(setQrCodeDataUrl).catch(() => {})
    } catch {
      // Ignore in test environment
    }
  }, [downloadUrl])

  const handleDownload = () => {
    sound.playClick()
    if (!compositeDataUrl) return
    const a = document.createElement('a')
    a.href = compositeDataUrl
    a.download = `photobooth_strip_${passcode || sessionId}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleDownloadVideo = async () => {
    sound.playClick()
    let targetUrl = videoUrl

    if (!targetUrl) {
      setIsExportingVideo(true)
      try {
        const today = new Date()
        const dateString = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`
        const allClips = selectedPhotosList.map(p => p.btsClipUrl).filter((u): u is string => !!u)
        const blob = await VideoRecorderService.createMotionStripVideo({
          photoDataUrls: selectedPhotosList.map(p => p.dataUrl),
          btsClipBlobs: allClips,
          frame: selectedFrame,
          layout: selectedLayout,
          filter: selectedFilter,
          filterIntensity,
          stampText: selectedStamp,
          dateString,
          passcode,
        })
        if (blob) {
          setVideoBlob(blob)
          targetUrl = URL.createObjectURL(blob)
          setVideoUrl(targetUrl)
        }
      } catch (err) {
        console.warn('Could not generate motion strip video for download:', err)
      } finally {
        setIsExportingVideo(false)
      }
    }

    if (!targetUrl) return
    const a = document.createElement('a')
    a.href = targetUrl
    a.download = `photobooth_bts_strip_${passcode || sessionId}.mp4`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleCopyLink = () => {
    sound.playClick()
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(downloadUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const selectedPhotosList =
    selectedPhotoIds.length > 0
      ? selectedPhotoIds
          .map(id => capturedPhotos.find(p => p.id === id))
          .filter((p): p is typeof capturedPhotos[0] => !!p)
      : capturedPhotos

  return (
    <div className="w-full min-h-screen bg-[#08080B] text-[#F3F3F6] p-3 sm:p-6 flex flex-col justify-between max-w-5xl mx-auto select-none">
      {/* Unified 7-Stage Header */}
      <PhotoboothStepHeader
        currentStep={6}
        stepTitle="Your Film Strip is Ready"
        stepSubtitle={`${selectedFrame.name} · ${selectedPrintFormat.displayName} · Code: ${passcode}`}
        onExit={resetSession}
      />

      {/* Sub-bar: Passcode Pill and Output Switcher */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/50">Passcode:</span>
          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-white/10 border border-white/10 text-white font-mono text-xs font-semibold tracking-wider">
            CODE: {passcode}
          </span>
        </div>

        {/* View Mode Toggle: Output A (Photo Strip) vs Output B (Animated BTS Strip) */}
        <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => {
              sound.playClick()
              setActiveTab('strip')
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-[background-color,color] duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF385C] ${
              activeTab === 'strip'
                ? 'bg-[#FF385C] text-white shadow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Film size={13} />
            <span>Photo Strip</span>
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playClick()
              setActiveTab('reel')
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-[background-color,color] duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF385C] ${
              activeTab === 'reel'
                ? 'bg-[#FF385C] text-white shadow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Video size={13} />
            <span>Live Motion Reel</span>
            <span className="text-[10px] opacity-75 font-mono">BTS</span>
          </button>
        </div>
      </div>

      {/* Main Display Stage */}
      <div className="my-5 flex-1 flex flex-col items-center justify-center">
        {activeTab === 'strip' ? (
          <div className="flex flex-col items-center">
            {/* Output A Badge */}
            <div className="mb-2 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/60 font-mono">
              <span>OUTPUT A</span>
              <span>·</span>
              <span>TRADITIONAL PHOTO STRIP</span>
            </div>

            {/* Mechanical Dispenser Slot Mouth */}
            <div
              data-testid="printer-dispenser-slot"
              className="w-48 sm:w-64 h-2.5 bg-[#1B1B1F] rounded-full border border-white/20 shadow-inner mb-[-6px] z-10"
            />

            {/* Sliding Dispensed Strip */}
            <div className="dispense-slide-down photo-card-shadow rounded-2xl overflow-hidden max-h-[66vh] border border-white/10 bg-[#0E0E12]">
              {compositeDataUrl && (
                <img
                  src={compositeDataUrl}
                  alt="Printed Film Strip"
                  className="h-full max-h-[64vh] w-auto object-contain block"
                />
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center w-full">
            {/* Output B Badge */}
            <div className="mb-2 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FF385C]/10 border border-[#FF385C]/20 text-[10px] text-[#FF385C] font-mono font-semibold">
              <Sparkles size={11} />
              <span>OUTPUT B</span>
              <span>·</span>
              <span>ANIMATED BTS PHOTO STRIP</span>
            </div>

            {/* Mechanical Dispenser Slot Mouth */}
            <div
              className="w-48 sm:w-64 h-2.5 bg-[#1B1B1F] rounded-full border border-white/20 shadow-inner mb-[-6px] z-10"
            />

            {/* Sliding Dispensed Animated BTS Strip */}
            <div className="dispense-slide-down photo-card-shadow rounded-2xl overflow-hidden max-h-[72vh] border border-white/10 bg-[#0E0E12] flex items-center justify-center p-2 sm:p-3">
              <AnimatedBtsStrip
                photos={selectedPhotosList}
                frame={selectedFrame}
                layout={selectedLayout}
                filter={selectedFilter}
                filterIntensity={filterIntensity}
                stampText={selectedStamp}
                passcode={passcode}
              />
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons Toolbar (Stage 7) */}
      <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              sound.playClick()
              retakePhotos()
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF385C]"
          >
            <Camera size={15} className="text-[#FF385C]" />
            <span>Retake Photos</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick()
              resetSession()
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF385C]"
          >
            <RotateCcw size={14} />
            <span>New Strip</span>
          </button>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              sound.playClick()
              setShowQrModal(true)
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF385C]"
          >
            <QrIcon size={15} className="text-[#00F0FF]" />
            <span>QR Code</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadVideo}
            disabled={isExportingVideo}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold border border-white/10 transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF385C]"
            title="Download Animated BTS Strip (MP4)"
          >
            <Video size={15} className="text-[#FF385C]" />
            <span>{isExportingVideo ? 'Generating...' : 'Download Video'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#FF385C] hover:bg-[#E02649] text-white text-xs font-bold shadow-xl shadow-[#FF385C]/20 transition-transform duration-150 active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF385C]"
          >
            <Download size={15} />
            <span>Download Strip</span>
          </button>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm bg-[#141419] border border-white/10 rounded-2xl p-6 shadow-2xl text-center">
            <button
              type="button"
              onClick={() => {
                sound.playClick()
                setShowQrModal(false)
              }}
              className="absolute top-4 right-4 text-white/50 hover:text-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF385C]"
            >
              <X size={18} />
            </button>

            <h3 className="text-base font-bold text-white flex items-center justify-center gap-2">
              <QrIcon size={18} className="text-[#FF385C]" />
              Scan for Video
            </h3>
            <p className="text-xs text-white/50 mt-1">
              Scan with your phone camera to watch your video and download it directly.
            </p>

            <div className="mt-3 inline-flex items-center gap-2 py-1 px-3 rounded-full bg-white/5 border border-white/10 text-xs text-white/80 font-mono">
              <span className="text-white/40">PHOTO CODE:</span>
              <span className="font-bold text-[#FF385C] tracking-widest">{passcode}</span>
            </div>

            {/* QR Card Container */}
            <div className="my-5 p-3.5 bg-white rounded-2xl inline-block shadow-lg">
              {qrCodeDataUrl ? (
                <img src={qrCodeDataUrl} alt="QR Code" className="w-48 h-48 block" />
              ) : (
                <div className="w-48 h-48 bg-gray-100 flex items-center justify-center">
                  <span className="text-xs text-black/50">Generating QR...</span>
                </div>
              )}
            </div>

            {/* URL Copy Box */}
            <div className="flex items-center gap-2 p-2.5 bg-black/40 rounded-xl border border-white/10 text-xs text-white/70 justify-between">
              <span className="truncate">{downloadUrl}</span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF385C]"
                title="Copy Link"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
