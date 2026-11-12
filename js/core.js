/* =========================================================
   DOJO NINJA — núcleo compartido por todas las pantallas
   (datos guardados, voz, mascota, efectos, puntuación y premios)
   ========================================================= */
"use strict";

const APP_VERSION = "3.2.0";

// premio25.png es idéntico a premio18.png y premio19.png no existe
const DUPLICATE_PRIZES = { "img/premios/premio25.png": "img/premios/premio18.png" };
const MISSING_PRIZES = [19];
const PRIZES = Array.from({ length: 32 }, (_, i) => i + 1)
  .filter(n => !MISSING_PRIZES.includes(n))
  .map(n => `img/premios/premio${n}.png`)
  .filter(p => !DUPLICATE_PRIZES[p]);
const PRIZE_COUNT = PRIZES.length;

const BELTS = [
  { name: "Blanco",   color: "#ffffff", min: 0 },
  { name: "Amarillo", color: "#ffd600", min: 2 },
  { name: "Naranja",  color: "#ff8f00", min: 4 },
  { name: "Verde",    color: "#43a047", min: 7 },
  { name: "Azul",     color: "#1e88e5", min: 10 },
  { name: "Morado",   color: "#8e24aa", min: 14 },
  { name: "Marrón",   color: "#6d4c41", min: 19 },
  { name: "Negro",    color: "#212121", min: 25 },
  { name: "Dorado",   color: "#ffd23f", min: 35 },
];

const NINJA_COLORS = {
  red:    ["#e53935", "#a91f1c"],
  blue:   ["#1e88e5", "#0d4f91"],
  green:  ["#43a047", "#1f6b23"],
  black:  ["#3a3a46", "#15151c"],
  gold:   ["#f6b400", "#a87a00"],
  purple: ["#8e44ad", "#5b2770"],
  pink:   ["#ec4f9c", "#a3216a"],
};

const PRAISE = ["¡Muy bien!", "¡Genial!", "¡Eres un crack!", "¡Bravo, ninja!", "¡Perfecto!", "¡Súper!", "¡Así se hace!", "¡Increíble!"];
const ENCOURAGE = ["¡Casi! Prueba otra vez", "¡Tú puedes!", "¡Inténtalo de nuevo!", "¡Venga, otra vez!"];

/* ---------------------------------------------------------
   Utilidades
   --------------------------------------------------------- */
const $ = id => document.getElementById(id);
const rand = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const shuffle = arr => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function restartAnim(el, cls) {
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}

function load(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : JSON.parse(v);
  } catch { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* almacenamiento lleno o bloqueado */ }
}

/* ---------------------------------------------------------
   Estado persistente (con migración de la versión 1)
   --------------------------------------------------------- */
const DEFAULT_SETTINGS = {
  // general
  goal: 5, lowercase: false, sound: true, rate: 0.7, color: "red",
  // sílabas
  mode: "doors", count: 5, letters: ["P"], changeOnFail: false, sameVowel: false,
  // palabras
  wordLevel: "1", micLevel: "normal", showSyllables: true, buildHint: true, buildExtra: false,
  customWords: [], onlyCustom: false, showPics: true,
  // números
  numMax: 10, numPics: true,
};

function loadSettings() {
  const stored = load("dojoSettings", null);
  if (stored) return { ...DEFAULT_SETTINGS, ...stored };

  // Migrar ajustes de la versión 1
  const s = { ...DEFAULT_SETTINGS };
  const oldLetters = "BCDFGHJKLMNPRSTVWXYZ".split("").filter(l => load("letter_" + l, false));
  if (load("letter_Q", false)) oldLetters.push("Q");
  if (oldLetters.length) s.letters = oldLetters;
  const oldCount = parseInt(localStorage.getItem("doorCount"), 10);
  if (oldCount >= 2 && oldCount <= 5) s.count = oldCount;
  s.changeOnFail = load("changeOnFail", false);
  s.sameVowel = load("sameVowel", false);
  return s;
}

const settings = loadSettings();

let unlocked = load("unlockedRewards", {});   // { ruta: cantidad } — mismo formato que la v1
for (const [dup, orig] of Object.entries(DUPLICATE_PRIZES)) {
  if (unlocked[dup]) {
    unlocked[orig] = (unlocked[orig] || 0) + unlocked[dup];
    delete unlocked[dup];
    save("unlockedRewards", unlocked);
  }
}

const STATS_DEFAULT = {
  stars: 0, bestStreak: 0, progress: 0, syllablesOk: 0, wordsRead: 0, wordsBuilt: 0,
  picturesOk: 0, missingOk: 0, countOk: 0, sumsOk: 0, subsOk: 0, hearOk: 0, matchOk: 0,
};
let stats = { ...STATS_DEFAULT, ...load("dojoStats", {}) };
let wordStats = load("dojoWordStats", {});      // { palabra: { ok, fail } }

const saveSettings = () => save("dojoSettings", settings);
const saveStats = () => save("dojoStats", stats);

function trackWord(word, ok) {
  const k = word.toLowerCase();
  const w = wordStats[k] || (wordStats[k] = { ok: 0, fail: 0 });
  ok ? w.ok++ : w.fail++;
  save("dojoWordStats", wordStats);
}

/* Estado de la sesión */
const session = { locked: true, streak: 0, current: null, token: 0, rewardActive: false };

/* Ejecuta fn tras ms solo si seguimos en la misma pantalla/juego */
function later(fn, ms) {
  const token = session.token;
  return setTimeout(() => { if (token === session.token) fn(); }, ms);
}

/* ---------------------------------------------------------
   Sonido y voz
   --------------------------------------------------------- */
function play(id, volume = 1) {
  if (!settings.sound) return;
  const snd = $(id);
  if (!snd) return;
  snd.volume = volume;
  snd.currentTime = 0;
  snd.play().catch(() => {});
}

let esVoice = null;
function pickVoice() {
  const voices = speechSynthesis.getVoices();
  esVoice = voices.find(v => v.lang === "es-ES") || voices.find(v => v.lang && v.lang.startsWith("es")) || null;
}
if ("speechSynthesis" in window) {
  pickVoice();
  speechSynthesis.addEventListener?.("voiceschanged", pickVoice);
}

function speak(text, { rate } = {}) {
  if (!("speechSynthesis" in window) || !text) return Promise.resolve();
  speechSynthesis.cancel();
  return new Promise(resolve => {
    const u = new SpeechSynthesisUtterance(String(text).toLowerCase());
    u.lang = "es-ES";
    if (esVoice) u.voice = esVoice;
    u.rate = rate || settings.rate;
    u.pitch = 1.1;
    const btn = $("listenBtn");
    u.onstart = () => btn.classList.add("talking");
    u.onend = u.onerror = () => { btn.classList.remove("talking"); resolve(); };
    speechSynthesis.speak(u);
    setTimeout(resolve, 6000); // por si el navegador no avisa del final
  });
}

const show = txt => settings.lowercase ? txt.toLowerCase() : txt.toUpperCase();

/* ---------------------------------------------------------
   Mascota ninja (SVG original)
   --------------------------------------------------------- */
function mascotSVG() {
  return `
  <svg viewBox="0 0 200 230" role="img" aria-label="Ninja">
    <g class="ninja">
      <g class="tails">
        <path class="dark" d="M148 46 Q182 30 198 50 Q178 46 156 58Z"/>
        <path class="dark" d="M150 54 Q185 62 192 86 Q176 70 154 64Z"/>
      </g>
      <g transform="rotate(32 100 140)">
        <rect x="95" y="58" width="10" height="30" rx="3" fill="#5c2e18"/>
        <rect x="89" y="86" width="22" height="7" rx="3" fill="#ffd23f"/>
        <rect x="96" y="92" width="8" height="110" rx="3" fill="#cfd8dc"/>
      </g>
      <rect class="dark" x="72" y="186" width="24" height="32" rx="9"/>
      <rect class="dark" x="104" y="186" width="24" height="32" rx="9"/>
      <rect class="mask" x="58" y="124" width="84" height="72" rx="28"/>
      <path d="M80 128 L100 152 L120 128" fill="none" stroke="rgba(0,0,0,.18)" stroke-width="5" stroke-linecap="round"/>
      <rect class="beltC" x="58" y="160" width="84" height="14" rx="4"/>
      <rect class="beltC" x="92" y="157" width="16" height="20" rx="5"/>
      <path class="beltC" d="M96 176 L90 194 L99 192Z M104 176 L111 194 L102 192Z"/>
      <ellipse class="mask" cx="54" cy="152" rx="14" ry="20"/>
      <circle class="dark" cx="50" cy="170" r="10"/>
      <g class="armR">
        <ellipse class="mask" cx="146" cy="152" rx="14" ry="20"/>
        <circle class="dark" cx="150" cy="170" r="10"/>
      </g>
      <circle class="mask" cx="100" cy="78" r="58"/>
      <rect x="56" y="60" width="88" height="36" rx="18" fill="#ffdcb8"/>
      <rect class="dark" x="44" y="38" width="112" height="15" rx="7"/>
      <circle cx="100" cy="45.5" r="9" fill="#ffd23f" stroke="#a87a00" stroke-width="2"/>
      <path d="M95 45 L100 40 L105 45 L100 50Z" fill="#a87a00"/>
      <path d="M70 66 L90 71 M130 66 L110 71" stroke="#2b1d4a" stroke-width="4" stroke-linecap="round"/>
      <g class="eyes">
        <ellipse cx="82" cy="79" rx="7.5" ry="9" fill="#2b1d4a"/>
        <ellipse cx="118" cy="79" rx="7.5" ry="9" fill="#2b1d4a"/>
        <circle cx="84.5" cy="75.5" r="2.8" fill="#fff"/>
        <circle cx="120.5" cy="75.5" r="2.8" fill="#fff"/>
      </g>
      <g class="eyesHappy" stroke="#2b1d4a" stroke-width="4.5" fill="none" stroke-linecap="round">
        <path d="M73 82 Q82 70 91 82"/><path d="M109 82 Q118 70 127 82"/>
      </g>
      <ellipse cx="68" cy="89" rx="6" ry="3.5" fill="#ff8a8a" opacity=".6"/>
      <ellipse cx="132" cy="89" rx="6" ry="3.5" fill="#ff8a8a" opacity=".6"/>
      <path class="sweat" d="M150 52 Q144 64 150 68 Q156 64 150 52Z" fill="#7fd3ff"/>
    </g>
  </svg>`;
}

function mascotReact(kind) {
  document.querySelectorAll(".ninja").forEach(n => {
    n.classList.remove("happy", "sad", "wave");
    void n.getBoundingClientRect();
    n.classList.add(kind);
  });
  clearTimeout(mascotReact.t);
  mascotReact.t = setTimeout(() => document.querySelectorAll(".ninja").forEach(n => n.classList.remove(kind)), 2000);
}

function say(text, mood = "") {
  const b = $("bubble");
  b.innerHTML = text;
  b.className = "bubble " + mood;
  restartAnim(b, "pop");
}

function applyNinjaColor() {
  const [main, dark] = NINJA_COLORS[settings.color] || NINJA_COLORS.red;
  document.documentElement.style.setProperty("--ninja", main);
  document.documentElement.style.setProperty("--ninja-dark", dark);
}

/* ---------------------------------------------------------
   Cinturones
   --------------------------------------------------------- */
const totalPrizes = () => Object.values(unlocked).reduce((a, b) => a + b, 0);
const beltIndex = (n = totalPrizes()) => BELTS.reduce((acc, b, i) => (n >= b.min ? i : acc), 0);

function updateBelt() {
  const belt = BELTS[beltIndex()];
  document.documentElement.style.setProperty("--belt", belt.color);
  $("beltBadge").innerHTML = `<i style="background:${belt.color}"></i><span>${belt.name}</span>`;
  $("startBelt").textContent = `Cinturón ${belt.name} · ⭐ ${stats.stars}`;
  const owned = PRIZES.filter(p => unlocked[p]).length;
  $("menuPrizes").textContent = `${owned} de ${PRIZE_COUNT}`;
}

/* ---------------------------------------------------------
   Fondo animado
   --------------------------------------------------------- */
function buildSky() {
  const stars = $("stars");
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 70; i++) {
    const s = document.createElement("i");
    s.className = "star";
    s.style.left = rand(0, 100) + "%";
    s.style.top = rand(0, 65) + "%";
    s.style.setProperty("--t", rand(1.5, 4) + "s");
    s.style.setProperty("--d", -rand(0, 4) + "s");
    if (Math.random() < .2) s.style.width = s.style.height = "4px";
    frag.appendChild(s);
  }
  stars.appendChild(frag);

  if (reducedMotion) return;
  const petals = $("petals");
  for (let i = 0; i < 10; i++) {
    const p = document.createElement("span");
    p.className = "petal";
    p.textContent = pick(["🌸", "🌸", "🍃"]);
    p.style.left = rand(0, 100) + "%";
    const dur = rand(12, 22);
    p.style.setProperty("--dur", dur + "s");
    p.style.setProperty("--delay", -rand(0, dur) + "s");
    p.style.setProperty("--s", rand(14, 26) + "px");
    petals.appendChild(p);
  }
}

/* ---------------------------------------------------------
   Efectos: partículas y confeti
   --------------------------------------------------------- */
function burst(x, y, chars = ["⭐", "✨", "💫"], count = 12) {
  if (reducedMotion) count = 4;
  for (let i = 0; i < count; i++) {
    const p = document.createElement("span");
    p.className = "particle";
    p.textContent = pick(chars);
    const ang = (Math.PI * 2 * i) / count + rand(-.3, .3);
    const dist = rand(70, 150);
    p.style.left = x + "px";
    p.style.top = y + "px";
    p.style.setProperty("--dx", Math.cos(ang) * dist + "px");
    p.style.setProperty("--dy", Math.sin(ang) * dist + "px");
    p.style.setProperty("--rot", rand(-180, 180) + "deg");
    p.style.setProperty("--size", rand(18, 34) + "px");
    document.body.appendChild(p);
    p.addEventListener("animationend", () => p.remove());
  }
}

function centerOf(el) {
  const r = el.getBoundingClientRect();
  return [r.left + r.width / 2, r.top + r.height / 2];
}

function confetti(duration = 3500) {
  if (reducedMotion) return;
  const canvas = $("confetti");
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.width = innerWidth * dpr;
  const H = canvas.height = innerHeight * dpr;
  const colors = ["#ffd23f", "#ff5a36", "#2ecc71", "#1e88e5", "#ec4f9c", "#8e44ad", "#fff"];
  const pieces = Array.from({ length: 160 }, () => ({
    x: rand(0, W), y: rand(-H, 0),
    vx: rand(-2, 2) * dpr, vy: rand(2, 6) * dpr,
    r: rand(0, Math.PI), vr: rand(-.2, .2),
    w: rand(6, 12) * dpr, h: rand(4, 8) * dpr,
    c: pick(colors),
  }));
  const end = performance.now() + duration;
  (function frame(now) {
    ctx.clearRect(0, 0, W, H);
    for (const p of pieces) {
      p.x += p.vx; p.y += p.vy; p.r += p.vr; p.vy += .05 * dpr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (now < end) requestAnimationFrame(frame);
    else ctx.clearRect(0, 0, W, H);
  })(performance.now());
}

/* ---------------------------------------------------------
   Progreso y marcador
   --------------------------------------------------------- */
function renderProgress(animateLast = false) {
  const box = $("progress");
  box.innerHTML = "";
  for (let i = 0; i < settings.goal; i++) {
    const s = document.createElement("span");
    const isLast = i === settings.goal - 1;
    s.className = "pStar" + (i < stats.progress ? " on" : "") + (isLast && i >= stats.progress ? " gift" : "");
    s.textContent = isLast ? "🎁" : "⭐";
    if (i < stats.progress && !(animateLast && i === stats.progress - 1)) s.style.animation = "none";
    box.appendChild(s);
  }
}

function renderHud() {
  $("starCount").textContent = stats.stars;
  $("streakCount").textContent = session.streak;
  $("streakBox").classList.toggle("cold", session.streak === 0);
  $("muteBtn").textContent = settings.sound ? "🔔" : "🔕";
}

/* ---------------------------------------------------------
   Puntuación común a todos los juegos
   --------------------------------------------------------- */
/**
 * Acierto: suma estrella, racha y progreso. Si se llena la barra lanza el premio;
 * si no, pasa a la siguiente ronda del juego actual tras `delay` ms.
 */
function scoreCorrect({ x, y, statKey, delay = 1500 } = {}) {
  session.locked = true;
  play("sndCorrect");
  if (x !== undefined) burst(x, y);
  mascotReact("happy");

  session.streak++;
  stats.stars++;
  if (statKey) stats[statKey] = (stats[statKey] || 0) + 1;
  stats.bestStreak = Math.max(stats.bestStreak, session.streak);
  stats.progress = Math.min(stats.progress + 1, settings.goal);
  saveStats();
  renderHud();
  renderProgress(true);

  if (session.streak >= 3 && session.streak % 3 === 0) {
    say(`¡Racha de ${session.streak}! 🔥`, "good");
    restartAnim($("streakBox"), "hot");
  } else {
    say(pick(PRAISE), "good");
  }

  if (stats.progress >= settings.goal) later(startReward, Math.min(delay, 1200));
  else later(() => session.current?.next(), delay);
}

/** Fallo: rompe la racha y anima a seguir. */
function scoreWrong(message) {
  play("sndWrong", .7);
  mascotReact("sad");
  say(message || pick(ENCOURAGE), "bad");
  session.streak = 0;
  renderHud();
}

/* ---------------------------------------------------------
   Premios
   --------------------------------------------------------- */
function choosePrize() {
  const missing = PRIZES.filter(p => !unlocked[p]);
  // Favorece los premios que aún no tiene para completar la colección
  return missing.length && Math.random() < .65 ? pick(missing) : pick(PRIZES);
}

function startReward() {
  session.locked = true;
  session.rewardActive = true;
  $("lanterns").classList.add("paused");

  const prize = choosePrize();
  const isNew = !unlocked[prize];
  const beltBefore = beltIndex();
  unlocked[prize] = (unlocked[prize] || 0) + 1;
  save("unlockedRewards", unlocked);
  const beltAfter = beltIndex();

  const ov = $("rewardOverlay");
  ov.classList.remove("opened");
  ov.hidden = false;
  $("rewardImage").src = prize;
  $("newBadge").hidden = !isNew;
  $("rewardText").textContent = "¡Toca el regalo!";
  play("sndPrize");

  let opened = false, closed = false, autoClose;
  const open = () => {
    if (opened) return;
    opened = true;
    ov.classList.add("opened");
    confetti();
    let text = isNew ? "¡Premio nuevo!" : "¡Otro premio!";
    if (beltAfter > beltBefore) text = `¡Ahora eres cinturón ${BELTS[beltAfter].name}! 🥋`;
    updateBelt();
    $("rewardText").textContent = text;
    speak(text.replace(/[^\p{L}\p{N}\s¡!]/gu, ""));
    $("rewardOkBtn").focus();
    autoClose = setTimeout(close, 8000);
  };
  const close = () => {
    if (closed) return;
    closed = true;
    clearTimeout(autoOpen); clearTimeout(autoClose);
    ov.hidden = true;
    restartAnim($("albumBtn"), "bump");
    launchBalloons().then(() => {
      stats.progress = 0;
      saveStats();
      renderProgress();
      session.rewardActive = false;
      session.current?.next();     // sigue el juego en el que esté ahora el niño
    });
  };

  const autoOpen = setTimeout(open, 1600);
  $("giftBox").onclick = open;
  $("rewardOkBtn").onclick = close;
}

function launchBalloons() {
  return new Promise(resolve => {
    const total = reducedMotion ? 5 : 14;
    let remaining = total;
    play("sndBalloons", .5);
    say("¡Explota los globos! 🎈", "good");

    const done = b => {
      if (b.dataset.gone) return;
      b.dataset.gone = "1";
      b.remove();
      if (--remaining === 0) { clearTimeout(safety); resolve(); }
    };
    const safety = setTimeout(() => {
      document.querySelectorAll(".balloon").forEach(b => b.remove());
      resolve();
    }, 11000);

    for (let i = 0; i < total; i++) {
      const b = document.createElement("button");
      b.className = "balloon";
      b.textContent = "🎈";
      b.setAttribute("aria-label", "Globo");
      b.style.left = rand(3, 88) + "vw";
      b.style.fontSize = rand(70, 130) + "px";
      b.style.setProperty("--hue", rand(0, 360) + "deg");
      b.style.setProperty("--dur", rand(4.5, 7.5) + "s");
      b.style.setProperty("--delay", rand(0, 1.5) + "s");
      b.addEventListener("pointerdown", e => {
        e.preventDefault();
        if (b.classList.contains("pop")) return;
        b.classList.add("pop");
        play("sndPop");
        burst(e.clientX, e.clientY, ["✨", "💥", "⭐"], 6);
        setTimeout(() => done(b), 250);
      });
      b.addEventListener("animationend", e => { if (e.animationName === "floatUp") done(b); });
      document.body.appendChild(b);
    }
  });
}

/* ---------------------------------------------------------
   Álbum de premios
   --------------------------------------------------------- */
function renderAlbum() {
  const owned = PRIZES.filter(p => unlocked[p]).length;
  $("albumCount").textContent = `Tienes ${owned} de ${PRIZE_COUNT} premios 🌟`;

  const bi = beltIndex();
  const total = totalPrizes();
  const next = BELTS[bi + 1];
  $("beltPath").innerHTML =
    BELTS.map((b, i) => `<span class="beltStep ${i <= bi ? "done" : ""} ${i === bi ? "current" : ""}" style="background:${b.color}" title="Cinturón ${b.name}"></span>`).join("") +
    `<span class="beltNext">${next ? `Faltan ${next.min - total} premios para el ${next.name}` : "¡Eres un gran maestro ninja!"}</span>`;

  $("albumGrid").innerHTML = PRIZES.map(p => {
    const n = unlocked[p] || 0;
    return `<div class="albumItem ${n ? "" : "locked"}">
      <img src="${p}" alt="" loading="lazy" draggable="false">
      ${n > 1 ? `<span class="count">x${n}</span>` : ""}
    </div>`;
  }).join("");
}
