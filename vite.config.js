import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'

export default (({mode})=> {
  const env = loadEnv(mode, './');
  return defineConfig({
    plugins: [
      vue(), cssInjectedByJsPlugin()
    ],
    build: {
      chunkSizeWarningLimit:500,
      watch: {
        include: ["src/**"],
      },
      minify: env.VITE_MINIFY === 'true' ? 'terser' : false,
      terserOptions: {
        compress:{
          drop_console: env.VITE_MINIFY === 'true',
        }
      },
      emptyOutDir: true,
      rollupOptions: {
        input: {
          input: "/src/main.js",
        },
        output: {
          dir: "../" + env.VITE_OUTPUT_DIR,
          entryFileNames: "easyuse.js",
          chunkFileNames: "[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash].[ext]",
          manualChunks(id) {
            if (id.includes('/src/extensions/')) {
              return 'assets/extensions';
            }
            else if(id.includes('lodash')) return 'assets/lodash'
            else if (id.includes('node_modules')) {
              return 'assets/'+ (id.split('node_modules/')[1].split('/')[0].split('@')[1] || 'vendor');
            }
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    }
  })
})