import React from 'react'
import ReactDOM from 'react-dom/client'

import PomodoroTimer from './modules/PomodoroTimer'
import P1Timer from './modules/P1Timer'
import './index.css'
import { appWindow } from '@tauri-apps/api/window'

appWindow.setAlwaysOnTop(true);
appWindow.setDecorations(true);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <PomodoroTimer />
  </React.StrictMode>,
)
