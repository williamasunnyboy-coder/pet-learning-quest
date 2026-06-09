const CACHE = 'pet-app-v2'

// 兼容部署在子目录下：用 self.registration.scope 推断 base
const BASE = new URL(self.registration?.scope || self.location.href).pathname
const INDEX = BASE   // scope 通常就是 '.../pet-garden/'

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll([INDEX])))
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  const url = e.request.url

  // Pet images from GitHub CDN: aggressive cache-first (images rarely change)
  if (url.includes('raw.githubusercontent.com')) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached
        return fetch(e.request).then(res => {
          if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()))
          return res
        })
      })
    )
    return
  }

  // App shell: network-first, fallback to cache
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()))
        return res
      })
      .catch(() => caches.match(e.request))
  )
})
