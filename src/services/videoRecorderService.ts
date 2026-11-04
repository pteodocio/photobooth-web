/**
 * VideoRecorderService: Captures short behind-the-scenes video clips of users
 * posing during the photobooth countdown shots.
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
   * Stops recording and returns the final video Blob.
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

  /**
   * Returns the most recently recorded video blob.
   */
  static getRecordedBlob(): Blob | null {
    return this.recordedBlob
  }

  /**
   * Manually sets the recorded blob (useful for fallbacks or testing).
   */
  static setRecordedBlob(blob: Blob | null): void {
    this.recordedBlob = blob
  }

  /**
   * Generates a lightweight animated slideshow video from captured photo data URLs
   * as a fallback when webcam MediaStream recording is unavailable.
   */
  static async createVideoFromPhotos(photoDataUrls: string[]): Promise<Blob | null> {
    if (typeof document === 'undefined' || typeof MediaRecorder === 'undefined' || photoDataUrls.length === 0) {
      return null
    }

    try {
      const canvas = document.createElement('canvas')
      canvas.width = 640
      canvas.height = 480
      const ctx = canvas.getContext('2d')
      if (!ctx || typeof canvas.captureStream !== 'function') return null

      const stream = canvas.captureStream(20)
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' })
      const chunks: Blob[] = []

      recorder.ondataavailable = e => {
        if (e.data && e.data.size > 0) chunks.push(e.data)
      }

      // Load images
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

      // Render each photo for 600ms
      for (let i = 0; i < images.length * 2; i++) {
        const img = images[i % images.length]
        if (img.width > 0) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        }
        await new Promise(r => setTimeout(r, 600))
      }

      return new Promise(resolve => {
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' })
          resolve(blob)
        }
        recorder.stop()
      })
    } catch (e) {
      console.warn('Fallback video creation failed:', e)
      return null
    }
  }
}
