import { useState, useEffect } from 'react'
import { useBoothStore } from './store/useBoothStore'
import { HeroSection } from './components/showcase/HeroSection'
import { FrameShowcase } from './components/showcase/FrameShowcase'
import { SessionRetrieveModal } from './components/showcase/SessionRetrieveModal'
import { StripViewerRoute } from './components/showcase/StripViewerRoute'
import { FramePickerModal } from './components/booth/FramePickerModal'
import { PreCaptureFilterStep } from './components/booth/PreCaptureFilterStep'
import { PreCaptureFrameStep } from './components/booth/PreCaptureFrameStep'
import { CameraPrepStep } from './components/booth/CameraPrepStep'
import { WebcamViewfinder } from './components/booth/WebcamViewfinder'
import { ContactSheet } from './components/booth/ContactSheet'
import { ExportView } from './components/booth/ExportView'
import { Camera, Smartphone, QrCode } from 'lucide-react'
import { sound } from './services/soundService'

export function App() {
  const { status, resetSession, startBooth, goToFilterSelect } = useBoothStore()

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

  // 2. In-Booth Active Flows (Pre-capture sequence: Filter -> Frame -> Camera Prep -> 4 Shots with 3s Timer -> Final Strip)
  if (status === 'filterSelect') {
    return <PreCaptureFilterStep />
  }

  if (status === 'frameSelect') {
    return <PreCaptureFrameStep />
  }

  if (status === 'cameraPrep') {
    return <CameraPrepStep />
  }

  if (status === 'capturing') {
    return <WebcamViewfinder onExit={resetSession} />
  }

  if (status === 'contactSheet') {
    return <ContactSheet />
  }

  if (status === 'exportReady') {
    return <ExportView />
  }

  // 3. Simple Showcase & Landing Page
  return (
    <div className="min-h-screen bg-[#0B0B0E] text-[#F3F3F6] flex flex-col justify-between selection:bg-[#FF385C] selection:text-white">
      {/* Navigation Header */}
      <nav className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#181820] border border-white/10 flex items-center justify-center font-bold text-[#FF385C] text-sm">
            4C
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-white leading-tight">
              Korean 4-Cut
            </div>
            <div className="text-[11px] text-white/40">Photobooth Studio</div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sound.playClick()
              setIsRetrieveModalOpen(true)
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-medium border border-white/10 transition-colors cursor-pointer"
          >
            <QrCode size={14} />
            <span>Find Photos</span>
          </button>

          <button
            onClick={() => {
              sound.playClick()
              startBooth()
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF385C] hover:bg-[#E02649] text-white text-xs font-bold transition-all shadow-md shadow-[#FF385C]/20 cursor-pointer active:scale-95"
          >
            <Camera size={14} />
            <span>Start Booth</span>
          </button>
        </div>
      </nav>

      {/* Main Showcase Hero & Frame Gallery */}
      <main className="flex-1">
        <HeroSection
          onStartBooth={() => {
            sound.playClick()
            startBooth()
          }}
          onOpenRetrieve={() => {
            sound.playClick()
            setIsRetrieveModalOpen(true)
          }}
        />
        <FrameShowcase
          onSelectFrameAndStart={() => {
            sound.playClick()
            goToFilterSelect()
          }}
        />
      </main>

      {/* Simple Footer */}
      <footer className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
        <div>© 2026 Korean 4-Cut Photobooth. All rights reserved.</div>
        <div className="flex items-center gap-4">
          <a
            href="/apk/photobooth-release.apk"
            download="photobooth-release.apk"
            className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors"
          >
            <Smartphone size={13} />
            <span>Android APK (54.9 MB)</span>
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
