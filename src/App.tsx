import { useState, useEffect } from 'react'
import { useBoothStore } from './store/useBoothStore'
import { HeroSection } from './components/showcase/HeroSection'
import { FrameShowcase } from './components/showcase/FrameShowcase'
import { SessionRetrieveModal } from './components/showcase/SessionRetrieveModal'
import { StripViewerRoute } from './components/showcase/StripViewerRoute'
import { FramePickerModal } from './components/booth/FramePickerModal'
import { WebcamViewfinder } from './components/booth/WebcamViewfinder'
import { ContactSheet } from './components/booth/ContactSheet'
import { ExportView } from './components/booth/ExportView'
import { Camera, Smartphone, QrCode } from 'lucide-react'
import { sound } from './services/soundService'

export function App() {
  const { status, resetSession } = useBoothStore()

  const [isFramePickerOpen, setIsFramePickerOpen] = useState(false)
  const [isRetrieveModalOpen, setIsRetrieveModalOpen] = useState(false)
  const [activeSessionQuery, setActiveSessionQuery] = useState<string | null>(null)

  // Parse URL query parameter `?s=<sessionId>` on load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const sessionParam = params.get('s')
      if (sessionParam) {
        setActiveSessionQuery(sessionParam)
      }
    }
  }, [])

  // 1. Direct /strip route viewer
  if (activeSessionQuery) {
    return (
      <StripViewerRoute
        sessionId={activeSessionQuery}
        onBack={() => {
          setActiveSessionQuery(null)
          window.history.pushState({}, '', window.location.pathname)
        }}
      />
    )
  }

  // 2. In-Booth Active Flows
  if (status === 'capturing') {
    return <WebcamViewfinder onExit={resetSession} />
  }

  if (status === 'contactSheet') {
    return <ContactSheet />
  }

  if (status === 'exportReady') {
    return <ExportView />
  }

  // 3. Showcase / Studio Entrance (Anti-Slop Editorial Design)
  return (
    <div className="min-h-screen bg-[#0B0B0E] text-[#F3F3F6] flex flex-col justify-between selection:bg-[#FF385C] selection:text-white relative">
      {/* Top Studio Ticker Marquee */}
      <div className="w-full bg-[#111116] border-b border-[#1E1E26] py-1.5 px-4 overflow-hidden text-[11px] font-mono tracking-widest text-[#8E8E9B] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-[#FF385C] font-semibold">
            <span className="inline-block w-2 h-2 rounded-full bg-[#FF385C] animate-pulse" />
            BOOTH 01 · LIVE ON AIR
          </span>
          <span className="hidden sm:inline text-white/30">|</span>
          <span className="hidden sm:inline">SEOUL HONGDAE STUDIO · KOREAN 4-CUT & 6-CUT SYSTEM</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-white/60">300 DPI DYE-SUB PRINT</span>
          <span className="text-white/30">|</span>
          <span className="text-[#00F0FF] font-semibold">CLOUD SYNC ACTIVE</span>
        </div>
      </div>

      {/* Navigation Header */}
      <nav className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          {/* Studio Emblem Badge */}
          <div className="relative w-10 h-10 rounded-xl bg-[#16161D] border border-[#2A2A36] flex items-center justify-center shadow-lg group">
            <span className="font-mono text-sm font-black text-[#FF385C] tracking-tighter">4C</span>
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#FF385C] border-2 border-[#0B0B0E]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-tight text-white">인생네컷</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1D1D26] text-[#A2A2B2] border border-[#2D2D3B]">
                STUDIO v2.4
              </span>
            </div>
            <div className="text-[10px] text-[#7E7E8E] font-mono tracking-wider uppercase">
              HARU FILM & PHOTOISM EDITION
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          <button
            onClick={() => {
              sound.playClick()
              setIsRetrieveModalOpen(true)
            }}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2.5 rounded-xl bg-[#15151C] hover:bg-[#1D1D26] text-[#D0D0DC] hover:text-white text-xs font-mono font-medium border border-[#262633] transition-all cursor-pointer shadow-sm active:translate-y-0.5"
          >
            <QrCode size={14} className="text-[#00F0FF]" />
            <span>사진 찾기 Retrieve</span>
          </button>

          <button
            onClick={() => {
              sound.playClick()
              setIsFramePickerOpen(true)
            }}
            className="relative flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl bg-[#FF385C] hover:bg-[#E02649] text-white text-xs font-bold font-mono tracking-wide shadow-lg shadow-[#FF385C]/20 border border-[#FF6680]/40 transition-all cursor-pointer active:translate-y-0.5 transform hover:scale-[1.02]"
          >
            <Camera size={15} />
            <span>부스 입장 ENTER BOOTH</span>
          </button>
        </div>
      </nav>

      {/* Main Showcase Hero & Frame Gallery */}
      <main className="flex-1">
        <HeroSection
          onStartBooth={() => {
            sound.playClick()
            setIsFramePickerOpen(true)
          }}
          onOpenRetrieve={() => {
            sound.playClick()
            setIsRetrieveModalOpen(true)
          }}
        />
        <FrameShowcase
          onSelectFrameAndStart={() => {
            sound.playClick()
            setIsFramePickerOpen(true)
          }}
        />
      </main>

      {/* Studio Footer */}
      <footer className="w-full bg-[#0E0E12] border-t border-[#1C1C24] py-8 px-4 sm:px-8 mt-16">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-[#737382]">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <span className="font-mono text-white/80 font-medium">인생네컷 WEB BOOTH</span>
            <span className="hidden sm:inline text-white/20">/</span>
            <span>Inspired by Seoul Street Photobooths · Haru Film, Photoism, Life4Cuts</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="flex items-center gap-2 font-mono text-[11px] px-2.5 py-1 rounded-md bg-[#16161D] border border-[#242430]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>SUPABASE SYNC OK</span>
            </div>

            <a
              href="/apk/photobooth-release.apk"
              download="photobooth-release.apk"
              className="flex items-center gap-1.5 text-white/70 hover:text-white font-mono text-[11px] px-3 py-1 rounded-md bg-[#16161D] hover:bg-[#20202A] border border-[#242430] transition-colors"
            >
              <Smartphone size={13} className="text-[#FF385C]" />
              <span>Mobile APK (54.9MB)</span>
            </a>
          </div>
        </div>
      </footer>

      {/* Frame Picker Modal */}
      <FramePickerModal
        isOpen={isFramePickerOpen}
        onClose={() => setIsFramePickerOpen(false)}
      />

      {/* Session PIN / URL Retrieval Modal */}
      <SessionRetrieveModal
        isOpen={isRetrieveModalOpen}
        onClose={() => setIsRetrieveModalOpen(false)}
        onRetrieve={id => setActiveSessionQuery(id)}
      />
    </div>
  )
}

export default App
