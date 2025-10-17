
// Increase the version number each time _any_ file in the game has changed. 
// By changing this file, the browser detect the change and will run the "install" event again, which will invalidate the cache and inflorb the 
// browser to reload all the files in the game from the server.
// 
const ServiceWorkerVersion = "2";

self.addEventListener("install", event => {
  // TODO: Delete all cached files! Since this file's Version above has changed, we should assume all files has changed and must be reloaded.
  // TODO: As for easier debugging, try print the value of ServiceWorkerVersion on the start screen of the game.
  
  console.log("Service worker installed. Version: " + ServiceWorkerVersion);

  self.skipWaiting();
});

self.addEventListener("activate", event => {
  console.log("Service worker activated");
});

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
    const response = caches.match(event.request.url);

    event.respondWith(
      response.then(cachedResponse => {
        console.log(cachedResponse);
        
        if(cachedResponse != null)
        {
          console.log("Service worker: fetch " + event.request.url + ", loading from cache!");
          return cachedResponse;
        }
        else
        {
          console.log("Service worker: fetch " + event.request.url + ", loading fresh!");

          const networkFetch = fetch(event.request).then(networkResponse => {
            const responseClone = networkResponse.clone();
            
            caches.open(event.request.url).then(cache => {
              cache.put(event.request, responseClone);
            });
            
            console.log(networkResponse);
            return networkResponse;
          }).catch(function (reason) {
            console.error('ServiceWorker fetch failed: ', reason);
          });
          
          return networkFetch;
        }
      })
    );
  }
});
