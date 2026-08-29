export type AiProvider = 'gemini' | 'openai'

export type AiSettings = {
  provider: AiProvider
  apiKey: string
}

const STORAGE_KEY = 'prepa-concours:ai-settings'

const DEFAULT_SETTINGS: AiSettings = { provider: 'gemini', apiKey: '' }

export function getAiSettings(): AiSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveAiSettings(settings: AiSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

export function hasAiKey(): boolean {
  return getAiSettings().apiKey.trim().length > 0
}
