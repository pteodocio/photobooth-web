import QRCode from 'qrcode'
import { AppConstants } from '../core/constants'
import type { CompositeJob, FrameTemplate, PhotoFilter } from '../core/types'

// Helper to asynchronously load image from dataUrl/URL
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    if (typeof Image === 'undefined') {
      // In non-browser test environment
      resolve({ width: 800, height: 600 } as unknown as HTMLImageElement)
      return
    }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => {
      // Create a fallback 1x1 canvas image if loading fails
      const fallback = document.createElement('canvas')
      fallback.width = 800
      fallback.height = 600
      const ctx = fallback.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#222'
        ctx.fillRect(0, 0, 800, 600)
      }
      const fallbackImg = new Image()
      fallbackImg.src = fallback.toDataURL()
      fallbackImg.onload = () => resolve(fallbackImg)
    }
    img.src = src
  })
}

export async function renderStrip(job: CompositeJob): Promise<string> {
  const canvasWidth = AppConstants.stripWidth
  const canvasHeight = AppConstants.stripHeight

  const canvas = document.createElement('canvas')
  canvas.width = canvasWidth
  canvas.height = canvasHeight
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Canvas 2D context not available')
  }

  // 1. Draw Background
  if (job.frame.gradientColors && job.frame.gradientColors.length >= 2) {
    const grad = ctx.createLinearGradient(0, 0, 0, canvasHeight)
    job.frame.gradientColors.forEach((color, idx) => {
      grad.addColorStop(idx / (job.frame.gradientColors.length - 1), color)
    })
    ctx.fillStyle = grad
  } else {
    ctx.fillStyle = job.frame.backgroundColor
  }
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  // 2. Draw Vector Motifs & Themed Background Accents
  drawThemeBackgroundDecors(ctx, job.frame, canvasWidth, canvasHeight)

  // 3. Draw Photo Slots
  const loadedPhotos = await Promise.all(job.photoDataUrls.map(url => loadImage(url)))

  if (job.layout.id === 'fourCut') {
    const slotW = AppConstants.fourCutSlotWidth
    const slotH = AppConstants.fourCutSlotHeight
    const marginX = AppConstants.fourCutMarginX
    const marginTop = AppConstants.fourCutMarginTop
    const gutter = AppConstants.fourCutGutter

    for (let i = 0; i < 4 && i < loadedPhotos.length; i++) {
      const slotY = marginTop + i * (slotH + gutter)
      drawPhotoSlot(ctx, loadedPhotos[i], marginX, slotY, slotW, slotH, job.frame, job.filter)
    }
  } else if (job.layout.id === 'sixCut') {
    const cols = 2
    const slotW = AppConstants.sixCutSlotWidth
    const slotH = AppConstants.sixCutSlotHeight
    const marginX = AppConstants.sixCutMarginX
    const marginTop = AppConstants.sixCutMarginTop
    const gutterX = AppConstants.sixCutGutterX
    const gutterY = AppConstants.sixCutGutterY

    for (let i = 0; i < 6 && i < loadedPhotos.length; i++) {
      const col = i % cols
      const row = Math.floor(i / cols)
      const slotX = marginX + col * (slotW + gutterX)
      const slotY = marginTop + row * (slotH + gutterY)
      drawPhotoSlot(ctx, loadedPhotos[i], slotX, slotY, slotW, slotH, job.frame, job.filter)
    }
  }

  // 4. Header English Title Banner
  if (job.frame.englishTitle) {
    ctx.save()
    ctx.font = 'bold 36px "Segoe UI", sans-serif'
    ctx.fillStyle = job.frame.captionColor
    ctx.textAlign = 'center'
    ctx.fillText(job.frame.englishTitle, canvasWidth / 2, 60)
    ctx.restore()
  }

  // 5. Korean Stamp Badge
  if (job.stampText) {
    drawStampBadge(ctx, job.stampText, 100, 3180, job.frame.captionColor)
  }

  // 6. Studio Watermark & Date Stamp
  ctx.save()
  ctx.fillStyle = job.frame.captionColor
  ctx.textAlign = 'center'

  if (job.studioWatermark) {
    ctx.font = '600 24px "Segoe UI", sans-serif'
    ctx.fillText(job.studioWatermark, canvasWidth / 2, 3240)
  }

  if (job.dateString) {
    ctx.font = 'bold 36px "Segoe UI", sans-serif'
    ctx.fillText(job.dateString, canvasWidth / 2, 3320)
  }
  ctx.restore()

  // 7. Scannable White QR Sticker Card
  const qrTarget = job.qrData || `https://photobooth.app/strip?s=${Date.now()}`
  await drawQrCodeBadge(ctx, qrTarget, 980, 3250, 140)

  // 8. Twin Strip Assembly (if format is twinStrip)
  if (job.printFormat.id === 'twinStrip') {
    const twinCanvas = document.createElement('canvas')
    twinCanvas.width = 2400
    twinCanvas.height = 3600
    const twinCtx = twinCanvas.getContext('2d')

    if (twinCtx) {
      twinCtx.fillStyle = job.frame.backgroundColor
      twinCtx.fillRect(0, 0, 2400, 3600)

      // Left strip
      twinCtx.drawImage(canvas, 0, 0)
      // Right strip
      twinCtx.drawImage(canvas, 1200, 0)

      // Vertical dashed cut line down the center
      twinCtx.save()
      twinCtx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
      twinCtx.lineWidth = 3
      twinCtx.setLineDash([20, 15])
      twinCtx.beginPath()
      twinCtx.moveTo(1200, 0)
      twinCtx.lineTo(1200, 3600)
      twinCtx.stroke()
      twinCtx.restore()

      return twinCanvas.toDataURL('image/png')
    }
  }

  return canvas.toDataURL('image/png')
}

function drawPhotoSlot(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  frame: FrameTemplate,
  filter: PhotoFilter
) {
  ctx.save()

  // Apply Rounded Corners if any
  if (frame.slotCornerRadius > 0 && typeof ctx.roundRect === 'function') {
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, frame.slotCornerRadius)
    ctx.clip()
  } else {
    ctx.beginPath()
    ctx.rect(x, y, w, h)
    ctx.clip()
  }

  // Filter effect
  if (filter === 'mono') {
    ctx.filter = 'grayscale(100%) contrast(110%)'
  } else if (filter === 'haruBlue') {
    ctx.filter = 'contrast(105%) brightness(105%) saturate(85%) hue-rotate(5deg)'
  } else if (filter === 'warmFilm') {
    ctx.filter = 'sepia(28%) contrast(98%) brightness(102%) saturate(110%)'
  }

  // Aspect-fill photo into slot (4:3 source into slot)
  const targetAspect = w / h
  const srcW = img.width || 800
  const srcH = img.height || 600
  const srcAspect = srcW / srcH

  let cropW = srcW
  let cropH = srcH
  let cropX = 0
  let cropY = 0

  if (srcAspect > targetAspect) {
    cropW = srcH * targetAspect
    cropX = (srcW - cropW) / 2
  } else {
    cropH = srcW / targetAspect
    cropY = (srcH - cropH) / 2
  }

  try {
    ctx.drawImage(img, cropX, cropY, cropW, cropH, x, y, w, h)
  } catch {
    ctx.fillStyle = '#333'
    ctx.fillRect(x, y, w, h)
  }

  ctx.restore()

  // Draw Slot Border
  if (frame.slotBorderWidth > 0) {
    ctx.save()
    ctx.strokeStyle = frame.slotBorderColor || '#FFFFFF'
    ctx.lineWidth = frame.slotBorderWidth
    ctx.beginPath()
    if (frame.slotCornerRadius > 0 && typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, w, h, frame.slotCornerRadius)
    } else {
      ctx.rect(x, y, w, h)
    }
    ctx.stroke()
    ctx.restore()
  }
}

function drawStampBadge(
  ctx: CanvasRenderingContext2D,
  stampText: string,
  x: number,
  y: number,
  color: string
) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = 3
  ctx.beginPath()
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, 320, 60, 12)
  } else {
    ctx.rect(x, y, 320, 60)
  }
  ctx.stroke()

  ctx.font = 'bold 24px "Pretendard", "Segoe UI", sans-serif'
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(stampText, x + 160, y + 30)
  ctx.restore()
}

async function drawQrCodeBadge(
  ctx: CanvasRenderingContext2D,
  data: string,
  startX: number,
  startY: number,
  size: number
) {
  try {
    // Generate QR code as DataURL
    const qrDataUrl = await QRCode.toDataURL(data, {
      margin: 1,
      color: {
        dark: '#111111',
        light: '#FFFFFF',
      },
    })
    const qrImg = await loadImage(qrDataUrl)

    // Solid white quiet-zone background sticker
    ctx.save()
    ctx.fillStyle = '#FFFFFF'
    if (typeof ctx.roundRect === 'function') {
      ctx.beginPath()
      ctx.roundRect(startX - 6, startY - 6, size + 12, size + 12, 12)
      ctx.fill()
    } else {
      ctx.fillRect(startX - 6, startY - 6, size + 12, size + 12)
    }

    ctx.drawImage(qrImg, startX, startY, size, size)
    ctx.restore()
  } catch {
    // Fallback card
    ctx.save()
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(startX, startY, size, size)
    ctx.restore()
  }
}

function drawThemeBackgroundDecors(
  ctx: CanvasRenderingContext2D,
  frame: FrameTemplate,
  width: number,
  height: number
) {
  ctx.save()
  const style = frame.themeStyle

  if (style === 'pastelDream') {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
    // Soft sparkle stars
    drawSparkle(ctx, 60, 80, 16)
    drawSparkle(ctx, width - 70, 90, 20)
    drawSparkle(ctx, 60, height - 160, 18)
    drawSparkle(ctx, width - 80, height - 120, 24)
  } else if (style === 'cherryBlossom') {
    ctx.fillStyle = 'rgba(255, 182, 193, 0.4)'
    drawSakuraPetal(ctx, 50, 90, 14)
    drawSakuraPetal(ctx, width - 60, 80, 16)
    drawSakuraPetal(ctx, 40, height - 200, 18)
  } else if (style === 'y2kCyber') {
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)'
    ctx.lineWidth = 2
    ctx.strokeRect(20, 20, width - 40, height - 40)
    drawPixelStar(ctx, 60, 70, '#00F0FF')
    drawPixelStar(ctx, width - 60, 70, '#FF007F')
  } else if (style === 'midnightGalaxy') {
    ctx.fillStyle = '#FFFFFF'
    // Constellation stars
    drawStarDot(ctx, 45, 90, 4)
    drawStarDot(ctx, 95, 110, 3)
    drawStarDot(ctx, width - 50, 85, 5)
    drawStarDot(ctx, width - 90, 130, 3)
  }
  ctx.restore()
}

function drawSparkle(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.beginPath()
  ctx.arc(cx, cy, size * 0.4, 0, Math.PI * 2)
  ctx.fill()
}

function drawSakuraPetal(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.fill()
}

function drawPixelStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string) {
  ctx.fillStyle = color
  ctx.fillRect(cx - 4, cy - 12, 8, 24)
  ctx.fillRect(cx - 12, cy - 4, 24, 8)
}

function drawStarDot(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()
}
