/* =========================================================
   JUEGO 2: LEE LA PALABRA (con micrófono)
   El niño pulsa 🎤, lee la palabra en voz alta y el
   reconocimiento de voz del navegador comprueba si es correcta.
   ========================================================= */
"use strict";

const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;

const ReadGame = {
  id: "leer",
  view: "viewRead",
  deck: makeDeck(),
  word: null,
  attempts: 0,
  rec: null,
  micBroken: !SpeechRec,

  enter() {
    this.deck.reset();
    if (this.micBroken) this.showManual(this.noMicReason());
    this.next();
  },

  leave() { this.stopListening(); },

  listen() {
    if (this.word) speak(this.word.word, { rate: Math.min(settings.rate, .8) });
  },

  noMicReason() {
    if (!SpeechRec) return "Este navegador no puede escuchar (prueba con Chrome o Edge). Un adulto puede validar la lectura:";
    if (!window.isSecureContext) return "El micrófono solo funciona en https o en localhost. Un adulto puede validar la lectura:";
    return "No puedo usar el micrófono. Un adulto puede validar la lectura:";
  },

  showManual(msg) {
    this.micBroken = true;
    $("manualMsg").textContent = msg;
    $("manualCheck").hidden = false;
    $("micBtn").hidden = !SpeechRec;     // si hay reconocimiento se deja para reintentar
  },

  next() {
    this.stopListening();
    this.word = this.deck.next();
    this.attempts = 0;
    showWordPic($("readEmoji"), this.word);
    $("readWord").innerHTML = wordHTML(this.word);
    restartAnim($("readCard"), "enter");
    $("readCard").classList.remove("good", "bad");
    $("heard").textContent = "";
    $("skipWordBtn").classList.remove("show");
    say(this.micBroken ? "¡Lee la palabra en voz alta! 📖" : "¡Lee la palabra! Pulsa 🎤");
    session.locked = false;
  },

  /* ---------- micrófono ---------- */
  toggleMic() {
    if (session.locked) return;
    if (this.rec) return this.stopListening();
    this.startListening();
  },

  startListening() {
    if (!SpeechRec) return this.showManual(this.noMicReason());
    speechSynthesis?.cancel();                     // que no se oiga a sí mismo

    const rec = new SpeechRec();
    rec.lang = "es-ES";
    rec.interimResults = true;
    rec.maxAlternatives = 5;
    rec.continuous = false;
    this.rec = rec;

    const alts = [];
    let interim = "", failed = false;

    rec.onresult = e => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) for (let j = 0; j < res.length; j++) alts.push(res[j].transcript);
        else interim = res[0].transcript;
      }
      $("heard").textContent = "👂 " + (alts[0] || interim);
      // Si la frase parcial ya es correcta, no hace falta esperar
      if (interim && matchSpoken(this.word.word, [interim]).ok) rec.stop();
    };
    rec.onerror = e => {
      failed = true;
      this.setMicUI(false);
      if (e.error === "no-speech") {
        say("No te he oído. ¡Habla más fuerte! 📢", "bad");
      } else if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        this.showManual("No tengo permiso para usar el micrófono. Puedes darlo en el candado de la barra de direcciones, o que un adulto valide:");
      } else if (e.error === "network") {
        this.showManual("El reconocimiento de voz necesita internet. Un adulto puede validar la lectura:");
      } else if (e.error !== "aborted") {
        this.showManual(this.noMicReason());
      }
    };
    rec.onend = () => {
      clearTimeout(this.recTimer);
      const wasMine = this.rec === rec;
      this.rec = null;
      this.setMicUI(false);
      if (!wasMine || failed) return;
      const heard = alts.length ? alts : interim ? [interim] : [];
      if (!heard.length) { say("No te he oído. ¡Prueba otra vez! 🎤", "bad"); return; }
      this.check(heard);
    };

    try {
      rec.start();
    } catch {
      this.rec = null;
      return this.showManual(this.noMicReason());
    }
    this.setMicUI(true);
    $("heard").textContent = "";
    say("Te escucho... 👂");
    this.recTimer = setTimeout(() => rec.stop(), 7000);
  },

  stopListening() {
    clearTimeout(this.recTimer);
    if (this.rec) {
      const r = this.rec;
      this.rec = null;
      try { r.abort(); } catch { /* ya parado */ }
    }
    this.setMicUI(false);
  },

  setMicUI(on) {
    $("micBtn").classList.toggle("listening", on);
    $("micLabel").textContent = on ? "Te escucho..." : "¡Leer!";
  },

  /* ---------- comprobación ---------- */
  check(alternatives) {
    const { ok, heard } = matchSpoken(this.word.word, alternatives);
    if (ok) {
      $("heard").innerHTML = `✅ He oído «<b>${esc(heard)}</b>»`;
      this.success();
    } else {
      $("heard").innerHTML = `He oído «<b>${esc(heard)}</b>»`;
      this.fail();
    }
  },

  success() {
    trackWord(this.word.word, true);
    $("readCard").classList.add("good");
    revealWordPic($("readEmoji"), this.word);
    const [x, y] = centerOf($("readCard"));
    scoreCorrect({ x, y, statKey: "wordsRead", delay: 2200 });
    later(() => speak(this.word.word), 300);
  },

  fail() {
    this.attempts++;
    trackWord(this.word.word, false);
    restartAnim($("readCard"), "bad");
    if (this.attempts >= 2) {
      scoreWrong("Escucha y repite 👂");
      later(() => this.listen(), 700);
    } else {
      scoreWrong("¡Casi! Prueba otra vez 🎤");
    }
    if (this.attempts >= 3) $("skipWordBtn").classList.add("show");
  },

  manualOk() {
    if (session.locked) return;
    this.stopListening();
    this.success();
  },

  manualRetry() {
    if (session.locked) return;
    this.attempts++;
    trackWord(this.word.word, false);
    restartAnim($("readCard"), "bad");
    say("¡Otra vez! Tú puedes 💪", "bad");
    session.streak = 0;
    renderHud();
    if (this.attempts >= 2) later(() => this.listen(), 500);
  },

  skip() {
    if (session.locked) return;
    this.next();
  },

  key(e) {
    if (e.key === "Enter" && !(e.target instanceof HTMLButtonElement)) this.toggleMic();
  },
};

/* Tocar una sílaba la pronuncia */
document.addEventListener("click", e => {
  const s = e.target.closest(".syl[data-syl]");
  if (!s) return;
  restartAnim(s, "say");
  speak(s.dataset.syl);
});
