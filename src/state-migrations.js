/**
 * State Schema 版本与迁移
 *
 * 每加一个 INITIAL_STATE 字段或修改字段结构，应：
 *   ① CURRENT_SCHEMA_VERSION 加一
 *   ② 在 migrations[] 加一个迁移函数 (oldState) => newState
 *
 * loadState 时会按序跑所有 < schemaVersion 的迁移，保持兼容。
 */
import { MODE } from './constants/modes'

export const CURRENT_SCHEMA_VERSION = 3

// 迁移函数：(oldState) => newState，必须纯函数，不写 storage
const migrations = {
  // v0 → v1：补 weeklyChallenge / evolutionLog 字段
  1: s => ({
    ...s,
    weeklyChallenge: s.weeklyChallenge || { weekStart: null, claimed: false },
    evolutionLog: s.evolutionLog || [],
    streakMilestonesHit: s.streakMilestonesHit || [],
    expMilestonesShown: s.expMilestonesShown || [],
  }),
  // v1 → v2：补 classCode 字段（B 版铺垫）
  2: s => ({
    ...s,
    classCode: s.classCode || null,
    taskCounts: s.taskCounts || {},
    equippedItems: s.equippedItems || { hat: null, acc: null },
  }),
  // v2 → v3：补 appMode 默认为 FAMILY，并保证旧 tasks 都有 templateId 字段
  3: s => ({
    ...s,
    appMode: s.appMode || MODE.FAMILY,
    tasks: (s.tasks || []).map(t => ({
      ...t,
      templateId: t.templateId === undefined
        ? (t.id || '').replace(/_\d{4}-\d{2}-\d{2}$/, '')
        : t.templateId,
    })),
  }),
}

/**
 * 迁移入口
 * @param {object} saved  从 localStorage 反序列化后的 state
 * @returns {object}      迁移到最新版的 state（含 schemaVersion 字段）
 */
export function migrate(saved) {
  if (!saved || typeof saved !== 'object') return null
  let s = { ...saved }
  const from = Number.isFinite(s.schemaVersion) ? s.schemaVersion : 0
  for (let v = from + 1; v <= CURRENT_SCHEMA_VERSION; v++) {
    if (typeof migrations[v] === 'function') {
      try { s = migrations[v](s) }
      catch (err) {
        // eslint-disable-next-line no-console
        console.warn(`[migrate] step ${v} failed, keeping previous shape`, err)
      }
    }
  }
  s.schemaVersion = CURRENT_SCHEMA_VERSION
  return s
}
