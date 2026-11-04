import { describe, it, expect } from 'vitest'
import { VideoRecorderService } from '../src/services/videoRecorderService'
import { BUNDLED_FRAMES } from '../src/core/frames'
import { LayoutType } from '../src/core/types'

describe('VideoRecorderService Motion Strip Tests', () => {
  it('creates a motion strip video from photos and frame layout', async () => {
    const frame = BUNDLED_FRAMES[0]
    const photos = [
      'data:image/png;base64,photo1',
      'data:image/png;base64,photo2',
      'data:image/png;base64,photo3',
      'data:image/png;base64,photo4',
    ]

    const videoBlob = await VideoRecorderService.createMotionStripVideo({
      photoDataUrls: photos,
      frame,
      layout: LayoutType.fourCut,
      filter: 'none',
      filterIntensity: 1.0,
      stampText: 'BEST SHOT 👑',
      dateString: '2026.11.04',
      passcode: '4829',
    })

    expect(videoBlob).toBeDefined()
    expect(videoBlob?.type).toMatch(/video\/(webm|mp4)/)
  })

  it('generates fallback video when no raw stream is present', async () => {
    const photos = ['data:image/png;base64,p1', 'data:image/png;base64,p2']
    const blob = await VideoRecorderService.createVideoFromPhotos(photos)
    expect(blob).toBeDefined()
    expect(blob?.type).toMatch(/video\/(webm|mp4)/)
  })
})
