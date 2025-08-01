//main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'

import App from './App'
import './index.css'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'

// Set window properties
const appWindow = getCurrentWebviewWindow();
appWindow.setAlwaysOnTop(true);
appWindow.setDecorations(true);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
