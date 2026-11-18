/* =========================================================
   PANTALLA: MI PROGRESO (para mayores)
   ========================================================= */
"use strict";

const fmtTime = sec => (sec < 60 ? "0 min" : sec < 3600 ? `${Math.round(sec / 60)} min` : `${Math.floor(sec / 3600)} h ${Math.round((sec % 3600) / 60)} min`);
const pct = (ok, fail) => (ok + fail ? Math.round((ok / (ok + fail)) * 100) : 0);

/** Últimas 8 semanas (de lunes a domingo): aciertos, fallos y tiempo. */
function weeklyStats() {
  const today = new Date();
  const monday = addDays(today, -((today.getDay() + 6) % 7));
  return Array.from({ length: 8 }, (_, w) => {
    const start = addDays(monday, -7 * (7 - w));
    const week = { start, ok: 0, fail: 0, sec: 0, days: 0 };
    for (let i = 0; i < 7; i++) {
      const rec = daily.days[dayKey(addDays(start, i))];
      if (!rec) continue;
      week.ok += rec.ok; week.fail += rec.fail; week.sec += rec.sec || 0;
      if (rec.ok > 0) week.days++;
    }
    return week;
  });
}

function renderProgressScreen() {
  const belt = BELTS[beltIndex()];
  const owned = PRIZES.filter(p => unlocked[p]).length;
  const totalSec = Object.values(stats.byGame).reduce((a, g) => a + (g.sec || 0), 0);
  const cards = [
    ["⭐", stats.stars, "estrellas ganadas"],
    ["🔥", stats.bestStreak, "mejor racha"],
    ["📅", dayStreak(), "días seguidos"],
    ["🎯", stats.missions || 0, "misiones cumplidas"],
    ["⏱️", fmtTime(dayRec().sec || 0), "jugado hoy"],
    ["⌛", fmtTime(totalSec), "jugado en total"],
    ["🎁", `${owned}/${PRIZE_COUNT}`, "premios"],
    [`<i class="beltDot" style="background:${beltBg(belt)}"></i>`, belt.name, "cinturón"],
    ["🏅", `${MEDALS.filter(m => medals.includes(m.id)).length}/${MEDALS.length}`, "medallas"],
  ];
  $("statCards").innerHTML = cards.map(([ico, val, label]) =>
    `<div class="statCard"><span class="ico">${ico}</span><b>${esc(val)}</b><small>${label}</small></div>`).join("");

  /* Evolución por semanas */
  const weeks = weeklyStats();
  const top = Math.max(1, ...weeks.map(w => w.ok));
  $("weekChart").innerHTML = weeks.map((w, i) => {
    const label = i === weeks.length - 1 ? "Esta" : `${w.start.getDate()}/${w.start.getMonth() + 1}`;
    const tip = `Semana del ${w.start.getDate()}/${w.start.getMonth() + 1}: ${w.ok} aciertos, ${pct(w.ok, w.fail)}% de acierto, ${fmtTime(w.sec)}, ${w.days} días`;
    return `<div class="weekCol" title="${tip}" aria-label="${tip}">
      <small class="val">${w.ok || ""}</small>
      <span class="bar"><i style="height:${(w.ok / top) * 100}%"></i></span>
      <small>${label}</small>
      <small class="pc">${w.ok + w.fail ? pct(w.ok, w.fail) + "%" : "–"}</small>
    </div>`;
  }).join("");

  /* Acierto por juego */
  const rows = GAME_INFO.map(g => ({ g, total: stats[g.stat] || 0, ...(stats.byGame[g.route] || { ok: 0, fail: 0, sec: 0 }) }))
    .filter(r => r.total || r.ok || r.fail);
  $("gameRows").innerHTML = rows.length ? rows.map(r => {
    const tried = r.ok + r.fail, p = pct(r.ok, r.fail);
    return `<div class="gameRow">
      <span class="name">${r.g.ico} ${esc(r.g.name)}</span>
      <span class="bar ${tried && p < 60 ? "low" : ""}"><i style="width:${tried ? p : 0}%"></i></span>
      <b>${tried ? p + "%" : "–"}</b>
      <small>${r.total} ${r.total === 1 ? "acierto" : "aciertos"}${r.sec >= 60 ? " · " + fmtTime(r.sec) : ""}</small>
    </div>`;
  }).join("") : `<p class="muted">Todavía no ha jugado a nada.</p>`;

  /* Palabras y sílabas */
  const entries = Object.entries(wordStats);
  const hard = entries.filter(([, s]) => isHard(s)).sort((a, b) => b[1].fail - a[1].fail).slice(0, 15);
  const master = entries.filter(([, s]) => s.ok >= 2 && s.ok > s.fail).sort((a, b) => b[1].ok - a[1].ok);
  const hardSyl = Object.entries(sylStats).filter(([, s]) => isHard(s)).sort((a, b) => b[1].fail - a[1].fail).slice(0, 15);

  const chip = ([w, s], kind) => `<button class="wchip ${kind}" data-say="${esc(w)}">${esc(show(w))} <small>✅${s.ok} ❌${s.fail}</small></button>`;
  $("hardWords").innerHTML = hard.length ? hard.map(e => chip(e, "hard")).join("") : `<p class="muted">¡Ninguna por ahora! 🎉</p>`;
  $("hardSyls").innerHTML = hardSyl.length ? hardSyl.map(e => chip(e, "hard")).join("") : `<p class="muted">¡Ninguna por ahora! 🎉</p>`;
  $("masterWords").innerHTML = master.length ? master.map(e => chip(e, "ok")).join("") : `<p class="muted">Juega a los juegos de palabras para verlas aquí.</p>`;
}

document.addEventListener("click", e => {
  const c = e.target.closest("[data-say]");
  if (c) speak(c.dataset.say);
});
