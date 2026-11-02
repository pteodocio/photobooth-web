// Web Audio API tactile studio sound synthesizer (zero external dependencies)
class SoundService {
  private ctx: AudioContext | null = null

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
    return this.ctx
  }

  // Realistic mechanical camera shutter sound (dual curtain click)
  playShutterSound() {
    try {
      const ctx = this.getContext()
      if (!ctx) return

      const now = ctx.currentTime

      // First curtain slap (low mechanical click)
      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()
      osc1.type = 'triangle'
      osc1.frequency.setValueAtTime(320, now)
      osc1.frequency.exponentialRampToValueAtTime(40, now + 0.04)

      gain1.gain.setValueAtTime(0.35, now)
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.04)

      osc1.connect(gain1)
      gain1.connect(ctx.destination)
      osc1.start(now)
      osc1.stop(now + 0.04)

      // Shutter snap burst (filtered noise)
      const bufferSize = ctx.sampleRate * 0.06
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2))
      }

      const noise = ctx.createBufferSource()
      noise.buffer = buffer
      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.value = 1800
      filter.Q.value = 3

      const noiseGain = ctx.createGain()
      noiseGain.gain.setValueAtTime(0.4, now)
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)

      noise.connect(filter)
      filter.connect(noiseGain)
      noiseGain.connect(ctx.destination)
      noise.start(now)

      // Second curtain return click (0.06s later)
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.type = 'square'
      osc2.frequency.setValueAtTime(240, now + 0.06)
      osc2.frequency.exponentialRampToValueAtTime(60, now + 0.1)

      gain2.gain.setValueAtTime(0.25, now + 0.06)
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.1)

      osc2.connect(gain2)
      gain2.connect(ctx.destination)
      osc2.start(now + 0.06)
      osc2.stop(now + 0.1)
    } catch {
      // Audio not permitted or unavailable
    }
  }

  // Studio countdown beep
  playCountdownBeep(isFinal = false) {
    try {
      const ctx = this.getContext()
      if (!ctx) return

      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(isFinal ? 1200 : 880, now)

      gain.gain.setValueAtTime(0.15, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + (isFinal ? 0.2 : 0.08))

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + (isFinal ? 0.2 : 0.08))
    } catch {
      // Audio not permitted or unavailable
    }
  }

  // Tactile click on button press
  playClick() {
    try {
      const ctx = this.getContext()
      if (!ctx) return

      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(400, now)
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.02)

      gain.gain.setValueAtTime(0.12, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.02)
    } catch {
      // Audio not permitted or unavailable
    }
  }

  // Mechanical printer stepper whirr when strip dispenses
  playPrinterWhirr() {
    try {
      const ctx = this.getContext()
      if (!ctx) return

      const now = ctx.currentTime
      const duration = 0.8

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(140, now)
      osc.frequency.linearRampToValueAtTime(180, now + duration * 0.5)
      osc.frequency.linearRampToValueAtTime(120, now + duration)

      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 600

      gain.gain.setValueAtTime(0.06, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + duration)
    } catch {
      // Audio not permitted or unavailable
    }
  }
}

export const sound = new SoundService()
