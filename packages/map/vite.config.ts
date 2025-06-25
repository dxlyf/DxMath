import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import dts from 'vite-plugin-dts'
import UnoCSS from 'unocss/vite'
const __dirname = dirname(fileURLToPath(import.meta.url))
// https://vitejs.dev/config/
export default defineConfig({
  build:{
  
  },
  resolve:{
    alias:{
      'src':'/src'
    }
  },
  plugins: [react(),UnoCSS(),dts({
    // 输出到 dist/types
    outDir: 'dist/types',
    // 自动清除之前生成的 .d.ts
    cleanVueFileName: true,
    insertTypesEntry:true,
    //: true,
  })],
})
