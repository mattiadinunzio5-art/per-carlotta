// PERSONALIZZA QUI I CONTENUTI DEL SITO
// Tutto quello che vedi sul sito si cambia da qui: non serve toccare index.html.
const CONFIG = {
  // Parola segreta per aprire la busta (es. un soprannome o la vostra data). Lascia "" per non chiederla.
  password: "",
  passwordHint: "suggerimento: qualcosa che sappiamo solo noi",

  // Il bigliettino che esce dalla busta iniziale quando si apre.
  introLetter: { title: "Per Carlotta,", text: "sei l'inaspettato che aspettavo di più." },

  // Il giorno in cui è cominciato tutto. Formato: "2024-06-15". Lascia "" finché non vuoi mostrare il contatore.
  startDate: "2026-05-30",

  // Foto: metti i file in public/images/ e scrivi il percorso in src (es. "public/images/foto1.jpg").
  // Quando la foto viene aperta compaiono luogo (place) e data (date), e sotto il pensiero (note).
  // Si possono lasciare vuoti. Puoi aggiungere quante foto vuoi.
  photos: [
    { src: "public/images/foto1.jpg", caption: "Un nostro ricordo da custodire", place: "Como", date: "30 maggio 2026", note: "Il nostro primo viaggio assieme, in cui abbiamo imparato a conoscerci." },
    { src: "public/images/foto2.jpg", caption: "Quel momento speciale", place: "Milano", date: "16 luglio 2026", note: "Su quella fantastica terrazza da cui vedevamo tutta Milano." },
    { src: "public/images/foto3.jpg", caption: "Una giornata assieme", place: "Roma", date: "8 settembre 2026", note: "Il viaggio pianificato in una splendida città con l'amore della mia vita." },
    { src: "public/images/foto4.jpg", caption: "Il mio posto preferito", place: "Milano", date: "31 agosto 2026", note: "In realtà il mio posto preferito è quando sono a cena con te." },
  ],

  // Le tappe della vostra storia. date è libera (es. "15 giugno 2024"), puoi lasciarla vuota.
  timeline: [
    { icon: "♥", date: "22 novembre 2025", title: "Il primo capitolo", text: "Il giorno in cui le nostre strade si sono incrociate." },
    { icon: "✦", date: "8 settembre 2026 · a Roma", title: "Un momento speciale", text: "Un ricordo che porterò sempre con me." },
    { icon: "∞", date: "13–16 novembre 2026 · a Marsiglia", title: "Tutto quello che verrà", text: "La parte più bella della storia deve ancora essere scritta." },
  ],

  // La canzone: un link di YouTube (youtube), oppure il link "embed" di Spotify
  // (es. "https://open.spotify.com/embed/track/ID"), oppure un file in public/audio/.
  // Se c'è un link, il file viene ignorato.
  song: {
    file: "public/audio/nostra-canzone.mp3",
    title: "Stand by Me",
    artist: "Ben E. King",
    spotify: "",
    youtube: "https://youtube.com/watch?v=S_mZV1gWXWQ",
  },

  // La lettera: ogni riga è un paragrafo.
  letter: [
    "Non so bene da dove cominciare, perché ogni volta che provo a scriverti quello che sento le parole mi sembrano troppo piccole. Allora parto dall'inizio. Il 22 novembre 2025 le nostre strade si sono incrociate, e io non potevo immaginare quanto sarebbe cambiato tutto. Sei stata l'inaspettato che aspettavo di più: sei arrivata senza fare rumore e in poco tempo sei diventata la parte più bella delle mie giornate. Poi c'è stato il nostro primo bacio, al calorifero, dopo una serie interminabile di flirt e provocazioni che erano la rappresentazione totale del nostro modo di essere in quel periodo. Forse non il posto più romantico del mondo, ma per me è diventato il più rappresentativo: non me lo dimenticherò mai. A Como, nel nostro primo viaggio insieme, abbiamo imparato a conoscerci davvero. È lì che ho capito che eri speciale, a letto quella notte e che con te volevo vedere tutto il resto. Da allora ogni ricordo con te è diventato uno dei miei preferiti: la terrazza da cui vedevamo tutta Milano, quella volta a Parco Sempione, Roma, pianificata insieme e vissuta mano nella mano. E le nostre cene ogni trenta del mese, perché il mio posto preferito al mondo, in realtà, è quando sono a cena con te. Adesso ci aspetta Marsiglia, e non vedo l'ora di aggiungerla alla nostra storia. Mi piacciono le tue fossette, che riescono a cambiarmi la giornata. Il modo in cui ti entusiasmi per tutto, come nessun altro al mondo. Le facce buffe, il musino, il tuo modo di ridere che mi lascia a bocca aperta ad ammirarti. Il tuo profumo che sa proprio della persona che voglio sposare, e quanto sei bella appena sveglia quando ti stropicci gli occhietti. Mi piace il nostro mondo, fatto di cose che capiamo solo noi: le pappardelle, le canzoni che mi fanno pensare a te. Ma le cose che amo di te le trovi già nel barattolo. Qui volevo dirti l'altra metà, quella che in un bigliettino non ci sta: come sono io da quando ci sei tu. Sono più calmo, più paziente, meno di corsa. Mi accorgo di dettagli che prima non avrei mai guardato, e mi ritrovo a sorridere da solo nei momenti più a caso della giornata, solo perché mi è tornata in mente una tua faccia o una cosa che hai detto. Non ti prometto cose enormi, quelle le sanno promettere tutti. Ti prometto quelle piccole, che poi sono le più difficili: esserci anche nei giorni normali, non solo in quelli speciali; ascoltarti anche quando sono stanco; ricordarmi le cose che ti rendono felice e fartele trovare senza che tu debba chiederle. Ho provato più volte a trovare un modo per chiudere questa lettera e non ci sono riuscito. Forse è giusto così: con te non ho nessuna voglia di mettere un punto.",
  ],
  letterSign: "Con tutto il mio cuore,",
  // La firma a mano sotto la lettera (un'immagine in public/images/). Lascia "" per non mostrarla.
  signature: "public/images/firma.svg",

  // I bigliettini del barattolo: escono in ordine casuale, tranne l'ultimo della lista che esce sempre per ultimo.
  reasons: [
    "Perché quelle fossette riescono a cambiarmi la giornata.",
    "Perché quando sono con te mi sento al sicuro.",
    "Perché ogni tuo messaggio mi fa sorridere come uno scemo.",
    "Perché quel giorno, a Como, ho capito che eri speciale.",
    "Perché ridere con te è una delle mie cose preferite.",
    "Perché hai un cuore più grande di quanto tu creda: ogni volta che fai qualcosa di piccolo per me vorrei gridarti quanto sono fiero.",
    "Perché con un tuo abbraccio mi si ferma il mondo.",
    "Perché il tuo profumo mi resta addosso.",
    "Perché insieme siamo tranquilli.",
    "Perché sei forte anche quando pensi di non esserlo.",
    "Perché nessuno al mondo si entusiasma come te.",
    "Perché con te posso essere me stesso, senza filtri.",
    "Perché mi piace quando mi chiami amore.",
    "Perché non litighiamo.",
    "Perché sei bellissima, e non solo fuori.",
    "Perché mi fai venire voglia di essere una persona migliore ogni giorno.",
    "Perché fai le facce più buffe del mondo (tipo il musino).",
    "Perché ogni volta che sento Scudo penso a te.",
    "Perché il tuo modo di ridere è contagioso.",
    "Perché con te il silenzio non è mai imbarazzante.",
    "Perché anche fare niente con te diventa speciale.",
    "Perché con te le cose semplici diventano ricordi.",
    "Perché sei gentile con tutti, anche se non tutti lo capiscono, ma io lo vedo e ne sono stra orgoglioso.",
    "Perché ogni volta che ci salutiamo conto già i minuti per rivederti.",
    "Perché le tue mani stanno perfette nelle mie.",
    "Perché quella volta a Parco Sempione è uno dei miei ricordi più belli.",
    "Perché sei unica, e non assomigli a nessun'altra.",
    "Perché accanto a te anche le giornate storte finiscono bene.",
    "Perché sei la prima persona a cui voglio raccontare le cose belle.",
    "Perché abbiamo un mondo tutto nostro che capiamo solo noi.",
    "Perché i tuoi occhi sono buoni.",
    "Perché mi fai sentire importante.",
    "Perché adoro quando ti arrabbi e poi non riesci a restare seria.",
    "Perché quando mi chiami amoremio mi si scioglie il cuore.",
    "Perché sei testarda nel modo più dolce del mondo.",
    "Perché con te il tempo vola sempre troppo in fretta.",
    "Perché ogni volta che ti guardo mi sembra la prima.",
    "Perché quando sei felice si vede da lontano.",
    "Perché hai sempre la parola giusta al momento giusto.",
    "Perché sai capirmi anche quando non dico niente.",
    "Perché pappardelle lo sappiamo solo noi due.",
    "Perché mi hai insegnato cose che nessun altro avrebbe potuto insegnarmi.",
    "Perché mi piace guardarti quando non te ne accorgi.",
    "Perché sei coraggiosa, anche nelle piccole cose.",
    "Perché quando mi guardi mi sento fortunato.",
    "Perché il primo bacio al calorifero non me lo dimenticherò mai.",
    "Perché sei bella appena sveglia, e lo sai anche se dici di no.",
    "Perché mi fai ridere anche quando non ne ho voglia.",
    "Perché sogno un futuro e tu ci sei sempre dentro.",
    "Perché sei tu. E non c'è bisogno di nessun altro motivo.",
  ],

  // I buoni d'amore che Carlotta può riscattare.
  coupons: [
    { icon: "🍝", title: "Una cena romantica", text: "Il posto lo scegli tu, il resto ci penso io." },
    { icon: "🫂", title: "Un abbraccio infinito", text: "Valido in qualsiasi momento, senza limiti di durata." },
    { icon: "☕", title: "Colazione a letto", text: "Servita con calma, e con un bacio incluso." },
    { icon: "🎬", title: "Serata film", text: "Scegli tu il film, niente lamentele. Copertina e snack compresi." },
    { icon: "👑", title: "Una giornata da regina", text: "Per un giorno intero decidi tutto tu." },
    { icon: "🗺️", title: "Una gita a sorpresa", text: "Tu prepari lo zaino, io la destinazione." },
  ],

  // L'ultima sorpresa: finalPaper è il foglietto che esce dalla busta, finalMessage compare sotto.
  // In finalMessage "\n" va a capo.
  finalPaper: "Sei l'amore più grande che potesse capitarmi.",
  finalMessage: "Tanti auguri, piccola mia!\nPer sempre tuo,\nMattia ♥",
};

const SECTIONS = ["memories", "time", "song", "letter", "reasons", "coupons"];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = id => document.getElementById(id);

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem("carlotta-" + key)) ?? fallback; } catch (e) { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem("carlotta-" + key, JSON.stringify(value)); } catch (e) {}
}
function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// --- Navigazione e cuori raccolti ---
const screens = [...document.querySelectorAll(".screen")];
const visited = new Set(load("visited", []).filter(id => SECTIONS.includes(id)));
const screenHooks = {};

function showScreen(id) {
  screens.forEach(s => s.classList.toggle("active", s.id === id));
  window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  if (SECTIONS.includes(id) && !visited.has(id)) {
    visited.add(id);
    save("visited", [...visited]);
  }
  if (id === "menu") renderProgress();
  if (screenHooks[id]) screenHooks[id]();
}

function renderProgress() {
  $("heartProgress").innerHTML = SECTIONS.map(id =>
    `<span class="${visited.has(id) ? "got" : ""}">${visited.has(id) ? "♥" : "♡"}</span>`).join("") +
    `<small>${visited.size} di ${SECTIONS.length} cuori raccolti</small>`;
  document.querySelectorAll(".surprise-card").forEach(card => card.classList.toggle("seen", visited.has(card.dataset.go)));
  const unlocked = visited.size === SECTIONS.length;
  $("finalLink").textContent = unlocked ? "♥ Apri l'ultima sorpresa →" : "🔒 L'ultima sorpresa";
  $("finalLink").classList.toggle("unlocked", unlocked);
  $("finalLock").textContent = "";
}

document.querySelectorAll("[data-go]").forEach(el => el.addEventListener("click", () => {
  const target = el.dataset.go;
  if (target === "intro") {
    $("introEnvelope").classList.remove("open");
    $("finalEnvelope").classList.remove("open");
    $("finalMessage").classList.remove("shown");
    $("finalHint").hidden = false;
  }
  showScreen(target);
}));

$("finalLink").addEventListener("click", () => {
  const missing = SECTIONS.length - visited.size;
  if (missing === 0) return showScreen("final");
  $("finalLock").textContent = `Ti ${missing === 1 ? "manca ancora 1 cuore" : `mancano ancora ${missing} cuori`}. Apri tutte le sorprese e si sbloccherà ♥`;
});

// --- Busta iniziale e parola segreta ---
const introEnvelope = $("introEnvelope");
$("introLetterTitle").textContent = CONFIG.introLetter.title;
$("introLetterText").textContent = CONFIG.introLetter.text;
let unlockedIntro = !CONFIG.password;
const normalize = text => text.trim().toLowerCase().replace(/\s+/g, " ");

function openIntro() {
  if (!unlockedIntro) {
    $("secretForm").hidden = false;
    $("openIntro").hidden = true;
    $("secretInput").focus();
    return;
  }
  if (introEnvelope.classList.contains("open")) return;
  introEnvelope.classList.add("open");
  // lascia il tempo di leggere il bigliettino prima di passare alle sorprese
  setTimeout(() => showScreen("menu"), reduceMotion ? 2500 : 4500);
}
$("openIntro").addEventListener("click", openIntro);
introEnvelope.addEventListener("click", openIntro);
introEnvelope.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openIntro(); } });
$("secretHint").textContent = CONFIG.passwordHint;
$("secretForm").addEventListener("submit", e => {
  e.preventDefault();
  if (normalize($("secretInput").value) === normalize(CONFIG.password)) {
    unlockedIntro = true;
    $("secretForm").hidden = true;
    burstHearts();
    openIntro();
  } else {
    $("secretForm").classList.remove("wrong");
    void $("secretForm").offsetWidth;
    $("secretForm").classList.add("wrong");
    $("secretHint").textContent = "Mmm, non è quella… riprova ♥";
  }
});

// --- Ricordi ---
const placeholderStyles = ["", "blush", "pale", "dark"];
const placeholderIcons = ["✿", "♥", "☼", "♡"];
$("photoGrid").innerHTML = CONFIG.photos.map((photo, i) => `
  <button class="polaroid ${i % 2 ? "tilt-right" : "tilt-left"}" data-photo="${i}">
    ${photo.src
      ? `<img src="${escapeHtml(photo.src)}" alt="${escapeHtml(photo.caption || "Un nostro ricordo")}" loading="lazy">`
      : `<div class="photo-placeholder ${placeholderStyles[i % 4]}"><span>${placeholderIcons[i % 4]}</span><small>PRESTO UNA FOTO</small></div>`}
    <span class="photo-caption">${escapeHtml(photo.caption)}</span>
  </button>`).join("");

const modal = $("photoModal");
function photoMeta(photo) {
  const parts = [photo.place && `📍 ${photo.place}`, photo.date && `🗓️ ${photo.date}`].filter(Boolean);
  return parts.length ? `<p class="modal-meta">${parts.map(escapeHtml).join(" · ")}</p>` : "";
}
document.querySelectorAll("[data-photo]").forEach(btn => btn.addEventListener("click", () => {
  const photo = CONFIG.photos[btn.dataset.photo];
  $("modalContent").innerHTML = photo.src
    ? `<img src="${escapeHtml(photo.src)}" alt="${escapeHtml(photo.caption)}"><p class="modal-caption">${escapeHtml(photo.caption)}</p>${photoMeta(photo)}${photo.note ? `<p>${escapeHtml(photo.note)}</p>` : ""}`
    : `<span>♥</span><p class="modal-caption">${escapeHtml(photo.caption)}</p><p>${escapeHtml(photo.note || "Qui presto ci sarà una nostra foto speciale.")}</p>`;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
}));
function closeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}
$("closeModal").addEventListener("click", closeModal);
modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

// --- Il nostro tempo ---
$("timeline").innerHTML = CONFIG.timeline.map(item => `
  <div class="timeline-item"><span class="timeline-dot">${escapeHtml(item.icon || "♥")}</span><div>
    ${item.date ? `<em class="timeline-date">${escapeHtml(item.date)}</em>` : ""}
    <strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.text)}</p>
  </div></div>`).join("");

const start = CONFIG.startDate ? new Date(CONFIG.startDate + "T00:00:00") : null;
function updateCounter() {
  const node = $("counter");
  if (!start) return;
  const now = new Date();
  if (Number.isNaN(start.getTime()) || start > now) {
    node.innerHTML = "<span>—</span><small>controlla la data in script.js</small>";
    return;
  }
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();
  if (days < 0) { months--; days += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
  if (months < 0) { years--; months += 12; }
  node.innerHTML = `<span>${years ? years + (years === 1 ? " anno · " : " anni · ") : ""}${months} ${months === 1 ? "mese" : "mesi"} · ${days} ${days === 1 ? "giorno" : "giorni"}</span><small>e ogni secondo conta</small>`;

  const diff = now - start;
  $("clockRow").hidden = false;
  $("cDays").textContent = Math.floor(diff / 864e5).toLocaleString("it-IT");
  $("cHours").textContent = String(Math.floor(diff / 36e5) % 24).padStart(2, "0");
  $("cMinutes").textContent = String(Math.floor(diff / 6e4) % 60).padStart(2, "0");
  $("cSeconds").textContent = String(Math.floor(diff / 1e3) % 60).padStart(2, "0");

  let next = new Date(now.getFullYear(), start.getMonth(), start.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (next < today) next = new Date(now.getFullYear() + 1, start.getMonth(), start.getDate());
  const toGo = Math.round((next - today) / 864e5);
  $("anniversary").textContent = toGo === 0
    ? "Oggi è il nostro anniversario ♥"
    : `Mancano ${toGo} ${toGo === 1 ? "giorno" : "giorni"} al nostro prossimo anniversario ♥`;
}
updateCounter();
if (start) setInterval(updateCounter, 1000);

// --- La nostra canzone ---
const audio = $("songAudio");
const vinyl = $("vinyl");
const playButton = $("playSong");
const audioHint = $("audioHint");
const song = CONFIG.song;
if (song.title) $("songTitle").innerHTML = `<b>${escapeHtml(song.title)}</b>${song.artist ? ` · ${escapeHtml(song.artist)}` : ""}`;
// accetta i link youtube.com/watch?v=ID, youtu.be/ID e youtube.com/shorts/ID
const youtubeId = (song.youtube || "").match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{11})/)?.[1];
if (youtubeId || song.spotify) {
  playButton.hidden = true;
  $("songEmbed").hidden = false;
  $("songEmbed").innerHTML = youtubeId
    ? `<iframe class="youtube" src="https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&playsinline=1" width="100%" frameborder="0" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen loading="lazy" title="La nostra canzone"></iframe>`
    : `<iframe src="${escapeHtml(song.spotify)}" width="100%" height="152" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" title="La nostra canzone"></iframe>`;
  vinyl.classList.add("spinning", "slow");
  $("tonearm").classList.add("on");
} else {
  audio.src = song.file;
}
function setPlaying(playing) {
  vinyl.classList.toggle("spinning", playing);
  $("tonearm").classList.toggle("on", playing);
}
playButton.addEventListener("click", async () => {
  if (audio.paused) {
    try {
      await audio.play();
      setPlaying(true);
      playButton.textContent = "Ⅱ Metti in pausa";
      audioHint.textContent = "Chiudi gli occhi e pensa a noi ♥";
    } catch (e) {
      audioHint.textContent = "La canzone arriverà presto… ♥";
    }
  } else {
    audio.pause();
    setPlaying(false);
    playButton.textContent = "▶ Riprendi la canzone";
  }
});
audio.addEventListener("ended", () => {
  setPlaying(false);
  playButton.textContent = "▶ Ascolta di nuovo";
});
audio.addEventListener("error", () => { if (!song.spotify && !youtubeId) audioHint.textContent = "La canzone arriverà presto… ♥"; });

// --- La lettera, scritta lettera per lettera ---
$("letterSign").firstChild.textContent = CONFIG.letterSign + " ";
if (CONFIG.signature) { $("letterSignature").src = CONFIG.signature; $("letterSignature").hidden = false; }
const letterBody = $("letterBody");
let letterTimer = null;
let letterDone = false;
function finishLetter() {
  clearTimeout(letterTimer);
  letterBody.innerHTML = CONFIG.letter.map(p => `<p>${escapeHtml(p)}</p>`).join("");
  letterDone = true;
  $("letterPaper").classList.add("done");
  $("letterHint").hidden = true;
}
function typeLetter() {
  if (letterDone || letterTimer) return;
  if (reduceMotion) return finishLetter();
  letterBody.innerHTML = "";
  let p = 0, c = 0, node = null;
  const step = () => {
    if (p >= CONFIG.letter.length) return finishLetter();
    if (!node) { node = document.createElement("p"); node.className = "typing"; letterBody.appendChild(node); }
    const text = CONFIG.letter[p];
    node.textContent = text.slice(0, ++c);
    if (c >= text.length) { node.classList.remove("typing"); node = null; p++; c = 0; letterTimer = setTimeout(step, 550); }
    else letterTimer = setTimeout(step, /[,.;:!?]/.test(text[c - 1]) ? 260 : 32);
  };
  step();
}
screenHooks.letter = typeLetter;
$("letterPaper").addEventListener("click", () => { if (!letterDone) finishLetter(); });

// --- Il barattolo dei perché ---
let reasonOrder = [];
let reasonsSeen = load("reasons-seen", 0);
$("jarNotes").innerHTML = CONFIG.reasons.map((_, i) =>
  `<i style="--x:${(i * 37) % 80 + 6}%;--y:${(i * 23) % 55 + 30}%;--r:${(i * 47) % 70 - 35}deg"></i>`).join("");
function updateReasonCount() {
  $("reasonCount").textContent = reasonsSeen
    ? `Hai letto ${Math.min(reasonsSeen, CONFIG.reasons.length)} bigliettini su ${CONFIG.reasons.length}${reasonsSeen >= CONFIG.reasons.length ? ". E sono solo l'inizio ♥" : ""}`
    : "";
}
$("jar").addEventListener("click", () => {
  if (!reasonOrder.length) {
    const last = CONFIG.reasons.length - 1;
    const rest = CONFIG.reasons.map((_, i) => i).slice(0, last);
    for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [rest[i], rest[j]] = [rest[j], rest[i]]; }
    reasonOrder = [last, ...rest];
  }
  const reason = CONFIG.reasons[reasonOrder.pop()];
  const note = $("reasonNote");
  note.classList.remove("pop");
  void note.offsetWidth;
  note.innerHTML = `<p>${escapeHtml(reason)}</p>`;
  note.classList.add("pop");
  $("jar").classList.remove("shake");
  void $("jar").offsetWidth;
  $("jar").classList.add("shake");
  reasonsSeen++;
  save("reasons-seen", reasonsSeen);
  updateReasonCount();
});
updateReasonCount();

// --- Buoni d'amore ---
const redeemed = load("coupons", {});
function renderCoupons() {
  $("couponList").innerHTML = CONFIG.coupons.map((coupon, i) => `
    <button class="coupon ${redeemed[i] ? "used" : ""}" data-coupon="${i}">
      <span class="coupon-icon">${escapeHtml(coupon.icon)}</span>
      <span class="coupon-text"><strong>${escapeHtml(coupon.title)}</strong><small>${escapeHtml(coupon.text)}</small></span>
      <span class="coupon-stub">${redeemed[i] ? `usato<br>${escapeHtml(redeemed[i])}` : "valido<br>per sempre"}</span>
      ${redeemed[i] ? `<span class="coupon-stamp">RISCATTATO ♥</span>` : ""}
    </button>`).join("");
  document.querySelectorAll("[data-coupon]").forEach(btn => btn.addEventListener("click", () => {
    const i = btn.dataset.coupon;
    if (redeemed[i]) return;
    if (!confirm(`Vuoi usare il buono "${CONFIG.coupons[i].title}"? Fammelo sapere e lo mantengo ♥`)) return;
    redeemed[i] = new Date().toLocaleDateString("it-IT");
    save("coupons", redeemed);
    renderCoupons();
    burstHearts();
  }));
}
renderCoupons();

// --- Ultima sorpresa ---
const finalEnvelope = $("finalEnvelope");
function openFinal() {
  if (finalEnvelope.classList.contains("open")) return;
  finalEnvelope.classList.add("open");
  $("finalHint").hidden = true;
  setTimeout(() => { $("finalMessage").classList.add("shown"); burstHearts(); }, 700);
}
$("finalMessage").textContent = CONFIG.finalMessage;
$("finalPaperText").textContent = CONFIG.finalPaper;
finalEnvelope.addEventListener("click", openFinal);
finalEnvelope.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openFinal(); } });

// --- Effetti: esplosione di cuori e cuori che salgono ---
function burstHearts() {
  if (reduceMotion) return;
  const burst = $("burst");
  for (let i = 0; i < 36; i++) {
    const heart = document.createElement("span");
    const angle = Math.random() * Math.PI * 2;
    const distance = 120 + Math.random() * 220;
    heart.textContent = Math.random() > .3 ? "♥" : "✦";
    heart.style.setProperty("--dx", Math.cos(angle) * distance + "px");
    heart.style.setProperty("--dy", Math.sin(angle) * distance - 80 + "px");
    heart.style.fontSize = 12 + Math.random() * 22 + "px";
    heart.style.animationDelay = Math.random() * .15 + "s";
    burst.appendChild(heart);
    setTimeout(() => heart.remove(), 1800);
  }
}

const heartContainer = $("floatingHearts");
if (!reduceMotion) {
  const symbols = ["♥", "♡", "✦"];
  setInterval(() => {
    const heart = document.createElement("span");
    heart.className = "floating-heart";
    heart.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    heart.style.left = Math.random() * 100 + "%";
    heart.style.fontSize = (10 + Math.random() * 18) + "px";
    heart.style.animationDuration = (9 + Math.random() * 8) + "s";
    heartContainer.appendChild(heart);
    setTimeout(() => heart.remove(), 18000);
  }, 900);

  // Un piccolo cuore ovunque lei tocchi lo schermo
  document.addEventListener("pointerdown", e => {
    const heart = document.createElement("span");
    heart.className = "tap-heart";
    heart.textContent = "♥";
    heart.style.left = e.clientX + "px";
    heart.style.top = e.clientY + "px";
    document.body.appendChild(heart);
    setTimeout(() => heart.remove(), 900);
  });
}

renderProgress();
