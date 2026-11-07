/* Network-first for the app's own files (so updates always arrive), cache fallback for offline use. */
const CACHE = 'trademind-v23';
const CORE = ['./', './index.html', './styles.css', './config.js', './calc.js', './store.js', './psych.js', './lessons.js', './lessons_guide.js', './figures.js', './mentor.js', './views.js', './views2.js', './views3.js', './analyzer.js', './analyzer.html', './app.js', './vendor/supabase.js', './manifest.webmanifest', './assets/icon.svg'];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE).catch(() => {}))); });
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;   // API / storage / fonts go straight to the network
  e.respondWith(fetch(req).then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; })
    .catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
});
