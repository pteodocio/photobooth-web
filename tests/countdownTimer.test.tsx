import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { CameraPrepStep } from '../src/components/booth/CameraPrepStep'
import { WebcamViewfinder } from '../src/components/booth/WebcamViewfinder'
import { useBoothStore } from '../src/store/useBoothStore'

describe('Customizable Photo Countdown Timer & BTS Duration Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useBoothStore.getState().resetSession()
    useBoothStore.getState().startSession()

    // Mock HTMLMediaElement
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

  it('renders all 3 countdown options (3s, 5s, 10s) with descriptions and BTS estimates', () => {
    render(<CameraPrepStep />)

    // Verify section header
    expect(screen.getByText('Choose Countdown Timer')).toBeInTheDocument()

    // Verify all 3 options are rendered
    expect(screen.getAllByText('3 Seconds').length).toBeGreaterThan(0)
    expect(screen.getByText('Quick and easy poses.')).toBeInTheDocument()
    expect(screen.getByText('~4–5s BTS footage')).toBeInTheDocument()

    expect(screen.getAllByText('5 Seconds').length).toBeGreaterThan(0)
    expect(screen.getByText('Enough time to prepare.')).toBeInTheDocument()
    expect(screen.getByText('~6–7s BTS footage')).toBeInTheDocument()

    expect(screen.getAllByText('10 Seconds').length).toBeGreaterThan(0)
    expect(screen.getByText('More time for creative poses.')).toBeInTheDocument()
    expect(screen.getByText('~11–12s BTS footage')).toBeInTheDocument()

    // 3s is selected by default
    expect(useBoothStore.getState().selectedCountdown).toBe(3)
  })

  it('allows user to select 5-second or 10-second timer and updates store', () => {
    render(<CameraPrepStep />)

    // Select 5 seconds
    const fiveSecBtn = screen.getByTestId('timer-option-5')
    act(() => {
      fireEvent.click(fiveSecBtn)
    })
    expect(useBoothStore.getState().selectedCountdown).toBe(5)

    // Select 10 seconds
    const tenSecBtn = screen.getByTestId('timer-option-10')
    act(() => {
      fireEvent.click(tenSecBtn)
    })
    expect(useBoothStore.getState().selectedCountdown).toBe(10)
  })

  it('displays complete Session Configuration Summary before capture', () => {
    useBoothStore.getState().setCountdown(5)
    render(<CameraPrepStep />)

    // Session Summary heading
    expect(screen.getByText('Session Summary')).toBeInTheDocument()

    // Check Filter, Frame, Countdown Timer, and BTS Recording status
    expect(screen.getByText('Selected Filter')).toBeInTheDocument()
    expect(screen.getByText('Selected Frame')).toBeInTheDocument()
    expect(screen.getByText('Countdown Timer')).toBeInTheDocument()
    expect(screen.getByText('BTS Recording')).toBeInTheDocument()

    // Verify 5s countdown is shown in the summary
    expect(screen.getAllByText('5 Seconds').length).toBeGreaterThan(0)
    expect(screen.getByText(/Active \(~6–7s BTS footage\)/i)).toBeInTheDocument()
  })

  it('applies the 5-second timer to the camera countdown in WebcamViewfinder', () => {
    useBoothStore.getState().setCountdown(5)
    render(<WebcamViewfinder onExit={() => {}} />)

    // Viewfinder indicator displays 5s countdown
    expect(screen.getByText('5s')).toBeInTheDocument()

    // REC BTS indicator shows 5s
    expect(screen.getByText('REC BTS (5s)')).toBeInTheDocument()

    // Countdown ring starts at 5s
    expect(screen.getByTestId('countdown-number')).toHaveTextContent('5')

    // Button shows (5s)
    expect(screen.getByText('(5s)')).toBeInTheDocument()

    // Advances timer by 1 second -> shows 4
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(screen.getByTestId('countdown-number')).toHaveTextContent('4')

    // Advances timer by another second -> shows 3
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(screen.getByTestId('countdown-number')).toHaveTextContent('3')
  })

  it('applies the 10-second timer to the camera countdown in WebcamViewfinder', () => {
    useBoothStore.getState().setCountdown(10)
    render(<WebcamViewfinder onExit={() => {}} />)

    // Viewfinder indicator displays 10s countdown
    expect(screen.getByText('10s')).toBeInTheDocument()
    expect(screen.getByText('REC BTS (10s)')).toBeInTheDocument()
    expect(screen.getByTestId('countdown-number')).toHaveTextContent('10')
    expect(screen.getByText('(10s)')).toBeInTheDocument()

    // Advances timer by 3 seconds -> shows 7
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(screen.getByTestId('countdown-number')).toHaveTextContent('7')
  })

  it('preserves the selected countdown across sessions and retakes', () => {
    useBoothStore.getState().setCountdown(10)
    expect(useBoothStore.getState().selectedCountdown).toBe(10)

    // User triggers retakePhotos
    useBoothStore.getState().retakePhotos()
    expect(useBoothStore.getState().selectedCountdown).toBe(10)

    // User triggers resetSession
    useBoothStore.getState().resetSession()
    expect(useBoothStore.getState().selectedCountdown).toBe(10)
  })
})
