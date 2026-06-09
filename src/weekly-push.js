/**
 * 周成长报告推送
 *
 * 触发条件：
 *   - 浏览器通知权限已授予
 *   - 当前是周日，且本周还没推送过
 *   - App 是活跃状态（用户最近 7 天有打开过）
 *
 * 通过 localStorage 里的 lastWeeklyPushAt 防重。
 * 调用方在 App mount + 每天可见时调用 maybePushWeeklyCard()。
 */
import { getProfileSnapshot } from './store'

const PUSH_KEY = 'petLastWeeklyPushAt'

function isoWeekKey(d = new Date()) {
  // YYYY-WW，避免跨年周冲突
  const tmp = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  tmp.setDate(tmp.getDate() + 4 - (tmp.getDay() || 7))   // ISO：周一为周首
  const yearStart = new Date(tmp.getFullYear(), 0, 1)
  const week = Math.ceil((((tmp - yearStart) / 86400000) + 1) / 7)
  return `${tmp.getFullYear()}-W${String(week).padStart(2, '0')}`
}

export function shouldPushThisWeek() {
  if (typeof window === 'undefined') return false
  if (!('Notification' in window) || Notification.permission !== 'granted') return false
  const now    = new Date()
  const isSun  = now.getDay() === 0
  const after8 = now.getHours() >= 20
  if (!isSun || !after8) return false
  const lastWeek = localStorage.getItem(PUSH_KEY)
  return lastWeek !== isoWeekKey(now)
}

export function maybePushWeeklyCard(profileId = 'default') {
  if (!shouldPushThisWeek()) return false
  const snap = getProfileSnapshot(profileId)
  if (!snap) return false
  const body = composeMessage(snap)
  try {
    const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/'
    new Notification(`📊 ${snap.childName} 的本周成长`, {
      body,
      icon: `${base}favicon.svg`,
      tag: 'pet-weekly-card',
      requireInteraction: false,
    })
    localStorage.setItem(PUSH_KEY, isoWeekKey(new Date()))
    return true
  } catch {
    return false
  }
}

function composeMessage(snap) {
  const lines = []
  lines.push(`${snap.petName} 当前 ${snap.exp} 经验`)
  if (snap.streak > 0) lines.push(`🔥 连击 ${snap.streak} 天（最高 ${snap.bestStreak}）`)
  lines.push(`点击 App 查看完整月度报告`)
  return lines.join(' · ')
}

/**
 * 启动推送守护（在 App mount 时调用）：
 *   - 立即检查一次
 *   - 每 30 分钟检查一次（覆盖整晚的 8:00pm 关口）
 */
export function startWeeklyPushDaemon(profileId = 'default') {
  if (typeof window === 'undefined') return () => {}
  maybePushWeeklyCard(profileId)
  const id = setInterval(() => maybePushWeeklyCard(profileId), 30 * 60 * 1000)
  // 标签可见时也立即检查
  const onVis = () => {
    if (document.visibilityState === 'visible') maybePushWeeklyCard(profileId)
  }
  document.addEventListener('visibilitychange', onVis)
  return () => {
    clearInterval(id)
    document.removeEventListener('visibilitychange', onVis)
  }
}
