import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // 本项目大量使用「读 localStorage / 调 Web Crypto 失败即回退默认值」的模式，
      // 空 catch 是有意为之（详见各 store/工具函数）。
      'no-empty': ['error', { allowEmptyCatch: true }],
      // 允许 const { foo, ...rest } = obj 这种「解构剔除某键」的写法。
      'no-unused-vars': ['error', { ignoreRestSiblings: true }],
      // 组件文件里同时导出常量配置（如 MODE_META）不影响 Fast Refresh。
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  // 构建配置文件运行在 Node 环境（vite.config.js 用到 process）。
  {
    files: ['*.config.js'],
    languageOptions: { globals: globals.node },
  },
])
