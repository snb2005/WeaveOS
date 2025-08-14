import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Polyfills for Node.js APIs in browser
import { Buffer } from 'buffer'

// Make Buffer available globally for isomorphic-git and other libraries
if (typeof globalThis !== 'undefined') {
  globalThis.Buffer = Buffer;
}
if (typeof window !== 'undefined') {
  (window as any).Buffer = Buffer;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
