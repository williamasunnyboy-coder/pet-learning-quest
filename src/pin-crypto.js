/**
 * PIN 哈希 —— Web Crypto + PBKDF2 + 加盐
 *
 * 存储格式：
 *   v1:<base64>           旧版（btoa 简单拼接），仅做兼容验证
 *   v2:<saltB64>:<hashB64> 新版 SHA-256 over PBKDF2(100k iters)
 *
 * 第一次用 setPinCode 时即升级为 v2；老用户输入正确 PIN 后下一次也自动升级。
 */
const ITERATIONS = 100_000
const SALT_BYTES = 16

function bufToB64(buf) {
  const bytes = new Uint8Array(buf)
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
  return btoa(s)
}

function b64ToBuf(b64) {
  const bin = atob(b64)
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  return arr.buffer
}

async function derive(pin, salt) {
  const enc  = new TextEncoder()
  const key  = await crypto.subtle.importKey(
    'raw', enc.encode(pin), { name: 'PBKDF2' }, false, ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    key, 256
  )
  return bits
}

/** v2: async — 推荐 */
export async function hashPinV2(pin) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  const hash = await derive(pin, salt)
  return `v2:${bufToB64(salt)}:${bufToB64(hash)}`
}

/** v1（旧）— 仅做老存档兼容验证 */
function hashPinV1Legacy(pin) {
  try { return 'v1:' + btoa(unescape(encodeURIComponent('PetApp' + pin + 'Salt24'))) }
  catch { return 'v1:' }
}

/**
 * 校验输入 PIN 是否与已存储 hash 匹配。
 * 自动识别 v1 / v2，以及无前缀的明文（极老版本）。
 */
export async function verifyPinAgainst(stored, pin) {
  if (!stored) return false
  if (stored.startsWith('v2:')) {
    const [, saltB64, hashB64] = stored.split(':')
    if (!saltB64 || !hashB64) return false
    const salt   = new Uint8Array(b64ToBuf(saltB64))
    const expect = bufToB64(await derive(pin, salt))
    return expect === hashB64
  }
  if (stored.startsWith('v1:')) return stored === hashPinV1Legacy(pin)
  // 极老版本：明文存储
  return stored === pin
}

/** 用于判断这个 hash 是否需要在下次校验通过后升级为 v2 */
export function isLegacyHash(stored) {
  return !!stored && !stored.startsWith('v2:')
}
