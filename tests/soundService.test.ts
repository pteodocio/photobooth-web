import { describe, it, expect } from 'vitest'
import { sound } from '../src/services/soundService'

describe('SoundService Tactile Audio Tests', () => {
  it('safely handles audio synthesis without throwing in headless environment', () => {
    expect(() => {
      sound.playShutterSound()
      sound.playCountdownBeep(false)
      sound.playCountdownBeep(true)
      sound.playClick()
      sound.playPrinterWhirr()
    }).not.toThrow()
  })
})
