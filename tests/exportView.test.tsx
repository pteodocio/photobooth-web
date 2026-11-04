import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ExportView } from '../src/components/booth/ExportView'
import { useBoothStore } from '../src/store/useBoothStore'

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}))

describe('ExportView Component Tests', () => {
  beforeEach(() => {
    useBoothStore.getState().resetSession()
    useBoothStore.getState().startSession()
    for (let i = 0; i < 4; i++) {
      useBoothStore.getState().recordShot(`data:image/png;base64,photo_${i}`)
    }
    useBoothStore.getState().setCompositeDataUrl('data:image/png;base64,compositeResult')
  })

  it('renders mechanical dispenser slot and printed film strip', () => {
    render(<ExportView />)
    expect(screen.getByTestId('printer-dispenser-slot')).toBeInTheDocument()
    expect(screen.getByAltText('Printed Film Strip')).toBeInTheDocument()
    expect(screen.getByText(/Download Strip/i)).toBeInTheDocument()
  })

  it('toggles between Printed Strip and Live Motion Reel', () => {
    render(<ExportView />)
    const reelBtn = screen.getByText('Live Motion Reel')
    fireEvent.click(reelBtn)

    expect(screen.getByText('LIVE REEL')).toBeInTheDocument()
  })

  it('opens QR modal when QR Code button is clicked', () => {
    render(<ExportView />)
    const qrBtn = screen.getByText('QR Code')
    fireEvent.click(qrBtn)

    expect(screen.getByText(/Scan for Video/i)).toBeInTheDocument()
  })
})
