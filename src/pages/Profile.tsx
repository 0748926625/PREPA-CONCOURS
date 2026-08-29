import { useAuth } from '../lib/AuthContext'

export default function Profile() {
  const { user, signOut } = useAuth()

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Profil</h1>
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <p className="text-sm text-gray-500">Connecté en tant que</p>
        <p className="text-sm font-medium text-gray-900">{user?.email}</p>
      </div>
      <button
        onClick={signOut}
        className="w-full rounded-lg border border-red-200 py-2.5 text-sm font-medium text-red-600"
      >
        Se déconnecter
      </button>
    </div>
  )
}
