const { response } = require("express");

console.log("Hello from the service-worker!");

const FILES_TO_CACHE = [
    "/",
    "/index.js",
    "/index.html",
    "/styles.css",
    "/maifest.webmanifest",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png",

];

const CACHE_NAME = "static-cache-v2";
const DATA_CACHE_NAME = "data-cache-v1";

// installing 

self.addEventListener("install", function(e) {
    e.waitUntil(
      caches.open(CACHE_NAME).then(cache => {
        console.log("The file were cached!");
        return cache.addAll(FILES_TO_CACHE);
      })
    );
  
    self.skipWaiting();
  });

  self.addEventListener("activate", function(e) {
    e.waitUntil(
      caches.keys().then(keyList => {
        return Promise.all(
          keyList.map(key => {
            if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
              console.log("DELETING OLD DATA", key);
              return caches.delete(key);
            }
          })
        );
      })
    );
    self.clients.claim();
  });


  // Fetching 

  self.addEventListener("fetch", function(e) {
      if (e.request.url.includes("/api")) {
          e.respondWith(
              caches
              .open(DATA_CACHE_NAME)
              .then((cache) => {
                  return fetch(e.request)
                  .then((response) => {
                      // when response is ok it will clone and be stored in cache
                      if (response.status === 200) {
                          cache.put(e.request.url, response.clone());
                      }
                      return response;
                  })
                  .catch((error) => {
                    return cache.match(e.request);
                  });
              })
              .catch((error) => console.log(error))
          );

          return;
      }
      e.respondWith(
          caches.open(CACHE_NAME).then((cache) => {
              return cache.match(e.request).then((response) => {
                  return response || fetch(e.request);
              });
          })
      );
  });