/**
 * 全局类型声明 —— 项目仍以 JS/JSX 为主，这里只定义关键 schema，
 * 让 IDE 在 hover / 自动补全时可以给出提示。
 * 新文件若用 .ts/.tsx，会自动消费这些类型。
 */

// ─── 模式 ────────────────────────────────────────────────
export type AppMode = 'family' | 'campus' | 'school-home'

// ─── 宠物 / 状态 ──────────────────────────────────────────
export interface Pet {
  name: string
  exp: number
  hunger: number
  lastFedDate: string | null
}

export interface Task {
  id: string
  templateId?: string | null
  name: string
  icon: string
  points: number
  category: string
  status: 'pending' | 'done' | 'confirmed'
  date: string                  // YYYY-MM-DD
  /** 教师作业字段（school-home / campus 模式下） */
  source?: 'teacher'
  classCode?: string
  assignmentId?: string
  dueDate?: string
  dow?: number
}

export interface WeeklyChallenge {
  weekStart: string | null
  claimed: boolean
}

export interface EvolutionEntry {
  date: string
  stage: number
  petName: string
}

export interface EquippedItems {
  hat: string | null
  acc: string | null
}

export interface AppState {
  /** 由 state-migrations.ts 维护 */
  schemaVersion: number
  pet: Pet
  petType: string
  streak: number
  bestStreak: number
  lastStreakDate: string | null
  streakMilestonesHit: number[]
  expMilestonesShown: number[]
  streakBonus: { streak: number; bonus: number } | null
  latestExpMilestones: number[]
  taskCounts: Record<string, number>
  equippedItems: EquippedItems
  classCode: string | null
  appMode: AppMode
  weeklyChallenge: WeeklyChallenge
  evolutionLog: EvolutionEntry[]
  lastLoginDate: string | null
  _dailyBonusToday: boolean   // 不持久化的临时旗标
  tasks: Task[]
  childName: string
  initialized: boolean
}

// ─── 教师层 ─────────────────────────────────────────────
export interface Assignment {
  id: string
  name: string
  icon?: string
  subject?: string
  points: number
  assignedDate: string
  dueDate: string
}

export interface ClassPeer {
  childInitial: string
  petName: string
  petType: string
  petStage: number
  streak: number
  updatedAt: number
}

export interface ClassLink {
  classId: string
  className: string
  teacherName: string
  isDemo?: boolean
  assignments: Assignment[]
  completions: Record<string, Record<string, 'confirmed'>>
  peers?: Record<string, ClassPeer>
}

// ─── 档案快照 ──────────────────────────────────────────
export interface ProfileSnapshot {
  id: string
  label: string
  childName: string
  petName: string
  petType: string
  petStage: number
  exp: number
  streak: number
  bestStreak: number
  appMode: AppMode
  classCode: string | null
}

// ─── 教师桥接接口 ──────────────────────────────────────
export interface TeacherBridge {
  getTasks: (code: string) => Assignment[]
  reportDone: (code: string, profileId: string, assignmentId: string) => void
  lookup: (code: string) => ClassLink | null
  publishPresence: (code: string, profileId: string, snapshot: Partial<ClassPeer> & { childName?: string }) => void
  getPeers: (code: string) => Record<string, ClassPeer>
}

// ─── 学习内容引擎 ────────────────────────────────────
export type LearnModuleType = 'math' | 'flash' | 'timer' | 'confirm'

export interface MathProblem {
  a: number
  b: number
  op: '+' | '-' | '*'
  answer: number
}

export interface FlashCard {
  char: string
  pinyin: string
  meaning: string
  choices: string[]
  correct: string
}
