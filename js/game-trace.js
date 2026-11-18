/* =========================================================
   JUEGO: TRAZAR LETRAS
   Se ve una letra punteada y hay que repasarla con el dedo.
   Se da por buena cuando casi toda la letra está pintada y
   el dedo no se ha salido demasiado.
   ========================================================= */
"use strict";

const TRACE_N = 44;     // la letra se comprueba en una rejilla de N × N casillas

const TraceGame = {
  id: "trazar",
  view: "viewTrace",
  letter: "",
  example: null,
  queue: [],
  mask: null,           // casillas que son letra
  near: null,           // casillas de la letra y sus vecinas (ahí no cuenta como «salirse»)
  maskCount: 0,
  covered: null,
  outside: null,
  drawing: false,
  lastPt: null,
  strokes: 0,
  bound: false,

  enter() { this.queue = []; this.bind(); this.next(); },
  leave() { this.drawing = false; },
  listen() { speak(this.phrase()); },

  /** Vocales y consonantes elegidas en los ajustes de sílabas. */
  letters() {
    const own = settings.letters.filter(k => /^[A-ZÑ]$/.test(k));
    return [...new Set([..."AEIOU", ...(own.length ? own : [..."MPLST"])])];
  },

  phrase() {
    const l = this.letter.toLowerCase();
    return this.example ? `La ${l}, de ${this.example.word}` : `La letra ${l}`;
  },

  findExample(letter) {
    const plain = w => w.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();
    const all = [...WORD_LEVELS[1], ...WORD_LEVELS[2], ...WORD_LEVELS[3]].filter(([w]) => plain(w)[0] === letter && !/^(ch|ll)/.test(w));
    if (!all.length) return null;
    const [word, emoji] = pick(all.slice(0, 6));
    return { word, emoji };
  },

  bind() {
    if (this.bound) return;
    this.bound = true;
    const c = $("traceCanvas");
    c.addEventListener("pointerdown", e => {
      if (session.locked) return;
      e.preventDefault();
      c.setPointerCapture?.(e.pointerId);
      this.drawing = true;
      this.strokes++;
      this.lastPt = null;
      this.stroke(e);
    });
    c.addEventListener("pointermove", e => { if (this.drawing) { e.preventDefault(); this.stroke(e); } });
    const end = () => {
      if (!this.drawing) return;
      this.drawing = false;
      this.check();
    };
    c.addEventListener("pointerup", end);
    c.addEventListener("pointercancel", end);
    $("traceClear").onclick = () => { if (!session.locked) this.reset(); };
    $("traceSkip").onclick = () => { if (!session.locked) this.next(); };
    window.addEventListener("resize", () => { if (session.current === this && !session.locked) this.reset(); });
  },

  next() {
    if (!this.queue.length) {
      this.queue = shuffle(this.letters());
      if (this.queue.length > 1 && this.queue[this.queue.length - 1] === this.letter) this.queue.unshift(this.queue.pop());
    }
    this.letter = this.queue.pop();
    this.example = this.findExample(this.letter);
    $("traceHint").innerHTML = this.example
      ? `${this.example.emoji} <b>${esc(show(this.example.word[0]))}</b>${esc(show(this.example.word.slice(1)))}`
      : "";
    $("traceWrap").classList.remove("good");
    $("traceSkip").classList.remove("show");
    this.fails = 0;
    say("¡Repasa la letra con el dedo! ✍️");
    session.locked = false;
    this.reset();
    later(() => this.listen(), 400);
  },

  /** Borra lo pintado y vuelve a dibujar la letra punteada. */
  reset() {
    const c = $("traceCanvas");
    const size = Math.round(c.clientWidth * (window.devicePixelRatio || 1)) || 600;
    c.width = c.height = size;
    this.covered = new Uint8Array(TRACE_N * TRACE_N);
    this.outside = new Set();
    this.strokes = 0;
    const family = getComputedStyle(c).fontFamily;
    const token = session.token, letter = this.letter;
    const draw = () => {
      if (token !== session.token || letter !== this.letter) return;
      this.drawGuide(family);
    };
    draw();
    // la primera vez puede que la fuente aún no esté cargada: se repinta al llegar
    document.fonts?.load(`bold 100px ${family}`, show(this.letter)).then(draw).catch(() => {});
  },

  /** Pinta la letra en un contexto de lado `size`, centrada. */
  paintLetter(ctx, size, family, { fill, stroke, lineWidth, dash }) {
    const ch = show(this.letter);
    ctx.font = `bold ${size * .74}px ${family}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    const m = ctx.measureText(ch);
    const up = m.actualBoundingBoxAscent ?? size * .5, down = m.actualBoundingBoxDescent ?? 0;
    const y = size / 2 + (up - down) / 2;
    ctx.lineJoin = ctx.lineCap = "round";
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lineWidth;
      ctx.setLineDash(dash || []);
      ctx.strokeText(ch, size / 2, y);
      ctx.setLineDash([]);
    }
    if (fill) { ctx.fillStyle = fill; ctx.fillText(ch, size / 2, y); }
  },

  drawGuide(family) {
    const c = $("traceCanvas"), ctx = c.getContext("2d"), size = c.width;
    ctx.clearRect(0, 0, size, size);
    // se engorda un poco: así las letras finas (la ligada) también dan sitio al dedo
    this.paintLetter(ctx, size, family, { fill: "#e9e0fb", stroke: "#e9e0fb", lineWidth: size * .05 });
    this.paintLetter(ctx, size, family, { stroke: "#b9a9d4", lineWidth: size * .008, dash: [size * .02, size * .02] });

    // Rejilla: qué casillas son letra
    const off = document.createElement("canvas");
    off.width = off.height = TRACE_N;
    const octx = off.getContext("2d", { willReadFrequently: true });
    this.paintLetter(octx, TRACE_N, family, { fill: "#000", stroke: "#000", lineWidth: TRACE_N * .05 });
    const data = octx.getImageData(0, 0, TRACE_N, TRACE_N).data;
    this.mask = new Uint8Array(TRACE_N * TRACE_N);
    this.near = new Uint8Array(TRACE_N * TRACE_N);
    this.maskCount = 0;
    for (let i = 0; i < this.mask.length; i++) {
      if (data[i * 4 + 3] > 90) { this.mask[i] = 1; this.maskCount++; }
    }
    for (let y = 0; y < TRACE_N; y++) for (let x = 0; x < TRACE_N; x++) {
      if (!this.mask[y * TRACE_N + x]) continue;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const xx = x + dx, yy = y + dy;
        if (xx >= 0 && yy >= 0 && xx < TRACE_N && yy < TRACE_N) this.near[yy * TRACE_N + xx] = 1;
      }
    }
  },

  stroke(e) {
    const c = $("traceCanvas"), r = c.getBoundingClientRect();
    const k = c.width / r.width;
    const pt = { x: (e.clientX - r.left) * k, y: (e.clientY - r.top) * k };
    const from = this.lastPt || pt;
    const ctx = c.getContext("2d");
    ctx.strokeStyle = TILE_COLORS[(this.strokes - 1) % TILE_COLORS.length];
    ctx.lineWidth = c.width * .085;
    ctx.lineCap = ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();

    // apuntar en la rejilla todos los puntos del tramo
    const cell = c.width / TRACE_N;
    const steps = Math.max(1, Math.ceil(Math.hypot(pt.x - from.x, pt.y - from.y) / (cell / 2)));
    for (let s = 0; s <= steps; s++) {
      const gx = Math.floor((from.x + (pt.x - from.x) * s / steps) / cell);
      const gy = Math.floor((from.y + (pt.y - from.y) * s / steps) / cell);
      if (gx < 0 || gy < 0 || gx >= TRACE_N || gy >= TRACE_N) continue;
      if (!this.near[gy * TRACE_N + gx]) this.outside.add(gy * TRACE_N + gx);
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const xx = gx + dx, yy = gy + dy;
        if (xx >= 0 && yy >= 0 && xx < TRACE_N && yy < TRACE_N && dx * dx + dy * dy <= 5) this.covered[yy * TRACE_N + xx] = 1;
      }
    }
    this.lastPt = pt;
  },

  /** Al levantar el dedo: ¿está ya la letra repasada? */
  check() {
    if (session.locked || !this.maskCount) return;
    let hit = 0;
    for (let i = 0; i < this.mask.length; i++) if (this.mask[i] && this.covered[i]) hit++;
    const coverage = hit / this.maskCount;
    const spill = this.outside.size / this.maskCount;
    if (spill > .3) {
      this.fails++;
      restartAnim($("traceWrap"), "bad");
      scoreWrong("¡Uy! Sin salirte de la letra ✍️");
      if (this.fails >= 3) $("traceSkip").classList.add("show");
      later(() => this.reset(), 700);
    } else if (coverage >= .8) {
      $("traceWrap").classList.add("good");
      speak(this.phrase());
      const [x, y] = centerOf($("traceCanvas"));
      scoreCorrect({ x, y, statKey: "traceOk", delay: 2000 });
    }
  },
};
