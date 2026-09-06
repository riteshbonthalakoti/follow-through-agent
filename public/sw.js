// FollowThrough Service Worker v3
const CACHE = 'ft-v3'
const OFFLINE_URL = '/offline'
const STATIC = ['/offline', '/manifest.json', '/icons/icon-192x192.png', '/icons/icon-512x512.png', '/apple-touch-icon.png', '/logo.svg']

// ── Install ────────────────────────────────────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  )
})

// ── Activate ───────────────────────────────────────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

// ── Fetch ──────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', e => {
  const { request } = e
  const url = new URL(request.url)

  // Skip non-GET and cross-origin
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  // API: network-only with offline fallback JSON
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ error: 'offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    )
    return
  }

  // Navigation: network-first, offline page fallback
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then(res => {
          // Cache successful navigations for offline
          if (res.ok) {
            const clone = res.clone()
            caches.open(CACHE).then(c => c.put(request, clone))
          }
          return res
        })
        .catch(() => caches.match(OFFLINE_URL) || caches.match('/'))
    )
    return
  }

  // Static assets: cache-first, update in background (stale-while-revalidate)
  e.respondWith(
    caches.match(request).then(cached => {
      const networkFetch = fetch(request).then(res => {
        if (res.ok) {
          const toCache = res.clone()
          caches.open(CACHE).then(c => c.put(request, toCache))
        }
        return res
      })
      return cached || networkFetch
    })
  )
})

// ── Push notifications (future) ────────────────────────────────────────────────
self.addEventListener('push', e => {
  if (!e.data) return
  const { title, body, url } = e.data.json()
  e.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      data: { url },
      vibrate: [100, 50, 100],
    })
  )
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  e.waitUntil(clients.openWindow(e.notification.data?.url || '/dashboard'))
})
