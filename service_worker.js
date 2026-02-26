
// Increase the version number each time _any_ file in the game has changed. 
// By changing this file, the browser detect the change and will run the "install" event again, which will invalidate the cache and inflorb the 
// browser to reload all the files in the game from the server.
// 
const ServiceWorkerVersion = "78"; // This is actually a hate-counter. :-D

const PleaseLitterWithConsoleLogs = true;
const cacheName = "carstorm-madskullcreations-com";

// This way we keep line numbers in the log correctly.
if (PleaseLitterWithConsoleLogs) 
  var Log = console.log;
else 
  var Log = function(){};

self.addEventListener("install", event => {
  // TODO: As for easier debugging, try print the value of ServiceWorkerVersion on the start screen of the game.
  
  Log("Service worker installed. Version: " + ServiceWorkerVersion);

  // Delete all cached files! Since this file's Version above has changed, we should assume all files has changed and must be reloaded.
  Log("Deleting cache: " + cacheName);
  caches.delete(cacheName);
  
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  Log("Service worker activated");
 
  // Pretty please with vanilla on top, store my value in the cache.
  // Nope! Man får inte lagra annat än Response objekt i denna cachen! 
  // ..jag vill egentligen bara att carstorm.js ska kunna skriva ut vilken version vi kör, ServiceWorkerVersion. Inte superviktigt.
  // TODO: DU kan kanske skriva ner värdet i en annan sorts cache? 
  /*caches.open(cacheName).then(cache => {
    Log("Writing ServiceWorkerVersion " + ServiceWorkerVersion + " to cache.");
    cache.put("ServiceWorkerVersion", ServiceWorkerVersion);
  });*/
});

const fetchAndCache = async (request) => {
  return fetch(request).then(networkResponse => {
    Log(networkResponse);
    
    // If status is 206 "partial downloaded", it often happens that sound files actually are downloaded
    // entirely. If so, change status to 200. Source:
    // https://github.com/GoogleChrome/workbox/issues/1644
    if(networkResponse.status === 206 && !networkResponse.headers.get('content-encoding'))
    {
      const contentLength = parseInt(networkResponse.headers.get('content-length'));
      const expectedString = `bytes 0-${contentLength - 1}/${contentLength}`;
      
      if(expectedString === networkResponse.headers.get('content-range'))
      {
        Log("Wrong status code, entire file is downloaded! " + expectedString + ", " + request.url);
        
        // Must create a new response from the old one. 
        networkResponse = new Response(networkResponse.body, { status: 200, headers: networkResponse.headers });
      }
    }
    
    // To avoid 206 "partially downloaded" files. 
    // Sometimes the file _is_ downloaded but has 206 anyway. We can live with this,
    // the next time the file is requested it will probably be cached.
    // 
    if(networkResponse.status === 200)
    {
      Log("Putting " + request.url + " to cache '" + cacheName + "'");
      const responseClone = networkResponse.clone();
      
      caches.open(cacheName).then(cache => {
        // FIXED: (See status check and fix above) This error happens when a file is partially downloaded:
        // 
        // Uncaught (in promise) TypeError: Failed to execute 'put' on 'Cache': Partial response (status code 206) is unsupported
        // 
        // More good reading: https://developer.mozilla.org/en-US/docs/Web/API/Cache
        cache.put(request.url, responseClone);
      });
    }
    else
    {
      // This should not happen for 206 anymore, as long as the file is not truly "partially downloaded".
      Log("Status is " + networkResponse.status + ", we skip caching that for now. Url: " + request.url);
      
      Log("content-range: " + networkResponse.headers.get('content-range'));
      Log("content-length: " + networkResponse.headers.get('content-length'));
      Log("content-encoding: " + networkResponse.headers.get('content-encoding'));
    }
    
    return networkResponse;
  }).catch(function (reason) {
    console.error('ServiceWorker fetch failed: ', reason);
  });
};

const cacheFirst = async (request) => {
  const responseFromCache = caches.match(request.url);

  return responseFromCache.then(cachedResponse => {
    // Log(cachedResponse);
    
    if(cachedResponse != null)
    {
      Log("Service worker: fetch " + request.url + ", loading from cache!");
      return cachedResponse;
    }
    else
    {
      Log("Service worker: fetch " + request.url + ", loading fresh!");
      return fetchAndCache(request);
    }
  });
};

self.addEventListener('fetch', event => {
  Log(event.request);

  if (event.request.url.includes(".php")) {
    // Never cache .php files.
    // (There is some browser magic going on here. After coming here once, it does not consult service_worker again as long as it remain unchanged. It automatically keep on reloading the .php files.)
    // 
    Log("Not caching .php files!");
    
    // This seem to be fixing the double calling of the version.php.
    // https://stackoverflow.com/questions/50129311/requests-through-service-worker-are-done-twice
    event.respondWith(async function(){
        const promiseChain = fetch(event.request.clone())
            .catch(function(err) {
                return queue.addRequest(event.request);
        });
        event.waitUntil(promiseChain);
        return promiseChain;
    }()); // Calling function here.
  }
  else {
    event.respondWith(cacheFirst(event.request));
  }
});
