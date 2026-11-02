import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ContactSheet } from '../src/components/booth/ContactSheet'
import { useBoothStore } from '../src/store/useBoothStore'

describe('ContactSheet Component Tests', () => {
  beforeEach(() => {
    useBoothStore.getState().resetSession()
    useBoothStore.getState().startSession()
    // Populate with 6 shots
    for (let i = 0; i < 6; i++) {
      useBoothStore.getState().recordShot(`data:image/png;base64,shot_${i}`)
    }
  })

  it('renders contact sheet with frame indicator and photo grid', () => {
    render(<ContactSheet />)
    expect(screen.getByText('Customize Strip')).toBeInTheDocument()
    expect(screen.getByText(/Frame:/)).toBeInTheDocument()
    expect(screen.getByText('Print Strip')).toBeInTheDocument()
  })

  it('allows switching photo filters (Haru Blue, Warm Film, Mono)', () => {
    render(<ContactSheet />)
    const haruBtn = screen.getByText('Haru Blue')
    fireEvent.click(haruBtn)

    expect(useBoothStore.getState().selectedFilter).toBe('haruBlue')
  })

  it('allows selecting stickers', () => {
    render(<ContactSheet />)
    const stampBtn = screen.getByText('Us Today ✨')
    fireEvent.click(stampBtn)

    expect(useBoothStore.getState().selectedStamp).toBe('Us Today ✨')
  })

  it('toggles print format between Single and Twin Strip', () => {
    render(<ContactSheet />)
    const twinBtn = screen.getByText('Twin Strip (1+1)')
    fireEvent.click(twinBtn)

    expect(useBoothStore.getState().selectedPrintFormat.id).toBe('twinStrip')
  })
})
