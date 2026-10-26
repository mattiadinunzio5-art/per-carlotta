// Anthropic TypeScript SDK 1.3.0, bundled for the browser (see vendor/README.md).
import Anthropic from "./vendor/anthropic-sdk.mjs";

const MODEL = "claude-opus-5-5";
const KEY_STORAGE = "studio.apiKey";
const HISTORY_STORAGE = "studio.history";
const MAX_IMAGE_SIDE = 1800;
const MAX_TOTAL_BYTES = 28 * 1024 * 1024; // the API caps a request at 32 MB

const $ = (id) => document.getElementById(id);

const state = {
  files: [], // { id, name, kind: "image" | "pdf", mediaType, data (base64), preview, bytes }
  result: null, // { id, createdAt, topic, title, notes, sources, deck }
  slideIndex: 0,
  abort: null,
};

/* ---------- storage (best effort: private mode can throw) ---------- */

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/* ---------- views ---------- */

function show(viewId) {
  document.querySelectorAll(".view").forEach((v) => v.classList.toggle("active", v.id === viewId));
  window.scrollTo({ top: 0 });
}

function showError(el, message) {
  el.textContent = message;
  el.hidden = !message;
}

/* ---------- file handling ---------- */

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// Phone photos are often 5-12 MB: shrink them so they stay readable but fit the request.
async function prepareImage(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error(`Non riesco ad aprire l'immagine "${file.name}".`));
      el.src = url;
    });
    const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    return { kind: "image", mediaType: "image/jpeg", data: dataUrl.split(",")[1], preview: dataUrl };
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function addFiles(fileList) {
  showError($("inputError"), "");
  for (const file of fileList) {
    try {
      let entry;
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        const dataUrl = await readAsDataURL(file);
        entry = { kind: "pdf", mediaType: "application/pdf", data: dataUrl.split(",")[1], preview: null };
      } else if (file.type.startsWith("image/") || /\.(heic|heif)$/i.test(file.name)) {
        entry = await prepareImage(file);
      } else {
        throw new Error(`"${file.name}" non è né un'immagine né un PDF.`);
      }
      entry.id = crypto.randomUUID();
      entry.name = file.name || (entry.kind === "pdf" ? "documento.pdf" : "foto.jpg");
      entry.bytes = Math.ceil((entry.data.length * 3) / 4);
      state.files.push(entry);
    } catch (err) {
      showError($("inputError"), err.message);
    }
  }
  renderFileList();
}

function renderFileList() {
  const list = $("fileList");
  list.replaceChildren();
  state.files.forEach((f, i) => {
    const li = document.createElement("li");
    const thumb = document.createElement("div");
    thumb.className = "thumb";
    if (f.preview) {
      const img = document.createElement("img");
      img.src = f.preview;
      img.alt = "";
      thumb.append(img);
    } else {
      thumb.textContent = "PDF";
    }
    const name = document.createElement("span");
    name.className = "file-name";
    name.textContent = `${i + 1}. ${f.name}`;
    const size = document.createElement("span");
    size.className = "muted small";
    size.textContent = f.bytes < 1024 * 1024 ? `${Math.ceil(f.bytes / 1024)} KB` : `${(f.bytes / 1024 / 1024).toFixed(1)} MB`;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "ghost";
    remove.setAttribute("aria-label", `Rimuovi ${f.name}`);
    remove.textContent = "✕";
    remove.onclick = () => {
      state.files = state.files.filter((x) => x.id !== f.id);
      renderFileList();
    };
    li.append(thumb, name, size, remove);
    list.append(li);
  });
}

/* ---------- Claude ---------- */

const SYSTEM_PROMPT = `Sei un tutor paziente e preciso. Aiuti uno studente a capire e ricordare il materiale che ti manda (foto di pagine di libro, PDF, appunti). Scrivi sempre in italiano, in modo chiaro e adatto al livello indicato. Resta fedele al materiale: se una parte di una foto è illeggibile o tagliata, dillo invece di inventare.`;

function notesPrompt({ topic, level, notes, web }) {
  const webSection = web
    ? `## Approfondimenti dal web
Cerca sul web informazioni che integrano il materiale senza ripeterlo: dati aggiornati, date, numeri, esempi reali, curiosità utili a ricordare, collegamenti con altri argomenti. Preferisci fonti affidabili (enciclopedie, università, istituzioni, siti specializzati). Per ogni integrazione scrivi il nome della fonte tra parentesi. Se il web contraddice il materiale, segnalalo chiaramente.`
    : "";
  return `${topic ? `Argomento: ${topic}\n` : ""}Livello dello studente: ${level}

Prepara una scheda di studio in Markdown con queste sezioni, in quest'ordine:

## Di cosa parla
Due o tre frasi che danno il quadro generale.

## Riassunto
I contenuti del materiale, completi ma senza ripetizioni, organizzati in sottosezioni logiche (### ...). Metti in **grassetto** i concetti chiave.

## Spiegato semplice
I passaggi più difficili spiegati con parole semplici, esempi concreti e analogie della vita di tutti i giorni.

${webSection}

## Parole chiave
Un piccolo glossario: termine — definizione breve.

## Da ricordare
Da 5 a 10 punti essenziali, quelli che servirebbero in un'interrogazione o in un esame.

Scrivi solo la scheda, senza introduzioni o commenti finali.${notes ? `\n\nAppunti dello studente:\n"""\n${notes}\n"""` : ""}`;
}

function deckPrompt({ notes, level, slides }) {
  return `Ecco una scheda di studio. Trasformala in una presentazione di circa ${slides} slide per imparare facilmente l'argomento (livello: ${level}).

Regole:
- Si parte dal quadro generale e si va verso i dettagli; l'ultima slide è un riepilogo.
- Ogni slide ha un titolo breve, da 2 a 4 punti brevi (massimo 15 parole l'uno), un'emoji adatta, una spiegazione discorsiva di 3-6 frasi per chi ripassa da solo, e un esempio concreto o un trucco per ricordare (stringa vuota se non serve).
- Includi anche le informazioni utili prese dal web.
- Poi scrivi 6 domande di quiz a risposta multipla (4 opzioni, una sola corretta) che verificano la comprensione, non solo la memoria. "corretta" è l'indice (da 0 a 3) dell'opzione giusta.

Scheda:
"""
${notes}
"""`;
}

const DECK_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["titolo", "sottotitolo", "slides", "quiz"],
  properties: {
    titolo: { type: "string" },
    sottotitolo: { type: "string" },
    slides: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["titolo", "emoji", "punti", "spiegazione", "esempio"],
        properties: {
          titolo: { type: "string" },
          emoji: { type: "string" },
          punti: { type: "array", items: { type: "string" } },
          spiegazione: { type: "string" },
          esempio: { type: "string" },
        },
      },
    },
    quiz: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["domanda", "opzioni", "corretta", "spiegazione"],
        properties: {
          domanda: { type: "string" },
          opzioni: { type: "array", items: { type: "string" } },
          corretta: { type: "integer" },
          spiegazione: { type: "string" },
        },
      },
    },
  },
};

function client() {
  const apiKey = load(KEY_STORAGE, "");
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

// Shared request options: server-side fallback re-runs a request the model's
// safety classifiers decline, instead of returning the refusal.
const BASE = {
  model: MODEL,
  betas: ["server-side-fallback-2026-07-01"],
  fallbacks: "default",
};

function checkStop(message) {
  if (message.stop_reason === "refusal") {
    throw new Error("Claude non ha potuto elaborare questo materiale. Prova con contenuti diversi.");
  }
}

function setStep(step, status) {
  const li = document.querySelector(`#steps [data-step="${step}"]`);
  if (li) li.dataset.status = status;
}

async function buildNotes(anthropic, input, signal) {
  const content = [];
  for (const f of state.files) {
    if (f.kind === "pdf") {
      content.push({ type: "document", source: { type: "base64", media_type: f.mediaType, data: f.data }, title: f.name });
    } else {
      content.push({ type: "image", source: { type: "base64", media_type: f.mediaType, data: f.data } });
    }
  }
  content.push({ type: "text", text: notesPrompt(input) });

  const messages = [{ role: "user", content }];
  const tools = input.web ? [{ type: "web_search_20260209", name: "web_search", max_uses: 6 }] : [];
  const sources = new Map();
  let text = "";

  setStep("read", "active");
  // Web search can pause a long turn (pause_turn): send the turn back to let it continue.
  for (let round = 0; round < 5; round++) {
    const stream = anthropic.beta.messages.stream(
      {
        ...BASE,
        max_tokens: 64000,
        output_config: { effort: "high" },
        system: SYSTEM_PROMPT,
        tools,
        messages,
      },
      { signal },
    );
    stream.on("streamEvent", (event) => {
      if (event.type === "content_block_start") {
        if (event.content_block.type === "server_tool_use") {
          setStep("read", "done");
          setStep("web", "active");
        } else if (event.content_block.type === "text") {
          setStep("read", "done");
          if (input.web) setStep("web", "done");
          setStep("notes", "active");
        }
      }
    });
    stream.on("text", (delta) => {
      text += delta;
      $("liveText").textContent = text.slice(-1500);
      $("liveBox").scrollTop = $("liveBox").scrollHeight;
    });
    const message = await stream.finalMessage();
    checkStop(message);

    for (const block of message.content) {
      if (block.type === "web_search_tool_result" && Array.isArray(block.content)) {
        for (const r of block.content) sources.set(r.url, r.title || r.url);
      }
      if (block.type === "text" && block.citations) {
        for (const c of block.citations) if (c.url) sources.set(c.url, c.title || c.url);
      }
    }

    if (message.stop_reason !== "pause_turn") break;
    messages.push({ role: "assistant", content: message.content });
  }

  if (!text.trim()) throw new Error("Non ho ricevuto nessun testo. Riprova.");
  setStep("read", "done");
  setStep("web", input.web ? "done" : "skipped");
  setStep("notes", "done");
  return { notes: text.trim(), sources: [...sources].map(([url, title]) => ({ url, title })) };
}

async function buildDeck(anthropic, notes, input, signal) {
  setStep("slides", "active");
  $("liveText").textContent = "Sto impaginando le slide e scrivendo le domande del quiz…";
  const stream = anthropic.beta.messages.stream(
    {
      ...BASE,
      max_tokens: 32000,
      output_config: { effort: "medium", format: { type: "json_schema", schema: DECK_SCHEMA } },
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: deckPrompt({ notes, level: input.level, slides: input.slides }) }],
    },
    { signal },
  );
  const message = await stream.finalMessage();
  checkStop(message);
  if (message.stop_reason === "max_tokens") throw new Error("La presentazione è venuta troppo lunga. Prova con meno slide.");
  const json = message.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  const deck = JSON.parse(json);
  deck.quiz = deck.quiz.filter((q) => q.opzioni.length >= 2 && q.corretta >= 0 && q.corretta < q.opzioni.length);
  setStep("slides", "done");
  return deck;
}

function friendlyError(err) {
  if (err instanceof Anthropic.AuthenticationError) return "La chiave API non è valida. Controllala nelle impostazioni (⚙︎).";
  if (err instanceof Anthropic.PermissionDeniedError) return "La chiave API non ha i permessi necessari.";
  if (err instanceof Anthropic.RateLimitError) return "Troppe richieste in poco tempo. Aspetta un minuto e riprova.";
  if (err instanceof Anthropic.BadRequestError) {
    if (/credit balance/i.test(err.message)) return "Il credito dell'account Anthropic è esaurito. Ricaricalo su console.anthropic.com.";
    return `Richiesta non valida: ${err.message}`;
  }
  if (err instanceof Anthropic.APIConnectionError) return "Problema di connessione. Controlla Internet e riprova.";
  if (err instanceof Anthropic.APIError) return `Errore del servizio (${err.status}). Riprova tra poco.`;
  if (err instanceof SyntaxError) return "La presentazione non è stata generata correttamente. Riprova.";
  return err.message || String(err);
}

async function start() {
  const input = {
    topic: $("topicInput").value.trim(),
    level: $("levelInput").value,
    slides: Number($("slidesInput").value),
    web: $("webInput").value === "on",
    notes: $("notesInput").value.trim(),
  };

  if (!load(KEY_STORAGE, "")) {
    openSettings();
    return;
  }
  if (!state.files.length && !input.notes) {
    showError($("inputError"), "Aggiungi almeno una foto, un PDF o qualche appunto.");
    return;
  }
  const total = state.files.reduce((n, f) => n + f.bytes, 0);
  if (total > MAX_TOTAL_BYTES) {
    showError($("inputError"), "Il materiale è troppo pesante (massimo circa 28 MB). Dividilo in due studi.");
    return;
  }

  document.querySelectorAll("#steps li").forEach((li) => delete li.dataset.status);
  $("liveText").textContent = "";
  showError($("workingError"), "");
  $("cancelBtn").textContent = "Annulla";
  show("viewWorking");

  const anthropic = client();
  const controller = new AbortController();
  state.abort = controller;
  try {
    const { notes, sources } = await buildNotes(anthropic, input, controller.signal);
    const deck = await buildDeck(anthropic, notes, input, controller.signal);
    const result = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      topic: input.topic,
      title: deck.titolo || input.topic || "Il tuo studio",
      notes,
      sources,
      deck,
    };
    saveToHistory(result);
    openResult(result);
  } catch (err) {
    if (controller.signal.aborted) {
      show("viewInput");
      return;
    }
    console.error(err);
    showError($("workingError"), friendlyError(err));
    $("cancelBtn").textContent = "← Torna indietro";
  } finally {
    state.abort = null;
  }
}

/* ---------- result rendering ---------- */

function renderMarkdown(md) {
  const html = window.marked ? window.marked.parse(md) : md.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
  return window.DOMPurify ? window.DOMPurify.sanitize(html, { FORBID_TAGS: ["img", "style", "form", "input"] }) : "";
}

function openResult(result) {
  state.result = result;
  state.slideIndex = 0;
  $("resultTitle").textContent = result.title;
  $("resultTopic").textContent = result.deck.sottotitolo || result.topic || "";
  $("notesOut").innerHTML = renderMarkdown(result.notes);
  $("notesOut").querySelectorAll("a").forEach((a) => {
    a.target = "_blank";
    a.rel = "noopener";
  });

  const list = $("sourcesList");
  list.replaceChildren();
  for (const s of result.sources) {
    if (!/^https?:\/\//i.test(s.url)) continue;
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = s.url;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = s.title;
    li.append(a);
    list.append(li);
  }
  $("sourcesBox").hidden = !list.children.length;

  renderSlide();
  renderQuiz();
  selectTab("tabNotes");
  show("viewResult");
}

function allSlides() {
  const { deck } = state.result;
  return [{ cover: true, titolo: deck.titolo, sottotitolo: deck.sottotitolo, emoji: "📚" }, ...deck.slides];
}

function slideElement(slide, index, total) {
  const el = document.createElement("div");
  el.className = slide.cover ? "slide cover" : "slide";
  const emoji = document.createElement("div");
  emoji.className = "slide-emoji";
  emoji.textContent = slide.emoji || "";
  const title = document.createElement("h2");
  title.textContent = slide.titolo;
  el.append(emoji, title);
  if (slide.cover) {
    const sub = document.createElement("p");
    sub.className = "slide-sub";
    sub.textContent = slide.sottotitolo || "";
    el.append(sub);
  } else {
    const ul = document.createElement("ul");
    for (const p of slide.punti) {
      const li = document.createElement("li");
      li.textContent = p;
      ul.append(li);
    }
    el.append(ul);
    if (slide.esempio) {
      const ex = document.createElement("p");
      ex.className = "slide-example";
      ex.textContent = `💡 ${slide.esempio}`;
      el.append(ex);
    }
  }
  const num = document.createElement("span");
  num.className = "slide-num";
  num.textContent = `${index + 1} / ${total}`;
  el.append(num);
  return el;
}

function renderSlide() {
  const slides = allSlides();
  const i = Math.max(0, Math.min(state.slideIndex, slides.length - 1));
  state.slideIndex = i;
  const slide = slides[i];
  $("slideStage").replaceChildren(slideElement(slide, i, slides.length));
  $("slideCounter").textContent = `${i + 1} / ${slides.length}`;
  $("prevSlide").disabled = i === 0;
  $("nextSlide").disabled = i === slides.length - 1;
  $("speakerBox").hidden = !!slide.cover;
  $("speakerNotes").textContent = slide.spiegazione || "";
}

function moveSlide(delta) {
  if (!state.result) return;
  state.slideIndex += delta;
  renderSlide();
}

function renderQuiz() {
  const out = $("quizOut");
  out.replaceChildren();
  $("quizScore").textContent = "";
  const quiz = state.result.deck.quiz;
  let answered = 0;
  let correct = 0;
  quiz.forEach((q, qi) => {
    const card = document.createElement("div");
    card.className = "card quiz-q";
    const h = document.createElement("h3");
    h.textContent = `${qi + 1}. ${q.domanda}`;
    const opts = document.createElement("div");
    opts.className = "quiz-opts";
    const expl = document.createElement("p");
    expl.className = "quiz-expl";
    expl.hidden = true;
    expl.textContent = q.spiegazione;
    q.opzioni.forEach((opt, oi) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "quiz-opt";
      b.textContent = opt;
      b.onclick = () => {
        opts.querySelectorAll("button").forEach((x, xi) => {
          x.disabled = true;
          if (xi === q.corretta) x.classList.add("right");
        });
        if (oi !== q.corretta) b.classList.add("wrong");
        else correct++;
        answered++;
        expl.hidden = false;
        if (answered === quiz.length) {
          $("quizScore").textContent = `Risultato: ${correct} su ${quiz.length} ${correct === quiz.length ? "🎉" : correct >= quiz.length / 2 ? "👍" : "📖 ripassa la scheda e riprova!"}`;
        }
      };
      opts.append(b);
    });
    card.append(h, opts, expl);
    out.append(card);
  });
  const retry = document.createElement("button");
  retry.type = "button";
  retry.className = "btn secondary";
  retry.textContent = "Ricomincia il quiz";
  retry.onclick = renderQuiz;
  out.append(retry);
}

function selectTab(id) {
  document.querySelectorAll(".tab").forEach((t) => {
    const on = t.dataset.tab === id;
    t.classList.toggle("active", on);
    t.setAttribute("aria-selected", String(on));
  });
  document.querySelectorAll(".tab-panel").forEach((p) => p.classList.toggle("active", p.id === id));
}

/* ---------- export ---------- */

function exportPptx() {
  if (!window.PptxGenJS) {
    alert("Il modulo PowerPoint non si è caricato. Controlla la connessione e ricarica la pagina.");
    return;
  }
  const { deck, title } = state.result;
  const pptx = new window.PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.title = title;
  const ink = "1F2937";
  const accent = "1F3A5F";
  const warm = "E8833A";

  const cover = pptx.addSlide();
  cover.background = { color: accent };
  cover.addText("📚", { x: 0.6, y: 1.2, w: 2, h: 1, fontSize: 54 });
  cover.addText(deck.titolo, { x: 0.6, y: 2.3, w: 12, h: 1.6, fontSize: 40, bold: true, color: "FFFFFF", fontFace: "Georgia" });
  cover.addText(deck.sottotitolo || "", { x: 0.6, y: 3.9, w: 12, h: 1, fontSize: 20, color: "D6E2F0" });

  deck.slides.forEach((s, i) => {
    const slide = pptx.addSlide();
    slide.background = { color: "FBFAF7" };
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.18, h: 7.5, fill: { color: warm } });
    slide.addText(s.emoji || "", { x: 0.6, y: 0.4, w: 1, h: 0.9, fontSize: 36 });
    slide.addText(s.titolo, { x: 1.6, y: 0.4, w: 11, h: 0.9, fontSize: 30, bold: true, color: accent, fontFace: "Georgia" });
    slide.addText(
      s.punti.map((p) => ({ text: p, options: { bullet: true, paraSpaceAfter: 10 } })),
      { x: 0.8, y: 1.6, w: 11.7, h: s.esempio ? 3.9 : 5.2, fontSize: 22, color: ink, valign: "top" },
    );
    if (s.esempio) {
      slide.addText(`💡 ${s.esempio}`, {
        x: 0.8, y: 5.6, w: 11.7, h: 1.2, fontSize: 16, color: ink, italic: true,
        fill: { color: "FDEBD9" }, margin: 12,
      });
    }
    slide.addText(`${i + 2}`, { x: 12.4, y: 6.9, w: 0.7, h: 0.4, fontSize: 11, color: "9CA3AF", align: "right" });
    slide.addNotes(s.spiegazione);
  });

  const name = title.replace(/[\\/:*?"<>|]+/g, "").slice(0, 60) || "presentazione";
  pptx.writeFile({ fileName: `${name}.pptx` });
}

function exportPdf() {
  const container = $("printDeck");
  const slides = allSlides();
  container.replaceChildren(
    ...slides.map((s, i) => {
      const page = document.createElement("div");
      page.className = "print-page";
      page.append(slideElement(s, i, slides.length));
      if (s.spiegazione) {
        const notes = document.createElement("p");
        notes.className = "print-notes";
        notes.textContent = s.spiegazione;
        page.append(notes);
      }
      return page;
    }),
  );
  window.print();
}

/* ---------- history ---------- */

function saveToHistory(result) {
  const history = load(HISTORY_STORAGE, []);
  history.unshift(result);
  // Drop the oldest entries until it fits in the browser's storage.
  while (history.length && !save(HISTORY_STORAGE, history.slice(0, 30))) history.pop();
}

function renderHistory() {
  const list = $("historyList");
  list.replaceChildren();
  const history = load(HISTORY_STORAGE, []);
  if (!history.length) {
    const li = document.createElement("li");
    li.className = "muted";
    li.textContent = "Ancora nessuno studio salvato.";
    list.append(li);
  }
  for (const item of history) {
    const li = document.createElement("li");
    const open = document.createElement("button");
    open.type = "button";
    open.className = "history-item";
    const t = document.createElement("strong");
    t.textContent = item.title;
    const d = document.createElement("span");
    d.className = "muted small";
    d.textContent = new Date(item.createdAt).toLocaleString("it-IT", { dateStyle: "medium", timeStyle: "short" });
    open.append(t, d);
    open.onclick = () => openResult(item);
    const del = document.createElement("button");
    del.type = "button";
    del.className = "ghost";
    del.setAttribute("aria-label", `Elimina ${item.title}`);
    del.textContent = "🗑";
    del.onclick = () => {
      if (!confirm(`Eliminare "${item.title}"?`)) return;
      save(HISTORY_STORAGE, load(HISTORY_STORAGE, []).filter((x) => x.id !== item.id));
      renderHistory();
    };
    li.append(open, del);
    list.append(li);
  }
  show("viewHistory");
}

/* ---------- settings ---------- */

function openSettings() {
  $("apiKeyInput").value = load(KEY_STORAGE, "");
  $("settingsDialog").showModal();
}

/* ---------- wiring ---------- */

$("fileInput").addEventListener("change", (e) => { addFiles(e.target.files); e.target.value = ""; });
$("cameraInput").addEventListener("change", (e) => { addFiles(e.target.files); e.target.value = ""; });

const dz = $("dropzone");
dz.addEventListener("dragover", (e) => { e.preventDefault(); dz.classList.add("over"); });
dz.addEventListener("dragleave", () => dz.classList.remove("over"));
dz.addEventListener("drop", (e) => { e.preventDefault(); dz.classList.remove("over"); addFiles(e.dataTransfer.files); });

$("startBtn").addEventListener("click", start);
$("cancelBtn").addEventListener("click", () => {
  if (state.abort) state.abort.abort();
  else show("viewInput");
});
$("newBtn").addEventListener("click", () => {
  state.files = [];
  renderFileList();
  $("notesInput").value = "";
  $("topicInput").value = "";
  show("viewInput");
});

document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => selectTab(t.dataset.tab)));
$("prevSlide").addEventListener("click", () => moveSlide(-1));
$("nextSlide").addEventListener("click", () => moveSlide(1));
$("fullscreenBtn").addEventListener("click", () => {
  const deck = $("deck");
  if (document.fullscreenElement) document.exitFullscreen();
  else if (deck.requestFullscreen) deck.requestFullscreen();
  else deck.classList.toggle("pseudo-full"); // iPhone Safari has no Fullscreen API for divs
});
document.addEventListener("keydown", (e) => {
  if (!$("tabSlides").classList.contains("active") || !$("viewResult").classList.contains("active")) return;
  if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); moveSlide(1); }
  if (e.key === "ArrowLeft") moveSlide(-1);
  if (e.key === "Escape") $("deck").classList.remove("pseudo-full");
});
let touchX = null;
$("slideStage").addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
$("slideStage").addEventListener("touchend", (e) => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 40) moveSlide(dx < 0 ? 1 : -1);
  touchX = null;
});

$("pptxBtn").addEventListener("click", exportPptx);
$("pdfBtn").addEventListener("click", exportPdf);
$("historyBtn").addEventListener("click", renderHistory);
$("historyBack").addEventListener("click", () => show(state.result ? "viewResult" : "viewInput"));
$("settingsBtn").addEventListener("click", openSettings);
$("settingsForm").addEventListener("submit", (e) => {
  if (e.submitter?.value !== "save") return;
  const key = $("apiKeyInput").value.trim();
  if (!save(KEY_STORAGE, key)) alert("Non riesco a salvare la chiave in questo browser (navigazione privata?).");
});

if (!load(KEY_STORAGE, "")) openSettings();
