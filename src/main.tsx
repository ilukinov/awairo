//main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'

import PomodoroTimer from './modules/PomodoroTimer'
import './index.css'
import { WebviewWindow, appWindow } from '@tauri-apps/api/window'
import { isRegistered, register } from '@tauri-apps/api/globalShortcut';
appWindow.setAlwaysOnTop(true);
appWindow.setDecorations(true);

const isRegisteredVa = await isRegistered('CommandOrControl+Shift+P');
console.log(isRegisteredVa);

await register('CommandOrControl+Shift+P', () => {
  console.log('Shortcut triggered');
  const webview = new WebviewWindow('theUniqueLabel', {
    url: 'assets/to/page.html'
  });
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <PomodoroTimer />
  </React.StrictMode>,
)
