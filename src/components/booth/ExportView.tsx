import React, { useState, useEffect } from 'react'
import { useBoothStore } from '../../store/useBoothStore'
import { LiveMotionReel } from './LiveMotionReel'
import { Download, QrCode as QrIcon, RotateCcw, X, Copy, Check, Printer } from 'lucide-react'
import QRCode from 'qrcode'
import confetti from 'canvas-confetti'
import { sound } from '../../services/soundService'

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
      <div className="flex items-center justify-between pb-3 border-b border-[#1C1C26]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#FF385C] uppercase tracking-wider mb-0.5">
            <Printer size={13} />
            <span>DISPENSER OUTPUT · 인화 완료</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            Your Film Strip
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#181822] text-[#A0A0B0] border border-[#272738] font-normal">
              300 DPI READY
            </span>
          </h2>
          <p className="text-xs text-[#808092] mt-0.5 font-mono">
            {selectedFrame.name} · {selectedFrame.koreanTitle}
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-[#121217] rounded-xl border border-[#22222D]">
          <button
            onClick={() => {
              sound.playClick()
              setActiveTab('strip')
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              activeTab === 'strip'
                ? 'bg-[#FF385C] text-white shadow-md'
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
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              activeTab === 'reel'
                ? 'bg-[#FF385C] text-white shadow-md'
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
            {/* Mechanical Photobooth Printer Dispenser Slot Mouth */}
            <div className="flex flex-col items-center mb-[-8px] z-20">
              <div className="flex items-center justify-between w-56 sm:w-72 px-3 py-1 bg-[#1C1C24] rounded-t-lg border-t border-x border-[#333342] text-[9px] font-mono text-[#888898]">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  THERMAL PRINTER
                </span>
                <span>DISPENSING...</span>
              </div>
              <div
                data-testid="printer-dispenser-slot"
                className="w-56 sm:w-72 h-3 bg-[#0A0A0D] rounded-full border border-[#2C2C38] shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)]"
              />
            </div>

            {/* Sliding Dispensed Physical Strip */}
            <div className="dispense-slide-down photo-card-shadow rounded-2xl overflow-hidden max-h-[66vh] border border-[#262635] bg-[#0E0E12]">
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
      <div className="pt-4 border-t border-[#1C1C26] flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          onClick={() => {
            sound.playClick()
            resetSession()
          }}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#14141B] hover:bg-[#1C1C24] text-white/70 hover:text-white text-xs font-mono font-semibold border border-[#242432] transition-colors cursor-pointer"
        >
          <RotateCcw size={15} />
          <span>새 촬영 시작 New Session</span>
        </button>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => {
              sound.playClick()
              setShowQrModal(true)
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#181822] hover:bg-[#20202E] text-white text-xs font-mono font-bold border border-[#2B2B3C] transition-colors cursor-pointer"
          >
            <QrIcon size={15} className="text-[#00F0FF]" />
            <span>QR Code</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-[#FF385C] hover:bg-[#E02649] text-white text-xs font-mono font-bold tracking-wide shadow-xl shadow-[#FF385C]/25 transition-all transform active:scale-95 cursor-pointer"
          >
            <Download size={15} />
            <span>Download PNG</span>
          </button>
        </div>
      </div>

      {/* QR Code Thermal Receipt Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-sm bg-[#121217] border border-[#262635] rounded-3xl p-6 shadow-2xl text-center">
            <button
              onClick={() => {
                sound.playClick()
                setShowQrModal(false)
              }}
              className="absolute top-4 right-4 text-white/50 hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Receipt Header */}
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-xl bg-[#FF385C]/10 border border-[#FF385C]/30 flex items-center justify-center text-[#FF385C] font-mono font-black text-sm mb-3">
                4C
              </div>
              <h3 className="text-base font-bold text-white flex items-center justify-center gap-2 font-sans">
                QR 모바일 다운로드
              </h3>
              <p className="text-xs text-[#808092] mt-1 font-mono">
                스마트폰 카메라로 스캔하여 고화질 원본을 즉시 다운로드하세요.
              </p>
            </div>

            {/* QR Card Container */}
            <div className="my-5 p-3.5 bg-white rounded-2xl inline-block shadow-xl">
              {qrCodeDataUrl ? (
                <img src={qrCodeDataUrl} alt="QR Code" className="w-48 h-48 block" />
              ) : (
                <div className="w-48 h-48 bg-gray-100 flex items-center justify-center">
                  <span className="text-xs text-black/50 font-mono">Generating QR...</span>
                </div>
              )}
            </div>

            {/* URL Copy Box */}
            <div className="flex items-center gap-2 p-2.5 bg-[#0A0A0D] rounded-xl border border-[#22222D] text-xs font-mono text-white/70 justify-between">
              <span className="truncate">{downloadUrl}</span>
              <button
                onClick={handleCopyLink}
                className="p-1.5 rounded-lg bg-[#1C1C26] hover:bg-[#252534] text-white cursor-pointer"
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
