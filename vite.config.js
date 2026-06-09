/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// 部署在 https://kuketang.cn/pet-garden/ 子目录下
// 本地 dev 仍使用 '/'（仅 build 时生效）
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/pet-garden/' : '/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    setupFiles: ['./src/test-setup.js'],
  },
})
