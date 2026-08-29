import { db } from './db'

const INSTALLED_FLAG = 'prepa-concours:seed-fp-installed'

/**
 * Installe une fois le contenu par défaut (Statut général de la Fonction Publique, déjà analysé
 * et avec ses QCM générés) pour que l'app soit utile dès la première visite, sans clé API.
 * N'insère qu'une seule fois : si l'utilisateur supprime cette ressource, elle ne revient pas.
 */
export async function ensureDefaultContent(): Promise<void> {
  if (localStorage.getItem(INSTALLED_FLAG)) return

  const { getSeedFonctionPublique } = await import('../data/seedFonctionPublique')
  const { resource, topics, questions } = getSeedFonctionPublique()

  const existing = await db.resources.get(resource.id)
  if (!existing) {
    await db.transaction('rw', db.resources, db.topics, db.questions, async () => {
      await db.resources.add(resource)
      await db.topics.bulkAdd(topics)
      await db.questions.bulkAdd(questions)
    })
  }

  localStorage.setItem(INSTALLED_FLAG, 'true')
}
