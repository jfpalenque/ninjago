
/* PANEL LATERAL */
const leftColumn = document.getElementById("leftColumn");
const showPanelBtn = document.getElementById("showPanelBtn");
const hidePanelBtn = document.getElementById("hidePanelBtn");

const rewardsDialog = document.getElementById("rewardsDialog");
const rewardsList = document.getElementById("rewardsList");
const showRewardsBtn = document.getElementById("showRewardsBtn");
const closeRewardsBtn = document.getElementById("closeRewardsBtn");
const resetRewardsBtn = document.getElementById("resetRewardsBtn");

const changeOnFailChk = document.getElementById("changeOnFail");

// Cargar estado guardado
changeOnFailChk.checked = JSON.parse(localStorage.getItem("changeOnFail") || "false");

let progress = 0; // porcentaje actual
let clickLocked = false;

let unlockedRewards = JSON.parse(localStorage.getItem("unlockedRewards") || "{}");


const sameVowelChk = document.getElementById("sameVowel");
sameVowelChk.checked = JSON.parse(localStorage.getItem("sameVowel") || "false");

sameVowelChk.onchange = () => {
  localStorage.setItem("sameVowel", sameVowelChk.checked);
};



// Guardar cuando cambie
changeOnFailChk.onchange = () => {
  localStorage.setItem("changeOnFail", changeOnFailChk.checked);
};


hidePanelBtn.onclick = () => {
  leftColumn.classList.add("hidden");
  showPanelBtn.style.display = "block";
  document.getElementById("gameArea").classList.add("fullscreen");
};

showPanelBtn.onclick = () => {
  leftColumn.classList.remove("hidden");
  showPanelBtn.style.display = "none";
  document.getElementById("gameArea").classList.remove("fullscreen");
};

/* SÍLABAS */
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const syllableGroups = {};
letters.forEach(l => {
  syllableGroups[l] = [l+"A", l+"E", l+"I", l+"O", l+"U"];
});

function loadLetterPanel() {
  const container = document.getElementById("lettersContainer");
  container.innerHTML = "";

  letters.forEach(l => {
    const div = document.createElement("div");
    div.className = "letterGroup";

    const chk = document.createElement("input");
    chk.type = "checkbox";
    chk.dataset.letter = l;

    chk.checked = JSON.parse(localStorage.getItem("letter_"+l) || "false");

    chk.onchange = () => {
      localStorage.setItem("letter_"+l, chk.checked);
      updateActiveSyllables();
      newRound();
    };

    const label = document.createElement("label");
    label.textContent = " " + l + " (" + syllableGroups[l].join(" ") + ")";

    div.appendChild(chk);
    div.appendChild(label);
    container.appendChild(div);
  });
}

loadLetterPanel();

let activeSyllables = [];

function updateActiveSyllables() {
  activeSyllables = [];
  letters.forEach(l => {
    if (JSON.parse(localStorage.getItem("letter_"+l) || "false")) {
      activeSyllables.push(...syllableGroups[l]);
    }
  });

  if (activeSyllables.length === 0) {
    activeSyllables = ["PA","PE","PI","PO","PU"];
  }
}

updateActiveSyllables();

/* SELECTOR DE PUERTAS */
const doorCountSelect = document.getElementById("doorCount");
doorCountSelect.value = localStorage.getItem("doorCount") || "5";

doorCountSelect.onchange = () => {
  localStorage.setItem("doorCount", doorCountSelect.value);
  newRound();
};

/* JUEGO */
let correctSyllable = "";
let score = 1;

//const rewards = ["img/premios/premio1.png","img/premios/premio2.png","img/premios/premio3.png","img/premios/premio4.png","img/premios/premio5.png"];
const rewards = Array.from({ length: 31 }, (_, i) => `img/premios/premio${i + 1}.png`);
const ninjaParts = ["ninja1.png","ninja2.png","ninja3.png","ninja4.png","ninja5.png"];

function play(id){
  const snd = document.getElementById(id);
  snd.currentTime = 0;
  snd.play();
}

function speak(text){
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "es-ES";
  u.rate = 0.7;
  speechSynthesis.speak(u);
}

function speakSyllable(){
  speak(correctSyllable);
}

function darken(){
  document.getElementById("darkLayer").style.display = "block";
}

function undarken(){
  document.getElementById("darkLayer").style.display = "none";
}


function unlockItem() {

  let index = Math.floor(Math.random() * rewards.length);
  let wonPrize = rewards[index];   // ejemplo: "img/premios/premio3.png"

  // 🔹 Añadir al inventario agrupado
  if (!unlockedRewards[wonPrize]) {
    unlockedRewards[wonPrize] = 1;
  } else {
    unlockedRewards[wonPrize]++;
  }

  // 🔹 Guardar inventario
  localStorage.setItem("unlockedRewards", JSON.stringify(unlockedRewards));

  // 🔹 Mostrar premio como siempre
  const reward = document.getElementById("rewardImage");
  reward.src = wonPrize;
  reward.classList.add("show");

  play("sndPrize");
  darken();

  setTimeout(() => {
    animateRewardToSidebar();
    reward.classList.remove("show");
    undarken();

    // 🔹 ACTUALIZAR PANEL DE PREMIOS
    renderInventory();

  }, 5000);
}


function renderInventory() {
  const panel = document.getElementById("rewardsList");
  panel.innerHTML = "";

  for (const prize in unlockedRewards) {
    const count = unlockedRewards[prize];

    const item = document.createElement("div");
    item.className = "prizeItem";

    const img = document.createElement("img");
    img.src = prize;
    img.className = "prizeIcon";

    const label = document.createElement("div");
    label.className = "prizeCount";
    label.textContent = "x" + count;

    item.appendChild(img);
    item.appendChild(label);

    panel.appendChild(item);
  }
}







function animateRewardToSidebar(){
  const reward = document.getElementById("rewardImage");
  const target = document.getElementById("item"+score);
  if (!target) return;

  const start = reward.getBoundingClientRect();
  const end = target.getBoundingClientRect();

  const clone = reward.cloneNode(true);
  clone.style.position = "fixed";
  clone.style.left = start.left+"px";
  clone.style.top = start.top+"px";
  clone.style.zIndex = 200;
  clone.style.transform = "scale(1)";
  clone.style.opacity = "1";

  document.body.appendChild(clone);

  setTimeout(()=>{
    clone.style.transition = "1s ease";
    clone.style.left = (end.left+10)+"px";
    clone.style.top = (end.top+10)+"px";
    clone.style.transform = "scale(0.3)";
    clone.style.opacity = "0.2";
  },50);

  // ❌ ESTA LÍNEA ERA EL PROBLEMA
  // unlockItem();

  setTimeout(()=>clone.remove(),1500);
}

function showReward() {
  unlockItem();
}

function newRound(){
  const doors = document.getElementById("doors");
  doors.innerHTML = "";

  const numDoors = parseInt(localStorage.getItem("doorCount") || "5");

  // Elegir sílaba correcta como siempre
  correctSyllable = activeSyllables[Math.floor(Math.random()*activeSyllables.length)];

  let options;

  if (sameVowelChk.checked) {

    // 1. Detectar vocal de la sílaba correcta
    const match = correctSyllable.match(/[AEIOU]/);
    const vowel = match ? match[0] : "A";

    // 2. Filtrar sílabas que tengan esa vocal
    const sameVowelList = activeSyllables.filter(s => s.includes(vowel));

    // 3. Si no hay suficientes sílabas, fallback al modo normal
    if (sameVowelList.length < numDoors) {
      console.warn("No hay suficientes sílabas con la vocal", vowel);
      options = new Set([correctSyllable]);
      while(options.size < numDoors){
        options.add(activeSyllables[Math.floor(Math.random()*activeSyllables.length)]);
      }
      options = [...options];
    } else {
      // 4. Generar opciones con esa vocal
      options = new Set([correctSyllable]);
      while(options.size < numDoors){
        options.add(sameVowelList[Math.floor(Math.random()*sameVowelList.length)]);
      }
      options = [...options];
    }

  } else {

    // Modo normal (tu código original)
    options = new Set([correctSyllable]);
    while(options.size < numDoors){
      options.add(activeSyllables[Math.floor(Math.random()*activeSyllables.length)]);
    }
    options = [...options];
  }

  // Crear puertas
  options.sort(()=>Math.random()-0.5).forEach((syl,i)=>{
    const d = document.createElement("div");
    d.className = "door";

    const img = document.createElement("img");
    img.src = 'img/' + "imagen"+(i+1)+".png";

    const t = document.createElement("div");
    t.className = "syllable";
    t.textContent = syl;

    d.appendChild(img);
    d.appendChild(t);

    d.onclick = ()=>checkDoor(syl,d);

    doors.appendChild(d);
  });

  speakSyllable();
}



function checkDoor(syl, door) {

  // ⛔ Si ya hay un clic en proceso, ignorar
  if (clickLocked) return;

  // 🔒 Bloquear nuevos clics
  clickLocked = true;

  if (syl === correctSyllable) {

    play("sndCorrect");
    //play("sndDoor");
    door.classList.add("open");

    // Aumentar progreso
    progress += 20;
    if (progress > 100) progress = 100;
    document.getElementById("progressBar").style.width = progress + "%";

    // Si llega al 100%, premio
    if (progress === 100) {

      showReward();

      launchBalloons().then(() => {
        // 👉 Aquí empieza la siguiente ronda SOLO cuando los globos han terminado
        progress = 0;
        document.getElementById("progressBar").style.width = "0%";
        score = score + 1;
        newRound();
        clickLocked = false;
      });
      return; // Evita que siga el flujo normal
    }else{
      // Esperar a que termine la animación antes de permitir clics
      setTimeout(() => {
        newRound();
        clickLocked = false; // 🔓 Desbloquear
      }, 1500);
    }

  } else {

    play("sndWrong");
    door.style.filter = "drop-shadow(0 0 10px red)";
    speak("Has dicho " + syl);

    setTimeout(() => {
      door.style.filter = "none";

      // ✔ Si el checkbox está activado → nueva ronda al fallar
      if (changeOnFailChk.checked) {
        newRound();
      }

      clickLocked = false; // 🔓 Desbloquear tras error
    }, 600);
  }

}


function launchBalloons() { 
  return new Promise(resolve => {
    const emojis = ["🎈","🎉","🎊"];

    // MENOS GLOBOS (antes 50)
    const total = 15;

    for(let i=0; i<total; i++){
      const b = document.createElement("div");
      b.className = "balloon";

      // EMOJI
      b.textContent = emojis[Math.floor(Math.random()*emojis.length)];

      // MÁS ESPACIADOS (separación mínima entre globos)
      b.style.left = (Math.random()*90 + 5) + "vw"; // evita que se agrupen en los bordes

      // MÁS GRANDES (antes 40–80px)
      b.style.fontSize = (80 + Math.random()*80) + "px";

      // MÁS LENTOS Y SUAVES
      b.style.bottom = "-15vh";
      b.style.animationDuration = (4 + Math.random()*4) + "s";

      // RETRASO ALEATORIO
      b.style.animationDelay = (Math.random()*1.5) + "s";
     
      b.addEventListener("mousedown", popBalloon);
      b.addEventListener("touchstart", popBalloon);

      document.body.appendChild(b);

      // ELIMINAR AUTOMÁTICAMENTE
      setTimeout(()=>b.remove(),6000);
    }
    // ⏳ Esperar a que todos los globos hayan terminado
    setTimeout(resolve, 6000);
  });
}

function popBalloon(e) {
  e.preventDefault();
  const balloon = e.currentTarget;
  balloon.classList.add("pop");
  play("sndPop");
  setTimeout(() => balloon.remove(), 250);
}

newRound();

 

closeRewardsBtn.onclick = () => {
  rewardsDialog.style.display = "none";
};


/* SERVICE WORKER */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("js/sw.js");
}

showRewardsBtn.onclick = () => {
  rewardsList.innerHTML = "";

  // Si no hay premios
  if (Object.keys(unlockedRewards).length === 0) {
    rewardsList.innerHTML = "<p>Aún no tienes premios.</p>";
  } else {

    // Mostrar premios agrupados
    for (const prize in unlockedRewards) {
      const count = unlockedRewards[prize];

      const row = document.createElement("div");
      row.className = "prizeRow";

      const img = document.createElement("img");
      img.src = prize;
      img.className = "prizeIcon";

      const label = document.createElement("span");
      label.textContent = "x" + count;

      row.appendChild(img);
      row.appendChild(label);

      rewardsList.appendChild(row);
    }
  }

  rewardsDialog.style.display = "flex";
};


resetRewardsBtn.onclick = () => {
  unlockedRewards = [];
  localStorage.removeItem("unlockedRewards");
  rewardsList.innerHTML = "<p>No tienes premios.</p>";
};
async function loadAutoVersion() {
  try {
    //const response = await fetch("script.js", { method: "HEAD" });
    //const response = await fetch("../index.html", { method: "HEAD" });
    const response = await fetch("/ninjago/index.html", { method: "HEAD" });
    
    const lastModified = response.headers.get("Last-Modified");

    if (lastModified) {
      const version = new Date(lastModified).toLocaleString();
      document.getElementById("versionBox").textContent = "Versión: " + version;
    } else {
      document.getElementById("versionBox").textContent = "Versión: desconocida";
    }
  } catch (e) {
    document.getElementById("versionBox").textContent = "Versión: error";
  }
}

loadAutoVersion();
