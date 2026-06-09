// Web Audio API synth sounds — no external files needed

let _ctx = null

export function getSoundEnabled() {
  return localStorage.getItem('petSoundEnabled') !== '0'
}

export function setSoundEnabled(val) {
  localStorage.setItem('petSoundEnabled', val ? '1' : '0')
}

function getCtx() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (_ctx.state === 'suspended') _ctx.resume()
  return _ctx
}

function tone(freq, startOffset, duration, volume = 0.25, type = 'sine') {
  try {
    const c = getCtx()
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.connect(gain)
    gain.connect(c.destination)
    osc.type = type
    osc.frequency.setValueAtTime(freq, c.currentTime + startOffset)
    gain.gain.setValueAtTime(volume, c.currentTime + startOffset)
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + startOffset + duration)
    osc.start(c.currentTime + startOffset)
    osc.stop(c.currentTime + startOffset + duration + 0.01)
  } catch {}
}

/** 孩子打卡 — 轻脆单音 */
export function playMarkDone() {
  if (!getSoundEnabled()) return
  tone(880, 0, 0.18, 0.22)
}

/** 家长确认 — 愉快上升双音 */
export function playConfirmed() {
  if (!getSoundEnabled()) return
  tone(523, 0,    0.15, 0.22)
  tone(784, 0.14, 0.25, 0.22)
}

/** 进化 — 四音上行 */
export function playEvolution() {
  if (!getSoundEnabled()) return
  ;[523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.10, 0.30, 0.28))
}

/** 连打奖励 — 五音欢快 */
export function playStreakBonus() {
  if (!getSoundEnabled()) return
  ;[523, 659, 784, 659, 1047].forEach((f, i) => tone(f, i * 0.08, 0.20, 0.25))
}

/** 点击宠物 — 轻柔 */
export function playTapPet() {
  if (!getSoundEnabled()) return
  tone(660, 0, 0.10, 0.12, 'triangle')
}

/** 获得成就 — 上行和弦 */
export function playAchievement() {
  if (!getSoundEnabled()) return
  ;[392, 494, 587, 784].forEach((f, i) => tone(f, i * 0.09, 0.25, 0.25))
}

/** PIN 输入按键 */
export function playPinKey() {
  if (!getSoundEnabled()) return
  tone(440, 0, 0.06, 0.10, 'square')
}

/** PIN 错误 */
export function playPinError() {
  if (!getSoundEnabled()) return
  tone(220, 0, 0.15, 0.20)
  tone(196, 0.15, 0.25, 0.20)
}
