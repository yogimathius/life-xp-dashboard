import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ErrorFallback } from './components/ErrorFallback'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary fallback={ErrorFallback}>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
