import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/index.js', import.meta.url)),
      name: 'FormRenderer',
      formats: ['es', 'umd', 'iife'],
      fileName: (format) => {
        if (format === 'es') return 'form-renderer.esm.js'
        if (format === 'iife') return 'form-renderer.iife.js'
        return 'form-renderer.umd.cjs'
      }
    },
    rollupOptions: {
      // For ESM: Lit is external (peer dep). For IIFE: bundled in.
      external: (id, importer, isResolved) => {
        // Only externalize in ESM — handled per format below
        return false
      }
    }
  }
})
