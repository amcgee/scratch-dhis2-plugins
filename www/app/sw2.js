
self.addEventListener('install', function(event) {
    console.log('TEST')
});

self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.delete('sub-v0')
    );
  });

self.addEventListener('online', function(event) {
    console.log('ONLINE')
})

self.addEventListener('offline', function(event) {
    console.log('OFFLINE')
})

self.addEventListener('fetch', function(event) {
    event.respondWith(
      caches.open('sub-v0').then(function(cache) {
        return cache.match(event.request).then(function (response) {
          return response || fetch(event.request).then(function(response) {
            cache.put(event.request, response.clone());
            return response;
          });
        });
      })
    );
  });