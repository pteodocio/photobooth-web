import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { WebcamViewfinder } from '../src/components/booth/WebcamViewfinder'
import { useBoothStore } from '../src/store/useBoothStore'

describe('WebcamViewfinder Component Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useBoothStore.getState().resetSession()
    useBoothStore.getState().startSession()

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

  it('renders 4:3 viewfinder framing guide with Korean photobooth cues', () => {
    render(<WebcamViewfinder onExit={() => {}} />)
    expect(screen.getByTestId('viewfinder-framing-mask')).toBeInTheDocument()
    expect(screen.getByText('찰칵 Shoot Now')).toBeInTheDocument()
  })

  it('triggers manual photo capture when 찰칵 button is clicked', () => {
    render(<WebcamViewfinder onExit={() => {}} />)
    const shutterBtn = screen.getByText('찰칵 Shoot Now')

    act(() => {
      fireEvent.click(shutterBtn)
    })

    const state = useBoothStore.getState()
    expect(state.capturedPhotos.length).toBeGreaterThan(0)
  })

  it('displays shot progress in the rolling filmstrip indicator', () => {
    render(<WebcamViewfinder onExit={() => {}} />)
    expect(screen.getByText('SHOT 1/6')).toBeInTheDocument()
  })
})
