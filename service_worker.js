
// A must-read-many-times:
// https://web.dev/articles/service-worker-lifecycle

// 1. Upon page load, any changes in this file is detected by browser, which reloads it and run the "install" event below. 
// 2. If you close the tab and repones it, both "install" and "activate" events are run. (As there was no active service worker)
// 3. Just reloading the page trigger none of these two events. Why? Because there is already an "active" service worker! 
// 4. When there is an "active" service worker, the "fetch" event is properly run whenever a file is requested. Images, js-file(s), the app.webmanifest file, also the index.html, everything goes through this service worker!

// Kort alltså: Använd en service worker primärt för att köra filerna lokalt från cachen. 
// Eftersom: Om du är i flygplansläge, dödar appen carstorm och startar den igen så står det "youre offline", och så kan man inte spela. 
//  <-Det verkar som jag kan bestämma cache per fil! Så versionsfilen ska aldrig cachas alltså, utan laddas ner och jämföras med det som finns i content storage och sedan ska action för det göras. I spelet, inte här.
//  <-Och om man är offline ska den defaulta på nåt snyggt vis, den som laddades ner sist tex.
//    cache names ska börja med carstorm_ så de inte krockar med ev. andra du har senare i livet. "set per origin", men jag antar att carstorm.madskullcreations.com inte hänfaller åt att vara samma origin som madskullcreations.com.

// Part of the confusion is this fact: 
// There is _a_ service worker running but it might be the "old" one running while the browser is checking step 1.
// It finds out there are changes and the new service worker is "install"ed. 
// But that might very well happen _after_ the "fetch" events has happened while loading the page with the old service worker. 
// Meaning the "old" one is running until a new one is "installed".
// This also means the files _are_ loaded without having a service worker installed the first time!

// Since you cannot know if the service controller are in control or not, for example it is _not_ in control the first time a user loads the page in the pwa app, you must design it with this in mind. 
// I intend to use it as a way to reload files from the server _only_ when a new version has been uploaded. This way the behaviour of the service controller works with my intentions, as the files are obviously new the first time the user downloads them fresh from the server without the service controller.

// One way to do this is to always update this file when any file changes. That way the browser will detect this file has changed and run the "install" event. In there I will set a flag which the "fetch" event will see, and then reload all files. 
// <-verkar inte fungera. Service workern "minns" att anyChanges sattes till true i install eventet.
//   Du får ladda en versionsfil som du planerat, i "install" eventet.

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
      
      //return fetch(event.request);
    })
  );
  
  
  /*if(response != null)
  {
    event.respondWith(response);
  }
  else
  {
    console.log("Service worker: fetch " + event.request.url + ", loading fresh!");
  }*/
  
  //.then(response => {
  //  console.log(response ? response : "It's not in the cache");
  //});
  
  // const response = ...
  //event.respondWith(response);
  
   /*if(true)//anyChanges)
   {
      console.log("Service worker: fetch " + event.request.url + ", loading fresh!");
   }
   else
   {
     console.log("Service worker: fetch " + event.request.url + ", stashed file!");
   }*/
});
