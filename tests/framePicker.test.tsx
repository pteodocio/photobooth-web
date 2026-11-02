import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FramePickerModal } from '../src/components/booth/FramePickerModal'
import { useBoothStore } from '../src/store/useBoothStore'

describe('FramePickerModal Component Tests', () => {
  beforeEach(() => {
    useBoothStore.getState().resetSession()
  })

  it('renders frame picker with categories and layout switch', () => {
    render(<FramePickerModal isOpen={true} onClose={() => {}} />)
    expect(screen.getByText('Select Frame')).toBeInTheDocument()
    expect(screen.getByText('Christmas')).toBeInTheDocument()
    expect(screen.getByText('Creative Editions')).toBeInTheDocument()
    expect(screen.getByText('4-Cut')).toBeInTheDocument()
    expect(screen.getByText('6-Cut')).toBeInTheDocument()
  })

  it('filters frames when category tab is clicked', () => {
    render(<FramePickerModal isOpen={true} onClose={() => {}} />)
    const classicTab = screen.getByText('Classic Film')
    fireEvent.click(classicTab)

    expect(screen.getByText('Classic Black')).toBeInTheDocument()
    expect(screen.queryByText('Y2K Cyber Pop')).not.toBeInTheDocument()
  })

  it('filters frames when Christmas category tab is clicked', () => {
    render(<FramePickerModal isOpen={true} onClose={() => {}} />)
    const xmasTab = screen.getByText('Christmas')
    fireEvent.click(xmasTab)

    expect(screen.getByText('Classic Christmas')).toBeInTheDocument()
    expect(screen.getByText('Snowy December')).toBeInTheDocument()
    expect(screen.queryByText('Classic Black')).not.toBeInTheDocument()
  })

  it('switches layout between 4-Cut and 6-Cut', () => {
    render(<FramePickerModal isOpen={true} onClose={() => {}} />)
    const sixCutBtn = screen.getByText('6-Cut')
    fireEvent.click(sixCutBtn)

    expect(useBoothStore.getState().selectedLayout.id).toBe('sixCut')
  })

  it('selects frame and closes modal when confirm is clicked', () => {
    let closed = false
    render(<FramePickerModal isOpen={true} onClose={() => { closed = true }} />)

    const y2kCard = screen.getByText('Y2K Cyber Pop')
    fireEvent.click(y2kCard)

    expect(useBoothStore.getState().selectedFrame.id).toBe('y2k_cyber')

    const startBtn = screen.getByText('Start Session')
    fireEvent.click(startBtn)
    expect(closed).toBe(true)
  })
})
