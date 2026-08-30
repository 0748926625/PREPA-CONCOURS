import { db } from './db'

const INSTALLED_FLAG_FP = 'prepa-concours:seed-fp-installed'
const INSTALLED_FLAG_INFAS = 'prepa-concours:seed-infas-installed'
const INSTALLED_FLAG_INFAS_BAC = 'prepa-concours:seed-infas-bac-installed'
const RENAME_FLAG_INFAS_BEPC = 'prepa-concours:rename-infas-bepc-2026-08-30'

/**
 * Installe une fois les sujets par défaut (contenu déjà analysé et QCM déjà générés) pour que
 * l'app soit utile dès la première visite, sans clé API. Chaque sujet a son propre drapeau
 * d'installation : un utilisateur qui a déjà le premier sujet reçoit quand même les suivants
 * ajoutés plus tard. Si l'utilisateur supprime un sujet par défaut, il ne revient pas.
 */
export async function ensureDefaultContent(): Promise<void> {
  await installSeedOnce(INSTALLED_FLAG_FP, async () => {
    const { getSeedFonctionPublique } = await import('../data/seedFonctionPublique')
    return getSeedFonctionPublique()
  })

  await installSeedOnce(INSTALLED_FLAG_INFAS, async () => {
    const { getSeedInfasAuxiliaireSante } = await import('../data/seedInfasAuxiliaireSante')
    return getSeedInfasAuxiliaireSante()
  })

  await installSeedOnce(INSTALLED_FLAG_INFAS_BAC, async () => {
    const { getSeedInfasBac } = await import('../data/seedInfasBac')
    return getSeedInfasBac()
  })

  await renameInfasAuxiliaireSanteTitle()
}

/** Corrige le titre du sujet INFAS Auxiliaire de Santé déjà installé (rebaptisé "Niveau BEPC" après coup). */
async function renameInfasAuxiliaireSanteTitle(): Promise<void> {
  if (localStorage.getItem(RENAME_FLAG_INFAS_BEPC)) return
  await db.resources
    .where('id')
    .equals('seed-infas-auxiliaire-sante-2026')
    .modify({ title: 'Concours INFAS Auxiliaire de Santé — Niveau BEPC QCM' })
  localStorage.setItem(RENAME_FLAG_INFAS_BEPC, 'true')
}

async function installSeedOnce(
  installedFlag: string,
  loadSeed: () => Promise<Awaited<ReturnType<typeof import('../data/seedFonctionPublique').getSeedFonctionPublique>>>,
): Promise<void> {
  if (localStorage.getItem(installedFlag)) return

  const { resource, topics, questions } = await loadSeed()

  const existing = await db.resources.get(resource.id)
  if (!existing) {
    await db.transaction('rw', db.resources, db.topics, db.questions, async () => {
      await db.resources.add(resource)
      await db.topics.bulkAdd(topics)
      await db.questions.bulkAdd(questions)
    })
  }

  localStorage.setItem(installedFlag, 'true')
}
