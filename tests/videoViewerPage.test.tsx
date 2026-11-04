import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { VideoViewerPage } from '../src/components/showcase/VideoViewerPage'
import { SyncService } from '../src/services/syncService'

describe('VideoViewerPage Component Tests', () => {
  it('renders video player and download button without exposing session id or backend details', async () => {
    vi.spyOn(SyncService, 'fetchVideo').mockResolvedValue({
      videoUrl: 'https://example.com/photobooth_bts.webm',
      title: 'Snowy December',
    })

    const onBack = vi.fn()
    render(<VideoViewerPage token="k4c_test_token" onBack={onBack} />)

    // Wait for video to load
    await waitFor(() => {
      expect(screen.getByText('Snowy December')).toBeInTheDocument()
    })

    // The ONLY main action is Download Video
    const downloadBtn = screen.getByRole('button', { name: /Download Video/i })
    expect(downloadBtn).toBeInTheDocument()

    // Video element is present
    const video = document.querySelector('video')
    expect(video).toBeInTheDocument()
    expect(video).toHaveAttribute('src', 'https://example.com/photobooth_bts.webm')

    // Absolutely NO session ID or database text is exposed
    expect(screen.queryByText(/session_/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Session ID/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Supabase/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Database/i)).not.toBeInTheDocument()

    // Trigger download
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(new Blob(['video-bytes'], { type: 'video/webm' })))
    fireEvent.click(downloadBtn)

    await waitFor(() => {
      expect(screen.getByText(/Video Downloaded!|Downloading/i)).toBeInTheDocument()
    })
  })

  it('renders clean error message if video is not found', async () => {
    vi.spyOn(SyncService, 'fetchVideo').mockResolvedValue(null)

    render(<VideoViewerPage token="invalid_token" />)

    await waitFor(() => {
      expect(screen.getByText('Video Not Found')).toBeInTheDocument()
    })
  })
})
