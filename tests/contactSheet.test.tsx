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

  it('renders contact sheet with upfront frame lock indicator and photo grid', () => {
    render(<ContactSheet />)
    expect(screen.getByText('포토 스트립 커스텀')).toBeInTheDocument()
    expect(screen.getByText(/프레임 고정:/)).toBeInTheDocument()
    expect(screen.getByText('인화하기 Print Film')).toBeInTheDocument()
  })

  it('allows switching photo filters (Haru Blue, Warm Film, Mono)', () => {
    render(<ContactSheet />)
    const haruBtn = screen.getByText('하루블루')
    fireEvent.click(haruBtn)

    expect(useBoothStore.getState().selectedFilter).toBe('haruBlue')
  })

  it('allows selecting Korean stamps', () => {
    render(<ContactSheet />)
    const stampBtn = screen.getByText('오늘의 우리 ✨')
    fireEvent.click(stampBtn)

    expect(useBoothStore.getState().selectedStamp).toBe('오늘의 우리 ✨')
  })

  it('toggles print format between Single and Twin Strip', () => {
    render(<ContactSheet />)
    const twinBtn = screen.getByText('Twin Strip (1+1)')
    fireEvent.click(twinBtn)

    expect(useBoothStore.getState().selectedPrintFormat.id).toBe('twinStrip')
  })
})
