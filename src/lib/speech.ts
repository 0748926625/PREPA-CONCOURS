// Lecture vocale (Web Speech API) — question, appréciation, commentaire lus à voix haute.

const ENABLED_KEY = 'prepa-concours:tts-enabled'

export function isSpeechEnabled(): boolean {
  const stored = localStorage.getItem(ENABLED_KEY)
  return stored === null ? true : stored === 'true'
}

export function setSpeechEnabled(enabled: boolean): void {
  localStorage.setItem(ENABLED_KEY, String(enabled))
}

function pickFrenchVoice(): SpeechSynthesisVoice | undefined {
  return window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith('fr'))
}

// Incrémenté à chaque stopSpeaking() : permet à une séquence en cours (question + explication)
// de savoir qu'elle a été annulée et de ne pas enchaîner sur le texte suivant — sans quoi, une
// fois l'utterance en cours coupée par cancel(), speakSequence() continuait avec le texte suivant
// (ex. l'explication) et le faisait parler par-dessus la question suivante déjà lancée (§ chevauchement).
let generation = 0

/** Lit un texte à voix haute ; se résout une fois la lecture terminée (immédiatement si désactivé/indisponible/annulé). */
export function speak(text: string): Promise<void> {
  const myGeneration = generation
  return new Promise((resolve) => {
    if (!isSpeechEnabled() || !('speechSynthesis' in window) || !text || myGeneration !== generation) {
      resolve()
      return
    }
    try {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'fr-FR'
      const voice = pickFrenchVoice()
      if (voice) utterance.voice = voice
      utterance.onend = () => resolve()
      utterance.onerror = () => resolve()
      window.speechSynthesis.speak(utterance)
    } catch {
      resolve()
    }
  })
}

/** Lit plusieurs textes l'un après l'autre ; s'arrête sans enchaîner si stopSpeaking() l'interrompt en route. */
export async function speakSequence(texts: string[]): Promise<void> {
  const myGeneration = generation
  for (const text of texts) {
    if (myGeneration !== generation) return
    await speak(text)
  }
}

export function stopSpeaking(): void {
  generation++
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
}
