/* =========================================================
   JUEGO 6: NÚMEROS (contar, sumar y restar)
   Cada modo tiene su entrada en el menú (#contar, #sumar, #restar).
   Los dibujos se pueden tocar para contarlos en voz alta.
   ========================================================= */
"use strict";

const NUM_THINGS = ["🍎", "🍓", "🐟", "🐥", "⭐", "🎈", "🍪", "🐞", "🌸", "🚗", "🦆", "🍌", "⚽", "🐸", "🧁", "🐝"];
const NUM_COLORS = ["#e53935", "#1e88e5", "#43a047", "#8e24aa", "#ff8f00", "#00897b"];
const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

const NumberGame = {
  id: "numeros",
  view: "viewNumbers",
  mode: "count",          // count | add | sub
  a: 0, b: 0, answerValue: 0,
  options: [],
  counted: 0,
  mistakes: 0,
  last: "",

  setup(mode) { this.mode = mode || "count"; },
  enter() { this.last = ""; this.next(); },
  leave() { $("numOptions").innerHTML = ""; $("numPics").innerHTML = ""; },

  question() {
    if (this.mode === "add") return `¿Cuánto es ${this.a} más ${this.b}?`;
    if (this.mode === "sub") return `¿Cuánto es ${this.a} menos ${this.b}?`;
    return "¿Cuántos hay?";
  },
  listen() { speak(this.question()); },

  makeProblem() {
    const max = settings.numMax;
    for (let tries = 0; tries < 10; tries++) {
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

  /** Respuesta correcta y tres cercanas, ordenadas de menor a mayor. */
  makeOptions() {
    const max = settings.numMax, min = this.mode === "count" ? 1 : 0;
    const set = new Set([this.answerValue]);
    for (const d of shuffle([-1, 1, -2, 2, -3, 3, 4, -4, 5])) {
      const v = this.answerValue + d;
      if (v >= min && v <= max && set.size < 4) set.add(v);
    }
    this.options = [...set].sort((x, y) => x - y);
  },

  /* ---------- dibujos ---------- */
  objs(n, thing, goneFrom = Infinity) {
    let html = "";
    for (let i = 0; i < n; i++) {
      const gone = i >= goneFrom;
      html += `<button class="obj${gone ? " gone" : ""}" style="--i:${i}" ${gone ? 'tabindex="-1" aria-hidden="true"' : 'aria-label="Contar"'}>${thing}</button>`;
    }
    return `<div class="objGroup">${html}</div>`;
  },

  renderPics() {
    const box = $("numPics");
    const big = this.mode === "count" ? this.a : Math.max(this.a, this.b);
    box.classList.toggle("many", big > 10);
    box.classList.toggle("few", big <= 5 && this.mode !== "add");
    box.classList.toggle("add", this.mode === "add");
    box.hidden = this.mode !== "count" && !settings.numPics;
    const [t1, t2] = shuffle(NUM_THINGS);
    if (this.mode === "add") {
      box.innerHTML = this.objs(this.a, t1) + `<span class="op">+</span>` + this.objs(this.b, t2);
    } else if (this.mode === "sub") {
      box.innerHTML = this.objs(this.a, t1, this.a - this.b);
    } else {
      box.innerHTML = this.objs(this.a, t1);
    }
    box.querySelectorAll(".obj:not(.gone)").forEach(o => o.addEventListener("click", () => this.countObj(o)));
  },

  /** Tocar un dibujo lo numera y dice el número en voz alta. */
  countObj(o) {
    if (o.dataset.n) { speak(o.dataset.n); return; }
    this.counted++;
    o.dataset.n = this.counted;
    o.style.setProperty("--c", NUM_COLORS[(this.counted - 1) % NUM_COLORS.length]);
    o.classList.add("counted");
    play("sndPop", .35);
    speak(String(this.counted));
  },

  next() {
    this.makeProblem();
    this.makeOptions();
    this.counted = 0;
    this.mistakes = 0;

    const sum = $("numSum");
    sum.hidden = this.mode === "count";
    if (this.mode !== "count") {
      const op = this.mode === "add" ? "+" : "−";
      sum.innerHTML = `<b style="--c:#1e88e5">${this.a}</b><span class="op">${op}</span><b style="--c:#e53935">${this.b}</b><span class="op">=</span><b class="q" id="numQ">?</b>`;
    }
    this.renderPics();
    restartAnim($("numCard"), "enter");
    $("numCard").classList.remove("good");

    const box = $("numOptions");
    box.innerHTML = "";
    this.options.forEach((v, i) => {
      const b = document.createElement("button");
      b.className = "numBtn";
      b.style.setProperty("--c", NUM_COLORS[i % NUM_COLORS.length]);
      b.style.setProperty("--i", i);
      b.textContent = v;
      b.addEventListener("click", () => this.answer(v, b));
      box.appendChild(b);
    });

    say(this.mode === "count" ? "¿Cuántos hay? Tócalos para contar 👆"
      : this.mode === "add" ? "¡Suma! Junta todos y cuenta ➕"
      : "¡Resta! Los tachados se han ido ➖");
    session.locked = false;
    later(() => this.listen(), 350);
  },

  answer(v, el) {
    if (session.locked || el.disabled) return;
    if (v === this.answerValue) {
      el.classList.add("right");
      $("numCard").classList.add("good");
      if ($("numQ")) { $("numQ").textContent = v; $("numQ").classList.add("solved"); }
      const phrase = this.mode === "add" ? `${this.a} más ${this.b} son ${v}`
        : this.mode === "sub" ? `${this.a} menos ${this.b} son ${v}`
        : `¡Hay ${v}!`;
      speak(phrase);
      const [x, y] = centerOf(el);
      const statKey = { count: "countOk", add: "sumsOk", sub: "subsOk" }[this.mode];
      scoreCorrect({ x, y, statKey, delay: 2200 });
    } else {
      this.mistakes++;
      el.disabled = true;
      restartAnim(el, "wrong");
      const tip = this.mode === "add" ? "Cuenta todos los dibujos juntos 👆"
        : this.mode === "sub" ? "Cuenta solo los que no están tachados 👆"
        : "Tócalos uno a uno para contar 👆";
      scoreWrong(`No es ${v}. ${tip}`);
      speak(`No es ${v}`);
      // Si cuesta, enseña los dibujos aunque estén desactivados en ajustes
      if (this.mistakes >= 2) $("numPics").hidden = false;
    }
  },

  key(e) {
    const el = [...$("numOptions").children].find(b => b.textContent === e.key);
    if (el) this.answer(Number(e.key), el);
  },
};
