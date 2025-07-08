import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import dts from 'vite-plugin-dts'
const __dirname = dirname(fileURLToPath(import.meta.url))
// https://vitejs.dev/config/
export default defineConfig({
  build:{
    
    outDir:resolve(__dirname,'./dist'),
    lib:{
      entry:{
        'math':resolve(__dirname,'./src/math/index.ts'),
        'three.addons':resolve(__dirname,'./src/threejs/jsm/Addons.js'),
        'three.webgl':resolve(__dirname,'./src/threejs/Three.js'),
        'three.webgpu':resolve(__dirname,'./src/threejs/Three.WebGPU.js'),
        'gl_matrix':resolve(__dirname,'./src/gl_matrix/index.ts'),
        'canvaskit':resolve(__dirname,'./src/canvaskit/index.ts'),
        '2d_geometry':resolve(__dirname,'./src/2d_geometry/index.ts'),
        '2d_contains':resolve(__dirname,'./src/2d_contains/index.ts'),
        'skia_path':resolve(__dirname,'./src/skia_path/SKPath2D.ts'),
        '2d_path':resolve(__dirname,'./src/2d_path/path.ts'),
        'soft2d':resolve(__dirname,'./src/2d_raster/index.ts'),
        '2d_softrender':resolve(__dirname,'./src/2d_softrender/index.ts'),
        'event_emiter':resolve(__dirname,'./src/event/event_emiter.ts'),
        '3d_scanning_algorithm':resolve(__dirname,'./src/computer_graphic/3d/index.ts'),
        '2d_scanning_algorithm':resolve(__dirname,'./src/computer_graphic/scanning_algorithm/index.ts'),
      },
    //  name:'Dx',
      formats:['es','cjs'],
      fileName:(format,entryName)=>`${entryName}.${format}.js`,
    },
    minify:false,// 不压缩和混淆
    rollupOptions: {
      // 确保外部化处理那些
      // 你不想打包进库的依赖
      external: ['vue','react'],
      output: {
        // 在 UMD 构建模式下为这些外部化的依赖
        // 提供一个全局变量
        globals: {
          vue: 'Vue',
          react:'React'
        },
      },
    },
  },
  resolve:{
    alias:{
      'math':'/src'
    }
  },
  plugins: [react(),dts({
    // 输出到 dist/types
    outDir: 'dist/types',
    // 自动清除之前生成的 .d.ts
    cleanVueFileName: true,
    insertTypesEntry:true,
    //: true,
  })],
})
