import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SessionRetrieveModal } from '../src/components/showcase/SessionRetrieveModal'
import { SyncService } from '../src/services/syncService'

describe('SessionRetrieveModal Component Tests', () => {
  const mockOnClose = vi.fn()
  const mockOnRetrieve = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <SessionRetrieveModal
        isOpen={false}
        onClose={mockOnClose}
        onRetrieve={mockOnRetrieve}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders modal with 3 tabs and 4-digit input on open', () => {
    render(
      <SessionRetrieveModal
        isOpen={true}
        onClose={mockOnClose}
        onRetrieve={mockOnRetrieve}
      />
    )

    expect(screen.getByText('Find Your Photos')).toBeDefined()
    expect(screen.getByText('Photo Code')).toBeDefined()
    expect(screen.getByText('Scan QR')).toBeDefined()
    expect(screen.getByText('Recent')).toBeDefined()

    const inputs = screen.getAllByRole('textbox')
    expect(inputs).toHaveLength(4)
  })

  it('allows typing 4-digit passcode and invokes fetchByPasscode', async () => {
    const fetchSpy = vi.spyOn(SyncService, 'fetchByPasscode').mockResolvedValue({
      token: 'test_token_123',
      isVideo: true,
      compositeUrl: 'https://example.com/strip.png',
      videoUrl: 'https://example.com/video.webm',
      frameName: 'Classic Christmas',
    })

    render(
      <SessionRetrieveModal
        isOpen={true}
        onClose={mockOnClose}
        onRetrieve={mockOnRetrieve}
      />
    )

    const inputs = screen.getAllByRole('textbox')
    fireEvent.change(inputs[0], { target: { value: '4' } })
    fireEvent.change(inputs[1], { target: { value: '8' } })
    fireEvent.change(inputs[2], { target: { value: '2' } })
    fireEvent.change(inputs[3], { target: { value: '9' } })

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('4829')
    })

    await waitFor(() => {
      expect(mockOnRetrieve).toHaveBeenCalledWith('test_token_123', 'video')
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it('displays user-friendly error message when passcode is not found', async () => {
    vi.spyOn(SyncService, 'fetchByPasscode').mockResolvedValue(null)

    render(
      <SessionRetrieveModal
        isOpen={true}
        onClose={mockOnClose}
        onRetrieve={mockOnRetrieve}
      />
    )

    const inputs = screen.getAllByRole('textbox')
    fireEvent.change(inputs[0], { target: { value: '9' } })
    fireEvent.change(inputs[1], { target: { value: '9' } })
    fireEvent.change(inputs[2], { target: { value: '9' } })
    fireEvent.change(inputs[3], { target: { value: '9' } })

    await waitFor(() => {
      expect(screen.getByText(/No photos found for code 9999/i)).toBeDefined()
    })
  })

  it('switches to Recent tab and renders saved device sessions', async () => {
    SyncService.saveRecentSession({
      sessionId: 'session_rec_42',
      compositeUrl: 'https://example.com/photo.png',
      frameName: 'Pink Ribbon Christmas',
      passcode: '7721',
    })

    render(
      <SessionRetrieveModal
        isOpen={true}
        onClose={mockOnClose}
        onRetrieve={mockOnRetrieve}
      />
    )

    // Click Recent tab
    const recentTabBtn = screen.getByRole('tablist').querySelectorAll('button')[2]
    fireEvent.click(recentTabBtn)

    expect(screen.getByText('Pink Ribbon Christmas')).toBeDefined()
    expect(screen.getByText('#7721')).toBeDefined()

    // Click recent item to retrieve
    fireEvent.click(screen.getByText('Pink Ribbon Christmas'))
    expect(mockOnRetrieve).toHaveBeenCalled()
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('switches to Scan QR tab with camera reticle and photo upload button', () => {
    render(
      <SessionRetrieveModal
        isOpen={true}
        onClose={mockOnClose}
        onRetrieve={mockOnRetrieve}
      />
    )

    // Click Scan QR tab
    const scanTabBtn = screen.getByRole('tablist').querySelectorAll('button')[1]
    fireEvent.click(scanTabBtn)

    expect(screen.getByText('Upload Photo of Strip')).toBeDefined()
  })
})
