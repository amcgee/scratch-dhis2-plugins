
self.addEventListener('install', function(event) {
    event.waitUntil(
      caches.open('app-v0').then(function(cache) {
        return cache.addAll(
          [
            '/',
            '/index.html',
            '/unavailable.html',
            '/pkg/app-service-config.js',
            '/pkg/app-service-data.js',
            '/app.js',
            'https://unpkg.com/htm@2.2.1',
            'https://unpkg.com/react@16/umd/react.production.min.js',
            'https://unpkg.com/react-dom@16/umd/react-dom.production.min.js'
          ]
        );
      })
    );
  });

  self.addEventListener('fetch', function(event) {
    const requestURL = new URL(event.request.url);
    console.log(requestURL)
    if (requestURL.pathname.startsWith('/app/')) {
      event.respondWith(
        caches.match('/unavailable.html')
      )
    }
  })

  self.addEventListener('fetch', function(event) {
    event.respondWith(
      caches.open('app-v0').then(function(cache) {
        return cache.match(event.request).then(function (response) {
          return response || fetch(event.request).then(function(response) {
            cache.put(event.request, response.clone());
            return response;
          });
        });
      })
    );
  });