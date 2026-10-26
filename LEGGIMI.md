# Per Carlotta — sito romantico

Un piccolo sito statico romantico, rosso e vintage. Funziona senza backend.

## Prova in locale
Apri `index.html` nel browser. Per una prova più affidabile, usa un server locale oppure pubblicalo seguendo le istruzioni qui sotto.

## Cosa c'è dentro
- **Busta iniziale**, con una parola segreta facoltativa per aprirla.
- **Sei sorprese**, ognuna con un cuore da raccogliere: ricordi (foto), il nostro tempo (contatore dal vivo e conto alla rovescia all'anniversario), la nostra canzone, una lettera che si scrive da sola, il barattolo dei perché, buoni d'amore da riscattare.
- **L'ultima sorpresa** si sblocca solo dopo aver raccolto tutti i cuori e si apre con un'esplosione di cuori.
- Cuori raccolti, bigliettini letti e buoni usati restano salvati sul telefono di Carlotta.

## Personalizzazione
Tutto si cambia dall'oggetto `CONFIG` all'inizio di `script.js`, senza toccare `index.html`:
- `password`: la parola segreta per aprire la busta (vuota = nessuna richiesta). Non distingue maiuscole e minuscole.
- `startDate`: il giorno in cui è cominciato tutto, nel formato `AAAA-MM-GG`.
- `photos`: metti le immagini in `public/images/` e scrivi il percorso in `src` (es. `public/images/foto1.jpg`), con didascalia e un pensiero (`note`) che compare quando la foto si apre.
- `timeline`: le tappe della vostra storia, con data, titolo e testo.
- `song`: un file audio che puoi usare legalmente in `public/audio/`, oppure il link "embed" di Spotify, con titolo e artista.
- `letter`: i paragrafi della lettera.
- `reasons`: i bigliettini del barattolo. Più sono personali, meglio è.
- `coupons`: i buoni d'amore.
- `finalMessage`: il messaggio dell'ultima busta.

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
