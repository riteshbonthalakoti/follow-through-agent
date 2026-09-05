const CACHE_NAME = 'followthrough-v2'
const STATIC_ASSETS = [
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Always network-first for API and HTML navigation — never serve stale auth redirects
  if (
    url.pathname.startsWith('/api/') ||
    event.request.mode === 'navigate'
  ) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Offline fallback for navigation: return cached landing page
        return caches.match('/') || new Response('Offline — open the app when connected.', { status: 503 })
      })
    )
    return
  }

  // Cache-first for static assets (images, fonts, icons)
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached
        return fetch(event.request).then((response) => {
          if (response.ok) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()))
          }
          return response
        })
      })
    )
  }
})
