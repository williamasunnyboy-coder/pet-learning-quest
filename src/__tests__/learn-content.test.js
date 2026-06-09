import { describe, it, expect } from 'vitest'
import { genMathProblems, genFlashCards, pickModule } from '../learn-content'

describe('learn-content', () => {
  describe('genMathProblems', () => {
    it('生成指定数量的题目', () => {
      expect(genMathProblems(10).length).toBe(10)
      expect(genMathProblems(5).length).toBe(5)
    })

    it('答案与表达式一致', () => {
      for (const p of genMathProblems(20)) {
        const expected =
          p.op === '+' ? p.a + p.b :
          p.op === '-' ? p.a - p.b : p.a * p.b
        expect(p.answer).toBe(expected)
      }
    })

    it('减法不会出负数', () => {
      for (const p of genMathProblems(50)) {
        if (p.op === '-') expect(p.answer).toBeGreaterThanOrEqual(0)
      }
    })

    it('乘法控制在 9x9 以内', () => {
      for (const p of genMathProblems(50)) {
        if (p.op === '*') {
          expect(p.a).toBeLessThanOrEqual(9)
          expect(p.b).toBeLessThanOrEqual(9)
        }
      }
    })
  })

  describe('genFlashCards', () => {
    it('每张卡有 4 个选项', () => {
      const cards = genFlashCards(5)
      expect(cards.length).toBe(5)
      cards.forEach(c => {
        expect(c.choices.length).toBe(4)
        expect(c.choices).toContain(c.correct)
      })
    })

    it('卡片不重复', () => {
      const cards = genFlashCards(10)
      const chars = new Set(cards.map(c => c.char))
      expect(chars.size).toBe(cards.length)
    })
  })

  describe('pickModule', () => {
    it('数学任务 → math 模块', () => {
      expect(pickModule({ name: '数学口算练习' }).type).toBe('math')
      expect(pickModule({ category: '数学', name: '加减法' }).type).toBe('math')
    })
    it('拼音/识字任务 → flash 模块', () => {
      expect(pickModule({ name: '拼音练习' }).type).toBe('flash')
      expect(pickModule({ name: '生字朗读' }).type).toBe('flash')
    })
    it('阅读任务 → timer 模块', () => {
      expect(pickModule({ name: '亲子阅读 10 分钟' }).type).toBe('timer')
    })
    it('未匹配 → confirm 模块', () => {
      expect(pickModule({ name: '整理书桌' }).type).toBe('confirm')
    })
  })
})
