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
          if (freshResp.ok) {
            cacheGithubTree(freshResp.clone());
          }
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
  
  let response = await cache.match(event.request.url);
  
  // set up revalidation request
  
  let fetchHeaders = duplicateHeaders(event.request.headers);
  
  if (response) {
    let ETag = response.headers.get('ETag');
    fetchHeaders.append('If-None-Match', ETag);
  }
  
  let mode = event.request.mode;
  
  if (mode === 'navigate') {
    mode = 'same-origin';
  }
  
  let req = new Request(event.request.url, {
    method: event.request.method,
    headers: fetchHeaders,
    mode: mode,
    credentials: event.request.credentials,
    redirect: 'manual'
  });
  
  let fetchPromise = fetch(req)
  .then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(event.request.url, networkResponse.clone());
    }
    return networkResponse;
  })
  .catch((err) => {
    console.info(err);
  });
  
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
      
      let idbVal = await idbKeyval.get(url);
      
      let urlData = {
        sha: ""
      };
      
      if (idbVal) {
        urlData = JSON.parse(idbVal);
      }
      
      if (urlData.sha !== leaf.sha) {
        
        let headers = duplicateHeaders(github.init.headers);
        
        if (urlData.ETag) {
          headers.append('If-None-Match', urlData.ETag);
        }
        
        let reqParams = Object.assign({}, github.init);
        
        reqParams.headers = headers;
        
        let resp = await fetch(url, reqParams);
        
        if (resp.ok) {
        
          let cache = await caches.open('github');
          
          await cache.put(url, resp);
  
          urlData.sha = leaf.sha;
          urlData.ETag = resp.headers.get('ETag');
  
          idbKeyval.set(url, JSON.stringify(urlData));
        }
        
      }
    }
  });
}

function duplicateHeaders(headers) {
  
  let duplicate = new Headers();
  
  for (let header of headers.entries()) {
    duplicate.set(header[0], header[1]);
  }
  
  return duplicate;
}