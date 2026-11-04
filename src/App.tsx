import { useState, useEffect } from 'react'
import { useBoothStore } from './store/useBoothStore'
import { HeroSection } from './components/showcase/HeroSection'
import { FrameShowcase } from './components/showcase/FrameShowcase'
import { SessionRetrieveModal } from './components/showcase/SessionRetrieveModal'
import { VideoViewerPage } from './components/showcase/VideoViewerPage'
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
  const [activeVideoToken, setActiveVideoToken] = useState<string | null>(null)

  // Parse URL query parameters (`?v=<token>` or `?s=<sessionId>`) on load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search)
      let videoParam = searchParams.get('v')
      let sessionParam = searchParams.get('s')

      if (window.location.hash) {
        const hashQuery = window.location.hash.split('?')[1]
        if (hashQuery) {
          const hashParams = new URLSearchParams(hashQuery)
          if (!videoParam) videoParam = hashParams.get('v')
          if (!sessionParam) sessionParam = hashParams.get('s')
        }
      }

      if (window.location.pathname.includes('/video')) {
        const parts = window.location.pathname.split('/video/')
        if (parts[1]) videoParam = parts[1].replace(/\/+$/, '')
      }
      if (!sessionParam && window.location.pathname.includes('/strip')) {
        const parts = window.location.pathname.split('/strip/')
        if (parts[1]) sessionParam = parts[1].replace(/\/+$/, '')
      }

      if (videoParam) {
        setActiveVideoToken(videoParam)
      } else if (sessionParam) {
        setActiveSessionQuery(sessionParam)
      }
    }
  }, [])

  // 1. Dedicated Photobooth Memories Page (Photo Strip & Video Side by Side)
  if (activeVideoToken) {
    return (
      <VideoViewerPage
        token={activeVideoToken}
        onBack={() => {
          setActiveVideoToken(null)
          window.history.pushState({}, '', window.location.pathname)
        }}
      />
    )
  }

  // 2. Photobooth Strip / Session Query Viewer (Photo Strip & Video Side by Side)
  if (activeSessionQuery) {
    return (
      <VideoViewerPage
        token={activeSessionQuery}
        onBack={() => {
          setActiveSessionQuery(null)
          window.history.pushState({}, '', window.location.pathname)
        }}
      />
    )
  }

  // 3. In-Booth Active Flows
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

  // 4. Showcase & Landing Page
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1917] flex flex-col justify-between selection:bg-[#FFF0F3] selection:text-[#FF4D6D]">
      {/* Navigation Header */}
      <nav className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between border-b border-black/[0.05]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#FFF0F3] border border-[#FF4D6D]/20 flex items-center justify-center font-bold text-[#FF4D6D] text-xs shadow-xs">
            4C
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight text-[#1C1917] leading-tight">
              Korean 4-Cut
            </div>
            <div className="text-[11px] text-[#A8A29E]">Photobooth Studio</div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              sound.playClick()
              setIsRetrieveModalOpen(true)
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-black/[0.03] text-[#78716C] hover:text-[#1C1917] text-xs font-medium border border-black/[0.08] shadow-xs transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D]"
          >
            <QrCode size={13} />
            <span>Find Photos</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick()
              startBooth()
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#FF4D6D] hover:bg-[#E11D48] text-white text-xs font-semibold transition-transform duration-150 shadow-xs cursor-pointer transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D]"
          >
            <Camera size={13} />
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

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 border-t border-black/[0.05] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#A8A29E]">
        <div>© 2026 Korean 4-Cut Studio · Self-Photo Booth Experience</div>
        <div className="flex items-center gap-4">
          <a
            href="/apk/photobooth-release.apk"
            download="photobooth-release.apk"
            className="flex items-center gap-1.5 text-[#78716C] hover:text-[#1C1917] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D6D]"
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

      {/* Session Retrieval Modal */}
      <SessionRetrieveModal
        isOpen={isRetrieveModalOpen}
        onClose={() => setIsRetrieveModalOpen(false)}
        onRetrieve={token => {
          setActiveVideoToken(token)
        }}
      />
    </div>
  )
}

export default App
