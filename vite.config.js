/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// 部署在 https://kuketang.cn/pet-garden/ 子目录下
// 本地 dev 仍使用 '/'（仅 build 时生效）
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/pet-garden/' : '/',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // 拆分稳定的第三方库与大体量故事数据，提升并行下载与跨版本缓存命中
        manualChunks(id) {
          if (id.includes('node_modules')) return 'vendor'
          if (id.includes('/src/stories')) return 'stories'
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    setupFiles: ['./src/test-setup.js'],
  },
})
