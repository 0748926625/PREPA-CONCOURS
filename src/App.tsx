import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './lib/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Resources from './pages/Resources'
import ResourceDetail from './pages/ResourceDetail'
import Quiz from './pages/Quiz'
import Results from './pages/Results'
import Weaknesses from './pages/Weaknesses'
import Remediation from './pages/Remediation'
import Profile from './pages/Profile'

function Home() {
  const { user, loading } = useAuth()
  if (loading) return null
  return <Navigate to={user ? '/dashboard' : '/login'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/resources/:id" element={<ResourceDetail />} />
        <Route path="/quiz/:id" element={<Quiz />} />
        <Route path="/results/:id" element={<Results />} />
        <Route path="/weaknesses" element={<Weaknesses />} />
        <Route path="/remediation/:topicId" element={<Remediation />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
