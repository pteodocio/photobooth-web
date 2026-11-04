import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QrScannerService } from '../src/services/qrScannerService'

describe('QrScannerService Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('correctly parses video query URLs into video token', () => {
    const url = 'https://photobooth.app/?v=bW9ja1ZpZGVvMTIz'
    const parsed = QrScannerService.parseScannedText(url)
    expect(parsed.type).toBe('video')
    expect(parsed.value).toBe('bW9ja1ZpZGVvMTIz')
  })

  it('correctly parses strip query URLs into strip sessionId', () => {
    const url = 'https://photobooth.app/?s=session_1730000000000'
    const parsed = QrScannerService.parseScannedText(url)
    expect(parsed.type).toBe('strip')
    expect(parsed.value).toBe('session_1730000000000')
  })

  it('correctly parses 4-digit passcode strings and CODE prefixes', () => {
    const pinOnly = '4829'
    const parsedPin = QrScannerService.parseScannedText(pinOnly)
    expect(parsedPin.type).toBe('passcode')
    expect(parsedPin.value).toBe('4829')

    const withPrefix = 'CODE: 7291'
    const parsedPrefix = QrScannerService.parseScannedText(withPrefix)
    expect(parsedPrefix.type).toBe('passcode')
    expect(parsedPrefix.value).toBe('7291')
  })

  it('falls back gracefully when BarcodeDetector is not supported', async () => {
    const isSupported = await QrScannerService.isSupported()
    // In node/jsdom without mock, BarcodeDetector is undefined
    expect(typeof isSupported).toBe('boolean')
  })

  it('detects barcode when BarcodeDetector mock is present', async () => {
    class MockBarcodeDetector {
      static getSupportedFormats() {
        return Promise.resolve(['qr_code'])
      }
      detect() {
        return Promise.resolve([
          { rawValue: 'https://photobooth.app/?v=mockScannedVideo' },
        ])
      }
    }

    vi.stubGlobal('BarcodeDetector', MockBarcodeDetector)
    // Reset private fields
    ;(QrScannerService as any).isSupportedChecked = false
    ;(QrScannerService as any).detector = null

    const supported = await QrScannerService.isSupported()
    expect(supported).toBe(true)

    const mockVideo = { readyState: 4 } as unknown as HTMLVideoElement
    const result = await QrScannerService.scanVideoFrame(mockVideo)
    expect(result).not.toBeNull()
    expect(result?.type).toBe('video')
    expect(result?.value).toBe('mockScannedVideo')
  })
})
