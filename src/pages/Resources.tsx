export default function Resources() {
  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Mes ressources</h1>
        <button className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white">
          + Ajouter
        </button>
      </header>

      <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
        Aucune ressource pour le moment.
        <br />
        Ajoutez un PDF ou un texte pour générer vos premiers QCM.
      </div>
    </div>
  )
}
