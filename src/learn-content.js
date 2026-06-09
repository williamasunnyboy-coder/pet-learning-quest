/**
 * 学习内容生成器
 *
 * 每种任务模板映射到一种学习模块（口算 / 闪卡 / 计时 / 简单确认）。
 * 任务的 templateId 中含关键字时自动触发，未匹配的回落到简单"确认完成"按钮。
 */

// ── 口算 ─────────────────────────────────────────────────
export function genMathProblems(count = 10, level = 'easy') {
  const range = level === 'hard' ? 50 : level === 'medium' ? 20 : 10
  const ops   = level === 'hard' ? ['+', '-', '*'] : level === 'medium' ? ['+', '-', '*'] : ['+', '-']
  const set = new Set()
  const problems = []
  let safety = 0
  while (problems.length < count && safety++ < count * 10) {
    const op = ops[Math.floor(Math.random() * ops.length)]
    let a = Math.floor(Math.random() * range) + 1
    let b = Math.floor(Math.random() * range) + 1
    if (op === '-' && b > a) [a, b] = [b, a]                  // 不出负数
    if (op === '*') { a = Math.min(a, 9); b = Math.min(b, 9) } // 乘法控制在 9×9 以内
    const key = `${a}${op}${b}`
    if (set.has(key)) continue
    set.add(key)
    const ans = op === '+' ? a + b : op === '-' ? a - b : a * b
    problems.push({ a, b, op, answer: ans })
  }
  return problems
}

// ── 拼音 / 识字闪卡 ──────────────────────────────────────
// 一卡一题：给汉字猜拼音 / 给拼音猜汉字
const FLASH_BANK = [
  { char: '春', pinyin: 'chūn', meaning: '春天' },
  { char: '夏', pinyin: 'xià',  meaning: '夏天' },
  { char: '秋', pinyin: 'qiū',  meaning: '秋天' },
  { char: '冬', pinyin: 'dōng', meaning: '冬天' },
  { char: '日', pinyin: 'rì',   meaning: '太阳' },
  { char: '月', pinyin: 'yuè',  meaning: '月亮' },
  { char: '水', pinyin: 'shuǐ', meaning: '水' },
  { char: '火', pinyin: 'huǒ',  meaning: '火' },
  { char: '山', pinyin: 'shān', meaning: '山' },
  { char: '人', pinyin: 'rén',  meaning: '人' },
  { char: '花', pinyin: 'huā',  meaning: '花朵' },
  { char: '草', pinyin: 'cǎo',  meaning: '小草' },
  { char: '木', pinyin: 'mù',   meaning: '树木' },
  { char: '雨', pinyin: 'yǔ',   meaning: '下雨' },
  { char: '风', pinyin: 'fēng', meaning: '风' },
  { char: '云', pinyin: 'yún',  meaning: '云朵' },
  { char: '雪', pinyin: 'xuě',  meaning: '雪花' },
  { char: '鸟', pinyin: 'niǎo', meaning: '小鸟' },
  { char: '鱼', pinyin: 'yú',   meaning: '鱼' },
  { char: '马', pinyin: 'mǎ',   meaning: '马' },
]

export function genFlashCards(count = 5) {
  const shuffled = [...FLASH_BANK].sort(() => Math.random() - 0.5).slice(0, count)
  return shuffled.map(card => {
    // 三个干扰项
    const others = FLASH_BANK.filter(x => x.char !== card.char).sort(() => Math.random() - 0.5).slice(0, 3)
    const choices = [...others.map(c => c.pinyin), card.pinyin].sort(() => Math.random() - 0.5)
    return { ...card, choices, correct: card.pinyin }
  })
}

// ── 任务模板 → 学习模块映射 ─────────────────────────────
const KEYWORD_MAP = [
  { match: /数学|口算|算术|加减乘除|计算/, type: 'math', level: 'easy', count: 10 },
  { match: /拼音|识字|生字|认字|朗读|背诵/, type: 'flash', count: 5 },
  { match: /阅读|读书|读绘本/, type: 'timer', seconds: 60 * 10 },    // 10 分钟计时
  { match: /运动|跑步|跳绳|锻炼/, type: 'timer', seconds: 60 * 5 },
]

export function pickModule(task) {
  const text = `${task.name || ''} ${task.category || ''} ${task.templateId || ''}`
  for (const rule of KEYWORD_MAP) {
    if (rule.match.test(text)) {
      const { match, ...module } = rule
      return module
    }
  }
  return { type: 'confirm' }  // 默认：单纯"完成确认"
}
