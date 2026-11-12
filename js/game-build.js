/* =========================================================
   JUEGO 3: CONSTRUYE LA PALABRA
   Se ve el dibujo, se oye la palabra y hay que tocar
   las sílabas en orden.
   ========================================================= */
"use strict";

const TILE_COLORS = ["#e53935", "#1e88e5", "#43a047", "#8e24aa", "#ff8f00", "#00897b", "#ec4f9c"];

const BuildGame = {
  id: "construir",
  view: "viewBuild",
  deck: makeDeck(),
  word: null,
  filled: 0,
  mistakes: 0,

  enter() { this.deck.reset(); this.next(); },
  leave() {},
  listen() { if (this.word) speak(this.word.word, { rate: Math.min(settings.rate, .8) }); },

  distractors(n) {
    const own = new Set(this.word.syl);
    const others = shuffle(wordPool().flatMap(w => w.syl)).filter(s => !own.has(s));
    return [...new Set(others)].slice(0, n);
  },

  next() {
    this.word = this.deck.next();
    // Una palabra de una sola sílaba no tiene gracia aquí: buscamos otra
    for (let i = 0; i < 5 && this.word.syl.length < 2; i++) this.word = this.deck.next();
    this.filled = 0;
    this.mistakes = 0;

    $("buildEmoji").textContent = this.word.emoji;
    $("buildSlots").innerHTML = this.word.syl.map((s, i) =>
      `<span class="slot" data-i="${i}">${settings.buildHint ? `<i class="hint">${esc(show(s))}</i>` : ""}</span>`).join("");

    const extra = settings.buildExtra ? this.distractors(this.word.syl.length > 3 ? 1 : 2) : [];
    const tiles = shuffle([...this.word.syl, ...extra]);
    const box = $("buildTiles");
    box.innerHTML = "";
    tiles.forEach((s, i) => {
      const t = document.createElement("button");
      t.className = "tile";
      t.style.setProperty("--c", TILE_COLORS[i % TILE_COLORS.length]);
      t.style.setProperty("--i", i);
      t.textContent = show(s);
      t.dataset.syl = s;
      t.addEventListener("click", () => this.tap(t));
      box.appendChild(t);
    });

    $("skipBuildBtn").classList.remove("show");
    say("¡Ordena las sílabas! 🧩");
    session.locked = false;
    later(() => this.listen(), 400);
  },

  tap(tile) {
    if (session.locked || tile.classList.contains("used")) return;
    const needed = this.word.syl[this.filled];

    if (tile.dataset.syl === needed) {
      const slot = $("buildSlots").children[this.filled];
      slot.innerHTML = esc(show(needed));
      slot.style.setProperty("--c", getComputedStyle(tile).getPropertyValue("--c"));
      slot.classList.add("filled");
      tile.classList.add("used");
      speak(needed);
      this.filled++;

      if (this.filled === this.word.syl.length) {
        session.locked = true;
        trackWord(this.word.word, this.mistakes === 0);
        $("buildSlots").classList.add("done");
        later(() => {
          $("buildSlots").classList.remove("done");
          speak(this.word.word);
          const [x, y] = centerOf($("buildSlots"));
          scoreCorrect({ x, y, statKey: "wordsBuilt", delay: 2000 });
        }, 500);
      }
    } else {
      this.mistakes++;
      restartAnim(tile, "wrong");
      play("sndWrong", .5);
      mascotReact("sad");
      say(this.filled === 0 ? "¿Con qué sílaba empieza? 🤔" : "Esa no va ahora. ¡Escucha! 👂", "bad");
      session.streak = 0;
      renderHud();
      if (this.mistakes >= 2) later(() => speak(needed), 400);
      if (this.mistakes >= 4) $("skipBuildBtn").classList.add("show");
    }
  },

  skip() {
    if (session.locked) return;
    this.next();
  },
};
