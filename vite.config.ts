import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
// https://vitejs.dev/config/
export default defineConfig({
  resolve:{
    alias:{
      'tiny-skia':'/lib/index.ts',
      'src':'/src',
      'math':'/math'
    }
  },
  plugins: [react()],
})
