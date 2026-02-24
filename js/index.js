
/* PANEL LATERAL */
const leftColumn = document.getElementById("leftColumn");
const showPanelBtn = document.getElementById("showPanelBtn");
const hidePanelBtn = document.getElementById("hidePanelBtn");

let progress = 0; // porcentaje actual
let clickLocked = false;

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

const rewards = ["premio1.png","premio2.png","premio3.png","premio4.png","premio5.png"];
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

function unlockItem(){
  const item = document.getElementById("item"+score);
  if(!item) return;

  item.classList.add("unlocked");

  if (!item.querySelector("img") && rewards[score-1]) {
    const img = document.createElement("img");
    img.src = 'img/' + rewards[score-1];
    item.insertBefore(img, item.firstChild);
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

  setTimeout(()=>clone.remove(),1500);
}

function showReward(){
  const reward = document.getElementById("rewardImage");

  let index = score-1;
  if(index >= rewards.length){
    index = Math.floor(Math.random()*rewards.length);
  }

  reward.src = 'img/' + rewards[index];
  reward.classList.add("show");

  play("sndPrize");
  darken();

  setTimeout(()=>{
    animateRewardToSidebar();
    reward.classList.remove("show");
    undarken();
  },5000);
}

function newRound(){
  const doors = document.getElementById("doors");
  doors.innerHTML = "";

  const numDoors = parseInt(localStorage.getItem("doorCount") || "5");

  correctSyllable = activeSyllables[Math.floor(Math.random()*activeSyllables.length)];

  const options = new Set([correctSyllable]);
  while(options.size < numDoors){
    options.add(activeSyllables[Math.floor(Math.random()*activeSyllables.length)]);
  }

  [...options].sort(()=>Math.random()-0.5).forEach((syl,i)=>{
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
    play("sndDoor");
    door.classList.add("open");

    // Aumentar progreso
    progress += 20;
    if (progress > 100) progress = 100;
    document.getElementById("progressBar").style.width = progress + "%";

    // Si llega al 100%, premio
    if (progress === 100) {
      showReward();
      progress = 0;
      setTimeout(() => {
        document.getElementById("progressBar").style.width = "0%";
      }, 600);
    }

    // Esperar a que termine la animación antes de permitir clics
    setTimeout(() => {
      newRound();
      clickLocked = false; // 🔓 Desbloquear
    }, 1500);

  } else {

    play("sndWrong");
    door.style.filter = "drop-shadow(0 0 10px red)";
    speak("Has dicho " + syl);

    setTimeout(() => {
      door.style.filter = "none";
      clickLocked = false; // 🔓 Desbloquear tras error
    }, 600);
  }
}


function launchBalloons(){
  const emojis = ["🎈","🎉","🎊"];

  // MENOS GLOBOS (antes 50)
  const total = 25;

  for(let i=0; i<total; i++){
    const b = document.createElement("div");
    b.className = "balloon";

    // EMOJI
    b.textContent = emojis[Math.floor(Math.random()*emojis.length)];

    // MÁS ESPACIADOS (separación mínima entre globos)
    b.style.left = (Math.random()*90 + 5) + "vw"; // evita que se agrupen en los bordes

    // MÁS GRANDES (antes 40–80px)
    b.style.fontSize = (60 + Math.random()*60) + "px";

    // MÁS LENTOS Y SUAVES
    b.style.bottom = "-15vh";
    b.style.animationDuration = (8 + Math.random()*4) + "s";

    // RETRASO ALEATORIO
    b.style.animationDelay = (Math.random()*1.5) + "s";

    // EXPLOSIÓN
    b.onclick = () => {
      b.classList.add("pop");
      play("sndPop");
      setTimeout(()=>b.remove(),250);
    };

    document.body.appendChild(b);

    // ELIMINAR AUTOMÁTICAMENTE
    setTimeout(()=>b.remove(),6000);
  }
}


newRound();

/* SERVICE WORKER */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}