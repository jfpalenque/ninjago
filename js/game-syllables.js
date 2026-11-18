/* =========================================================
   JUEGO 1: SÍLABAS (puertas o farolillos)
   ========================================================= */
"use strict";

const DOOR_IMAGES = Array.from({ length: 5 }, (_, i) => `img/imagen${i + 1}.webp`);
const FRAME_COLORS = ["#e53935", "#1e88e5", "#43a047", "#8e24aa", "#ff8f00"];
const LANTERN_COLORS = ["#ff5a36", "#ff2d7a", "#ffa000", "#7c4dff", "#00b8d4"];
const VOWELS = ["A", "E", "I", "O", "U"];

/* Grupos de sílabas (orden alfabético español) por tipo:
   directas (PA), inversas (AL), trabadas (PLA) y mixtas (PAN). */
const SYL_TYPES = { dir: "Directas (pa, me…)", inv: "Inversas (al, es…)", tra: "Trabadas (pla, tra…)", mix: "Mixtas (pan, sol…)" };
const GROUPS = [
  { key: "VOC", label: "AEIOU", syl: VOWELS },
  ..."B C CH D F G".split(" ").map(c => ({ key: c, label: c, syl: VOWELS.map(v => c + v) })),
  { key: "GU", label: "GU", syl: ["GUE", "GUI"] },
  ..."H J K L LL M N Ñ P".split(" ").map(c => ({ key: c, label: c, syl: VOWELS.map(v => c + v) })),
  { key: "Q", label: "QU", syl: ["QUE", "QUI"] },
  ..."R S T V W X Y Z".split(" ").map(c => ({ key: c, label: c, syl: VOWELS.map(v => c + v) })),
  ..."L N S R".split(" ").map(c => ({ key: "_" + c, label: "A" + c, type: "inv", syl: VOWELS.map(v => v + c) })),
  ..."BL BR CL CR DR FL FR GL GR PL PR TR".split(" ").map(c => ({ key: c, label: c, type: "tra", syl: VOWELS.map(v => c + v) })),
  ..."L N S R".split(" ").map(c => ({ key: "M_" + c, label: "–" + c, type: "mix", syl: "M P S T L".split(" ").flatMap(k => VOWELS.map(v => k + v + c)) })),
].map(g => ({ type: "dir", ...g }));

function activePool() {
  const pool = GROUPS.filter(g => settings.letters.includes(g.key)).flatMap(g => g.syl);
  return pool.length >= 2 ? [...new Set(pool)] : GROUPS.find(g => g.key === "P").syl;
}
const sylVowel = s => (/[AEIOU](?=[^AEIOU]*$)/.exec(s) || [""])[0];

const SyllableGame = {
  id: "silabas",
  view: "viewSyllables",
  correct: "",
  options: [],
  lastCorrect: "",

  enter() { this.next(); },
  leave() { $("lanterns").innerHTML = ""; $("doors").innerHTML = ""; },
  listen() { speak(this.correct); },

  pickOptions() {
    this.failed = false;
    const pool = activePool();
    const n = Math.min(settings.count, pool.length);
    const choices = pool.length > 1 ? pool.filter(s => s !== this.lastCorrect) : pool;
    // Repaso inteligente: las sílabas que cuestan tienen el triple de papeletas
    const weighted = settings.smartReview ? choices.flatMap(s => (isHard(sylStats[s]) ? [s, s, s] : [s])) : choices;
    const correct = pick(weighted);

    let candidates = pool.filter(s => s !== correct);
    if (settings.sameVowel) {
      const vowel = sylVowel(correct);
      const same = candidates.filter(s => sylVowel(s) === vowel);
      if (same.length >= n - 1) candidates = same;
    }
    this.correct = this.lastCorrect = correct;
    this.options = shuffle([correct, ...shuffle(candidates).slice(0, n - 1)]);
  },

  next() {
    this.pickOptions();
    if (settings.mode === "lanterns") this.renderLanterns();
    else this.renderDoors();
    say("¿Qué sílaba oyes?&nbsp;👂");
    session.locked = false;
    later(() => speak(this.correct), 350);
  },

  renderDoors() {
    $("lanterns").hidden = true;
    $("lanterns").innerHTML = "";
    const box = $("doors");
    box.hidden = false;
    box.innerHTML = "";
    const imgs = shuffle(DOOR_IMAGES);

    this.options.forEach((syl, i) => {
      const d = document.createElement("button");
      d.className = "door enter";
      d.addEventListener("animationend", e => { if (e.animationName === "doorIn") d.classList.remove("enter"); });
      d.style.setProperty("--i", i);
      d.style.setProperty("--frame", FRAME_COLORS[i % FRAME_COLORS.length]);
      d.setAttribute("aria-label", "Puerta " + (i + 1) + ": " + show(syl));
      d.innerHTML = `
        <span class="behind"><img src="${imgs[i % imgs.length]}" alt="" draggable="false"></span>
        <span class="panel l"></span><span class="panel r"></span>
        <span class="plaque">${show(syl)}</span>`;
      d.addEventListener("click", () => this.answer(syl, d));
      box.appendChild(d);
    });
  },

  renderLanterns() {
    $("doors").hidden = true;
    $("doors").innerHTML = "";
    const box = $("lanterns");
    box.hidden = false;
    box.classList.remove("paused");
    box.innerHTML = "";
    this.updateTravel();
    const n = this.options.length;
    // Misma velocidad y fases escalonadas: los farolillos nunca se solapan
    const dur = 9 + n;
    const phase = shuffle([...Array(n).keys()]);

    this.options.forEach((syl, i) => {
      const l = document.createElement("button");
      l.className = "lantern";
      l.style.setProperty("--x", ((i + .5) / n) * 100 + "%");
      l.style.setProperty("--dur", dur + "s");
      l.style.setProperty("--delay", -((phase[i] + .55) / n) * dur + "s");
      l.style.setProperty("--lc", LANTERN_COLORS[i % LANTERN_COLORS.length]);
      l.setAttribute("aria-label", "Farolillo: " + show(syl));
      l.innerHTML = `<span class="sway"><span class="body">${show(syl)}</span><span class="tassel"></span></span>`;
      l.addEventListener("click", () => this.answer(syl, l));
      box.appendChild(l);
    });
  },

  updateTravel() {
    const box = $("lanterns");
    box.style.setProperty("--travel", box.clientHeight + 160 + "px");
  },

  refreshLabels() {
    document.querySelectorAll(".door .plaque, .lantern .body").forEach((el, i) => {
      if (this.options[i]) el.textContent = show(this.options[i]);
    });
  },

  answer(syl, el) {
    if (session.locked) return;
    const [x, y] = centerOf(el);

    if (syl === this.correct) {
      trackSyl(this.correct, !this.failed);
      this.failed = false;
      el.classList.add(settings.mode === "lanterns" ? "burst" : "open");
      document.querySelectorAll(".door").forEach(d => d !== el && d.classList.add("dim"));
      scoreCorrect({ x, y, statKey: "syllablesOk" });
    } else {
      session.locked = true;
      this.failed = true;
      if (settings.changeOnFail) { trackSyl(this.correct, false); this.failed = false; }
      restartAnim(el, "wrong");
      scoreWrong();
      speak(`Esa es ${sylSay(syl)}. Busca: ${sylSay(this.correct)}`);
      later(() => {
        el.classList.remove("wrong");
        if (settings.changeOnFail) this.next();
        else session.locked = false;
      }, 900);
    }
  },

  key(e) {
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= this.options.length) {
      const el = document.querySelectorAll(".door, .lantern")[n - 1];
      if (el) this.answer(this.options[n - 1], el);
    }
  },
};
