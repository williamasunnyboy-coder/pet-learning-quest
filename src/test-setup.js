/**
 * vitest 全局测试 setup
 *
 * jsdom 自身不提供 SubtleCrypto — pin-crypto 测试需要它。
 * 这里挂 polyfill：用 Node 的 globalThis.crypto.subtle（Node 20+ 已内置）
 */
import { webcrypto } from 'node:crypto'

if (!globalThis.crypto || !globalThis.crypto.subtle) {
  globalThis.crypto = webcrypto
}

// 清理 localStorage（每个测试隔离）
import { beforeEach } from 'vitest'
beforeEach(() => {
  localStorage.clear()
})
