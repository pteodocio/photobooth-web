import React, { useState, useEffect } from 'react'
import { useBoothStore } from '../../store/useBoothStore'
import { LiveMotionReel } from './LiveMotionReel'
import { Download, QrCode as QrIcon, RotateCcw, X, Copy, Check } from 'lucide-react'
import QRCode from 'qrcode'
import confetti from 'canvas-confetti'

export const ExportView: React.FC = () => {
  const {
    compositeDataUrl,
    capturedPhotos,
    selectedPhotoIds,
    selectedFrame,
    selectedPrintFormat,
    sessionId,
    resetSession,
  } = useBoothStore()

  const [activeTab, setActiveTab] = useState<'strip' | 'reel'>('strip')
  const [showQrModal, setShowQrModal] = useState(false)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  const [copied, setCopied] = useState(false)

  const downloadUrl = `https://photobooth.app/strip?s=${sessionId}`

  // Trigger celebration confetti safely
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#FF5252', '#00F0FF', '#FFD1DC', '#FFFFFF'],
        })
      }
    } catch {
      // Ignore in headless test environment
    }

    try {
      QRCode.toDataURL(downloadUrl, {
        margin: 1,
        color: { dark: '#111111', light: '#FFFFFF' },
      }).then(setQrCodeDataUrl).catch(() => {})
    } catch {
      // Ignore in headless test environment
    }
  }, [downloadUrl])

  const handleDownload = () => {
    if (!compositeDataUrl) return
    const a = document.createElement('a')
    a.href = compositeDataUrl
    a.download = `photobooth_strip_${sessionId}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleCopyLink = () => {
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
    <div className="w-full min-h-screen bg-[#0A0A0C] text-white p-4 sm:p-6 flex flex-col justify-between max-w-4xl mx-auto select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            Your Film Strip
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FF5252]/20 text-[#FF5252] font-semibold">
              인화 완료
            </span>
          </h2>
          <p className="text-xs text-white/50 mt-0.5">
            {selectedFrame.name} · {selectedFrame.koreanTitle}
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab('strip')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'strip'
                ? 'bg-[#FF5252] text-white shadow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            {selectedPrintFormat.displayName}
          </button>
          <button
            onClick={() => setActiveTab('reel')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'reel'
                ? 'bg-[#FF5252] text-white shadow'
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
            {/* Mechanical Printer Dispenser Slot Mouth */}
            <div
              data-testid="printer-dispenser-slot"
              className="w-48 sm:w-64 h-2.5 bg-[#1B1B1F] rounded-full border border-white/20 shadow-inner mb-[-6px] z-10"
            />

            {/* Sliding Dispensed Strip */}
            <div className="dispense-slide-down shadow-2xl rounded-2xl overflow-hidden max-h-[66vh] border border-white/10">
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
          <LiveMotionReel photos={selectedPhotosList} frame={selectedFrame} />
        )}
      </div>

      {/* Action Buttons Toolbar */}
      <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          onClick={resetSession}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold transition-colors"
        >
          <RotateCcw size={16} />
          새 촬영 시작 New Session
        </button>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => setShowQrModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/10 transition-colors"
          >
            <QrIcon size={16} />
            QR Code
          </button>

          <button
            onClick={handleDownload}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#FF5252] hover:bg-[#FF3838] text-white text-xs font-bold shadow-xl shadow-[#FF5252]/25 transition-all transform active:scale-95"
          >
            <Download size={16} />
            Download PNG
          </button>
        </div>
      </div>

      {/* QR Code Mobile Download Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-sm bg-[#16161A] border border-white/10 rounded-3xl p-6 shadow-2xl text-center">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white"
            >
              <X size={18} />
            </button>

            <h3 className="text-base font-bold text-white flex items-center justify-center gap-2">
              <QrIcon size={20} className="text-[#FF5252]" />
              QR 모바일 다운로드
            </h3>
            <p className="text-xs text-white/60 mt-1.5">
              스마트폰 카메라로 QR 코드를 스캔하여 포토 스트립을 즉시 다운로드하세요!
            </p>

            <div className="my-5 p-3 bg-white rounded-2xl inline-block shadow-lg">
              {qrCodeDataUrl ? (
                <img src={qrCodeDataUrl} alt="QR Code" className="w-48 h-48 block" />
              ) : (
                <div className="w-48 h-48 bg-gray-100 flex items-center justify-center">
                  <span className="text-xs text-black/50">Generating...</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 p-2 bg-black/40 rounded-xl border border-white/10 text-xs font-mono text-white/70 justify-between">
              <span className="truncate">{downloadUrl}</span>
              <button
                onClick={handleCopyLink}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                title="Copy Link"
              >
                {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
