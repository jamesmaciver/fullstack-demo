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
            'schedule.html',
            'announcements.html'
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

const serviceWorkerUrl = new URL(self.location);

self.addEventListener('fetch', event => {
    console.log(`[ServiceWorker:fetch] Fetch Event: `, event);
    
    const requestUrl = event.request.url;
    const urlBelongsToOrigin = requestUrl.indexOf(serviceWorkerUrl.origin) > -1;
    const isStaticResourceRequest = requestUrl.indexOf('/api/') === -1;
    
    if (urlBelongsToOrigin) {

        const isGETRequest = event.request.method === 'GET';
        const isPOSTRequest = event.request.method === 'POST';
        
        if(isGETRequest) {

            if (isStaticResourceRequest) {
                console.log(`[ServiceWorker:fetch] Processing static resource fetch event.`);

                event.respondWith(
                    applyStaticResourceCachingStrategy(event)
                );
            } else {
                console.log(`[ServiceWorker:fetch] Processing dynamic data fetch event`, event);
                
                const accessingSessions = requestUrl.indexOf('/api/sessions') > -1;
                
                let promiseToResolve;
        
                if (accessingSessions) {
                    promiseToResolve = getSessions(event.request);
                } else {
                    promiseToResolve = fetch(event.request);
                }
                event.respondWith(
                    promiseToResolve
                );
            }
        } else if (isPOSTRequest) {
            console.log(`[ServiceWorker:fetch] Processing data POST fetch event.`, event);
            event.respondWith(fetch(event.request));
        }
    }
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

const getSessions = (request) => {
    return getSessionsFromDb().then((resultSet) => {
        if(resultSet && resultSet.length > 0) {
            return returnAsJsonResponse(resultSet);
        }
        return fetch(request)
                .then(response => response.json())
                .then(sessions => 
                {
                    const promises = [];
                    sessions.forEach(session => {
                        promises.push(addSessionToDb(session));
                    });
                    return Promise.all(promises).then(() => {
                        return returnAsJsonResponse(sessions);
                    });
                });
    });
}

const getSessionsFromDb = () => {
    return openDb()
        .then(db => 
                db.transaction('sessions')
                    .objectStore('sessions')
                    .getAll()
            );
}

const addSessionToDb = (session) => {
    return openDb()
        .then(db =>
                db.transaction('sessions', 'readwrite')
                    .objectStore('sessions')
                    .put(session)
                    .complete
            );
}

const openDb = () => {
    return idb.open('fullstack', 2, (upgradeDB) => {
        console.log(`[ServiceWorker:activate] Migrating db from  v${upgradeDB.oldVersion}}.`);
            
        if(!upgradeDB.objectStoreNames.contains('sessions')){
            upgradeDB.createObjectStore('sessions', {
                keyPath: ['title', 'location', 'startsAt']
            });
        }
        
        if(!upgradeDB.objectStoreNames.contains('announcements')){
            upgradeDB.createObjectStore('announcements', {
                keyPath: 'timestamp'
            });
        }
    });
}

const returnAsJsonResponse = (resultSet) => {
    return Promise.resolve(new Response(
                JSON.stringify(resultSet), 
                {
                    headers: {
                        'content-type': 'application/json'
                    }
                }));
}

