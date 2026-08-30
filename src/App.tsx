import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import QcmMenu from './pages/QcmMenu'
import Resources from './pages/Resources'
import AddResource from './pages/AddResource'
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
        <Route path="/" element={<Navigate to="/qcm" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/qcm" element={<QcmMenu />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/resources/new" element={<AddResource />} />
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
