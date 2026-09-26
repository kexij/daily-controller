// 极简 Service Worker：只做网络透传，不缓存任何内容。
// 作用：满足浏览器"可安装 PWA"的条件（拥有 fetch 处理器），
// 同时因为完全不缓存，频繁迭代时不会出现页面内容过期的问题。
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', () => {
  // 故意不调用 event.respondWith()，让浏览器按默认行为直接请求网络
})
