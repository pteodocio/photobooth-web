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

  it('renders photo strip and video side by side with a download button for each', async () => {
    vi.spyOn(SyncService, 'fetchVideo').mockResolvedValue({
      compositeUrl: 'https://example.com/photobooth_strip.png',
      videoUrl: 'https://example.com/photobooth_video.webm',
      title: 'Gingerbread House',
      passcode: '4829',
    })

    const onBack = vi.fn()
    render(<VideoViewerPage token="k4c_side_by_side_token" onBack={onBack} />)

    // Wait for media to load
    await waitFor(() => {
      expect(screen.getByText('Gingerbread House')).toBeInTheDocument()
    })

    // Passcode badge is rendered
    expect(screen.getByText('CODE: 4829')).toBeInTheDocument()

    // Both sections are present
    expect(screen.getByText('Photo Strip')).toBeInTheDocument()
    expect(screen.getByText('Behind-the-Scenes Video')).toBeInTheDocument()

    // Strip image is rendered
    const stripImg = screen.getByAltText('Photo Strip')
    expect(stripImg).toBeInTheDocument()
    expect(stripImg).toHaveAttribute('src', 'https://example.com/photobooth_strip.png')

    // Video element is rendered
    const video = document.querySelector('video')
    expect(video).toBeInTheDocument()
    expect(video).toHaveAttribute('src', 'https://example.com/photobooth_video.webm')

    // BOTH download buttons are present
    const downloadStripBtn = screen.getByRole('button', { name: /Download Strip/i })
    const downloadVideoBtn = screen.getByRole('button', { name: /Download Video/i })

    expect(downloadStripBtn).toBeInTheDocument()
    expect(downloadVideoBtn).toBeInTheDocument()

    // Mock fetch for strip download
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(new Blob(['mock-png-data'], { type: 'image/png' })))
    fireEvent.click(downloadStripBtn)

    await waitFor(() => {
      expect(screen.getByText(/Strip Downloaded!|Downloading Strip/i)).toBeInTheDocument()
    })
  })
})
