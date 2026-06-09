// ─── 教师端数据层 ──────────────────────────────────
// 存储键
const TEACHER_KEY     = 'petTeacherData'
const CLASS_LINKS_KEY = 'petClassLinks'   // B版共享桥：教师 ↔ 家长

// ─── 工具 ─────────────────────────────────────────
export function today() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// ─── 教师主数据 ────────────────────────────────────
export function loadTeacherData() {
  try {
    const raw = localStorage.getItem(TEACHER_KEY)
    return raw ? JSON.parse(raw) : { initialized: false }
  } catch { return { initialized: false } }
}

export function saveTeacherData(data) {
  try { localStorage.setItem(TEACHER_KEY, JSON.stringify(data)) } catch {}
}

export function clearTeacherData() {
  localStorage.removeItem(TEACHER_KEY)
  // 清空该教师发布的所有班级码
  try {
    const links = getClassLinks()
    const data  = loadTeacherData()
    const myCodes = (data.classes || []).map(c => c.code).filter(Boolean)
    myCodes.forEach(code => delete links[code])
    localStorage.setItem(CLASS_LINKS_KEY, JSON.stringify(links))
  } catch {}
}

// ─── 班级码共享层（B版跨端同步）──────────────────
export function getClassLinks() {
  try { return JSON.parse(localStorage.getItem(CLASS_LINKS_KEY) || '{}') }
  catch { return {} }
}

// 同源跨组件通知（同标签内 storage event 不会自发触发，这里手动派发一个 CustomEvent）
function notifyClassLinkChanged() {
  try { window.dispatchEvent(new CustomEvent('pet-class-link-changed')) } catch {}
}

// 教师将班级码+当前作业列表写入共享层
export function publishClassLink(code, { classId, className, teacherName, assignments }) {
  const links = getClassLinks()
  links[code] = {
    classId, className, teacherName,
    assignments: assignments || [],
    completions: links[code]?.completions || {},   // 保留家长已确认的记录
  }
  localStorage.setItem(CLASS_LINKS_KEY, JSON.stringify(links))
  notifyClassLinkChanged()
}

// 家长查询班级信息（输入班级码）
export function lookupClassCode(code) {
  const links = getClassLinks()
  return links[code] || null
}

// 获取某班级码对应的今日作业（供 store.js 注入）
export function getTeacherTasksForCode(code) {
  const links = getClassLinks()
  const link  = links[code]
  if (!link) return []
  const todayStr = today()
  return (link.assignments || []).filter(a =>
    a.dueDate >= todayStr && a.assignedDate <= todayStr
  )
}

// 家长端确认完成后上报给共享层（B版）
export function reportCompletion(code, profileId, assignmentId) {
  try {
    const links = getClassLinks()
    if (!links[code]) return
    if (!links[code].completions) links[code].completions = {}
    if (!links[code].completions[assignmentId]) links[code].completions[assignmentId] = {}
    links[code].completions[assignmentId][profileId] = 'confirmed'
    localStorage.setItem(CLASS_LINKS_KEY, JSON.stringify(links))
    notifyClassLinkChanged()
  } catch {}
}

// 教师查看某作业的完成人数（B版）
export function getCompletionCount(code, assignmentId) {
  const links = getClassLinks()
  return Object.keys(links[code]?.completions?.[assignmentId] || {}).length
}

// ─── 班级花园：学生发布自己的宠物快照供同班可见 ─────────
// 仅暴露最少信息：昵称首字、宠物 emoji、进化阶段、连击。
// 不写真实姓名，不写 exp 具体数值（避免比较焦虑）。
export function publishPetPresence(code, profileId, snapshot) {
  if (!code || !profileId) return
  try {
    const links = getClassLinks()
    if (!links[code]) return                 // 班级码无效则不发布
    if (!links[code].peers) links[code].peers = {}
    links[code].peers[profileId] = {
      childInitial: (snapshot.childName || '?').slice(0, 1),
      petName: snapshot.petName,
      petType: snapshot.petType,
      petStage: snapshot.petStage,
      streak: snapshot.streak || 0,
      updatedAt: Date.now(),
    }
    localStorage.setItem(CLASS_LINKS_KEY, JSON.stringify(links))
    notifyClassLinkChanged()
  } catch {}
}

export function getClassPeers(code) {
  try {
    const links = getClassLinks()
    return links[code]?.peers || {}
  } catch { return {} }
}

// ─── 默认科目 / 图标 ──────────────────────────────
export const SUBJECTS = ['语文', '数学', '英语', '科学', '体育', '美术', '音乐', '综合']
export const TASK_ICONS_T = ['📖', '📝', '✏️', '🔢', '🔬', '🎨', '🎵', '🏃', '🌟', '💪']

// ─── Demo 班级码 123456 —— 用于本地预览/测试 ───────────
// 模块加载时自动执行；若 123456 已存在（或老师真的创建过），不会覆盖。
export const DEMO_CLASS_CODE = '123456'

export function seedDemoClass() {
  try {
    const links = getClassLinks()
    if (links[DEMO_CLASS_CODE]) return false   // 已存在，跳过
    const todayStr = today()
    const inDays = n => {
      const d = new Date()
      d.setDate(d.getDate() + n)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    }
    links[DEMO_CLASS_CODE] = {
      classId: 'demo-class-001',
      className: '三年级一班',
      teacherName: '王老师',
      isDemo: true,
      assignments: [
        {
          id: 'demo-a1',
          name: '朗读《静夜思》3 遍',
          icon: '📖',
          subject: '语文',
          points: 15,
          assignedDate: todayStr,
          dueDate: inDays(3),
        },
        {
          id: 'demo-a2',
          name: '口算练习 20 题',
          icon: '🔢',
          subject: '数学',
          points: 20,
          assignedDate: todayStr,
          dueDate: inDays(1),
        },
        {
          id: 'demo-a3',
          name: '英语单词抄写 page 12',
          icon: '✏️',
          subject: '英语',
          points: 10,
          assignedDate: todayStr,
          dueDate: inDays(2),
        },
      ],
      completions: {},
    }
    localStorage.setItem(CLASS_LINKS_KEY, JSON.stringify(links))
    return true
  } catch { return false }
}

// 模块加载时自动种子（仅在浏览器侧执行）
if (typeof window !== 'undefined') {
  seedDemoClass()
}
