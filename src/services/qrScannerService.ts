// Lightweight in-browser QR code scanner using native Web BarcodeDetector API

export interface ScanResult {
  raw: string
  type: 'video' | 'strip' | 'passcode' | 'token'
  value: string
}

declare global {
  interface Window {
    BarcodeDetector?: {
      new (options?: { formats: string[] }): BarcodeDetectorInterface
      getSupportedFormats(): Promise<string[]>
    }
  }
}

interface BarcodeDetectorInterface {
  detect(image: ImageBitmapSource): Promise<Array<{ rawValue: string }>>
}

export class QrScannerService {
  private static detector: BarcodeDetectorInterface | null = null
  private static isSupportedChecked = false
  private static supported = false

  static async isSupported(): Promise<boolean> {
    if (this.isSupportedChecked) return this.supported
    if (typeof window === 'undefined' || !window.BarcodeDetector) {
      this.supported = false
      this.isSupportedChecked = true
      return false
    }

    try {
      const formats = await window.BarcodeDetector.getSupportedFormats()
      this.supported = formats.includes('qr_code')
    } catch {
      this.supported = false
    }

    this.isSupportedChecked = true
    return this.supported
  }

  private static async getDetector(): Promise<BarcodeDetectorInterface | null> {
    if (this.detector) return this.detector
    const supported = await this.isSupported()
    if (!supported || !window.BarcodeDetector) return null

    try {
      this.detector = new window.BarcodeDetector({ formats: ['qr_code'] })
      return this.detector
    } catch {
      return null
    }
  }

  // Scan live video frame from camera
  static async scanVideoFrame(video: HTMLVideoElement): Promise<ScanResult | null> {
    if (!video || video.readyState < 2) return null

    const detector = await this.getDetector()
    if (!detector) return null

    try {
      const barcodes = await detector.detect(video)
      if (barcodes && barcodes.length > 0) {
        const raw = barcodes[0].rawValue
        return this.parseScannedText(raw)
      }
    } catch {
      // Frame detect skipped/failed
    }

    return null
  }

  // Scan image file uploaded by user (e.g. photo of the printed strip)
  static async scanImageFile(file: File): Promise<ScanResult | null> {
    if (!file) return null

    const detector = await this.getDetector()
    if (!detector) {
      throw new Error('BarcodeDetector is not supported in this browser environment')
    }

    try {
      let imageBitmap: ImageBitmap | null = null
      if (typeof createImageBitmap === 'function') {
        imageBitmap = await createImageBitmap(file)
      } else {
        // Fallback for environments lacking createImageBitmap
        const img = await this.loadImageElement(file)
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth || img.width
        canvas.height = img.naturalHeight || img.height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0)
        const barcodes = await detector.detect(canvas)
        if (barcodes && barcodes.length > 0) {
          return this.parseScannedText(barcodes[0].rawValue)
        }
        return null
      }

      if (imageBitmap) {
        const barcodes = await detector.detect(imageBitmap)
        imageBitmap.close()
        if (barcodes && barcodes.length > 0) {
          return this.parseScannedText(barcodes[0].rawValue)
        }
      }
    } catch (err) {
      console.warn('Failed to detect QR from image file:', err)
    }

    return null
  }

  private static loadImageElement(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(url)
        resolve(img)
      }
      img.onerror = e => {
        URL.revokeObjectURL(url)
        reject(e)
      }
      img.src = url
    })
  }

  // Parse raw QR code string or URL into structured lookup target
  static parseScannedText(rawText: string): ScanResult {
    const raw = rawText.trim()

    // 1. Check if contains video token (?v=TOKEN)
    if (raw.includes('?v=')) {
      const token = raw.split('?v=')[1].split('&')[0].split('#')[0]
      return { raw, type: 'video', value: token }
    }

    // 2. Check if contains session parameter (?s=SESSION)
    if (raw.includes('?s=')) {
      const sessionId = raw.split('?s=')[1].split('&')[0].split('#')[0]
      return { raw, type: 'strip', value: sessionId }
    }

    // 3. Check for 4-digit passcode pattern (e.g. CODE: 4829 or 4829)
    const codeMatch = raw.match(/(?:CODE:\s*)?(\d{4})/i)
    if (codeMatch && (raw.length === 4 || raw.toUpperCase().includes('CODE:'))) {
      return { raw, type: 'passcode', value: codeMatch[1] }
    }

    // 4. Default to raw token/identifier
    return { raw, type: 'token', value: raw }
  }
}
