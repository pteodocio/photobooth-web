import React, { useState, useEffect } from 'react'
import { useBoothStore } from '../../store/useBoothStore'
import { LiveMotionReel } from './LiveMotionReel'
import { Download, QrCode as QrIcon, RotateCcw, X, Copy, Check, Camera, Video } from 'lucide-react'
import QRCode from 'qrcode'
import confetti from 'canvas-confetti'
import { sound } from '../../services/soundService'
import { SyncService } from '../../services/syncService'

export const ExportView: React.FC = () => {
  const {
    compositeDataUrl,
    capturedPhotos,
    selectedPhotoIds,
    selectedFrame,
    selectedPrintFormat,
    videoUrl,
    sessionId,
    resetSession,
    retakePhotos,
  } = useBoothStore()

  const [activeTab, setActiveTab] = useState<'strip' | 'reel'>('strip')
  const [showQrModal, setShowQrModal] = useState(false)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  const [copied, setCopied] = useState(false)

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
    a.download = `photobooth_strip_${sessionId}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleDownloadVideo = () => {
    sound.playClick()
    if (!videoUrl) return
    const a = document.createElement('a')
    a.href = videoUrl
    a.download = `photobooth_bts_${sessionId}.webm`
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
    <div className="w-full min-h-screen bg-[#09090C] text-[#F3F3F6] p-4 sm:p-6 flex flex-col justify-between max-w-4xl mx-auto select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            Your Film Strip
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FF385C]/20 text-[#FF385C] font-semibold">
              Ready
            </span>
          </h2>
          <p className="text-xs text-white/50 mt-0.5">
            {selectedFrame.name} · {selectedPrintFormat.displayName}
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-xl border border-white/10">
          <button
            onClick={() => {
              sound.playClick()
              setActiveTab('strip')
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'strip'
                ? 'bg-[#FF385C] text-white shadow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            {selectedPrintFormat.displayName}
          </button>
          <button
            onClick={() => {
              sound.playClick()
              setActiveTab('reel')
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'reel'
                ? 'bg-[#FF385C] text-white shadow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Live Motion Reel
          </button>
        </div>
      </div>

      {/* Main Display Stage */}
      <div className="my-6 flex-1 flex flex-col items-center justify-center">
        {activeTab === 'strip' ? (
          <div className="flex flex-col items-center">
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
        ) : videoUrl ? (
          <div className="w-full max-w-md aspect-[4/3] rounded-2xl overflow-hidden border-2 border-[#2E2E3E] photo-card-shadow bg-black">
            <video
              src={videoUrl}
              controls
              autoPlay
              loop
              playsInline
              className="w-full h-full object-cover block"
            />
          </div>
        ) : (
          <LiveMotionReel photos={selectedPhotosList} frame={selectedFrame} />
        )}
      </div>

      {/* Action Buttons Toolbar */}
      <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => {
              sound.playClick()
              retakePhotos()
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
          >
            <Camera size={15} className="text-[#FF385C]" />
            <span>Retake Photos</span>
          </button>

          <button
            onClick={() => {
              sound.playClick()
              resetSession()
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>New Strip</span>
          </button>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => {
              sound.playClick()
              setShowQrModal(true)
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
          >
            <QrIcon size={15} className="text-[#00F0FF]" />
            <span>QR Code</span>
          </button>

          {videoUrl && (
            <button
              onClick={handleDownloadVideo}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold border border-white/10 transition-colors cursor-pointer"
            >
              <Video size={15} className="text-[#FF385C]" />
              <span>Download Video</span>
            </button>
          )}

          <button
            onClick={handleDownload}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#FF385C] hover:bg-[#E02649] text-white text-xs font-bold shadow-xl shadow-[#FF385C]/20 transition-all active:scale-95 cursor-pointer"
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
              onClick={() => {
                sound.playClick()
                setShowQrModal(false)
              }}
              className="absolute top-4 right-4 text-white/50 hover:text-white cursor-pointer"
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
                onClick={handleCopyLink}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
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
