// AI providers and automatic fallback.
//
// Every provider exposes listModels(key) -> [{ id, vision }] and
// chat(key, model, { system, text, images, json }, signal) -> string.
// ask() tries the providers that have a key, in order, and moves on to the next
// model or provider when one fails (quota finished, rate limit, model retired,
// images not supported, unreadable output...).

// Anthropic TypeScript SDK 1.3.0, bundled for the browser (see vendor/README.md).
import Anthropic from "./vendor/anthropic-sdk.mjs";

const MODELS_PER_PROVIDER = 3;
const COOLDOWN_MS = 15 * 60 * 1000;
const COOLDOWN_STORAGE = "studio.cooldown";

export class ProviderError extends Error {
  constructor(message, { status = 0, auth = false } = {}) {
    super(message);
    this.status = status;
    this.auth = auth;
  }
}

async function http(url, { method = "GET", headers = {}, body, signal } = {}) {
  let res;
  try {
    res = await fetch(url, {
      method,
      headers: body ? { "content-type": "application/json", ...headers } : headers,
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    if (signal?.aborted) throw err;
    throw new ProviderError("connessione non riuscita");
  }
  const raw = await res.text();
  let data = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    // not JSON: keep the raw text for the error message
  }
  if (!res.ok) {
    const detail = data?.error?.message || data?.message || data?.detail || raw.slice(0, 200);
    throw new ProviderError(`${res.status} ${typeof detail === "string" ? detail : JSON.stringify(detail)}`, {
      status: res.status,
      auth: res.status === 401,
    });
  }
  return data;
}

// Reasoning models can put their thinking in the answer.
const stripThinking = (s) => s.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

function rank(id, prefs) {
  const i = prefs.findIndex((re) => re.test(id));
  return i === -1 ? prefs.length : i;
}

/* ---------- OpenAI-compatible APIs (Groq, OpenRouter, Mistral) ---------- */

async function openAIChat(base, key, model, { system, text, images, json }, signal) {
  const content = images.length
    ? [{ type: "text", text }, ...images.map((im) => ({ type: "image_url", image_url: { url: `data:${im.mediaType};base64,${im.data}` } }))]
    : text;
  const data = await http(`${base}/chat/completions`, {
    method: "POST",
    headers: { authorization: `Bearer ${key}` },
    body: { model, messages: [{ role: "system", content: system }, { role: "user", content }] },
    signal,
  });
  if (data?.error) throw new ProviderError(data.error.message || "errore del servizio", { status: data.error.code || 0 });
  const choice = data?.choices?.[0];
  const out = typeof choice?.message?.content === "string" ? stripThinking(choice.message.content) : "";
  if (!out) throw new ProviderError("risposta vuota");
  if (json && choice.finish_reason === "length") throw new ProviderError("risposta troncata");
  return out;
}

/* ---------- providers ---------- */

export const PROVIDERS = [
  {
    id: "gemini",
    name: "Google Gemini",
    keyUrl: "https://aistudio.google.com/apikey",
    hint: "Gratis con un account Google. Nel piano gratuito Google può usare i contenuti inviati per migliorare i suoi prodotti.",
    async listModels(key) {
      const data = await http("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200", {
        headers: { "x-goog-api-key": key },
      });
      const prefs = [/flash(?!-lite)/, /flash-lite/, /pro/];
      return (data.models || [])
        .filter((m) => (m.supportedGenerationMethods || []).includes("generateContent"))
        .map((m) => m.name.replace(/^models\//, ""))
        .filter((id) => /^gemini-/.test(id) && !/(tts|image|live|audio|embed|robotics|computer|thinking|exp)/.test(id))
        .sort((a, b) => rank(a, prefs) - rank(b, prefs) || version(b) - version(a) || a.length - b.length)
        .map((id) => ({ id, vision: true }));
    },
    async chat(key, model, { system, text, images, json }, signal) {
      const data = await http(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "x-goog-api-key": key },
        body: {
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [...images.map((im) => ({ inline_data: { mime_type: im.mediaType, data: im.data } })), { text }] }],
          generationConfig: json ? { responseMimeType: "application/json" } : {},
        },
        signal,
      });
      if (data?.promptFeedback?.blockReason) throw new ProviderError(`contenuto bloccato (${data.promptFeedback.blockReason})`);
      const cand = data?.candidates?.[0];
      const out = (cand?.content?.parts || []).filter((p) => !p.thought && p.text).map((p) => p.text).join("");
      if (!out.trim()) throw new ProviderError(`risposta vuota${cand?.finishReason ? ` (${cand.finishReason})` : ""}`);
      if (json && cand.finishReason === "MAX_TOKENS") throw new ProviderError("risposta troncata");
      return stripThinking(out);
    },
  },
  {
    id: "groq",
    name: "Groq",
    keyUrl: "https://console.groq.com/keys",
    hint: "Gratis, senza carta di credito. Molto veloce.",
    async listModels(key) {
      const data = await http("https://api.groq.com/openai/v1/models", { headers: { authorization: `Bearer ${key}` } });
      const prefs = [/llama-4-maverick/, /llama-4/, /gpt-oss-120b/, /kimi/, /llama-3\.3-70b/, /qwen/, /gpt-oss/];
      return (data.data || [])
        .filter((m) => m.active !== false)
        .map((m) => m.id)
        .filter((id) => !/(whisper|tts|guard|playai|orpheus|compound|allam|distil|8b|instant)/i.test(id))
        .sort((a, b) => rank(a, prefs) - rank(b, prefs))
        .map((id) => ({ id, vision: /llama-4|vision|scout|maverick/i.test(id) }));
    },
    chat: (key, model, req, signal) => openAIChat("https://api.groq.com/openai/v1", key, model, req, signal),
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    keyUrl: "https://openrouter.ai/keys",
    hint: "Gratis con i modelli “free” (circa 50 richieste al giorno).",
    async listModels() {
      const data = await http("https://openrouter.ai/api/v1/models");
      return (data.data || [])
        .filter((m) => m.id.endsWith(":free") || (m.pricing && Number(m.pricing.prompt) === 0 && Number(m.pricing.completion) === 0 && m.id !== "openrouter/auto"))
        .filter((m) => (m.architecture?.output_modalities || ["text"]).includes("text"))
        .sort((a, b) => (b.context_length || 0) - (a.context_length || 0))
        .map((m) => ({ id: m.id, vision: (m.architecture?.input_modalities || []).includes("image") }));
    },
    chat: (key, model, req, signal) => openAIChat("https://openrouter.ai/api/v1", key, model, req, signal),
  },
  {
    id: "mistral",
    name: "Mistral",
    keyUrl: "https://console.mistral.ai/api-keys",
    hint: "Piano gratuito “Experiment”: richiede di accettare che i dati siano usati per l'addestramento.",
    async listModels(key) {
      const data = await http("https://api.mistral.ai/v1/models", { headers: { authorization: `Bearer ${key}` } });
      const prefs = [/^mistral-medium-latest$/, /^mistral-large-latest$/, /^mistral-small-latest$/, /^pixtral-large-latest$/, /latest$/];
      return (data.data || [])
        .filter((m) => m.capabilities?.completion_chat !== false && !m.deprecation)
        .filter((m) => !/(embed|moderation|ocr|codestral|devstral|voxtral|magistral|ministral-3b|saba)/i.test(m.id))
        .sort((a, b) => rank(a.id, prefs) - rank(b.id, prefs))
        .map((m) => ({ id: m.id, vision: !!m.capabilities?.vision }));
    },
    chat: (key, model, req, signal) => openAIChat("https://api.mistral.ai/v1", key, model, req, signal),
  },
  {
    id: "claude",
    name: "Claude (a pagamento)",
    keyUrl: "https://console.anthropic.com/settings/keys",
    hint: "Facoltativo e a pagamento: si usa solo se le AI gratuite non bastano.",
    async listModels() {
      return [{ id: "claude-opus-5-5", vision: true }];
    },
    async chat(key, model, { system, text, images }, signal) {
      const client = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true, maxRetries: 1 });
      try {
        const stream = client.beta.messages.stream(
          {
            model,
            max_tokens: 32000,
            output_config: { effort: "medium" },
            // server-side fallback re-runs a request declined by the safety classifiers
            betas: ["server-side-fallback-2026-07-01"],
            fallbacks: "default",
            system,
            messages: [{
              role: "user",
              content: [...images.map((im) => ({ type: "image", source: { type: "base64", media_type: im.mediaType, data: im.data } })), { type: "text", text }],
            }],
          },
          { signal },
        );
        const message = await stream.finalMessage();
        if (message.stop_reason === "refusal") throw new ProviderError("richiesta rifiutata");
        return message.content.filter((b) => b.type === "text").map((b) => b.text).join("").trim();
      } catch (err) {
        if (err instanceof Anthropic.APIError) throw new ProviderError(`${err.status ?? ""} ${err.message}`, { status: err.status, auth: err.status === 401 });
        throw err;
      }
    },
  },
];

function version(id) {
  const m = id.match(/(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : 0;
}

/* ---------- model discovery (cached for the session) ---------- */

const modelCache = new Map();

async function modelsFor(provider, key) {
  const cacheKey = `${provider.id}:${key.slice(-6)}`;
  if (!modelCache.has(cacheKey)) {
    modelCache.set(cacheKey, provider.listModels(key).catch((err) => {
      modelCache.delete(cacheKey);
      throw err;
    }));
  }
  return modelCache.get(cacheKey);
}

/* ---------- models that ran out of quota ---------- */

// A model that answered 429 (limit reached) is skipped for a while, so the next
// steps go straight to an AI that still has free quota.
function cooldowns() {
  try {
    const all = JSON.parse(localStorage.getItem(COOLDOWN_STORAGE) || "{}");
    const now = Date.now();
    return Object.fromEntries(Object.entries(all).filter(([, until]) => until > now));
  } catch {
    return {};
  }
}

function coolDown(id) {
  try {
    localStorage.setItem(COOLDOWN_STORAGE, JSON.stringify({ ...cooldowns(), [id]: Date.now() + COOLDOWN_MS }));
  } catch {
    // storage unavailable: the model will just be tried again
  }
}

/* ---------- ask with fallback ---------- */

// keys: { [providerId]: apiKey }. onStatus(text) reports which AI is working.
// validate(output) may throw to reject an answer (e.g. invalid JSON) and try the next model.
export async function ask({ keys, system, text, images = [], json = false, validate = (x) => x, onStatus = () => {}, signal }) {
  const failures = [];
  for (const provider of PROVIDERS) {
    const key = keys[provider.id];
    if (!key) continue;
    let models;
    try {
      models = await modelsFor(provider, key);
    } catch (err) {
      if (signal?.aborted) throw err;
      failures.push(`${provider.name}: ${err.message}`);
      continue;
    }
    const resting = cooldowns();
    const usable = models
      .filter((m) => !images.length || m.vision)
      .slice(0, MODELS_PER_PROVIDER)
      .filter((m) => !resting[`${provider.id}/${m.id}`]);
    if (!usable.length) {
      if (!models.some((m) => !images.length || m.vision)) {
        failures.push(`${provider.name}: nessun modello adatto${images.length ? " a leggere immagini" : ""}`);
      }
      continue;
    }
    for (const model of usable) {
      onStatus(`${provider.name} · ${model.id}`);
      try {
        const out = await provider.chat(key, model.id, { system, text, images, json }, signal);
        return { output: validate(out), provider: provider.name, model: model.id, failures };
      } catch (err) {
        if (signal?.aborted) throw err;
        failures.push(`${provider.name} (${model.id}): ${err.message}`);
        if (err.status === 429) coolDown(`${provider.id}/${model.id}`);
        onStatus(`${provider.name} non disponibile, provo la prossima AI…`);
        if (err.auth) break; // wrong key: the other models of this provider would fail too
      }
    }
  }
  const error = new Error(
    failures.length
      ? "Nessuna AI è riuscita a rispondere. Forse i limiti gratuiti di oggi sono finiti: riprova più tardi o aggiungi un'altra chiave gratuita nelle impostazioni (⚙︎)."
      : "Inserisci almeno una chiave API gratuita nelle impostazioni (⚙︎).",
  );
  error.failures = failures;
  throw error;
}

/* ---------- JSON helpers ---------- */

export function parseJSON(text) {
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) throw new ProviderError("la risposta non contiene JSON");
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    throw new ProviderError("JSON non valido");
  }
}
