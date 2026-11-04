import React, { useState, useEffect } from 'react'
import { useBoothStore } from '../../store/useBoothStore'
import { AnimatedBtsStrip } from './AnimatedBtsStrip'
import { Download, QrCode as QrIcon, RotateCcw, X, Copy, Check, Camera, Video, Film } from 'lucide-react'
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

  useEffect(() => {
    sound.playPrinterWhirr()

    try {
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        confetti({
          particleCount: 25,
          spread: 45,
          origin: { y: 0.65 },
          colors: ['#FF4D6D', '#F472B6', '#FDE68A', '#E0E7FF'],
        })
      }
    } catch {
      // Ignore in test environment
    }

    try {
      QRCode.toDataURL(downloadUrl, {
        margin: 1,
        color: { dark: '#1C1917', light: '#FFFFFF' },
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
    <div className="w-full min-h-screen bg-[#FAF8F5] text-[#1C1917] p-3 sm:p-6 flex flex-col justify-between max-w-5xl mx-auto select-none">
      {/* Minimal Studio Header */}
      <PhotoboothStepHeader
        currentStep={6}
        stepTitle="Your Film Strip is Ready"
        stepSubtitle={`${selectedFrame.name} · ${selectedPrintFormat.displayName}`}
        onExit={resetSession}
      />

      {/* Sub-bar: Passcode Pill and Output Switcher */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-2 border-b border-black/[0.05]">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#78716C]">Passcode:</span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-black/[0.06] text-[#1C1917] font-mono text-xs font-semibold shadow-xs">
            CODE: {passcode}
          </span>
        </div>

        {/* View Mode Toggle: Still Photo (Output A) vs Live Motion Reel (Output B) */}
        <div className="flex items-center gap-1 p-0.5 bg-black/[0.03] rounded-xl border border-black/[0.04]">
          <button
            type="button"
            onClick={() => {
              sound.playClick()
              setActiveTab('strip')
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-[background-color,color] duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D] ${
              activeTab === 'strip'
                ? 'bg-white text-[#FF4D6D] shadow-xs font-semibold'
                : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            <Film size={12} />
            <span>Photo Strip</span>
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playClick()
              setActiveTab('reel')
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-[background-color,color] duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D] ${
              activeTab === 'reel'
                ? 'bg-white text-[#FF4D6D] shadow-xs font-semibold'
                : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            <Video size={12} />
            <span>Live Motion Reel</span>
            <span className="text-[10px] opacity-75 font-mono">BTS</span>
          </button>
        </div>
      </div>

      {/* Main Display Stage */}
      <div className="my-4 flex-1 flex flex-col items-center justify-center">
        {activeTab === 'strip' ? (
          <div className="flex flex-col items-center">
            {/* Output A Badge */}
            <div className="mb-2 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/[0.03] border border-black/[0.05] text-[10px] text-[#78716C] font-mono">
              <span>OUTPUT A</span>
              <span>·</span>
              <span>TRADITIONAL PHOTO STRIP</span>
            </div>

            {/* Dispenser Slot */}
            <div
              data-testid="printer-dispenser-slot"
              className="w-44 sm:w-56 h-2 bg-[#E7E5E0] rounded-full border border-black/[0.06] shadow-inner mb-[-5px] z-10"
            />

            {/* Sliding Dispensed Strip */}
            <div className="dispense-slide-down photo-card-shadow rounded-2xl overflow-hidden max-h-[66vh] border border-black/[0.06] bg-white">
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
            <div className="mb-2 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FFF0F3] border border-[#FF4D6D]/20 text-[10px] text-[#FF4D6D] font-mono font-medium">
              <span>OUTPUT B</span>
              <span>·</span>
              <span>ANIMATED BTS PHOTO STRIP</span>
            </div>

            {/* Dispenser Slot */}
            <div
              className="w-44 sm:w-56 h-2 bg-[#E7E5E0] rounded-full border border-black/[0.06] shadow-inner mb-[-5px] z-10"
            />

            {/* Sliding Dispensed Animated BTS Strip */}
            <div className="dispense-slide-down photo-card-shadow rounded-2xl overflow-hidden max-h-[72vh] border border-black/[0.06] bg-white flex items-center justify-center p-2 sm:p-3">
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

      {/* Action Buttons Toolbar */}
      <div className="pt-3 border-t border-black/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              sound.playClick()
              retakePhotos()
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-black/[0.03] text-[#1C1917] text-xs font-medium border border-black/[0.06] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D]"
          >
            <Camera size={14} className="text-[#FF4D6D]" />
            <span>Retake Photos</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick()
              resetSession()
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-black/[0.02] hover:bg-black/[0.05] text-[#78716C] hover:text-[#1C1917] text-xs font-medium border border-black/[0.04] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D]"
          >
            <RotateCcw size={13} />
            <span>New Strip</span>
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              sound.playClick()
              setShowQrModal(true)
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-black/[0.03] text-[#1C1917] text-xs font-medium border border-black/[0.06] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D]"
          >
            <QrIcon size={14} className="text-[#0EA5E9]" />
            <span>QR Code</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadVideo}
            disabled={isExportingVideo}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-black/[0.03] text-[#1C1917] text-xs font-medium border border-black/[0.06] transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D]"
            title="Download Animated BTS Strip (MP4)"
          >
            <Video size={14} className="text-[#FF4D6D]" />
            <span>{isExportingVideo ? 'Generating…' : 'Download Video'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#FF4D6D] hover:bg-[#E11D48] text-white text-xs font-semibold shadow-xs transition-transform duration-150 active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D]"
          >
            <Download size={14} />
            <span>Download Strip</span>
          </button>
        </div>
      </div>

      {/* Minimalist QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-sm bg-white border border-black/[0.08] rounded-2xl p-6 shadow-xl text-center">
            <button
              type="button"
              onClick={() => {
                sound.playClick()
                setShowQrModal(false)
              }}
              className="absolute top-4 right-4 text-[#78716C] hover:text-[#1C1917] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D]"
            >
              <X size={16} />
            </button>

            <h3 className="text-base font-semibold text-[#1C1917] flex items-center justify-center gap-1.5">
              <QrIcon size={16} className="text-[#FF4D6D]" />
              <span>Scan for Video</span>
            </h3>
            <p className="text-xs text-[#78716C] mt-1">
              Scan with your phone camera to download your photos and BTS video.
            </p>

            <div className="mt-2.5 inline-flex items-center gap-1.5 py-1 px-3 rounded-full bg-black/[0.03] border border-black/[0.05] text-xs text-[#1C1917] font-mono">
              <span className="text-[#A8A29E]">CODE:</span>
              <span className="font-bold text-[#FF4D6D] tracking-wider">{passcode}</span>
            </div>

            {/* QR Card */}
            <div className="my-4 p-3 bg-white rounded-xl inline-block border border-black/[0.06] shadow-xs">
              {qrCodeDataUrl ? (
                <img src={qrCodeDataUrl} alt="QR Code" className="w-44 h-44 block" />
              ) : (
                <div className="w-44 h-44 bg-neutral-100 flex items-center justify-center">
                  <span className="text-xs text-[#78716C]">Generating QR…</span>
                </div>
              )}
            </div>

            {/* URL Copy Box */}
            <div className="flex items-center gap-2 p-2 bg-black/[0.02] rounded-xl border border-black/[0.06] text-xs text-[#78716C] justify-between">
              <span className="truncate">{downloadUrl}</span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="p-1 rounded-lg bg-white hover:bg-black/[0.05] text-[#1C1917] border border-black/[0.06] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D]"
                title="Copy Link"
              >
                {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
