import React from 'react'
import ReactDOM from 'react-dom/client'
import { Settings } from './modules/Settings'
import './index.css'

// Render settings directly
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Settings />
  </React.StrictMode>,
) 