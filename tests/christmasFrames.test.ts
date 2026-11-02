import { describe, it, expect } from 'vitest'
import { CHRISTMAS_FRAMES } from '../src/core/christmasFrames'
import { BUNDLED_FRAMES } from '../src/core/frames'

describe('Christmas Frames Suite Tests', () => {
  it('bundles exactly 40 unique Christmas frames', () => {
    expect(CHRISTMAS_FRAMES).toHaveLength(40)
    const ids = CHRISTMAS_FRAMES.map(f => f.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(40)
  })

  it('assigns all frames to the Christmas category', () => {
    for (const frame of CHRISTMAS_FRAMES) {
      expect(frame.category).toBe('Christmas')
      expect(frame.slotBorderColor).toBeDefined()
      expect(frame.captionColor).toBeDefined()
      expect(frame.backgroundColor).toBeDefined()
    }
  })

  it('includes all 40 user-specified Christmas frame titles', () => {
    const requiredNames = [
      'Classic Christmas',
      'Christmas Wonderland',
      "Santa's Workshop",
      'Snowy December',
      'Gingerbread House',
      'Candy Cane',
      'Red & Green',
      'Cozy Christmas',
      'Pink Christmas',
      'Blue Snowfall',
      'Christmas Ribbon',
      'Holly & Berries',
      'Reindeer Friends',
      'Christmas Tree',
      'Winter Village',
      'Snowflake Dreams',
      'Merry & Bright',
      'Christmas Cookies',
      'Gift Wrapped',
      'Golden Christmas',
      'Frosted Window',
      'Peppermint Candy',
      'Nordic Christmas',
      'Christmas Lights',
      'Nutcracker',
      'Polar Bear Christmas',
      'Vintage Christmas Postcard',
      'Christmas Sweater',
      'Midnight Christmas',
      'Kawaii Christmas',
      'Snowman Party',
      'Christmas Stockings',
      'Cozy Fireplace',
      'Starry Christmas Night',
      'Pink Ribbon Christmas',
      'Christmas Market',
      'Winter Wonderland',
      'Gingerbread Friends',
      'Holly Jolly',
      'December Memories',
    ]

    for (const name of requiredNames) {
      const found = CHRISTMAS_FRAMES.find(f => f.name === name)
      expect(found, `Frame '${name}' must exist in CHRISTMAS_FRAMES`).toBeDefined()
    }
  })

  it('expands total BUNDLED_FRAMES library to 76 frames', () => {
    expect(BUNDLED_FRAMES).toHaveLength(76)
    const christmasCategoryFrames = BUNDLED_FRAMES.filter(f => f.category === 'Christmas')
    expect(christmasCategoryFrames).toHaveLength(40)
  })
})
