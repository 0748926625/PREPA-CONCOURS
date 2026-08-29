import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ensureDefaultContent } from './lib/seed.ts'
import LicenseGate from './components/LicenseGate.tsx'

ensureDefaultContent().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <LicenseGate>
        <HashRouter>
          <App />
        </HashRouter>
      </LicenseGate>
    </StrictMode>,
  )
})
