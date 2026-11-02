import QRCode from 'qrcode'
import { AppConstants } from '../core/constants'
import type { CompositeJob, FrameTemplate, PhotoFilter } from '../core/types'
import { getCssFilter } from '../core/filters'

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

/**
 * 300 DPI High-Resolution Korean Photo Strip Compositor
 */
export async function renderStrip(job: CompositeJob): Promise<string> {
  const canvasWidth = job.printFormat.canvasWidth
  const canvasHeight = job.printFormat.canvasHeight

  const canvas = document.createElement('canvas')
  canvas.width = canvasWidth
  canvas.height = canvasHeight
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Canvas 2D context is not available')
  }

  // 1. Draw Frame Background
  if (job.frame.gradientColors && job.frame.gradientColors.length >= 2) {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight)
    const step = 1 / (job.frame.gradientColors.length - 1)
    job.frame.gradientColors.forEach((color, idx) => {
      gradient.addColorStop(idx * step, color)
    })
    ctx.fillStyle = gradient
  } else {
    ctx.fillStyle = job.frame.backgroundColor
  }
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  // 2. Draw Theme Background Decors & Christmas Vectors
  drawThemeBackgroundDecors(ctx, job.frame, canvasWidth, canvasHeight)

  // 3. Load All Photos in Parallel
  const loadedPhotos = await Promise.all(job.photoDataUrls.map(url => loadImage(url)))
  const intensity = job.filterIntensity ?? 1.0

  if (job.layout.id === 'fourCut') {
    const slotW = AppConstants.fourCutSlotWidth
    const slotH = AppConstants.fourCutSlotHeight
    const marginX = AppConstants.fourCutMarginX
    const marginTop = AppConstants.fourCutMarginTop
    const gutter = AppConstants.fourCutGutter

    for (let i = 0; i < 4 && i < loadedPhotos.length; i++) {
      const slotY = marginTop + i * (slotH + gutter)
      drawPhotoSlot(ctx, loadedPhotos[i], marginX, slotY, slotW, slotH, job.frame, job.filter, intensity)
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
      drawPhotoSlot(ctx, loadedPhotos[i], slotX, slotY, slotW, slotH, job.frame, job.filter, intensity)
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

  // 5. Stamp Badge
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
  filter: PhotoFilter,
  filterIntensity: number = 1.0
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

  // Universal Filter effect with intensity
  const cssFilter = getCssFilter(filter, filterIntensity)
  if (cssFilter && cssFilter !== 'none') {
    ctx.filter = cssFilter
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

  ctx.font = 'bold 24px "Outfit", "Segoe UI", sans-serif'
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
    const qrDataUrl = await QRCode.toDataURL(data, {
      margin: 1,
      color: {
        dark: '#111111',
        light: '#FFFFFF',
      },
    })
    const qrImg = await loadImage(qrDataUrl)

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

  // Original Styles
  if (style === 'pastelDream') {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
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
    drawStarDot(ctx, 45, 90, 4)
    drawStarDot(ctx, 95, 110, 3)
    drawStarDot(ctx, width - 50, 85, 5)
    drawStarDot(ctx, width - 90, 130, 3)
  }

  // --- Christmas Vector Themes ---
  else if (style === 'xmas_classic') {
    drawHollyBerries(ctx, 50, 70, 18)
    drawHollyBerries(ctx, width - 50, 70, 18)
    drawStarSparkle(ctx, 55, height - 140, 14, '#FACC15')
    drawStarSparkle(ctx, width - 55, height - 140, 14, '#FACC15')
  } else if (style === 'xmas_wonderland') {
    drawSnowflake(ctx, 50, 80, 22, '#FFFFFF')
    drawSnowflake(ctx, width - 55, 95, 26, '#FFFFFF')
    drawSnowflake(ctx, 45, height - 150, 18, '#FFFFFF')
    drawChristmasTree(ctx, width - 60, height - 130, 50, '#10B981')
  } else if (style === 'xmas_santas_workshop') {
    drawBaubleOrnament(ctx, 60, 85, 20, '#FACC15')
    drawBaubleOrnament(ctx, width - 60, 95, 22, '#22C55E')
    drawCandyCane(ctx, 50, height - 160, 45)
  } else if (style === 'xmas_snowy_december') {
    drawSnowflake(ctx, 50, 75, 20, '#0284C7')
    drawSnowflake(ctx, width - 55, 90, 28, '#0284C7')
    drawSnowflake(ctx, 50, height - 160, 22, '#0284C7')
    drawSnowflake(ctx, width - 50, height - 130, 24, '#0284C7')
  } else if (style === 'xmas_gingerbread_house' || style === 'xmas_gingerbread_friends') {
    drawGingerbreadMan(ctx, 55, 85, 40)
    drawGingerbreadMan(ctx, width - 55, 85, 40)
    drawCandyCane(ctx, 50, height - 150, 40)
  } else if (style === 'xmas_candy_cane' || style === 'xmas_peppermint_candy') {
    drawCandyCane(ctx, 50, 80, 46)
    drawCandyCane(ctx, width - 50, 80, 46)
    drawCandyCane(ctx, 50, height - 160, 46)
  } else if (style === 'xmas_red_and_green' || style === 'xmas_holly_and_berries' || style === 'xmas_holly_jolly') {
    drawHollyBerries(ctx, 50, 75, 20)
    drawHollyBerries(ctx, width - 50, 75, 20)
    drawHollyBerries(ctx, 50, height - 150, 20)
    drawHollyBerries(ctx, width - 50, height - 150, 20)
  } else if (style === 'xmas_cozy_christmas' || style === 'xmas_cozy_fireplace') {
    drawStarSparkle(ctx, 55, 75, 16, '#F59E0B')
    drawStarSparkle(ctx, width - 55, 75, 16, '#F59E0B')
    drawChristmasTree(ctx, 55, height - 140, 45, '#15803D')
  } else if (style === 'xmas_pink_christmas' || style === 'xmas_pink_ribbon' || style === 'xmas_kawaii_christmas') {
    drawStarSparkle(ctx, 50, 75, 16, '#DB2777')
    drawStarSparkle(ctx, width - 50, 75, 16, '#DB2777')
    drawBaubleOrnament(ctx, 55, height - 140, 18, '#F472B6')
    drawBaubleOrnament(ctx, width - 55, height - 140, 18, '#F472B6')
  } else if (style === 'xmas_blue_snowfall' || style === 'xmas_snowflake_dreams' || style === 'xmas_polar_bear_christmas') {
    drawSnowflake(ctx, 50, 80, 24, '#E0F2FE')
    drawSnowflake(ctx, width - 50, 85, 20, '#E0F2FE')
    drawSnowflake(ctx, 50, height - 150, 26, '#E0F2FE')
    drawSnowflake(ctx, width - 50, height - 140, 22, '#E0F2FE')
  } else if (style === 'xmas_christmas_tree') {
    drawChristmasTree(ctx, 55, 85, 48, '#047857')
    drawChristmasTree(ctx, width - 55, 85, 48, '#047857')
    drawStarSparkle(ctx, 55, height - 140, 16, '#FACC15')
    drawStarSparkle(ctx, width - 55, height - 140, 16, '#FACC15')
  } else if (style === 'xmas_christmas_lights') {
    drawFairyLights(ctx, width, 30)
    drawFairyLights(ctx, width, height - 80)
  } else if (style === 'xmas_golden_christmas' || style === 'xmas_merry_and_bright' || style === 'xmas_starry_night' || style === 'xmas_midnight_christmas') {
    drawStarSparkle(ctx, 50, 75, 20, '#FACC15')
    drawStarSparkle(ctx, width - 50, 75, 20, '#FACC15')
    drawStarSparkle(ctx, 50, height - 140, 16, '#FACC15')
    drawStarSparkle(ctx, width - 50, height - 140, 16, '#FACC15')
  } else if (style === 'xmas_reindeer_friends') {
    drawHollyBerries(ctx, 50, 75, 18)
    drawHollyBerries(ctx, width - 50, 75, 18)
    drawStarSparkle(ctx, 50, height - 140, 14, '#EF4444')
    drawStarSparkle(ctx, width - 50, height - 140, 14, '#EF4444')
  } else {
    // Default winter holiday accents
    drawSnowflake(ctx, 50, 80, 20, 'rgba(255,255,255,0.7)')
    drawSnowflake(ctx, width - 50, 80, 20, 'rgba(255,255,255,0.7)')
    drawStarSparkle(ctx, 50, height - 140, 14, 'rgba(255,255,255,0.8)')
    drawStarSparkle(ctx, width - 50, height - 140, 14, 'rgba(255,255,255,0.8)')
  }

  ctx.restore()
}

// Vector Drawing Primitives
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

function drawSnowflake(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string = '#FFFFFF') {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = Math.max(2, size * 0.08)
  ctx.lineCap = 'round'
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx + cos * size, cy + sin * size)
    ctx.stroke()
    const bPos = 0.6 * size
    const bLen = 0.35 * size
    ctx.beginPath()
    ctx.moveTo(cx + cos * bPos, cy + sin * bPos)
    ctx.lineTo(cx + cos * bPos - sin * bLen, cy + sin * bPos + cos * bLen)
    ctx.moveTo(cx + cos * bPos, cy + sin * bPos)
    ctx.lineTo(cx + cos * bPos + sin * bLen, cy + sin * bPos - cos * bLen)
    ctx.stroke()
  }
  ctx.restore()
}

function drawChristmasTree(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string = '#14532D') {
  ctx.save()
  ctx.fillStyle = '#78350F'
  ctx.fillRect(cx - size * 0.1, cy + size * 0.35, size * 0.2, size * 0.25)
  ctx.fillStyle = color
  for (let tier = 0; tier < 3; tier++) {
    const tierY = cy + (tier * size * 0.22) - size * 0.1
    const tierW = size * (0.35 + tier * 0.22)
    const tierH = size * 0.38
    ctx.beginPath()
    ctx.moveTo(cx, tierY - tierH * 0.6)
    ctx.lineTo(cx - tierW, tierY + tierH * 0.4)
    ctx.lineTo(cx + tierW, tierY + tierH * 0.4)
    ctx.closePath()
    ctx.fill()
  }
  drawStarSparkle(ctx, cx, cy - size * 0.38, size * 0.18, '#FACC15')
  ctx.restore()
}

function drawHollyBerries(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.save()
  ctx.fillStyle = '#15803D'
  drawEllipse(ctx, cx - size * 0.5, cy - size * 0.2, size * 0.7, size * 0.35, -Math.PI / 4)
  drawEllipse(ctx, cx + size * 0.5, cy - size * 0.2, size * 0.7, size * 0.35, Math.PI / 4)
  ctx.fillStyle = '#DC2626'
  const r = size * 0.3
  ctx.beginPath(); ctx.arc(cx - r * 0.6, cy + r * 0.2, r, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(cx + r * 0.6, cy + r * 0.2, r, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(cx, cy - r * 0.6, r, 0, Math.PI * 2); ctx.fill()
  ctx.restore()
}

function drawEllipse(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, rotation: number = 0) {
  if (typeof ctx.ellipse === 'function') {
    ctx.beginPath()
    ctx.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2)
    ctx.fill()
  } else {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rotation)
    ctx.scale(1, ry / rx)
    ctx.beginPath()
    ctx.arc(0, 0, rx, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

function drawCandyCane(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(0.3)
  ctx.lineWidth = Math.max(3, size * 0.22)
  ctx.strokeStyle = '#FFFFFF'
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(0, size * 0.7)
  ctx.lineTo(0, 0)
  ctx.arc(-size * 0.3, 0, size * 0.3, 0, Math.PI, true)
  ctx.stroke()
  ctx.strokeStyle = '#DC2626'
  ctx.setLineDash([size * 0.16, size * 0.16])
  ctx.stroke()
  ctx.restore()
}

function drawBaubleOrnament(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string = '#E11D48') {
  ctx.save()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(cx, cy - r * 2.0)
  ctx.lineTo(cx, cy - r)
  ctx.stroke()
  ctx.fillStyle = '#F59E0B'
  ctx.fillRect(cx - r * 0.25, cy - r * 1.15, r * 0.5, r * 0.25)
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)'
  ctx.beginPath()
  ctx.arc(cx - r * 0.35, cy - r * 0.35, r * 0.28, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawGingerbreadMan(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.save()
  ctx.fillStyle = '#854D0E'
  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(cx, cy - size * 0.45, size * 0.22, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  drawEllipse(ctx, cx, cy, size * 0.24, size * 0.32, 0)
  drawEllipse(ctx, cx - size * 0.32, cy - size * 0.1, size * 0.24, size * 0.1, -0.4)
  drawEllipse(ctx, cx + size * 0.32, cy - size * 0.1, size * 0.24, size * 0.1, 0.4)
  drawEllipse(ctx, cx - size * 0.16, cy + size * 0.38, size * 0.12, size * 0.22, -0.2)
  drawEllipse(ctx, cx + size * 0.16, cy + size * 0.38, size * 0.12, size * 0.22, 0.2)
  ctx.fillStyle = '#DC2626'
  ctx.beginPath(); ctx.arc(cx, cy - size * 0.1, 3, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#16A34A'
  ctx.beginPath(); ctx.arc(cx, cy + size * 0.08, 3, 0, Math.PI * 2); ctx.fill()
  ctx.restore()
}

function drawStarSparkle(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string = '#FEF08A') {
  ctx.save()
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(cx, cy - size)
  ctx.quadraticCurveTo(cx, cy, cx + size, cy)
  ctx.quadraticCurveTo(cx, cy, cx, cy + size)
  ctx.quadraticCurveTo(cx, cy, cx - size, cy)
  ctx.quadraticCurveTo(cx, cy, cx, cy - size)
  ctx.fill()
  ctx.restore()
}

function drawFairyLights(ctx: CanvasRenderingContext2D, width: number, y: number) {
  ctx.save()
  const colors = ['#EF4444', '#22C55E', '#FACC15', '#38BDF8', '#F472B6']
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(40, y)
  for (let x = 80; x < width - 40; x += 90) {
    ctx.quadraticCurveTo(x - 45, y + 25, x, y)
  }
  ctx.stroke()
  let ci = 0
  for (let x = 80; x < width - 40; x += 90) {
    const col = colors[ci % colors.length]
    ctx.fillStyle = col
    drawEllipse(ctx, x - 45, y + 28, 8, 12, 0)
    ci++
  }
  ctx.restore()
}
