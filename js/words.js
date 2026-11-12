/* =========================================================
   PALABRAS: lista, separación en sílabas y comparación de lo leído
   ========================================================= */
"use strict";

/* Nivel 1: dos sílabas sencillas · Nivel 2: tres sílabas · Nivel 3: sílabas trabadas y largas */
const WORD_LEVELS = {
  1: [
    ["oso", "🐻"], ["uva", "🍇"], ["gato", "🐱"], ["pato", "🦆"], ["foca", "🦭"], ["vaca", "🐮"],
    ["mono", "🐒"], ["lobo", "🐺"], ["rana", "🐸"], ["pera", "🍐"], ["piña", "🍍"], ["luna", "🌙"],
    ["casa", "🏠"], ["sopa", "🍲"], ["taza", "☕"], ["dado", "🎲"], ["mano", "✋"], ["nube", "☁️"],
    ["cama", "🛏️"], ["moto", "🏍️"], ["bota", "👢"], ["lupa", "🔍"], ["kiwi", "🥝"], ["coco", "🥥"],
    ["foto", "📷"], ["rosa", "🌹"], ["seta", "🍄"], ["bebé", "👶"], ["sofá", "🛋️"], ["hada", "🧚"],
    ["ropa", "👕"], ["boca", "👄"], ["papá", "👨"], ["mamá", "👩"], ["vaso", "🥛"], ["pie", "🦶"],
  ],
  2: [
    ["pelota", "⚽"], ["zapato", "👞"], ["tomate", "🍅"], ["paloma", "🕊️"], ["conejo", "🐰"], ["camello", "🐫"],
    ["caballo", "🐴"], ["ballena", "🐋"], ["gallina", "🐔"], ["pepino", "🥒"], ["patata", "🥔"], ["banana", "🍌"],
    ["cereza", "🍒"], ["galleta", "🍪"], ["corona", "👑"], ["cohete", "🚀"], ["camisa", "👔"], ["maleta", "🧳"],
    ["regalo", "🎁"], ["muñeca", "🪆"], ["botella", "🍾"], ["cuchara", "🥄"], ["tortuga", "🐢"], ["jirafa", "🦒"],
    ["abeja", "🐝"], ["ratón", "🐭"], ["limón", "🍋"], ["melón", "🍈"], ["león", "🦁"], ["avión", "✈️"],
    ["pirata", "🏴‍☠️"], ["helado", "🍦"], ["sirena", "🧜‍♀️"], ["payaso", "🤡"], ["gusano", "🐛"], ["caracol", "🐌"],
  ],
  3: [
    ["sol", "☀️"], ["flor", "🌼"], ["tren", "🚂"], ["pez", "🐟"], ["árbol", "🌳"], ["fresa", "🍓"],
    ["cebra", "🦓"], ["tigre", "🐯"], ["globo", "🎈"], ["libro", "📖"], ["dragón", "🐉"], ["pulpo", "🐙"],
    ["cerdo", "🐷"], ["perro", "🐶"], ["delfín", "🐬"], ["tiburón", "🦈"], ["elefante", "🐘"], ["mariposa", "🦋"],
    ["dinosaurio", "🦕"], ["estrella", "⭐"], ["bicicleta", "🚲"], ["pingüino", "🐧"], ["cocodrilo", "🐊"], ["castillo", "🏰"],
    ["sandía", "🍉"], ["guitarra", "🎸"], ["trompeta", "🎺"], ["princesa", "👸"], ["ninja", "🥷"], ["espada", "🗡️"],
    ["escudo", "🛡️"], ["planeta", "🪐"], ["cangrejo", "🦀"], ["murciélago", "🦇"], ["búho", "🦉"], ["arcoíris", "🌈"],
    ["fantasma", "👻"], ["robot", "🤖"], ["camión", "🚚"],
  ],
};

/* ---------------------------------------------------------
   Separación en sílabas (reglas del español)
   --------------------------------------------------------- */
const VOWEL_CHARS = "aeiouáéíóúü";
const STRONG = "aeoáéóíú";               // í/ú con tilde rompen el diptongo
const INSEPARABLE = /^(p|b|f|g|c|k|t|d)(r|l)$/;

function syllabify(word) {
  const w = word.toLowerCase().trim();
  if (w.includes("-")) return w.split("-").filter(Boolean);

  // 1) Trocear en letras/dígrafos marcando vocales
  const toks = [];
  for (let i = 0; i < w.length;) {
    const two = w.slice(i, i + 2), next2 = w[i + 2] || "";
    if (two === "ch" || two === "ll" || two === "rr" || two === "qu" || (two === "gu" && "eiéí".includes(next2))) {
      toks.push({ t: two, v: false }); i += 2; continue;
    }
    const c = w[i];
    const isV = VOWEL_CHARS.includes(c) || (c === "y" && !VOWEL_CHARS.includes(w[i + 1] || "") && i > 0);
    toks.push({ t: c, v: isV });
    i++;
  }

  // 2) Agrupar en: consonantes | núcleo vocálico | consonantes | núcleo ...
  const nuclei = [];       // cada núcleo: texto
  const clusters = [[]];   // consonantes antes de cada núcleo (y al final)
  for (let i = 0; i < toks.length; i++) {
    const tk = toks[i];
    if (!tk.v) { clusters[clusters.length - 1].push(tk.t); continue; }
    const prev = toks[i - 1];
    const lastNucleus = nuclei[nuclei.length - 1];
    const joined = prev && prev.v && clusters[clusters.length - 1].length === 0;
    if (joined && !(STRONG.includes(lastNucleus.slice(-1)) && STRONG.includes(tk.t))) {
      nuclei[nuclei.length - 1] += tk.t;          // diptongo
    } else {
      nuclei.push(tk.t);
      clusters.push([]);
    }
  }
  if (!nuclei.length) return [w];

  // 3) Repartir consonantes entre núcleos
  const syl = nuclei.map(() => ({ pre: "", nuc: "", post: "" }));
  nuclei.forEach((n, i) => (syl[i].nuc = n));
  syl[0].pre = clusters[0].join("");
  for (let k = 1; k < nuclei.length; k++) {
    const c = clusters[k];
    let split;
    if (c.length <= 1) split = 0;
    else if (c.length === 2) split = INSEPARABLE.test(c.join("")) ? 0 : 1;
    else split = INSEPARABLE.test(c.slice(-2).join("")) ? c.length - 2 : c.length - 1;
    syl[k - 1].post = c.slice(0, split).join("");
    syl[k].pre = c.slice(split).join("");
  }
  syl[syl.length - 1].post += clusters[nuclei.length].join("");
  return syl.map(s => s.pre + s.nuc + s.post);
}

/* ---------------------------------------------------------
   Lista de palabras activa
   --------------------------------------------------------- */
function makeWord(text, emoji = "", custom = false) {
  const syl = syllabify(text);
  return { word: syl.join(""), emoji: emoji || "📝", syl, custom };
}

function wordPool() {
  const custom = (settings.customWords || []).map(c => makeWord(c.w, c.e, true));
  if (settings.onlyCustom && custom.length) return custom;
  const lvl = settings.wordLevel;
  const base = lvl === "all" ? [...WORD_LEVELS[1], ...WORD_LEVELS[2], ...WORD_LEVELS[3]] : WORD_LEVELS[lvl] || WORD_LEVELS[1];
  return [...base.map(([w, e]) => makeWord(w, e)), ...custom];
}

/* Baraja sin repeticiones hasta agotar todas las palabras */
function makeDeck() {
  let deck = [], last = "";
  return {
    next() {
      if (!deck.length) {
        deck = shuffle(wordPool());
        if (deck.length > 1 && deck[deck.length - 1].word === last) deck.unshift(deck.pop());
      }
      const w = deck.pop();
      last = w.word;
      return w;
    },
    reset() { deck = []; },
  };
}

/* Dibujo de la palabra. Con «Mostrar los dibujos» desactivado se ve una «?»
   y el dibujo se descubre al acertar: así el niño lee sin adivinar por el dibujo. */
function showWordPic(el, w) {
  el.classList.toggle("mystery", !settings.showPics);
  el.textContent = settings.showPics ? w.emoji : "?";
}
function revealWordPic(el, w) {
  if (!el.classList.contains("mystery")) return;
  el.classList.remove("mystery");
  el.textContent = w.emoji;
  restartAnim(el, "reveal");
}

/* Muestra una palabra separada en sílabas de colores (se pueden tocar para oírlas) */
const SYL_COLORS = ["#e53935", "#1e88e5", "#43a047", "#8e24aa", "#ff8f00", "#00897b"];
function wordHTML(w) {
  if (!settings.showSyllables) return `<span class="syl whole">${esc(show(w.word))}</span>`;
  return w.syl.map((s, i) => `<button class="syl" style="--c:${SYL_COLORS[i % SYL_COLORS.length]}" data-syl="${esc(s)}">${esc(show(s))}</button>`).join("");
}

/* ---------------------------------------------------------
   Comparar lo que ha oído el micrófono con la palabra
   --------------------------------------------------------- */
const norm = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim();

function levenshtein(a, b) {
  const dp = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
}

/** Devuelve { ok, heard } comparando todas las alternativas del reconocedor. */
function matchSpoken(target, alternatives) {
  const t = norm(target).replace(/ /g, "");
  const maxDist = settings.micLevel === "strict" ? 0
    : settings.micLevel === "easy" ? Math.max(1, Math.floor(t.length / 3))
    : t.length >= 6 ? 1 : 0;

  let best = { dist: Infinity, heard: alternatives[0] || "" };
  for (const alt of alternatives) {
    const tokens = norm(alt).split(" ").filter(Boolean);
    // Palabra suelta, palabras seguidas o leída por sílabas ("ga to")
    const candidates = new Set([tokens.join("")]);
    for (let i = 0; i < tokens.length; i++) {
      let acc = "";
      for (let j = i; j < Math.min(tokens.length, i + 4); j++) {
        acc += tokens[j];
        candidates.add(acc);
      }
    }
    for (const c of candidates) {
      // el reconocedor a veces añade una "s" final (gato → gatos)
      const d = settings.micLevel !== "strict" && c === t + "s" ? 0 : levenshtein(c, t);
      if (d < best.dist) best = { dist: d, heard: alt };
    }
  }
  return { ok: best.dist <= maxDist, heard: best.heard };
}
