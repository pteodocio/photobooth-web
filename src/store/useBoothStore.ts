import { create } from 'zustand'
import type {
  BoothSessionStatus,
  CapturedPhoto,
  CountdownDuration,
  FrameTemplate,
  LayoutTypeConfig,
  PhotoFilter,
  PrintFormatConfig,
} from '../core/types'
import { LayoutType, PrintFormat } from '../core/types'
import { BUNDLED_FRAMES } from '../core/frames'
import { KOREAN_STAMPS } from '../core/stamps'

interface BoothState {
  status: BoothSessionStatus
  selectedFrame: FrameTemplate
  selectedLayout: LayoutTypeConfig
  selectedPrintFormat: PrintFormatConfig
  capturedPhotos: CapturedPhoto[]
  selectedPhotoIds: string[]
  selectedFilter: PhotoFilter
  filterIntensity: number
  selectedStamp: string
  selectedCountdown: CountdownDuration
  compositeDataUrl: string | null
  videoBlob: Blob | null
  videoUrl: string | null
  btsClips: string[]
  sessionId: string
  passcode: string

  // Actions
  setStatus: (status: BoothSessionStatus) => void
  selectFrame: (frame: FrameTemplate) => void
  setLayout: (layout: LayoutTypeConfig) => void
  setPrintFormat: (format: PrintFormatConfig) => void
  startBooth: () => void
  goToFrameSelect: () => void
  goToCameraPrep: () => void
  goToFilterSelect: () => void
  startCapture: () => void
  retakePhotos: () => void
  startSession: () => void
  recordShot: (dataUrl: string, btsClipUrl?: string) => void
  attachBtsClipToPhoto: (photoIndex: number, clipUrl: string) => void
  addBtsClip: (clipUrl: string) => void
  setBtsClips: (clips: string[]) => void
  togglePhotoSelection: (id: string) => void
  reorderSelectedPhotos: (fromIndex: number, toIndex: number) => void
  setFilter: (filter: PhotoFilter) => void
  setFilterIntensity: (intensity: number) => void
  setStamp: (stampText: string) => void
  setCountdown: (seconds: CountdownDuration) => void
  setCompositeDataUrl: (url: string | null) => void
  setVideoBlob: (blob: Blob | null) => void
  setVideoUrl: (url: string | null) => void
  setPasscode: (code: string) => void
  resetSession: () => void
}

export function generatePasscode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

const defaultFrame = BUNDLED_FRAMES.find(f => f.id === 'pastel_dream') || BUNDLED_FRAMES[0]

export const useBoothStore = create<BoothState>((set, get) => ({
  status: 'idle',
  selectedFrame: defaultFrame,
  selectedLayout: LayoutType.fourCut,
  selectedPrintFormat: PrintFormat.singleStrip,
  capturedPhotos: [],
  selectedPhotoIds: [],
  selectedFilter: 'none',
  filterIntensity: 1.0,
  selectedStamp: KOREAN_STAMPS[0].text,
  selectedCountdown: 3,
  compositeDataUrl: null,
  videoBlob: null,
  videoUrl: null,
  btsClips: [],
  sessionId: `session_${Date.now()}`,
  passcode: generatePasscode(),

  setStatus: status => set({ status }),

  selectFrame: frame => set({ selectedFrame: frame }),

  setLayout: layout => set({ selectedLayout: layout }),

  setPrintFormat: format => set({ selectedPrintFormat: format }),

  startBooth: () =>
    set({
      status: 'filterSelect',
      capturedPhotos: [],
      selectedPhotoIds: [],
      compositeDataUrl: null,
      videoBlob: null,
      videoUrl: null,
      btsClips: [],
      sessionId: `session_${Date.now()}`,
      passcode: generatePasscode(),
    }),

  goToFrameSelect: () => set({ status: 'frameSelect' }),

  goToCameraPrep: () => set({ status: 'cameraPrep' }),

  goToFilterSelect: () => set({ status: 'filterSelect' }),

  startCapture: () =>
    set({
      status: 'capturing',
      capturedPhotos: [],
      selectedPhotoIds: [],
      compositeDataUrl: null,
      videoBlob: null,
      videoUrl: null,
      btsClips: [],
    }),

  retakePhotos: () =>
    set({
      status: 'cameraPrep',
      capturedPhotos: [],
      selectedPhotoIds: [],
      compositeDataUrl: null,
      videoBlob: null,
      videoUrl: null,
      btsClips: [],
    }),

  startSession: () =>
    set({
      status: 'capturing',
      capturedPhotos: [],
      selectedPhotoIds: [],
      compositeDataUrl: null,
      videoBlob: null,
      videoUrl: null,
      btsClips: [],
      sessionId: `session_${Date.now()}`,
      passcode: generatePasscode(),
    }),

  recordShot: (dataUrl, btsClipUrl) => {
    const { capturedPhotos, selectedLayout, btsClips } = get()
    const nextIndex = capturedPhotos.length
    const newPhoto: CapturedPhoto = {
      id: `photo_${nextIndex}_${Date.now()}`,
      index: nextIndex,
      dataUrl,
      timestamp: Date.now(),
      btsClipUrl,
    }
    const updatedPhotos = [...capturedPhotos, newPhoto]
    const updatedClips = btsClipUrl ? [...btsClips, btsClipUrl] : btsClips

    // If burst count is reached, auto transition to contact sheet with first slotCount pre-selected
    if (updatedPhotos.length >= selectedLayout.burstCount) {
      const autoSelectedIds = updatedPhotos
        .slice(0, selectedLayout.slotCount)
        .map(p => p.id)
      set({
        capturedPhotos: updatedPhotos,
        selectedPhotoIds: autoSelectedIds,
        btsClips: updatedClips,
        status: 'contactSheet',
      })
    } else {
      set({ capturedPhotos: updatedPhotos, btsClips: updatedClips })
    }
  },

  attachBtsClipToPhoto: (photoIndex, clipUrl) => {
    const { capturedPhotos, btsClips } = get()
    const updatedPhotos = capturedPhotos.map((p, idx) =>
      idx === photoIndex ? { ...p, btsClipUrl: clipUrl } : p
    )
    const updatedClips = [...btsClips]
    updatedClips[photoIndex] = clipUrl
    set({ capturedPhotos: updatedPhotos, btsClips: updatedClips })
  },

  addBtsClip: clipUrl => {
    const { btsClips } = get()
    set({ btsClips: [...btsClips, clipUrl] })
  },

  setBtsClips: clips => set({ btsClips: clips }),

  togglePhotoSelection: id => {
    const { selectedPhotoIds, selectedLayout } = get()
    if (selectedPhotoIds.includes(id)) {
      set({ selectedPhotoIds: selectedPhotoIds.filter(item => item !== id) })
    } else {
      if (selectedPhotoIds.length < selectedLayout.slotCount) {
        set({ selectedPhotoIds: [...selectedPhotoIds, id] })
      }
    }
  },

  reorderSelectedPhotos: (fromIndex, toIndex) => {
    const { selectedPhotoIds } = get()
    const updated = [...selectedPhotoIds]
    const [moved] = updated.splice(fromIndex, 1)
    updated.splice(toIndex, 0, moved)
    set({ selectedPhotoIds: updated })
  },

  setFilter: filter => set({ selectedFilter: filter }),

  setFilterIntensity: intensity => set({ filterIntensity: Math.max(0, Math.min(1, intensity)) }),

  setStamp: stampText => set({ selectedStamp: stampText }),

  setCountdown: seconds => set({ selectedCountdown: seconds }),

  setCompositeDataUrl: url => set({ compositeDataUrl: url, status: 'exportReady' }),

  setVideoBlob: blob => set({ videoBlob: blob }),

  setVideoUrl: url => set({ videoUrl: url }),

  setPasscode: code => set({ passcode: code }),

  resetSession: () =>
    set({
      status: 'idle',
      capturedPhotos: [],
      selectedPhotoIds: [],
      compositeDataUrl: null,
      videoBlob: null,
      videoUrl: null,
      btsClips: [],
      selectedFilter: 'none',
      filterIntensity: 1.0,
      selectedStamp: KOREAN_STAMPS[0].text,
      sessionId: `session_${Date.now()}`,
      passcode: generatePasscode(),
    }),
}))
