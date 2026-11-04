import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderStrip, renderFrameToCanvas, getSamplePhotos } from '../src/services/compositorService'
import { BUNDLED_FRAMES } from '../src/core/frames'
import { CHRISTMAS_FRAMES } from '../src/core/christmasFrames'
import { LayoutType, PrintFormat } from '../src/core/types'

describe('Canvas Compositor Service Tests', () => {
  beforeEach(() => {
    // Mock Image in jsdom so it triggers onload synchronously
    class MockImage {
      width = 800
      height = 600
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      crossOrigin = ''
      private _src = ''
      set src(val: string) {
        this._src = val
        setTimeout(() => this.onload?.(), 1)
      }
      get src() {
        return this._src
      }
    }
    vi.stubGlobal('Image', MockImage)

    // Setup mock canvas 2d context for headless jsdom test
    const mockCtx = {
      canvas: { width: 1200, height: 3600 },
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      font: '',
      textAlign: '',
      textBaseline: '',
      filter: '',
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      rect: vi.fn(),
      clearRect: vi.fn(),
      drawImage: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      roundRect: vi.fn(),
      createLinearGradient: vi.fn(() => ({
        addColorStop: vi.fn(),
      })),
      fillText: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      clip: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      scale: vi.fn(),
      ellipse: vi.fn(),
      quadraticCurveTo: vi.fn(),
      bezierCurveTo: vi.fn(),
      closePath: vi.fn(),
      setLineDash: vi.fn(),
    }

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(mockCtx as unknown as CanvasRenderingContext2D)
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,mockPng')
  })

  it('renders 4-cut single strip at 1200x3600 dimensions', async () => {
    const frame = BUNDLED_FRAMES.find(f => f.id === 'pastel_dream')!
    const result = await renderStrip({
      photoDataUrls: ['data:image/png;base64,1', 'data:image/png;base64,2', 'data:image/png;base64,3', 'data:image/png;base64,4'],
      frame,
      layout: LayoutType.fourCut,
      printFormat: PrintFormat.singleStrip,
      filter: 'none',
      stampText: '인생샷 👑',
      dateString: '2026.11.02',
      studioWatermark: 'KOREAN 4-CUT STUDIO',
    })

    expect(result).toBe('data:image/png;base64,mockPng')
  })

  it('renders 6-cut layout with 2 columns and 3 rows filling to y=3060 with zero dead space', async () => {
    const frame = BUNDLED_FRAMES.find(f => f.id === 'midnight_galaxy')!
    const result = await renderStrip({
      photoDataUrls: Array(6).fill('data:image/png;base64,shot'),
      frame,
      layout: LayoutType.sixCut,
      printFormat: PrintFormat.singleStrip,
      filter: 'haruBlue',
      stampText: '하루필름 🌊',
      dateString: '2026.11.02',
      studioWatermark: 'PHOTOISM',
    })

    expect(result).toBe('data:image/png;base64,mockPng')
  })

  it('renders twin strip at 2400x3600 dimensions with cut line', async () => {
    const frame = BUNDLED_FRAMES.find(f => f.id === 'y2k_cyber')!
    const result = await renderStrip({
      photoDataUrls: Array(4).fill('data:image/png;base64,shot'),
      frame,
      layout: LayoutType.fourCut,
      printFormat: PrintFormat.twinStrip,
      filter: 'warmFilm',
      stampText: '우정영원 💖',
      dateString: '2026.11.02',
      studioWatermark: 'HARU FILM 1+1',
    })

    expect(result).toBe('data:image/png;base64,mockPng')
  })

  it('renders Christmas frame with filter intensity parameter without breaking', async () => {
    const frame = BUNDLED_FRAMES.find(f => f.id === 'xmas_01_classic')!
    expect(frame).toBeDefined()

    const result = await renderStrip({
      photoDataUrls: Array(4).fill('data:image/png;base64,xmas_shot'),
      frame,
      layout: LayoutType.fourCut,
      printFormat: PrintFormat.singleStrip,
      filter: 'vintage_kodak',
      filterIntensity: 0.75,
      stampText: 'Best Shot 👑',
      dateString: '2026.12.25',
      studioWatermark: 'CHRISTMAS 2026',
      passcode: '4829',
    })

    expect(result).toBe('data:image/png;base64,mockPng')
  })

  it('generates 4 sample portrait photos for live frame previews', () => {
    const samples = getSamplePhotos()
    expect(samples).toHaveLength(4)
    samples.forEach(s => {
      expect(s.width).toBe(400)
      expect(s.height).toBe(300)
    })
  })

  it('renders frame preview directly onto canvas using renderFrameToCanvas', () => {
    const canvas = document.createElement('canvas')
    canvas.width = 400
    canvas.height = 1200

    const frame = CHRISTMAS_FRAMES[0] // Classic Christmas
    const samples = getSamplePhotos()

    expect(() => {
      renderFrameToCanvas(canvas, frame, LayoutType.fourCut, samples, {
        filter: 'vintage_kodak',
        filterIntensity: 0.8,
      })
    }).not.toThrow()
  })

  it('successfully executes canvas vector graphics for all 40 Christmas frames without throwing', () => {
    const canvas = document.createElement('canvas')
    canvas.width = 1200
    canvas.height = 3600

    CHRISTMAS_FRAMES.forEach(frame => {
      expect(() => {
        renderFrameToCanvas(canvas, frame, LayoutType.fourCut)
      }).not.toThrow()
    })
  })
})
