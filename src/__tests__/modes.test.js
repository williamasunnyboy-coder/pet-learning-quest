import { describe, it, expect } from 'vitest'
import { MODE, MODE_LIST, isValidMode, needsClassCode, isAutoConfirmMode } from '../constants/modes'

describe('mode constants', () => {
  it('三种模式 ID 固定', () => {
    expect(MODE.FAMILY).toBe('family')
    expect(MODE.CAMPUS).toBe('campus')
    expect(MODE.SCHOOL_HOME).toBe('school-home')
  })

  it('MODE 对象被冻结', () => {
    expect(() => { MODE.FAMILY = 'x' }).toThrow()
  })

  it('MODE_LIST 包含全部三种', () => {
    expect(MODE_LIST.length).toBe(3)
    expect(MODE_LIST).toContain('family')
    expect(MODE_LIST).toContain('campus')
    expect(MODE_LIST).toContain('school-home')
  })

  it('isValidMode', () => {
    expect(isValidMode('family')).toBe(true)
    expect(isValidMode('campus')).toBe(true)
    expect(isValidMode('school-home')).toBe(true)
    expect(isValidMode('xxx')).toBe(false)
    expect(isValidMode(null)).toBe(false)
    expect(isValidMode(undefined)).toBe(false)
  })

  it('needsClassCode', () => {
    expect(needsClassCode(MODE.FAMILY)).toBe(false)
    expect(needsClassCode(MODE.CAMPUS)).toBe(true)
    expect(needsClassCode(MODE.SCHOOL_HOME)).toBe(true)
  })

  it('isAutoConfirmMode 仅校园模式', () => {
    expect(isAutoConfirmMode(MODE.FAMILY)).toBe(false)
    expect(isAutoConfirmMode(MODE.CAMPUS)).toBe(true)
    expect(isAutoConfirmMode(MODE.SCHOOL_HOME)).toBe(false)
  })
})
