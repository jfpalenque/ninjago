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
    ["ajo", "🧄"], ["ojo", "👁️"], ["ola", "🌊"], ["toro", "🐂"], ["pavo", "🦃"], ["loro", "🦜"],
    ["rata", "🐀"], ["mapa", "🗺️"], ["rayo", "⚡"], ["hoja", "🍁"], ["pila", "🔋"], ["vela", "🕯️"],
    ["copa", "🏆"], ["silla", "🪑"], ["llave", "🔑"], ["coche", "🚗"], ["pollo", "🐤"], ["queso", "🧀"],
    ["dedo", "☝️"], ["pino", "🌲"], ["cubo", "🪣"], ["gorra", "🧢"], ["zorro", "🦊"], ["búho", "🦉"],
  ],
  2: [
    ["pelota", "⚽"], ["zapato", "👞"], ["tomate", "🍅"], ["paloma", "🕊️"], ["conejo", "🐰"], ["camello", "🐫"],
    ["caballo", "🐴"], ["ballena", "🐋"], ["gallina", "🐔"], ["pepino", "🥒"], ["patata", "🥔"], ["banana", "🍌"],
    ["cereza", "🍒"], ["galleta", "🍪"], ["corona", "👑"], ["cohete", "🚀"], ["camisa", "👔"], ["maleta", "🧳"],
    ["regalo", "🎁"], ["muñeca", "🪆"], ["botella", "🍾"], ["cuchara", "🥄"], ["tortuga", "🐢"], ["jirafa", "🦒"],
    ["abeja", "🐝"], ["ratón", "🐭"], ["limón", "🍋"], ["melón", "🍈"], ["león", "🦁"], ["avión", "✈️"],
    ["pirata", "🏴‍☠️"], ["helado", "🍦"], ["sirena", "🧜‍♀️"], ["payaso", "🤡"], ["gusano", "🐛"], ["caracol", "🐌"],
    ["oveja", "🐑"], ["cebolla", "🧅"], ["cometa", "🪁"], ["mochila", "🎒"], ["anillo", "💍"], ["oreja", "👂"],
    ["araña", "🕷️"], ["koala", "🐨"], ["gorila", "🦍"], ["águila", "🦅"], ["piano", "🎹"], ["zapatilla", "👟"],
    ["tijeras", "✂️"], ["patinete", "🛴"], ["lechuga", "🥬"], ["aguacate", "🥑"], ["chocolate", "🍫"], ["bocadillo", "🥪"],
    ["palomitas", "🍿"], ["tenedor", "🍴"], ["semáforo", "🚦"], ["bañera", "🛁"], ["mariquita", "🐞"], ["hipopótamo", "🦛"],
  ],
  3: [
    ["sol", "☀️"], ["flor", "🌼"], ["tren", "🚂"], ["pez", "🐟"], ["árbol", "🌳"], ["fresa", "🍓"],
    ["cebra", "🦓"], ["tigre", "🐯"], ["globo", "🎈"], ["libro", "📖"], ["dragón", "🐉"], ["pulpo", "🐙"],
    ["cerdo", "🐷"], ["perro", "🐶"], ["delfín", "🐬"], ["tiburón", "🦈"], ["elefante", "🐘"], ["mariposa", "🦋"],
    ["dinosaurio", "🦕"], ["estrella", "⭐"], ["bicicleta", "🚲"], ["pingüino", "🐧"], ["cocodrilo", "🐊"], ["castillo", "🏰"],
    ["sandía", "🍉"], ["guitarra", "🎸"], ["trompeta", "🎺"], ["princesa", "👸"], ["ninja", "🥷"], ["espada", "🗡️"],
    ["escudo", "🛡️"], ["planeta", "🪐"], ["cangrejo", "🦀"], ["murciélago", "🦇"], ["arcoíris", "🌈"],
    ["fantasma", "👻"], ["robot", "🤖"], ["camión", "🚚"],
    ["pan", "🍞"], ["miel", "🍯"], ["maíz", "🌽"], ["rey", "🤴"], ["zanahoria", "🥕"], ["manzana", "🍎"],
    ["naranja", "🍊"], ["barco", "⛵"], ["tractor", "🚜"], ["autobús", "🚌"], ["tambor", "🥁"], ["violín", "🎻"],
    ["campana", "🔔"], ["lápiz", "✏️"], ["paraguas", "☂️"], ["sombrero", "🎩"], ["guante", "🧤"], ["calcetín", "🧦"],
    ["vestido", "👗"], ["reloj", "⌚"], ["teléfono", "📱"], ["puerta", "🚪"], ["escoba", "🧹"], ["martillo", "🔨"],
    ["hueso", "🦴"], ["diente", "🦷"], ["corazón", "❤️"], ["fuego", "🔥"], ["nieve", "❄️"], ["volcán", "🌋"],
    ["montaña", "⛰️"], ["isla", "🏝️"], ["hormiga", "🐜"], ["panda", "🐼"], ["ardilla", "🐿️"], ["canguro", "🦘"],
    ["cisne", "🦢"], ["unicornio", "🦄"], ["tarta", "🎂"], ["huevo", "🥚"], ["cabra", "🐐"], ["bombero", "🧑‍🚒"],
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

/* Baraja sin repeticiones hasta agotar todas las palabras.
   Con el repaso inteligente, las palabras que cuestan salen dos veces en cada
   vuelta y la que se acaba de fallar vuelve a salir un par de rondas después. */
function makeDeck() {
  let deck = [], last = "";
  return {
    next() {
      if (!deck.length) {
        deck = shuffle(wordPool());
        if (settings.smartReview && deck.length > 3) {
          const hard = deck.filter(w => isHard(wordStats[w.word])).slice(0, Math.ceil(deck.length / 4));
          hard.forEach(w => deck.splice(Math.floor(Math.random() * (deck.length + 1)), 0, w));
          // que la misma no salga dos veces seguidas
          for (let i = 1; i < deck.length; i++) {
            if (deck[i].word === deck[i - 1].word && i + 1 < deck.length) [deck[i], deck[i + 1]] = [deck[i + 1], deck[i]];
          }
        }
        if (deck.length > 1 && deck[deck.length - 1].word === last) deck.unshift(deck.pop());
      }
      const w = deck.pop();
      last = w.word;
      return w;
    },
    retry(text) {
      if (!settings.smartReview || deck.slice(-4).some(w => w.word === text)) return;
      const w = wordPool().find(x => x.word === text);
      if (w) deck.splice(Math.max(0, deck.length - 2), 0, w);
    },
    reset() { deck = []; },
  };
}

/* ---------------------------------------------------------
   Frases cortas: [frase, dibujos, nivel]
   --------------------------------------------------------- */
const SENTENCES = [
  ["El oso come miel", "🐻🍯", 1], ["La vaca da leche", "🐮🥛", 1], ["El gato toma sopa", "🐱🍲", 1],
  ["El mono come una banana", "🐒🍌", 1], ["El loro tiene una pera", "🦜🍐", 1], ["El oso va en moto", "🐻🏍️", 1],
  ["El lobo mira la luna", "🐺🌙", 1], ["El bebé tiene un dado", "👶🎲", 1], ["El pato come uvas", "🦆🍇", 1],
  ["El gato sube a la cama", "🐱🛏️", 1], ["La rana tiene una bota", "🐸👢", 1], ["El mono tiene una gorra", "🐒🧢", 1],
  ["La mamá toma un café", "👩☕", 1], ["El papá lee un libro", "👨📖", 2], ["El zorro come queso", "🦊🧀", 1],
  ["El ratón come queso", "🐭🧀", 2], ["El perro tiene un hueso", "🐶🦴", 2], ["El conejo come zanahoria", "🐰🥕", 2],
  ["La abeja va a la flor", "🐝🌼", 2], ["El perro va en coche", "🐶🚗", 2], ["El niño come una galleta", "👦🍪", 2],
  ["La niña tiene un globo", "👧🎈", 2], ["La gallina pone un huevo", "🐔🥚", 2], ["El caballo come una manzana", "🐴🍎", 2],
  ["La tortuga come tomate", "🐢🍅", 2], ["El león lleva una corona", "🦁👑", 2], ["El papá va en tren", "👨🚂", 2],
  ["La jirafa come una hoja", "🦒🍁", 2], ["El cerdo come maíz", "🐷🌽", 2], ["El niño juega con la pelota", "👦⚽", 2],
  ["El ninja tiene una espada", "🥷🗡️", 3], ["El robot toca la guitarra", "🤖🎸", 3], ["La princesa vive en un castillo", "👸🏰", 3],
  ["El pingüino come un pez", "🐧🐟", 3], ["El dragón echa fuego", "🐉🔥", 3], ["El elefante lleva un sombrero", "🐘🎩", 3],
  ["El pulpo toca el tambor", "🐙🥁", 3], ["El tigre va en bicicleta", "🐯🚲", 3], ["El fantasma tiene un globo", "👻🎈", 3],
  ["El cocodrilo come una sandía", "🐊🍉", 3], ["La mariposa va a la flor", "🦋🌼", 3], ["El dinosaurio mira la estrella", "🦕⭐", 3],
].map(([text, pic, lvl]) => ({ text, pic, lvl }));

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
