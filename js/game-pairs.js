/* =========================================================
   JUEGO 6: PAREJAS (memoria)
   Cartas boca abajo: hay que juntar cada palabra con su dibujo.
   Al empezar se enseñan todas un momento.
   ========================================================= */
"use strict";

const PairsGame = {
  id: "parejas",
  view: "viewPairs",
  deck: makeDeck(),
  open: [],       // cartas levantadas ahora: [{ card, el }]
  left: 0,        // parejas que quedan por encontrar

  enter() { this.deck.reset(); this.restart(); },
  leave() { $("pairsBoard").innerHTML = ""; this.left = 0; this.open = []; },
  listen() { speak("Busca las parejas: cada palabra con su dibujo"); },
  restart() { this.left = 0; this.next(); },

  /** n palabras cortas, con dibujo propio y sin dibujos repetidos. */
  pickWords(n) {
    const out = [];
    const fits = w => w.emoji !== "📝" && w.word.length <= 8 && !out.some(o => o.word === w.word || o.emoji === w.emoji);
    for (let i = wordPool().length * 2; i > 0 && out.length < n; i--) {
      const w = this.deck.next();
      if (fits(w)) out.push(w);
    }
    // Si la lista activa no da para tanto (p. ej. solo «mis palabras» sin dibujo), se completa con las fáciles
    for (const [text, emoji] of shuffle(WORD_LEVELS[1])) {
      if (out.length >= n) break;
      const w = makeWord(text, emoji);
      if (fits(w)) out.push(w);
    }
    return out;
  },

  next() {
    // Tras un acierto (o un premio) con parejas pendientes se sigue en el mismo tablero
    if (this.left > 0) { session.locked = false; return; }

    const words = this.pickWords(innerWidth >= 700 ? 4 : 3);
    this.left = words.length;
    this.open = [];
    const cards = shuffle(words.flatMap(w => [{ w, kind: "word" }, { w, kind: "pic" }]));

    const box = $("pairsBoard");
    box.innerHTML = "";
    box.dataset.cols = words.length;
    cards.forEach((card, i) => {
      const b = document.createElement("button");
      b.className = "memCard up " + card.kind;
      b.style.setProperty("--i", i);
      b.setAttribute("aria-label", "Carta " + (i + 1));
      b.innerHTML = `<span class="memInner"><span class="memBack">${THEME.cardBack}</span><span class="memFront">${
        card.kind === "word" ? esc(show(card.w.word)) : card.w.emoji}</span></span>`;
      b.addEventListener("click", () => this.flip(card, b));
      box.appendChild(b);
    });

    say("¡Mira bien las cartas! 👀");
    session.locked = true;
    later(() => {
      box.querySelectorAll(".memCard").forEach(c => c.classList.remove("up"));
      say("¡Busca las parejas! 🃏");
      session.locked = false;
    }, 2600);
  },

  flip(card, el) {
    if (session.locked || this.open.length >= 2 || el.classList.contains("up")) return;
    el.classList.add("up");
    play("sndPop", .35);
    this.open.push({ card, el });
    if (this.open.length < 2) return;

    const [a, b] = this.open;
    if (a.card.w.word === b.card.w.word) {
      this.open = [];
      this.left--;
      a.el.classList.add("matched");
      b.el.classList.add("matched");
      trackWord(card.w.word, true);
      speak(card.w.word);
      const [x, y] = centerOf(el);
      scoreCorrect({ x, y, statKey: "pairsOk", delay: this.left ? 1100 : 2200 });
    } else {
      say("¡Casi! Recuerda dónde están 🧠");
      later(() => {
        a.el.classList.remove("up");
        b.el.classList.remove("up");
        this.open = [];
      }, 1300);
    }
  },

  key(e) {
    const n = parseInt(e.key, 10);
    const el = $("pairsBoard").children[n - 1];
    if (el) el.click();
  },
};
