import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { StripViewerRoute } from '../src/components/showcase/StripViewerRoute'
import { SyncService } from '../src/services/syncService'

describe('StripViewerRoute Component Tests', () => {
  it('renders photo strip and short video BTS tabs', async () => {
    vi.spyOn(SyncService, 'fetchSession').mockResolvedValue({
      sessionId: 'test_session_video',
      compositeUrl: 'https://example.com/strip.png',
      videoUrl: 'https://example.com/video.webm',
      frameName: 'Classic Christmas',
      koreanTitle: '클래식 크리스마스',
      timestamp: Date.now(),
    })

    const onBackMock = vi.fn()
    render(<StripViewerRoute sessionId="test_session_video" onBack={onBackMock} />)

    // Wait for data load
    await waitFor(() => {
      expect(screen.getByText('Classic Christmas')).toBeInTheDocument()
    })

    // Expect tab buttons
    expect(screen.getByText(/4-Cut Photo Strip/i)).toBeInTheDocument()
    expect(screen.getByText(/Short Video \(BTS\)/i)).toBeInTheDocument()

    // Download buttons
    expect(screen.getByText(/Download Photo Strip/i)).toBeInTheDocument()
    expect(screen.getByText(/Download Video \(BTS\)/i)).toBeInTheDocument()

    // Switch to video tab
    fireEvent.click(screen.getByText(/Short Video \(BTS\)/i))
    const video = document.querySelector('video')
    expect(video).toBeInTheDocument()
    expect(video).toHaveAttribute('src', 'https://example.com/video.webm')
  })
})
