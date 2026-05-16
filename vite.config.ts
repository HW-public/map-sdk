import { defineConfig } from 'vitest/config'
import cesium from 'vite-plugin-cesium'

export default defineConfig({
  plugins: [cesium()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/main.ts', 'examples/**'],
    },
  },
})
