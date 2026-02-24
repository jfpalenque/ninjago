const CACHE = "dojo-ninja-v3";

self.addEventListener("install", e=>{
  e.waitUntil(
    caches.open(CACHE).then(cache=>{
      return cache.addAll([
        "./",
        "index.html",
        "manifest.json",
        "icon-192.png",
        "icon-512.png",
        "ninja1.png",
        "ninja2.png",
        "ninja3.png",
        "ninja4.png",
        "ninja5.png",
        "premio1.png",
        "premio2.png",
        "premio3.png",
        "premio4.png",
        "premio5.png",
        "imagen1.png",
        "imagen2.png",
        "imagen3.png",
        "imagen4.png",
        "imagen5.png",
        "correct.mp3",
        "wrong.mp3",
        "door.mp3",
        "prize.mp3",
        "balloons.mp3",
        "pop.mp3"
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
