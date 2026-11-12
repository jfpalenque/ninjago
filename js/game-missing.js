/* =========================================================
   JUEGO 5: ¿QUÉ FALTA?
   A la palabra le falta una sílaba: hay que leer lo que hay
   y elegir la sílaba que completa el hueco.
   ========================================================= */
"use strict";

const MissingGame = {
  id: "falta",
  view: "viewMissing",
  deck: makeDeck(),
  word: null,
  gap: 0,
  options: [],
  mistakes: 0,

  enter() { this.deck.reset(); this.next(); },
  leave() { $("missTiles").innerHTML = ""; },
  listen() { if (this.word) speak(this.word.word, { rate: Math.min(settings.rate, .8) }); },

  pickOptions() {
    const missing = this.word.syl[this.gap];
    const all = [...new Set(wordPool().flatMap(w => w.syl))].filter(s => s !== missing);
    // Una que se parezca (misma primera letra o misma vocal final) y otra al azar
    const alike = shuffle(all.filter(s => s[0] === missing[0] || s.slice(-1) === missing.slice(-1))).slice(0, 1);
    const other = shuffle(all.filter(s => !alike.includes(s))).slice(0, 2 - alike.length);
    this.options = shuffle([missing, ...alike, ...other]);
  },

  next() {
    let w = this.deck.next();
    for (let i = 0; i < 5 && w.syl.length < 2; i++) w = this.deck.next();
    this.word = w;
    this.mistakes = 0;
    this.gap = Math.floor(Math.random() * w.syl.length);
    this.pickOptions();

    $("missEmoji").textContent = w.emoji;
    $("missSlots").innerHTML = w.syl.map((s, i) => i === this.gap
      ? `<span class="slot gap" id="missGap">?</span>`
      : `<span class="slot filled fixed" style="--c:${SYL_COLORS[i % SYL_COLORS.length]}">${esc(show(s))}</span>`).join("");
    restartAnim($("missCard"), "enter");
    $("missCard").classList.remove("good");

    const box = $("missTiles");
    box.innerHTML = "";
    this.options.forEach((s, i) => {
      const t = document.createElement("button");
      t.className = "tile";
      t.style.setProperty("--c", TILE_COLORS[(i + 2) % TILE_COLORS.length]);
      t.style.setProperty("--i", i);
      t.textContent = show(s);
      t.addEventListener("click", () => this.answer(s, t));
      box.appendChild(t);
    });

    say("¿Qué sílaba falta? 🔍");
    session.locked = false;
    later(() => this.listen(), 400);
  },

  answer(s, tile) {
    if (session.locked || tile.disabled) return;
    if (s === this.word.syl[this.gap]) {
      session.locked = true;
      trackWord(this.word.word, this.mistakes === 0);
      const gap = $("missGap");
      gap.textContent = show(s);
      gap.style.setProperty("--c", getComputedStyle(tile).getPropertyValue("--c"));
      gap.classList.add("filled");
      tile.classList.add("used");
      $("missCard").classList.add("good");
      later(() => {
        speak(this.word.word);
        const [x, y] = centerOf($("missSlots"));
        scoreCorrect({ x, y, statKey: "missingOk", delay: 1800 });
      }, 300);
    } else {
      this.mistakes++;
      tile.disabled = true;
      restartAnim(tile, "wrong");
      scoreWrong("Esa no es. ¡Escucha la palabra! 👂");
      later(() => this.listen(), 500);
    }
  },

  key(e) {
    const n = parseInt(e.key, 10);
    const t = $("missTiles").children[n - 1];
    if (t) this.answer(this.options[n - 1], t);
  },
};
