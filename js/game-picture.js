/* =========================================================
   JUEGO 4: PALABRA Y DIBUJO
   Se ve una palabra escrita (sin decirla en voz alta) y hay
   que leerla y tocar el dibujo que le corresponde.
   ========================================================= */
"use strict";

const PictureGame = {
  id: "dibujo",
  view: "viewPicture",
  deck: makeDeck(),
  word: null,
  options: [],
  mistakes: 0,

  enter() { this.deck.reset(); this.next(); },
  leave() { $("picOptions").innerHTML = ""; },

  // Antes de fallar solo recuerda la instrucción: el reto es leer sin ayuda
  listen() {
    if (!this.word) return;
    if (this.mistakes === 0) speak("Lee la palabra y toca su dibujo");
    else speak(this.word.word, { rate: Math.min(settings.rate, .8) });
  },

  /** Palabras con dibujo propio (las personalizadas sin emoji no sirven aquí). */
  pool() {
    const all = wordPool();
    const withPic = all.filter(w => w.emoji !== "📝");
    return withPic.length >= 3 ? withPic : all;
  },

  pickDistractors(n) {
    const others = this.pool().filter(w => w.word !== this.word.word && w.emoji !== this.word.emoji);
    // Una con la misma letra inicial (obliga a leer entera), el resto al azar
    const first = this.word.word[0];
    const similar = shuffle(others.filter(w => w.word[0] === first)).slice(0, 1);
    const rest = shuffle(others.filter(w => !similar.includes(w)));
    const out = [...similar];
    for (const w of rest) {
      if (out.length >= n) break;
      if (!out.some(o => o.emoji === w.emoji)) out.push(w);
    }
    return out;
  },

  next() {
    let w = this.deck.next();
    for (let i = 0; i < 6 && w.emoji === "📝" && this.pool()[0].emoji !== "📝"; i++) w = this.deck.next();
    this.word = w;
    this.mistakes = 0;
    this.options = shuffle([w, ...this.pickDistractors(3)]);

    $("picWord").innerHTML = wordHTML(w);
    restartAnim($("picCard"), "enter");
    $("picCard").classList.remove("good");

    const box = $("picOptions");
    box.innerHTML = "";
    this.options.forEach((opt, i) => {
      const b = document.createElement("button");
      b.className = "picCard";
      b.style.setProperty("--i", i);
      b.textContent = opt.emoji;
      b.setAttribute("aria-label", "Dibujo " + (i + 1));
      b.addEventListener("click", () => this.answer(opt, b));
      box.appendChild(b);
    });

    say("¡Lee la palabra y toca su dibujo! 📖");
    session.locked = false;
  },

  answer(opt, el) {
    if (session.locked || el.disabled) return;
    if (opt.word === this.word.word) {
      trackWord(this.word.word, this.mistakes === 0);
      el.classList.add("right");
      $("picCard").classList.add("good");
      $("picOptions").querySelectorAll(".picCard").forEach(c => c !== el && c.classList.add("dim"));
      speak(this.word.word);
      const [x, y] = centerOf(el);
      scoreCorrect({ x, y, statKey: "picturesOk", delay: 1800 });
    } else {
      this.mistakes++;
      el.disabled = true;
      restartAnim(el, "wrong");
      scoreWrong(`Ese dibujo es «${esc(show(opt.word))}». ¡Lee otra vez! 👀`);
      speak(`Ese es ${opt.word}`);
    }
  },

  key(e) {
    const n = parseInt(e.key, 10);
    const el = $("picOptions").children[n - 1];
    if (el) this.answer(this.options[n - 1], el);
  },
};
