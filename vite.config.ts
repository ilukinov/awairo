import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        settings: 'src/settings.html',
        history: 'src/history.html',
        canvasSettings: 'src/canvas-settings.html'
      }
    }
  }
})
