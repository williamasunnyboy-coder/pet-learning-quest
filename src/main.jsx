import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { registerTeacherBridge } from './teacher-bridge'

// Register PWA service worker（用 Vite 注入的 BASE_URL，自动适配子目录部署）
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swUrl = `${import.meta.env.BASE_URL || '/'}sw.js`
    navigator.serviceWorker.register(swUrl, { scope: import.meta.env.BASE_URL || '/' }).catch(() => {})
  })
}

// 教师桥接：仅在学员/教师/家长侧入口按需 lazy-import
// 纯家庭模式 + 未绑定班级码时，下面这段 import 仍会执行但 chunk 异步加载
// 避免首屏阻塞
import('./teacher-store').then(m => {
  registerTeacherBridge({
    getTasks: m.getTeacherTasksForCode,
    reportDone: m.reportCompletion,
    lookup: m.lookupClassCode,
    publishPresence: m.publishPetPresence,
    getPeers: m.getClassPeers,
  })
}).catch(() => {})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
