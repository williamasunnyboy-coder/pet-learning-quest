import { describe, it, expect } from 'vitest'
import { migrate, CURRENT_SCHEMA_VERSION } from '../state-migrations'
import { MODE } from '../constants/modes'

describe('state-migrations', () => {
  it('null / 非对象返回 null', () => {
    expect(migrate(null)).toBe(null)
    expect(migrate(undefined)).toBe(null)
  })

  it('空对象升到最新版且打上 schemaVersion', () => {
    const out = migrate({})
    expect(out.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
    expect(out.weeklyChallenge).toEqual({ weekStart: null, claimed: false })
    expect(out.evolutionLog).toEqual([])
    expect(out.classCode).toBe(null)
    expect(out.appMode).toBe(MODE.FAMILY)
  })

  it('已是最新版直接返回（幂等）', () => {
    const v3 = migrate({})
    const v3b = migrate(v3)
    expect(v3b.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
  })

  it('v2 → v3 给老 task 补 templateId', () => {
    const old = {
      schemaVersion: 2,
      tasks: [
        { id: 'math_2026-05-01', name: '数学', date: '2026-05-01' },
        { id: 'reading_2026-05-01', templateId: 'reading', name: '阅读', date: '2026-05-01' },
      ],
    }
    const out = migrate(old)
    expect(out.tasks[0].templateId).toBe('math')
    expect(out.tasks[1].templateId).toBe('reading')   // 已存在的不覆盖
  })

  it('v0 老档案补全 weeklyChallenge / evolutionLog', () => {
    const ancient = { childName: '小明' }   // 没有 schemaVersion
    const out = migrate(ancient)
    expect(out.weeklyChallenge).toBeDefined()
    expect(out.evolutionLog).toBeDefined()
    expect(out.childName).toBe('小明')
  })
})
