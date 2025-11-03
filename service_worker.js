
// Increase the version number each time _any_ file in the game has changed. 
// By changing this file, the browser detect the change and will run the "install" event again, which will invalidate the cache and inflorb the 
// browser to reload all the files in the game from the server.
// 
const ServiceWorkerVersion = "20";

const cacheName = "carstorm-madskullcreations-com";

self.addEventListener("install", event => {
  // TODO: As for easier debugging, try print the value of ServiceWorkerVersion on the start screen of the game.
  
  console.log("Service worker installed. Version: " + ServiceWorkerVersion);

  // Delete all cached files! Since this file's Version above has changed, we should assume all files has changed and must be reloaded.
  console.log("Deleting cache: " + cacheName);
  caches.delete(cacheName);
  
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  console.log("Service worker activated");
 
  // Pretty please with vanilla on top, store my value in the cache.
  // Nope! Man får inte lagra annat än Response objekt i denna cachen! 
  // ..jag vill egentligen bara att carstorm.js ska kunna skriva ut vilken version vi kör, ServiceWorkerVersion. Inte superviktigt.
  // TODO: DU kan kanske skriva ner värdet i en annan sorts cache? 
  /*caches.open(cacheName).then(cache => {
    console.log("Writing ServiceWorkerVersion " + ServiceWorkerVersion + " to cache.");
    cache.put("ServiceWorkerVersion", ServiceWorkerVersion);
  });*/
});

const fetchAndCache = async (request) => {
  return fetch(request).then(networkResponse => {
    const responseClone = networkResponse.clone();
    
    console.log("opening cache: " + cacheName);
    caches.open(cacheName).then(cache => {
      console.log("putting to cache: " + request.url);
      cache.put(request.url, responseClone);
    });
      
    /*caches.open(request.url).then(cache => {
      console.log("putting to cache.");
      cache.put(request, responseClone);
    });*/
    
    console.log(networkResponse);
    return networkResponse;
  }).catch(function (reason) {
    console.error('ServiceWorker fetch failed: ', reason);
  });
};

const cacheFirst = async (request) => {
  const responseFromCache = caches.match(request.url);

  return responseFromCache.then(cachedResponse => {
    console.log(cachedResponse);
    
    if(cachedResponse != null)
    {
      console.log("Service worker: fetch " + request.url + ", loading from cache!");
      return cachedResponse;
    }
    else
    {
      console.log("Service worker: fetch " + request.url + ", loading fresh!");
      return fetchAndCache(request);
    }
  });
};

self.addEventListener('fetch', event => {
  console.log(event.request);

  if (event.request.url.endsWith(".php")) {
    // Never cache .php files.
    // (There is some browser magic going on here. After coming here once, it does not consult service_worker again as long as it remain unchanged. It automatically keep on reloading the .php files.)
    // 
    console.log("Not caching .php files!");
    
    return fetch(event.request);
  }
  else {
    event.respondWith(cacheFirst(event.request));
  }
});
