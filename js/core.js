/* =========================================================
   DOJO NINJA — núcleo compartido por todas las pantallas
   (datos guardados, voz, mascota, efectos, puntuación y premios)
   ========================================================= */
"use strict";

const APP_VERSION = "4.0.0";

// premio25.png es idéntico a premio18.png y premio19.png no existe
const DUPLICATE_PRIZES = { "img/premios/premio25.png": "img/premios/premio18.png" };
const MISSING_PRIZES = [19];
const PRIZES = Array.from({ length: 32 }, (_, i) => i + 1)
  .filter(n => !MISSING_PRIZES.includes(n))
  .map(n => `img/premios/premio${n}.png`)
  .filter(p => !DUPLICATE_PRIZES[p]);

/* Pegatinas ninja: premios dibujados por la propia app (no necesitan imagen).
   Se guardan como "sticker:<id>" en el mismo registro que los demás premios. */
const STICKERS = [
  ["dragon", "🐉", "Dragón de fuego", "#ff7043"], ["katanas", "⚔️", "Katanas cruzadas", "#90a4ae"],
  ["templo", "🏯", "Templo ninja", "#ef5350"], ["kimono", "🥋", "Kimono", "#42a5f5"],
  ["ninja", "🥷", "Ninja sigiloso", "#5c6bc0"], ["panda", "🐼", "Panda guerrero", "#66bb6a"],
  ["zorro", "🦊", "Zorro astuto", "#ffa726"], ["tigre", "🐅", "Tigre veloz", "#ffb300"],
  ["aguila", "🦅", "Águila vigía", "#8d6e63"], ["serpiente", "🐍", "Serpiente verde", "#9ccc65"],
  ["tortuga", "🐢", "Tortuga sabia", "#26a69a"], ["buho", "🦉", "Búho maestro", "#a1887f"],
  ["rayo", "⚡", "Rayo", "#ffd600"], ["fuego", "🔥", "Fuego", "#ff5722"],
  ["hielo", "❄️", "Hielo", "#4fc3f7"], ["ola", "🌊", "Ola gigante", "#29b6f6"],
  ["tornado", "🌪️", "Tornado", "#b0bec5"], ["volcan", "🌋", "Volcán", "#e64a19"],
  ["gema", "💎", "Gema mágica", "#26c6da"], ["corona", "👑", "Corona dorada", "#ffca28"],
  ["copa", "🏆", "Copa de campeón", "#ffc107"], ["medalla", "🥇", "Medalla de oro", "#ffd54f"],
  ["escudo", "🛡️", "Escudo", "#7986cb"], ["arco", "🏹", "Arco y flecha", "#a5d6a7"],
  ["farol", "🏮", "Farolillo", "#ef5350"], ["bambu", "🎋", "Bambú", "#81c784"],
  ["cerezo", "🌸", "Flor de cerezo", "#f48fb1"], ["ramen", "🍜", "Ramen", "#ffb74d"],
  ["sushi", "🍣", "Sushi", "#ff8a65"], ["cometa", "🪁", "Cometa", "#4dd0e1"],
  ["luna", "🌙", "Luna llena", "#7e57c2"], ["estrella", "🌟", "Estrella ninja", "#ffee58"],
  ["cohete", "🚀", "Cohete", "#5c6bc0"], ["unicornio", "🦄", "Unicornio", "#ce93d8"],
  ["dino", "🦖", "Dinosaurio", "#66bb6a"], ["robot", "🤖", "Robot", "#90a4ae"],
];
const STICKER_INFO = Object.fromEntries(STICKERS.map(([id, emoji, name, color]) => ["sticker:" + id, { emoji, name, color }]));
PRIZES.push(...Object.keys(STICKER_INFO));
const PRIZE_COUNT = PRIZES.length;

const prizeName = p => STICKER_INFO[p]?.name || "";
function prizeHTML(p) {
  const s = STICKER_INFO[p];
  return s
    ? `<span class="sticker" style="--c:${s.color}" title="${esc(s.name)}"><span>${s.emoji}</span></span>`
    : `<img src="${p.replace(/\.png$/, ".webp")}" alt="" loading="lazy" draggable="false">`;
}

/* `min` = premios ganados en total. Los cinturones antiguos conservan su mínimo
   para que nadie baje de cinturón al actualizar. `bg` = dibujo si no es un color liso. */
const BELTS = [
  { name: "Blanco",    color: "#ffffff", min: 0 },
  { name: "Amarillo",  color: "#ffd600", min: 2 },
  { name: "Naranja",   color: "#ff8f00", min: 4 },
  { name: "Verde",     color: "#43a047", min: 7 },
  { name: "Azul",      color: "#1e88e5", min: 10 },
  { name: "Turquesa",  color: "#00bfa5", min: 12 },
  { name: "Morado",    color: "#8e24aa", min: 14 },
  { name: "Rosa",      color: "#ec4f9c", min: 17 },
  { name: "Marrón",    color: "#6d4c41", min: 19 },
  { name: "Rojo",      color: "#d32f2f", min: 22 },
  { name: "Negro",     color: "#212121", min: 25 },
  { name: "Plata",     color: "#b0bec5", min: 30, bg: "linear-gradient(180deg, #f5f7f8, #90a4ae)" },
  { name: "Dorado",    color: "#ffd23f", min: 35, bg: "linear-gradient(180deg, #fff3a6, #f5a800)" },
  { name: "Rubí",      color: "#e0115f", min: 45, bg: "linear-gradient(135deg, #ff6f91, #b0003a)" },
  { name: "Esmeralda", color: "#00c853", min: 55, bg: "linear-gradient(135deg, #69f0ae, #00796b)" },
  { name: "Diamante",  color: "#81d4fa", min: 70, bg: "linear-gradient(135deg, #e1f5fe, #4fc3f7 50%, #e1f5fe)" },
  { name: "Arcoíris",  color: "#ff4081", min: 90, bg: "linear-gradient(90deg, #e53935, #ff8f00, #ffd600, #43a047, #1e88e5, #8e24aa)" },
  { name: "Dragón",    color: "#ff3d00", min: 120, bg: "linear-gradient(90deg, #212121, #ff3d00, #ffd600, #ff3d00, #212121)" },
];
const beltBg = b => b.bg || b.color;

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

function rawLoad(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : JSON.parse(v);
  } catch { return fallback; }
}
function rawSave(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* almacenamiento lleno o bloqueado */ }
}

/* ---------------------------------------------------------
   Perfiles: cada niño tiene sus ajustes, premios y progreso.
   El perfil «p1» usa las claves de siempre (sin prefijo) para
   conservar lo que ya había guardado; los demás llevan «<id>:».
   `lock` = bloqueo para mayores (es del dispositivo, no del perfil).
   --------------------------------------------------------- */
const PROFILE_KEYS = ["dojoSettings", "unlockedRewards", "dojoStats", "dojoWordStats", "dojoMedals", "dojoSylStats", "dojoDaily", "dojoShop"];
const profiles = { list: [{ id: "p1", name: "Ninja", avatar: "🥷" }], current: "p1", lock: true, ...rawLoad("dojoProfiles", {}) };
if (!Array.isArray(profiles.list) || !profiles.list.length) profiles.list = [{ id: "p1", name: "Ninja", avatar: "🥷" }];
if (!profiles.list.some(p => p.id === profiles.current)) profiles.current = profiles.list[0].id;
const saveProfiles = () => rawSave("dojoProfiles", profiles);
const currentProfile = () => profiles.list.find(p => p.id === profiles.current);
const profileKey = (key, id = profiles.current) => (id === "p1" ? key : `${id}:${key}`);

const load = (key, fallback) => rawLoad(profileKey(key), fallback);
const save = (key, value) => rawSave(profileKey(key), value);

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
  // voz ("" = automática)
  voice: "", pitch: 1.1,
  // repaso de lo que cuesta, dificultad automática, tipo de letra y disfraz del ninja
  smartReview: true, autoLevel: true, font: "normal",
  outfit: { hat: "", glasses: "", pet: "" },
};

function loadSettings() {
  const stored = load("dojoSettings", null);
  if (stored) return { ...DEFAULT_SETTINGS, ...stored, outfit: { ...DEFAULT_SETTINGS.outfit, ...stored.outfit } };
  if (profiles.current !== "p1") return { ...DEFAULT_SETTINGS, outfit: { ...DEFAULT_SETTINGS.outfit } };

  // Migrar ajustes de la versión 1
  const s = { ...DEFAULT_SETTINGS, outfit: { ...DEFAULT_SETTINGS.outfit } };
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
  pairsOk: 0, yesNoOk: 0, spellOk: 0, seqOk: 0, bigOk: 0, orderOk: 0,
  traceOk: 0, sentOk: 0, shapeOk: 0, clockOk: 0, coinOk: 0, doubleOk: 0,
  spent: 0,        // estrellas gastadas en la tienda (las medallas cuentan todas las ganadas)
  missions: 0,     // misiones del día cumplidas
};
/* byGame = { ruta: { ok, fail, sec } }: aciertos, fallos y segundos jugados en cada juego */
const freshStats = () => ({ ...STATS_DEFAULT, byGame: {} });
let stats = { ...freshStats(), ...load("dojoStats", {}) };
let wordStats = load("dojoWordStats", {});      // { palabra: { ok, fail } }
let sylStats = load("dojoSylStats", {});        // { sílaba: { ok, fail } }
let shop = { owned: [], ...load("dojoShop", {}) };
const coins = () => Math.max(0, stats.stars - (stats.spent || 0));

/* Todos los juegos: ruta, icono, nombre, contador de aciertos y grupo */
const GAME_INFO = [
  ["silabas", "🚪", "Sílabas", "syllablesOk", "leer"], ["trazar", "✍️", "Trazar letras", "traceOk", "leer"],
  ["dibujo", "🖼️", "Palabra y dibujo", "picturesOk", "leer"], ["construir", "🧩", "Construye", "wordsBuilt", "leer"],
  ["falta", "🔍", "¿Qué falta?", "missingOk", "leer"], ["parejas", "🃏", "Parejas", "pairsOk", "leer"],
  ["sino", "👍", "¿Sí o no?", "yesNoOk", "leer"], ["letras", "🔤", "Letras", "spellOk", "leer"],
  ["leer", "🎤", "Lee la palabra", "wordsRead", "leer"], ["frases", "📜", "Frases", "sentOk", "leer"],
  ["contar", "🍎", "Contar", "countOk", "num"], ["numero", "👂", "¿Qué número?", "hearOk", "num"],
  ["grupos", "🎯", "Busca el grupo", "matchOk", "num"], ["serie", "🐛", "Series", "seqOk", "num"],
  ["mayor", "🐘", "Mayor o menor", "bigOk", "num"], ["ordenar", "🪜", "Ordena", "orderOk", "num"],
  ["sumar", "➕", "Sumas", "sumsOk", "num"], ["restar", "➖", "Restas", "subsOk", "num"],
  ["dobles", "✌️", "Dobles y mitades", "doubleOk", "num"], ["formas", "🔷", "Formas y colores", "shapeOk", "num"],
  ["reloj", "🕒", "El reloj", "clockOk", "num"], ["monedas", "🪙", "Monedas", "coinOk", "num"],
].map(([route, ico, name, stat, group]) => ({ route, ico, name, stat, group }));
const gameInfo = route => GAME_INFO.find(g => g.route === route);

const saveSettings = () => save("dojoSettings", settings);
const saveStats = () => save("dojoStats", stats);

function trackWord(word, ok) {
  const k = word.toLowerCase();
  const w = wordStats[k] || (wordStats[k] = { ok: 0, fail: 0 });
  ok ? w.ok++ : w.fail++;
  save("dojoWordStats", wordStats);
  // Repaso inteligente: la palabra fallada vuelve a salir dentro de un par de rondas
  if (!ok) session.current?.deck?.retry(k);
}
function trackSyl(syl, ok) {
  const k = syl.toUpperCase();
  const s = sylStats[k] || (sylStats[k] = { ok: 0, fail: 0 });
  ok ? s.ok++ : s.fail++;
  save("dojoSylStats", sylStats);
}
/* «Cuesta»: se ha fallado alguna vez y al menos tantas como se ha acertado */
const isHard = s => !!s && s.fail > 0 && s.fail >= s.ok;

/* Estado de la sesión */
const session = { locked: true, streak: 0, current: null, route: "menu", token: 0, rewardActive: false, parentUntil: 0 };

/* ---------------------------------------------------------
   Día a día: aciertos, fallos y tiempo de cada día (para la racha
   diaria, el calendario y la evolución) y la misión del día.
   daily.days = { "2026-11-18": { ok, fail, sec, mission: [{ route, n, got }], done } }
   --------------------------------------------------------- */
const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
let daily = { days: {}, bestStreak: 0, ...load("dojoDaily", {}) };
const saveDaily = () => save("dojoDaily", daily);

function dayRec() {
  const k = dayKey();
  if (!daily.days[k]) {
    daily.days[k] = { ok: 0, fail: 0, sec: 0 };
    const keys = Object.keys(daily.days).sort();
    keys.slice(0, Math.max(0, keys.length - 200)).forEach(old => delete daily.days[old]);   // unos 6 meses
  }
  return daily.days[k];
}

/** Días seguidos jugando (hoy cuenta si ya ha acertado algo; si no, se mira hasta ayer). */
function dayStreak() {
  let d = new Date(), n = 0;
  if (!(daily.days[dayKey(d)]?.ok > 0)) d = addDays(d, -1);
  while (daily.days[dayKey(d)]?.ok > 0) { n++; d = addDays(d, -1); }
  return n;
}

/** Tres tareas para hoy: sílabas, un juego de palabras y uno de números. */
function todayMission() {
  const d = dayRec();
  if (!d.mission) {
    const any = group => pick(GAME_INFO.filter(g => g.group === group && !["silabas", "leer", "trazar"].includes(g.route))).route;
    d.mission = [{ route: "silabas", n: 5, got: 0 }, { route: any("leer"), n: 4, got: 0 }, { route: any("num"), n: 4, got: 0 }];
    saveDaily();
  }
  return d.mission.filter(t => gameInfo(t.route));
}

const gameStat = route => (stats.byGame[route] || (stats.byGame[route] = { ok: 0, fail: 0, sec: 0 }));

/** Apunta un acierto o un fallo del juego actual. Devuelve true si con él se cumple la misión de hoy. */
function noteResult(ok) {
  const d = dayRec();
  ok ? d.ok++ : d.fail++;
  if (gameInfo(session.route)) gameStat(session.route)[ok ? "ok" : "fail"]++;
  adaptLevel(ok);
  let missionDone = false;
  if (ok) {
    daily.bestStreak = Math.max(daily.bestStreak || 0, dayStreak());
    const tasks = todayMission();
    const t = tasks.find(t => t.route === session.route && t.got < t.n);
    if (t) {
      t.got++;
      if (!d.done && tasks.every(t => t.got >= t.n)) { d.done = true; missionDone = true; }
    }
  }
  saveDaily();
  return missionDone;
}

/* Tiempo jugado: cuenta mientras hay un juego abierto y el niño ha tocado algo hace poco */
let lastInput = Date.now();
["pointerdown", "keydown"].forEach(ev => document.addEventListener(ev, () => (lastInput = Date.now()), true));
setInterval(() => {
  if (!session.current || document.hidden || Date.now() - lastInput > 60000) return;
  dayRec().sec += 5;
  gameStat(session.route).sec += 5;
  saveDaily();
  saveStats();
}, 5000);

/* ---------------------------------------------------------
   Dificultad automática: tras 8 aciertos seguidos sube un escalón
   y si se acumulan fallos baja. Cada tipo de juego tiene el suyo.
   --------------------------------------------------------- */
const LEVEL_LADDERS = {
  word: ["wordLevel", ["1", "2", "3"]],
  num: ["numMax", [5, 10, 20]],
  syl: ["count", [2, 3, 4, 5]],
};
const adaptState = {};
function adaptLevel(ok) {
  const g = gameInfo(session.route);
  if (!settings.autoLevel || !g || ["trazar", "formas"].includes(g.route)) return;
  const dom = g.route === "silabas" ? "syl" : g.group === "num" ? "num" : "word";
  const st = adaptState[dom] || (adaptState[dom] = { up: 0, down: 0 });
  if (ok) { st.up++; st.down = Math.max(0, st.down - 1); } else { st.down++; st.up = 0; }
  const dir = st.up >= 8 ? 1 : st.down >= 4 ? -1 : 0;
  if (!dir) return;
  st.up = st.down = 0;
  const [key, steps] = LEVEL_LADDERS[dom];
  const i = steps.indexOf(settings[key]) + dir;
  if (!(steps.indexOf(settings[key]) >= 0 && i >= 0 && i < steps.length)) return;   // «Todas» o ya en el tope
  settings[key] = steps[i];
  saveSettings();
  if (typeof onAutoLevel === "function") onAutoLevel(key, dir);
}

/* Aviso breve arriba de la pantalla */
function toast(text) {
  const t = document.createElement("div");
  t.className = "toast";
  t.setAttribute("role", "status");
  t.textContent = text;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3600);
}

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

/* Voces en español instaladas en el dispositivo: primero las de España (es-ES) */
let esVoice = null;
function spanishVoices() {
  if (!("speechSynthesis" in window)) return [];
  const isSpain = v => /^es[-_]ES/i.test(v.lang);
  return speechSynthesis.getVoices()
    .filter(v => /^es([-_]|$)/i.test(v.lang || ""))
    .sort((a, b) => isSpain(b) - isSpain(a));
}
function pickVoice() {
  const voices = spanishVoices();
  esVoice = voices.find(v => v.voiceURI === settings.voice) || voices[0] || null;
  if (typeof renderVoices === "function") renderVoices();
}

/* Una sílaba suelta («to», «me», «do»…) hay voces que la leen en inglés o como
   abreviatura. Con tilde («tó») la leen siempre como sílaba española. */
/* También vale para las trabadas («pla»), inversas («al») y mixtas («pan»): onset + vocal + coda */
const LONE_SYLLABLE = /^(qu|gu(?=[ei])|ch|ll|[bcdfgkpt][lr]|[bcdfghjklmnñpqrstvwxyz])?([aeiou])([lnsr])?$/;
const ACCENTED = { a: "á", e: "é", i: "í", o: "ó", u: "ú" };
function sylSay(s) {
  const t = String(s).toLowerCase().trim();
  const m = LONE_SYLLABLE.exec(t);
  return m && (m[1] || m[3]) ? (m[1] || "") + ACCENTED[m[2]] + (m[3] || "") : t;
}
if ("speechSynthesis" in window) {
  pickVoice();
  speechSynthesis.addEventListener?.("voiceschanged", pickVoice);
}

function speak(text, { rate } = {}) {
  if (!("speechSynthesis" in window) || !text) return Promise.resolve();
  speechSynthesis.cancel();
  return new Promise(resolve => {
    const u = new SpeechSynthesisUtterance(sylSay(text));
    u.lang = "es-ES";
    if (esVoice) u.voice = esVoice;
    u.rate = rate || settings.rate;
    u.pitch = settings.pitch || 1.1;
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
const SHOP_ITEMS = [
  ["kasa", "hat", "👒", "Sombrero de paja", 15], ["party", "hat", "🥳", "Gorro de fiesta", 20],
  ["cat", "hat", "😺", "Orejas de gato", 25], ["wizard", "hat", "🧙", "Gorro de mago", 40], ["crown", "hat", "👑", "Corona", 60],
  ["round", "glasses", "👓", "Gafas redondas", 15], ["shades", "glasses", "🕶️", "Gafas de sol", 20],
  ["turtle", "pet", "🐢", "Tortuga", 20], ["kitten", "pet", "🐈", "Gatito", 20], ["owl", "pet", "🦉", "Búho", 25],
  ["panda", "pet", "🐼", "Panda", 30], ["fox", "pet", "🦊", "Zorro", 30], ["dragon", "pet", "🐉", "Dragoncito", 50],
].map(([id, type, ico, name, price]) => ({ id, type, ico, name, price }));
const SHOP_TYPES = { hat: "🎩 Sombreros", glasses: "👓 Gafas", pet: "🐾 Mascotas" };

const HAT_SVG = {
  kasa: `<path d="M22 44 L100 -10 L178 44 Q100 60 22 44Z" fill="#e6c36a" stroke="#a87a2a" stroke-width="3" stroke-linejoin="round"/>
    <path d="M100 -10 L70 50 M100 -10 L130 50 M100 -10 L100 52" stroke="#a87a2a" stroke-width="2" opacity=".5"/>`,
  party: `<path d="M70 36 L100 -36 L130 36Z" fill="#ec4f9c" stroke="#a3216a" stroke-width="3" stroke-linejoin="round"/>
    <path d="M81 12 L119 12 M89 -8 L111 -8" stroke="#ffd23f" stroke-width="6"/><circle cx="100" cy="-38" r="9" fill="#ffd23f"/>`,
  cat: `<path class="mask" d="M52 44 L48 -4 L88 24Z"/><path class="mask" d="M148 44 L152 -4 L112 24Z"/>
    <path d="M58 30 L56 8 L76 22Z" fill="#ffb3c7"/><path d="M142 30 L144 8 L124 22Z" fill="#ffb3c7"/>`,
  wizard: `<path d="M58 34 L104 -52 L142 34Z" fill="#5b3fa0" stroke="#3a2470" stroke-width="3" stroke-linejoin="round"/>
    <ellipse cx="100" cy="36" rx="62" ry="10" fill="#3a2470"/>
    <path d="M97 -12 l3 7 7 1 -5 5 1 7 -6 -4 -6 4 1 -7 -5 -5 7 -1Z" fill="#ffd23f"/>`,
  crown: `<path d="M60 36 L56 -6 L80 14 L100 -14 L120 14 L144 -6 L140 36Z" fill="#ffd23f" stroke="#a87a00" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="100" cy="20" r="6" fill="#e53935"/><circle cx="76" cy="24" r="4" fill="#1e88e5"/><circle cx="124" cy="24" r="4" fill="#43a047"/>`,
};
const GLASSES_SVG = {
  shades: `<rect x="66" y="69" width="30" height="20" rx="8" fill="#15151c"/><rect x="104" y="69" width="30" height="20" rx="8" fill="#15151c"/>
    <path d="M96 76 H104 M66 76 L56 72 M134 76 L144 72" stroke="#15151c" stroke-width="4" stroke-linecap="round"/>`,
  round: `<circle cx="82" cy="79" r="13" fill="rgba(255,255,255,.35)" stroke="#5c2e18" stroke-width="3.5"/>
    <circle cx="118" cy="79" r="13" fill="rgba(255,255,255,.35)" stroke="#5c2e18" stroke-width="3.5"/>
    <path d="M95 79 H105" stroke="#5c2e18" stroke-width="3.5"/>`,
};

/** El ninja con lo que lleve puesto (`outfit` permite probar otro disfraz en la tienda). */
function mascotSVG(outfit = settings.outfit) {
  const pet = SHOP_ITEMS.find(i => i.type === "pet" && i.id === outfit.pet);
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
      ${GLASSES_SVG[outfit.glasses] || ""}
      ${HAT_SVG[outfit.hat] || ""}
    </g>
    ${pet ? `<text class="pet" x="-38" y="222" font-size="62">${pet.ico}</text>` : ""}
  </svg>`;
}

/** Vuelve a dibujar todos los ninjas (al cambiar de sombrero, gafas o mascota). */
function renderMascots() {
  document.querySelectorAll(".mascotHolder:not(.preview)").forEach(h => (h.innerHTML = mascotSVG()));
}

function applyFont() {
  document.body.dataset.font = settings.font || "normal";
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
  $("beltBadge").innerHTML = `<i style="background:${beltBg(belt)}"></i><span>${belt.name}</span>`;
  $("startBelt").textContent = `Cinturón ${belt.name} · ⭐ ${coins()}`;
  const owned = PRIZES.filter(p => unlocked[p]).length;
  $("menuPrizes").textContent = `${owned} de ${PRIZE_COUNT}`;
}

/* ---------------------------------------------------------
   Medallas: logros que se ganan jugando (además de los premios)
   --------------------------------------------------------- */
const MEDALS = [
  ...[10, 50, 100, 250, 500, 1000].map(n => ({ id: "stars" + n, ico: "⭐", name: `${n} estrellas`, ok: () => stats.stars >= n })),
  ...[5, 10, 20].map(n => ({ id: "streak" + n, ico: "🔥", name: `Racha de ${n}`, ok: () => stats.bestStreak >= n })),
  ...[
    ["syllablesOk", "🚪", "Maestro de sílabas"], ["wordsRead", "🎤", "Gran lector"], ["wordsBuilt", "🧩", "Constructor"],
    ["picturesOk", "🖼️", "Ojo de águila"], ["missingOk", "🔍", "Detective"], ["pairsOk", "🃏", "Memoria ninja"],
    ["yesNoOk", "👍", "Juez sabio"], ["spellOk", "🔤", "Rey de las letras"], ["countOk", "🍎", "Contador"],
    ["hearOk", "👂", "Oído fino"], ["matchOk", "🎯", "Puntería"], ["seqOk", "🐛", "Maestro de series"],
    ["bigOk", "🐘", "Gigante"], ["orderOk", "🪜", "Ordenado"], ["sumsOk", "➕", "Sumador"], ["subsOk", "➖", "Restador"],
    ["traceOk", "✍️", "Buena letra"], ["sentOk", "📜", "Lector de frases"], ["doubleOk", "✌️", "Doble ninja"],
    ["shapeOk", "🔷", "Artista"], ["clockOk", "🕒", "Relojero"], ["coinOk", "🪙", "Tesorero"],
  ].map(([key, ico, name]) => ({ id: key, ico, name, hint: "20 aciertos", ok: () => stats[key] >= 20 })),
  ...[[10, "🎁", "Coleccionista"], [30, "🎒", "Gran colección"], [PRIZE_COUNT, "🏅", "¡Álbum completo!"]]
    .map(([n, ico, name]) => ({ id: "prizes" + n, ico, name, hint: `${n} premios distintos`, ok: () => PRIZES.filter(p => unlocked[p]).length >= n })),
  ...[3, 7, 30].map(n => ({ id: "days" + n, ico: "📅", name: `${n} días seguidos`, hint: "Juega todos los días", ok: () => (daily.bestStreak || 0) >= n })),
  ...[1, 5, 20].map(n => ({ id: "missions" + n, ico: "🎯", name: n === 1 ? "Primera misión" : `${n} misiones`, hint: "Cumple la misión del día", ok: () => (stats.missions || 0) >= n })),
];
let medals = load("dojoMedals", []);

/** Guarda las medallas recién conseguidas y las devuelve. */
function checkMedals() {
  const fresh = MEDALS.filter(m => !medals.includes(m.id) && m.ok());
  if (fresh.length) {
    medals = [...medals, ...fresh.map(m => m.id)];
    save("dojoMedals", medals);
  }
  return fresh;
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
  const missionDone = noteResult(true);
  if (missionDone) { stats.stars += MISSION_BONUS; stats.missions = (stats.missions || 0) + 1; }
  saveStats();
  renderHud();
  renderProgress(true);

  if (session.streak >= 3 && session.streak % 3 === 0) {
    say(`¡Racha de ${session.streak}! 🔥`, "good");
    restartAnim($("streakBox"), "hot");
  } else {
    say(pick(PRAISE), "good");
  }
  const [medal] = checkMedals();
  if (medal) {
    say(`¡Medalla nueva! ${medal.ico} ${esc(medal.name)}`, "good");
    burst(innerWidth / 2, innerHeight / 3, ["🏅", "✨", medal.ico], 14);
  }

  if (missionDone) later(() => startReward({ mission: true }), Math.min(delay, 1200));
  else if (stats.progress >= settings.goal) later(() => startReward(), Math.min(delay, 1200));
  else later(() => session.current?.next(), delay);
}
const MISSION_BONUS = 10;   // estrellas de regalo al cumplir la misión del día

/** Fallo que no pasa por scoreWrong (juegos con su propio mensaje). */
function noteFail() {
  noteResult(false);
  session.streak = 0;
  renderHud();
}

/** Fallo: rompe la racha y anima a seguir. */
function scoreWrong(message) {
  play("sndWrong", .7);
  mascotReact("sad");
  say(message || pick(ENCOURAGE), "bad");
  noteFail();
}

/* ---------------------------------------------------------
   Premios
   --------------------------------------------------------- */
function choosePrize() {
  const missing = PRIZES.filter(p => !unlocked[p]);
  // Favorece los premios que aún no tiene para completar la colección
  return missing.length && Math.random() < .65 ? pick(missing) : pick(PRIZES);
}

function startReward({ mission = false } = {}) {
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
  $("rewardPrize").innerHTML = prizeHTML(prize);
  $("newBadge").hidden = !isNew;
  $("rewardText").textContent = "¡Toca el regalo!";
  play("sndPrize");

  let opened = false, closed = false, autoClose;
  const open = () => {
    if (opened) return;
    opened = true;
    ov.classList.add("opened");
    confetti();
    const name = prizeName(prize);
    let text = (isNew ? "¡Premio nuevo!" : "¡Otro premio!") + (name ? ` ${name}` : "");
    if (beltAfter > beltBefore) text = `¡Ahora eres cinturón ${BELTS[beltAfter].name}! 🥋`;
    else if (mission) text = `¡Misión del día cumplida! +${MISSION_BONUS} ⭐`;
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
      // El premio de la misión no gasta la barra: si además estaba llena, toca otro regalo
      if (mission && stats.progress >= settings.goal && session.current) return startReward();
      if (!mission) stats.progress = 0;
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

/* Los globos van dentro de una capa fija a pantalla completa: recorta lo que se
   sale (así la página no se desplaza), tapa los botones de detrás y no deja
   arrastrar ni hacer zoom mientras se explotan. */
function launchBalloons() {
  return new Promise(resolve => {
    const total = reducedMotion ? 5 : 14;
    let remaining = total;
    play("sndBalloons", .5);
    say("¡Explota los globos! 🎈", "good");
    document.activeElement?.blur?.();

    const layer = document.createElement("div");
    layer.id = "balloonLayer";
    const block = e => e.preventDefault();
    ["touchmove", "wheel", "contextmenu", "dblclick"].forEach(ev => layer.addEventListener(ev, block, { passive: false }));
    const blockKeys = e => { if (e.key !== "Tab") { e.preventDefault(); e.stopPropagation(); } };
    document.addEventListener("keydown", blockKeys, true);
    $("game").inert = true;

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(safety);
      document.removeEventListener("keydown", blockKeys, true);
      $("game").inert = false;
      layer.remove();
      scrollTo(0, 0);
      resolve();
    };
    const done = b => {
      if (b.dataset.gone) return;
      b.dataset.gone = "1";
      b.remove();
      if (--remaining === 0) finish();
    };
    const safety = setTimeout(finish, 11000);

    for (let i = 0; i < total; i++) {
      const size = rand(70, 130);
      const b = document.createElement("div");
      b.className = "balloon";
      b.textContent = "🎈";
      b.style.left = `calc(${rand(0, 100)} * (100% - ${size}px) / 100)`;   // siempre entero dentro de la pantalla
      b.style.fontSize = size + "px";
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
      layer.appendChild(b);
    }
    document.body.appendChild(layer);
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
    BELTS.map((b, i) => `<span class="beltStep ${i <= bi ? "done" : ""} ${i === bi ? "current" : ""}" style="background:${beltBg(b)}" title="Cinturón ${b.name} (${b.min} premios)"></span>`).join("") +
    `<span class="beltNext">Cinturón ${BELTS[bi].name}. ${next ? `Faltan ${next.min - total} premios para el ${next.name}` : "¡Eres un gran maestro ninja!"}</span>`;

  $("albumGrid").innerHTML = PRIZES.map(p => {
    const n = unlocked[p] || 0;
    return `<div class="albumItem ${n ? "" : "locked"}">
      ${prizeHTML(p)}
      ${n > 1 ? `<span class="count">x${n}</span>` : ""}
    </div>`;
  }).join("");

  checkMedals();
  const got = MEDALS.filter(m => medals.includes(m.id)).length;
  $("medalCount").textContent = `🏅 Medallas: ${got} de ${MEDALS.length}`;
  $("medalGrid").innerHTML = MEDALS.map(m =>
    `<span class="medal ${medals.includes(m.id) ? "" : "locked"}" title="${esc(m.hint || m.name)}"><i>${m.ico}</i>${esc(m.name)}</span>`).join("");
}
