//import RevisionedCacheManager from '/node_modules/workbox-precaching/build/modules/workbox-precaching.prod.v2.1.0.mjs';

//import fileManifest from '/sw_manifest.js';

importScripts('/node_modules/workbox-precaching/build/importScripts/workbox-precaching.prod.v2.1.0.js');
importScripts('/node_modules/workbox-runtime-caching/build/importScripts/workbox-runtime-caching.prod.v2.0.3.js');
importScripts('/node_modules/workbox-routing/build/importScripts/workbox-routing.prod.v2.1.0.js');

importScripts('/sw_manifest.js');

const revCacheManager = new workbox.precaching.RevisionedCacheManager({cacheName: 'precache'});

revCacheManager.addToCacheList({
  revisionedFiles: __file_manifest
});

self.addEventListener('install', function(event) {
  console.log("Service Worker installing...");
  
  event.waitUntil(
    revCacheManager.install()
  );
  
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    revCacheManager.cleanup()
  );
});

self.addEventListener('fetch', function(event) {
  
  let url = new URL(event.request.url);
  
  let scope = self.registration.scope;
  
  if (`${url.origin}/` === scope) {
  
    if (url.pathname.match(/\/docs\//)) {
      event.respondWith(serveHome(event));
    } else {
      event.respondWith(staleWhileRevalidate(event));
    }
  
  }
  
  if (url.hostname == "api.github.com") {
    
  }
  
  
  
});

async function staleWhileRevalidate(event) {
  let cache = await caches.open('precache');
  let response = cache.match(event.request);
  let fetchPromise = fetch(event.request)
  .then((networkResponse) => {
    cache.put(event.request, networkResponse.clone());
    return networkResponse;
  });
  return response || fetchPromise;
};

async function serveHome() {
  let cache = await caches.open('precache');
  let response = cache.match(`${self.registration.scope}index.html`);
  return response;
};
