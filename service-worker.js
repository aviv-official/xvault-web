var cacheName = 'xvault-0-0-1';

var filesToCache = [
    '/',
    '/index.html',
    '/app.html',
    '/manifest.json',
    '/browserconfig.xml',
    '/favicon.ico',

    '/assets/css/font-awesome.min.css',
    '/assets/css/main.css',
    '/assets/css/noscript.css',
    
    '/assets/js/breakpoints.min.js',
    '/assets/js/browser.min.js',
    '/assets/js/jquery.min.js',
    '/assets/js/main.js',
    '/assets/js/service-worker.js',
    '/assets/js/util.js',
    '/assets/js/web3-1.0.0-beta.37.min.js',

    '/assets/json/chains.json',
    '/assets/json/estate/elf.abi.json',
    '/assets/json/estate/elf.deployment.json',
    '/assets/json/estate/estate.abi.json',
    '/assets/json/estate/estate.deployment.json',
    '/assets/json/estate/estate.sale.abi.json',
    '/assets/json/estate/estate.sale.deployment.json',
    '/assets/json/nexus/nexus.abi.json',
    '/assets/json/nexus/nexus.deployment.json',
    '/assets/json/tr/tr.abi.json',
    '/assets/json/tr/tr.deployment.json',
    '/assets/json/xchange/xchange.abi.json',
    '/assets/json/xchange/xchange.deployment.json',
    '/assets/json/xtoken/xtoken.abi.json',
    '/assets/json/xtoken/xtoken.deployment.json',

    '/images/backdrop.jpg',
    '/images/checking.jpg',
    '/images/epluribus.jpg',
    '/images/forex.jpg',
    '/images/friends.jpg',
    '/images/jumping.jpg',
    '/images/logo.png',
    '/images/logo.svg',
    '/images/margin.jpg',
    '/images/money-market.jpg',
    '/images/overlay.png',
    '/images/retirement.jpg',
    '/images/service-smile.png',
    '/images/vault.jpg',

    '/images/icons/android-chrome-192x192.png',
    '/images/icons/android-chrome-512x512.png',
    '/images/icons/apple-touch-icon.png',
    '/images/icons/favicon-16x16.png',
    '/images/icons/favicon-32x32.png',
    '/images/icons/favicon.ico',
    '/images/icons/mstile-70x70.png',
    '/images/icons/mstile-70x70.png',
    '/images/icons/mstile-144x144.png',
    '/images/icons/mstile-150x150.png',
    '/images/icons/mstile-310x150.png',
    '/images/icons/mstile-310x310.png',
    '/images/icons/safari-pinned-tab.svg',

    '/primary-view-element/primary-view-element.css',
    '/primary-view-element/primary-view-element.html',
    '/primary-view-element/primary-view-element.js',

    '/telepathic-elements/qr-code-element/qr-code-element.js',
    '/telepathic-elements/qr-code-element/qr-code-generator.js',

    '/telepathic-elements/telepathic-loader/custom-elements.min.js',
    '/telepathic-elements/telepathic-loader/importModule.js',
    '/telepathic-elements/telepathic-loader/telepathic-loader.js'
  ];

self.addEventListener('install', function(e) {
  console.log('[ServiceWorker] Install');
  e.waitUntil(
    caches.open(cacheName).then(function(cache) {
      console.log('[ServiceWorker] Caching app shell');
      return cache.addAll(filesToCache);
    }).catch(console.error)
  );
});

self.addEventListener('activate', function(e) {
    console.log('[ServiceWorker] Activate');
    e.waitUntil(
      caches.keys().then(function(keyList) {
        return Promise.all(keyList.map(function(key) {
          if (key !== cacheName) {
            console.log('[ServiceWorker] Removing old cache', key);
            return caches.delete(key);
          }
        }));
      }).catch(console.error)
    );
    return self.clients.claim();
  });

  self.addEventListener('fetch', function(e) {
    console.log('[ServiceWorker] Fetch', e.request.url);
    e.respondWith(
      caches.match(e.request).then(function(response) {
        return response || fetch(e.request);
      }).catch(console.error)
    );
  });