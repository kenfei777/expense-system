const CACHE = 'expense-v1';
const ASSETS = [
  '/expense-system/',
  '/expense-system/index.html',
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js'
];

// 安装：预缓存核心资源
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      // 逐个缓存，失败不影响整体
      return Promise.allSettled(ASSETS.map(url => cache.add(url).catch(() => {})));
    }).then(() => self.skipWaiting())
  );
});

// 激活：清理旧缓存
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// 请求拦截：优先网络，网络失败用缓存
self.addEventListener('fetch', e => {
  // Firebase 请求不走缓存（需要实时数据）
  if (e.request.url.includes('firestore.googleapis.com') ||
      e.request.url.includes('firebase') && e.request.url.includes('googleapis')) {
    return;
  }
  e.respondWith(
    fetch(e.request)
      .then(res => {
        // 成功则更新缓存
        if (res && res.status === 200 && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
