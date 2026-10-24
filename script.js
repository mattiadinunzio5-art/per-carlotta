// PERSONALIZZA QUI I CONTENUTI DEL SITO
const CONFIG = {
  startDate: "", // Formato: "2024-06-15". Lascia vuoto finché non vuoi mostrare il contatore.
  finalMessage: "Carlotta, se potessi scegliere ancora, sceglierei di regalarti questo sorriso un'altra volta.",
  // Per personalizzare la lettera, modifica i paragrafi nella sezione letterBody di index.html.
};

const screens = [...document.querySelectorAll(".screen")];
function showScreen(id) {
  screens.forEach(s => s.classList.toggle("active", s.id === id));
  window.scrollTo({top:0, behavior:"smooth"});
}
document.querySelectorAll("[data-go]").forEach(el => el.addEventListener("click", () => {
  const target = el.dataset.go;
  if (target === "intro") {
    document.getElementById("introEnvelope").classList.remove("open");
    document.getElementById("finalEnvelope").classList.remove("open");
  }
  showScreen(target);
}));
const introEnvelope = document.getElementById("introEnvelope");
function openIntro() {
  introEnvelope.classList.add("open");
  setTimeout(() => showScreen("menu"), 1050);
}
document.getElementById("openIntro").addEventListener("click", openIntro);
introEnvelope.addEventListener("click", openIntro);
introEnvelope.addEventListener("keydown", e => { if(e.key==="Enter"||e.key===" "){e.preventDefault();openIntro();} });

document.getElementById("finalMessage").textContent = CONFIG.finalMessage;
const finalEnvelope = document.getElementById("finalEnvelope");
function openFinal() { finalEnvelope.classList.add("open"); }
finalEnvelope.addEventListener("click", openFinal);
finalEnvelope.addEventListener("keydown", e => { if(e.key==="Enter"||e.key===" "){e.preventDefault();openFinal();} });

const audio = document.getElementById("songAudio");
const vinyl = document.getElementById("vinyl");
const playButton = document.getElementById("playSong");
const audioHint = document.getElementById("audioHint");
playButton.addEventListener("click", async () => {
  if (audio.paused) {
    try {
      await audio.play();
      vinyl.classList.add("spinning");
      playButton.textContent = "Ⅱ Metti in pausa";
      audioHint.textContent = "La musica è in riproduzione.";
    } catch (e) {
      audioHint.textContent = "Aggiungi il file public/audio/nostra-canzone.mp3 e riprova.";
    }
  } else {
    audio.pause();
    vinyl.classList.remove("spinning");
    playButton.textContent = "▶ Riprendi la canzone";
  }
});
audio.addEventListener("ended", () => {
  vinyl.classList.remove("spinning");
  playButton.textContent = "▶ Ascolta di nuovo";
});
audio.addEventListener("error", () => { audioHint.textContent = "Per ascoltare la musica, inserisci il brano in public/audio/nostra-canzone.mp3."; });

document.querySelectorAll("[data-photo]").forEach(btn => btn.addEventListener("click", () => {
  document.getElementById("photoModal").classList.add("open");
  document.getElementById("photoModal").setAttribute("aria-hidden","false");
}));
function closeModal() {
  document.getElementById("photoModal").classList.remove("open");
  document.getElementById("photoModal").setAttribute("aria-hidden","true");
}
document.getElementById("closeModal").addEventListener("click", closeModal);
document.getElementById("photoModal").addEventListener("click", e => { if(e.target.id==="photoModal") closeModal(); });
document.addEventListener("keydown", e => { if(e.key==="Escape") closeModal(); });

function updateCounter() {
  const node = document.getElementById("counter");
  if (!CONFIG.startDate) return;
  const start = new Date(CONFIG.startDate + "T00:00:00");
  if (Number.isNaN(start.getTime()) || start > new Date()) {
    node.innerHTML = "<span>—</span><small>controlla la data in script.js</small>";
    return;
  }
  const now = new Date();
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();
  if (days < 0) { months--; days += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
  if (months < 0) { years--; months += 12; }
  node.innerHTML = `<span>${years ? years + " anni · " : ""}${months} mesi · ${days} giorni</span><small>e tanti momenti ancora da vivere</small>`;
}
updateCounter();

const heartContainer = document.getElementById("floatingHearts");
if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const symbols = ["♥","♡","✦"];
  setInterval(() => {
    const heart = document.createElement("span");
    heart.className = "floating-heart";
    heart.textContent = symbols[Math.floor(Math.random()*symbols.length)];
    heart.style.left = Math.random()*100 + "%";
    heart.style.fontSize = (10 + Math.random()*18) + "px";
    heart.style.animationDuration = (9 + Math.random()*8) + "s";
    heartContainer.appendChild(heart);
    setTimeout(() => heart.remove(), 18000);
  }, 900);
}
