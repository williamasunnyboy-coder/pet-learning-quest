// Haptic feedback — wraps navigator.vibrate with pattern helpers
// Silently fails on browsers / devices that don't support it.

export function hapticLight() {
  try { navigator.vibrate?.(30) } catch {}
}

export function hapticMedium() {
  try { navigator.vibrate?.(60) } catch {}
}

export function hapticSuccess() {
  try { navigator.vibrate?.([40, 30, 40]) } catch {}
}

export function hapticError() {
  try { navigator.vibrate?.([80, 50, 80]) } catch {}
}
