
// Increase the version number each time _any_ file in the game has changed. 
// By changing this file, the browser detect the change and will run the "install" event again, which will invalidate the cache and inflorb the 
// browser to reload all the files in the game from the server.
// 
const ServiceWorkerVersion = "41";

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
    Log("opening cache: " + cacheName + " to put to cache: " + request.url);
    
    const responseClone = networkResponse.clone();
    
    caches.open(cacheName).then(cache => {
      // TODO: This error happens when a file is partially downloaded. 
      //   <-Solution: "Look at the outgoing request for a Range header." ..
      // https://stackoverflow.com/questions/15787380/what-does-the-http-206-partial-content-status-message-mean-and-how-do-i-fully-lo
      // 
      // Uncaught (in promise) TypeError: Failed to execute 'put' on 'Cache': Partial response (status code 206) is unsupported
      cache.put(request.url, responseClone);
    });
      
    /*caches.open(request.url).then(cache => {
      Log("putting to cache.");
      cache.put(request, responseClone);
    });*/
    
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
    
    return fetch(event.request);
  }
  else {
    event.respondWith(cacheFirst(event.request));
  }
});
