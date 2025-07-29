import React from 'react'
import ReactDOM from 'react-dom/client'
import { CanvasSettings } from './modules/CanvasSettings'
import './index.css'

// Render canvas settings directly
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CanvasSettings />
  </React.StrictMode>,
)