import { NavLink, Outlet } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Accueil', icon: '🏠' },
  { to: '/resources', label: 'Ressources', icon: '📚' },
  { to: '/weaknesses', label: 'Lacunes', icon: '🎯' },
  { to: '/profile', label: 'Profil', icon: '👤' },
]

export default function Layout() {
  return (
    <div className="flex min-h-svh flex-col bg-gray-50">
      <main className="mx-auto w-full max-w-md flex-1 px-4 pb-20 pt-4">
        <Outlet />
      </main>
      <nav className="fixed inset-x-0 bottom-0 border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-md">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-1 py-2 text-xs ${
                  isActive ? 'text-blue-600' : 'text-gray-500'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
