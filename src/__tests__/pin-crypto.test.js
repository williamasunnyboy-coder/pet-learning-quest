import { describe, it, expect } from 'vitest'
import { hashPinV2, verifyPinAgainst, isLegacyHash } from '../pin-crypto'

describe('pin-crypto', () => {
  it('hashPinV2 输出形如 v2:<salt>:<hash>', async () => {
    const h = await hashPinV2('1234')
    expect(h.startsWith('v2:')).toBe(true)
    const parts = h.split(':')
    expect(parts.length).toBe(3)
    expect(parts[1].length).toBeGreaterThan(0)
    expect(parts[2].length).toBeGreaterThan(0)
  })

  it('verifyPinAgainst v2: 正确密码通过', async () => {
    const h = await hashPinV2('1234')
    expect(await verifyPinAgainst(h, '1234')).toBe(true)
  })

  it('verifyPinAgainst v2: 错误密码拒绝', async () => {
    const h = await hashPinV2('1234')
    expect(await verifyPinAgainst(h, '4321')).toBe(false)
  })

  it('verifyPinAgainst 兼容 v1: 旧版哈希', async () => {
    const legacy = 'v1:' + btoa(unescape(encodeURIComponent('PetApp' + '0000' + 'Salt24')))
    expect(await verifyPinAgainst(legacy, '0000')).toBe(true)
    expect(await verifyPinAgainst(legacy, '0001')).toBe(false)
  })

  it('verifyPinAgainst 兼容极老明文', async () => {
    expect(await verifyPinAgainst('9999', '9999')).toBe(true)
    expect(await verifyPinAgainst('9999', '0000')).toBe(false)
  })

  it('isLegacyHash 正确判断', async () => {
    const v2 = await hashPinV2('1234')
    expect(isLegacyHash(v2)).toBe(false)
    expect(isLegacyHash('v1:abc')).toBe(true)
    expect(isLegacyHash('1234')).toBe(true)
  })
})
