/* =========================================================
   TEMAS: Ninja (el de siempre), Criaturas y Dinosaurios.
   Cada jugador elige el suyo. El tema cambia la mascota, el
   fondo, el álbum de pegatinas, las puertas, el mapa y los
   textos; los juegos y el progreso son los mismos.

   Este archivo se carga antes que core.js: aquí solo hay datos
   y funciones que se llaman más tarde.
   ========================================================= */
"use strict";

/* Cara común de criaturas y dinos. Los ojos están donde los del ninja,
   así las gafas y los sombreros de la tienda les quedan igual de bien. */
const FACE_SVG = `
  <g class="eyes">
    <ellipse cx="82" cy="79" rx="8" ry="10" fill="#2b1d4a"/><ellipse cx="118" cy="79" rx="8" ry="10" fill="#2b1d4a"/>
    <circle cx="85" cy="75" r="3.2" fill="#fff"/><circle cx="121" cy="75" r="3.2" fill="#fff"/>
  </g>
  <g class="eyesHappy" stroke="#2b1d4a" stroke-width="4.5" fill="none" stroke-linecap="round">
    <path d="M73 82 Q82 70 91 82"/><path d="M109 82 Q118 70 127 82"/>
  </g>
  <ellipse cx="64" cy="93" rx="7" ry="4" fill="#ff8a8a" opacity=".6"/><ellipse cx="136" cy="93" rx="7" ry="4" fill="#ff8a8a" opacity=".6"/>
  <path class="sweat" d="M150 52 Q144 64 150 68 Q156 64 150 52Z" fill="#7fd3ff"/>`;

const COLLAR_SVG = `<path class="beltC" d="M64 124 Q100 146 136 124 L139 136 Q100 160 61 136Z"/><circle class="beltC" cx="100" cy="150" r="7"/>`;

/** Lo que lleva puesto de la tienda (las tablas están en core.js). */
function wearSVG(outfit) {
  const pet = SHOP_ITEMS.find(i => i.type === "pet" && i.id === outfit.pet);
  return {
    hat: HAT_SVG[outfit.hat] || "",
    glasses: GLASSES_SVG[outfit.glasses] || "",
    pet: pet ? `<text class="pet" x="-38" y="222" font-size="62">${pet.ico}</text>` : "",
  };
}

/** Nivel 1: todavía es un huevo (del color de la mascota) por el que asoman los ojos. */
function eggSVG(outfit) {
  const w = wearSVG(outfit);
  return `
  <svg viewBox="0 0 200 230" role="img" aria-label="Huevo">
    <g class="ninja">
      <ellipse cx="100" cy="128" rx="66" ry="84" fill="#fff8e7" stroke="rgba(0,0,0,.18)" stroke-width="3"/>
      <g class="mask" opacity=".85">
        <circle cx="68" cy="132" r="12"/><circle cx="130" cy="126" r="9"/><circle cx="104" cy="192" r="13"/>
        <circle cx="142" cy="184" r="7"/><circle cx="64" cy="190" r="6"/><circle cx="100" cy="54" r="7"/>
      </g>
      <path d="M48 90 L60 68 L72 84 L86 64 L100 82 L114 64 L128 84 L140 68 L152 90 Q100 104 48 90Z" fill="#2b1d4a"/>
      <g class="eyes">
        <circle cx="82" cy="81" r="6" fill="#fff"/><circle cx="118" cy="81" r="6" fill="#fff"/>
        <circle cx="83" cy="82" r="2.6" fill="#2b1d4a"/><circle cx="119" cy="82" r="2.6" fill="#2b1d4a"/>
      </g>
      <g class="eyesHappy" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round">
        <path d="M75 86 Q82 76 89 86"/><path d="M111 86 Q118 76 125 86"/>
      </g>
      <path class="sweat" d="M150 52 Q144 64 150 68 Q156 64 150 52Z" fill="#7fd3ff"/>
      <path class="beltC" d="M37 152 Q100 176 163 152 L165 165 Q100 191 35 165Z"/>
      ${w.glasses}${w.hat}
    </g>
    ${w.pet}
  </svg>`;
}

/* ---------------------------------------------------------
   CRIATURAS: tres compañeras (fuego, agua y planta) que
   crecen en cuatro etapas: huevo, cría, joven y adulta.
   --------------------------------------------------------- */
const CREATURE_TYPES = {
  fuego:  { name: "Fuego",  ico: "🔥", colors: ["#ff7043", "#c63f17"] },
  agua:   { name: "Agua",   ico: "💧", colors: ["#29b6f6", "#0277bd"] },
  planta: { name: "Planta", ico: "🌿", colors: ["#66bb6a", "#2e7d32"] },
};

const LEAF = `fill="#9ccc65" stroke="#2e7d32" stroke-width="2.5" stroke-linejoin="round"`;
const CREATURE_PARTS = {
  fuego: {
    // lo de arriba de la cabeza (no se dibuja si lleva sombrero)
    crest: st => `<g transform="translate(100 36) scale(${[0, .7, 1, 1.3][st]}) translate(-100 -36)">
      <path d="M100 -8 Q120 14 111 30 Q125 22 121 38 L79 38 Q75 20 90 27 Q83 10 100 -8Z" fill="#ffb300"/>
      <path d="M100 10 Q109 23 104 36 L94 36 Q91 23 100 10Z" fill="#fff176"/></g>`,
    ears: st => (st < 2 ? "" : `<path class="dark" d="M60 42 L48 8 L80 30Z"/><path class="dark" d="M140 42 L152 8 L120 30Z"/>`),
    tail: st => `<path class="dark" d="M134 180 Q178 186 174 146 L162 150 Q164 170 132 166Z"/>
      <g transform="translate(170 148) scale(${[0, .8, 1.1, 1.5][st]}) translate(-170 -148)">
        <path d="M170 116 Q186 134 178 150 L162 150 Q156 136 170 116Z" fill="#ffb300"/>
        <path d="M170 130 Q177 140 173 150 L166 150 Q164 140 170 130Z" fill="#fff176"/></g>`,
    back: `<path class="dark" d="M64 150 Q4 96 10 176 Q24 162 34 176 Q46 162 62 178Z"/><path class="dark" d="M136 150 Q196 96 190 176 Q176 162 166 176 Q154 162 138 178Z"/>`,
  },
  agua: {
    crest: st => (st < 3
      ? `<path class="dark" d="M100 6 Q118 22 105 34 L91 32 Q88 18 100 6Z"/>`
      : `<path class="dark" d="M100 -12 Q134 6 126 38 L80 34 Q78 4 100 -12Z"/><path d="M100 2 L104 32 M112 6 L114 34" stroke="rgba(255,255,255,.4)" stroke-width="3" fill="none"/>`),
    ears: st => (st < 2 ? "" : `<path class="dark" d="M48 68 L14 54 L26 78 L12 96 L48 94Z"/><path class="dark" d="M152 68 L186 54 L174 78 L188 96 L152 94Z"/>`),
    tail: st => `<g transform="translate(138 178) scale(${[0, .75, .9, 1.1][st]}) translate(-138 -178)">
      <path class="dark" d="M134 170 Q162 172 170 150 L192 136 L185 162 L198 182 L170 176 Q156 190 134 186Z"/></g>`,
    back: `<circle cx="22" cy="120" r="9" fill="none" stroke="#b3e5fc" stroke-width="3"/><circle cx="182" cy="104" r="6" fill="none" stroke="#b3e5fc" stroke-width="3"/><circle cx="12" cy="150" r="5" fill="none" stroke="#b3e5fc" stroke-width="3"/>`,
  },
  planta: {
    crest: st => (st < 3
      ? `<path d="M100 30 L100 6" stroke="#2e7d32" stroke-width="5" stroke-linecap="round"/>
         <path d="M100 10 Q124 -12 138 6 Q120 24 100 10Z" ${LEAF}/>${st === 2 ? `<path d="M100 10 Q76 -12 62 6 Q80 24 100 10Z" ${LEAF}/>` : ""}`
      : `<path d="M100 30 L100 12" stroke="#2e7d32" stroke-width="5" stroke-linecap="round"/>
         <g fill="#f48fb1" stroke="#c2185b" stroke-width="2"><circle cx="100" cy="-10" r="10"/><circle cx="116" cy="2" r="10"/><circle cx="110" cy="20" r="10"/><circle cx="90" cy="20" r="10"/><circle cx="84" cy="2" r="10"/></g>
         <circle cx="100" cy="6" r="9" fill="#ffd23f" stroke="#a87a00" stroke-width="2"/>`),
    ears: st => (st < 2 ? "" : `<path d="M50 60 Q16 40 14 72 Q30 86 50 80Z" ${LEAF}/><path d="M150 60 Q184 40 186 72 Q170 86 150 80Z" ${LEAF}/>`),
    tail: st => `<g transform="translate(138 178) scale(${[0, .75, .95, 1.2][st]}) translate(-138 -178)">
      <path d="M134 180 Q168 148 194 168 Q172 200 134 180Z" ${LEAF}/><path d="M140 180 Q166 170 186 170" stroke="#2e7d32" stroke-width="2.5" fill="none"/></g>`,
    back: `<path d="M62 150 Q14 110 6 150 Q24 182 62 172Z" ${LEAF}/><path d="M138 150 Q186 110 194 150 Q176 182 138 172Z" ${LEAF}/>`,
  },
};

function creatureSVG(outfit, stage) {
  if (stage === 0) return eggSVG(outfit);
  const type = CREATURE_TYPES[settings.creature] ? settings.creature : "fuego";
  const p = CREATURE_PARTS[type], w = wearSVG(outfit);
  const k = [0, .8, .9, 1][stage];
  return `
  <svg viewBox="0 0 200 230" role="img" aria-label="Criatura de ${CREATURE_TYPES[type].name.toLowerCase()}">
    <g class="ninja"><g transform="translate(100 218) scale(${k}) translate(-100 -218)">
      ${stage === 3 ? p.back : ""}
      <g class="tail">${p.tail(stage)}</g>
      <ellipse class="dark" cx="78" cy="208" rx="17" ry="11"/><ellipse class="dark" cx="122" cy="208" rx="17" ry="11"/>
      <ellipse class="mask" cx="100" cy="164" rx="46" ry="44"/>
      <ellipse cx="100" cy="172" rx="28" ry="30" fill="#fff3d6" opacity=".9"/>
      <ellipse class="mask" cx="56" cy="158" rx="12" ry="18" transform="rotate(18 56 158)"/>
      <g class="armR"><ellipse class="mask" cx="144" cy="158" rx="12" ry="18" transform="rotate(-18 144 158)"/></g>
      ${p.ears(stage)}
      <circle class="mask" cx="100" cy="78" r="56"/>
      ${COLLAR_SVG}
      ${FACE_SVG}
      <path d="M90 98 Q100 108 110 98" stroke="#2b1d4a" stroke-width="4" fill="none" stroke-linecap="round"/>
      ${stage >= 2 ? `<path d="M93 101 L96 108 L99 102Z M101 102 L104 108 L107 101Z" fill="#fff"/>` : ""}
      ${outfit.hat ? "" : p.crest(stage)}
      ${w.glasses}${w.hat}
    </g></g>
    ${w.pet}
  </svg>`;
}

/* ---------------------------------------------------------
   DINOSAURIOS: un dino que sale del huevo y crece. Su color
   es el que se elige en «Mi dino» (el mismo selector del ninja).
   --------------------------------------------------------- */
function dinoSVG(outfit, stage) {
  if (stage === 0) return eggSVG(outfit);
  const w = wearSVG(outfit);
  const k = [0, .8, .9, 1][stage];
  const spikes = stage === 1
    // la cría todavía lleva un trozo de cáscara en la cabeza
    ? `<path d="M52 52 Q58 2 100 0 Q142 2 148 52 L135 37 L123 52 L111 35 L100 52 L89 35 L77 52 L65 37Z" fill="#fff8e7" stroke="rgba(0,0,0,.18)" stroke-width="2.5" stroke-linejoin="round"/>`
    : `<g class="dark" transform="translate(100 30) scale(${stage === 3 ? 1.25 : 1}) translate(-100 -30)">
        <path d="M68 36 L78 10 L90 30Z"/><path d="M89 28 L100 -2 L111 28Z"/><path d="M110 30 L122 10 L132 36Z"/></g>`;
  return `
  <svg viewBox="0 0 200 230" role="img" aria-label="Dinosaurio">
    <g class="ninja"><g transform="translate(100 218) scale(${k}) translate(-100 -218)">
      <g class="tail">
        <path class="mask" d="M130 186 Q186 196 196 150 Q174 170 138 152Z"/>
        ${stage >= 2 ? `<path class="dark" d="M158 168 L166 150 L174 166Z M176 162 L186 146 L190 160Z"/>` : ""}
      </g>
      <ellipse class="dark" cx="78" cy="208" rx="19" ry="11"/><ellipse class="dark" cx="122" cy="208" rx="19" ry="11"/>
      <ellipse class="mask" cx="100" cy="164" rx="46" ry="44"/>
      <ellipse cx="100" cy="172" rx="28" ry="30" fill="#fff3d6" opacity=".9"/>
      <path d="M80 160 H120 M78 174 H122 M82 188 H118" stroke="rgba(0,0,0,.12)" stroke-width="3" stroke-linecap="round"/>
      <ellipse class="dark" cx="60" cy="152" rx="9" ry="14" transform="rotate(24 60 152)"/>
      <g class="armR"><ellipse class="dark" cx="140" cy="152" rx="9" ry="14" transform="rotate(-24 140 152)"/></g>
      ${stage === 3 ? `<path d="M50 56 L22 26 L66 36Z" fill="#fff8e7" stroke="rgba(0,0,0,.2)" stroke-width="2"/><path d="M150 56 L178 26 L134 36Z" fill="#fff8e7" stroke="rgba(0,0,0,.2)" stroke-width="2"/>` : ""}
      <circle class="mask" cx="100" cy="78" r="56"/>
      <ellipse cx="100" cy="100" rx="36" ry="22" fill="#fff" opacity=".22"/>
      ${COLLAR_SVG}
      ${FACE_SVG}
      <circle cx="91" cy="94" r="2.6" fill="#2b1d4a" opacity=".7"/><circle cx="109" cy="94" r="2.6" fill="#2b1d4a" opacity=".7"/>
      <path d="M84 104 Q100 116 116 104" stroke="#2b1d4a" stroke-width="4" fill="none" stroke-linecap="round"/>
      ${stage >= 2 ? `<path d="M88 107 L91 114 L94 109Z M98 110 L100 117 L103 110Z M106 109 L109 114 L112 107Z" fill="#fff"/>` : ""}
      ${outfit.hat ? "" : spikes}
      ${w.glasses}${w.hat}
    </g></g>
    ${w.pet}
  </svg>`;
}

/* ---------------------------------------------------------
   Pegatinas de cada álbum: [id, dibujo, nombre, color]
   --------------------------------------------------------- */
const CREATURE_STICKERS = [
  // fuego
  ["c-zorrillama", "🦊", "Zorrillama", "#ff7043"], ["c-dracofuego", "🐉", "Dracofuego", "#ff5722"], ["c-leonbrasa", "🦁", "Leónbrasa", "#ffa726"],
  ["c-gallochispa", "🐓", "Gallochispa", "#ef5350"], ["c-escorpiardo", "🦂", "Escorpiardo", "#e64a19"], ["c-volcanin", "🌋", "Volcanín", "#d84315"],
  ["c-llamita", "🔥", "Llamita", "#ff8a65"], ["c-tigrascua", "🐅", "Tigrascua", "#ffb300"],
  // agua
  ["c-tortugota", "🐢", "Tortugota", "#26a69a"], ["c-delfiola", "🐬", "Delfiola", "#29b6f6"], ["c-pulpompa", "🐙", "Pulpompa", "#7986cb"],
  ["c-tiburola", "🦈", "Tiburola", "#5c6bc0"], ["c-ranacharca", "🐸", "Ranacharca", "#4db6ac"], ["c-cangrespuma", "🦀", "Cangrespuma", "#4fc3f7"],
  ["c-ballenube", "🐳", "Ballenube", "#42a5f5"], ["c-focasal", "🦭", "Focasal", "#90caf9"],
  // planta
  ["c-erizohoja", "🦔", "Erizohoja", "#8bc34a"], ["c-orugabrote", "🐛", "Orugabrote", "#9ccc65"], ["c-mariflor", "🦋", "Mariflor", "#f48fb1"],
  ["c-abejazahar", "🐝", "Abejazahar", "#ffd54f"], ["c-lagarrama", "🦎", "Lagarrama", "#66bb6a"], ["c-setin", "🍄", "Setín", "#ef9a9a"],
  ["c-cactulin", "🌵", "Cactulín", "#81c784"], ["c-girasolin", "🌻", "Girasolín", "#ffca28"],
  // rayo
  ["c-ratochispa", "🐭", "Ratochispa", "#ffd600"], ["c-cebrarrayo", "🦓", "Cebrarrayo", "#fff176"], ["c-aguitrueno", "🦅", "Aguitrueno", "#ffc107"],
  ["c-chispin", "⚡", "Chispín", "#ffee58"], ["c-gatovoltio", "🐈", "Gatovoltio", "#ffb74d"], ["c-murcierrayo", "🦇", "Murciérrayo", "#b39ddb"],
  // hielo
  ["c-pinguihielo", "🐧", "Pingüihielo", "#81d4fa"], ["c-osonieve", "🐻‍❄️", "Osonieve", "#b3e5fc"], ["c-nevadin", "⛄", "Nevadín", "#e1f5fe"],
  ["c-renoescarcha", "🦌", "Renoescarcha", "#80deea"], ["c-buhogelido", "🦉", "Búhogélido", "#b0bec5"], ["c-copito", "❄️", "Copito", "#4fc3f7"],
  // roca
  ["c-rinorroca", "🦏", "Rinorroca", "#a1887f"], ["c-jabalipiedra", "🐗", "Jabalipiedra", "#8d6e63"], ["c-cocogranito", "🐊", "Cocogranito", "#9e9d24"],
  ["c-mamuton", "🦣", "Mamutón", "#bcaaa4"], ["c-caracolca", "🐌", "Caracolca", "#c5a880"], ["c-pedrusco", "🪨", "Pedrusco", "#90a4ae"],
];

const DINO_STICKERS = [
  ["d-trex", "🦖", "Tiranosaurio", "#66bb6a"], ["d-diplodocus", "🦕", "Diplodocus", "#4db6ac"], ["d-velociraptor", "🦖", "Velociraptor", "#ffa726"],
  ["d-braquiosaurio", "🦕", "Braquiosaurio", "#7986cb"], ["d-espinosaurio", "🦖", "Espinosaurio", "#ef5350"], ["d-estegosaurio", "🦕", "Estegosaurio", "#ffca28"],
  ["d-huevo", "🥚", "Huevo de dino", "#ffe0b2"], ["d-hueso", "🦴", "Hueso fósil", "#d7ccc8"], ["d-diente", "🦷", "Diente gigante", "#e0e0e0"],
  ["d-huella", "🐾", "Huella", "#a1887f"], ["d-volcan", "🌋", "Volcán", "#e64a19"], ["d-meteorito", "☄️", "Meteorito", "#ff8a65"],
  ["d-palmera", "🌴", "Palmera", "#81c784"], ["d-helecho", "🌿", "Helecho", "#66bb6a"], ["d-roca", "🪨", "Roca", "#90a4ae"],
  ["d-cocodrilo", "🐊", "Cocodrilo gigante", "#9ccc65"], ["d-tortuga", "🐢", "Tortuga antigua", "#26a69a"], ["d-lagarto", "🦎", "Lagarto", "#aed581"],
  ["d-serpiente", "🐍", "Serpiente", "#c0ca33"], ["d-escorpion", "🦂", "Escorpión", "#bf360c"], ["d-concha", "🐚", "Concha fósil", "#f8bbd0"],
  ["d-amonite", "🐌", "Amonite", "#c5a880"], ["d-mamut", "🦣", "Mamut", "#8d6e63"], ["d-rino", "🦏", "Rinoceronte lanudo", "#b0bec5"],
  ["d-sable", "🐅", "Dientes de sable", "#ffb300"], ["d-bisonte", "🦬", "Bisonte", "#795548"], ["d-ciervo", "🦌", "Ciervo gigante", "#bcaaa4"],
  ["d-dodo", "🦤", "Dodo", "#b39ddb"], ["d-ave", "🦅", "Ave gigante", "#8d6e63"], ["d-pluma", "🪶", "Pluma", "#80cbc4"],
  ["d-escarabajo", "🪲", "Escarabajo", "#558b2f"], ["d-ambar", "💎", "Ámbar", "#ffc107"], ["d-fuego", "🔥", "Fuego", "#ff5722"],
  ["d-hacha", "🪓", "Hacha de piedra", "#a1887f"], ["d-cabana", "🛖", "Cabaña", "#d7a86e"], ["d-pico", "⛏️", "Pico", "#78909c"],
  ["d-lupa", "🔍", "Lupa", "#4fc3f7"], ["d-brujula", "🧭", "Brújula", "#ef9a9a"], ["d-mapa", "🗺️", "Mapa", "#a5d6a7"],
  ["d-mochila", "🎒", "Mochila", "#e57373"], ["d-linterna", "🔦", "Linterna", "#ffd54f"], ["d-desierto", "🏜️", "Desierto", "#ffcc80"],
];

/* ---------------------------------------------------------
   Los temas
   `stages` = nivel (0 es el primero) en el que la mascota pasa a la etapa siguiente.
   `rankUp(nivel, cambiaEtapa, etapa)` = frase al subir de nivel.
   --------------------------------------------------------- */
const THEME_DEFS = {
  ninja: {
    id: "ninja", name: "Ninja", ico: "🥷",
    title: ["Dojo", "Ninja"], who: "ninja",
    images: true,                    // el álbum incluye también las láminas
    gift: "🎁", cardBack: "🥷",
    petals: ["🌸", "🌸", "🍃"],
    map: { title: "Camino al templo", goal: "🏯", goalName: "Templo", goalDone: "¡Maestro ninja!", decor: ["🌸", "🎋", "🪨", "⛩️", "🌳", "🏮", "🍄", "🌷", "🦋", "🎍"] },
  },
  criaturas: {
    id: "criaturas", name: "Criaturas", ico: "🐣",
    title: ["Isla", "Criaturas"], who: "entrenador",
    stickers: CREATURE_STICKERS,
    mascot: creatureSVG, stages: [0, 1, 4, 10], stageNames: ["Huevo", "Cría", "Joven", "Adulta"],
    gift: "🥚", cardBack: "🐾",
    doors: ["🦊", "🐢", "🦔", "🐭", "🐧", "🦋", "🐙"],
    petals: ["🍃", "🌼", "🍃"],
    rankUp: (n, grew, stage) => (!grew ? `¡Nivel ${n}! 🌟` : stage === 1 ? "¡El huevo se ha abierto! 🐣" : "¡Tu criatura ha evolucionado! ✨"),
    map: { title: "Ruta a la cima", goal: "🏔️", goalName: "La cima", goalDone: "¡Gran entrenador!", decor: ["🌳", "🌼", "🍄", "🌊", "🪨", "🌴", "🌋", "🌵", "❄️", "🌲"] },
  },
  dinos: {
    id: "dinos", name: "Dinosaurios", ico: "🦖",
    title: ["Valle", "Dino"], who: "explorador",
    stickers: DINO_STICKERS,
    mascot: dinoSVG, stages: [0, 1, 4, 10], stageNames: ["Huevo", "Cría", "Joven", "Gigante"],
    gift: "🥚", cardBack: "🦴",
    doors: ["🦖", "🦕", "🥚", "🦴", "🌋", "🐊", "🦣"],
    petals: ["🍃", "🌿", "🍂"],
    rankUp: (n, grew, stage) => (!grew ? `¡Nivel ${n}! 🌟` : stage === 1 ? "¡El huevo se ha abierto! 🐣" : "¡Tu dino ha crecido! 🦖"),
    map: { title: "Camino al volcán", goal: "🌋", goalName: "El volcán", goalDone: "¡Rey de los dinos!", decor: ["🌴", "🌿", "🪨", "🦴", "🥚", "🌳", "🐾", "🍄", "🦕", "🌵"] },
  },
};
