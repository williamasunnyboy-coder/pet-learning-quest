// Browser notification helpers
// Permission must be requested by a user gesture.

export function getNotifEnabled() {
  return localStorage.getItem('petNotifEnabled') === '1'
}

export function setNotifEnabled(val) {
  localStorage.setItem('petNotifEnabled', val ? '1' : '0')
}

export async function requestNotifPermission() {
  if (!('Notification' in window)) return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function showPetNotification(title, body) {
  if (!getNotifEnabled()) return
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  try {
    new Notification(title, { body, icon: '/icon-192.png' })
  } catch {}
}
