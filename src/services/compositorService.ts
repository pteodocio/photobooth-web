import QRCode from 'qrcode'
import { AppConstants } from '../core/constants'
import type { CompositeJob, FrameTemplate, PhotoFilter, LayoutTypeConfig } from '../core/types'
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

  if (job.passcode) {
    ctx.font = '600 24px "Segoe UI", sans-serif'
    ctx.fillText(`CODE: ${job.passcode}`, canvasWidth / 2, 3375)
  }
  ctx.restore()

  // 7. Scannable White QR Sticker Card
  const defaultUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?s=${Date.now()}`
      : `https://photobooth.app/?s=${Date.now()}`
  const qrTarget = job.qrData || defaultUrl
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

// --- All 40 Christmas Themes with Real Graphic Decorations ---
  else if (style.startsWith('xmas_')) {
    // 1. Festive Background Snowfall Texture for Depth
    drawSnowfallBackground(ctx, width, height, style.includes('dark') || style.includes('midnight') ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.45)')

    // 2. Inter-Slot Festive Dividers (y = 860, 1620, 2380)
    const dividers = [860, 1620, 2380]
    dividers.forEach((dy, idx) => {
      if (idx % 2 === 0) {
        drawStarSparkle(ctx, 40, dy, 14, '#FACC15')
        drawStarSparkle(ctx, width - 40, dy, 14, '#FACC15')
        drawRibbonBow(ctx, width / 2, dy, 32, '#DC2626')
      } else {
        drawSnowflake(ctx, 40, dy, 16, '#FFFFFF')
        drawSnowflake(ctx, width - 40, dy, 16, '#FFFFFF')
        drawHollyBerries(ctx, width / 2, dy, 16)
      }
    })

    // 3. Theme-Specific Oversized Graphic Compositions
    if (style === 'xmas_classic') {
      // 1. Classic Christmas: Large golden bells in top header, giant tree and stack of wrapped presents in footer
      drawChristmasBells(ctx, width / 2, 60, 52)
      drawHollyBerries(ctx, 50, 65, 30)
      drawHollyBerries(ctx, width - 50, 65, 30)
      drawFairyLights(ctx, width, 110)
      drawCandyCane(ctx, 40, 500, 65)
      drawCandyCane(ctx, width - 40, 500, 65)
      drawCandyCane(ctx, 40, 2000, 65)
      drawCandyCane(ctx, width - 40, 2000, 65)
      // Large footer illustrations
      drawWrappedPresent(ctx, 240, 3350, 120, '#DC2626', '#FACC15')
      drawWrappedPresent(ctx, 420, 3380, 95, '#15803D', '#FEF08A')
      drawChristmasTree(ctx, width - 260, 3340, 165, '#15803D')
      drawChristmasStocking(ctx, width - 460, 3370, 90, '#DC2626')
    } else if (style === 'xmas_wonderland') {
      // 2. Christmas Wonderland: Giant snow pines, crystal snowflake storm, penguin in winter snow
      drawSnowflake(ctx, 60, 65, 36, '#FFFFFF')
      drawSnowflake(ctx, width - 60, 65, 36, '#FFFFFF')
      drawSnowflake(ctx, width / 2, 60, 42, '#FFFFFF')
      drawSnowflake(ctx, 40, 500, 32, '#E0F2FE')
      drawSnowflake(ctx, width - 40, 500, 32, '#E0F2FE')
      drawSnowflake(ctx, 40, 2000, 32, '#E0F2FE')
      drawSnowflake(ctx, width - 40, 2000, 32, '#E0F2FE')
      // Footer scene
      drawChristmasTree(ctx, 220, 3330, 175, '#059669')
      drawPenguin(ctx, 460, 3360, 115)
      drawChristmasTree(ctx, width - 220, 3330, 175, '#059669')
      drawSnowman(ctx, width - 440, 3360, 110)
    } else if (style === 'xmas_santas_workshop') {
      // 3. Santa's Workshop: Giant Santa, workshop toys, wrapped presents, candy canes
      drawRibbonBow(ctx, width / 2, 55, 60, '#FACC15')
      drawBaubleOrnament(ctx, 50, 70, 30, '#FACC15')
      drawBaubleOrnament(ctx, width - 50, 70, 30, '#22C55E')
      drawFairyLights(ctx, width, 110)
      drawCandyCane(ctx, 40, 1200, 65)
      drawCandyCane(ctx, width - 40, 1200, 65)
      // Giant Santa and gifts in footer
      drawSantaClaus(ctx, 240, 3340, 130)
      drawWrappedPresent(ctx, 460, 3360, 110, '#16A34A', '#FEF08A')
      drawWrappedPresent(ctx, 620, 3390, 85, '#DC2626', '#FEF08A')
      drawChristmasTree(ctx, width - 220, 3340, 160, '#15803D')
    } else if (style === 'xmas_snowy_december') {
      // 4. Snowy December: Crystalline icicles across top, giant happy snowman, polar bear
      drawIcicles(ctx, width, 10)
      drawSnowflake(ctx, 50, 75, 34, '#0284C7')
      drawSnowflake(ctx, width - 50, 75, 34, '#0284C7')
      drawSnowflake(ctx, 40, 1200, 30, '#0284C7')
      drawSnowflake(ctx, width - 40, 1200, 30, '#0284C7')
      // Footer scene
      drawSnowman(ctx, 240, 3340, 130)
      drawPolarBear(ctx, 480, 3350, 115)
      drawChristmasTree(ctx, width - 240, 3340, 165, '#0284C7')
    } else if (style === 'xmas_gingerbread_house') {
      // 5. Gingerbread House: Oversized smiling gingerbread pair, giant candy canes, gumdrop stars
      drawCandyCane(ctx, 50, 65, 75)
      drawCandyCane(ctx, width - 50, 65, 75)
      drawStarSparkle(ctx, width / 2, 55, 32, '#FDE047')
      drawCandyCane(ctx, 40, 1200, 65)
      drawCandyCane(ctx, width - 40, 1200, 65)
      // Gingerbread couple in footer
      drawGingerbreadMan(ctx, 240, 3350, 125)
      drawGingerbreadMan(ctx, 460, 3350, 125)
      drawCandyCane(ctx, width - 260, 3340, 110)
      drawWrappedPresent(ctx, width - 440, 3380, 95, '#854D0E', '#FEF08A')
    } else if (style === 'xmas_candy_cane') {
      // 6. Candy Cane: Giant crossed peppermint candy canes, oversized red bows
      drawRibbonBow(ctx, width / 2, 60, 75, '#DC2626')
      drawCandyCane(ctx, 55, 65, 75)
      drawCandyCane(ctx, width - 55, 65, 75)
      drawCandyCane(ctx, 40, 1200, 75)
      drawCandyCane(ctx, width - 40, 1200, 75)
      // Footer candy cane showcase
      drawCandyCane(ctx, 220, 3340, 120)
      drawRibbonBow(ctx, 420, 3380, 70, '#DC2626')
      drawCandyCane(ctx, width - 220, 3340, 120)
      drawWrappedPresent(ctx, width - 420, 3370, 105, '#DC2626', '#FFFFFF')
    } else if (style === 'xmas_red_and_green') {
      // 7. Red & Green: Draped pine needle garland, stocking, giant tree, wrapped gifts
      drawFestiveGarland(ctx, width, 40)
      drawHollyBerries(ctx, 50, 80, 30)
      drawHollyBerries(ctx, width - 50, 80, 30)
      drawChristmasStocking(ctx, 40, 1200, 65, '#DC2626')
      drawChristmasStocking(ctx, width - 40, 1200, 65, '#15803D')
      // Footer
      drawChristmasStocking(ctx, 240, 3350, 115, '#DC2626')
      drawWrappedPresent(ctx, 440, 3370, 105, '#15803D', '#FACC15')
      drawChristmasTree(ctx, width - 240, 3330, 175, '#15803D')
    } else if (style === 'xmas_cozy_christmas' || style === 'xmas_cozy_fireplace') {
      // 8 & 33. Cozy Christmas / Fireplace: Brick fireplace hearth with roaring fire, stockings, decorated tree
      drawStarSparkle(ctx, width / 2, 55, 30, '#F59E0B')
      drawStarSparkle(ctx, 50, 65, 26, '#F59E0B')
      drawStarSparkle(ctx, width - 50, 65, 26, '#F59E0B')
      drawFairyLights(ctx, width, 110)
      drawFireplace(ctx, 320, 3340, 180)
      drawChristmasTree(ctx, width - 260, 3330, 170, '#14532D')
      drawWrappedPresent(ctx, width - 480, 3380, 95, '#B91C1C', '#F59E0B')
    } else if (style === 'xmas_pink_christmas') {
      // 9. Pink Christmas: Oversized pastel pink bows, pink pine tree, dreamy pastel gifts
      drawRibbonBow(ctx, width / 2, 60, 80, '#F472B6')
      drawRibbonBow(ctx, 50, 65, 55, '#F472B6')
      drawRibbonBow(ctx, width - 50, 65, 55, '#F472B6')
      drawBaubleOrnament(ctx, 40, 1200, 30, '#F472B6')
      drawBaubleOrnament(ctx, width - 40, 1200, 30, '#F472B6')
      // Footer
      drawChristmasTree(ctx, 240, 3340, 165, '#F472B6')
      drawWrappedPresent(ctx, 460, 3370, 110, '#F472B6', '#FFFFFF')
      drawWrappedPresent(ctx, 620, 3390, 85, '#FBCFE8', '#DB2777')
      drawSnowman(ctx, width - 240, 3350, 115)
    } else if (style === 'xmas_blue_snowfall') {
      // 10. Blue Snowfall: Giant cute polar bear, ice crystal snowflakes, snowy trees
      drawSnowflake(ctx, width / 2, 60, 44, '#BAE6FD')
      drawSnowflake(ctx, 50, 65, 34, '#BAE6FD')
      drawSnowflake(ctx, width - 50, 65, 34, '#BAE6FD')
      drawSnowflake(ctx, 40, 1200, 32, '#BAE6FD')
      drawSnowflake(ctx, width - 40, 1200, 32, '#BAE6FD')
      // Footer
      drawPolarBear(ctx, 240, 3340, 130)
      drawPenguin(ctx, 460, 3370, 105)
      drawChristmasTree(ctx, width - 240, 3330, 175, '#0284C7')
    } else if (style === 'xmas_christmas_ribbon') {
      // 11. Christmas Ribbon: Flowing holiday ribbon swags, giant bows, wrapped presents
      drawRibbonBow(ctx, width / 2, 60, 95, '#FACC15')
      drawRibbonBow(ctx, 50, 65, 60, '#DC2626')
      drawRibbonBow(ctx, width - 50, 65, 60, '#DC2626')
      drawRibbonBow(ctx, 40, 1200, 48, '#DC2626')
      drawRibbonBow(ctx, width - 40, 1200, 48, '#DC2626')
      // Footer
      drawWrappedPresent(ctx, 240, 3350, 125, '#DC2626', '#FACC15')
      drawWrappedPresent(ctx, 450, 3370, 105, '#15803D', '#DC2626')
      drawChristmasTree(ctx, width - 240, 3330, 170, '#15803D')
    } else if (style === 'xmas_holly_and_berries') {
      // 12. Holly & Berries: Lush holly garlands, golden bells, winter trees
      drawChristmasBells(ctx, width / 2, 60, 52)
      drawHollyBerries(ctx, 50, 65, 35)
      drawHollyBerries(ctx, width - 50, 65, 35)
      drawHollyBerries(ctx, 40, 1200, 30)
      drawHollyBerries(ctx, width - 40, 1200, 30)
      // Footer
      drawChristmasTree(ctx, 240, 3330, 170, '#15803D')
      drawHollyBerries(ctx, 460, 3380, 40)
      drawChristmasTree(ctx, width - 240, 3330, 170, '#15803D')
    } else if (style === 'xmas_reindeer_friends') {
      // 13. Reindeer Friends: Giant Rudolph with glowing red nose, holiday bells, winter pines
      drawChristmasBells(ctx, width / 2, 60, 52)
      drawChristmasBells(ctx, 50, 65, 38)
      drawChristmasBells(ctx, width - 50, 65, 38)
      drawStarSparkle(ctx, 40, 1200, 24, '#EF4444')
      drawStarSparkle(ctx, width - 40, 1200, 24, '#EF4444')
      // Footer
      drawReindeer(ctx, 260, 3330, 135)
      drawChristmasTree(ctx, width - 240, 3330, 175, '#166534')
      drawWrappedPresent(ctx, width - 480, 3370, 100, '#EF4444', '#FEF08A')
    } else if (style === 'xmas_christmas_tree') {
      // 14. Christmas Tree: Draped fairy lights, towering decorated pines with gold star toppers
      drawFairyLights(ctx, width, 40)
      drawStarSparkle(ctx, width / 2, 60, 35, '#FACC15')
      drawChristmasTree(ctx, 50, 80, 65, '#15803D')
      drawChristmasTree(ctx, width - 50, 80, 65, '#15803D')
      // Footer
      drawChristmasTree(ctx, 240, 3320, 185, '#15803D')
      drawWrappedPresent(ctx, 460, 3370, 105, '#DC2626', '#FEF08A')
      drawChristmasTree(ctx, width - 240, 3320, 185, '#15803D')
    } else if (style === 'xmas_winter_village') {
      // 15. Winter Village: Snowy cottages, snowman, pines, crystal stars
      drawSnowflake(ctx, width / 2, 55, 38, '#FFFFFF')
      drawSnowflake(ctx, 50, 65, 30, '#FFFFFF')
      drawSnowflake(ctx, width - 50, 65, 30, '#FFFFFF')
      drawSnowman(ctx, 240, 3340, 125)
      drawChristmasTree(ctx, width - 240, 3330, 175, '#0F766E')
      drawWrappedPresent(ctx, width - 460, 3370, 95, '#0F766E', '#FFFFFF')
    } else if (style === 'xmas_snowflake_dreams') {
      // 16. Snowflake Dreams: Cascading multi-layer crystal snowflakes of all sizes
      drawSnowflake(ctx, width / 2, 60, 50, '#FFFFFF')
      drawSnowflake(ctx, 50, 65, 38, '#FFFFFF')
      drawSnowflake(ctx, width - 50, 65, 38, '#FFFFFF')
      drawSnowflake(ctx, 40, 400, 32, '#BAE6FD')
      drawSnowflake(ctx, width - 40, 400, 32, '#BAE6FD')
      drawSnowflake(ctx, 40, 1200, 36, '#FFFFFF')
      drawSnowflake(ctx, width - 40, 1200, 36, '#FFFFFF')
      drawSnowflake(ctx, 40, 2000, 32, '#BAE6FD')
      drawSnowflake(ctx, width - 40, 2000, 32, '#BAE6FD')
      // Footer
      drawSnowflake(ctx, 240, 3340, 65, '#FFFFFF')
      drawPolarBear(ctx, 460, 3350, 120)
      drawSnowflake(ctx, width - 240, 3340, 65, '#FFFFFF')
      drawSnowman(ctx, width - 460, 3350, 115)
    } else if (style === 'xmas_merry_and_bright') {
      // 17. Merry & Bright: Draped multi-color fairy lights, golden bells, sparkling stars
      drawFairyLights(ctx, width, 40)
      drawStarSparkle(ctx, 50, 85, 30, '#FACC15')
      drawStarSparkle(ctx, width - 50, 85, 30, '#FACC15')
      drawFairyLights(ctx, width, 1200)
      // Footer
      drawChristmasBells(ctx, 240, 3340, 60)
      drawWrappedPresent(ctx, 460, 3360, 110, '#DC2626', '#FACC15')
      drawChristmasTree(ctx, width - 240, 3330, 170, '#15803D')
    } else if (style === 'xmas_christmas_cookies') {
      // 18. Christmas Cookies: Gingerbread characters, tree sugar cookies, candy canes
      drawCandyCane(ctx, 55, 65, 70)
      drawCandyCane(ctx, width - 55, 65, 70)
      drawStarSparkle(ctx, width / 2, 55, 30, '#FACC15')
      drawGingerbreadMan(ctx, 240, 3340, 125)
      drawCandyCane(ctx, 450, 3350, 95)
      drawGingerbreadMan(ctx, width - 240, 3340, 125)
    } else if (style === 'xmas_gift_wrapped') {
      // 19. Gift Wrapped: Giant ribbon bow topper, mountains of colorful wrapped gift boxes
      drawRibbonBow(ctx, width / 2, 60, 95, '#DC2626')
      drawWrappedPresent(ctx, 55, 75, 65, '#DC2626', '#FEF08A')
      drawWrappedPresent(ctx, width - 55, 75, 65, '#15803D', '#FEF08A')
      // Footer
      drawWrappedPresent(ctx, 220, 3340, 130, '#DC2626', '#FEF08A')
      drawWrappedPresent(ctx, 420, 3360, 110, '#15803D', '#FEF08A')
      drawWrappedPresent(ctx, 600, 3390, 85, '#0284C7', '#FEF08A')
      drawWrappedPresent(ctx, width - 240, 3340, 130, '#FACC15', '#DC2626')
    } else if (style === 'xmas_golden_christmas') {
      // 20. Golden Christmas: Golden bells, champagne star constellation, gold baubles, luxury tree
      drawChristmasBells(ctx, width / 2, 60, 55)
      drawStarSparkle(ctx, 50, 65, 32, '#FACC15')
      drawStarSparkle(ctx, width - 50, 65, 32, '#FACC15')
      drawBaubleOrnament(ctx, 40, 1200, 30, '#FACC15')
      drawBaubleOrnament(ctx, width - 40, 1200, 30, '#FACC15')
      // Footer
      drawChristmasTree(ctx, 240, 3330, 175, '#CA8A04')
      drawWrappedPresent(ctx, 460, 3360, 115, '#CA8A04', '#FEF08A')
      drawStarSparkle(ctx, width - 240, 3340, 55, '#FACC15')
    } else if (style === 'xmas_frosted_window') {
      // 21. Frosted Window: Frozen stalactites, heavy frost snowflakes, winter snowman
      drawIcicles(ctx, width, 10)
      drawSnowflake(ctx, 50, 75, 36, '#FFFFFF')
      drawSnowflake(ctx, width - 50, 75, 36, '#FFFFFF')
      drawSnowflake(ctx, 40, 1200, 32, '#E0F2FE')
      drawSnowflake(ctx, width - 40, 1200, 32, '#E0F2FE')
      drawSnowman(ctx, 240, 3340, 130)
      drawChristmasTree(ctx, width - 240, 3330, 175, '#0284C7')
    } else if (style === 'xmas_peppermint_candy') {
      // 22. Peppermint Candy: Oversized candy canes, peppermint swirl discs, holiday bows
      drawRibbonBow(ctx, width / 2, 60, 80, '#DC2626')
      drawCandyCane(ctx, 55, 65, 80)
      drawCandyCane(ctx, width - 55, 65, 80)
      drawCandyCane(ctx, 40, 1200, 75)
      drawCandyCane(ctx, width - 40, 1200, 75)
      // Footer
      drawCandyCane(ctx, 240, 3340, 130)
      drawWrappedPresent(ctx, 460, 3370, 105, '#DC2626', '#FFFFFF')
      drawCandyCane(ctx, width - 240, 3340, 130)
    } else if (style === 'xmas_nordic_christmas') {
      // 23. Nordic Christmas: Scandinavian folk cross-stitch borders, reindeer family, Nordic trees
      drawNordicBorder(ctx, width, height)
      drawStarSparkle(ctx, width / 2, 55, 32, '#FFFFFF')
      drawReindeer(ctx, 260, 3330, 135)
      drawChristmasTree(ctx, width - 240, 3330, 175, '#DC2626')
      drawWrappedPresent(ctx, width - 460, 3370, 105, '#FFFFFF', '#DC2626')
    } else if (style === 'xmas_christmas_lights') {
      // 24. Christmas Lights: Flowing multi-colored string fairy lights across top, gutters, and footer
      drawFairyLights(ctx, width, 40)
      drawFairyLights(ctx, width, 110)
      drawFairyLights(ctx, width, height - 120)
      drawChristmasTree(ctx, 240, 3330, 175, '#15803D')
      drawWrappedPresent(ctx, 460, 3360, 110, '#DC2626', '#FACC15')
      drawChristmasTree(ctx, width - 240, 3330, 175, '#15803D')
    } else if (style === 'xmas_nutcracker') {
      // 25. Nutcracker: Giant soldier nutcracker with tall shako, holiday drums, bells
      drawChristmasBells(ctx, width / 2, 60, 52)
      drawChristmasBells(ctx, 50, 65, 38)
      drawChristmasBells(ctx, width - 50, 65, 38)
      drawNutcracker(ctx, 260, 3320, 150)
      drawChristmasTree(ctx, width - 240, 3330, 175, '#15803D')
      drawWrappedPresent(ctx, width - 460, 3370, 105, '#DC2626', '#FACC15')
    } else if (style === 'xmas_polar_bear_christmas') {
      // 26. Polar Bear Christmas: Giant fluffy polar bear face with red scarf, winter snowdrifts
      drawSnowflake(ctx, width / 2, 55, 42, '#E2E8F0')
      drawSnowflake(ctx, 50, 65, 34, '#E2E8F0')
      drawSnowflake(ctx, width - 50, 65, 34, '#E2E8F0')
      drawPolarBear(ctx, 260, 3340, 135)
      drawPenguin(ctx, 480, 3360, 110)
      drawChristmasTree(ctx, width - 240, 3330, 175, '#0284C7')
    } else if (style === 'xmas_vintage_postcard') {
      // 27. Vintage Postcard: Antique holly stamp, bells, vintage ribbon bow, classic Santa
      drawRibbonBow(ctx, width / 2, 60, 80, '#B91C1C')
      drawHollyBerries(ctx, 50, 65, 32)
      drawChristmasBells(ctx, width - 50, 65, 40)
      drawSantaClaus(ctx, 260, 3340, 130)
      drawChristmasTree(ctx, width - 240, 3330, 175, '#15803D')
      drawWrappedPresent(ctx, width - 460, 3370, 100, '#B91C1C', '#FEF08A')
    } else if (style === 'xmas_christmas_sweater') {
      // 28. Christmas Sweater: Fair Isle knit patterns, deer, holiday trees, snowflake borders
      drawNordicBorder(ctx, width, height)
      drawChristmasTree(ctx, 55, 75, 65, '#FFFFFF')
      drawChristmasTree(ctx, width - 55, 75, 65, '#FFFFFF')
      drawReindeer(ctx, 260, 3330, 130)
      drawChristmasTree(ctx, width - 240, 3330, 175, '#FFFFFF')
      drawSnowman(ctx, width - 460, 3350, 115)
    } else if (style === 'xmas_midnight_christmas') {
      // 29. Midnight Christmas: Brilliant golden crescent moon, shooting stars, reindeer
      drawStarSparkle(ctx, width / 2, 55, 45, '#FDE047')
      drawStarSparkle(ctx, 50, 65, 32, '#FDE047')
      drawStarSparkle(ctx, width - 50, 65, 32, '#FDE047')
      drawReindeer(ctx, 260, 3330, 135)
      drawChristmasTree(ctx, width - 240, 3330, 175, '#1E3A8A')
      drawStarSparkle(ctx, width - 460, 3360, 45, '#FEF08A')
    } else if (style === 'xmas_kawaii_christmas') {
      // 30. Kawaii Christmas: Cute Korean kawaii Santa & baby Rudolph, pastel ribbon bow
      drawRibbonBow(ctx, width / 2, 60, 85, '#F472B6')
      drawStarSparkle(ctx, 50, 65, 30, '#F472B6')
      drawStarSparkle(ctx, width - 50, 65, 30, '#F472B6')
      drawSantaClaus(ctx, 250, 3340, 130)
      drawReindeer(ctx, width - 250, 3340, 130)
      drawWrappedPresent(ctx, width / 2, 3370, 100, '#F472B6', '#FFFFFF')
    } else if (style === 'xmas_snowman_party') {
      // 31. Snowman Party: Two cheerful snowmen with top hats and scarves, snowfall
      drawSnowflake(ctx, width / 2, 55, 42, '#BAE6FD')
      drawSnowflake(ctx, 50, 65, 32, '#BAE6FD')
      drawSnowflake(ctx, width - 50, 65, 32, '#BAE6FD')
      drawSnowman(ctx, 260, 3340, 130)
      drawSnowman(ctx, width - 260, 3340, 130)
      drawChristmasTree(ctx, width / 2, 3330, 165, '#0284C7')
    } else if (style === 'xmas_christmas_stockings') {
      // 32. Christmas Stockings: Oversized holiday stockings stuffed with candy canes & gifts
      drawChristmasStocking(ctx, 55, 75, 75, '#DC2626')
      drawChristmasStocking(ctx, width - 55, 75, 75, '#15803D')
      drawChristmasStocking(ctx, 250, 3350, 125, '#DC2626')
      drawChristmasStocking(ctx, 450, 3350, 125, '#15803D')
      drawChristmasTree(ctx, width - 240, 3330, 175, '#15803D')
    } else if (style === 'xmas_starry_night') {
      // 34. Starry Christmas Night: Golden star constellation, deep night aesthetic
      drawStarSparkle(ctx, width / 2, 60, 50, '#FACC15')
      drawStarSparkle(ctx, 50, 65, 35, '#FACC15')
      drawStarSparkle(ctx, width - 50, 65, 35, '#FACC15')
      drawStarSparkle(ctx, 40, 1200, 28, '#FACC15')
      drawStarSparkle(ctx, width - 40, 1200, 28, '#FACC15')
      drawChristmasTree(ctx, 240, 3330, 175, '#1E1B4B')
      drawStarSparkle(ctx, 460, 3360, 55, '#FACC15')
      drawChristmasTree(ctx, width - 240, 3330, 175, '#1E1B4B')
    } else if (style === 'xmas_pink_ribbon') {
      // 35. Pink Ribbon: Giant pastel pink ribbon bows, pastel gift boxes
      drawRibbonBow(ctx, width / 2, 60, 95, '#F472B6')
      drawRibbonBow(ctx, 50, 65, 60, '#F472B6')
      drawRibbonBow(ctx, width - 50, 65, 60, '#F472B6')
      drawRibbonBow(ctx, 250, 3350, 120, '#F472B6')
      drawWrappedPresent(ctx, width - 250, 3360, 125, '#F472B6', '#FFFFFF')
      drawChristmasTree(ctx, width / 2, 3330, 165, '#FBCFE8')
    } else if (style === 'xmas_christmas_market') {
      // 36. Christmas Market: Market awning garlands, gingerbread treats, wooden bells
      drawFestiveGarland(ctx, width, 40)
      drawChristmasBells(ctx, 50, 70, 42)
      drawChristmasBells(ctx, width - 50, 70, 42)
      drawGingerbreadMan(ctx, 240, 3340, 125)
      drawChristmasBells(ctx, 450, 3360, 55)
      drawChristmasTree(ctx, width - 240, 3330, 175, '#15803D')
    } else if (style === 'xmas_winter_wonderland') {
      // 37. Winter Wonderland: Cute penguin with winter earmuffs, giant snowy trees, piles of snow
      drawSnowflake(ctx, width / 2, 55, 45, '#FFFFFF')
      drawSnowflake(ctx, 50, 65, 35, '#FFFFFF')
      drawSnowflake(ctx, width - 50, 65, 35, '#FFFFFF')
      drawPenguin(ctx, 260, 3340, 130)
      drawSnowman(ctx, 480, 3350, 115)
      drawChristmasTree(ctx, width - 240, 3330, 175, '#047857')
    } else if (style === 'xmas_gingerbread_friends') {
      // 38. Gingerbread Friends: Two smiling gingerbread friends holding hands, candy canes
      drawCandyCane(ctx, 55, 65, 75)
      drawCandyCane(ctx, width - 55, 65, 75)
      drawStarSparkle(ctx, width / 2, 55, 32, '#FDE047')
      drawGingerbreadMan(ctx, 260, 3340, 125)
      drawGingerbreadMan(ctx, 480, 3340, 125)
      drawCandyCane(ctx, width - 240, 3340, 110)
    } else if (style === 'xmas_holly_jolly') {
      // 39. Holly Jolly: Jolly golden bells, red ribbon bows, lush mistletoe berries
      drawChristmasBells(ctx, width / 2, 60, 60)
      drawHollyBerries(ctx, 50, 65, 35)
      drawHollyBerries(ctx, width - 50, 65, 35)
      drawChristmasTree(ctx, 240, 3330, 175, '#15803D')
      drawChristmasBells(ctx, 460, 3360, 55)
      drawWrappedPresent(ctx, width - 240, 3360, 115, '#DC2626', '#FEF08A')
    } else if (style === 'xmas_december_memories') {
      // 40. December Memories: Large Christmas wreath with red bow, holiday tree, wrapped gifts
      drawChristmasWreath(ctx, width / 2, 60, 65)
      drawSnowflake(ctx, 50, 65, 34, '#FFFFFF')
      drawSnowflake(ctx, width - 50, 65, 34, '#FFFFFF')
      drawWrappedPresent(ctx, 240, 3350, 125, '#DC2626', '#FACC15')
      drawWrappedPresent(ctx, 440, 3380, 95, '#15803D', '#FACC15')
      drawChristmasTree(ctx, width - 240, 3330, 175, '#15803D')
    } else {
      drawSnowflake(ctx, 50, 80, 32, 'rgba(255,255,255,0.7)')
      drawSnowflake(ctx, width - 50, 80, 32, 'rgba(255,255,255,0.7)')
      drawStarSparkle(ctx, 50, height - 160, 24, 'rgba(255,255,255,0.8)')
      drawStarSparkle(ctx, width - 50, height - 160, 24, 'rgba(255,255,255,0.8)')
    }
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

function drawSantaClaus(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.save()
  // Hat
  ctx.fillStyle = '#DC2626'
  ctx.beginPath()
  ctx.moveTo(cx - size * 0.45, cy - size * 0.2)
  ctx.quadraticCurveTo(cx - size * 0.2, cy - size * 0.9, cx + size * 0.5, cy - size * 0.7)
  ctx.lineTo(cx + size * 0.4, cy - size * 0.15)
  ctx.closePath()
  ctx.fill()

  // Pompom
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.arc(cx + size * 0.52, cy - size * 0.7, size * 0.14, 0, Math.PI * 2)
  ctx.fill()

  // Hat White Trim
  drawEllipse(ctx, cx, cy - size * 0.2, size * 0.48, size * 0.12, 0)

  // Face
  ctx.fillStyle = '#FED7AA'
  ctx.beginPath()
  ctx.arc(cx, cy + size * 0.05, size * 0.32, 0, Math.PI * 2)
  ctx.fill()

  // Rosy Cheeks
  ctx.fillStyle = 'rgba(244, 114, 182, 0.65)'
  ctx.beginPath(); ctx.arc(cx - size * 0.2, cy + size * 0.1, size * 0.09, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(cx + size * 0.2, cy + size * 0.1, size * 0.09, 0, Math.PI * 2); ctx.fill()

  // Eyes
  ctx.fillStyle = '#18181B'
  ctx.beginPath(); ctx.arc(cx - size * 0.13, cy - size * 0.02, size * 0.04, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(cx + size * 0.13, cy - size * 0.02, size * 0.04, 0, Math.PI * 2); ctx.fill()

  // Nose
  ctx.fillStyle = '#F87171'
  ctx.beginPath(); ctx.arc(cx, cy + size * 0.06, size * 0.06, 0, Math.PI * 2); ctx.fill()

  // Beard
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.arc(cx - size * 0.25, cy + size * 0.25, size * 0.2, 0, Math.PI * 2)
  ctx.arc(cx + size * 0.25, cy + size * 0.25, size * 0.2, 0, Math.PI * 2)
  ctx.arc(cx, cy + size * 0.45, size * 0.26, 0, Math.PI * 2)
  ctx.fill()

  // Mustache
  drawEllipse(ctx, cx - size * 0.1, cy + size * 0.15, size * 0.14, size * 0.07, -0.2)
  drawEllipse(ctx, cx + size * 0.1, cy + size * 0.15, size * 0.14, size * 0.07, 0.2)
  ctx.restore()
}

function drawReindeer(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.save()
  // Antlers
  ctx.strokeStyle = '#78350F'
  ctx.lineWidth = Math.max(2.5, size * 0.08)
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(cx - size * 0.2, cy - size * 0.25)
  ctx.lineTo(cx - size * 0.45, cy - size * 0.75)
  ctx.moveTo(cx - size * 0.32, cy - size * 0.5)
  ctx.lineTo(cx - size * 0.52, cy - size * 0.48)
  ctx.moveTo(cx - size * 0.38, cy - size * 0.65)
  ctx.lineTo(cx - size * 0.28, cy - size * 0.8)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(cx + size * 0.2, cy - size * 0.25)
  ctx.lineTo(cx + size * 0.45, cy - size * 0.75)
  ctx.moveTo(cx + size * 0.32, cy - size * 0.5)
  ctx.lineTo(cx + size * 0.52, cy - size * 0.48)
  ctx.moveTo(cx + size * 0.38, cy - size * 0.65)
  ctx.lineTo(cx + size * 0.28, cy - size * 0.8)
  ctx.stroke()

  // Ears
  ctx.fillStyle = '#92400E'
  drawEllipse(ctx, cx - size * 0.36, cy - size * 0.18, size * 0.18, size * 0.08, -0.5)
  drawEllipse(ctx, cx + size * 0.36, cy - size * 0.18, size * 0.18, size * 0.08, 0.5)

  // Head
  ctx.fillStyle = '#B45309'
  drawEllipse(ctx, cx, cy, size * 0.34, size * 0.4, 0)

  // Muzzle
  ctx.fillStyle = '#FEF3C7'
  drawEllipse(ctx, cx, cy + size * 0.18, size * 0.22, size * 0.16, 0)

  // Rudolph Red Nose
  ctx.fillStyle = '#EF4444'
  ctx.beginPath()
  ctx.arc(cx, cy + size * 0.15, size * 0.1, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.arc(cx - size * 0.03, cy + size * 0.12, size * 0.03, 0, Math.PI * 2)
  ctx.fill()

  // Eyes
  ctx.fillStyle = '#18181B'
  ctx.beginPath(); ctx.arc(cx - size * 0.14, cy - size * 0.05, size * 0.045, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(cx + size * 0.14, cy - size * 0.05, size * 0.045, 0, Math.PI * 2); ctx.fill()
  ctx.restore()
}

function drawSnowman(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.save()
  // Body (bottom)
  ctx.fillStyle = '#FFFFFF'
  ctx.strokeStyle = 'rgba(186, 230, 253, 0.5)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(cx, cy + size * 0.25, size * 0.38, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Head (top)
  ctx.beginPath()
  ctx.arc(cx, cy - size * 0.25, size * 0.26, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Top hat
  ctx.fillStyle = '#18181B'
  ctx.fillRect(cx - size * 0.28, cy - size * 0.48, size * 0.56, size * 0.08)
  ctx.fillRect(cx - size * 0.18, cy - size * 0.8, size * 0.36, size * 0.34)
  ctx.fillStyle = '#DC2626'
  ctx.fillRect(cx - size * 0.18, cy - size * 0.54, size * 0.36, size * 0.07)

  // Scarf
  ctx.fillStyle = '#DC2626'
  drawEllipse(ctx, cx, cy - size * 0.02, size * 0.26, size * 0.08, 0)
  ctx.fillRect(cx + size * 0.08, cy, size * 0.1, size * 0.26)

  // Carrot Nose
  ctx.fillStyle = '#F97316'
  ctx.beginPath()
  ctx.moveTo(cx, cy - size * 0.27)
  ctx.lineTo(cx + size * 0.22, cy - size * 0.23)
  ctx.lineTo(cx, cy - size * 0.19)
  ctx.closePath()
  ctx.fill()

  // Eyes & Buttons
  ctx.fillStyle = '#18181B'
  ctx.beginPath(); ctx.arc(cx - size * 0.08, cy - size * 0.31, size * 0.03, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(cx + size * 0.08, cy - size * 0.31, size * 0.03, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(cx, cy + size * 0.18, size * 0.035, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(cx, cy + size * 0.32, size * 0.035, 0, Math.PI * 2); ctx.fill()
  ctx.restore()
}

function drawPenguin(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.save()
  // Body
  ctx.fillStyle = '#18181B'
  drawEllipse(ctx, cx, cy, size * 0.32, size * 0.44, 0)

  // White belly
  ctx.fillStyle = '#FFFFFF'
  drawEllipse(ctx, cx, cy + size * 0.06, size * 0.22, size * 0.32, 0)

  // Flippers
  ctx.fillStyle = '#18181B'
  drawEllipse(ctx, cx - size * 0.3, cy + size * 0.05, size * 0.08, size * 0.22, 0.4)
  drawEllipse(ctx, cx + size * 0.3, cy + size * 0.05, size * 0.08, size * 0.22, -0.4)

  // Earmuffs
  ctx.strokeStyle = '#DC2626'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(cx, cy - size * 0.25, size * 0.28, Math.PI, 0)
  ctx.stroke()
  ctx.fillStyle = '#DC2626'
  ctx.beginPath(); ctx.arc(cx - size * 0.28, cy - size * 0.25, size * 0.1, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(cx + size * 0.28, cy - size * 0.25, size * 0.1, 0, Math.PI * 2); ctx.fill()

  // Eyes
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath(); ctx.arc(cx - size * 0.08, cy - size * 0.2, size * 0.05, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(cx + size * 0.08, cy - size * 0.2, size * 0.05, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#18181B'
  ctx.beginPath(); ctx.arc(cx - size * 0.08, cy - size * 0.2, size * 0.025, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(cx + size * 0.08, cy - size * 0.2, size * 0.025, 0, Math.PI * 2); ctx.fill()

  // Beak
  ctx.fillStyle = '#F59E0B'
  ctx.beginPath()
  ctx.moveTo(cx - size * 0.07, cy - size * 0.14)
  ctx.lineTo(cx + size * 0.07, cy - size * 0.14)
  ctx.lineTo(cx, cy - size * 0.06)
  ctx.closePath()
  ctx.fill()

  // Orange Feet
  ctx.beginPath(); ctx.arc(cx - size * 0.12, cy + size * 0.44, size * 0.08, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(cx + size * 0.12, cy + size * 0.44, size * 0.08, 0, Math.PI * 2); ctx.fill()
  ctx.restore()
}

function drawPolarBear(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.save()
  // Ears
  ctx.fillStyle = '#F8FAFC'
  ctx.beginPath(); ctx.arc(cx - size * 0.26, cy - size * 0.24, size * 0.12, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(cx + size * 0.26, cy - size * 0.24, size * 0.12, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#FDA4AF'
  ctx.beginPath(); ctx.arc(cx - size * 0.26, cy - size * 0.24, size * 0.06, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(cx + size * 0.26, cy - size * 0.24, size * 0.06, 0, Math.PI * 2); ctx.fill()

  // Head
  ctx.fillStyle = '#F8FAFC'
  drawEllipse(ctx, cx, cy, size * 0.36, size * 0.32, 0)

  // Muzzle
  ctx.fillStyle = '#E2E8F0'
  drawEllipse(ctx, cx, cy + size * 0.08, size * 0.18, size * 0.14, 0)

  // Black Nose
  ctx.fillStyle = '#0F172A'
  drawEllipse(ctx, cx, cy + size * 0.04, size * 0.07, size * 0.045, 0)

  // Eyes
  ctx.beginPath(); ctx.arc(cx - size * 0.14, cy - size * 0.05, size * 0.04, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(cx + size * 0.14, cy - size * 0.05, size * 0.04, 0, Math.PI * 2); ctx.fill()

  // Red Scarf
  ctx.fillStyle = '#DC2626'
  drawEllipse(ctx, cx, cy + size * 0.26, size * 0.34, size * 0.1, 0)
  ctx.fillRect(cx - size * 0.06, cy + size * 0.28, size * 0.12, size * 0.2)
  ctx.restore()
}

function drawChristmasWreath(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.save()
  ctx.strokeStyle = '#15803D'
  ctx.lineWidth = Math.max(5, size * 0.25)
  ctx.beginPath()
  ctx.arc(cx, cy, size * 0.35, 0, Math.PI * 2)
  ctx.stroke()

  ctx.strokeStyle = '#22C55E'
  ctx.lineWidth = Math.max(2, size * 0.1)
  ctx.setLineDash([size * 0.15, size * 0.15])
  ctx.stroke()

  ctx.fillStyle = '#DC2626'
  const berryAngles = [0, Math.PI * 0.4, Math.PI * 0.8, Math.PI * 1.2, Math.PI * 1.6]
  berryAngles.forEach(ang => {
    const bx = cx + Math.cos(ang) * size * 0.35
    const by = cy + Math.sin(ang) * size * 0.35
    ctx.beginPath(); ctx.arc(bx, by, size * 0.06, 0, Math.PI * 2); ctx.fill()
  })

  drawRibbonBow(ctx, cx, cy - size * 0.35, size * 0.4, '#DC2626')
  ctx.restore()
}

function drawWrappedPresent(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, boxColor: string = '#DC2626', ribbonColor: string = '#FACC15') {
  ctx.save()
  const boxW = size * 0.7
  const boxH = size * 0.65
  const bx = cx - boxW / 2
  const by = cy - boxH / 2

  ctx.fillStyle = boxColor
  ctx.fillRect(bx, by, boxW, boxH)

  ctx.fillStyle = boxColor
  ctx.fillRect(bx - size * 0.05, by - size * 0.08, boxW + size * 0.1, size * 0.12)

  ctx.fillStyle = ribbonColor
  const rw = size * 0.12
  ctx.fillRect(cx - rw / 2, by - size * 0.08, rw, boxH + size * 0.08)
  ctx.fillRect(bx, cy - rw / 2, boxW, rw)

  drawRibbonBow(ctx, cx, by - size * 0.1, size * 0.38, ribbonColor)
  ctx.restore()
}

function drawChristmasStocking(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string = '#DC2626') {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(0.15)

  ctx.fillStyle = color
  ctx.fillRect(-size * 0.18, -size * 0.4, size * 0.36, size * 0.5)

  ctx.beginPath()
  ctx.arc(-size * 0.1, size * 0.15, size * 0.22, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillRect(-size * 0.32, size * 0.02, size * 0.32, size * 0.26)

  ctx.fillStyle = '#FFFFFF'
  drawEllipse(ctx, 0, -size * 0.42, size * 0.24, size * 0.1, 0)

  ctx.fillStyle = '#FEF3C7'
  ctx.beginPath(); ctx.arc(-size * 0.3, size * 0.15, size * 0.12, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(size * 0.12, size * 0.1, size * 0.1, 0, Math.PI * 2); ctx.fill()
  ctx.restore()
}

function drawChristmasBells(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.save()
  // Bell 1
  ctx.save()
  ctx.translate(cx - size * 0.16, cy + size * 0.05)
  ctx.rotate(-0.3)
  ctx.fillStyle = '#EAB308'
  ctx.beginPath()
  ctx.moveTo(0, -size * 0.3)
  ctx.quadraticCurveTo(size * 0.22, size * 0.1, size * 0.25, size * 0.2)
  ctx.lineTo(-size * 0.25, size * 0.2)
  ctx.quadraticCurveTo(-size * 0.22, size * 0.1, 0, -size * 0.3)
  ctx.fill()
  drawEllipse(ctx, 0, size * 0.2, size * 0.25, size * 0.07, 0)
  ctx.fillStyle = '#CA8A04'
  ctx.beginPath(); ctx.arc(0, size * 0.24, size * 0.06, 0, Math.PI * 2); ctx.fill()
  ctx.restore()

  // Bell 2
  ctx.save()
  ctx.translate(cx + size * 0.16, cy + size * 0.05)
  ctx.rotate(0.3)
  ctx.fillStyle = '#FACC15'
  ctx.beginPath()
  ctx.moveTo(0, -size * 0.3)
  ctx.quadraticCurveTo(size * 0.22, size * 0.1, size * 0.25, size * 0.2)
  ctx.lineTo(-size * 0.25, size * 0.2)
  ctx.quadraticCurveTo(-size * 0.22, size * 0.1, 0, -size * 0.3)
  ctx.fill()
  drawEllipse(ctx, 0, size * 0.2, size * 0.25, size * 0.07, 0)
  ctx.fillStyle = '#CA8A04'
  ctx.beginPath(); ctx.arc(0, size * 0.24, size * 0.06, 0, Math.PI * 2); ctx.fill()
  ctx.restore()

  drawRibbonBow(ctx, cx, cy - size * 0.2, size * 0.45, '#DC2626')
  ctx.restore()
}

function drawRibbonBow(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string = '#DC2626') {
  ctx.save()
  ctx.fillStyle = color
  // Left Loop
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  if (typeof ctx.bezierCurveTo === 'function') {
    ctx.bezierCurveTo(cx - size * 0.5, cy - size * 0.4, cx - size * 0.5, cy + size * 0.4, cx, cy)
  } else {
    ctx.quadraticCurveTo(cx - size * 0.5, cy, cx, cy)
  }
  ctx.fill()
  // Right Loop
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  if (typeof ctx.bezierCurveTo === 'function') {
    ctx.bezierCurveTo(cx + size * 0.5, cy - size * 0.4, cx + size * 0.5, cy + size * 0.4, cx, cy)
  } else {
    ctx.quadraticCurveTo(cx + size * 0.5, cy, cx, cy)
  }
  ctx.fill()

  ctx.beginPath()
  ctx.arc(cx, cy, size * 0.1, 0, Math.PI * 2)
  ctx.fill()

  ctx.lineWidth = Math.max(2, size * 0.12)
  ctx.strokeStyle = color
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(cx - size * 0.05, cy + size * 0.08)
  ctx.quadraticCurveTo(cx - size * 0.2, cy + size * 0.25, cx - size * 0.25, cy + size * 0.4)
  ctx.moveTo(cx + size * 0.05, cy + size * 0.08)
  ctx.quadraticCurveTo(cx + size * 0.2, cy + size * 0.25, cx + size * 0.25, cy + size * 0.4)
  ctx.stroke()
  ctx.restore()
}

function drawNutcracker(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.save()
  ctx.fillStyle = '#18181B'
  ctx.fillRect(cx - size * 0.18, cy - size * 0.65, size * 0.36, size * 0.4)
  ctx.fillStyle = '#FACC15'
  ctx.fillRect(cx - size * 0.18, cy - size * 0.32, size * 0.36, size * 0.06)
  ctx.beginPath(); ctx.arc(cx, cy - size * 0.52, size * 0.08, 0, Math.PI * 2); ctx.fill()

  ctx.fillStyle = '#FED7AA'
  ctx.fillRect(cx - size * 0.16, cy - size * 0.26, size * 0.32, size * 0.24)

  ctx.fillStyle = '#18181B'
  ctx.beginPath(); ctx.arc(cx - size * 0.08, cy - size * 0.18, size * 0.025, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(cx + size * 0.08, cy - size * 0.18, size * 0.025, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#FFFFFF'
  drawEllipse(ctx, cx - size * 0.07, cy - size * 0.1, size * 0.08, size * 0.035, -0.2)
  drawEllipse(ctx, cx + size * 0.07, cy - size * 0.1, size * 0.08, size * 0.035, 0.2)

  ctx.fillStyle = '#DC2626'
  ctx.fillRect(cx - size * 0.2, cy - size * 0.02, size * 0.4, size * 0.35)

  ctx.fillStyle = '#FACC15'
  drawEllipse(ctx, cx - size * 0.22, cy, size * 0.07, size * 0.05, 0)
  drawEllipse(ctx, cx + size * 0.22, cy, size * 0.07, size * 0.05, 0)
  ctx.restore()
}

function drawIcicles(ctx: CanvasRenderingContext2D, width: number, y: number) {
  ctx.save()
  ctx.fillStyle = 'rgba(224, 242, 254, 0.85)'
  for (let x = 30; x < width - 30; x += 40) {
    const h = 25 + ((x * 17) % 35)
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + 18, y)
    ctx.lineTo(x + 9, y + h)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()
}

function drawFestiveGarland(ctx: CanvasRenderingContext2D, width: number, y: number) {
  ctx.save()
  ctx.strokeStyle = '#15803D'
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.moveTo(40, y)
  for (let x = 120; x < width - 40; x += 160) {
    ctx.quadraticCurveTo(x - 80, y + 45, x, y)
  }
  ctx.stroke()

  for (let x = 40; x < width; x += 160) {
    drawRibbonBow(ctx, x, y, 24, '#DC2626')
  }
  ctx.restore()
}

function drawNordicBorder(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.save()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
  ctx.lineWidth = 2
  for (let y = 140; y < height - 160; y += 80) {
    drawStarSparkle(ctx, 40, y, 8, '#FFFFFF')
    drawStarSparkle(ctx, width - 40, y, 8, '#FFFFFF')
  }
  ctx.restore()
}

function drawFireplace(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.save()
  // Hearth mantel (wood)
  ctx.fillStyle = '#78350F'
  ctx.fillRect(cx - size * 0.5, cy - size * 0.45, size, size * 0.12)
  // Brick pillars
  ctx.fillStyle = '#991B1B'
  ctx.fillRect(cx - size * 0.42, cy - size * 0.33, size * 0.22, size * 0.7)
  ctx.fillRect(cx + size * 0.2, cy - size * 0.33, size * 0.22, size * 0.7)
  // Firebox opening
  ctx.fillStyle = '#1C1917'
  ctx.fillRect(cx - size * 0.2, cy - size * 0.33, size * 0.4, size * 0.7)
  // Hearth base
  ctx.fillStyle = '#78350F'
  ctx.fillRect(cx - size * 0.46, cy + size * 0.32, size * 0.92, size * 0.1)
  // Fire glow
  ctx.fillStyle = '#EA580C'
  ctx.beginPath()
  ctx.moveTo(cx - size * 0.12, cy + size * 0.32)
  ctx.lineTo(cx, cy + size * 0.05)
  ctx.lineTo(cx + size * 0.12, cy + size * 0.32)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#FACC15'
  ctx.beginPath()
  ctx.moveTo(cx - size * 0.07, cy + size * 0.32)
  ctx.lineTo(cx, cy + size * 0.14)
  ctx.lineTo(cx + size * 0.07, cy + size * 0.32)
  ctx.closePath()
  ctx.fill()
  // Stockings on mantel
  drawChristmasStocking(ctx, cx - size * 0.18, cy - size * 0.2, size * 0.35, '#DC2626')
  drawChristmasStocking(ctx, cx + size * 0.18, cy - size * 0.2, size * 0.35, '#15803D')
  ctx.restore()
}

function drawSnowfallBackground(ctx: CanvasRenderingContext2D, width: number, height: number, color: string = 'rgba(255, 255, 255, 0.45)') {
  ctx.save()
  ctx.fillStyle = color
  const leftX = [20, 50, 30, 60, 25, 55, 35, 65, 22, 58]
  const rightX = [width - 20, width - 50, width - 30, width - 60, width - 25, width - 55, width - 35, width - 65, width - 22, width - 58]
  const steps = Math.max(1, Math.floor((height - 240) / 140))
  for (let i = 0; i < steps; i++) {
    const y = 80 + i * 140
    const lx = leftX[i % leftX.length]
    const rx = rightX[i % rightX.length]
    const r = (i % 3) + 2
    ctx.beginPath(); ctx.arc(lx, y, r, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(rx, y + 30, r, 0, Math.PI * 2); ctx.fill()
  }
  ctx.restore()
}

let cachedSamplePhotos: HTMLCanvasElement[] | null = null

/**
 * Returns 4 offline-safe, high-aesthetic photobooth portraits for frame previews.
 */
export function getSamplePhotos(): HTMLCanvasElement[] {
  if (cachedSamplePhotos) return cachedSamplePhotos

  if (typeof document === 'undefined') {
    return []
  }

  const palettes = [
    { bg: '#FED7AA', hair: '#451A03', clothes: '#DC2626', skin: '#FFEDD5', blush: '#FB7185' },
    { bg: '#BAE6FD', hair: '#1E293B', clothes: '#0284C7', skin: '#FEF3C7', blush: '#F472B6' },
    { bg: '#FBCFE8', hair: '#701A75', clothes: '#DB2777', skin: '#FFF1F2', blush: '#FDA4AF' },
    { bg: '#BBF7D0', hair: '#14532D', clothes: '#16A34A', skin: '#FEF08A', blush: '#F472B6' },
  ]

  cachedSamplePhotos = palettes.map(p => {
    const canvas = document.createElement('canvas')
    canvas.width = 400
    canvas.height = 300
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = p.bg
      ctx.fillRect(0, 0, 400, 300)

      // Friendly studio silhouette pose
      ctx.fillStyle = p.clothes
      ctx.beginPath()
      ctx.arc(200, 340, 150, Math.PI, 0)
      ctx.fill()

      ctx.fillStyle = p.skin
      ctx.fillRect(180, 180, 40, 50)

      ctx.beginPath()
      ctx.arc(200, 140, 65, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = p.hair
      ctx.beginPath()
      ctx.arc(200, 125, 70, Math.PI * 0.8, Math.PI * 2.2)
      ctx.fill()

      ctx.fillStyle = p.blush
      ctx.beginPath(); ctx.arc(165, 155, 14, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(235, 155, 14, 0, Math.PI * 2); ctx.fill()

      ctx.fillStyle = '#18181B'
      ctx.beginPath(); ctx.arc(170, 135, 6, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(230, 135, 6, 0, Math.PI * 2); ctx.fill()
      ctx.lineWidth = 3
      ctx.strokeStyle = '#18181B'
      ctx.beginPath()
      ctx.arc(200, 155, 16, 0.2, Math.PI - 0.2)
      ctx.stroke()
    }
    return canvas
  })

  return cachedSamplePhotos
}

/**
 * Renders any frame onto a canvas of arbitrary dimensions (thumbnail, preview, or 300 DPI export).
 * Guarantees 100% visual parity between selection preview and final export.
 */
export function renderFrameToCanvas(
  targetCanvas: HTMLCanvasElement,
  frame: FrameTemplate,
  layout: LayoutTypeConfig,
  samplePhotos?: (HTMLCanvasElement | HTMLImageElement)[],
  options?: {
    filter?: PhotoFilter
    filterIntensity?: number
  }
) {
  const ctx = targetCanvas.getContext('2d')
  if (!ctx) return

  const targetWidth = targetCanvas.width
  const targetHeight = targetCanvas.height
  const baseWidth = 1200
  const baseHeight = 3600

  ctx.save()
  // Uniform scale to 1200x3600 photobooth coordinate system
  ctx.scale(targetWidth / baseWidth, targetHeight / baseHeight)

  // 1. Frame Background
  if (frame.gradientColors && frame.gradientColors.length >= 2) {
    const gradient = ctx.createLinearGradient(0, 0, 0, baseHeight)
    const step = 1 / (frame.gradientColors.length - 1)
    frame.gradientColors.forEach((color, idx) => {
      gradient.addColorStop(idx * step, color)
    })
    ctx.fillStyle = gradient
  } else {
    ctx.fillStyle = frame.backgroundColor
  }
  ctx.fillRect(0, 0, baseWidth, baseHeight)

  // 2. Draw Theme Background Decors & Christmas Vector Artwork
  drawThemeBackgroundDecors(ctx, frame, baseWidth, baseHeight)

  // 3. Draw Photo Slots
  const photos = samplePhotos || []
  const filter = options?.filter || 'none'
  const intensity = options?.filterIntensity ?? 1.0

  if (layout.id === 'fourCut') {
    const slotW = AppConstants.fourCutSlotWidth
    const slotH = AppConstants.fourCutSlotHeight
    const marginX = AppConstants.fourCutMarginX
    const marginTop = AppConstants.fourCutMarginTop
    const gutter = AppConstants.fourCutGutter

    for (let i = 0; i < 4; i++) {
      const slotY = marginTop + i * (slotH + gutter)
      if (i < photos.length && photos[i]) {
        drawPhotoSlot(ctx, photos[i] as HTMLImageElement, marginX, slotY, slotW, slotH, frame, filter, intensity)
      } else {
        drawEmptySlot(ctx, marginX, slotY, slotW, slotH, frame)
      }
    }
  } else if (layout.id === 'sixCut') {
    const cols = 2
    const slotW = AppConstants.sixCutSlotWidth
    const slotH = AppConstants.sixCutSlotHeight
    const marginX = AppConstants.sixCutMarginX
    const marginTop = AppConstants.sixCutMarginTop
    const gutterX = AppConstants.sixCutGutterX
    const gutterY = AppConstants.sixCutGutterY

    for (let i = 0; i < 6; i++) {
      const col = i % cols
      const row = Math.floor(i / cols)
      const slotX = marginX + col * (slotW + gutterX)
      const slotY = marginTop + row * (slotH + gutterY)
      if (i < photos.length && photos[i]) {
        drawPhotoSlot(ctx, photos[i] as HTMLImageElement, slotX, slotY, slotW, slotH, frame, filter, intensity)
      } else {
        drawEmptySlot(ctx, slotX, slotY, slotW, slotH, frame)
      }
    }
  }

  // 4. Header English Title Banner
  ctx.save()
  ctx.font = 'bold 36px "Outfit", "Segoe UI", sans-serif'
  ctx.fillStyle = frame.captionColor
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(frame.englishTitle || frame.name, baseWidth / 2, 60)
  ctx.restore()

  // 5. Footer Watermark & Date
  ctx.save()
  ctx.font = '600 24px "Outfit", "Segoe UI", sans-serif'
  ctx.fillStyle = frame.captionColor
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('KOREAN 4-CUT STUDIO · 2026.12.25', baseWidth / 2, 3500)
  ctx.restore()

  ctx.restore()
}

function drawEmptySlot(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, frame: FrameTemplate) {
  ctx.save()
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'
  if (frame.slotCornerRadius > 0 && typeof ctx.roundRect === 'function') {
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, frame.slotCornerRadius)
    ctx.fill()
  } else {
    ctx.fillRect(x, y, w, h)
  }
  if (frame.slotBorderWidth > 0) {
    ctx.strokeStyle = frame.slotBorderColor || '#FFFFFF'
    ctx.lineWidth = frame.slotBorderWidth
    ctx.beginPath()
    if (frame.slotCornerRadius > 0 && typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, w, h, frame.slotCornerRadius)
    } else {
      ctx.rect(x, y, w, h)
    }
    ctx.stroke()
  }
  ctx.restore()
}
