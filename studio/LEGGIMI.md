# Studio Facile

App web per studiare: mandi le foto delle pagine del libro, i PDF e i tuoi appunti e ricevi:

- **Scheda**: di cosa parla, riassunto, spiegazione semplice, approfondimenti trovati sul web (con le fonti), parole chiave e punti da ricordare.
- **Slide**: una presentazione da sfogliare (anche a schermo intero e con lo swipe) con la spiegazione di ogni slide, da scaricare in PowerPoint o da salvare in PDF.
- **Quiz**: domande a risposta multipla per verificare di aver capito.

Gli studi fatti restano salvati sul dispositivo, nella sezione "I miei studi".

## Come funziona
L'app usa Claude (modello `claude-opus-5-5`) direttamente dal browser, in due passaggi:
1. legge pagine e appunti, cerca sul web e scrive la scheda di studio;
2. trasforma la scheda in slide e quiz.

Non c'è un server: tutto è in `index.html`, `app.js` e `style.css`, con le librerie incluse in `vendor/`.

## Cosa serve
Una **chiave API Anthropic** personale: si crea su https://console.anthropic.com/settings/keys (serve un account con credito). Al primo avvio l'app la chiede e la salva solo nel browser di quel dispositivo; si cambia da ⚙︎.

Costo indicativo per uno studio di qualche pagina: circa 0,30–0,80 $ (dipende da quante pagine, quanto testo e quante ricerche web).

⚠️ La chiave dà accesso al tuo credito: non condividerla e usa l'app solo su dispositivi tuoi. Su console.anthropic.com puoi impostare un limite di spesa mensile.

## Pubblicazione
Se il repository è già pubblicato con GitHub Pages, l'app è disponibile all'indirizzo del sito seguito da `/studio/`.
Da iPhone: aprila in Safari → Condividi → "Aggiungi alla schermata Home" per averla come un'app.

## Prova in locale
Dalla cartella principale del repository: `python3 -m http.server` e poi apri http://localhost:8000/studio/
(non funziona aprendo direttamente il file, perché usa i moduli JavaScript).
