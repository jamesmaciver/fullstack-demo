self.addEventListener('install', event => {
    console.log(`[ServiceWorker:install] Installing service worker.`);
    self.skipWaiting();

    event.waitUntil(
        caches.open(`v1`).then(cache => {
          return cache.addAll([            
            'css/site.css',
            'css/spectre-icons.min.css',
            'css/spectre.min.css',
            'img/fullstack-logo.png',
            'img/ashnitabali.jpg',
            'img/athanreines.jpg',
            'img/boyanmihaylov.jpg',
            'img/colineberhardt.jpg',
            'img/dafyddhenkereed.jpg',
            'img/dariushodaei.jpg',
            'img/davidmarkclements.jpg',
            'img/dylanbeattie.jpg',
            'img/guillaumepichot.jpg',
            'img/guynesher.jpg',
            'img/ivanjovanovic.jpg',
            'img/jackiebalzer.jpg',
            'img/jacklewin.jpg',
            'img/jamesmaciver.jpg',
            'img/joebirch.jpg',
            'img/lanceball.jpg',
            'img/máténádasdi.jpg',
            'img/nathaliechristmanncooper.jpg',
            'img/nathanepstein.jpg',
            'img/peterdickten.jpg',
            'img/richardmcmenamin.jpg',
            'img/rizcheldayao.jpg',
            'img/sarahdrasner.jpg',
            'img/saravieira.jpg',
            'img/stanimiravlaeva.jpg',
            'img/tbc.jpg',
            'img/yonatankra.jpg',
            'js/register-service-worker.js',
            'index.html',
            'schedule.html'
          ])
          .catch(error => console.error('Failed to install service worker', error));
        })
      );
});

self.addEventListener('activate', event => {
    console.log(`[ServiceWorker:activate] Activating service worker.`);
    self.clients.claim();
    event.waitUntil(openDb());
});

const applyStaticResourceCachingStrategy = (event) => {
    return caches.open(`v1`).then(cache => {
        return cache.match(event.request).then(cacheResponse => {
            return cacheResponse || fetch(event.request).then(networkResponse => {
                cache.put(event.request, networkResponse.clone());
                return networkResponse;
            });
        });
    })
}
