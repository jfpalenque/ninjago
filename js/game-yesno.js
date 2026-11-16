/* =========================================================
   JUEGO 7: ¿SÍ O NO?
   Se ve un dibujo y una palabra escrita: ¿pone lo mismo que
   el dibujo? Hay que leer la palabra para saberlo.
   ========================================================= */
"use strict";

const YesNoGame = {
  id: "sino",
  view: "viewYesNo",
  deck: makeDeck(),
  word: null,     // la del dibujo
  shown: null,    // la que está escrita
  match: true,

  enter() { this.deck.reset(); this.next(); },
  leave() {},
  // No se lee la palabra en voz alta: el reto es leerla
  listen() { speak("Lee la palabra. ¿Es lo mismo que el dibujo?"); },

  /** Otra palabra para escribir bajo el dibujo; a menudo empieza igual, para que la lea entera. */
  decoy() {
    const others = wordPool().filter(o => o.word !== this.word.word);
    if (!others.length) return this.word;
    const alike = others.filter(o => o.word[0] === this.word.word[0]);
    return alike.length && Math.random() < .6 ? pick(alike) : pick(others);
  },

  next() {
    let w = this.deck.next();
    for (let i = 0; i < 6 && w.emoji === "📝"; i++) w = this.deck.next();
    this.word = w;
    this.shown = Math.random() < .5 ? w : this.decoy();
    this.match = this.shown.word === w.word;

    $("ynEmoji").textContent = w.emoji;
    $("ynWord").innerHTML = wordHTML(this.shown);
    restartAnim($("ynCard"), "enter");
    $("ynCard").classList.remove("good", "bad");
    say("¿Pone lo mismo que el dibujo? 🤔");
    session.locked = false;
  },

  answer(yes, el) {
    if (session.locked) return;
    const ok = yes === this.match;
    trackWord(this.shown.word, ok);
    if (ok) {
      $("ynCard").classList.add("good");
      speak(this.match ? `¡Sí! ${this.word.word}` : `¡No! Pone ${this.shown.word}`);
      const [x, y] = centerOf(el);
      scoreCorrect({ x, y, statKey: "yesNoOk", delay: 2200 });
    } else {
      // Con solo dos respuestas no tiene sentido repetir: se explica y se pasa a otra
      session.locked = true;
      restartAnim($("ynCard"), "bad");
      scoreWrong(this.match
        ? `Sí que pone «${esc(show(this.shown.word))}» 👀`
        : `Pone «${esc(show(this.shown.word))}» y el dibujo es «${esc(show(this.word.word))}» 👀`);
      speak(`Pone ${this.shown.word}`);
      later(() => this.next(), 3000);
    }
  },

  key(e) {
    const k = e.key.toLowerCase();
    if (k === "s" || k === "1") this.answer(true, $("ynYes"));
    if (k === "n" || k === "2") this.answer(false, $("ynNo"));
  },
};
