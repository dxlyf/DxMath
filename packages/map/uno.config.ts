import {
    defineConfig,
    presetAttributify,
    presetIcons,
    presetTypography,
    presetWebFonts,
    presetWind3,
    presetWind4,
    transformerDirectives,
    transformerVariantGroup
  } from 'unocss'
  
  export default defineConfig({
    shortcuts: [
      // ...
    ],
    theme: {
      colors: {
        // ...
      }
    },
    presets: [
      presetWind4({
        important:'.body-wrapper',
        preflights:{
          reset:false
        }
      }),
      presetAttributify(),
      presetIcons(),
 
    //   presetTypography(),
    //   presetWebFonts({
    //     fonts: {
    //       // ...
    //     },
    //   }),
    ],
    transformers: [
      //transformerDirectives(),
      transformerVariantGroup(),
    ],
  })