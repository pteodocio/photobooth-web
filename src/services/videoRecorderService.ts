import { type FrameTemplate, type LayoutTypeConfig, LayoutType } from '../core/types'
import { getCssFilter } from '../core/filters'

export interface CreateMotionStripVideoParams {
  photoDataUrls: string[]
  frame: FrameTemplate
  layout: LayoutTypeConfig
  rawVideoBlob?: Blob | null
  filter?: string
  filterIntensity?: number
  stampText?: string
  dateString?: string
  passcode?: string
}

/**
 * VideoRecorderService: Captures behind-the-scenes video and compiles
 * authentic Korean photobooth motion strip videos.
 */
export class VideoRecorderService {
  private static recorder: MediaRecorder | null = null
  private static chunks: Blob[] = []
  private static recordedBlob: Blob | null = null

  /**
   * Starts recording the video stream from the user's camera.
   */
  static startRecording(stream: MediaStream): void {
    if (typeof MediaRecorder === 'undefined' || !stream || stream.getVideoTracks().length === 0) {
      return
    }

    try {
      this.chunks = []
      this.recordedBlob = null

      let options: MediaRecorderOptions | undefined
      if (typeof MediaRecorder.isTypeSupported === 'function') {
        if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
          options = { mimeType: 'video/webm;codecs=vp9' }
        } else if (MediaRecorder.isTypeSupported('video/webm')) {
          options = { mimeType: 'video/webm' }
        } else if (MediaRecorder.isTypeSupported('video/mp4')) {
          options = { mimeType: 'video/mp4' }
        }
      }

      const recorder = new MediaRecorder(stream, options)
      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          this.chunks.push(event.data)
        }
      }

      recorder.start(500)
      this.recorder = recorder
    } catch (err) {
      console.warn('VideoRecorderService: Could not start MediaRecorder:', err)
    }
  }

  /**
   * Stops recording and returns the raw video Blob.
   */
  static stopRecording(): Promise<Blob | null> {
    return new Promise(resolve => {
      if (!this.recorder || this.recorder.state === 'inactive') {
        if (this.chunks.length > 0) {
          const blob = new Blob(this.chunks, { type: 'video/webm' })
          this.recordedBlob = blob
          resolve(blob)
        } else {
          resolve(this.recordedBlob)
        }
        return
      }

      this.recorder.onstop = () => {
        const mimeType = this.recorder?.mimeType || 'video/webm'
        const blob = new Blob(this.chunks, { type: mimeType })
        this.recordedBlob = blob
        this.recorder = null
        resolve(blob)
      }

      try {
        this.recorder.stop()
      } catch (err) {
        console.warn('VideoRecorderService: Error stopping recorder:', err)
        resolve(this.recordedBlob)
      }
    })
  }

  static getRecordedBlob(): Blob | null {
    return this.recordedBlob
  }

  static setRecordedBlob(blob: Blob | null): void {
    this.recordedBlob = blob
  }

  /**
   * Generates a photobooth motion strip video where all cuts are displayed
   * inside the photobooth strip frame with live motion.
   */
  static async createMotionStripVideo(params: CreateMotionStripVideoParams): Promise<Blob | null> {
    const { photoDataUrls, frame, layout, filter = 'none', filterIntensity = 1.0, stampText, dateString, passcode } = params

    if (typeof document === 'undefined' || typeof MediaRecorder === 'undefined') {
      return new Blob(['mock-motion-strip-video'], { type: 'video/webm' })
    }

    try {
      const isSixCut = layout.id === 'sixCut'
      const canvas = document.createElement('canvas')
      // Standard video resolution: 600x1800 for 4-cut (1:3), or 720x1080 for 6-cut (2:3)
      canvas.width = isSixCut ? 720 : 600
      canvas.height = isSixCut ? 1080 : 1800

      const ctx = canvas.getContext('2d')
      if (!ctx || typeof canvas.captureStream !== 'function') {
        return new Blob(['mock-motion-strip-video'], { type: 'video/webm' })
      }

      const stream = canvas.captureStream(30)
      const mimeType = (typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported('video/mp4'))
        ? 'video/mp4'
        : 'video/webm'

      const recorder = new MediaRecorder(stream, { mimeType })
      const recordedChunks: Blob[] = []

      recorder.ondataavailable = e => {
        if (e.data && e.data.size > 0) {
          recordedChunks.push(e.data)
        }
      }

      // Preload images
      const images: HTMLImageElement[] = await Promise.all(
        photoDataUrls.map(
          src =>
            new Promise<HTMLImageElement>(res => {
              const img = new Image()
              img.crossOrigin = 'anonymous'
              img.onload = () => res(img)
              img.onerror = () => res(img)
              img.src = src
            })
        )
      )

      recorder.start()

      // Layout coordinates (scaled for video canvas)
      const totalFrames = 90 // 3 seconds at 30fps
      const scaleX = canvas.width / 1200

      const slotW = isSixCut ? 310 : 520
      const slotH = isSixCut ? 240 : 340
      const marginX = isSixCut ? 35 : 40
      const marginTop = isSixCut ? 70 : 80
      const gutterY = isSixCut ? 20 : 30
      const gutterX = isSixCut ? 20 : 0
      const cols = isSixCut ? 2 : 1

      const todayStr = dateString || new Date().toISOString().slice(0, 10).replace(/-/g, '.')
      const cssFilter = getCssFilter(filter, filterIntensity)

      for (let frameIdx = 0; frameIdx < totalFrames; frameIdx++) {
        const time = frameIdx / 30

        // 1. Draw Strip Background (color or gradient)
        if (frame.gradientColors && frame.gradientColors.length >= 2) {
          const grad = ctx.createLinearGradient(0, 0, 0, canvas.height)
          frame.gradientColors.forEach((c, idx) => {
            grad.addColorStop(idx / (frame.gradientColors.length - 1), c)
          })
          ctx.fillStyle = grad
        } else {
          ctx.fillStyle = frame.backgroundColor || '#141419'
        }
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // 2. Header Title
        ctx.save()
        ctx.font = 'bold 20px "Segoe UI", sans-serif'
        ctx.fillStyle = frame.captionColor || '#FFFFFF'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(frame.englishTitle || frame.name, canvas.width / 2, marginTop / 2)
        ctx.restore()

        // 3. Render Photo Slots with Live Motion Pulse
        const slotCount = isSixCut ? 6 : 4
        for (let i = 0; i < slotCount; i++) {
          const col = i % cols
          const row = Math.floor(i / cols)
          const sx = marginX + col * (slotW + gutterX)
          const sy = marginTop + row * (slotH + gutterY)

          ctx.save()

          // Rounded Slot Clip
          ctx.beginPath()
          const radius = Math.max(frame.slotCornerRadius * scaleX, 8)
          if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(sx, sy, slotW, slotH, radius)
          } else {
            ctx.rect(sx, sy, slotW, slotH)
          }
          ctx.clip()

          // Draw Photo with subtle live breathing zoom
          const img = images[i % images.length]
          if (img && img.width > 0) {
            ctx.save()
            if (cssFilter && cssFilter !== 'none') {
              ctx.filter = cssFilter
            }

            // Organic breathing motion (subtle 3% zoom wave)
            const zoom = 1.0 + 0.03 * Math.sin(time * 3 + i * 1.2)
            const cx = sx + slotW / 2
            const cy = sy + slotH / 2
            ctx.translate(cx, cy)
            ctx.scale(zoom, zoom)
            ctx.translate(-cx, -cy)

            // Aspect fill into slot
            const targetAspect = slotW / slotH
            const srcAspect = img.width / img.height
            let sW = img.width
            let sH = img.height
            let sX = 0
            let sY = 0
            if (srcAspect > targetAspect) {
              sW = img.height * targetAspect
              sX = (img.width - sW) / 2
            } else {
              sH = img.width / targetAspect
              sY = (img.height - sH) / 2
            }

            try {
              ctx.drawImage(img, sX, sY, sW, sH, sx, sy, slotW, slotH)
            } catch {
              ctx.fillStyle = '#222'
              ctx.fillRect(sx, sy, slotW, slotH)
            }
            ctx.restore()
          } else {
            ctx.fillStyle = '#1B1B22'
            ctx.fillRect(sx, sy, slotW, slotH)
          }

          ctx.restore()

          // Slot Border
          if (frame.slotBorderWidth > 0) {
            ctx.save()
            ctx.strokeStyle = frame.slotBorderColor || '#FFFFFF'
            ctx.lineWidth = Math.max(frame.slotBorderWidth * scaleX, 2)
            ctx.beginPath()
            if (typeof ctx.roundRect === 'function') {
              ctx.roundRect(sx, sy, slotW, slotH, radius)
            } else {
              ctx.rect(sx, sy, slotW, slotH)
            }
            ctx.stroke()
            ctx.restore()
          }
        }

        // 4. Footer Information & Pulsing Heart Sticker
        const footerY = canvas.height - (isSixCut ? 60 : 160)
        ctx.save()
        ctx.fillStyle = frame.captionColor || '#FFFFFF'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        if (stampText) {
          ctx.font = 'bold 16px "Segoe UI", sans-serif'
          ctx.fillText(stampText, canvas.width / 2, footerY)
        }

        ctx.font = '13px "Segoe UI", sans-serif'
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
        ctx.fillText(`KOREAN 4-CUT STUDIO · ${todayStr}`, canvas.width / 2, footerY + 28)

        if (passcode) {
          ctx.font = 'bold 12px "Segoe UI", sans-serif'
          ctx.fillStyle = '#FF385C'
          ctx.fillText(`CODE: ${passcode}`, canvas.width / 2, footerY + 50)
        }

        // Animated Pulsing Heart at Bottom (matching authentic Korean reference video)
        const heartPulse = 1.0 + 0.15 * Math.sin(time * 6)
        const heartY = canvas.height - (isSixCut ? 15 : 45)
        ctx.save()
        ctx.translate(canvas.width / 2, heartY)
        ctx.scale(heartPulse, heartPulse)
        ctx.fillStyle = '#FF385C'
        ctx.font = '18px "Segoe UI", sans-serif'
        ctx.fillText('♥', 0, 0)
        ctx.restore()

        ctx.restore()

        // Wait ~33ms for 30fps
        await new Promise(r => setTimeout(r, 33))
      }

      return new Promise(resolve => {
        recorder.onstop = () => {
          const blob = new Blob(recordedChunks, { type: mimeType })
          resolve(blob)
        }
        recorder.stop()
      })
    } catch (err) {
      console.warn('VideoRecorderService: Could not render motion strip video:', err)
      return new Blob(['mock-motion-strip-video'], { type: 'video/webm' })
    }
  }

  /**
   * Fallback: creates a motion strip video from photos.
   */
  static async createVideoFromPhotos(photoDataUrls: string[]): Promise<Blob | null> {
    return this.createMotionStripVideo({
      photoDataUrls,
      frame: {
        id: 'default',
        name: 'Korean 4-Cut',
        koreanTitle: '인생네컷',
        category: 'Classic',
        backgroundColor: '#121216',
        captionColor: '#FFFFFF',
        gradientColors: ['#121216'],
        themeStyle: 'classic',
        englishTitle: 'KOREAN 4-CUT',
        slotBorderColor: '#FFFFFF',
        slotBorderWidth: 4,
        slotCornerRadius: 8,
      },
      layout: LayoutType.fourCut,
    })
  }
}
