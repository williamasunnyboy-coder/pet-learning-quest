import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { registerTeacherBridge } from './teacher-bridge'
import * as teacherStore from './teacher-store'

// Register PWA service worker（用 Vite 注入的 BASE_URL，自动适配子目录部署）
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swUrl = `${import.meta.env.BASE_URL || '/'}sw.js`
    navigator.serviceWorker.register(swUrl, { scope: import.meta.env.BASE_URL || '/' }).catch(() => {})
  })
}

// 教师桥接：同步注册，确保 store 首次渲染前 bridge 已就绪。
// （teacher-store 已被 Setup / ParentView 等首屏组件静态引用，必然进主包，
//  此前的动态 import 无法真正分割，反而触发 Vite 的 INEFFECTIVE_DYNAMIC_IMPORT 警告。）
registerTeacherBridge({
  getTasks: teacherStore.getTeacherTasksForCode,
  reportDone: teacherStore.reportCompletion,
  lookup: teacherStore.lookupClassCode,
  publishPresence: teacherStore.publishPetPresence,
  getPeers: teacherStore.getClassPeers,
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
