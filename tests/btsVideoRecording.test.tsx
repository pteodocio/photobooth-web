import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useBoothStore } from '../src/store/useBoothStore'
import { AnimatedBtsStrip } from '../src/components/booth/AnimatedBtsStrip'
import { ExportView } from '../src/components/booth/ExportView'
import { VideoRecorderService } from '../src/services/videoRecorderService'
import { LayoutType } from '../src/core/types'

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}))

describe('Behind-the-Scenes (BTS) Recording Feature Tests', () => {
  const mockFrame = {
    id: 'korean_classic',
    name: 'Snowy December',
    koreanTitle: '눈 내리는 12월',
    englishTitle: 'SNOWY DECEMBER',
    category: 'Christmas',
    backgroundColor: '#0F172A',
    captionColor: '#FFFFFF',
    gradientColors: ['#0F172A', '#1E293B'],
    themeStyle: 'christmas' as const,
    slotBorderColor: '#FFFFFF',
    slotBorderWidth: 4,
    slotCornerRadius: 12,
  }

  beforeEach(() => {
    useBoothStore.getState().resetSession()
    useBoothStore.getState().startSession()
  })

  it('associates each captured photo with its distinct BTS video clip (1-to-1 mapping)', () => {
    const store = useBoothStore.getState()

    // Simulate capturing 4 distinct photos with their corresponding distinct BTS clips
    for (let i = 0; i < 4; i++) {
      store.recordShot(`data:image/png;base64,photo_data_${i}`, `blob:http://localhost/bts_clip_${i}`)
    }

    const state = useBoothStore.getState()
    expect(state.capturedPhotos).toHaveLength(4)

    // Verify 1-to-1 association: Photo 1 -> Clip 1, Photo 2 -> Clip 2, etc.
    expect(state.capturedPhotos[0].btsClipUrl).toBe('blob:http://localhost/bts_clip_0')
    expect(state.capturedPhotos[1].btsClipUrl).toBe('blob:http://localhost/bts_clip_1')
    expect(state.capturedPhotos[2].btsClipUrl).toBe('blob:http://localhost/bts_clip_2')
    expect(state.capturedPhotos[3].btsClipUrl).toBe('blob:http://localhost/bts_clip_3')

    // Verify each clip is unique
    const uniqueClips = new Set(state.capturedPhotos.map(p => p.btsClipUrl))
    expect(uniqueClips.size).toBe(4)
  })

  it('renders AnimatedBtsStrip with simultaneous video slots for all 4 cuts', () => {
    const mockPhotos = [
      { id: 'p1', index: 0, dataUrl: 'data:image/png;mock1', timestamp: 1, btsClipUrl: 'blob:clip_1' },
      { id: 'p2', index: 1, dataUrl: 'data:image/png;mock2', timestamp: 2, btsClipUrl: 'blob:clip_2' },
      { id: 'p3', index: 2, dataUrl: 'data:image/png;mock3', timestamp: 3, btsClipUrl: 'blob:clip_3' },
      { id: 'p4', index: 3, dataUrl: 'data:image/png;mock4', timestamp: 4, btsClipUrl: 'blob:clip_4' },
    ]

    render(
      <AnimatedBtsStrip
        photos={mockPhotos}
        frame={mockFrame}
        layout={LayoutType.fourCut}
        passcode="7788"
        stampText="우리의 순간"
      />
    )

    // Check strip title and branding
    expect(screen.getByText('SNOWY DECEMBER')).toBeInTheDocument()
    expect(screen.getByText('LIVE BTS')).toBeInTheDocument()
    expect(screen.getByText('CODE: 7788')).toBeInTheDocument()
    expect(screen.getByText('우리의 순간')).toBeInTheDocument()

    // 4 video elements rendered corresponding to the 4 photo slots
    const videoElements = document.querySelectorAll('video')
    expect(videoElements).toHaveLength(4)
    expect(videoElements[0]).toHaveAttribute('src', 'blob:clip_1')
    expect(videoElements[1]).toHaveAttribute('src', 'blob:clip_2')
    expect(videoElements[2]).toHaveAttribute('src', 'blob:clip_3')
    expect(videoElements[3]).toHaveAttribute('src', 'blob:clip_4')

    // Floating toolbar controls are present
    expect(screen.getByTitle(/Pause All|Play All/i)).toBeInTheDocument()
    expect(screen.getByTitle(/Replay from Beginning/i)).toBeInTheDocument()
    expect(screen.getByText(/4 BTS Moments Synced/i)).toBeInTheDocument()
  })

  it('supports toggle play/pause and replay in AnimatedBtsStrip', () => {
    const mockPhotos = [
      { id: 'p1', index: 0, dataUrl: 'data:image/png;mock1', timestamp: 1, btsClipUrl: 'blob:clip_1' },
      { id: 'p2', index: 1, dataUrl: 'data:image/png;mock2', timestamp: 2, btsClipUrl: 'blob:clip_2' },
    ]

    render(
      <AnimatedBtsStrip
        photos={mockPhotos}
        frame={mockFrame}
        layout={LayoutType.fourCut}
      />
    )

    const pauseBtn = screen.getByTitle('Pause All')
    fireEvent.click(pauseBtn)

    // Now it should show Play All button
    expect(screen.getByTitle('Play All')).toBeInTheDocument()

    // Click Replay
    const replayBtn = screen.getByTitle('Replay from Beginning')
    fireEvent.click(replayBtn)

    // Resumes playing
    expect(screen.getByTitle('Pause All')).toBeInTheDocument()
  })

  it('provides Output A (Photo Strip) and Output B (Animated BTS Strip) in ExportView', () => {
    const store = useBoothStore.getState()
    for (let i = 0; i < 4; i++) {
      store.recordShot(`data:image/png;base64,photo_${i}`, `blob:http://localhost/bts_${i}`)
    }
    store.setCompositeDataUrl('data:image/png;base64,mockComposite')
    store.setVideoUrl('blob:http://localhost/motion_strip.mp4')

    render(<ExportView />)

    // Output A default view
    expect(screen.getByText(/OUTPUT A/i)).toBeInTheDocument()
    expect(screen.getByText(/TRADITIONAL PHOTO STRIP/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Download Strip/i })).toBeInTheDocument()

    // Switch to Output B (Live Motion Reel / Animated BTS Strip)
    const reelTab = screen.getByText(/Live Motion Reel/i)
    fireEvent.click(reelTab)

    expect(screen.getByText(/OUTPUT B/i)).toBeInTheDocument()
    expect(screen.getByText(/ANIMATED BTS PHOTO STRIP/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Download Video/i })).toBeInTheDocument()
  })

  it('VideoRecorderService processes btsClipBlobs for motion strip video generation', async () => {
    const photoUrls = [
      'data:image/png;base64,shot1',
      'data:image/png;base64,shot2',
      'data:image/png;base64,shot3',
      'data:image/png;base64,shot4',
    ]
    const btsClips = [
      new Blob(['clip1'], { type: 'video/webm' }),
      new Blob(['clip2'], { type: 'video/webm' }),
      new Blob(['clip3'], { type: 'video/webm' }),
      new Blob(['clip4'], { type: 'video/webm' }),
    ]

    const videoBlob = await VideoRecorderService.createMotionStripVideo({
      photoDataUrls: photoUrls,
      btsClipBlobs: btsClips,
      frame: mockFrame,
      layout: LayoutType.fourCut,
      filter: 'warm',
      filterIntensity: 0.8,
      stampText: '인생네컷',
      dateString: '2026.11.04',
      passcode: '1234',
    })

    expect(videoBlob).toBeDefined()
    expect(videoBlob?.size).toBeGreaterThan(0)
  })
})
