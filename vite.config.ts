import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Vite does not automatically expose process.env to the browser, so we map it here.
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
})