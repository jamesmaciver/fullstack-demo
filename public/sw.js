importScripts('js/idb.js');
importScripts('js/rest-of-sw.js');
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