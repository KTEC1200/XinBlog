const CACHE_NAME = 'xinblog-shell-v3';
const SHELL_ASSETS = ['/', '/index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => keys.filter((key) => key !== CACHE_NAME))
      .then((oldKeys) => Promise.all(oldKeys.map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

function isAssetRequest(url) {
  return (
    url.pathname.startsWith('/assets/') ||
    /\.(js|css|png|jpg|jpeg|gif|svg|webp|woff|woff2|ttf|ico|json)$/.test(url.pathname)
  );
}

// 服务器对不存在的静态资源会兜底返回 200 的 index/html，
// 这种响应一旦入缓存会让老访客永远打不开站点，必须拒收
function isHtmlFallback(url, response) {
  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  return isAssetRequest(url) && contentType.includes('text/html');
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.pathname.startsWith('/api/') || url.origin !== self.location.origin) {
    return;
  }

  if (isAssetRequest(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached && !isHtmlFallback(url, cached)) return cached;
        return fetch(request).then((response) => {
          if (response && response.status === 200 && !isHtmlFallback(url, response)) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/index.html').then((cached) => cached || caches.match('/'))
      )
    );
    return;
  }
});
