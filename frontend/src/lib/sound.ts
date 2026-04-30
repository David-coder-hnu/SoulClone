export type SoundName =
  | 'page-transition'
  | 'send-message'
  | 'receive-message'
  | 'match'
  | 'error'
  | 'toggle-on'

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  return audioCtx
}

function isEnabled(): boolean {
  return localStorage.getItem('soulclone-sound-enabled') !== 'false'
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  gain = 0.08,
  delay = 0
) {
  if (!isEnabled()) return
  const ctx = getAudioContext()
  const osc = ctx.createOscillator()
  const gainNode = ctx.createGain()

  osc.type = type
  osc.frequency.setValueAtTime(frequency, ctx.currentTime + delay)

  gainNode.gain.setValueAtTime(gain, ctx.currentTime + delay)
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration)

  osc.connect(gainNode)
  gainNode.connect(ctx.destination)

  osc.start(ctx.currentTime + delay)
  osc.stop(ctx.currentTime + delay + duration)
}

function playChime(frequencies: number[], duration: number, gain = 0.06) {
  if (!isEnabled()) return
  frequencies.forEach((freq, i) => {
    playTone(freq, duration, 'sine', gain, i * 0.05)
  })
}

function playNoiseSweep(duration: number, gain = 0.03) {
  if (!isEnabled()) return
  const ctx = getAudioContext()
  const bufferSize = ctx.sampleRate * duration
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)

  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1
  }

  const source = ctx.createBufferSource()
  source.buffer = buffer

  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(800, ctx.currentTime)
  filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + duration)

  const gainNode = ctx.createGain()
  gainNode.gain.setValueAtTime(gain, ctx.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

  source.connect(filter)
  filter.connect(gainNode)
  gainNode.connect(ctx.destination)
  source.start()
}

const soundMap: Record<SoundName, () => void> = {
  'page-transition': () => playNoiseSweep(0.08, 0.025),
  'send-message': () => playTone(523, 0.06, 'sine', 0.06),
  'receive-message': () => playChime([659, 784], 0.12, 0.05),
  'match': () => playChime([523, 659, 784], 0.3, 0.06),
  'error': () => playTone(150, 0.15, 'sawtooth', 0.04),
  'toggle-on': () => {
    const ctx = getAudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(300, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1)
    gain.gain.setValueAtTime(0.05, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.1)
  },
}

export function playSound(name: SoundName) {
  try {
    soundMap[name]?.()
  } catch {
    // Audio errors are non-critical
  }
}

export function setSoundEnabled(enabled: boolean) {
  localStorage.setItem('soulclone-sound-enabled', String(enabled))
}

export function getSoundEnabled(): boolean {
  return isEnabled()
}

export function initAudioContext() {
  // Call this on first user interaction to satisfy browser autoplay policy
  try {
    getAudioContext().resume()
  } catch {
    // ignore
  }
}
