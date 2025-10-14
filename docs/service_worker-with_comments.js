
self.addEventListener("install", event => {
   console.log("Service worker installed");
   
   // Most of the time there already is an "active" service worker, only when closing the tab and opening it again will terminate it. So we tell it to activate this new service worker anyway by calling skipWaiting().
   // Effectively runs the "activate" event as expected after the install event.
   // TODO: Det är så att det är ett race, browsern håller på att ladda alla filer redan, via den gamla service workern, vilket kan betyda att vi kommer in "mitt i" ! Alltså att filer laddas av dels den gamla, dels den nya. 
   // <-Du får alltså inte bero på att bara en version av service workern kör eftersom vi skippar att vänta här, och bara tar över mitt i! 
   // <-En tanke till är att alla grejer som skickas till serven, om några, skickas med versionsnr. Orsaken är helt enkelt att om en spelare spelar spelet i tre timmar, mitt över en update, så kommer han fortfarande att köra med en gammal version när han senare ska ladda upp nytt highscore, och så har vi just fixat en fet bugg på servern. Det är säkrast att bara anta att vilken version som helst kan ansluta till servern i de fallen!
   self.skipWaiting();
});
self.addEventListener("activate", event => {
  // "activate" happens when any older service worker has terminated, or when skipWaiting() has been called in the "install" event above.
  // This means we are in the perfect position to update any caches the older version has! 
  // It might also just mean the user has closed and reopened the tab, so we must check if this is actually a new version first. :-)
  // It might also be that we are updating from a _very_ old version, imagine someone playing the game very occasionally. A version number somewhere in the cache is necessary, so we can update accordingly.
  
  // event.waitUntil() let us do all stuff necessary here before any "fetch" events are being served. They gets buffered, which means the user and all things wait until all updating are done.
  
  console.log("Service worker activated");
});
self.addEventListener('fetch', event => {
  // The response is a type of Promise object, i.e. it returns fast with an object which eventually will contain the result.
  const response = caches.match(event.request.url);
  console.log(response); // <Promise>
  
  console.log(event.request);
  
  event.respondWith(
    response.then(cachedResponse => {
      console.log(cachedResponse); // undefined if cache is empty.
      
      if(cachedResponse != null)
      {
        console.log("Service worker: fetch " + event.request.url + ", loading from cache!");
        return cachedResponse;
      }
      else
      {
        console.log("Service worker: fetch " + event.request.url + ", loading fresh!");

        const networkFetch = fetch(event.request).then(networkResponse => {
          // update the cache with a clone of the network response
          const responseClone = networkResponse.clone();
          
          caches.open(event.request.url).then(cache => {
            cache.put(event.request, responseClone);
          });
          
          console.log(networkResponse); // an actual object here.
          return networkResponse;
        }).catch(function (reason) {
          console.error('ServiceWorker fetch failed: ', reason);
        });
        
        console.log(networkFetch); // a promise
        return networkFetch;
      }
    })
  );
});
