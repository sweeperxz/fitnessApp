import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Отдельный конфиг для тестов: основной vite.config.js тащит vite-plugin-pwa,
// который для unit-тестов не нужен и дольше стартует.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    css: false,
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    exclude: ['node_modules/**', 'dist/**'],
    clearMocks: true,
    restoreMocks: true,
  },
})
