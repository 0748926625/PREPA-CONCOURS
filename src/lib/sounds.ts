// Effets sonores générés à la volée (Web Audio API), sans fichier audio à embarquer.

let ctx: AudioContext | null = null

function getContext(): AudioContext | null {
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null // Web Audio indisponible : on n'émet simplement aucun son.
  }
}

function tone(frequency: number, startOffset: number, duration: number, volume = 0.15) {
  const audio = getContext()
  if (!audio) return
  const oscillator = audio.createOscillator()
  const gain = audio.createGain()
  oscillator.type = 'sine'
  oscillator.frequency.value = frequency
  const startAt = audio.currentTime + startOffset
  gain.gain.setValueAtTime(0, startAt)
  gain.gain.linearRampToValueAtTime(volume, startAt + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)
  oscillator.connect(gain)
  gain.connect(audio.destination)
  oscillator.start(startAt)
  oscillator.stop(startAt + duration)
}

/** Clic léger à la sélection d'une réponse. */
export function playClick() {
  tone(700, 0, 0.06, 0.08)
}

/** Réponse correcte : ding franc et net. */
export function playCorrect() {
  tone(880, 0, 0.1, 0.12)
  tone(1175, 0.08, 0.18, 0.1)
}

/** Réponse incorrecte : tonalité basse et courte, pas agressive. */
export function playIncorrect() {
  tone(220, 0, 0.14, 0.12)
  tone(185, 0.1, 0.18, 0.1)
}

/** Petit carillon ascendant pour une bonne performance. */
export function playSuccess() {
  tone(523, 0, 0.12) // do
  tone(659, 0.1, 0.12) // mi
  tone(784, 0.2, 0.2) // sol
}

/** Tonalité neutre, plus basse, quand le score est faible — encourageante, pas punitive. */
export function playSoft() {
  tone(392, 0, 0.15) // sol
  tone(330, 0.12, 0.25) // mi
}
