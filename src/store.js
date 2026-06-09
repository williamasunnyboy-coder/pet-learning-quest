import { useState, useEffect, useRef, useMemo } from 'react'
import { bridgeGetTasks, bridgeReportDone, bridgePublishPresence } from './teacher-bridge'
import { MODE, isValidMode, isAutoConfirmMode } from './constants/modes'
import { migrate, CURRENT_SCHEMA_VERSION } from './state-migrations'

const BASE_URL = 'https://raw.githubusercontent.com/prompteric/class-pet-garden/master/public/pets'

function loadAdminConfig() {
  try { return JSON.parse(localStorage.getItem('petAdminConfig') || '{}') } catch { return {} }
}

const _admin = loadAdminConfig()

// ─── 本地日期工具（避免 UTC 偏移）──────────────────
export function today() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ─── 多档案管理 ───────────────────────────────────
function storageKey(profileId) {
  return profileId === 'default' ? 'petLearningApp' : `petLearningApp_${profileId}`
}

export function getProfiles() {
  try {
    return JSON.parse(localStorage.getItem('petProfiles') || 'null')
      || [{ id: 'default', label: '档案 1' }]
  } catch { return [{ id: 'default', label: '档案 1' }] }
}

export function saveProfiles(profiles) {
  localStorage.setItem('petProfiles', JSON.stringify(profiles))
}

export function getCurrentProfileId() {
  return localStorage.getItem('petCurrentProfile') || 'default'
}

export function setCurrentProfileId(id) {
  localStorage.setItem('petCurrentProfile', id)
}

export function createProfile(label) {
  const profiles = getProfiles()
  const id = Date.now().toString()
  saveProfiles([...profiles, { id, label: label || `档案 ${profiles.length + 1}` }])
  return id
}

export function deleteProfile(id) {
  if (id === 'default') return
  saveProfiles(getProfiles().filter(p => p.id !== id))
  localStorage.removeItem(`petLearningApp_${id}`)
  if (getCurrentProfileId() === id) setCurrentProfileId('default')
}

export function updateProfileLabel(id, label) {
  saveProfiles(getProfiles().map(p => p.id === id ? { ...p, label } : p))
}

// ─── PIN 码管理（Web Crypto v2，兼容 v1 / 明文）─────────
import { hashPinV2, verifyPinAgainst, isLegacyHash } from './pin-crypto'

export function hasPinCode() {
  try { return !!JSON.parse(localStorage.getItem('petAdminConfig') || '{}').parentPin } catch { return false }
}

/**
 * 校验输入的 PIN。
 * 若存储为 v1 或明文，校验通过后自动升级到 v2。
 */
export async function verifyPinCode(pin) {
  try {
    const cfg = JSON.parse(localStorage.getItem('petAdminConfig') || '{}')
    const stored = cfg.parentPin
    if (!stored) return false
    const ok = await verifyPinAgainst(stored, pin)
    if (ok && isLegacyHash(stored)) {
      // 透明升级：把旧 hash 替换成 v2
      try {
        const upgraded = await hashPinV2(pin)
        localStorage.setItem('petAdminConfig', JSON.stringify({ ...cfg, parentPin: upgraded }))
      } catch {}
    }
    return ok
  } catch { return false }
}

export async function setPinCode(pin) {
  try {
    const cfg = JSON.parse(localStorage.getItem('petAdminConfig') || '{}')
    const hashed = await hashPinV2(pin)
    localStorage.setItem('petAdminConfig', JSON.stringify({ ...cfg, parentPin: hashed }))
  } catch {}
}

export function clearPinCode() {
  try {
    const cfg = JSON.parse(localStorage.getItem('petAdminConfig') || '{}')
    delete cfg.parentPin
    localStorage.setItem('petAdminConfig', JSON.stringify(cfg))
  } catch {}
}

// ─── 数据导出 / 导入 ──────────────────────────────
export function exportData(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), {
    href: url,
    download: `宠物助手备份_${state.childName || '数据'}_${today()}.json`,
  })
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function importData(json, profileId = 'default') {
  try {
    const parsed = JSON.parse(json)
    if (!parsed.pet || !Array.isArray(parsed.tasks)) return false
    // 老备份可能是旧 schema —— 先升级再落盘，避免导入后缺字段
    const data = migrate(parsed)
    localStorage.setItem(storageKey(profileId), JSON.stringify({ ...data, initialized: true }))
    return true
  } catch { return false }
}

// ─── 连续打卡里程碑奖励 ───────────────────────────
export const STREAK_BONUSES = { 3: 10, 7: 25, 14: 50, 30: 100 }

// ─── 周挑战目标（也在 WeeklyChallenge.jsx 中引用）──
export const WEEKLY_GOAL = 15

// ─── 经验里程碑提示 ──────────────────────────────
export const EXP_MILESTONES = [
  { exp: 200,  title: '初出茅庐！',  msg: '{petName} 已积累 200 经验，开始崭露头角！⭐' },
  { exp: 450,  title: '小有所成！',  msg: '{petName} 达到 450 经验！力量在悄悄涌动…🌟' },
  { exp: 750,  title: '技艺精进！',  msg: '{petName} 突破 750 经验！实力已超越同龄！💪' },
  { exp: 1100, title: '传说时刻！',  msg: '{petName} 迈过千点经验！名字将载入传说！👑' },
]

// ─── 成就系统 ─────────────────────────────────────
// type: 'streak' | 'exp' | 'taskCount' | 'petStage'
export const DEFAULT_ACHIEVEMENTS = [
  { id: 'streak7',     emoji: '🔥', name: '七天全勤',   type: 'streak',    threshold: 7,    active: true },
  { id: 'streak30',    emoji: '⚡', name: '月度传奇',   type: 'streak',    threshold: 30,   active: true },
  { id: 'exp200',      emoji: '⭐', name: '初露锋芒',   type: 'exp',       threshold: 200,  active: true },
  { id: 'exp1000',     emoji: '🌟', name: '经验丰富',   type: 'exp',       threshold: 1000, active: true },
  { id: 'reading10',   emoji: '📖', name: '阅读达人',   type: 'taskCount', threshold: 10,   templateId: 't2', active: true },
  { id: 'homework20',  emoji: '📝', name: '学习小能手', type: 'taskCount', threshold: 20,   templateId: 't1', active: true },
  { id: 'earlybird10', emoji: '⏰', name: '早起小英雄', type: 'taskCount', threshold: 10,   templateId: 't5', active: true },
  { id: 'maxStage',    emoji: '🦋', name: '破茧成蝶',   type: 'petStage',  threshold: 4,    active: true },
]

export function evaluateAchievement(a, state) {
  switch (a.type) {
    case 'streak':    return (state.bestStreak || 0) >= a.threshold
    case 'exp':       return (state.pet?.exp || 0) >= a.threshold
    case 'taskCount': return (state.taskCounts?.[a.templateId] || 0) >= a.threshold
    case 'petStage':  return getPetStage(state.pet?.exp || 0) >= a.threshold
    default:          return false
  }
}

export function getAchievements() {
  try {
    const cfg = JSON.parse(localStorage.getItem('petAdminConfig') || '{}')
    return Array.isArray(cfg.achievements) ? cfg.achievements : DEFAULT_ACHIEVEMENTS
  } catch { return DEFAULT_ACHIEVEMENTS }
}

export function getEarnedAchievements(state) {
  return getAchievements()
    .filter(a => a.active !== false)
    .map(a => ({ ...a, earned: evaluateAchievement(a, state) }))
}

// ─── 宠物类型定义 ────────────────────────────────
const BASE_PET_TYPES = {
  'west-highland': {
    name: '西高地梗犬',
    emoji: '🐶',
    theme: '#fff8f0',
    themeAccent: '#ff7a45',
    isPremium: false,
    stages: [
      { name: '小奶狗',   level: 'lv1' },
      { name: '活泼幼犬', level: 'lv3' },
      { name: '精灵梗犬', level: 'lv4' },
      { name: '守护神犬', level: 'lv6' },
      { name: '圣翼天使', level: 'lv8' },
    ],
  },
  'azure-dragon': {
    name: '青龙',
    emoji: '🐲',
    theme: '#e6fffb',
    themeAccent: '#13c2c2',
    isPremium: false,
    stages: [
      { name: '小龙蛋',   level: 'lv1' },
      { name: '幼龙',     level: 'lv3' },
      { name: '青龙少年', level: 'lv4' },
      { name: '青龙',     level: 'lv6' },
      { name: '神龙至尊', level: 'lv8' },
    ],
  },
  'unicorn': {
    name: '独角兽',
    emoji: '🦄',
    theme: '#fff0f6',
    themeAccent: '#eb2f96',
    isPremium: false,
    stages: [
      { name: '粉嫩小马',   level: 'lv1' },
      { name: '灵角幼马',   level: 'lv3' },
      { name: '灵角马',     level: 'lv4' },
      { name: '彩虹独角兽', level: 'lv6' },
      { name: '神话飞马',   level: 'lv8' },
    ],
  },
  'corgi': {
    name: '柯基',
    emoji: '🍑',
    theme: '#fffbe6',
    themeAccent: '#faad14',
    isPremium: false,
    stages: [
      { name: '柯基幼崽',   level: 'lv1' },
      { name: '胖臀小柯',   level: 'lv3' },
      { name: '肥臀柯基',   level: 'lv4' },
      { name: '神气柯基',   level: 'lv6' },
      { name: '金翼柯基王', level: 'lv8' },
    ],
  },
  'white-tiger': {
    name: '白虎',
    emoji: '🐯',
    theme: '#f6ffed',
    themeAccent: '#52c41a',
    isPremium: true,
    stages: [
      { name: '软萌虎崽',   level: 'lv1' },
      { name: '少年白虎',   level: 'lv3' },
      { name: '苍穹幼虎',   level: 'lv4' },
      { name: '神威白虎',   level: 'lv6' },
      { name: '金翅神兽',   level: 'lv8' },
    ],
  },
  'vermilion-bird': {
    name: '朱雀',
    emoji: '🦅',
    theme: '#fff1f0',
    themeAccent: '#f5222d',
    isPremium: true,
    stages: [
      { name: '火凤幼雏',   level: 'lv1' },
      { name: '烈焰少年',   level: 'lv3' },
      { name: '赤焰朱雀',   level: 'lv4' },
      { name: '凤凰涅槃',   level: 'lv6' },
      { name: '神火天尊',   level: 'lv8' },
    ],
  },

  // ── 节日限定宠物（seasonal = { start: 'MM-DD', end: 'MM-DD' }）──
  'spring-dragon': {
    name: '瑞龙',
    emoji: '🐉',
    theme: '#fff1f0',
    themeAccent: '#f5222d',
    isPremium: false,
    baseType: 'azure-dragon',        // 使用青龙图片资源
    seasonal: { start: '01-20', end: '02-20' },
    stages: [
      { name: '龙蛋',       level: 'lv1' },
      { name: '瑞气幼龙',   level: 'lv3' },
      { name: '吉祥青龙',   level: 'lv4' },
      { name: '瑞龙',       level: 'lv6' },
      { name: '神龙驾云',   level: 'lv8' },
    ],
  },
  'moon-rabbit': {
    name: '玉兔',
    emoji: '🌕',
    theme: '#fffbe6',
    themeAccent: '#faad14',
    isPremium: false,
    baseType: 'unicorn',             // 使用独角兽图片资源
    seasonal: { start: '09-12', end: '09-22' },
    stages: [
      { name: '月光幼兔',   level: 'lv1' },
      { name: '捣药小兔',   level: 'lv3' },
      { name: '广寒玉兔',   level: 'lv4' },
      { name: '月宫灵兔',   level: 'lv6' },
      { name: '太阴神兔',   level: 'lv8' },
    ],
  },
  'halloween-pumpkin': {
    name: '南瓜精',
    emoji: '🎃',
    theme: '#fff3e0',
    themeAccent: '#fa541c',
    isPremium: false,
    baseType: 'corgi',               // 使用柯基图片资源
    seasonal: { start: '10-24', end: '11-01' },
    stages: [
      { name: '小南瓜',     level: 'lv1' },
      { name: '皮皮精',     level: 'lv3' },
      { name: '南瓜精灵',   level: 'lv4' },
      { name: '万圣幽灵',   level: 'lv6' },
      { name: '暗夜之主',   level: 'lv8' },
    ],
  },
  'christmas-deer': {
    name: '雪绒鹿',
    emoji: '🦌',
    theme: '#f6ffed',
    themeAccent: '#52c41a',
    isPremium: false,
    baseType: 'west-highland',       // 使用西高地图片资源
    seasonal: { start: '12-20', end: '12-31' },
    stages: [
      { name: '雪地小鹿',   level: 'lv1' },
      { name: '铃铛小鹿',   level: 'lv3' },
      { name: '雪绒驯鹿',   level: 'lv4' },
      { name: '圣诞神鹿',   level: 'lv6' },
      { name: '极光之鹿',   level: 'lv8' },
    ],
  },
}

export const PET_TYPES = _admin.petTypes
  ? Object.fromEntries(
      Object.entries(BASE_PET_TYPES).map(([k, v]) => {
        const ov = _admin.petTypes[k]
        if (!ov) return [k, v]
        return [k, { ...v, ...ov, stages: ov.stages ?? v.stages }]
      })
    )
  : BASE_PET_TYPES

// 进化经验阈值（对应 5 阶段，需要 4 个阈值）
const EXP_THRESHOLDS = _admin.expThresholds ?? [200, 450, 750, 1100]

export function getPetImageUrl(petType, stageIndex) {
  const pet = PET_TYPES[petType]
  if (!pet) return null
  const actualType = pet.baseType || petType   // seasonal pets reuse another pet's art
  const level = pet.stages[stageIndex]?.level ?? 'lv1'
  return `${BASE_URL}/${actualType}/${level}.png`
}

// ─── 节日限定工具 ─────────────────────────────────
export function isSeasonalActive(petDef) {
  if (!petDef?.seasonal) return false
  const d = new Date()
  const md = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return md >= petDef.seasonal.start && md <= petDef.seasonal.end
}

export function seasonalInfo(petDef) {
  if (!petDef?.seasonal) return null
  const now  = new Date()
  const year = now.getFullYear()
  const [sm, sd] = petDef.seasonal.start.split('-').map(Number)
  const [em, ed] = petDef.seasonal.end.split('-').map(Number)
  const active = isSeasonalActive(petDef)
  if (active) {
    const end = new Date(year, em - 1, ed, 23, 59, 59)
    const days = Math.max(1, Math.ceil((end - now) / 86400000))
    return { active: true, label: `🎊 限定`, sub: `还剩 ${days} 天` }
  } else {
    let start = new Date(year, sm - 1, sd)
    if (start < now) start.setFullYear(year + 1)
    const days = Math.ceil((start - now) / 86400000)
    return { active: false, label: `⏳ 即将`, sub: `${days} 天后开放` }
  }
}

// ─── 任务模板（含科目分类 + 星期排班）─────────────
// weekdays: null = 每天，[0-6] 数组 = 指定星期（0=周日）
const DEFAULT_TASKS_TEMPLATES = [
  { id: 't1', name: '完成作业',     points: 12, icon: '📝', category: '学习', weekdays: null },
  { id: 't2', name: '阅读20分钟',   points: 10, icon: '📚', category: '学习', weekdays: null },
  { id: 't3', name: '练字',         points: 10, icon: '✏️', category: '学习', weekdays: null },
  { id: 't4', name: '睡前收拾书包', points: 6,  icon: '🎒', category: '生活', weekdays: null },
  { id: 't5', name: '早起不赖床',   points: 6,  icon: '⏰', category: '生活', weekdays: null },
]

const TASK_TEMPLATES = _admin.taskTemplates ?? DEFAULT_TASKS_TEMPLATES

// ─── 初始状态 ─────────────────────────────────────
const INITIAL_STATE = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  pet: { name: '小伙伴', exp: 0, hunger: 80, lastFedDate: null },
  petType: 'west-highland',
  streak: 0,
  bestStreak: 0,
  lastStreakDate: null,
  streakMilestonesHit: [],
  expMilestonesShown: [],
  streakBonus: null,
  latestExpMilestones: [],
  taskCounts: {},          // { taskBaseId: confirmedCount }
  equippedItems: { hat: null, acc: null },
  classCode: null,             // B版：已加入的班级码
  appMode: MODE.FAMILY,        // 三种模式见 constants/modes.js
  weeklyChallenge: { weekStart: null, claimed: false },
  evolutionLog: [],        // [{ date, stage, petName }]
  lastLoginDate: null,
  _dailyBonusToday: false, // transient flag — excluded from saveState
  tasks: [],
  childName: '小朋友',
  initialized: false,
}

// ─── 纯读取（不触发登录奖励/饥饿衰减），用于快照对比等只读场景 ──
function readStateRaw(profileId = 'default') {
  try {
    const raw = localStorage.getItem(storageKey(profileId))
    if (!raw) return INITIAL_STATE
    const saved = migrate(JSON.parse(raw))
    return { ...INITIAL_STATE, ...saved, initialized: Boolean(saved.initialized) }
  } catch { return INITIAL_STATE }
}

function loadState(profileId = 'default') {
  try {
    const raw = localStorage.getItem(storageKey(profileId))
    if (!raw) return INITIAL_STATE
    const saved = migrate(JSON.parse(raw))
    if (saved.pet?.lastFedDate) {
      const todayLocal = today()
      const lastFed = new Date(saved.pet.lastFedDate + 'T00:00:00')
      const todayDate = new Date(todayLocal + 'T00:00:00')
      const daysPassed = Math.floor((todayDate - lastFed) / 86400000)
      if (daysPassed > 0) {
        saved.pet.hunger = Math.max(0, saved.pet.hunger - daysPassed * 25)
      }
    }
    // ── Daily login bonus (+5 exp on first load of the day) ──
    const todayLocal = today()
    if (saved.initialized && saved.lastLoginDate !== todayLocal) {
      saved.pet = { ...(saved.pet || {}), exp: (saved.pet?.exp || 0) + 5 }
      saved.lastLoginDate = todayLocal
      saved._dailyBonusToday = true
    }

    return { ...INITIAL_STATE, ...saved, initialized: Boolean(saved.initialized) }
  } catch {
    return INITIAL_STATE
  }
}

function saveState(state, profileId = 'default') {
  // 只保留最近 30 天任务，防止 localStorage 溢出
  const d = new Date(); d.setDate(d.getDate() - 30)
  const cutoff = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  // Exclude transient flags from persistence（_dailyBonusToday 为 rest sibling，不持久化）
  const { _dailyBonusToday, ...stateToSave } = state
  const trimmed = { ...stateToSave, tasks: state.tasks.filter(t => t.date >= cutoff) }
  localStorage.setItem(storageKey(profileId), JSON.stringify(trimmed))
}

// ─── 纯函数（移出 hook，方便 useMemo）────────────────
function buildHistory(tasks) {
  const byDate = {}
  tasks.forEach(t => {
    if (!byDate[t.date]) byDate[t.date] = { total: 0, done: 0 }
    byDate[t.date].total++
    if (t.status === 'confirmed') byDate[t.date].done++
  })
  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-7)
    .map(([date, v]) => ({ date, ...v }))
}

function buildMonthlyStats(tasks) {
  const d = new Date(); d.setDate(d.getDate() - 30)
  const cutoff = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const recent = tasks.filter(t => t.date >= cutoff)
  const confirmed = recent.filter(t => t.status === 'confirmed').length
  const byCategory = {}
  recent.forEach(t => {
    const cat = t.category || '其他'
    if (!byCategory[cat]) byCategory[cat] = { total: 0, done: 0 }
    byCategory[cat].total++
    if (t.status === 'confirmed') byCategory[cat].done++
  })
  return {
    total: recent.length,
    confirmed,
    rate: recent.length > 0 ? Math.round(confirmed / recent.length * 100) : 0,
    byCategory,
  }
}

// ─── 主 Store Hook ─────────────────────────────────
export function useAppStore(profileId = 'default') {
  const [state, setState] = useState(() => loadState(profileId))
  const profileIdRef = useRef(profileId)

  // 切换档案时重载状态
  useEffect(() => {
    if (profileIdRef.current !== profileId) {
      profileIdRef.current = profileId
      setState(loadState(profileId))
    }
  }, [profileId])

  useEffect(() => { saveState(state, profileId) }, [state, profileId])

  function setup(childName, petName, petType, mode, classCode) {
    const todayTasks = TASK_TEMPLATES.map(t => ({
      ...t, status: 'pending', date: today(),
    }))
    setState({
      ...INITIAL_STATE,
      childName,
      petType: petType || 'west-highland',
      pet: { name: petName, exp: 0, hunger: 80, lastFedDate: today() },
      tasks: todayTasks,
      appMode: mode || MODE.FAMILY,
      classCode: classCode || null,
      initialized: true,
    })
  }

  function addTask(name, points, icon = '⭐', category = '其他') {
    setState(prev => ({
      ...prev,
      tasks: [
        ...prev.tasks,
        { id: Date.now().toString(), templateId: null, name, points, icon, category, status: 'pending', date: today() },
      ],
    }))
  }

  // ── 共享确认逻辑（confirmTask 和 campus 模式的 markDone 共用）──
  function applyConfirm(prev, taskId) {
    const task = prev.tasks.find(t => t.id === taskId)
    if (!task) return prev
    const tasks = prev.tasks.map(t =>
      t.id === taskId ? { ...t, status: 'confirmed' } : t
    )
    const newExp = prev.pet.exp + task.points
    const newHunger = Math.min(100, prev.pet.hunger + task.points * 0.8)

    // ── taskCounts 累计（按模板基础 ID；自定义任务 templateId 为 null 则跳过）──
    const baseId = task.templateId ?? task.id.replace(/_\d{4}-\d{2}-\d{2}$/, '')
    const taskCounts = {
      ...(prev.taskCounts || {}),
      [baseId]: ((prev.taskCounts || {})[baseId] || 0) + 1,
    }

    // ── streak 计算 ──
    const todayStr = today()
    const yDate = new Date(); yDate.setDate(yDate.getDate() - 1)
    const yesterday = `${yDate.getFullYear()}-${String(yDate.getMonth() + 1).padStart(2, '0')}-${String(yDate.getDate()).padStart(2, '0')}`

    let newStreak = prev.streak
    let streakMilestonesHit = prev.streakMilestonesHit || []
    let streakBonus = null

    if (prev.lastStreakDate !== todayStr) {
      newStreak = (prev.lastStreakDate === yesterday) ? prev.streak + 1 : 1
      const bonusPoints = STREAK_BONUSES[newStreak] || 0
      if (bonusPoints > 0 && !streakMilestonesHit.includes(newStreak)) {
        streakBonus = { streak: newStreak, bonus: bonusPoints }
        streakMilestonesHit = [...streakMilestonesHit, newStreak]
      }
    }

    const newBest = Math.max(prev.bestStreak || 0, newStreak)
    const bonusExp = streakBonus?.bonus || 0
    const finalExp = newExp + bonusExp

    // ── 经验里程碑检测 ──
    const expMilestonesShown = prev.expMilestonesShown || []
    const newHit = EXP_MILESTONES
      .filter(m => finalExp >= m.exp && !expMilestonesShown.includes(m.exp))
      .map(m => m.exp)

    // ── B版/校园模式：教师作业确认后上报到共享层 ──
    if (task.source === 'teacher' && task.classCode && task.assignmentId) {
      bridgeReportDone(task.classCode, profileIdRef.current, task.assignmentId)
    }

    return {
      ...prev,
      tasks,
      taskCounts,
      streak: newStreak,
      bestStreak: newBest,
      lastStreakDate: todayStr,
      streakMilestonesHit,
      streakBonus,
      expMilestonesShown: [...expMilestonesShown, ...newHit],
      latestExpMilestones: newHit,
      pet: { ...prev.pet, exp: finalExp, hunger: newHunger, lastFedDate: todayStr },
    }
  }

  function confirmTask(taskId) {
    setState(prev => applyConfirm(prev, taskId))
  }

  function clearStreakBonus() {
    setState(prev => ({ ...prev, streakBonus: null }))
  }

  function clearExpMilestones() {
    setState(prev => ({ ...prev, latestExpMilestones: [] }))
  }

  function markDone(taskId) {
    setState(prev => {
      // 校园模式：完成即确认，直接触发全部奖励逻辑
      if (isAutoConfirmMode(prev.appMode)) return applyConfirm(prev, taskId)
      return {
        ...prev,
        tasks: prev.tasks.map(t =>
          t.id === taskId && t.status === 'pending' ? { ...t, status: 'done' } : t
        ),
      }
    })
  }

  function deleteTask(taskId) {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== taskId),
    }))
  }

  function equipItem(slot, itemId) {
    setState(prev => ({
      ...prev,
      equippedItems: { ...prev.equippedItems, [slot]: itemId },
    }))
  }

  function claimWeeklyChallenge() {
    const d = new Date()
    const day = d.getDay()
    const diff = day === 0 ? -6 : 1 - day
    const monday = new Date(d)
    monday.setDate(d.getDate() + diff)
    const weekStart = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`
    setState(prev => {
      const wc = prev.weeklyChallenge || {}
      if (wc.claimed && wc.weekStart === weekStart) return prev
      // ── 门槛校验：本周确认任务数必须达标 ──
      const weekDone = prev.tasks.filter(t => t.status === 'confirmed' && t.date >= weekStart).length
      if (weekDone < WEEKLY_GOAL) return prev
      return {
        ...prev,
        pet: { ...prev.pet, exp: (prev.pet?.exp || 0) + 20 },
        weeklyChallenge: { weekStart, claimed: true },
      }
    })
  }

  function recordEvolution(stage, petName) {
    setState(prev => ({
      ...prev,
      evolutionLog: [
        ...(prev.evolutionLog || []),
        { date: today(), stage, petName: petName || prev.pet.name },
      ],
    }))
  }

  function renamePet(newName) {
    if (!newName?.trim()) return
    setState(prev => ({ ...prev, pet: { ...prev.pet, name: newName.trim() } }))
  }

  function renameChild(newName) {
    if (!newName?.trim()) return
    setState(prev => ({ ...prev, childName: newName.trim() }))
  }

  // B版：保存家长端加入的班级码，下次 refreshDailyTasks 时注入教师作业
  function setClassCode(code) {
    setState(prev => ({ ...prev, classCode: code || null }))
  }

  // 切换使用模式（family / campus / school-home）
  // 切到不需要班级码的模式时，自动清除已加入的班级
  function setAppMode(mode) {
    if (!isValidMode(mode)) return
    setState(prev => ({
      ...prev,
      appMode: mode,
      classCode: mode === MODE.FAMILY ? null : prev.classCode,
    }))
  }

  function refreshDailyTasks() {
    const todayStr = today()
    const todayDow = new Date().getDay() // 0=周日, 1=周一 … 6=周六
    setState(prev => {
      if (prev.tasks.some(t => t.date === todayStr)) return prev

      // 普通模板任务
      const newTasks = TASK_TEMPLATES
        .filter(t => !t.weekdays || t.weekdays.includes(todayDow))
        .map(t => ({
          ...t, id: `${t.id}_${todayStr}`, templateId: t.id, status: 'pending', date: todayStr,
        }))

      // B版：注入教师作业（若已连接班级码）
      const teacherTasks = prev.classCode
        ? bridgeGetTasks(prev.classCode).map(a => ({
            id: `teacher_${a.id}_${todayStr}`,
            templateId: null,
            name: a.name,
            icon: a.icon || '📖',
            points: a.points || 15,
            category: a.subject || '学习',
            status: 'pending',
            date: todayStr,
            source: 'teacher',
            assignmentId: a.id,
            classCode: prev.classCode,
          }))
        : []

      return { ...prev, tasks: [...prev.tasks, ...newTasks, ...teacherTasks] }
    })
  }

  useEffect(() => {
    // 挂载时补齐「今日任务」：内部 setState 用函数式更新，已有今日任务则原样返回
    // （这是一次性初始化同步，非循环渲染，故豁免该规则）
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshDailyTasks()
  }, [])

  // ── 班级花园：定期发布自己的宠物快照到 classLink.peers ─
  useEffect(() => {
    if (!state.classCode || !state.initialized) return
    bridgePublishPresence(state.classCode, profileIdRef.current, {
      childName: state.childName,
      petName: state.pet?.name,
      petType: state.petType,
      petStage: getPetStage(state.pet?.exp || 0),
      streak: state.streak,
    })
  }, [state.classCode, state.initialized, state.childName, state.pet?.name, state.petType, state.pet?.exp, state.streak])

  // ── 实时同步：跨标签 / 教师端写入时，自动重拉教师作业 ──
  // 监听浏览器的 storage 事件（同源跨标签自动触发）
  useEffect(() => {
    function onStorageChange(e) {
      if (e.key === 'petClassLinks' || e.key === storageKey(profileId)) {
        // 立即刷新——若有新作业会被注入到今日任务
        setState(prev => {
          // 只刷新教师作业，避免 stale 任务被覆盖
          if (!prev.classCode) return prev
          const todayStr = today()
          const todayDow = new Date().getDay()
          const fresh = bridgeGetTasks(prev.classCode).map(a => ({
            id: `teacher_${a.id}_${todayStr}`,
            templateId: a.id,
            name: a.name, icon: a.icon, points: a.points,
            category: a.subject || '学校作业',
            status: 'pending',
            date: todayStr,
            source: 'teacher',
            classCode: prev.classCode,
            assignmentId: a.id,
            dueDate: a.dueDate,
            dow: todayDow,
          }))
          // 合并：保留非 teacher 任务 + 替换 teacher 任务为最新版
          const nonTeacher = prev.tasks.filter(t => t.source !== 'teacher' || t.date !== todayStr)
          // 已完成 / 已确认状态保留
          const existingTeacher = new Map(
            prev.tasks
              .filter(t => t.source === 'teacher' && t.date === todayStr)
              .map(t => [t.assignmentId, t])
          )
          const merged = fresh.map(t => {
            const exist = existingTeacher.get(t.assignmentId)
            return exist ? { ...t, status: exist.status } : t
          })
          return { ...prev, tasks: [...nonTeacher, ...merged] }
        })
      }
    }
    window.addEventListener('storage', onStorageChange)
    // 同标签内（教师 → 学员）也补一个 custom event
    const onSameTab = () => onStorageChange({ key: 'petClassLinks' })
    window.addEventListener('pet-class-link-changed', onSameTab)
    return () => {
      window.removeEventListener('storage', onStorageChange)
      window.removeEventListener('pet-class-link-changed', onSameTab)
    }
  }, [profileId])

  const todayTasks = state.tasks.filter(t => t.date === today())
  const petStage = getPetStage(state.pet.exp)
  const history      = useMemo(() => buildHistory(state.tasks),      [state.tasks])
  const monthlyStats = useMemo(() => buildMonthlyStats(state.tasks),  [state.tasks])

  return {
    ...state,
    petStage,
    todayTasks,
    history,
    monthlyStats,
    setup,
    addTask,
    deleteTask,
    confirmTask,
    markDone,
    refreshDailyTasks,
    clearStreakBonus,
    clearExpMilestones,
    renamePet,
    renameChild,
    equipItem,
    claimWeeklyChallenge,
    recordEvolution,
    setClassCode,
    setAppMode,
  }
}

export function getPetStage(exp) {
  for (let i = EXP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (exp >= EXP_THRESHOLDS[i]) return i + 1
  }
  return 0
}

export function getPetNextThreshold(exp) {
  for (const t of EXP_THRESHOLDS) {
    if (exp < t) return t
  }
  return null
}

export function getProfileSnapshot(profileId) {
  try {
    const state = readStateRaw(profileId)   // 纯读取，不触发日登录奖励副作用
    if (!state.initialized) return null
    const label = getProfiles().find(p => p.id === profileId)?.label || profileId
    return {
      id: profileId,
      label,
      childName: state.childName || '未知',
      petName: state.pet?.name || '未命名',
      petType: state.petType || 'west-highland',
      petStage: getPetStage(state.pet?.exp || 0),
      exp: state.pet?.exp || 0,
      streak: state.streak || 0,
      bestStreak: state.bestStreak || 0,
      appMode: state.appMode || MODE.FAMILY,
      classCode: state.classCode || null,
    }
  } catch { return null }
}
