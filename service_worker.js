
self.addEventListener("install", event => {
   console.log("Service worker installed");

   self.skipWaiting();
});

self.addEventListener("activate", event => {
  console.log("Service worker activated");
});

self.addEventListener('fetch', event => {
  console.log(event.request);

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
});
