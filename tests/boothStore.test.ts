import { describe, it, expect, beforeEach } from 'vitest'
import { useBoothStore } from '../src/store/useBoothStore'
import { BUNDLED_FRAMES } from '../src/core/frames'
import { LayoutType, PrintFormat } from '../src/core/types'

describe('Booth Store State Machine Tests', () => {
  beforeEach(() => {
    useBoothStore.getState().resetSession()
  })

  it('initializes with default frame and idle state', () => {
    const state = useBoothStore.getState()
    expect(state.status).toBe('idle')
    expect(state.selectedFrame).toBeDefined()
    expect(state.selectedLayout.id).toBe('fourCut')
    expect(state.selectedPrintFormat.id).toBe('singleStrip')
  })

  it('selects frame and locks it for the session', () => {
    const y2kFrame = BUNDLED_FRAMES.find(f => f.id === 'y2k_cyber')!
    useBoothStore.getState().selectFrame(y2kFrame)
    expect(useBoothStore.getState().selectedFrame.id).toBe('y2k_cyber')
  })

  it('transitions from idle to frameSelect to capturing', () => {
    const store = useBoothStore.getState()
    store.setStatus('frameSelect')
    expect(useBoothStore.getState().status).toBe('frameSelect')

    store.startSession()
    expect(useBoothStore.getState().status).toBe('capturing')
  })

  it('records shots and auto-selects first 4 photos upon completing burst', () => {
    const store = useBoothStore.getState()
    store.startSession()

    // 4 shots burst for 4-cut photobooth
    for (let i = 0; i < 4; i++) {
      useBoothStore.getState().recordShot(`data:image/png;base64,shot_${i}`)
    }

    const state = useBoothStore.getState()
    expect(state.capturedPhotos).toHaveLength(4)
    expect(state.selectedPhotoIds).toHaveLength(4)
    expect(state.status).toBe('contactSheet')
  })

  it('supports pre-capture workflow step navigation', () => {
    const store = useBoothStore.getState()
    store.startBooth()
    expect(useBoothStore.getState().status).toBe('filterSelect')

    store.goToFrameSelect()
    expect(useBoothStore.getState().status).toBe('frameSelect')

    store.goToCameraPrep()
    expect(useBoothStore.getState().status).toBe('cameraPrep')

    store.startCapture()
    expect(useBoothStore.getState().status).toBe('capturing')

    store.retakePhotos()
    expect(useBoothStore.getState().status).toBe('cameraPrep')
  })

  it('reorders selected photos in the strip tray', () => {
    const store = useBoothStore.getState()
    store.startSession()
    for (let i = 0; i < 4; i++) {
      store.recordShot(`data:image/png;base64,shot_${i}`)
    }

    const initialOrder = [...useBoothStore.getState().selectedPhotoIds]
    useBoothStore.getState().reorderSelectedPhotos(0, 2)
    const newOrder = useBoothStore.getState().selectedPhotoIds

    expect(newOrder[2]).toBe(initialOrder[0])
  })
})
