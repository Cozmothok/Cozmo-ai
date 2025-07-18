const CACHE_NAME = 'jarvis-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/useTextToSpeech.ts',
  '/services/geminiService.ts',
  '/components/AIAvatar.tsx',
  '/components/icons.tsx',
  '/components/Message.tsx',
  '/components/MessageInput.tsx',
  '/components/ToolDisplay.tsx',
  '/components/VisionSystem.tsx',
  '/components/Welcome.tsx',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Orbitron:wght@400..900&family=Rajdhani:wght@300;400;500;600;700&display=swap',
  'https://esm.sh/react@^19.1.0',
  'https://esm.sh/react-dom@^19.1.0',
  'https://esm.sh/@google/genai@^1.9.0'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
