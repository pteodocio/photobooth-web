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

  // 2. In-Booth Flows
  if (status === 'capturing') {
    return <WebcamViewfinder onExit={resetSession} />
  }

  if (status === 'contactSheet') {
    return <ContactSheet />
  }

  if (status === 'exportReady') {
    return <ExportView />
  }

  // 3. Showcase / Landing Page
  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white flex flex-col justify-between selection:bg-[#FF5252] selection:text-white">
      {/* Navigation Header */}
      <nav className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FF5252] to-[#00F0FF] flex items-center justify-center font-black text-black text-sm shadow-md shadow-[#FF5252]/20">
            4
          </div>
          <div>
            <div className="text-sm font-black tracking-tight leading-none">인생네컷</div>
            <div className="text-[10px] text-white/50 font-semibold tracking-widest uppercase">Korean Photobooth</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsRetrieveModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-semibold border border-white/10 transition-colors"
          >
            <QrCode size={14} />
            사진 찾기
          </button>

          <button
            onClick={() => setIsFramePickerOpen(true)}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#FF5252] hover:bg-[#FF3838] text-white text-xs font-bold shadow-lg shadow-[#FF5252]/25 transition-all transform active:scale-95"
          >
            <Camera size={14} />
            부스 시작
          </button>
        </div>
      </nav>

      {/* Main Showcase Hero & Frame Gallery */}
      <main className="flex-1">
        <HeroSection
          onStartBooth={() => setIsFramePickerOpen(true)}
          onOpenRetrieve={() => setIsRetrieveModalOpen(true)}
        />
        <FrameShowcase onSelectFrameAndStart={() => setIsFramePickerOpen(true)} />
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
        <div>© 2026 Korean 4-Cut Photobooth Studio. All rights reserved.</div>
        <div className="flex items-center gap-4">
          <a
            href="/apk/photobooth-release.apk"
            download="photobooth-release.apk"
            className="flex items-center gap-1 text-white/60 hover:text-white"
          >
            <Smartphone size={13} />
            Android Release APK (54.9 MB)
          </a>
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
