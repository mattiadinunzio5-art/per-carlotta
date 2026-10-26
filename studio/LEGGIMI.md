# Studio Facile

App web gratuita per studiare: mandi le foto delle pagine del libro, i PDF e i tuoi appunti e ricevi:

- **Scheda**: di cosa parla, riassunto, spiegazione semplice, approfondimenti presi da Wikipedia (con le fonti), parole chiave e punti da ricordare.
- **Slide**: una presentazione da sfogliare (anche a schermo intero e con lo swipe), con la spiegazione di ogni slide; si scarica in PowerPoint o si salva in PDF.
- **Quiz**: domande a risposta multipla per verificare di aver capito.

Gli studi fatti restano salvati sul dispositivo, nella sezione "I miei studi".

## Le AI gratuite
L'app usa più intelligenze artificiali con piano gratuito e le prova in quest'ordine:

1. **Google Gemini**: chiave su https://aistudio.google.com/apikey
2. **Groq**: chiave su https://console.groq.com/keys
3. **OpenRouter** (modelli "free"): chiave su https://openrouter.ai/keys
4. **Mistral** (piano "Experiment"): chiave su https://console.mistral.ai/api-keys
5. **Claude**: facoltativo e **a pagamento**, da usare solo se le altre non bastano.

Basta una chiave, ma più ne inserisci (da ⚙︎), più puoi studiare ogni giorno. Quando un'AI finisce i limiti gratuiti o non risponde, l'app passa da sola alla successiva e la salta per 15 minuti. I modelli gratuiti vengono scelti in automatico tra quelli disponibili in quel momento.

Gli approfondimenti arrivano da Wikipedia, che è gratuita e non richiede nessuna chiave.

**Da sapere:**
- I limiti gratuiti li decidono i fornitori e cambiano nel tempo.
- Nei piani gratuiti, Google e Mistral possono usare i contenuti inviati per migliorare i loro prodotti. Non mandare materiale privato.
- Le chiavi restano salvate solo nel browser del dispositivo. Non condividerle.

## Come funziona
Non c'è un server: tutto è in `index.html`, `app.js`, `providers.js` e `style.css`, con le librerie incluse in `vendor/`.

1. Le foto vengono rimpicciolite. Dai PDF si estrae il testo, e le pagine senza testo (scansioni) diventano immagini.
2. Un'AI legge il materiale, scrive la scheda e propone delle ricerche.
3. L'app cerca su Wikipedia e un'AI scrive gli approfondimenti con le fonti.
4. Un'AI trasforma la scheda in slide e quiz.

## Pubblicazione
Se il repository è pubblicato con GitHub Pages, l'app è all'indirizzo del sito seguito da `/studio/`.
Da iPhone: aprila in Safari → Condividi → "Aggiungi alla schermata Home" per averla come un'app.

## Prova in locale
Dalla cartella principale del repository: `python3 -m http.server` e poi apri http://localhost:8000/studio/
(aprendo direttamente il file non funziona, perché usa i moduli JavaScript).
