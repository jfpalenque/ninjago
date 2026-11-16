/* =========================================================
   JUEGO 6: NÚMEROS
   Cada modo tiene su entrada en el menú:
     #contar  count  ¿Cuántos hay?
     #numero  hear   se oye un número y hay que tocarlo
     #grupos  match  se ve un número y hay que tocar el grupo con esa cantidad
     #serie   seq    serie de números con un hueco
     #mayor   big    ¿cuál es el mayor (o el menor)?
     #ordenar order  tocar los números de menor a mayor
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
  seq:   { stat: "seqOk",   prompt: "¿Qué número falta en la serie? 🐛",    tip: "Cuenta en voz alta los números de la serie 🐛" },
  big:   { stat: "bigOk",   prompt: "",                                     tip: "" },
  order: { stat: "orderOk", prompt: "Toca los números del menor al mayor 🪜", tip: "Busca el más pequeño que queda 🔎" },
  add:   { stat: "sumsOk",  prompt: "¡Suma! Junta todos y cuenta ➕",        tip: "Cuenta todos los dibujos juntos 👆" },
  sub:   { stat: "subsOk",  prompt: "¡Resta! Los tachados se han ido ➖",    tip: "Cuenta solo los que no están tachados 👆" },
};

const NumberGame = {
  id: "numeros",
  view: "viewNumbers",
  mode: "count",
  a: 0, b: 0, answerValue: 0,
  options: [],
  seq: [], gap: 0,          // serie
  wantMax: true,            // mayor o menor
  sorted: [], step: 0,      // ordenar
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
      case "seq": return "¿Qué número falta?";
      case "big": return this.wantMax ? "¿Cuál es el mayor?" : "¿Cuál es el menor?";
      case "order": return "Toca los números del menor al mayor";
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
      } else if (this.mode === "seq") {
        // 4 números seguidos (a veces de 2 en 2 o hacia atrás) con un hueco
        const step = max >= 20 && Math.random() < .3 ? 2 : 1;
        const start = randInt(1, max - step * 3);
        this.seq = [0, 1, 2, 3].map(i => start + i * step);
        if (Math.random() < .25) this.seq.reverse();
        this.gap = randInt(0, 3);
        this.a = this.seq[0];
        this.b = this.gap;
        this.answerValue = this.seq[this.gap];
      } else if (this.mode === "big" || this.mode === "order") {
        const all = shuffle(Array.from({ length: max }, (_, i) => i + 1));
        this.options = all.slice(0, this.mode === "big" ? 3 : 4);
        this.sorted = [...this.options].sort((x, y) => x - y);
        this.step = 0;
        this.wantMax = Math.random() < .6;
        this.answerValue = this.mode === "order" ? this.sorted[0] : this.wantMax ? this.sorted[this.sorted.length - 1] : this.sorted[0];
        this.a = this.sorted.join(",");
        this.b = this.wantMax ? 1 : 0;
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
    if (this.mode === "big" || this.mode === "order") return;   // ya las ha elegido makeProblem
    const max = settings.numMax;
    const min = this.mode === "add" || this.mode === "sub" || this.mode === "seq" ? 0 : 1;
    const n = this.mode === "match" ? 3 : 4;
    const set = new Set([this.answerValue]);
    const shown = this.mode === "seq" ? this.seq : [];          // los que ya se ven en la serie no valen
    const top = this.mode === "seq" ? max + 4 : max;            // …así que ahí hace falta algo más de margen
    for (const d of shuffle([-1, 1, -2, 2, -3, 3, 4, -4, 5, -5])) {
      const v = this.answerValue + d;
      if (v >= min && v <= top && set.size < n && !shown.includes(v)) set.add(v);
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
    const isSum = this.mode === "add" || this.mode === "sub";
    const isRow = this.mode === "seq" || this.mode === "order";
    sum.hidden = !(isSum || isRow);
    sum.classList.toggle("row", isRow);
    big.hidden = !(this.mode === "hear" || this.mode === "match" || this.mode === "big");
    pics.hidden = !(this.mode === "count" || (isSum && settings.numPics));
    pics.innerHTML = "";

    if (this.mode === "seq") {
      sum.innerHTML = this.seq.map((v, i) => i === this.gap
        ? `<b class="q" id="numQ">?</b>`
        : `<b style="--c:${NUM_COLORS[i % NUM_COLORS.length]}">${v}</b>`).join(`<span class="op">›</span>`);
    } else if (this.mode === "order") {
      sum.innerHTML = this.sorted.map(() => `<b class="q">?</b>`).join(`<span class="op">‹</span>`);
    } else if (isSum) {
      const op = this.mode === "add" ? "+" : "−";
      sum.innerHTML = `<b style="--c:#1e88e5">${this.a}</b><span class="op">${op}</span><b style="--c:#e53935">${this.b}</b><span class="op">=</span><b class="q" id="numQ">?</b>`;
    }
    if (this.mode === "hear") {
      big.innerHTML = `<button class="numEar" aria-label="Escuchar el número">👂<span>?</span></button>`;
      big.firstChild.onclick = () => this.listen();
    } else if (this.mode === "match") {
      big.innerHTML = `<b style="--c:${pick(NUM_COLORS)}">${this.a}</b>`;
    } else if (this.mode === "big") {
      big.innerHTML = `<span class="cmp"><span>${this.wantMax ? "🐘" : "🐭"}</span>${show(this.wantMax ? "el mayor" : "el menor")}</span>`;
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
    say(this.mode === "big"
      ? (this.wantMax ? "¿Cuál es el mayor? 🐘" : "¿Cuál es el menor? 🐭")
      : NUM_MODES[this.mode].prompt);
    session.locked = false;
    later(() => this.listen(), 350);
  },

  answer(v, el) {
    if (session.locked || el.disabled) return;
    const m = NUM_MODES[this.mode];
    if (this.mode === "order" && v === this.answerValue && this.step < this.sorted.length - 1) {
      // Acierto parcial: se coloca en la fila y se busca el siguiente
      this.placeOrdered(v, el);
      speak(String(v));
      play("sndPop", .4);
      this.answerValue = this.sorted[this.step];
      return;
    }
    if (v === this.answerValue) {
      if (this.mode === "order") this.placeOrdered(v, el);
      el.classList.add("right");
      $("numCard").classList.add("good");
      if ($("numQ")) { $("numQ").textContent = v; $("numQ").classList.add("solved"); }
      const phrase = this.mode === "add" ? `${this.a} más ${this.b} son ${v}`
        : this.mode === "sub" ? `${this.a} menos ${this.b} son ${v}`
        : this.mode === "hear" ? `¡Este es el ${v}!`
        : this.mode === "seq" ? this.seq.join(", ")
        : this.mode === "big" ? `¡Sí! El ${v} es ${this.wantMax ? "el mayor" : "el menor"}`
        : this.mode === "order" ? this.sorted.join(", ")
        : `¡Hay ${v}!`;
      speak(phrase);
      const [x, y] = centerOf(el);
      scoreCorrect({ x, y, statKey: m.stat, delay: 2200 });
    } else {
      this.mistakes++;
      el.disabled = true;
      restartAnim(el, "wrong");
      if (this.mode === "order") {
        // aquí se puede volver a tocar más tarde: ese número sigue haciendo falta
        el.disabled = false;
        scoreWrong(m.tip);
        return;
      }
      const tip = this.mode !== "big" ? m.tip
        : this.wantMax ? "El mayor es el número más grande 🐘" : "El menor es el número más pequeño 🐭";
      scoreWrong(this.mode === "match" ? tip : `No es ${v}. ${tip}`);
      if (this.mode === "hear") later(() => speak(`Ese es el ${v}. ${this.question()}`), 300);
      else if (this.mode !== "match") speak(`No es ${v}`);
      // Si cuesta, enseña los dibujos aunque estén desactivados en ajustes
      if (this.mistakes >= 2 && (this.mode === "add" || this.mode === "sub")) $("numPics").hidden = false;
    }
  },

  /** «Ordena»: pasa el número tocado al siguiente hueco de la fila. */
  placeOrdered(v, el) {
    const slot = $("numSum").querySelectorAll("b")[this.step];
    slot.textContent = v;
    slot.style.setProperty("--c", getComputedStyle(el).getPropertyValue("--c"));
    slot.className = "placed";
    el.disabled = true;
    this.step++;
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
