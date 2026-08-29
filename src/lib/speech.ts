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

/** Fait lire un texte à voix haute (mis en file après tout texte déjà en cours). Ne fait rien si désactivé. */
export function speak(text: string): void {
  if (!isSpeechEnabled() || !('speechSynthesis' in window) || !text) return
  try {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'fr-FR'
    const voice = pickFrenchVoice()
    if (voice) utterance.voice = voice
    window.speechSynthesis.speak(utterance)
  } catch {
    // Synthèse vocale indisponible sur ce navigateur : on l'ignore simplement.
  }
}

export function stopSpeaking(): void {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
}
