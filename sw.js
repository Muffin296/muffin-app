/* Service worker: cache toàn bộ app để mở được khi mất mạng.
 * Khi cập nhật code: tăng VERSION → bản mới tự thay bản cũ, cache cũ bị xóa.
 * Chiến lược: có mạng thì lấy bản mới nhất (tối đa chờ 3 giây), mất mạng thì dùng cache.
 * Dữ liệu người dùng nằm trong localStorage, không bị ảnh hưởng khi cập nhật.
 */
const VERSION = 'muffin-v1.9.0';
const FILES = [
  './',
  './index.html',
  './styles.css',
  './rules.js',
  './app.js',
  './manifest.json',
  './icons/icon.svg',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION)
      .then((cache) => cache.addAll(FILES.map((f) => new Request(f, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('muffin-') && k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function timeout(ms) { return new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)); }

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const key = req.mode === 'navigate' ? './index.html' : req;
    try {
      const res = await Promise.race([fetch(req, { cache: 'no-cache' }), timeout(3000)]);
      if (res && res.ok && res.type === 'basic') cache.put(key, res.clone());
      return res;
    } catch (e) {
      const hit = await cache.match(key, { ignoreSearch: true });
      if (hit) return hit;
      if (req.mode === 'navigate') {
        const shell = await cache.match('./index.html');
        if (shell) return shell;
      }
      return new Response('Đang offline và chưa có bản lưu.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }
  })());
});
