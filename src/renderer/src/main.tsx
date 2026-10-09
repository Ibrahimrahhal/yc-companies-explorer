import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/global.css'

window.addEventListener(
  'wheel',
  (event) => {
    if (!event.ctrlKey && !event.metaKey) return
    event.preventDefault()
    void window.yc.zoomBy(event.deltaY < 0 ? 0.1 : -0.1)
  },
  { passive: false }
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
