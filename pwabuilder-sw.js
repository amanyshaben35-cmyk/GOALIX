```javascript
const CACHE_NAME = "goalix-v2";
const OFFLINE_PAGE = "/offline.html";

const OLD_CACHES = [
  "pwabuilder-page"
];

// تثبيت Service Worker الجديد
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.add(OFFLINE_PAGE))
      .then(() => self.skipWaiting())
  );
});

// تفعيل النسخة الجديدة وحذف الكاش القديم
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),

      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              OLD_CACHES.includes(cacheName) ||
              cacheName !== CACHE_NAME
            ) {
              return caches.delete(cacheName);
            }

            return Promise.resolve();
          })
        );
      })
    ])
  );
});

// السماح بالتحديث الفوري
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// التعامل مع فتح صفحات GOALIX
self.addEventListener("fetch", (event) => {

  // صفحات التنقل فقط
  if (event.request.mode === "navigate") {

    event.respondWith(
      (async () => {

        try {

          // نحاول دائمًا الحصول على أحدث نسخة من الإنترنت
          const networkResponse = await fetch(
            event.request,
            {
              cache: "no-store"
            }
          );

          return networkResponse;

        } catch (error) {

          // إذا لم يوجد إنترنت، نستخدم صفحة Offline
          const cache = await caches.open(CACHE_NAME);

          const offlineResponse =
            await cache.match(OFFLINE_PAGE);

          return (
            offlineResponse ||
            new Response(
              "GOALIX غير متاح حاليًا بدون اتصال بالإنترنت.",
              {
                status: 503,
                headers: {
                  "Content-Type": "text/plain; charset=utf-8"
                }
              }
            )
          );
        }

      })()
    );

  }

});
```
