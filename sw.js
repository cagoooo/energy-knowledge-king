/* Service Worker：讓網站在網路不穩時也能打開，並在有新版時通知頁面提示更新。
 * BUILD_VERSION 由部署流程（.github/stamp_version.py）蓋章，每次部署內容都不同，瀏覽器才會偵測到新版。
 * install 不呼叫 skipWaiting：新版停在 waiting，等使用者在頁面按「立即更新」才套用。
 * github.io 同一網域有很多工具，快取名稱一律加本站前綴，activate 只清自己的舊版。 */
const BUILD_VERSION = '__BUILD_VERSION__';
const PREFIX = 'energy-knowledge-king-v-';
const CACHE = PREFIX + BUILD_VERSION;
const FONT_CACHE = 'energy-knowledge-king-fonts'; // Google 字型：跨版本保留
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];
const V = '?v=' + BUILD_VERSION;

const PRECACHE = [
  './',
  'css/style.css' + V,
  'js/app.js' + V,
  'js/sw-register.js' + V,
  'favicon.svg' + V,
  'favicon.ico' + V,
  'apple-touch-icon.png' + V,
  'manifest.webmanifest' + V,
  'assets/poster.webp',
  'assets/qr-quiz.svg',
  'assets/qr-form.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.allSettled(PRECACHE.map((url) => cache.add(new Request(url, { cache: 'reload' })))))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (data.type === 'GET_VERSION') {
    event.ports[0]?.postMessage({ version: BUILD_VERSION });
  }
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch { return; }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Google 字型：有快取先用、背景更新
  if (FONT_HOSTS.includes(url.hostname)) {
    event.respondWith((async () => {
      const cache = await caches.open(FONT_CACHE);
      const cached = await cache.match(req);
      const network = fetch(req).then((res) => {
        if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
        return res;
      }).catch(() => cached);
      return cached || network;
    })());
    return;
  }

  // 其他網站（題庫、Google 表單）一律不經過 Service Worker
  if (url.origin !== self.location.origin) return;

  // 版本檔永遠向伺服器要最新的
  if (url.pathname.endsWith('/version.json')) {
    event.respondWith(fetch(req, { cache: 'no-store' }).catch(() => caches.match(req)));
    return;
  }

  // 頁面本身：網路優先（不吃瀏覽器 10 分鐘快取），離線才用留存的
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(req, { cache: 'no-cache' }).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      }).catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('./')))
    );
    return;
  }

  // 其他同源檔案：網址帶版本號的內容不會變，有快取就直接用；沒有再下載並留存
  event.respondWith(caches.match(req).then((cached) => {
    if (cached) return cached;
    return fetch(req).then((res) => {
      if (res && res.status === 200 && res.type === 'basic') { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }));
  }));
});
