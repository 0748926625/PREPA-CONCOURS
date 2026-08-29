import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Resources from './pages/Resources'
import ResourceDetail from './pages/ResourceDetail'
import Quiz from './pages/Quiz'
import Results from './pages/Results'
import Weaknesses from './pages/Weaknesses'
import Remediation from './pages/Remediation'
import Profile from './pages/Profile'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
