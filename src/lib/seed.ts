import { db } from './db'

const INSTALLED_FLAG_FP = 'prepa-concours:seed-fp-installed'
const INSTALLED_FLAG_INFAS = 'prepa-concours:seed-infas-installed'
const INSTALLED_FLAG_INFAS_BAC = 'prepa-concours:seed-infas-bac-installed'

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
