export class CameraService {
  private static currentStream: MediaStream | null = null

  static async startCamera(
    videoElement: HTMLVideoElement,
    facingMode: 'user' | 'environment' = 'user'
  ): Promise<MediaStream> {
    this.stopCamera()

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera MediaDevices API is not supported in this browser')
    }

    const constraints: MediaStreamConstraints = {
      video: {
        facingMode,
        width: { ideal: 1920 },
        height: { ideal: 1440 },
        aspectRatio: { ideal: 4 / 3 },
      },
      audio: false,
    }

    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    this.currentStream = stream
    videoElement.srcObject = stream
    await videoElement.play()

    return stream
  }

  static stopCamera(): void {
    if (this.currentStream) {
      this.currentStream.getTracks().forEach(track => track.stop())
      this.currentStream = null
    }
  }

  static captureFrame(videoElement: HTMLVideoElement): string {
    const canvas = document.createElement('canvas')
    const videoW = videoElement.videoWidth || 800
    const videoH = videoElement.videoHeight || 600

    // Strict 4:3 Korean Viewfinder crop
    const targetAspect = 4 / 3
    const actualAspect = videoW / videoH

    let cropW = videoW
    let cropH = videoH
    let cropX = 0
    let cropY = 0

    if (actualAspect > targetAspect) {
      cropW = videoH * targetAspect
      cropX = (videoW - cropW) / 2
    } else {
      cropH = videoW / targetAspect
      cropY = (videoH - cropH) / 2
    }

    canvas.width = cropW
    canvas.height = cropH
    const ctx = canvas.getContext('2d')
    if (ctx) {
      // Mirror image horizontally for authentic mirror-booth experience
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
      ctx.drawImage(videoElement, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height)
    }

    return canvas.toDataURL('image/jpeg', 0.95)
  }
}
