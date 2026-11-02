import { describe, it, expect } from 'vitest'
import { BUNDLED_FRAMES, getFrameById, getFramesByCategory } from '../src/core/frames'
import { KOREAN_STAMPS } from '../src/core/stamps'
import { AppConstants } from '../src/core/constants'
import { LayoutType, PrintFormat, PhotoFilter } from '../src/core/types'

describe('Domain Models & Synchronization Tests', () => {
  it('bundles all 76 synchronized photobooth frames (36 original + 40 Christmas)', () => {
    expect(BUNDLED_FRAMES).toHaveLength(76)
  })

  it('contains all 16 creative Korean-style photobooth frames', () => {
    const creativeIds = [
      'pastel_dream',
      'cherry_blossom',
      'y2k_cyber',
      'retro_film',
      'strawberry_milk',
      'midnight_galaxy',
      'summer_splash',
      'wildflower',
      'editorial_bw',
      'holographic_party',
      'photoism_highkey',
      'monomansion_kraft',
      'haru_cloud',
      'matcha_latte',
      'teddy_bear',
      'analog_1998',
    ]

    for (const id of creativeIds) {
      const frame = getFrameById(id)
      expect(frame, `Frame ${id} should exist`).toBeDefined()
      expect(frame?.koreanTitle.length).toBeGreaterThan(0)
    }
  })

  it('provides all 6 authentic Korean stamps', () => {
    expect(KOREAN_STAMPS).toHaveLength(6)
    expect(KOREAN_STAMPS.map(s => s.text)).toContain('Best Shot 👑')
    expect(KOREAN_STAMPS.map(s => s.text)).toContain('Us Today ✨')
  })

  it('defines 4-Cut and balanced 6-Cut geometries with zero dead space', () => {
    expect(AppConstants.stripWidth).toBe(1200)
    expect(AppConstants.stripHeight).toBe(3600)

    // 4-Cut dimensions
    expect(AppConstants.fourCutSlotWidth).toBe(1040)
    expect(AppConstants.fourCutSlotHeight).toBe(720)
    expect(AppConstants.fourCutMarginTop + 4 * (720 + 40)).toBeLessThan(3200)

    // 6-Cut dimensions (2 columns x 3 rows)
    expect(AppConstants.sixCutSlotWidth).toBe(500)
    expect(AppConstants.sixCutSlotHeight).toBe(950)
    expect(AppConstants.sixCutMarginTop).toBe(130)
    // 3 rows: 130 + 3 * 950 + 2 * 40 = 130 + 2850 + 80 = 3060px
    const endY = AppConstants.sixCutMarginTop + 3 * AppConstants.sixCutSlotHeight + 2 * AppConstants.sixCutGutterY
    expect(endY).toBe(3060)
  })

  it('defines correct layout slot and burst counts', () => {
    expect(LayoutType.fourCut.slotCount).toBe(4)
    expect(LayoutType.fourCut.burstCount).toBe(4)

    expect(LayoutType.sixCut.slotCount).toBe(6)
    expect(LayoutType.sixCut.burstCount).toBe(6)
  })
})
