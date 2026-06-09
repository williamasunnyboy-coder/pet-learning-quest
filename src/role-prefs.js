/**
 * 角色偏好存储 —— 记住用户上次选择的角色（学生 / 家长 / 老师）。
 *
 * 从 RoleLanding.jsx 抽离，使该组件文件只导出组件，保持 Fast Refresh 正常。
 */
const ROLE_KEY = 'petPreferredRole'

export function getPreferredRole() {
  try { return localStorage.getItem(ROLE_KEY) } catch { return null }
}

export function setPreferredRole(role) {
  try { localStorage.setItem(ROLE_KEY, role) } catch { /* localStorage 不可用时忽略 */ }
}
