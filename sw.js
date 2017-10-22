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
  console.info('Service Worker installing...');
  
  let install = () => {
    return revCacheManager.install()
    .then(() => {
      console.info('Service Worker install  & precache successful');
    })
    .catch((err) => {
      console.error(`Service Worker install failed: ${err}`);
      return Promise.reject(err);
    });
  };
  
  event.waitUntil(install());
  
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
  
    if (/\/docs\//.test(url.pathname)) {
      event.respondWith(serveHome(event));
    } else {
      event.respondWith(staleWhileRevalidate(event));
    }
  
  }
  
  if (url.hostname == "api.github.com") {
    
    event.respondWith(staleWhileRevalidate(event, 'github'));
    
    if (/\/trees\//.test(url.pathname)) {
      // do staleWhileRevalidate, but also put tree's leaves names and shas into idb 
      
      // start downloading files into cache
    }
    if (/\/content\//.test(url.pathname)) {
      // check idb for cached content
      
      // also check for update and notify page when downloaded
      
      // then delete old version
    }
  }
  
  
  
});

async function staleWhileRevalidate(event, cachename) {
  let cache = await caches.open(cachename || 'precache');
  
  // set up revalidation request
  let fetchPromise = fetch(event.request)
  .then((networkResponse) => {
    cache.put(event.request, networkResponse.clone());
    return networkResponse;
  })
  .catch((err) => {
    console.info(err);
  });
  
  let response = await cache.match(event.request);
  return response || fetchPromise;
};

async function serveHome(event, cachename) {
  let cache = await caches.open(cachename || 'precache');
  
  let response = cache.match(`${self.registration.scope}index.html`);
  
  return response;
};
