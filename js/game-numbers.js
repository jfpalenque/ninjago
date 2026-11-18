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
     #dobles  double el doble o la mitad de un número
     #formas  shape  tocar la forma o el color que se pide
     #reloj   clock  ¿qué hora marca el reloj?
     #monedas coins  ¿cuánto dinero hay?
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
  double: { stat: "doubleOk", prompt: "",                                   tip: "" },
  shape: { stat: "shapeOk", prompt: "",                                     tip: "¡Escucha otra vez! 👂" },
  clock: { stat: "clockOk", prompt: "¿Qué hora es? 🕒",                      tip: "La aguja corta marca la hora 🕒" },
  coins: { stat: "coinOk",  prompt: "¿Cuánto dinero hay? 🪙",                tip: "Suma el número de cada moneda 🪙" },
};

/* Formas y colores: [nombre, es femenino, dibujo SVG] y [masculino, femenino, color] */
const SHAPES = [
  ["círculo", false, `<circle cx="50" cy="50" r="42"/>`],
  ["cuadrado", false, `<rect x="12" y="12" width="76" height="76" rx="6"/>`],
  ["triángulo", false, `<path d="M50 10 L92 86 L8 86Z"/>`],
  ["rectángulo", false, `<rect x="5" y="27" width="90" height="46" rx="6"/>`],
  ["estrella", true, `<path d="M50 6 L61 38 L95 38 L67 58 L78 92 L50 71 L22 92 L33 58 L5 38 L39 38Z"/>`],
  ["corazón", false, `<path d="M50 88 C10 58 4 34 20 20 C34 8 46 16 50 28 C54 16 66 8 80 20 C96 34 90 58 50 88Z"/>`],
];
const SHAPE_COLORS = [
  ["rojo", "roja", "#e53935"], ["azul", "azul", "#1e88e5"], ["verde", "verde", "#43a047"], ["amarillo", "amarilla", "#ffc400"],
  ["naranja", "naranja", "#ff7b00"], ["morado", "morada", "#8e24aa"], ["rosa", "rosa", "#ff6fae"],
];
const COIN_KINDS = { 1: "c1", 2: "c2", 5: "n5", 10: "n10" };

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
  things: [], ask: "both",  // formas y colores
  coins: [],                // monedas
  typed: "", typedTimer: 0, // teclado: cifras tecleadas

  setup(mode) { this.mode = NUM_MODES[mode] ? mode : "count"; },
  enter() { this.last = ""; this.next(); },
  leave() { $("numOptions").innerHTML = ""; $("numPics").innerHTML = ""; clearTimeout(this.typedTimer); this.typed = ""; },

  /* ---------- textos de los modos nuevos ---------- */
  thingName(t, withColor = this.ask !== "shape", withShape = this.ask !== "color") {
    const [name, fem] = SHAPES[t.s];
    const color = SHAPE_COLORS[t.c][fem ? 1 : 0];
    if (!withShape) return `el color ${SHAPE_COLORS[t.c][0]}`;
    return `${fem ? "la" : "el"} ${name}${withColor ? " " + color : ""}`;
  },
  clockText(v) {
    const h = Math.floor(v / 60), m = v % 60;
    const hour = n => (n === 1 ? "la 1" : `las ${n}`);
    if (m === 45) return `${hour(h % 12 + 1)} menos cuarto`;
    return hour(h) + (m === 30 ? " y media" : m === 15 ? " y cuarto" : "");
  },
  /** Cómo se escribe una respuesta en su botón. */
  label(v) {
    if (this.mode === "clock") return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, "0")}`;
    if (this.mode === "coins") return `${v} €`;
    return String(v);
  },

  question() {
    switch (this.mode) {
      case "add": return `¿Cuánto es ${this.a} más ${this.b}?`;
      case "sub": return `¿Cuánto es ${this.a} menos ${this.b}?`;
      case "hear": return `Busca el número ${this.a}`;
      case "match": return `¿Qué grupo tiene ${this.a}?`;
      case "seq": return "¿Qué número falta?";
      case "big": return this.wantMax ? "¿Cuál es el mayor?" : "¿Cuál es el menor?";
      case "order": return "Toca los números del menor al mayor";
      case "double": return this.b ? `¿Cuál es el doble de ${this.a}?` : `¿Cuál es la mitad de ${this.a}?`;
      case "shape": return `Toca ${this.thingName(this.things[this.answerValue])}`;
      case "clock": return "¿Qué hora es?";
      case "coins": return "¿Cuánto dinero hay?";
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
      } else if (this.mode === "double") {
        const half = randInt(1, Math.floor(max / 2));
        this.b = Math.random() < .6 ? 1 : 0;           // 1 = doble, 0 = mitad
        this.a = this.b ? half : half * 2;
        this.answerValue = this.b ? half * 2 : half;
      } else if (this.mode === "shape") {
        // Hasta 5 solo se pide la forma o el color; después, las dos cosas a la vez
        this.ask = max <= 5 ? pick(["shape", "shape", "color"]) : pick(["shape", "color", "both", "both"]);
        const sh = shuffle(SHAPES.map((_, i) => i)), co = shuffle(SHAPE_COLORS.map((_, i) => i));
        this.things = this.ask === "both"
          ? [{ s: sh[0], c: co[0] }, { s: sh[0], c: co[1] }, { s: sh[1], c: co[0] }, { s: sh[2], c: co[2] }]
          : [0, 1, 2, 3].map(i => ({ s: sh[i], c: co[i] }));
        this.options = shuffle([0, 1, 2, 3]);
        this.answerValue = 0;
        this.a = `${this.ask}${sh[0]}${co[0]}`;
      } else if (this.mode === "clock") {
        const mins = max <= 5 ? [0] : max <= 10 ? [0, 0, 30] : [0, 30, 15, 45];
        this.answerValue = randInt(1, 12) * 60 + pick(mins);
        this.a = this.answerValue;
      } else if (this.mode === "coins") {
        const kinds = max <= 5 ? [1, 2] : max <= 10 ? [1, 2, 5] : [1, 2, 5, 10];
        let left = randInt(2, max);
        this.answerValue = left;
        this.coins = [];
        while (left > 0) {
          // con muchas monedas ya en la mesa se usa la más grande que quepa
          const fit = kinds.filter(k => k <= left);
          const k = this.coins.length >= 4 ? fit[fit.length - 1] : pick(fit);
          this.coins.push(k);
          left -= k;
        }
        this.coins.sort((x, y) => y - x);
        this.a = this.coins.join("+");
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
    if (this.mode === "big" || this.mode === "order" || this.mode === "shape") return;   // ya las ha elegido makeProblem
    if (this.mode === "clock") {
      const v = this.answerValue, h = Math.floor(v / 60), m = v % 60;
      const wrap = x => ((x - 60 + 720) % 720) + 60;            // siempre entre la 1:00 y las 12:59
      const others = shuffle([wrap(v + 60), wrap(v - 60), wrap(h * 60 + (m + 30) % 60), wrap(v + 120), wrap((h % 12 + 1) * 60 + (m ? 0 : 30))]);
      this.options = [...new Set([v, ...others])].slice(0, 4).sort((x, y) => x - y);
      return;
    }
    const max = settings.numMax;
    const min = this.mode === "add" || this.mode === "sub" || this.mode === "seq" ? 0 : 1;
    const n = this.mode === "match" ? 3 : 4;
    const set = new Set([this.answerValue]);
    if (this.mode === "coins") set.add(this.coins.length);      // trampa: contar monedas en vez de sumarlas
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
    const isSum = this.mode === "add" || this.mode === "sub" || this.mode === "double";
    const isRow = this.mode === "seq" || this.mode === "order";
    sum.hidden = !(isSum || isRow);
    sum.classList.toggle("row", isRow);
    big.hidden = !["hear", "match", "big", "shape", "clock"].includes(this.mode);
    pics.hidden = !(this.mode === "count" || this.mode === "coins" || (isSum && settings.numPics));
    pics.innerHTML = "";

    if (this.mode === "seq") {
      sum.innerHTML = this.seq.map((v, i) => i === this.gap
        ? `<b class="q" id="numQ">?</b>`
        : `<b style="--c:${NUM_COLORS[i % NUM_COLORS.length]}">${v}</b>`).join(`<span class="op">›</span>`);
    } else if (this.mode === "order") {
      sum.innerHTML = this.sorted.map(() => `<b class="q">?</b>`).join(`<span class="op">‹</span>`);
    } else if (this.mode === "double") {
      sum.innerHTML = `<span class="op word">${show(this.b ? "el doble de" : "la mitad de")}</span><b style="--c:#1e88e5">${this.a}</b><span class="op">=</span><b class="q" id="numQ">?</b>`;
    } else if (isSum) {
      const op = this.mode === "add" ? "+" : "−";
      sum.innerHTML = `<b style="--c:#1e88e5">${this.a}</b><span class="op">${op}</span><b style="--c:#e53935">${this.b}</b><span class="op">=</span><b class="q" id="numQ">?</b>`;
    }
    if (this.mode === "hear") {
      big.innerHTML = `<button class="numEar" aria-label="Escuchar el número">👂<span>?</span></button>`;
      big.firstChild.onclick = () => this.listen();
    } else if (this.mode === "match") {
      big.innerHTML = `<b style="--c:${pick(NUM_COLORS)}">${this.a}</b>`;
    } else if (this.mode === "shape") {
      const t = this.things[0];
      big.innerHTML = `<span class="cmp ask">${show(this.thingName(t).replace(/^el color /, ""))}</span>`;
    } else if (this.mode === "clock") {
      big.innerHTML = this.clockSVG(this.answerValue);
    } else if (this.mode === "big") {
      big.innerHTML = `<span class="cmp"><span>${this.wantMax ? "🐘" : "🐭"}</span>${show(this.wantMax ? "el mayor" : "el menor")}</span>`;
    }

    const most = this.mode === "count" || this.mode === "double" ? this.a : Math.max(this.a, this.b);
    pics.classList.toggle("many", most > 10);
    pics.classList.toggle("few", most <= 5 && this.mode !== "add");
    pics.classList.toggle("add", this.mode === "add" || this.mode === "double");
    pics.classList.toggle("coins", this.mode === "coins");
    const [t1, t2] = shuffle(NUM_THINGS);
    if (this.mode === "add") pics.innerHTML = this.objs(this.a, t1) + `<span class="op">+</span>` + this.objs(this.b, t2);
    else if (this.mode === "sub") pics.innerHTML = this.objs(this.a, t1, this.a - this.b);
    else if (this.mode === "count") pics.innerHTML = this.objs(this.a, t1);
    else if (this.mode === "double" && this.b) pics.innerHTML = this.objs(this.a, t1) + `<span class="op">+</span>` + this.objs(this.a, t1);
    else if (this.mode === "double") pics.innerHTML = this.objs(this.a / 2, t1) + `<span class="op">✂️</span>` + this.objs(this.a / 2, t1);
    else if (this.mode === "coins") {
      pics.innerHTML = this.coins.map((k, i) => `<span class="coin ${COIN_KINDS[k]}" style="--i:${i}">${k}<small>€</small></span>`).join("");
    }
  },

  shapeSVG(t) {
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><g fill="${SHAPE_COLORS[t.c][2]}" stroke="rgba(0,0,0,.25)" stroke-width="3" stroke-linejoin="round">${SHAPES[t.s][2]}</g></svg>`;
  },

  clockSVG(v) {
    const h = Math.floor(v / 60), m = v % 60;
    const nums = Array.from({ length: 12 }, (_, i) => {
      const n = i + 1, a = (n * 30 - 90) * Math.PI / 180;
      return `<text x="${(100 + 74 * Math.cos(a)).toFixed(1)}" y="${(100 + 74 * Math.sin(a)).toFixed(1)}">${n}</text>`;
    }).join("");
    return `<svg class="clock" viewBox="0 0 200 200" role="img" aria-label="Reloj">
      <circle cx="100" cy="100" r="95" fill="#fff" stroke="#1e88e5" stroke-width="9"/>
      <g font-size="22" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="#2b1d4a">${nums}</g>
      <line x1="100" y1="100" x2="100" y2="54" stroke="#e53935" stroke-width="9" stroke-linecap="round" transform="rotate(${(h % 12 + m / 60) * 30} 100 100)"/>
      <line x1="100" y1="100" x2="100" y2="30" stroke="#2b1d4a" stroke-width="5" stroke-linecap="round" transform="rotate(${m * 6} 100 100)"/>
      <circle cx="100" cy="100" r="7" fill="#2b1d4a"/>
    </svg>`;
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
      } else if (this.mode === "shape") {
        b.className = "shapeBtn";
        b.innerHTML = this.shapeSVG(this.things[v]);
        b.setAttribute("aria-label", this.thingName(this.things[v], true, true));
      } else {
        b.className = "numBtn" + (this.mode === "clock" || this.mode === "coins" ? " wide" : "");
        b.textContent = this.label(v);
        b.dataset.v = v;
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
    say(this.mode === "big" ? (this.wantMax ? "¿Cuál es el mayor? 🐘" : "¿Cuál es el menor? 🐭")
      : this.mode === "double" ? (this.b ? "El doble: dos veces lo mismo ✌️" : "La mitad: se parte en dos ✂️")
      : this.mode === "shape" ? esc(this.question()) + " 👆"
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
        : this.mode === "double" ? `${this.b ? "El doble" : "La mitad"} de ${this.a} es ${v}`
        : this.mode === "shape" ? `¡Sí! ${this.thingName(this.things[v], true, true)}`
        : this.mode === "clock" ? (this.clockText(v).startsWith("la ") ? "Es " : "Son ") + this.clockText(v)
        : this.mode === "coins" ? `¡Hay ${v} euros!`
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
      if (this.mode === "shape") {
        const name = this.thingName(this.things[v], true, true);
        scoreWrong(`Eso es ${esc(name)}. ${m.tip}`);
        later(() => speak(`Eso es ${name}. ${this.question()}`), 300);
        return;
      }
      const tip = this.mode === "double" ? (this.b ? "Junta los dos grupos y cuenta 👆" : "Cuenta solo uno de los dos grupos 👆")
        : this.mode !== "big" ? m.tip
        : this.wantMax ? "El mayor es el número más grande 🐘" : "El menor es el número más pequeño 🐭";
      const shown = this.mode === "clock" ? `las ${this.label(v)}` : this.label(v);
      scoreWrong(this.mode === "match" ? tip : `No es ${shown}. ${tip}`);
      if (this.mode === "hear") later(() => speak(`Ese es el ${v}. ${this.question()}`), 300);
      else if (this.mode === "clock") speak(`No. Eso sería ${this.clockText(v)}`);
      else if (this.mode === "coins") speak(`No son ${v} euros`);
      else if (this.mode !== "match") speak(`No es ${v}`);
      // Si cuesta, enseña los dibujos aunque estén desactivados en ajustes
      if (this.mistakes >= 2 && ["add", "sub", "double"].includes(this.mode)) $("numPics").hidden = false;
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

  /* Teclado. Los grupos, las formas y las horas se eligen por su posición (1, 2, 3…).
     Los números se teclean: con respuestas de dos cifras («12») se espera un momento
     a la segunda cifra antes de darla por buena. */
  key(e) {
    if (!/^\d$/.test(e.key)) return;
    const btns = [...$("numOptions").children];
    if (["match", "shape", "clock"].includes(this.mode)) {
      const i = Number(e.key) - 1;
      if (btns[i]) this.answer(this.options[i], btns[i]);
      return;
    }
    clearTimeout(this.typedTimer);
    const fire = () => {
      const b = btns.find(b => b.dataset.v === this.typed && !b.disabled);
      this.typed = "";
      if (b) this.answer(Number(b.dataset.v), b);
    };
    /** true si lo tecleado hasta ahora puede ser una respuesta (y la lanza o espera a la 2.ª cifra). */
    const tryTyped = () => {
      const live = btns.filter(b => !b.disabled).map(b => b.dataset.v);
      if (live.some(v => v.length > this.typed.length && v.startsWith(this.typed))) { this.typedTimer = later(fire, 700); return true; }
      if (live.includes(this.typed)) { fire(); return true; }
      return false;
    };
    this.typed = (this.typed + e.key).slice(-2);
    if (!tryTyped()) {
      this.typed = e.key;                    // «1» y luego «7» sin que haya 17: vale el 7
      if (!tryTyped()) this.typed = "";
    }
  },
};

/* Contar tocando: vale para los dibujos de la tarjeta (no los tachados).
   En «Busca el grupo» tocar un grupo es elegirlo, así que ahí no se cuenta. */
document.addEventListener("click", e => {
  const o = e.target.closest("#numPics .obj:not(.gone)");
  if (o) NumberGame.countObj(o);
});
