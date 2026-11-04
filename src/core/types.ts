export type FrameThemeStyle = string

export interface FrameTemplate {
  id: string
  name: string
  category: string
  backgroundColor: string // Hex '#121212' or CSS color
  captionColor: string // Hex '#FFFFFF'
  gradientColors: string[] // List of hex colors for multi-stop gradient
  themeStyle: FrameThemeStyle
  koreanTitle: string
  englishTitle: string
  slotBorderColor: string
  slotBorderWidth: number
  slotCornerRadius: number
}

export interface LayoutTypeConfig {
  id: 'fourCut' | 'sixCut' | 'single'
  displayName: string
  slotCount: number
  burstCount: number
  aspectRatio: number
}

export const LayoutType = {
  fourCut: {
    id: 'fourCut',
    displayName: '4-Cut',
    slotCount: 4,
    burstCount: 4,
    aspectRatio: 4 / 3,
  } as LayoutTypeConfig,
  sixCut: {
    id: 'sixCut',
    displayName: '6-Cut',
    slotCount: 6,
    burstCount: 6,
    aspectRatio: 4 / 3,
  } as LayoutTypeConfig,
  single: {
    id: 'single',
    displayName: 'Single',
    slotCount: 1,
    burstCount: 1,
    aspectRatio: 3 / 4,
  } as LayoutTypeConfig,
} as const

export interface PrintFormatConfig {
  id: 'singleStrip' | 'twinStrip'
  displayName: string
  canvasWidth: number
  canvasHeight: number
  aspectRatio: number
}

export const PrintFormat = {
  singleStrip: {
    id: 'singleStrip',
    displayName: 'Single Strip',
    canvasWidth: 1200,
    canvasHeight: 3600,
    aspectRatio: 1 / 3,
  } as PrintFormatConfig,
  twinStrip: {
    id: 'twinStrip',
    displayName: 'Twin Strip (1+1)',
    canvasWidth: 2400,
    canvasHeight: 3600,
    aspectRatio: 2 / 3,
  } as PrintFormatConfig,
} as const

export type PhotoFilter = string

export type CountdownDuration = 3 | 5 | 10

export interface CountdownOption {
  seconds: CountdownDuration
  label: string
  description: string
  recommendedFor: string
  estimatedBtsDuration: string
}

export const COUNTDOWN_OPTIONS: CountdownOption[] = [
  {
    seconds: 3,
    label: '3 Seconds',
    description: 'Quick and easy poses.',
    recommendedFor: 'Fast paced & candid',
    estimatedBtsDuration: '3s BTS video',
  },
  {
    seconds: 5,
    label: '5 Seconds',
    description: 'Enough time to prepare.',
    recommendedFor: 'Balanced & natural',
    estimatedBtsDuration: '5s BTS video',
  },
  {
    seconds: 10,
    label: '10 Seconds',
    description: 'More time for creative poses.',
    recommendedFor: 'Group poses & creative setup',
    estimatedBtsDuration: '10s BTS video',
  },
]

export interface FilterOption {
  id: PhotoFilter
  displayName: string
  description: string
  cssFilter?: string
  category?: string
}

export interface StampItem {
  id: string
  text: string
  category: string
}

export interface CapturedPhoto {
  id: string
  index: number
  dataUrl: string
  timestamp: number
  btsClipUrl?: string
}

export interface CompositeJob {
  photoDataUrls: string[]
  frame: FrameTemplate
  layout: LayoutTypeConfig
  printFormat: PrintFormatConfig
  filter: PhotoFilter
  filterIntensity?: number
  stampText: string
  dateString: string
  studioWatermark: string
  qrData?: string
  passcode?: string
  btsClips?: string[]
}

export type BoothSessionStatus =
  | 'idle'
  | 'filterSelect'
  | 'frameSelect'
  | 'cameraPrep'
  | 'countdown'
  | 'capturing'
  | 'contactSheet'
  | 'exportReady'
