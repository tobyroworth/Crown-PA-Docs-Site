importScripts('/node_modules/workbox-precaching/build/importScripts/workbox-precaching.prod.v2.1.0.js');
/* global workbox */

importScripts('/node_modules/idb-keyval/idb-keyval.js');
/* global idbKeyval */

importScripts('/sw_manifest.js');
/* global __file_manifest */

const revCacheManager = new workbox.precaching.RevisionedCacheManager({cacheName: 'precache'});

revCacheManager.addToCacheList({
  // eslint-disable-next-line camelcase
  revisionedFiles: __file_manifest
});

/**
 * Remove once module workers arrive, this was lazy
 */
 
const github = {};

github.headers = new Headers();
github.headers.append('Accept', 'application/vnd.github.v3+json');
github.headers.append('Accept', 'application/vnd.github.v3.html');

github.init = {
  method: 'GET',
  headers: github.headers,
  mode: 'cors',
  cache: 'default'
};

/**
 * ^^ end
 */

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
      let response = staleWhileRevalidate(event).then((resp) => {
        return resp.stale || resp.fresh;
      });
      event.respondWith(response);
    }
  
  }
  
  if (url.hostname === "api.github.com") {
    
    if (/\/trees\//.test(url.pathname)) {
      // do staleWhileRevalidate, but also put tree's leaves names and shas into idb 
      
      let response = staleWhileRevalidate(event, 'github').then((resp) => {
        
        let fresh = resp.fresh.then((freshResp) => {
          cacheGithubTree(freshResp.clone());
          return freshResp;
        }).catch(console.error);
        
        return resp.stale || fresh;
      });
      
      event.respondWith(response);
      
    // } else if (/\/contents\//.test(url.pathname)) {
      
    //   let response = staleWhileRevalidate(event, 'github').then((resp) => {
    //     return resp.stale || resp.fresh;
    //   });
      
    //   event.respondWith(response);
    } else {
      
      let response = staleWhileRevalidate(event, 'github').then((resp) => {
        return resp.stale || resp.fresh;
      });
      
      event.respondWith(response);
    }
  }
  
});

async function staleWhileRevalidate(event, cachename) {
  let cache = await caches.open(cachename || 'precache');
  
  // set up revalidation request
  let fetchPromise = fetch(event.request)
  .then((networkResponse) => {
    cache.put(event.request.url, networkResponse.clone());
    return networkResponse;
  })
  .catch((err) => {
    console.info(err);
  });
  
  let response = cache.match(event.request.url);
  return {
    stale: response,
    fresh: fetchPromise
  };
}

async function serveHome(event, cachename) {
  let cache = await caches.open(cachename || 'precache');
  
  let response = cache.match(`${self.registration.scope}index.html`);
  
  return response;
}

async function cacheGithubTree(response) {
  let parsed = await response.json();
  let tree = parsed.tree;
      
  // start downloading files into cache
  
  tree.forEach(async (leaf) => {
    if (leaf.type === 'blob') {
      
      let url = leaf.url.replace(/\/git\/.*/, `/contents/${leaf.path}`);
      let sha = idbKeyval.get(url);
      
      if (sha !== leaf.sha) {
        
        let resp = await fetch(url, github.init);
        
        let cache = await caches.open('github');
        
        await cache.put(url, resp);
        
        idbKeyval.set(url, leaf.sha);
        
      }
    }
  });
}