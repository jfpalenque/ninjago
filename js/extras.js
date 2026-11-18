/* =========================================================
   EXTRAS: bloqueo para mayores, perfiles, misión del día y
   calendario, tienda del ninja y copia de seguridad
   ========================================================= */
"use strict";

/* ---------------------------------------------------------
   Bloqueo para mayores: una multiplicación antes de entrar en
   ajustes o de borrar nada. Vale durante 5 minutos.
   --------------------------------------------------------- */
function parentGate() {
  if (!profiles.lock || Date.now() < session.parentUntil) return Promise.resolve(true);
  return new Promise(resolve => {
    const dlg = $("gateDialog"), input = $("gateInput");
    let a, b, ok = false;
    const ask = () => {
      a = 6 + Math.floor(Math.random() * 4);
      b = 6 + Math.floor(Math.random() * 4);
      $("gateQ").textContent = `¿Cuánto es ${a} × ${b}?`;
      input.value = "";
    };
    ask();
    $("gateForm").onsubmit = e => {
      e.preventDefault();
      if (Number(input.value) === a * b) {
        ok = true;
        session.parentUntil = Date.now() + 5 * 60000;
        dlg.close();
      } else {
        restartAnim(dlg, "shakeIt");
        ask();
        input.focus();
      }
    };
    dlg.addEventListener("close", () => resolve(ok), { once: true });
    dlg.showModal();
    input.focus();
  });
}

/* ---------------------------------------------------------
   Perfiles
   --------------------------------------------------------- */
const AVATARS = ["🥷", "🐉", "🐼", "🦊", "🐯", "🦄", "🐱", "🐶", "🦁", "🐸", "🚀", "⚽", "🌟", "🦖", "🐢", "🦉"];
let newAvatar = AVATARS[1];

function renderProfileChip() {
  const p = currentProfile();
  $("profileBtn").innerHTML = `<span>${esc(p.avatar)}</span><b>${esc(p.name)}</b>`;
}

function renderProfiles() {
  $("profileList").innerHTML = profiles.list.map(p => {
    const st = rawLoad(profileKey("dojoStats", p.id), {});
    const active = p.id === profiles.current;
    return `<div class="profileRow ${active ? "active" : ""}">
      <button class="profilePick" data-profile="${esc(p.id)}">
        <span class="avatar">${esc(p.avatar)}</span><b>${esc(p.name)}</b><small>⭐ ${st.stars || 0}</small>
      </button>
      ${active ? `<span class="profileHere">Jugando</span>` : `<button class="profileDel" data-del-profile="${esc(p.id)}" aria-label="Borrar a ${esc(p.name)}">🗑️</button>`}
    </div>`;
  }).join("");
  $("avatarPick").innerHTML = AVATARS.map(a => `<button type="button" class="${a === newAvatar ? "active" : ""}" data-avatar="${a}">${a}</button>`).join("");
}

function switchProfile(id) {
  if (id === profiles.current) return $("profileDialog").close();
  profiles.current = id;
  saveProfiles();
  location.hash = "#menu";
  location.reload();        // todo el estado se vuelve a leer con el perfil nuevo
}

function setupProfiles() {
  renderProfileChip();
  $("profileBtn").onclick = () => { renderProfiles(); $("profileForm").hidden = true; $("profileDialog").showModal(); };

  $("profileList").addEventListener("click", async e => {
    const pickBtn = e.target.closest("[data-profile]");
    if (pickBtn) return switchProfile(pickBtn.dataset.profile);
    const del = e.target.closest("[data-del-profile]");
    if (!del || !(await parentGate())) return;
    const p = profiles.list.find(x => x.id === del.dataset.delProfile);
    if (!p || !confirm(`¿Borrar a ${p.name} con todos sus premios y su progreso?`)) return;
    PROFILE_KEYS.forEach(k => { try { localStorage.removeItem(profileKey(k, p.id)); } catch { /* sin acceso */ } });
    profiles.list = profiles.list.filter(x => x.id !== p.id);
    saveProfiles();
    renderProfiles();
  });

  $("profileAddBtn").onclick = async () => {
    if (!(await parentGate())) return;
    $("profileForm").hidden = false;
    $("profileName").focus();
  };
  $("avatarPick").addEventListener("click", e => {
    const b = e.target.closest("[data-avatar]");
    if (!b) return;
    newAvatar = b.dataset.avatar;
    renderProfiles();
  });
  $("profileForm").addEventListener("submit", e => {
    e.preventDefault();
    const name = $("profileName").value.trim().slice(0, 14);
    if (!name) return $("profileName").focus();
    const id = "p" + Date.now().toString(36);
    profiles.list.push({ id, name, avatar: newAvatar });
    // el perfil nuevo hereda lo que es del dispositivo: la voz y el sonido
    const { voice, pitch, rate, sound } = settings;
    rawSave(profileKey("dojoSettings", id), { voice, pitch, rate, sound });
    $("profileName").value = "";
    switchProfile(id);
  });

  // el nombre del perfil de siempre se puede cambiar
  $("profileRenameBtn").onclick = async () => {
    if (!(await parentGate())) return;
    const p = currentProfile();
    const name = (prompt("Nombre del jugador:", p.name) || "").trim().slice(0, 14);
    if (!name) return;
    p.name = name;
    saveProfiles();
    renderProfiles();
    renderProfileChip();
  };
}

/* ---------------------------------------------------------
   Misión del día y calendario
   --------------------------------------------------------- */
function renderMission() {
  const tasks = todayMission();
  const done = !!dayRec().done;
  $("missionBox").classList.toggle("done", done);
  $("missionTitle").textContent = done ? "🎯 ¡Misión cumplida!" : `🎯 Misión de hoy · +${MISSION_BONUS} ⭐`;
  $("missionTasks").innerHTML = tasks.map(t => {
    const g = gameInfo(t.route), got = Math.min(t.got, t.n);
    return `<a href="#${t.route}" class="mTask ${got >= t.n ? "done" : ""}" aria-label="${esc(g.name)}: ${got} de ${t.n}">
      <span class="ico">${g.ico}</span><b>${esc(g.name)}</b>
      <span class="mBar"><i style="width:${(got / t.n) * 100}%"></i></span>
      <small>${got >= t.n ? "✅" : `${got}/${t.n}`}</small></a>`;
  }).join("");
  const s = dayStreak();
  $("streakBtn").innerHTML = `🔥 <b>${s}</b> ${s === 1 ? "día" : "días"}`;
  $("streakBtn").classList.toggle("cold", s === 0);
}

function renderCalendar() {
  const today = new Date();
  const monday = addDays(today, -((today.getDay() + 6) % 7) - 28);     // 5 semanas, de lunes a domingo
  const cells = Array.from({ length: 35 }, (_, i) => {
    const d = addDays(monday, i), k = dayKey(d), rec = daily.days[k];
    const future = d > today;
    const mark = rec?.done ? "🎯" : rec?.ok > 0 ? "⭐" : "";
    return `<span class="calDay ${mark ? "on" : ""} ${k === dayKey() ? "today" : ""} ${future ? "future" : ""}"
      title="${rec ? `${rec.ok} aciertos` : ""}"><small>${d.getDate()}</small>${mark}</span>`;
  }).join("");
  $("calGrid").innerHTML = ["L", "M", "X", "J", "V", "S", "D"].map(d => `<b>${d}</b>`).join("") + cells;
  const s = dayStreak();
  $("calInfo").textContent = `🔥 ${s} ${s === 1 ? "día seguido" : "días seguidos"} · Mejor racha: ${Math.max(daily.bestStreak || 0, s)} · ⭐ día jugado · 🎯 misión cumplida`;
}

/* ---------------------------------------------------------
   Tienda del ninja: las estrellas se gastan en sombreros, gafas y mascotas
   --------------------------------------------------------- */
function renderShop() {
  $("shopCoins").textContent = `⭐ ${coins()} para gastar`;
  $("shopPreview").innerHTML = mascotSVG();
  $("themePick").innerHTML = Object.values(THEME_DEFS).map(t =>
    `<button class="${t.id === THEME.id ? "active" : ""}" data-theme-id="${t.id}"><span>${t.ico}</span>${t.name}</button>`).join("");
  // Las criaturas no cambian de color: se elige su tipo
  const isCreature = THEME.id === "criaturas";
  $("colorPicker").hidden = isCreature;
  $("creaturePick").hidden = !isCreature;
  $("lookTitle").textContent = isCreature ? "Tipo" : "Color";
  $("creaturePick").innerHTML = Object.entries(CREATURE_TYPES).map(([id, t]) =>
    `<button class="${settings.creature === id ? "active" : ""}" data-creature="${id}" style="--c:${t.colors[0]}" aria-label="${t.name}">${t.ico}</button>`).join("");
  $("shopGrid").innerHTML = Object.entries(SHOP_TYPES).map(([type, title]) =>
    `<h3>${title}</h3><div class="shopRow">` + SHOP_ITEMS.filter(i => i.type === type).map(i => {
      const owned = shop.owned.includes(i.id), on = settings.outfit[type] === i.id;
      return `<button class="shopItem ${owned ? "owned" : ""} ${on ? "on" : ""} ${!owned && coins() < i.price ? "poor" : ""}" data-item="${i.id}"
        aria-label="${esc(i.name)}${owned ? "" : `, ${i.price} estrellas`}">
        <span class="ico">${i.ico}</span><b>${esc(i.name)}</b>
        <small>${on ? "✅ Puesto" : owned ? "Poner" : `⭐ ${i.price}`}</small></button>`;
    }).join("") + `</div>`).join("");
}

function setupShop() {
  $("themePick").addEventListener("click", e => {
    const b = e.target.closest("[data-theme-id]");
    if (!b || b.dataset.themeId === THEME.id) return;
    settings.theme = b.dataset.themeId;
    saveSettings();
    try { sessionStorage.setItem("dojoReopenShop", "1"); } catch { /* sin acceso */ }
    location.hash = "#menu";
    location.reload();       // el tema se aplica al arrancar
  });
  $("creaturePick").addEventListener("click", e => {
    const b = e.target.closest("[data-creature]");
    if (!b) return;
    settings.creature = b.dataset.creature;
    saveSettings();
    applyNinjaColor();
    renderMascots();
    renderShop();
    mascotReact("happy");
    play("sndPop", .5);
  });
  // tras cambiar de tema se vuelve a abrir «Mi …» para ver cómo queda
  try {
    if (sessionStorage.getItem("dojoReopenShop")) {
      sessionStorage.removeItem("dojoReopenShop");
      setTimeout(() => { renderShop(); $("shopDialog").showModal(); }, 400);
    }
  } catch { /* sin acceso */ }
  $("shopGrid").addEventListener("click", e => {
    const b = e.target.closest("[data-item]");
    if (!b) return;
    const item = SHOP_ITEMS.find(i => i.id === b.dataset.item);
    if (!shop.owned.includes(item.id)) {
      if (coins() < item.price) {
        restartAnim(b, "wrong");
        play("sndWrong", .5);
        $("shopCoins").textContent = `Te faltan ${item.price - coins()} ⭐ para «${item.name}»`;
        return;
      }
      stats.spent = (stats.spent || 0) + item.price;
      shop.owned.push(item.id);
      save("dojoShop", shop);
      saveStats();
      settings.outfit[item.type] = item.id;
      play("sndPrize", .7);
      burst(...centerOf(b), ["⭐", "✨", item.ico], 10);
    } else {
      settings.outfit[item.type] = settings.outfit[item.type] === item.id ? "" : item.id;   // tocar lo puesto lo quita
      play("sndPop", .5);
    }
    saveSettings();
    renderMascots();
    renderShop();
    updateBelt();
    mascotReact("happy");
  });
}

/* ---------------------------------------------------------
   Copia de seguridad: todos los perfiles en un archivo
   --------------------------------------------------------- */
const BACKUP_KEY = /^(?:[a-z0-9]+:)?(?:dojo[A-Za-z]+|unlockedRewards)$/;

function exportBackup() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (BACKUP_KEY.test(k)) data[k] = localStorage.getItem(k);
  }
  const blob = new Blob([JSON.stringify({ app: "dojo-ninja", version: APP_VERSION, date: new Date().toISOString(), data }, null, 1)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `dojo-ninja-${dayKey()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  $("backupInfo").textContent = "Copia guardada en las descargas del dispositivo.";
}

async function importBackup(file) {
  const info = $("backupInfo");
  try {
    const parsed = JSON.parse(await file.text());
    const entries = Object.entries(parsed?.data || {}).filter(([k, v]) => BACKUP_KEY.test(k) && typeof v === "string");
    if (parsed?.app !== "dojo-ninja" || !entries.length) throw new Error("formato");
    entries.forEach(([, v]) => JSON.parse(v));       // si algo no es JSON válido, no se toca nada
    if (!confirm("Se sustituirá todo el progreso de este dispositivo por el de la copia. ¿Continuar?")) return;
    const old = [];
    for (let i = 0; i < localStorage.length; i++) if (BACKUP_KEY.test(localStorage.key(i))) old.push(localStorage.key(i));
    old.forEach(k => localStorage.removeItem(k));
    entries.forEach(([k, v]) => localStorage.setItem(k, v));
    location.hash = "#menu";
    location.reload();
  } catch {
    info.textContent = "Ese archivo no es una copia de Dojo Ninja o está dañado. No se ha cambiado nada.";
  }
}

function setupBackup() {
  $("exportBtn").onclick = exportBackup;
  $("importBtn").onclick = () => $("importFile").click();
  $("importFile").onchange = e => {
    const f = e.target.files[0];
    e.target.value = "";
    if (f) importBackup(f);
  };
}
