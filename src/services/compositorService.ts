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

  // --- All 40 Christmas Themes with Real Graphic Decorations ---
  else if (style === 'xmas_classic') {
    // 1. Classic Christmas: Holly berries in top corners, Christmas bells in top center, tree & gift in footer
    drawHollyBerries(ctx, 50, 60, 22)
    drawHollyBerries(ctx, width - 50, 60, 22)
    drawChristmasBells(ctx, width / 2, 55, 36)
    drawChristmasTree(ctx, width - 60, height - 160, 65, '#15803D')
    drawWrappedPresent(ctx, 60, height - 160, 50, '#DC2626', '#FACC15')
  } else if (style === 'xmas_wonderland') {
    // 2. Christmas Wonderland: Snowflakes along borders, pines, snow sparkles
    drawSnowflake(ctx, 50, 65, 26, '#FFFFFF')
    drawSnowflake(ctx, width - 50, 65, 26, '#FFFFFF')
    drawSnowflake(ctx, 40, height / 2, 22, '#E0F2FE')
    drawSnowflake(ctx, width - 40, height / 2, 22, '#E0F2FE')
    drawChristmasTree(ctx, 60, height - 160, 65, '#059669')
    drawChristmasTree(ctx, width - 60, height - 160, 65, '#059669')
    drawStarSparkle(ctx, width / 2, 50, 18, '#FDE047')
  } else if (style === 'xmas_santas_workshop') {
    // 3. Santa's Workshop: Santa Claus, wrapped gifts, candy cane, baubles
    drawBaubleOrnament(ctx, 50, 70, 22, '#FACC15')
    drawBaubleOrnament(ctx, width - 50, 70, 22, '#22C55E')
    drawSantaClaus(ctx, width - 65, height - 180, 55)
    drawWrappedPresent(ctx, 60, height - 160, 52, '#16A34A', '#FEF08A')
    drawCandyCane(ctx, 45, height / 2, 42)
  } else if (style === 'xmas_snowy_december') {
    // 4. Snowy December: Icicles along top, blue snowflakes, snowman in footer
    drawIcicles(ctx, width, 10)
    drawSnowflake(ctx, 45, 75, 24, '#0284C7')
    drawSnowflake(ctx, width - 45, 75, 24, '#0284C7')
    drawSnowflake(ctx, 40, height / 2, 20, '#0284C7')
    drawSnowflake(ctx, width - 40, height / 2, 20, '#0284C7')
    drawSnowman(ctx, 60, height - 170, 50)
    drawSnowflake(ctx, width - 55, height - 160, 28, '#0284C7')
  } else if (style === 'xmas_gingerbread_house') {
    // 5. Gingerbread House: Gingerbread characters, candy canes, gumdrop stars
    drawCandyCane(ctx, 48, 65, 46)
    drawCandyCane(ctx, width - 48, 65, 46)
    drawGingerbreadMan(ctx, 60, height - 170, 52)
    drawGingerbreadMan(ctx, width - 60, height - 170, 52)
    drawStarSparkle(ctx, width / 2, 50, 18, '#FDE047')
  } else if (style === 'xmas_candy_cane') {
    // 6. Candy Cane: Candy canes in top & bottom corners, peppermint bows
    drawCandyCane(ctx, 50, 65, 48)
    drawCandyCane(ctx, width - 50, 65, 48)
    drawRibbonBow(ctx, width / 2, 50, 42, '#DC2626')
    drawCandyCane(ctx, 50, height - 160, 48)
    drawCandyCane(ctx, width - 50, height - 160, 48)
  } else if (style === 'xmas_red_and_green') {
    // 7. Red & Green: Festive pine garland, holly in corners, stocking and tree
    drawFestiveGarland(ctx, width, 30)
    drawHollyBerries(ctx, 50, 80, 20)
    drawHollyBerries(ctx, width - 50, 80, 20)
    drawChristmasStocking(ctx, 60, height - 160, 48, '#DC2626')
    drawChristmasTree(ctx, width - 60, height - 160, 60, '#15803D')
  } else if (style === 'xmas_cozy_christmas') {
    // 8. Cozy Christmas: Warm fireplace glow, stocking, tree, warm star sparkles
    drawStarSparkle(ctx, 50, 60, 18, '#F59E0B')
    drawStarSparkle(ctx, width - 50, 60, 18, '#F59E0B')
    drawChristmasStocking(ctx, 60, height - 160, 48, '#B91C1C')
    drawChristmasTree(ctx, width - 60, height - 160, 60, '#14532D')
  } else if (style === 'xmas_pink_christmas') {
    // 9. Pink Christmas: Pastel pink ribbon bows, pink ornaments, pastel sparkles
    drawRibbonBow(ctx, 50, 60, 40, '#F472B6')
    drawRibbonBow(ctx, width - 50, 60, 40, '#F472B6')
    drawBaubleOrnament(ctx, 45, height / 2, 20, '#F472B6')
    drawBaubleOrnament(ctx, width - 45, height / 2, 20, '#F472B6')
    drawWrappedPresent(ctx, 60, height - 160, 48, '#F472B6', '#FFFFFF')
    drawStarSparkle(ctx, width - 60, height - 160, 22, '#F472B6')
  } else if (style === 'xmas_blue_snowfall') {
    // 10. Blue Snowfall: Polar bear, icy crystal snowflakes
    drawSnowflake(ctx, 50, 65, 26, '#BAE6FD')
    drawSnowflake(ctx, width - 50, 65, 26, '#BAE6FD')
    drawSnowflake(ctx, 40, height / 2, 22, '#E0F2FE')
    drawSnowflake(ctx, width - 40, height / 2, 22, '#E0F2FE')
    drawPolarBear(ctx, 65, height - 170, 52)
    drawSnowflake(ctx, width - 60, height - 160, 30, '#BAE6FD')
  } else if (style === 'xmas_christmas_ribbon') {
    // 11. Christmas Ribbon: Elegant holiday bows, flowing ribbon swags
    drawRibbonBow(ctx, 50, 60, 44, '#DC2626')
    drawRibbonBow(ctx, width - 50, 60, 44, '#DC2626')
    drawRibbonBow(ctx, width / 2, 50, 48, '#FACC15')
    drawWrappedPresent(ctx, 60, height - 160, 52, '#DC2626', '#FACC15')
    drawWrappedPresent(ctx, width - 60, height - 160, 52, '#15803D', '#DC2626')
  } else if (style === 'xmas_holly_and_berries') {
    // 12. Holly & Berries: Lush holly clusters in all 4 corners and borders
    drawHollyBerries(ctx, 50, 60, 24)
    drawHollyBerries(ctx, width - 50, 60, 24)
    drawHollyBerries(ctx, 42, height / 2, 18)
    drawHollyBerries(ctx, width - 42, height / 2, 18)
    drawHollyBerries(ctx, 55, height - 160, 24)
    drawHollyBerries(ctx, width - 55, height - 160, 24)
  } else if (style === 'xmas_reindeer_friends') {
    // 13. Reindeer Friends: Cute Rudolph with red nose, holiday bells
    drawChristmasBells(ctx, 50, 65, 34)
    drawChristmasBells(ctx, width - 50, 65, 34)
    drawReindeer(ctx, 65, height - 170, 55)
    drawChristmasTree(ctx, width - 60, height - 160, 60, '#166534')
  } else if (style === 'xmas_christmas_tree') {
    // 14. Christmas Tree: Pine trees in corners, fairy lights and stars
    drawFairyLights(ctx, width, 30)
    drawChristmasTree(ctx, 55, 80, 50, '#15803D')
    drawChristmasTree(ctx, width - 55, 80, 50, '#15803D')
    drawChristmasTree(ctx, 60, height - 160, 65, '#15803D')
    drawChristmasTree(ctx, width - 60, height - 160, 65, '#15803D')
  } else if (style === 'xmas_winter_village') {
    // 15. Winter Village: Pine trees, snowman, snowflakes, cozy winter scene
    drawSnowflake(ctx, 50, 60, 24, '#E2E8F0')
    drawSnowflake(ctx, width - 50, 60, 24, '#E2E8F0')
    drawSnowman(ctx, 60, height - 170, 50)
    drawChristmasTree(ctx, width - 60, height - 160, 65, '#0F766E')
  } else if (style === 'xmas_snowflake_dreams') {
    // 16. Snowflake Dreams: Intricate snowflake crystals of various sizes
    drawSnowflake(ctx, 50, 65, 28, '#FFFFFF')
    drawSnowflake(ctx, width - 50, 65, 28, '#FFFFFF')
    drawSnowflake(ctx, 40, 400, 22, '#E0F2FE')
    drawSnowflake(ctx, width - 40, 400, 22, '#E0F2FE')
    drawSnowflake(ctx, 40, height / 2, 26, '#BAE6FD')
    drawSnowflake(ctx, width - 40, height / 2, 26, '#BAE6FD')
    drawSnowflake(ctx, 55, height - 160, 30, '#FFFFFF')
    drawSnowflake(ctx, width - 55, height - 160, 30, '#FFFFFF')
  } else if (style === 'xmas_merry_and_bright') {
    // 17. Merry & Bright: Twinkling fairy lights, sparkling stars, holiday cheer
    drawFairyLights(ctx, width, 30)
    drawStarSparkle(ctx, 50, 85, 20, '#FACC15')
    drawStarSparkle(ctx, width - 50, 85, 20, '#FACC15')
    drawChristmasBells(ctx, 60, height - 160, 38)
    drawWrappedPresent(ctx, width - 60, height - 160, 50, '#DC2626', '#FACC15')
  } else if (style === 'xmas_christmas_cookies') {
    // 18. Christmas Cookies: Gingerbread characters, candy canes, holiday treats
    drawCandyCane(ctx, 48, 65, 44)
    drawCandyCane(ctx, width - 48, 65, 44)
    drawGingerbreadMan(ctx, 60, height - 170, 52)
    drawCandyCane(ctx, width - 55, height - 160, 48)
  } else if (style === 'xmas_gift_wrapped') {
    // 19. Gift Wrapped: Wrapped presents with big ribbon bows
    drawRibbonBow(ctx, width / 2, 45, 46, '#DC2626')
    drawWrappedPresent(ctx, 55, 75, 46, '#DC2626', '#FEF08A')
    drawWrappedPresent(ctx, width - 55, 75, 46, '#15803D', '#FEF08A')
    drawWrappedPresent(ctx, 65, height - 160, 54, '#DC2626', '#FEF08A')
    drawWrappedPresent(ctx, width - 65, height - 160, 54, '#15803D', '#FEF08A')
  } else if (style === 'xmas_golden_christmas') {
    // 20. Golden Christmas: Golden bells, golden star sparkles, gold baubles
    drawChristmasBells(ctx, width / 2, 55, 40)
    drawStarSparkle(ctx, 50, 65, 22, '#FACC15')
    drawStarSparkle(ctx, width - 50, 65, 22, '#FACC15')
    drawBaubleOrnament(ctx, 45, height / 2, 22, '#FACC15')
    drawBaubleOrnament(ctx, width - 45, height / 2, 22, '#FACC15')
    drawStarSparkle(ctx, 55, height - 160, 24, '#FACC15')
    drawStarSparkle(ctx, width - 55, height - 160, 24, '#FACC15')
  } else if (style === 'xmas_frosted_window') {
    // 21. Frosted Window: Icicles hanging, frosty snowflakes
    drawIcicles(ctx, width, 10)
    drawSnowflake(ctx, 50, 70, 26, 'rgba(255, 255, 255, 0.9)')
    drawSnowflake(ctx, width - 50, 70, 26, 'rgba(255, 255, 255, 0.9)')
    drawSnowflake(ctx, 55, height - 160, 28, 'rgba(255, 255, 255, 0.9)')
    drawSnowflake(ctx, width - 55, height - 160, 28, 'rgba(255, 255, 255, 0.9)')
  } else if (style === 'xmas_peppermint_candy') {
    // 22. Peppermint Candy: Peppermint candy canes, festive red/white accents
    drawCandyCane(ctx, 48, 65, 48)
    drawCandyCane(ctx, width - 48, 65, 48)
    drawCandyCane(ctx, 48, height - 160, 48)
    drawCandyCane(ctx, width - 48, height - 160, 48)
    drawRibbonBow(ctx, width / 2, 50, 42, '#DC2626')
  } else if (style === 'xmas_nordic_christmas') {
    // 23. Nordic Christmas: Scandinavian cross-stitch border, reindeer, pine trees
    drawNordicBorder(ctx, width, height)
    drawReindeer(ctx, 60, height - 170, 52)
    drawChristmasTree(ctx, width - 60, height - 160, 60, '#DC2626')
  } else if (style === 'xmas_christmas_lights') {
    // 24. Christmas Lights: String fairy lights along top and bottom
    drawFairyLights(ctx, width, 30)
    drawFairyLights(ctx, width, height - 100)
    drawStarSparkle(ctx, 50, 90, 18, '#FACC15')
    drawStarSparkle(ctx, width - 50, 90, 18, '#38BDF8')
  } else if (style === 'xmas_nutcracker') {
    // 25. Nutcracker: Soldier nutcracker, holiday bells, gold accents
    drawChristmasBells(ctx, 50, 65, 34)
    drawChristmasBells(ctx, width - 50, 65, 34)
    drawNutcracker(ctx, width - 65, height - 180, 65)
    drawChristmasTree(ctx, 60, height - 160, 60, '#15803D')
  } else if (style === 'xmas_polar_bear_christmas') {
    // 26. Polar Bear Christmas: Cute polar bear with red scarf, snowflakes
    drawSnowflake(ctx, 50, 65, 24, '#E2E8F0')
    drawSnowflake(ctx, width - 50, 65, 24, '#E2E8F0')
    drawPolarBear(ctx, 65, height - 170, 55)
    drawSnowflake(ctx, width - 55, height - 160, 30, '#E2E8F0')
  } else if (style === 'xmas_vintage_postcard') {
    // 27. Vintage Christmas Postcard: Holly sprigs, bells, vintage ribbon bow
    drawHollyBerries(ctx, 50, 60, 22)
    drawRibbonBow(ctx, width - 50, 60, 40, '#B91C1C')
    drawChristmasBells(ctx, 60, height - 160, 38)
    drawChristmasTree(ctx, width - 60, height - 160, 60, '#15803D')
  } else if (style === 'xmas_christmas_sweater') {
    // 28. Christmas Sweater: Fair Isle knit borders, trees, winter diamonds
    drawNordicBorder(ctx, width, height)
    drawChristmasTree(ctx, 55, 75, 45, '#FFFFFF')
    drawChristmasTree(ctx, width - 55, 75, 45, '#FFFFFF')
    drawReindeer(ctx, 60, height - 170, 50)
    drawChristmasTree(ctx, width - 60, height - 160, 60, '#FFFFFF')
  } else if (style === 'xmas_midnight_christmas') {
    // 29. Midnight Christmas: Golden stars, moonlit sparkles, reindeer
    drawStarSparkle(ctx, 50, 65, 22, '#FDE047')
    drawStarSparkle(ctx, width - 50, 65, 22, '#FDE047')
    drawStarSparkle(ctx, width / 2, 45, 26, '#FEF08A')
    drawReindeer(ctx, 65, height - 170, 52)
    drawStarSparkle(ctx, width - 60, height - 160, 24, '#FDE047')
  } else if (style === 'xmas_kawaii_christmas') {
    // 30. Kawaii Christmas: Korean kawaii Santa, Rudolph, sweet sparkles
    drawSantaClaus(ctx, 60, height - 170, 52)
    drawReindeer(ctx, width - 60, height - 170, 52)
    drawStarSparkle(ctx, 50, 65, 18, '#F472B6')
    drawStarSparkle(ctx, width - 50, 65, 18, '#F472B6')
    drawRibbonBow(ctx, width / 2, 50, 42, '#F472B6')
  } else if (style === 'xmas_snowman_party') {
    // 31. Snowman Party: Cheerful snowmen with carrot noses & scarves, snowflakes
    drawSnowflake(ctx, 50, 65, 24, '#BAE6FD')
    drawSnowflake(ctx, width - 50, 65, 24, '#BAE6FD')
    drawSnowman(ctx, 60, height - 170, 50)
    drawSnowman(ctx, width - 60, height - 170, 50)
  } else if (style === 'xmas_christmas_stockings') {
    // 32. Christmas Stockings: Stockings hanging in corners with candy canes
    drawChristmasStocking(ctx, 50, 75, 46, '#DC2626')
    drawChristmasStocking(ctx, width - 50, 75, 46, '#15803D')
    drawChristmasStocking(ctx, 55, height - 160, 48, '#DC2626')
    drawChristmasTree(ctx, width - 60, height - 160, 60, '#15803D')
  } else if (style === 'xmas_cozy_fireplace') {
    // 33. Cozy Fireplace: Hearth stockings, pine tree, warm glowing sparkles
    drawStarSparkle(ctx, 50, 65, 20, '#F59E0B')
    drawStarSparkle(ctx, width - 50, 65, 20, '#F59E0B')
    drawChristmasStocking(ctx, 60, height - 160, 48, '#B91C1C')
    drawChristmasTree(ctx, width - 60, height - 160, 60, '#15803D')
  } else if (style === 'xmas_starry_night') {
    // 34. Starry Christmas Night: Bright gold star constellation, deep night aesthetic
    drawStarSparkle(ctx, 50, 65, 22, '#FACC15')
    drawStarSparkle(ctx, width - 50, 65, 22, '#FACC15')
    drawStarSparkle(ctx, width / 2, 45, 26, '#FACC15')
    drawStarSparkle(ctx, 42, height / 2, 18, '#FACC15')
    drawStarSparkle(ctx, width - 42, height / 2, 18, '#FACC15')
    drawStarSparkle(ctx, 55, height - 160, 24, '#FACC15')
    drawStarSparkle(ctx, width - 55, height - 160, 24, '#FACC15')
  } else if (style === 'xmas_pink_ribbon') {
    // 35. Pink Ribbon Christmas: Sweet pastel ribbons, candy canes, pastel ornaments
    drawRibbonBow(ctx, 50, 60, 42, '#F472B6')
    drawRibbonBow(ctx, width - 50, 60, 42, '#F472B6')
    drawCandyCane(ctx, 45, height / 2, 40)
    drawCandyCane(ctx, width - 45, height / 2, 40)
    drawRibbonBow(ctx, 60, height - 160, 46, '#F472B6')
    drawWrappedPresent(ctx, width - 60, height - 160, 50, '#F472B6', '#FFFFFF')
  } else if (style === 'xmas_christmas_market') {
    // 36. Christmas Market: Festive pine swags, gingerbread, wooden bells
    drawFestiveGarland(ctx, width, 30)
    drawGingerbreadMan(ctx, 60, height - 170, 50)
    drawChristmasBells(ctx, width - 60, height - 160, 38)
  } else if (style === 'xmas_winter_wonderland') {
    // 37. Winter Wonderland: Cute penguin, snowy trees, falling snowflakes
    drawSnowflake(ctx, 50, 65, 26, '#FFFFFF')
    drawSnowflake(ctx, width - 50, 65, 26, '#FFFFFF')
    drawPenguin(ctx, 65, height - 170, 50)
    drawChristmasTree(ctx, width - 60, height - 160, 65, '#047857')
  } else if (style === 'xmas_gingerbread_friends') {
    // 38. Gingerbread Friends: Smiling gingerbread pair, candy canes, frosting stars
    drawCandyCane(ctx, 50, 65, 44)
    drawCandyCane(ctx, width - 50, 65, 44)
    drawGingerbreadMan(ctx, 60, height - 170, 50)
    drawGingerbreadMan(ctx, width - 60, height - 170, 50)
  } else if (style === 'xmas_holly_jolly') {
    // 39. Holly Jolly: Jolly bells, red bows, holly berries
    drawChristmasBells(ctx, width / 2, 50, 40)
    drawHollyBerries(ctx, 50, 65, 22)
    drawHollyBerries(ctx, width - 50, 65, 22)
    drawHollyBerries(ctx, 55, height - 160, 24)
    drawChristmasTree(ctx, width - 60, height - 160, 60, '#15803D')
  } else if (style === 'xmas_december_memories') {
    // 40. December Memories: Christmas wreath, ribbon bows, snowflakes, star sparkles
    drawChristmasWreath(ctx, width / 2, 60, 48)
    drawSnowflake(ctx, 50, 65, 24, '#FFFFFF')
    drawSnowflake(ctx, width - 50, 65, 24, '#FFFFFF')
    drawWrappedPresent(ctx, 60, height - 160, 52, '#DC2626', '#FACC15')
    drawChristmasTree(ctx, width - 60, height - 160, 62, '#15803D')
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
