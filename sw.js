/* Service worker de Dojo Ninja: funciona sin conexión.
   - HTML/JS/CSS: red primero (así las actualizaciones llegan) y caché si no hay red.
   - Imágenes y sonidos: caché primero (no cambian). */
const CACHE = "dojo-ninja-v5";

// premio19 no existe; premio25 (duplicado) se mantiene por compatibilidad
const PRIZES = Array.from({ length: 32 }, (_, i) => i + 1).filter(n => n !== 19).map(n => `img/premios/premio${n}.png`);
const ASSETS = [
  "./", "index.html", "css/index.css", "manifest.json",
  ...["core", "words", "game-syllables", "game-read", "game-build", "screen-progress", "app"].map(f => `js/${f}.js`),
  "img/icon.svg", "img/icon-192.png", "img/icon-512.png",
  ...[1, 2, 3, 4, 5].map(i => `img/imagen${i}.png`),
  ...["correct", "wrong", "prize", "balloons", "pop"].map(s => `sound/${s}.mp3`),
  ...PRIZES,
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;

  const isCode = req.mode === "navigate" || /\.(html|js|css|json)$/.test(new URL(req.url).pathname);

  if (isCode) {
    e.respondWith(
      fetch(req)
        .then(resp => {
          const copy = resp.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
          return resp;
        })
        .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match("index.html")))
    );
  } else {
    e.respondWith(caches.match(req).then(r => r || fetch(req)));
  }
});
