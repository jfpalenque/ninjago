/* =========================================================
   JUEGO 8: LETRAS
   Como «Construye», pero letra a letra: se ve el dibujo,
   se oye la palabra y hay que escribirla tocando sus letras.
   ========================================================= */
"use strict";

const SPELL_MAX = 7;   // letras como mucho: más no caben bien en un móvil

const SpellGame = {
  id: "letras",
  view: "viewSpell",
  deck: makeDeck(),
  word: null,
  letters: [],
  filled: 0,
  mistakes: 0,

  enter() { this.deck.reset(); this.next(); },
  leave() { $("spellTiles").innerHTML = ""; },
  listen() { if (this.word) speak(this.word.word, { rate: Math.min(settings.rate, .8) }); },

  next() {
    let w = this.deck.next();
    for (let i = 0; i < 10 && (w.word.length > SPELL_MAX || w.word.length < 2); i++) w = this.deck.next();
    this.word = w;
    this.letters = [...w.word];
    this.filled = 0;
    this.mistakes = 0;

    showWordPic($("spellEmoji"), w);
    $("spellCard").classList.remove("good");
    restartAnim($("spellCard"), "enter");
    $("spellSlots").innerHTML = this.letters.map(l =>
      `<span class="slot">${settings.buildHint ? `<i class="hint">${esc(show(l))}</i>` : ""}</span>`).join("");

    const extra = settings.buildExtra
      ? shuffle([..."aeioulmnprst"].filter(l => !this.letters.includes(l))).slice(0, 2)
      : [];
    const box = $("spellTiles");
    box.innerHTML = "";
    shuffle([...this.letters, ...extra]).forEach((l, i) => {
      const t = document.createElement("button");
      t.className = "tile";
      t.style.setProperty("--c", TILE_COLORS[i % TILE_COLORS.length]);
      t.style.setProperty("--i", i);
      t.textContent = show(l);
      t.dataset.letter = l;
      t.addEventListener("click", () => this.tap(t));
      box.appendChild(t);
    });

    $("skipSpellBtn").classList.remove("show");
    say("¡Escribe la palabra! 🔤");
    session.locked = false;
    later(() => this.listen(), 400);
  },

  tap(tile) {
    if (session.locked || tile.classList.contains("used")) return;
    const needed = this.letters[this.filled];

    if (tile.dataset.letter === needed) {
      const slot = $("spellSlots").children[this.filled];
      slot.innerHTML = esc(show(needed));
      slot.style.setProperty("--c", getComputedStyle(tile).getPropertyValue("--c"));
      slot.classList.add("filled");
      tile.classList.add("used");
      $("spellTiles").querySelectorAll(".help").forEach(t => t.classList.remove("help"));
      play("sndPop", .4);
      this.filled++;

      if (this.filled === this.letters.length) {
        session.locked = true;
        trackWord(this.word.word, this.mistakes === 0);
        $("spellCard").classList.add("good");
        revealWordPic($("spellEmoji"), this.word);
        later(() => {
          speak(this.word.word);
          const [x, y] = centerOf($("spellSlots"));
          scoreCorrect({ x, y, statKey: "spellOk", delay: 2000 });
        }, 400);
      }
    } else {
      this.mistakes++;
      restartAnim(tile, "wrong");
      play("sndWrong", .5);
      mascotReact("sad");
      say(this.filled === 0 ? "¿Con qué letra empieza? 🤔" : "Esa no va ahora. ¡Escucha! 👂", "bad");
      session.streak = 0;
      renderHud();
      later(() => this.listen(), 400);
      // Si cuesta, la letra que toca se pone a saltar
      if (this.mistakes >= 2) {
        [...$("spellTiles").children].find(t => t.dataset.letter === needed && !t.classList.contains("used"))?.classList.add("help");
      }
      if (this.mistakes >= 4) $("skipSpellBtn").classList.add("show");
    }
  },

  skip() {
    if (session.locked) return;
    this.next();
  },
};
