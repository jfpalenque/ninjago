/* =========================================================
   JUEGO: FRASES
   Se ve una frase corta escrita (sin oírla) y hay que leerla
   y tocar el dibujo que le corresponde. Los dibujos falsos
   comparten una parte con el bueno: hay que leerla entera.
   ========================================================= */
"use strict";

const SentenceGame = {
  id: "frases",
  view: "viewSentence",
  queue: [],
  sentence: null,
  options: [],
  mistakes: 0,

  enter() { this.queue = []; this.next(); },
  leave() { $("sentOptions").innerHTML = ""; },

  // Antes de fallar solo recuerda la instrucción: el reto es leer sin ayuda
  listen() {
    if (!this.sentence) return;
    if (this.mistakes === 0) speak("Lee la frase y toca su dibujo");
    else speak(this.sentence.text, { rate: Math.min(settings.rate, .8) });
  },

  pool() {
    const lvl = settings.wordLevel === "all" ? 3 : Number(settings.wordLevel) || 1;
    return SENTENCES.filter(s => s.lvl <= lvl);
  },

  /** Dos frases cuyo dibujo comparte algo con el de la buena (mismo animal o mismo objeto). */
  pickDistractors(n) {
    const parts = pic => [...new Intl.Segmenter("es", { granularity: "grapheme" }).segment(pic)].map(x => x.segment);
    const mine = parts(this.sentence.pic);
    const others = shuffle(SENTENCES.filter(s => s.pic !== this.sentence.pic));
    const alike = others.filter(s => parts(s.pic).some(p => mine.includes(p)));
    const out = alike.slice(0, n);
    // Si no hay frases parecidas se inventa el dibujo cruzando el suyo con el de otra
    for (const s of others) {
      if (out.length >= n) break;
      const mixed = out.length % 2 ? mine[0] + parts(s.pic).slice(-1)[0] : parts(s.pic)[0] + mine[mine.length - 1];
      if (mixed !== this.sentence.pic && !out.some(o => o.pic === mixed)) out.push({ text: "", pic: mixed });
    }
    return out;
  },

  next() {
    if (!this.queue.length) {
      this.queue = shuffle(this.pool());
      if (this.queue.length > 1 && this.queue[this.queue.length - 1] === this.sentence) this.queue.unshift(this.queue.pop());
    }
    this.sentence = this.queue.pop();
    this.mistakes = 0;
    this.options = shuffle([this.sentence, ...this.pickDistractors(2)]);

    $("sentText").innerHTML = this.sentence.text.split(" ")
      .map(w => `<button class="sentWord" data-say="${esc(w)}">${esc(show(w))}</button>`).join(" ");
    restartAnim($("sentCard"), "enter");
    $("sentCard").classList.remove("good");

    const box = $("sentOptions");
    box.innerHTML = "";
    this.options.forEach((opt, i) => {
      const b = document.createElement("button");
      b.className = "sentPic";
      b.style.setProperty("--i", i);
      b.textContent = opt.pic;
      b.setAttribute("aria-label", "Dibujo " + (i + 1));
      b.addEventListener("click", () => this.answer(opt, b));
      box.appendChild(b);
    });

    say("¡Lee la frase y toca su dibujo! 📜");
    session.locked = false;
  },

  answer(opt, el) {
    if (session.locked || el.disabled) return;
    if (opt === this.sentence) {
      el.classList.add("right");
      $("sentCard").classList.add("good");
      $("sentOptions").querySelectorAll(".sentPic").forEach(c => c !== el && c.classList.add("dim"));
      speak(this.sentence.text);
      const [x, y] = centerOf(el);
      scoreCorrect({ x, y, statKey: "sentOk", delay: 2600 });
    } else {
      this.mistakes++;
      el.disabled = true;
      restartAnim(el, "wrong");
      scoreWrong("Ese no es. ¡Lee la frase despacio! 👀");
      later(() => this.listen(), 500);
    }
  },

  key(e) {
    const n = parseInt(e.key, 10);
    const el = $("sentOptions").children[n - 1];
    if (el) this.answer(this.options[n - 1], el);
  },
};
