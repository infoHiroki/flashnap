const CACHE_NAME = 'flashnap-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/lib/jszip.min.js'
];

// インストール時にアセットをキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// アクティベート時に古いキャッシュを削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// フェッチ時はキャッシュ優先、なければネットワーク
// Google APIはキャッシュしない
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Google APIとaccounts.google.comはキャッシュをバイパス
  if (url.includes('googleapis.com') ||
      url.includes('accounts.google.com') ||
      url.includes('apis.google.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// アプリ更新メッセージを受信
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
