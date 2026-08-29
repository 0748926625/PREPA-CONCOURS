const DEVICE_ID_KEY = 'prepa-concours:device-id'
const LICENSE_KEY_KEY = 'prepa-concours:license-key'
const TRIAL_USED_MS_KEY = 'prepa-concours:trial-used-ms'

export const TRIAL_DURATION_MS = 7 * 60 * 1000
export const CONTACT_PHONE_DISPLAY = '+225 07 48 92 66 25'
export const CONTACT_PHONE_TEL_URL = 'tel:+2250748926625'
export const CONTACT_WHATSAPP_URL = 'https://wa.me/225748926625'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(DEVICE_ID_KEY, id)
  }
  return id
}

export function getStoredLicenseKey(): string | null {
  return localStorage.getItem(LICENSE_KEY_KEY)
}

function storeLicenseKey(key: string): void {
  localStorage.setItem(LICENSE_KEY_KEY, key)
}

export type LicenseCheckResult = 'valid' | 'invalid' | 'error'

/**
 * Vérifie une clé auprès de Supabase (RPC activate_license, appelée directement en REST — inutile
 * d'embarquer tout le SDK @supabase/supabase-js pour un seul appel) et l'active sur cet appareil
 * si c'est sa première utilisation.
 */
export async function checkLicense(key: string): Promise<LicenseCheckResult> {
  if (!supabaseUrl || !supabaseAnonKey) return 'error' // licence non configurée : on ne bloque pas l'app

  const trimmed = key.trim()
  if (!trimmed) return 'invalid'

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/activate_license`, {
      method: 'POST',
      headers: {
        apikey: supabaseAnonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ license_key: trimmed, device: getDeviceId() }),
    })
    if (!res.ok) return 'error'
    const data = await res.json()
    if (data === true) {
      storeLicenseKey(trimmed)
      return 'valid'
    }
    return 'invalid'
  } catch {
    return 'error'
  }
}

export function isLicenseConfigured(): boolean {
  return !!supabaseUrl && !!supabaseAnonKey
}

/** Temps d'essai déjà consommé (ms) — uniquement pendant que l'app était réellement active/visible. */
export function getTrialUsedMs(): number {
  return Number(localStorage.getItem(TRIAL_USED_MS_KEY) ?? '0')
}

/** Ajoute du temps d'usage effectif au compteur d'essai et retourne le total mis à jour. */
export function addTrialUsedMs(ms: number): number {
  const updated = getTrialUsedMs() + ms
  localStorage.setItem(TRIAL_USED_MS_KEY, String(updated))
  return updated
}

/** Temps d'essai restant en ms (0 si épuisé), basé sur l'usage effectif, pas l'horloge murale. */
export function getTrialRemainingMs(): number {
  return Math.max(0, TRIAL_DURATION_MS - getTrialUsedMs())
}

export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
