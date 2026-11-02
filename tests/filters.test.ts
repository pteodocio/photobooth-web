import { describe, it, expect } from 'vitest'
import { PHOTO_FILTERS, getCssFilter, FILTER_CATEGORIES } from '../src/core/filters'

describe('Photo Filters Engine Tests', () => {
  it('bundles all 40 distinct photo filters plus the original none option', () => {
    // 40 filters + 1 none
    expect(PHOTO_FILTERS).toHaveLength(41)
    const filterIds = PHOTO_FILTERS.map(f => f.id)
    const uniqueIds = new Set(filterIds)
    expect(uniqueIds.size).toBe(41)
  })

  it('includes all 40 user-specified filter names', () => {
    const requiredNames = [
      'Seoul Film',
      'Vintage Kodak',
      'Fuji Film',
      'Pink Milk',
      'Cool Seoul',
      'Lavender Dream',
      'Peach Cream',
      'Dreamy Glow',
      'Soft Matte',
      'Classic B&W',
      'Retro 2000s',
      'Y2K Flash',
      'Disposable Camera',
      'Grainy Film',
      'Warm Sunset',
      'Milky White',
      'Cinematic',
      'Dark Academia',
      'Golden Hour',
      'Cloudy Day',
      'Cherry Blossom',
      'Pastel Dream',
      'Honey Glow',
      'Rose Gold',
      'Blue Hour',
      'Vintage Sepia',
      'Polaroid Film',
      'Retro VHS',
      'Soft Focus',
      'Clean Studio',
      'Peachy Glow',
      'Icy Blue',
      'Matcha Green',
      'Mocha Brown',
      'Dreamy Lavender',
      'Faded Memories',
      'Flashback 90s',
      'Film Noir',
      'Summer Breeze',
      'Porcelain Skin',
    ]

    for (const name of requiredNames) {
      const found = PHOTO_FILTERS.find(f => f.displayName === name)
      expect(found, `Filter ${name} should be present in PHOTO_FILTERS`).toBeDefined()
    }
  })

  it('returns none when filter is none or intensity is 0', () => {
    expect(getCssFilter('none', 1)).toBe('none')
    expect(getCssFilter('seoul_film', 0)).toBe('none')
    expect(getCssFilter('vintage_kodak', 0)).toBe('none')
  })

  it('computes full CSS filter string at intensity 1.0', () => {
    const seoulFilter = getCssFilter('seoul_film', 1)
    expect(seoulFilter).not.toBe('none')
    expect(seoulFilter).toContain('contrast')
    expect(seoulFilter).toContain('brightness')
  })

  it('interpolates filter parameters smoothly at partial intensity', () => {
    const halfFilter = getCssFilter('vintage_kodak', 0.5)
    const fullFilter = getCssFilter('vintage_kodak', 1.0)
    expect(halfFilter).not.toBe('none')
    expect(halfFilter).not.toBe(fullFilter)
  })

  it('supports legacy filter aliases (mono, haruBlue, warmFilm)', () => {
    expect(getCssFilter('mono', 1)).toContain('grayscale')
    expect(getCssFilter('haruBlue', 1)).toContain('hue-rotate')
    expect(getCssFilter('warmFilm', 1)).toContain('sepia')
  })

  it('defines structured categories for fast browsing', () => {
    expect(FILTER_CATEGORIES.length).toBeGreaterThanOrEqual(5)
    for (const cat of FILTER_CATEGORIES) {
      expect(cat.id).toBeDefined()
      expect(cat.name).toBeDefined()
    }
  })
})
