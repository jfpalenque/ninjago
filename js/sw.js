const CACHE = "dojo-ninja-v3";

self.addEventListener("install", e=>{
  e.waitUntil(
    caches.open(CACHE).then(cache=>{
      const premios = Array.from({ length: 31 }, (_, i) => `/ninjago/img/premios/premio${i+1}.png`);

      return cache.addAll([
        "./",
        "/ninjago/index.html",
        "/ninjago/js/index.js",
        "/ninjago/js/sw.js",
        "/ninjago/manifest.json",
        "/ninjago/img/ninja1.png",
        "/ninjago/img/ninja2.png",
        "/ninjago/img/ninja3.png",
        "/ninjago/img/ninja4.png",
        "/ninjago/img/ninja5.png",        
        "/ninjago/img/imagen1.png",
        "/ninjago/img/imagen2.png",
        "/ninjago/img/imagen3.png",
        "/ninjago/img/imagen4.png",
        "/ninjago/img/imagen5.png",
        "/ninjago/sound/correct.mp3",
        "/ninjago/sound/wrong.mp3",        
        "/ninjago/sound/prize.mp3",
        "/ninjago/sound/balloons.mp3",
        "/ninjago/sound/pop.mp3",
        ...premios
      ]);
    })
  );
});

self.addEventListener("fetch", e=>{
  e.respondWith(
    caches.match(e.request).then(resp=>{
      return resp || fetch(e.request);
    })
  );
});
