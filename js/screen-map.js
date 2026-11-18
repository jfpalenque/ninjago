/* =========================================================
   PANTALLA: MAPA DE AVENTURA
   Un camino que sube hasta el templo. Cada parada es un juego:
   con 5 aciertos gana su primera estrella y se abre la siguiente
   (15 aciertos = 2 estrellas, 30 = 3). El menú sigue teniendo
   todos los juegos abiertos para quien quiera ir a uno concreto.
   ========================================================= */
"use strict";

const MAP_ORDER = [
  "silabas", "contar", "trazar", "numero", "dibujo", "grupos", "construir", "formas", "falta", "serie", "parejas",
  "mayor", "sino", "ordenar", "letras", "sumar", "leer", "restar", "frases", "dobles", "reloj", "monedas",
];
const MAP_STARS = [5, 15, 30];
const MAP_STEP = 118;       // píxeles entre paradas
const MAP_DECOR = ["🌸", "🎋", "🪨", "⛩️", "🌳", "🏮", "🍄", "🌷", "🦋", "🎍"];

const mapStars = route => MAP_STARS.filter(n => (stats[gameInfo(route).stat] || 0) >= n).length;

function renderMap() {
  const stops = MAP_ORDER.map(gameInfo).filter(Boolean);
  const n = stops.length;
  const H = (n + 1) * MAP_STEP + 150;
  // de abajo arriba, serpenteando
  const pos = i => ({ x: 50 + 30 * Math.sin(i * 1.15), y: H - 90 - i * MAP_STEP });

  let open = true, current = -1, total = 0;
  const nodes = stops.map((g, i) => {
    const stars = mapStars(g.route);
    total += stars;
    const unlocked = open;
    if (unlocked && !stars && current < 0) current = i;
    open = open && stars > 0;
    const { x, y } = pos(i);
    const got = stats[g.stat] || 0;
    const nextGoal = MAP_STARS.find(s => got < s);
    const label = `${g.name}: ${unlocked ? `${stars} de 3 estrellas` : "cerrado"}`;
    const inner = `<span class="ico">${unlocked ? g.ico : "🔒"}</span><b>${esc(g.name)}</b>
      <span class="mapStars">${"★".repeat(stars)}<i>${"★".repeat(3 - stars)}</i></span>
      ${unlocked && nextGoal ? `<small>${got}/${nextGoal}</small>` : ""}`;
    return unlocked
      ? `<a href="#${g.route}" class="mapNode ${stars ? "done" : "open"}" data-i="${i}" style="left:${x}%;top:${y}px" aria-label="${esc(label)}">${inner}</a>`
      : `<span class="mapNode locked" data-i="${i}" style="left:${x}%;top:${y}px" aria-label="${esc(label)}">${inner}</span>`;
  });
  if (current < 0) current = open ? n : n - 1;      // todo con estrella: el ninja llega al templo

  const temple = pos(n);
  const pts = [...stops.map((_, i) => pos(i)), temple];
  const d = pts.map((p, i) => {
    if (!i) return `M${p.x} ${p.y}`;
    const q = pts[i - 1], my = (p.y + q.y) / 2;
    return `C${q.x} ${my} ${p.x} ${my} ${p.x} ${p.y}`;
  }).join(" ");
  const me = pos(Math.min(current, n));
  const decor = Array.from({ length: n }, (_, i) => {
    const p = pos(i + .5);
    return `<span class="mapDecor" style="left:${p.x > 50 ? p.x - 38 : p.x + 38}%;top:${p.y}px">${MAP_DECOR[i % MAP_DECOR.length]}</span>`;
  }).join("");

  $("mapTotal").textContent = `⭐ ${total} de ${n * 3}`;
  const box = $("mapPath");
  box.style.height = H + "px";
  box.innerHTML = `
    <svg viewBox="0 0 100 ${H}" preserveAspectRatio="none" aria-hidden="true"><path d="${d}"/></svg>
    ${decor}
    <span class="mapTemple ${open ? "open" : ""}" style="left:${temple.x}%;top:${temple.y}px">🏯<b>${open ? "¡Maestro ninja!" : "Templo"}</b></span>
    ${nodes.join("")}
    <span id="mapMe" class="mascotHolder mapMe" style="left:${me.x}%;top:${me.y}px">${mascotSVG()}</span>`;

  // se abre a la altura de la parada en la que está el ninja
  requestAnimationFrame(() => {
    const page = $("mapScreen");
    page.scrollTop = Math.max(0, me.y - page.clientHeight / 2 + box.offsetTop);
  });
}

/* Tocar una parada cerrada: el ninja explica qué falta */
document.addEventListener("click", e => {
  const node = e.target.closest(".mapNode.locked");
  if (!node) return;
  restartAnim(node, "wrong");
  const prev = gameInfo(MAP_ORDER[Number(node.dataset.i) - 1]);
  toast(prev ? `🔒 Antes consigue una estrella en «${prev.name}»` : "🔒 Todavía está cerrado");
  play("sndWrong", .4);
});
