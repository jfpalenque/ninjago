/* =========================================================
   PANTALLA: MI PROGRESO (para mayores)
   ========================================================= */
"use strict";

function renderProgressScreen() {
  const belt = BELTS[beltIndex()];
  const owned = PRIZES.filter(p => unlocked[p]).length;
  const cards = [
    ["⭐", stats.stars, "estrellas"],
    ["🔥", stats.bestStreak, "mejor racha"],
    ["🎁", `${owned}/${PRIZE_COUNT}`, "premios"],
    [`<i class="beltDot" style="background:${belt.color}"></i>`, belt.name, "cinturón"],
    ["🚪", stats.syllablesOk, "sílabas acertadas"],
    ["🎤", stats.wordsRead, "palabras leídas"],
    ["🧩", stats.wordsBuilt, "palabras construidas"],
  ];
  $("statCards").innerHTML = cards.map(([ico, val, label]) =>
    `<div class="statCard"><span class="ico">${ico}</span><b>${esc(val)}</b><small>${label}</small></div>`).join("");

  const entries = Object.entries(wordStats);
  const hard = entries.filter(([, s]) => s.fail > 0 && s.fail >= s.ok)
    .sort((a, b) => b[1].fail - a[1].fail).slice(0, 15);
  const master = entries.filter(([, s]) => s.ok >= 2 && s.ok > s.fail)
    .sort((a, b) => b[1].ok - a[1].ok);

  const chip = ([w, s], kind) => `<button class="wchip ${kind}" data-say="${esc(w)}">${esc(show(w))} <small>✅${s.ok} ❌${s.fail}</small></button>`;
  $("hardWords").innerHTML = hard.length ? hard.map(e => chip(e, "hard")).join("") : `<p class="muted">¡Ninguna por ahora! 🎉</p>`;
  $("masterWords").innerHTML = master.length ? master.map(e => chip(e, "ok")).join("") : `<p class="muted">Juega a «Lee la palabra» o «Construye» para verlas aquí.</p>`;
}

document.addEventListener("click", e => {
  const c = e.target.closest("[data-say]");
  if (c) speak(c.dataset.say);
});
