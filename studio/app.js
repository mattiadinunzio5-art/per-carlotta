import { PROVIDERS, ask, parseJSON, ProviderError } from "./providers.js";

const KEYS_STORAGE = "studio.keys";
const HISTORY_STORAGE = "studio.history";
const MAX_IMAGE_SIDE = 1600;
const MAX_PDF_PAGES = 40;
const MAX_IMAGES = 20;

const $ = (id) => document.getElementById(id);

const state = {
  // { id, name, kind: "image" | "pdf", images: [{ mediaType, data }], text, preview, pages }
  files: [],
  result: null, // { id, createdAt, topic, title, notes, sources, deck, ai }
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

const keys = () => load(KEYS_STORAGE, {});
const hasKey = () => Object.values(keys()).some(Boolean);

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

function canvasToImage(canvas) {
  const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
  return { mediaType: "image/jpeg", data: dataUrl.split(",")[1], preview: dataUrl };
}

function fitCanvas(width, height) {
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return { canvas, ctx, scale };
}

// Phone photos are often 5-12 MB: shrink them so they stay readable but light.
async function prepareImage(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error(`Non riesco ad aprire l'immagine "${file.name}".`));
      el.src = url;
    });
    const { canvas, ctx } = fitCanvas(img.naturalWidth, img.naturalHeight);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const image = canvasToImage(canvas);
    return { kind: "image", images: [image], text: "", preview: image.preview };
  } finally {
    URL.revokeObjectURL(url);
  }
}

let pdfjs = null;

// Free AIs can't all read PDFs: take the text out of each page, and turn the
// pages that have no text (scans, photos) into images.
async function preparePdf(file) {
  if (!pdfjs) {
    pdfjs = await import("./vendor/pdf.min.mjs");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL("./vendor/pdf.worker.min.mjs", import.meta.url).href;
  }
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages = Math.min(doc.numPages, MAX_PDF_PAGES);
  const texts = [];
  const images = [];
  for (let n = 1; n <= pages; n++) {
    const page = await doc.getPage(n);
    const content = await page.getTextContent();
    const text = content.items.map((it) => (it.str || "") + (it.hasEOL ? "\n" : " ")).join("").trim();
    if (text.length >= 150) {
      texts.push(`[Pagina ${n}]\n${text}`);
    } else {
      const base = page.getViewport({ scale: 1 });
      const { canvas, ctx, scale } = fitCanvas(base.width * 2, base.height * 2);
      await page.render({ canvasContext: ctx, viewport: page.getViewport({ scale: 2 * scale }) }).promise;
      const { mediaType, data } = canvasToImage(canvas);
      images.push({ mediaType, data });
    }
  }
  const note = doc.numPages > pages ? `\n[Il PDF ha ${doc.numPages} pagine: lette solo le prime ${pages}.]` : "";
  return { kind: "pdf", images, text: texts.join("\n\n") + note, preview: null, pages: doc.numPages };
}

async function addFiles(fileList) {
  showError($("inputError"), "");
  for (const file of fileList) {
    try {
      let entry;
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        entry = await preparePdf(file);
      } else if (file.type.startsWith("image/") || /\.(heic|heif)$/i.test(file.name)) {
        entry = await prepareImage(file);
      } else {
        throw new Error(`"${file.name}" non è né un'immagine né un PDF.`);
      }
      entry.id = crypto.randomUUID();
      entry.name = file.name || (entry.kind === "pdf" ? "documento.pdf" : "foto.jpg");
      state.files.push(entry);
    } catch (err) {
      console.error(err);
      showError($("inputError"), err.message || `Non riesco a leggere "${file.name}".`);
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
    const info = document.createElement("span");
    info.className = "muted small";
    info.textContent = f.kind === "pdf" ? `${f.pages} pag.` : "foto";
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "ghost";
    remove.setAttribute("aria-label", `Rimuovi ${f.name}`);
    remove.textContent = "✕";
    remove.onclick = () => {
      state.files = state.files.filter((x) => x.id !== f.id);
      renderFileList();
    };
    li.append(thumb, name, info, remove);
    list.append(li);
  });
}

/* ---------- prompts ---------- */

const SYSTEM_PROMPT = `Sei un tutor paziente e preciso. Aiuti uno studente a capire e ricordare il materiale che ti manda (foto di pagine di libro, PDF, appunti). Scrivi sempre in italiano, in modo chiaro e adatto al livello indicato. Resta fedele al materiale: se una parte di una foto è illeggibile o tagliata, dillo invece di inventare.`;

function notesPrompt({ topic, level, notes, web }, pdfText) {
  return `${topic ? `Argomento: ${topic}\n` : ""}Livello dello studente: ${level}

Prepara una scheda di studio in Markdown sul materiale${state.files.some((f) => f.images.length) ? " (le immagini allegate sono le pagine da studiare)" : ""}, con queste sezioni, in quest'ordine:

## Di cosa parla
Due o tre frasi che danno il quadro generale.

## Riassunto
I contenuti del materiale, completi ma senza ripetizioni, organizzati in sottosezioni logiche (### ...). Metti in **grassetto** i concetti chiave.

## Spiegato semplice
I passaggi più difficili spiegati con parole semplici, esempi concreti e analogie della vita di tutti i giorni.

## Parole chiave
Un piccolo glossario: termine — definizione breve.

## Da ricordare
Da 5 a 10 punti essenziali, quelli che servirebbero in un'interrogazione o in un esame.

Scrivi solo la scheda, senza introduzioni o commenti finali.${web ? `
Come ultima riga, dopo la scheda, scrivi da 2 a 4 ricerche da fare su Wikipedia per approfondire, in questo formato esatto:
RICERCHE: prima ricerca | seconda ricerca | terza ricerca` : ""}${pdfText ? `\n\nTesto dei PDF:\n"""\n${pdfText}\n"""` : ""}${notes ? `\n\nAppunti dello studente:\n"""\n${notes}\n"""` : ""}`;
}

function webPrompt(notes, articles) {
  return `Questa è una scheda di studio:
"""
${notes}
"""

Questi sono estratti di articoli di Wikipedia sullo stesso argomento:
${articles.map((a, i) => `[${i + 1}] ${a.title}\n${a.extract}`).join("\n\n")}

Scrivi la sezione "## Approfondimenti dal web" della scheda: informazioni utili degli estratti che integrano la scheda senza ripeterla (date, dati, esempi, curiosità che aiutano a ricordare, collegamenti con altri argomenti). Usa solo quello che c'è negli estratti e, dopo ogni informazione, indica la fonte con il numero tra parentesi quadre, es. [2]. Se un estratto contraddice la scheda, segnalalo. Se gli estratti non aggiungono niente di utile, scrivi solo il titolo e una riga che lo dice. Scrivi solo la sezione, in Markdown.`;
}

function deckPrompt({ notes, level, slides }) {
  return `Ecco una scheda di studio. Trasformala in una presentazione di circa ${slides} slide per imparare facilmente l'argomento (livello: ${level}).

Regole:
- Si parte dal quadro generale e si va verso i dettagli; l'ultima slide è un riepilogo.
- Ogni slide ha un titolo breve, da 2 a 4 punti brevi (massimo 15 parole l'uno), un'emoji adatta, una spiegazione discorsiva di 3-6 frasi per chi ripassa da solo, e un esempio concreto o un trucco per ricordare (stringa vuota se non serve).
- Includi anche gli approfondimenti dal web, se ci sono.
- Poi scrivi 6 domande di quiz a risposta multipla (4 opzioni, una sola corretta) che verificano la comprensione, non solo la memoria. "corretta" è l'indice (da 0 a 3) dell'opzione giusta.

Rispondi solo con un oggetto JSON valido, senza altro testo, con questa struttura:
{"titolo": "...", "sottotitolo": "...", "slides": [{"titolo": "...", "emoji": "...", "punti": ["..."], "spiegazione": "...", "esempio": "..."}], "quiz": [{"domanda": "...", "opzioni": ["...", "...", "...", "..."], "corretta": 0, "spiegazione": "..."}]}

Scheda:
"""
${notes}
"""`;
}

const str = (v) => (typeof v === "string" ? v : v == null ? "" : String(v));

// Free models sometimes bend the format: normalise it, and reject it if unusable.
function validateDeck(text) {
  const raw = parseJSON(text);
  const slides = (Array.isArray(raw.slides) ? raw.slides : [])
    .filter((s) => s && s.titolo)
    .map((s) => ({
      titolo: str(s.titolo),
      emoji: str(s.emoji),
      punti: (Array.isArray(s.punti) ? s.punti : [s.punti]).map(str).filter(Boolean),
      spiegazione: str(s.spiegazione),
      esempio: str(s.esempio),
    }));
  if (slides.length < 2) throw new ProviderError("presentazione incompleta");
  const quiz = (Array.isArray(raw.quiz) ? raw.quiz : [])
    .map((q) => ({ domanda: str(q?.domanda), opzioni: (Array.isArray(q?.opzioni) ? q.opzioni : []).map(str), corretta: Number(q?.corretta), spiegazione: str(q?.spiegazione) }))
    .filter((q) => q.domanda && q.opzioni.length >= 2 && Number.isInteger(q.corretta) && q.corretta >= 0 && q.corretta < q.opzioni.length);
  return { titolo: str(raw.titolo) || slides[0].titolo, sottotitolo: str(raw.sottotitolo), slides, quiz };
}

/* ---------- Wikipedia ---------- */

async function wikipedia(queries, signal) {
  const api = "https://it.wikipedia.org/w/api.php";
  const ids = new Set();
  for (const q of queries) {
    const params = new URLSearchParams({ action: "query", list: "search", srsearch: q, srlimit: "1", format: "json", origin: "*" });
    const res = await fetch(`${api}?${params}`, { signal });
    const data = await res.json();
    for (const hit of data?.query?.search || []) ids.add(hit.pageid);
  }
  if (!ids.size) return [];
  const params = new URLSearchParams({
    action: "query", prop: "extracts|info", inprop: "url", explaintext: "1", exchars: "2500",
    pageids: [...ids].join("|"), format: "json", origin: "*",
  });
  const res = await fetch(`${api}?${params}`, { signal });
  const data = await res.json();
  return Object.values(data?.query?.pages || {})
    .filter((p) => p.extract)
    .map((p) => ({ title: p.title, url: p.fullurl, extract: p.extract }));
}

/* ---------- pipeline ---------- */

function setStep(step, status) {
  const li = document.querySelector(`#steps [data-step="${step}"]`);
  if (li) li.dataset.status = status;
}

function setAI(text) {
  $("aiStatus").textContent = text;
}

async function start() {
  const input = {
    topic: $("topicInput").value.trim(),
    level: $("levelInput").value,
    slides: Number($("slidesInput").value),
    web: $("webInput").value === "on",
    notes: $("notesInput").value.trim(),
  };

  if (!hasKey()) {
    openSettings();
    return;
  }
  if (!state.files.length && !input.notes) {
    showError($("inputError"), "Aggiungi almeno una foto, un PDF o qualche appunto.");
    return;
  }
  const images = state.files.flatMap((f) => f.images);
  if (images.length > MAX_IMAGES) {
    showError($("inputError"), `Troppe pagine in foto (${images.length}): le AI gratuite ne leggono al massimo ${MAX_IMAGES} alla volta. Dividile in più studi.`);
    return;
  }
  const pdfText = state.files.map((f) => f.text).filter(Boolean).join("\n\n");

  document.querySelectorAll("#steps li").forEach((li) => delete li.dataset.status);
  setAI("");
  $("failLog").replaceChildren();
  $("failBox").hidden = true;
  showError($("workingError"), "");
  $("cancelBtn").textContent = "Annulla";
  show("viewWorking");

  const controller = new AbortController();
  state.abort = controller;
  const signal = controller.signal;
  const used = new Set();
  const common = { keys: keys(), system: SYSTEM_PROMPT, onStatus: setAI, signal };
  const logFailures = (failures) => {
    for (const f of failures) {
      const li = document.createElement("li");
      li.textContent = f;
      $("failLog").append(li);
    }
    $("failBox").hidden = !$("failLog").children.length;
  };

  try {
    // 1. read the material and write the study sheet
    setStep("read", "active");
    const first = await ask({ ...common, text: notesPrompt(input, pdfText), images });
    logFailures(first.failures);
    used.add(first.provider);
    let notes = first.output;
    let queries = [];
    const m = notes.match(/\n?\s*\**RICERCHE:?\**:?\s*(.+)\s*$/i);
    if (m) {
      queries = m[1].split("|").map((q) => q.replace(/[*_`"]/g, "").trim()).filter(Boolean).slice(0, 4);
      notes = notes.slice(0, m.index).trim();
    }
    setStep("read", "done");

    // 2. web research on Wikipedia (free, no key)
    let sources = [];
    if (input.web) {
      setStep("web", "active");
      setAI("Wikipedia");
      if (!queries.length) queries = [input.topic || notes.match(/^#+\s*(.+)$/m)?.[1] || ""].filter(Boolean);
      let articles = [];
      try {
        articles = await wikipedia(queries, signal);
      } catch (err) {
        if (signal.aborted) throw err;
        console.warn("Wikipedia", err);
      }
      if (articles.length) {
        const extra = await ask({ ...common, text: webPrompt(notes, articles) });
        logFailures(extra.failures);
        used.add(extra.provider);
        const section = extra.output.replace(/^(?!\s*##)/, "## Approfondimenti dal web\n\n");
        const at = notes.search(/^##\s*Parole chiave/im);
        notes = at === -1 ? `${notes}\n\n${section}` : `${notes.slice(0, at)}${section}\n\n${notes.slice(at)}`;
        sources = articles.map((a) => ({ url: a.url, title: `Wikipedia – ${a.title}` }));
      }
      setStep("web", "done");
    } else {
      setStep("web", "skipped");
    }

    // 3. slides and quiz
    setStep("slides", "active");
    const third = await ask({ ...common, text: deckPrompt({ notes, level: input.level, slides: input.slides }), json: true, validate: validateDeck });
    logFailures(third.failures);
    used.add(third.provider);
    setStep("slides", "done");

    const deck = third.output;
    const result = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      topic: input.topic,
      title: deck.titolo || input.topic || "Il tuo studio",
      notes,
      sources,
      deck,
      ai: [...used].join(", "),
    };
    saveToHistory(result);
    openResult(result);
  } catch (err) {
    if (signal.aborted) {
      show("viewInput");
      return;
    }
    console.error(err);
    logFailures(err.failures || []);
    showError($("workingError"), err.message || String(err));
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
  $("resultAI").textContent = result.ai ? `Preparato con: ${result.ai}` : "";
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

function renderKeyFields() {
  const saved = keys();
  const box = $("keyFields");
  box.replaceChildren();
  PROVIDERS.forEach((p, i) => {
    const wrap = document.createElement("div");
    wrap.className = "key-field";
    const label = document.createElement("label");
    label.className = "field-label";
    label.htmlFor = `key-${p.id}`;
    label.textContent = `${i + 1}. ${p.name}`;
    const hint = document.createElement("p");
    hint.className = "muted small";
    hint.textContent = `${p.hint} `;
    const link = document.createElement("a");
    link.href = p.keyUrl;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = "Crea la chiave";
    hint.append(link);
    const input = document.createElement("input");
    input.type = "password";
    input.id = `key-${p.id}`;
    input.autocomplete = "off";
    input.placeholder = "Incolla qui la chiave";
    input.value = saved[p.id] || "";
    wrap.append(label, hint, input);
    box.append(wrap);
  });
}

function openSettings() {
  renderKeyFields();
  $("settingsDialog").showModal();
}

/* ---------- wiring ---------- */

// Copy the FileList: clearing the input right after empties it.
$("fileInput").addEventListener("change", (e) => { addFiles([...e.target.files]); e.target.value = ""; });
$("cameraInput").addEventListener("change", (e) => { addFiles([...e.target.files]); e.target.value = ""; });

const dz = $("dropzone");
dz.addEventListener("dragover", (e) => { e.preventDefault(); dz.classList.add("over"); });
dz.addEventListener("dragleave", () => dz.classList.remove("over"));
dz.addEventListener("drop", (e) => { e.preventDefault(); dz.classList.remove("over"); addFiles([...e.dataTransfer.files]); });

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
  const next = {};
  for (const p of PROVIDERS) {
    const v = $(`key-${p.id}`).value.trim();
    if (v) next[p.id] = v;
  }
  if (!save(KEYS_STORAGE, next)) alert("Non riesco a salvare le chiavi in questo browser (navigazione privata?).");
});

if (!hasKey()) openSettings();
