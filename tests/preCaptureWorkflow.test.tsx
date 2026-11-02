import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { PreCaptureFilterStep } from '../src/components/booth/PreCaptureFilterStep'
import { PreCaptureFrameStep } from '../src/components/booth/PreCaptureFrameStep'
import { CameraPrepStep } from '../src/components/booth/CameraPrepStep'
import { useBoothStore } from '../src/store/useBoothStore'
import { PHOTO_FILTERS } from '../src/core/filters'
import { AppConstants } from '../src/core/constants'

describe('Pre-Capture Workflow Step Tests', () => {
  beforeEach(() => {
    useBoothStore.getState().resetSession()

    // Mock HTMLMediaElement play/pause
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined)
    HTMLMediaElement.prototype.pause = vi.fn()

    // Mock getUserMedia
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: vi.fn() }],
        }),
      },
      writable: true,
    })
  })

  it('verifies 3-second countdown default constants', () => {
    expect(AppConstants.defaultCountdownSeconds).toBe(3)
    expect(AppConstants.defaultShotIntervalSeconds).toBe(3)
  })

  it('renders Step 1: PreCaptureFilterStep with all 40 filters and categories', () => {
    render(<PreCaptureFilterStep />)

    expect(screen.getByText('Choose Photo Filter')).toBeInTheDocument()
    expect(screen.getByText('Step 1 of 4')).toBeInTheDocument()
    expect(screen.getByText('Filter Intensity')).toBeInTheDocument()

    // Verify filter swatches render
    expect(screen.getByText('Seoul Film')).toBeInTheDocument()
    expect(screen.getByText('Vintage Kodak')).toBeInTheDocument()
    expect(screen.getByText('Fuji Film')).toBeInTheDocument()
    expect(screen.getByText('Porcelain Skin')).toBeInTheDocument()

    // Select a filter
    const vintageKodakBtn = screen.getByText('Vintage Kodak')
    fireEvent.click(vintageKodakBtn)
    expect(useBoothStore.getState().selectedFilter).toBe('vintage_kodak')

    // Click Next: Choose Frame
    const nextBtn = screen.getByText('Next: Choose Frame')
    fireEvent.click(nextBtn)
    expect(useBoothStore.getState().status).toBe('frameSelect')
  })

  it('renders Step 2: PreCaptureFrameStep with Christmas frames and graphics', () => {
    render(<PreCaptureFrameStep />)

    expect(screen.getByText('Choose Frame Design')).toBeInTheDocument()
    expect(screen.getByText('Step 2 of 4')).toBeInTheDocument()
    expect(screen.getByText('🎄 Christmas (40)')).toBeInTheDocument()

    // Verify Christmas frames render
    expect(screen.getByText('Classic Christmas')).toBeInTheDocument()
    expect(screen.getByText('Christmas Wonderland')).toBeInTheDocument()
    expect(screen.getByText("Santa's Workshop")).toBeInTheDocument()
    expect(screen.getByText('December Memories')).toBeInTheDocument()

    // Can go back to filter step
    const backBtn = screen.getByText('Back to Filters')
    fireEvent.click(backBtn)
    expect(useBoothStore.getState().status).toBe('filterSelect')

    // Navigate forward to camera prep
    useBoothStore.getState().goToFrameSelect()
    const nextBtn = screen.getByText('Next: Camera Setup')
    fireEvent.click(nextBtn)
    expect(useBoothStore.getState().status).toBe('cameraPrep')
  })

  it('renders Step 3: CameraPrepStep and starts photobooth', () => {
    render(<CameraPrepStep />)

    expect(screen.getByText('Camera Preparation')).toBeInTheDocument()
    expect(screen.getByText('Step 3 of 4')).toBeInTheDocument()
    expect(screen.getByText(/4 automatic shots/i)).toBeInTheDocument()

    // Click Start Photobooth button
    const startBtn = screen.getByText('Start Photobooth (4 Shots)')
    fireEvent.click(startBtn)
    expect(useBoothStore.getState().status).toBe('capturing')
  })
})
