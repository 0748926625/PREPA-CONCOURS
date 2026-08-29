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

/** Lit un texte à voix haute ; se résout une fois la lecture terminée (immédiatement si désactivé/indisponible). */
export function speak(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!isSpeechEnabled() || !('speechSynthesis' in window) || !text) {
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

/** Lit plusieurs textes l'un après l'autre ; se résout quand le dernier est terminé. */
export async function speakSequence(texts: string[]): Promise<void> {
  for (const text of texts) {
    await speak(text)
  }
}

export function stopSpeaking(): void {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
}
