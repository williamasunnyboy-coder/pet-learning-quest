import { getPetStage } from './store'

// type: 'hat' = displayed above pet head
//       'acc' = displayed beside pet
export const DECORATION_ITEMS = [
  // ── Hats ─────────────────────────────────────────
  { id: 'bow',      type: 'hat', emoji: '🎀', name: '蝴蝶结',   unlock: { type: 'streak',    threshold: 3  }, desc: '连续打卡 3 天解锁' },
  { id: 'flower',   type: 'hat', emoji: '🌸', name: '樱花发卡', unlock: { type: 'petStage',  threshold: 1  }, desc: '进化到第 2 阶段解锁' },
  { id: 'tophat',   type: 'hat', emoji: '🎩', name: '绅士帽',   unlock: { type: 'streak',    threshold: 7  }, desc: '连续打卡 7 天解锁' },
  { id: 'crown',    type: 'hat', emoji: '👑', name: '王冠',     unlock: { type: 'streak',    threshold: 30 }, desc: '连续打卡 30 天解锁' },
  { id: 'graduate', type: 'hat', emoji: '🎓', name: '学士帽',   unlock: { type: 'taskTotal', threshold: 30 }, desc: '累计完成 30 个任务解锁' },
  // ── Accessories ───────────────────────────────────
  { id: 'star',     type: 'acc', emoji: '⭐', name: '闪星徽章', unlock: { type: 'exp',       threshold: 100 }, desc: '经验值达到 100 解锁' },
  { id: 'heart',    type: 'acc', emoji: '❤️', name: '爱心勋章', unlock: { type: 'exp',       threshold: 300 }, desc: '经验值达到 300 解锁' },
  { id: 'fire',     type: 'acc', emoji: '🔥', name: '火焰光环', unlock: { type: 'streak',    threshold: 14  }, desc: '连续打卡 14 天解锁' },
  { id: 'rainbow',  type: 'acc', emoji: '🌈', name: '彩虹气泡', unlock: { type: 'petStage',  threshold: 3   }, desc: '进化到第 4 阶段解锁' },
  { id: 'diamond',  type: 'acc', emoji: '💎', name: '钻石光芒', unlock: { type: 'exp',       threshold: 800 }, desc: '经验值达到 800 解锁' },
]

export function checkDecorationUnlock(item, state) {
  const u = item.unlock
  const totalConfirmed = Object.values(state.taskCounts || {}).reduce((a, b) => a + b, 0)
  switch (u.type) {
    case 'streak':    return (state.bestStreak || 0) >= u.threshold
    case 'exp':       return (state.pet?.exp || 0) >= u.threshold
    case 'petStage':  return getPetStage(state.pet?.exp || 0) >= u.threshold
    case 'taskTotal': return totalConfirmed >= u.threshold
    default:          return false
  }
}

function getProgressVal(item, state) {
  const totalConfirmed = Object.values(state.taskCounts || {}).reduce((a, b) => a + b, 0)
  switch (item.unlock.type) {
    case 'streak':    return state.bestStreak || 0
    case 'exp':       return state.pet?.exp || 0
    case 'petStage':  return getPetStage(state.pet?.exp || 0)
    case 'taskTotal': return totalConfirmed
    default:          return 0
  }
}

function makeProgressHint(item, current) {
  const { type, threshold } = item.unlock
  const val = Math.min(current, threshold)
  switch (type) {
    case 'streak':    return `打卡 ${val}/${threshold} 天`
    case 'exp':       return `经验 ${val}/${threshold}`
    case 'petStage':  return `第 ${val + 1} → 第 ${threshold + 1} 阶段`
    case 'taskTotal': return `完成 ${val}/${threshold} 个`
    default:          return item.desc
  }
}

export function getUnlockedDecorations(state) {
  return DECORATION_ITEMS.map(item => {
    const progress = getProgressVal(item, state)
    const unlocked = progress >= item.unlock.threshold
    return {
      ...item,
      unlocked,
      progress,
      progressPct: Math.min(100, Math.round(progress / item.unlock.threshold * 100)),
      hint: unlocked ? null : makeProgressHint(item, progress),
    }
  })
}
