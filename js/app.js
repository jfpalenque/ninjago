/* =========================================================
   APP: navegación entre pantallas, ajustes y arranque
   ========================================================= */
"use strict";

const GAMES = {
  silabas: SyllableGame, leer: ReadGame, construir: BuildGame, dibujo: PictureGame, falta: MissingGame,
  parejas: PairsGame, sino: YesNoGame, letras: SpellGame, numeros: NumberGame,
  trazar: TraceGame, frases: SentenceGame,
};
/* Rutas que abren un juego (algunas con un modo concreto) */
const ROUTES = {
  silabas: [SyllableGame], leer: [ReadGame], construir: [BuildGame], dibujo: [PictureGame], falta: [MissingGame],
  parejas: [PairsGame], sino: [YesNoGame], letras: [SpellGame],
  contar: [NumberGame, "count"], numero: [NumberGame, "hear"], grupos: [NumberGame, "match"],
  serie: [NumberGame, "seq"], mayor: [NumberGame, "big"], ordenar: [NumberGame, "order"],
  sumar: [NumberGame, "add"], restar: [NumberGame, "sub"],
  dobles: [NumberGame, "double"], formas: [NumberGame, "shape"], reloj: [NumberGame, "clock"], monedas: [NumberGame, "coins"],
  trazar: [TraceGame], frases: [SentenceGame],
};
const WORD_GAMES = [ReadGame, BuildGame, PictureGame, MissingGame, PairsGame, YesNoGame, SpellGame];
const resetDecks = () => WORD_GAMES.forEach(g => g.deck.reset());
const SCREENS = ["menuScreen", "game", "progressScreen", "mapScreen"];

/* ---------------------------------------------------------
   Navegación: #menu, #progreso y una ruta por juego (las claves de ROUTES)
   El botón «atrás» del navegador/móvil también funciona.
   --------------------------------------------------------- */
function showScreen(id) {
  SCREENS.forEach(s => ($(s).hidden = s !== id));
}

function route() {
  const name = location.hash.replace("#", "") || "menu";
  const cameFromMap = session.route === "mapa";

  session.current?.leave();
  session.current = null;
  session.token++;                 // invalida temporizadores de la pantalla anterior
  session.locked = true;
  speechSynthesis?.cancel();
  document.querySelectorAll("dialog[open]").forEach(d => d.close());

  const [g, mode] = ROUTES[name] || [];
  session.route = g ? name : ["progreso", "mapa"].includes(name) ? name : "menu";
  if (g) {
    // quien entra desde el mapa vuelve al mapa con el botón de casa
    $("homeBtn").href = cameFromMap ? "#mapa" : "#menu";
    $("homeBtn").textContent = cameFromMap ? "🗺️" : "🏠";
    g.setup?.(mode);
    showScreen("game");
    Object.values(GAMES).forEach(x => ($(x.view).hidden = x !== g));
    document.body.dataset.game = g.id;
    session.current = g;
    renderProgress();
    renderHud();
    $("picBtn").hidden = !PIC_IDS[g.id];
    applyShowPics();
    // Si el premio sigue en pantalla, el juego empezará cuando termine
    if (!session.rewardActive) g.enter();
  } else if (name === "progreso") {
    showScreen("progressScreen");
    renderProgressScreen();
  } else if (name === "mapa") {
    showScreen("mapScreen");
    renderMap();
  } else {
    showScreen("menuScreen");
    updateBelt();
    renderMission();
    setTimeout(() => mascotReact("wave"), 300);
  }
  document.body.dataset.screen = name;
}

/* Pone o quita los dibujos de las palabras en la pantalla actual */
const PIC_IDS = { leer: "readEmoji", construir: "buildEmoji", falta: "missEmoji", letras: "spellEmoji" };
const segSync = {};     // para refrescar un selector cuando el ajuste cambia solo (dificultad automática)
function applyShowPics() {
  $("picBtn").textContent = settings.showPics ? "🖼️" : "🙈";
  $("picBtn").classList.toggle("off", !settings.showPics);
  const g = session.current;
  const picId = PIC_IDS[g?.id];
  if (picId && g.word && !document.querySelector(".wordCard.good")) showWordPic($(picId), g.word);
}

function restartGameIfPlaying(id) {
  const g = session.current;
  if (!g || session.rewardActive || document.querySelector(".balloon")) return;
  if (!id || g.id === id) restartRound(g);
}
/* Ronda nueva (en «Parejas», tablero nuevo aunque queden cartas) */
const restartRound = g => (g.restart ? g.restart() : g.next());

/* ---------------------------------------------------------
   Ajustes
   --------------------------------------------------------- */
function setupSegmented(id, key, parse, onChange) {
  const seg = $(id);
  const sync = () => seg.querySelectorAll("button").forEach(b => b.classList.toggle("active", parse(b.dataset.value) === settings[key]));
  seg.addEventListener("click", e => {
    const b = e.target.closest("button");
    if (!b) return;
    settings[key] = parse(b.dataset.value);
    saveSettings();
    sync();
    onChange?.();
  });
  sync();
  segSync[key] = sync;
}

/* La dificultad automática ha subido o bajado un escalón */
function onAutoLevel(key, dir) {
  segSync[key]?.();
  if (key === "wordLevel") { resetDecks(); renderLevelInfo(); }
  const what = { wordLevel: "Palabras", numMax: "Números", count: "Sílabas" }[key];
  toast(dir > 0 ? `🚀 ¡Subes de nivel! ${what} más difíciles` : `🌱 ${what}: un poco más fácil`);
}

function renderLetterChips() {
  const box = $("letterChips");
  box.innerHTML = "";
  let type = "";
  GROUPS.forEach(g => {
    if (g.type !== type) {
      type = g.type;
      const h = document.createElement("div");
      h.className = "chipHead";
      h.textContent = SYL_TYPES[type];
      box.appendChild(h);
    }
    const c = document.createElement("button");
    c.className = "chip" + (settings.letters.includes(g.key) ? " on" : "");
    c.textContent = g.label;
    c.title = g.syl.join(" ");
    c.onclick = () => {
      settings.letters = settings.letters.includes(g.key)
        ? settings.letters.filter(k => k !== g.key)
        : [...settings.letters, g.key];
      saveSettings();
      renderLetterChips();
      restartGameIfPlaying("silabas");
    };
    box.appendChild(c);
  });
  $("letterPreview").textContent = (settings.letters.length ? "" : "Sin selección: se usará P. ") + activePool().join(" ");
}

function renderLevelInfo() {
  const pool = wordPool();
  $("levelInfo").textContent = `${pool.length} palabras: ` + pool.slice(0, 8).map(w => w.emoji + " " + w.word).join(", ") + (pool.length > 8 ? "…" : "");
  $("micInfo").textContent = {
    easy: "Acepta lecturas con algunos errores (para empezar).",
    normal: "Acepta pequeños fallos del micrófono en palabras largas.",
    strict: "La palabra tiene que entenderse exacta.",
  }[settings.micLevel];
}

function renderCustomWords() {
  const list = settings.customWords || [];
  $("customList").innerHTML = list.length
    ? list.map((c, i) => `<span class="wchip">${esc(c.e || "📝")} ${esc(syllabify(c.w).join("-"))}<button data-del="${i}" aria-label="Borrar ${esc(c.w)}">✕</button></span>`).join("")
    : `<p class="muted small">Añade palabras de su entorno: su nombre, «abuela», su mascota…</p>`;
  renderLevelInfo();
}

function setupCustomWords() {
  $("customForm").addEventListener("submit", e => {
    e.preventDefault();
    const raw = $("customWord").value.trim().toLowerCase();
    const emoji = $("customEmoji").value.trim();
    const err = $("customError");
    err.hidden = true;
    if (!/^[a-záéíóúüñ-]{2,24}$/.test(raw) || /^-|-$|--/.test(raw)) {
      err.textContent = "Escribe una sola palabra, solo letras (puedes separar sílabas con guiones: a-bue-la).";
      err.hidden = false;
      return;
    }
    if (settings.customWords.some(c => c.w.replace(/-/g, "") === raw.replace(/-/g, ""))) {
      err.textContent = "Esa palabra ya está en la lista.";
      err.hidden = false;
      return;
    }
    settings.customWords = [...settings.customWords, { w: raw, e: emoji }];
    saveSettings();
    $("customWord").value = "";
    $("customEmoji").value = "";
    renderCustomWords();
    speak(raw.replace(/-/g, ""));
    resetDecks();
  });

  $("customList").addEventListener("click", e => {
    const b = e.target.closest("[data-del]");
    if (!b) return;
    settings.customWords = settings.customWords.filter((_, i) => i !== Number(b.dataset.del));
    saveSettings();
    renderCustomWords();
    resetDecks();
  });
}

function setupSettings() {
  setupSegmented("goalSeg", "goal", Number, () => {
    stats.progress = Math.min(stats.progress, settings.goal - 1);
    saveStats();
    renderProgress();
  });
  setupSegmented("modeSeg", "mode", v => v, () => restartGameIfPlaying("silabas"));
  setupSegmented("countSeg", "count", Number, () => restartGameIfPlaying("silabas"));
  setupSegmented("levelSeg", "wordLevel", v => v, () => {
    renderLevelInfo();
    resetDecks();
    WORD_GAMES.forEach(g => restartGameIfPlaying(g.id));
  });
  setupSegmented("numMaxSeg", "numMax", Number, () => restartGameIfPlaying("numeros"));
  setupSegmented("micSeg", "micLevel", v => v, renderLevelInfo);

  renderLetterChips();
  $("allLettersBtn").onclick = () => { settings.letters = GROUPS.filter(g => g.type === "dir").map(g => g.key); saveSettings(); renderLetterChips(); restartGameIfPlaying("silabas"); };
  $("noLettersBtn").onclick = () => { settings.letters = []; saveSettings(); renderLetterChips(); restartGameIfPlaying("silabas"); };

  const picker = $("colorPicker");
  Object.entries(NINJA_COLORS).forEach(([name, [main]]) => {
    const s = document.createElement("button");
    s.className = "swatch" + (settings.color === name ? " active" : "");
    s.style.background = main;
    s.setAttribute("aria-label", "Color " + name);
    s.onclick = () => {
      settings.color = name;
      saveSettings();
      applyNinjaColor();
      picker.querySelectorAll(".swatch").forEach(x => x.classList.toggle("active", x === s));
      mascotReact("happy");
    };
    picker.appendChild(s);
  });

  const bindCheck = (id, key, after) => {
    const c = $(id);
    c.checked = settings[key];
    c.onchange = () => { settings[key] = c.checked; saveSettings(); after?.(); };
  };
  const redrawWords = () => {
    if (session.current === ReadGame && ReadGame.word) $("readWord").innerHTML = wordHTML(ReadGame.word);
    if (session.current === PictureGame && PictureGame.word) $("picWord").innerHTML = wordHTML(PictureGame.word);
    if (session.current === YesNoGame && YesNoGame.shown) $("ynWord").innerHTML = wordHTML(YesNoGame.shown);
  };
  bindCheck("optChangeOnFail", "changeOnFail");
  bindCheck("optSameVowel", "sameVowel", () => restartGameIfPlaying("silabas"));
  bindCheck("optLowercase", "lowercase", () => {
    SyllableGame.refreshLabels();
    redrawWords();
    if ([BuildGame, PictureGame, MissingGame, PairsGame, SpellGame, NumberGame].includes(session.current)) restartGameIfPlaying();
  });
  bindCheck("optSound", "sound", renderHud);
  bindCheck("optShowSyl", "showSyllables", redrawWords);
  bindCheck("optShowPics", "showPics", applyShowPics);
  const restartBuilders = () => { restartGameIfPlaying("construir"); restartGameIfPlaying("letras"); };
  bindCheck("optBuildHint", "buildHint", restartBuilders);
  bindCheck("optBuildExtra", "buildExtra", restartBuilders);
  bindCheck("optOnlyCustom", "onlyCustom", () => { renderLevelInfo(); resetDecks(); });
  bindCheck("optNumPics", "numPics", () => restartGameIfPlaying("numeros"));
  bindCheck("optSmart", "smartReview", resetDecks);
  bindCheck("optAuto", "autoLevel");
  setupSegmented("fontSeg", "font", v => v, () => { applyFont(); restartGameIfPlaying("trazar"); });
  $("optLock").checked = profiles.lock;
  $("optLock").onchange = () => { profiles.lock = $("optLock").checked; saveProfiles(); };

  const rate = $("optRate");
  rate.value = settings.rate;
  rate.onchange = () => { settings.rate = Number(rate.value); saveSettings(); speak("Hola, ninja"); };

  setupVoice();
  setupCustomWords();
  renderCustomWords();
  $("versionBox").textContent = "Versión " + APP_VERSION;
}

/* ---------------------------------------------------------
   Voz: lista de voces en español del dispositivo, tono y prueba
   --------------------------------------------------------- */
function renderVoices() {
  const sel = $("voiceSel");
  if (!sel) return;
  const voices = spanishVoices();
  const label = v => `${v.name.replace(/^(Microsoft|Google)\s+/i, "")} (${/^es[-_]ES/i.test(v.lang) ? "España" : v.lang})`;
  sel.innerHTML = `<option value="">Automática${voices[0] ? ` — ${esc(label(voices[0]))}` : ""}</option>` +
    voices.map(v => `<option value="${esc(v.voiceURI)}">${esc(label(v))}</option>`).join("");
  sel.value = voices.some(v => v.voiceURI === settings.voice) ? settings.voice : "";
  $("voiceInfo").textContent = voices.length
    ? `${voices.length} ${voices.length === 1 ? "voz" : "voces"} en español en este dispositivo. Para tener más, instala voces de «Español (España)» en los ajustes de texto a voz del sistema.`
    : "Este dispositivo no tiene voces en español. Instala una de «Español (España)» en los ajustes de texto a voz del sistema.";
}

function testVoice() {
  // «to» suelta es la sílaba que algunas voces leen mal
  speak("to").then(() => speak("Tomate. Pato. ¡Hola, ninja!"));
}

function setupVoice() {
  renderVoices();
  $("voiceSel").onchange = e => {
    settings.voice = e.target.value;
    saveSettings();
    pickVoice();
    testVoice();
  };
  setupSegmented("pitchSeg", "pitch", Number, testVoice);
  $("voiceTestBtn").onclick = testVoice;
}

/* ---------------------------------------------------------
   Diálogos
   --------------------------------------------------------- */
function setupDialogs() {
  document.querySelectorAll("dialog").forEach(d => {
    d.addEventListener("click", e => {
      if (e.target.closest("[data-close]")) return d.close();
      const r = d.getBoundingClientRect();
      if (e.target === d && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)) d.close();
    });
  });

  document.addEventListener("click", async e => {
    if (e.target.closest("[data-open-settings]")) { if (await parentGate()) $("settingsDialog").showModal(); return; }
    if (e.target.closest("[data-open-album]")) { renderAlbum(); $("albumDialog").showModal(); }
    if (e.target.closest("[data-open-shop]")) { renderShop(); $("shopDialog").showModal(); }
    if (e.target.closest("[data-open-calendar]")) { renderCalendar(); $("calendarDialog").showModal(); }
    if (e.target.closest("[data-open-profiles]")) { $("settingsDialog").close(); $("profileBtn").click(); }
  });

  $("resetRewardsBtn").onclick = async () => {
    if (!(await parentGate())) return;
    if (!confirm("¿Seguro que quieres borrar todos los premios y cinturones?")) return;
    unlocked = {};
    save("unlockedRewards", unlocked);
    updateBelt();
    renderAlbum();
  };

  $("resetStatsBtn").onclick = async () => {
    if (!(await parentGate())) return;
    if (!confirm("¿Borrar estrellas, rachas, calendario y estadísticas de palabras y sílabas? (Los premios y lo comprado en la tienda se mantienen)")) return;
    stats = freshStats();
    wordStats = {};
    sylStats = {};
    daily = { days: {}, bestStreak: 0 };
    save("dojoSylStats", sylStats);
    saveDaily();
    medals = [];
    save("dojoMedals", medals);
    saveStats();
    save("dojoWordStats", wordStats);
    renderProgressScreen();
    updateBelt();
  };
}

/* ---------------------------------------------------------
   Arranque
   --------------------------------------------------------- */
function init() {
  applyNinjaColor();
  applyFont();
  buildSky();
  renderMascots();
  updateBelt();
  checkMedals();                   // las que ya tenía ganadas no se anuncian de golpe
  setupSettings();
  setupDialogs();
  setupProfiles();
  setupShop();
  setupBackup();

  $("listenBtn").onclick = () => session.current?.listen();
  $("picBtn").onclick = () => {
    settings.showPics = !settings.showPics;
    $("optShowPics").checked = settings.showPics;
    saveSettings();
    applyShowPics();
    say(settings.showPics ? "Dibujos visibles 🖼️" : "Dibujos ocultos: ¡a leer! 🙈");
  };
  $("muteBtn").onclick = () => {
    settings.sound = !settings.sound;
    $("optSound").checked = settings.sound;
    saveSettings();
    renderHud();
  };

  $("micBtn").onclick = () => ReadGame.toggleMic();
  $("manualOk").onclick = () => ReadGame.manualOk();
  $("manualRetry").onclick = () => ReadGame.manualRetry();
  $("recBtn").onclick = () => ReadGame.recordSelf();
  $("skipWordBtn").onclick = () => ReadGame.skip();
  $("skipBuildBtn").onclick = () => BuildGame.skip();
  $("skipSpellBtn").onclick = () => SpellGame.skip();
  $("ynYes").onclick = e => YesNoGame.answer(true, e.currentTarget);
  $("ynNo").onclick = e => YesNoGame.answer(false, e.currentTarget);

  // Teclado: números para elegir, espacio para escuchar, Enter para el micro
  document.addEventListener("keydown", e => {
    if (!session.current || session.rewardActive || document.querySelector("dialog[open]")) return;
    if (e.target instanceof HTMLInputElement) return;
    if (e.key === " " && !(e.target instanceof HTMLButtonElement)) {
      e.preventDefault();
      session.current.listen();
      return;
    }
    session.current.key?.(e);
  });

  window.addEventListener("resize", () => {
    const c = $("confetti");
    c.width = c.height = 0;
    if (!$("lanterns").hidden) SyllableGame.updateTravel();
  });

  window.addEventListener("hashchange", route);
  route();

  // Service worker (modo offline)
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations?.().then(regs => regs.forEach(r => {
      // El SW de la versión 1 vivía en js/sw.js y no controlaba la página
      if (r.active && r.active.scriptURL.endsWith("/js/sw.js")) r.unregister();
    }));
    // Cuando llega una versión nueva, recarga una vez para no mezclar archivos viejos y nuevos
    const hadController = !!navigator.serviceWorker.controller;
    let reloading = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!hadController || reloading) return;
      reloading = true;
      location.reload();
    });
    navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).catch(() => {});
  }
}

init();
