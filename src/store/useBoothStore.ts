import { create } from 'zustand'
import type {
  BoothSessionStatus,
  CapturedPhoto,
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
  compositeDataUrl: string | null
  videoBlob: Blob | null
  videoUrl: string | null
  sessionId: string

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
  recordShot: (dataUrl: string) => void
  togglePhotoSelection: (id: string) => void
  reorderSelectedPhotos: (fromIndex: number, toIndex: number) => void
  setFilter: (filter: PhotoFilter) => void
  setFilterIntensity: (intensity: number) => void
  setStamp: (stampText: string) => void
  setCompositeDataUrl: (url: string | null) => void
  setVideoBlob: (blob: Blob | null) => void
  setVideoUrl: (url: string | null) => void
  resetSession: () => void
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
  compositeDataUrl: null,
  videoBlob: null,
  videoUrl: null,
  sessionId: `session_${Date.now()}`,

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
      sessionId: `session_${Date.now()}`,
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
    }),

  retakePhotos: () =>
    set({
      status: 'cameraPrep',
      capturedPhotos: [],
      selectedPhotoIds: [],
      compositeDataUrl: null,
      videoBlob: null,
      videoUrl: null,
    }),

  startSession: () =>
    set({
      status: 'capturing',
      capturedPhotos: [],
      selectedPhotoIds: [],
      compositeDataUrl: null,
      videoBlob: null,
      videoUrl: null,
      sessionId: `session_${Date.now()}`,
    }),

  recordShot: dataUrl => {
    const { capturedPhotos, selectedLayout } = get()
    const nextIndex = capturedPhotos.length
    const newPhoto: CapturedPhoto = {
      id: `photo_${nextIndex}_${Date.now()}`,
      index: nextIndex,
      dataUrl,
      timestamp: Date.now(),
    }
    const updatedPhotos = [...capturedPhotos, newPhoto]

    // If burst count is reached, auto transition to contact sheet with first slotCount pre-selected
    if (updatedPhotos.length >= selectedLayout.burstCount) {
      const autoSelectedIds = updatedPhotos
        .slice(0, selectedLayout.slotCount)
        .map(p => p.id)
      set({
        capturedPhotos: updatedPhotos,
        selectedPhotoIds: autoSelectedIds,
        status: 'contactSheet',
      })
    } else {
      set({ capturedPhotos: updatedPhotos })
    }
  },

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

  setCompositeDataUrl: url => set({ compositeDataUrl: url, status: 'exportReady' }),

  setVideoBlob: blob => set({ videoBlob: blob }),

  setVideoUrl: url => set({ videoUrl: url }),

  resetSession: () =>
    set({
      status: 'idle',
      capturedPhotos: [],
      selectedPhotoIds: [],
      compositeDataUrl: null,
      videoBlob: null,
      videoUrl: null,
      selectedFilter: 'none',
      filterIntensity: 1.0,
      selectedStamp: KOREAN_STAMPS[0].text,
      sessionId: `session_${Date.now()}`,
    }),
}))
