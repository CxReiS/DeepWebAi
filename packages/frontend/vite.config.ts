// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react({ jsxRuntime: 'automatic' })],
  build: {
    target: 'es2022',
    minify: 'terser',
    cssCodeSplit: true
  }
})
