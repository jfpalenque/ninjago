/* =========================================================
   JUEGO 6: NÚMEROS
   Cada modo tiene su entrada en el menú:
     #contar  count  ¿Cuántos hay?
     #numero  hear   se oye un número y hay que tocarlo
     #grupos  match  se ve un número y hay que tocar el grupo con esa cantidad
     #sumar   add    sumas con dibujos
     #restar  sub    restas con dibujos
   Los dibujos se pueden tocar para contarlos en voz alta.
   ========================================================= */
"use strict";

const NUM_THINGS = ["🍎", "🍓", "🐟", "🐥", "⭐", "🎈", "🍪", "🐞", "🌸", "🚗", "🦆", "🍌", "⚽", "🐸", "🧁", "🐝"];
const NUM_COLORS = ["#e53935", "#1e88e5", "#43a047", "#8e24aa", "#ff8f00", "#00897b"];
const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

const NUM_MODES = {
  count: { stat: "countOk", prompt: "¿Cuántos hay? Tócalos para contar 👆", tip: "Tócalos uno a uno para contar 👆" },
  hear:  { stat: "hearOk",  prompt: "Escucha y toca el número 👂",          tip: "¡Escucha otra vez! 👂" },
  match: { stat: "matchOk", prompt: "¿Qué grupo tiene este número? 🎯",     tip: "Cuenta despacio los dibujos de cada grupo 👀" },
  add:   { stat: "sumsOk",  prompt: "¡Suma! Junta todos y cuenta ➕",        tip: "Cuenta todos los dibujos juntos 👆" },
  sub:   { stat: "subsOk",  prompt: "¡Resta! Los tachados se han ido ➖",    tip: "Cuenta solo los que no están tachados 👆" },
};

const NumberGame = {
  id: "numeros",
  view: "viewNumbers",
  mode: "count",
  a: 0, b: 0, answerValue: 0,
  options: [],
  counted: 0,
  mistakes: 0,
  last: "",

  setup(mode) { this.mode = NUM_MODES[mode] ? mode : "count"; },
  enter() { this.last = ""; this.next(); },
  leave() { $("numOptions").innerHTML = ""; $("numPics").innerHTML = ""; },

  question() {
    switch (this.mode) {
      case "add": return `¿Cuánto es ${this.a} más ${this.b}?`;
      case "sub": return `¿Cuánto es ${this.a} menos ${this.b}?`;
      case "hear": return `Busca el número ${this.a}`;
      case "match": return `¿Qué grupo tiene ${this.a}?`;
      default: return "¿Cuántos hay?";
    }
  },
  listen() { speak(this.question()); },

  makeProblem() {
    const max = settings.numMax;
    for (let tries = 0; tries < 10; tries++) {
      this.b = 0;
      if (this.mode === "add") {
        this.a = randInt(1, max - 1);
        this.b = randInt(1, max - this.a);
        this.answerValue = this.a + this.b;
      } else if (this.mode === "sub") {
        this.a = randInt(2, max);
        this.b = randInt(1, this.a);
        this.answerValue = this.a - this.b;
      } else {
        this.a = randInt(1, max);
        this.answerValue = this.a;
      }
      const key = `${this.a}|${this.b}`;
      if (key !== this.last) { this.last = key; break; }
    }
  },

  /** Respuesta correcta y otras cercanas. */
  makeOptions() {
    const max = settings.numMax;
    const min = this.mode === "add" || this.mode === "sub" ? 0 : 1;
    const n = this.mode === "match" ? 3 : 4;
    const set = new Set([this.answerValue]);
    for (const d of shuffle([-1, 1, -2, 2, -3, 3, 4, -4, 5, -5])) {
      const v = this.answerValue + d;
      if (v >= min && v <= max && set.size < n) set.add(v);
    }
    // Al identificar números van desordenados: así no ayuda su posición
    this.options = this.mode === "hear" || this.mode === "match" ? shuffle([...set]) : [...set].sort((x, y) => x - y);
  },

  /* ---------- dibujos ---------- */
  objs(n, thing, goneFrom = Infinity) {
    let html = "";
    for (let i = 0; i < n; i++) {
      const gone = i >= goneFrom;
      html += `<span class="obj${gone ? " gone" : ""}" style="--i:${i}" ${gone ? 'aria-hidden="true"' : ""}>${thing}</span>`;
    }
    return `<div class="objGroup">${html}</div>`;
  },

  renderCard() {
    const sum = $("numSum"), pics = $("numPics"), big = $("numBig");
    sum.hidden = !(this.mode === "add" || this.mode === "sub");
    big.hidden = !(this.mode === "hear" || this.mode === "match");
    pics.hidden = this.mode === "hear" || this.mode === "match" || (this.mode !== "count" && !settings.numPics);
    pics.innerHTML = "";

    if (!sum.hidden) {
      const op = this.mode === "add" ? "+" : "−";
      sum.innerHTML = `<b style="--c:#1e88e5">${this.a}</b><span class="op">${op}</span><b style="--c:#e53935">${this.b}</b><span class="op">=</span><b class="q" id="numQ">?</b>`;
    }
    if (this.mode === "hear") {
      big.innerHTML = `<button class="numEar" aria-label="Escuchar el número">👂<span>?</span></button>`;
      big.firstChild.onclick = () => this.listen();
    } else if (this.mode === "match") {
      big.innerHTML = `<b style="--c:${pick(NUM_COLORS)}">${this.a}</b>`;
    }

    const most = this.mode === "count" ? this.a : Math.max(this.a, this.b);
    pics.classList.toggle("many", most > 10);
    pics.classList.toggle("few", most <= 5 && this.mode !== "add");
    pics.classList.toggle("add", this.mode === "add");
    const [t1, t2] = shuffle(NUM_THINGS);
    if (this.mode === "add") pics.innerHTML = this.objs(this.a, t1) + `<span class="op">+</span>` + this.objs(this.b, t2);
    else if (this.mode === "sub") pics.innerHTML = this.objs(this.a, t1, this.a - this.b);
    else if (this.mode === "count") pics.innerHTML = this.objs(this.a, t1);
  },

  renderOptions() {
    const box = $("numOptions");
    box.innerHTML = "";
    box.classList.toggle("groups", this.mode === "match");
    const thing = pick(NUM_THINGS);
    this.options.forEach((v, i) => {
      const b = document.createElement("button");
      b.style.setProperty("--c", NUM_COLORS[i % NUM_COLORS.length]);
      b.style.setProperty("--i", i);
      if (this.mode === "match") {
        // mismo tamaño en todos los grupos: que no se adivine por lo grande que se ve
        b.className = "groupCard" + (Math.max(...this.options) > 10 ? " many" : "");
        b.innerHTML = this.objs(v, thing);
        b.setAttribute("aria-label", "Grupo " + (i + 1));
      } else {
        b.className = "numBtn";
        b.textContent = v;
      }
      b.addEventListener("click", () => this.answer(v, b));
      box.appendChild(b);
    });
  },

  /** Tocar un dibujo lo numera y dice el número en voz alta. */
  countObj(o) {
    if (o.dataset.n) { speak(o.dataset.n); return; }
    const n = ++this.counted;
    o.dataset.n = n;
    o.style.setProperty("--c", NUM_COLORS[(n - 1) % NUM_COLORS.length]);
    o.classList.add("counted");
    play("sndPop", .35);
    speak(String(n));
  },

  next() {
    this.makeProblem();
    this.makeOptions();
    this.counted = 0;
    this.mistakes = 0;
    this.renderCard();
    this.renderOptions();
    restartAnim($("numCard"), "enter");
    $("numCard").classList.remove("good");
    say(NUM_MODES[this.mode].prompt);
    session.locked = false;
    later(() => this.listen(), 350);
  },

  answer(v, el) {
    if (session.locked || el.disabled) return;
    const m = NUM_MODES[this.mode];
    if (v === this.answerValue) {
      el.classList.add("right");
      $("numCard").classList.add("good");
      if ($("numQ")) { $("numQ").textContent = v; $("numQ").classList.add("solved"); }
      const phrase = this.mode === "add" ? `${this.a} más ${this.b} son ${v}`
        : this.mode === "sub" ? `${this.a} menos ${this.b} son ${v}`
        : this.mode === "hear" ? `¡Este es el ${v}!`
        : `¡Hay ${v}!`;
      speak(phrase);
      const [x, y] = centerOf(el);
      scoreCorrect({ x, y, statKey: m.stat, delay: 2200 });
    } else {
      this.mistakes++;
      el.disabled = true;
      restartAnim(el, "wrong");
      scoreWrong(this.mode === "match" ? m.tip : `No es ${v}. ${m.tip}`);
      if (this.mode === "hear") later(() => speak(`Ese es el ${v}. ${this.question()}`), 300);
      else if (this.mode !== "match") speak(`No es ${v}`);
      // Si cuesta, enseña los dibujos aunque estén desactivados en ajustes
      if (this.mistakes >= 2 && (this.mode === "add" || this.mode === "sub")) $("numPics").hidden = false;
    }
  },

  key(e) {
    if (this.mode === "match") {
      const el = $("numOptions").children[parseInt(e.key, 10) - 1];
      if (el) this.answer(this.options[parseInt(e.key, 10) - 1], el);
      return;
    }
    const el = [...$("numOptions").children].find(b => b.textContent === e.key);
    if (el) this.answer(Number(e.key), el);
  },
};

/* Contar tocando: vale para los dibujos de la tarjeta (no los tachados).
   En «Busca el grupo» tocar un grupo es elegirlo, así que ahí no se cuenta. */
document.addEventListener("click", e => {
  const o = e.target.closest("#numPics .obj:not(.gone)");
  if (o) NumberGame.countObj(o);
});
