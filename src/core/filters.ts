import type { FilterOption } from './types'

export interface FilterParams {
  contrast?: number // default 1.0
  brightness?: number // default 1.0
  saturate?: number // default 1.0
  sepia?: number // default 0.0
  grayscale?: number // default 0.0
  hueRotate?: number // default 0 (degrees)
  blur?: number // default 0 (px)
}

export interface DetailedFilterOption extends FilterOption {
  params: FilterParams
  previewGradient: string
}

export const FILTER_CATEGORIES = [
  { id: 'all', name: 'All' },
  { id: 'film', name: 'Film & Retro' },
  { id: 'warm', name: 'Warm & Golden' },
  { id: 'cool', name: 'Cool & Aesthetic' },
  { id: 'glow', name: 'Glow & Dreamy' },
  { id: 'noir', name: 'Noir & Mono' },
]

export const PHOTO_FILTERS: DetailedFilterOption[] = [
  // 0. Neutral Baseline
  {
    id: 'none',
    displayName: 'Original',
    description: 'No filter applied',
    category: 'all',
    params: {},
    previewGradient: 'linear-gradient(135deg, #444, #222)',
  },

  // 1. Seoul Film
  {
    id: 'seoul_film',
    displayName: 'Seoul Film',
    description: 'Crisp urban film tone with rich contrast',
    category: 'film',
    params: { contrast: 1.15, brightness: 1.04, saturate: 0.92, sepia: 0.08, hueRotate: -3 },
    previewGradient: 'linear-gradient(135deg, #2b3a4a, #1b2631)',
  },

  // 2. Vintage Kodak
  {
    id: 'vintage_kodak',
    displayName: 'Vintage Kodak',
    description: 'Warm golden amber Kodachrome palette',
    category: 'film',
    params: { contrast: 1.16, brightness: 1.02, saturate: 1.25, sepia: 0.26, hueRotate: -8 },
    previewGradient: 'linear-gradient(135deg, #d4a373, #a26e3c)',
  },

  // 3. Fuji Film
  {
    id: 'fuji_film',
    displayName: 'Fuji Film',
    description: 'Rich emerald greens and clean sky highlights',
    category: 'film',
    params: { contrast: 1.10, brightness: 1.06, saturate: 1.12, sepia: 0.05, hueRotate: 8 },
    previewGradient: 'linear-gradient(135deg, #2a9d8f, #1f6f66)',
  },

  // 4. Pink Milk
  {
    id: 'pink_milk',
    displayName: 'Pink Milk',
    description: 'Sweet pastel pink glow with creamy lightness',
    category: 'glow',
    params: { contrast: 0.95, brightness: 1.12, saturate: 1.18, sepia: 0.12, hueRotate: 325 },
    previewGradient: 'linear-gradient(135deg, #ffcad4, #f4acb7)',
  },

  // 5. Cool Seoul
  {
    id: 'cool_seoul',
    displayName: 'Cool Seoul',
    description: 'High-key iced blue street tone',
    category: 'cool',
    params: { contrast: 1.10, brightness: 1.06, saturate: 0.85, hueRotate: 18 },
    previewGradient: 'linear-gradient(135deg, #90e0ef, #0077b6)',
  },

  // 6. Lavender Dream
  {
    id: 'lavender_dream',
    displayName: 'Lavender Dream',
    description: 'Soft twilight violet mist and magenta haze',
    category: 'glow',
    params: { contrast: 0.98, brightness: 1.06, saturate: 1.14, sepia: 0.10, hueRotate: 275 },
    previewGradient: 'linear-gradient(135deg, #cdb4db, #b5838d)',
  },

  // 7. Peach Cream
  {
    id: 'peach_cream',
    displayName: 'Peach Cream',
    description: 'Velvety apricot warmth and soft highlights',
    category: 'warm',
    params: { contrast: 1.03, brightness: 1.08, saturate: 1.20, sepia: 0.18, hueRotate: 345 },
    previewGradient: 'linear-gradient(135deg, #ffb5a7, #fcd5ce)',
  },

  // 8. Dreamy Glow
  {
    id: 'dreamy_glow',
    displayName: 'Dreamy Glow',
    description: 'Diffuse romantic luminance with soft edges',
    category: 'glow',
    params: { contrast: 0.92, brightness: 1.14, saturate: 1.08, blur: 0.3 },
    previewGradient: 'linear-gradient(135deg, #ffeedb, #e0c3fc)',
  },

  // 9. Soft Matte
  {
    id: 'soft_matte',
    displayName: 'Soft Matte',
    description: 'Subtle crushed blacks with editorial flat response',
    category: 'noir',
    params: { contrast: 0.88, brightness: 1.08, saturate: 0.82, sepia: 0.08 },
    previewGradient: 'linear-gradient(135deg, #6c757d, #495057)',
  },

  // 10. Classic B&W
  {
    id: 'classic_bw',
    displayName: 'Classic B&W',
    description: 'Timeless balanced silver monochrome',
    category: 'noir',
    params: { contrast: 1.20, brightness: 1.02, grayscale: 1.0 },
    previewGradient: 'linear-gradient(135deg, #adb5bd, #212529)',
  },

  // 11. Retro 2000s
  {
    id: 'retro_2000s',
    displayName: 'Retro 2000s',
    description: 'Y2K compact digi-cam punch and vivid hues',
    category: 'film',
    params: { contrast: 1.22, brightness: 1.08, saturate: 1.35, hueRotate: 6 },
    previewGradient: 'linear-gradient(135deg, #ff007f, #00f0ff)',
  },

  // 12. Y2K Flash
  {
    id: 'y2k_flash',
    displayName: 'Y2K Flash',
    description: 'Direct party flash look with bold center pop',
    category: 'film',
    params: { contrast: 1.28, brightness: 1.16, saturate: 1.12 },
    previewGradient: 'linear-gradient(135deg, #ffffff, #ff0055)',
  },

  // 13. Disposable Camera
  {
    id: 'disposable_camera',
    displayName: 'Disposable Camera',
    description: 'Nostalgic 35mm plastic lens color shift',
    category: 'film',
    params: { contrast: 1.15, brightness: 1.05, saturate: 1.22, sepia: 0.22, hueRotate: -12 },
    previewGradient: 'linear-gradient(135deg, #e9c46a, #f4a261)',
  },

  // 14. Grainy Film
  {
    id: 'grainy_film',
    displayName: 'Grainy Film',
    description: 'Moody indie film grain texture and contrast',
    category: 'film',
    params: { contrast: 1.22, brightness: 0.98, saturate: 0.88, sepia: 0.16 },
    previewGradient: 'linear-gradient(135deg, #583101, #3a2202)',
  },

  // 15. Warm Sunset
  {
    id: 'warm_sunset',
    displayName: 'Warm Sunset',
    description: 'Rich amber glow like dusk golden rays',
    category: 'warm',
    params: { contrast: 1.08, brightness: 1.05, saturate: 1.30, sepia: 0.36, hueRotate: -15 },
    previewGradient: 'linear-gradient(135deg, #f77f00, #d62828)',
  },

  // 16. Milky White
  {
    id: 'milky_white',
    displayName: 'Milky White',
    description: 'High-key Korean clean porcelain glow',
    category: 'glow',
    params: { contrast: 0.88, brightness: 1.18, saturate: 0.76, sepia: 0.04 },
    previewGradient: 'linear-gradient(135deg, #f8f9fa, #dee2e6)',
  },

  // 17. Cinematic
  {
    id: 'cinematic',
    displayName: 'Cinematic',
    description: 'Blockbuster teal & orange color grade',
    category: 'film',
    params: { contrast: 1.25, brightness: 0.98, saturate: 1.16, sepia: 0.14, hueRotate: 16 },
    previewGradient: 'linear-gradient(135deg, #005f73, #ca6702)',
  },

  // 18. Dark Academia
  {
    id: 'dark_academia',
    displayName: 'Dark Academia',
    description: 'Moody espresso and antique mahogany tones',
    category: 'warm',
    params: { contrast: 1.20, brightness: 0.88, saturate: 0.72, sepia: 0.42 },
    previewGradient: 'linear-gradient(135deg, #3d2617, #1f140e)',
  },

  // 19. Golden Hour
  {
    id: 'golden_hour',
    displayName: 'Golden Hour',
    description: 'Radiant late afternoon sunbeam highlights',
    category: 'warm',
    params: { contrast: 1.08, brightness: 1.08, saturate: 1.32, sepia: 0.30, hueRotate: -10 },
    previewGradient: 'linear-gradient(135deg, #ffb703, #fb8500)',
  },

  // 20. Cloudy Day
  {
    id: 'cloudy_day',
    displayName: 'Cloudy Day',
    description: 'Calm overcast diffuse sky with soft blues',
    category: 'cool',
    params: { contrast: 0.94, brightness: 1.04, saturate: 0.80, hueRotate: 8 },
    previewGradient: 'linear-gradient(135deg, #8ecae6, #219ebc)',
  },

  // 21. Cherry Blossom
  {
    id: 'cherry_blossom',
    displayName: 'Cherry Blossom',
    description: 'Airy springtime sakura petal radiance',
    category: 'glow',
    params: { contrast: 1.02, brightness: 1.08, saturate: 1.20, sepia: 0.08, hueRotate: 332 },
    previewGradient: 'linear-gradient(135deg, #ffccd5, #ffb3c1)',
  },

  // 22. Pastel Dream
  {
    id: 'pastel_dream',
    displayName: 'Pastel Dream',
    description: 'Multi-toned candy dream pastel gradient',
    category: 'glow',
    params: { contrast: 0.96, brightness: 1.07, saturate: 1.16, sepia: 0.06, hueRotate: 300 },
    previewGradient: 'linear-gradient(135deg, #b8c0ff, #ffd6ff)',
  },

  // 23. Honey Glow
  {
    id: 'honey_glow',
    displayName: 'Honey Glow',
    description: 'Lustrous golden nectar warmth',
    category: 'warm',
    params: { contrast: 1.10, brightness: 1.06, saturate: 1.26, sepia: 0.32, hueRotate: -6 },
    previewGradient: 'linear-gradient(135deg, #e7c169, #be8b32)',
  },

  // 24. Rose Gold
  {
    id: 'rose_gold',
    displayName: 'Rose Gold',
    description: 'Chic metallic rose blush highlights',
    category: 'warm',
    params: { contrast: 1.06, brightness: 1.07, saturate: 1.20, sepia: 0.22, hueRotate: 338 },
    previewGradient: 'linear-gradient(135deg, #eaac8b, #e56b6f)',
  },

  // 25. Blue Hour
  {
    id: 'blue_hour',
    displayName: 'Blue Hour',
    description: 'Mysterious twilight cobalt and violet dusk',
    category: 'cool',
    params: { contrast: 1.14, brightness: 0.95, saturate: 0.94, sepia: 0.08, hueRotate: 42 },
    previewGradient: 'linear-gradient(135deg, #1d3557, #457b9d)',
  },

  // 26. Vintage Sepia
  {
    id: 'vintage_sepia',
    displayName: 'Vintage Sepia',
    description: 'Aged 19th century historical print patina',
    category: 'warm',
    params: { contrast: 1.12, brightness: 0.95, saturate: 0.78, sepia: 0.88 },
    previewGradient: 'linear-gradient(135deg, #704c38, #3b281d)',
  },

  // 27. Polaroid Film
  {
    id: 'polaroid_film',
    displayName: 'Polaroid Film',
    description: 'Faded instant camera shadows and nostalgic warmth',
    category: 'film',
    params: { contrast: 1.08, brightness: 1.06, saturate: 0.90, sepia: 0.18, hueRotate: 12 },
    previewGradient: 'linear-gradient(135deg, #d8e2dc, #ffe5d9)',
  },

  // 28. Retro VHS
  {
    id: 'retro_vhs',
    displayName: 'Retro VHS',
    description: 'Analog video tape chromatic saturation',
    category: 'film',
    params: { contrast: 1.18, brightness: 1.04, saturate: 1.32, hueRotate: -22 },
    previewGradient: 'linear-gradient(135deg, #7209b7, #f72585)',
  },

  // 29. Soft Focus
  {
    id: 'soft_focus',
    displayName: 'Soft Focus',
    description: 'Portrait studio silk glow diffusion',
    category: 'glow',
    params: { contrast: 0.88, brightness: 1.10, saturate: 1.05, blur: 0.35 },
    previewGradient: 'linear-gradient(135deg, #faedcd, #d4a373)',
  },

  // 30. Clean Studio
  {
    id: 'clean_studio',
    displayName: 'Clean Studio',
    description: 'Neutral commercial daylight studio balance',
    category: 'cool',
    params: { contrast: 1.06, brightness: 1.04, saturate: 1.02 },
    previewGradient: 'linear-gradient(135deg, #e9ecef, #adb5bd)',
  },

  // 31. Peachy Glow
  {
    id: 'peachy_glow',
    displayName: 'Peachy Glow',
    description: 'Radiant rosy peach summer luster',
    category: 'warm',
    params: { contrast: 1.05, brightness: 1.08, saturate: 1.24, sepia: 0.14, hueRotate: 350 },
    previewGradient: 'linear-gradient(135deg, #ffb5a7, #fcd5ce)',
  },

  // 32. Icy Blue
  {
    id: 'icy_blue',
    displayName: 'Icy Blue',
    description: 'Glacial crystal chill and clean frosty whites',
    category: 'cool',
    params: { contrast: 1.12, brightness: 1.06, saturate: 0.78, hueRotate: 26 },
    previewGradient: 'linear-gradient(135deg, #caf0f8, #48cae4)',
  },

  // 33. Matcha Green
  {
    id: 'matcha_green',
    displayName: 'Matcha Green',
    description: 'Serene organic tea greens and earthy calm',
    category: 'cool',
    params: { contrast: 1.06, brightness: 1.02, saturate: 0.88, sepia: 0.14, hueRotate: 55 },
    previewGradient: 'linear-gradient(135deg, #588157, #3a5a40)',
  },

  // 34. Mocha Brown
  {
    id: 'mocha_brown',
    displayName: 'Mocha Brown',
    description: 'Dark roasted coffee warmth and caramel shadows',
    category: 'warm',
    params: { contrast: 1.15, brightness: 0.92, saturate: 0.82, sepia: 0.44, hueRotate: -12 },
    previewGradient: 'linear-gradient(135deg, #4a3525, #241911)',
  },

  // 35. Dreamy Lavender
  {
    id: 'dreamy_lavender',
    displayName: 'Dreamy Lavender',
    description: 'Twilight purple haze with fairytale dreaminess',
    category: 'glow',
    params: { contrast: 0.98, brightness: 1.07, saturate: 1.12, sepia: 0.10, hueRotate: 260 },
    previewGradient: 'linear-gradient(135deg, #dec0f1, #9a8c98)',
  },

  // 36. Faded Memories
  {
    id: 'faded_memories',
    displayName: 'Faded Memories',
    description: 'Washed out sun-drenched vintage paper look',
    category: 'film',
    params: { contrast: 0.84, brightness: 1.14, saturate: 0.68, sepia: 0.16 },
    previewGradient: 'linear-gradient(135deg, #e3d5ca, #d6ccc2)',
  },

  // 37. Flashback 90s
  {
    id: 'flashback_90s',
    displayName: 'Flashback 90s',
    description: 'Glossy 90s fashion magazine print saturation',
    category: 'film',
    params: { contrast: 1.26, brightness: 1.04, saturate: 1.30, hueRotate: -5 },
    previewGradient: 'linear-gradient(135deg, #e63946, #457b9d)',
  },

  // 38. Film Noir
  {
    id: 'film_noir',
    displayName: 'Film Noir',
    description: 'Dramatic low-key monochrome with pitch blacks',
    category: 'noir',
    params: { contrast: 1.48, brightness: 0.94, grayscale: 1.0 },
    previewGradient: 'linear-gradient(135deg, #495057, #000000)',
  },

  // 39. Summer Breeze
  {
    id: 'summer_breeze',
    displayName: 'Summer Breeze',
    description: 'Golden sunshine warmth and ocean vividness',
    category: 'cool',
    params: { contrast: 1.10, brightness: 1.08, saturate: 1.25, hueRotate: 4 },
    previewGradient: 'linear-gradient(135deg, #00b4d8, #ffb703)',
  },

  // 40. Porcelain Skin
  {
    id: 'porcelain_skin',
    displayName: 'Porcelain Skin',
    description: 'Luminous K-beauty glow with pure flawless tone',
    category: 'glow',
    params: { contrast: 0.96, brightness: 1.15, saturate: 0.92, sepia: 0.05 },
    previewGradient: 'linear-gradient(135deg, #fff0f5, #fceade)',
  },
]

// Legacy aliases mapping for backwards compatibility
const LEGACY_ALIASES: Record<string, string> = {
  mono: 'classic_bw',
  haruBlue: 'cool_seoul',
  warmFilm: 'warm_sunset',
}

/**
 * Returns a CSS filter string for a given filter ID and intensity (0.0 to 1.0).
 * Supports both DOM CSS and Canvas 2D ctx.filter.
 */
export function getCssFilter(filterId: string, intensity: number = 1.0): string {
  // If no filter or intensity is 0, return 'none'
  if (!filterId || filterId === 'none' || intensity <= 0) {
    return 'none'
  }

  // Resolve legacy alias if present
  const resolvedId = LEGACY_ALIASES[filterId] || filterId
  const filter = PHOTO_FILTERS.find(f => f.id === resolvedId)

  if (!filter || !filter.params || Object.keys(filter.params).length === 0) {
    return 'none'
  }

  const p = filter.params
  const clampedIntensity = Math.max(0, Math.min(1, intensity))

  // Interpolate parameters from baseline (1.0 or 0.0) towards target
  const parts: string[] = []

  if (p.contrast !== undefined && p.contrast !== 1.0) {
    const val = 1.0 + (p.contrast - 1.0) * clampedIntensity
    parts.push(`contrast(${Math.round(val * 100)}%)`)
  }

  if (p.brightness !== undefined && p.brightness !== 1.0) {
    const val = 1.0 + (p.brightness - 1.0) * clampedIntensity
    parts.push(`brightness(${Math.round(val * 100)}%)`)
  }

  if (p.saturate !== undefined && p.saturate !== 1.0) {
    const val = 1.0 + (p.saturate - 1.0) * clampedIntensity
    parts.push(`saturate(${Math.round(val * 100)}%)`)
  }

  if (p.sepia && p.sepia > 0) {
    const val = p.sepia * clampedIntensity
    parts.push(`sepia(${Math.round(val * 100)}%)`)
  }

  if (p.grayscale && p.grayscale > 0) {
    const val = p.grayscale * clampedIntensity
    parts.push(`grayscale(${Math.round(val * 100)}%)`)
  }

  if (p.hueRotate && p.hueRotate !== 0) {
    const val = p.hueRotate * clampedIntensity
    parts.push(`hue-rotate(${Math.round(val)}deg)`)
  }

  if (p.blur && p.blur > 0) {
    const val = p.blur * clampedIntensity
    parts.push(`blur(${val.toFixed(2)}px)`)
  }

  return parts.length > 0 ? parts.join(' ') : 'none'
}
