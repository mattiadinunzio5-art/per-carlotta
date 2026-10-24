# Per Carlotta — sito romantico

Un piccolo sito statico romantico, rosso e vintage. Funziona senza backend.

## Prova in locale
Apri `index.html` nel browser. Per una prova più affidabile, usa un server locale oppure pubblicalo seguendo le istruzioni qui sotto.

## Personalizzazione
- **Messaggio finale e data iniziale:** modifica `CONFIG` in `script.js`. La data va scritta come `AAAA-MM-GG`.
- **Lettera:** modifica i paragrafi dentro `letterBody` in `index.html`.
- **Foto:** nella versione iniziale sono segnaposto grafici. Per aggiungere immagini, metti i file in `public/images/` e modifica il contenuto dei riquadri in `index.html` usando, ad esempio, `<img src="public/images/foto1.jpg" alt="Un nostro ricordo">`.
- **Musica:** metti un file audio che puoi usare legalmente in `public/audio/nostra-canzone.mp3`. Il pulsante lo riprodurrà dopo il tocco dell'utente.

## Pubblicazione gratuita su GitHub Pages
1. Crea un account GitHub, se non ne hai già uno.
2. Crea un nuovo repository pubblico, ad esempio `per-carlotta`.
3. Carica `index.html`, `styles.css`, `script.js` e la cartella `public`.
4. Nel repository vai in **Settings → Pages**.
5. Seleziona la pubblicazione dal branch `main` e dalla cartella `/ (root)`, quindi salva.
6. Attendi che GitHub Pages mostri l'URL pubblico. Apri quel link da iPhone e verifica tutte le sezioni.

## QR code a forma di cuore
Il QR definitivo va generato **dopo** la pubblicazione, perché deve contenere l'URL pubblico vero. Non usare URL inventati. Puoi usare un generatore di QR affidabile e inserire l'URL pubblico; scegli un design con cuore centrale o cornice a cuore e poi prova la scansione con almeno due telefoni prima di stamparlo. Un codice con i moduli deformati per seguire esattamente la forma di cuore può diventare meno leggibile: meglio mantenere la matrice QR integra e decorarla con un cuore esterno.

## Nota
Il sito usa Google Fonts quando è disponibile una connessione Internet; in assenza di rete userà font di riserva. Le foto, le date e la canzone sono lasciate come contenuti da personalizzare: non sono stati inventati ricordi reali.
