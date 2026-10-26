# Librerie incluse

Copiate qui perché l'app funzioni senza dipendere da CDN esterne.

| File | Pacchetto npm | Versione |
|---|---|---|
| `anthropic-sdk.mjs` | `@anthropic-ai/sdk` (bundle ESM con esbuild) | 1.3.0 |
| `marked.min.js` | `marked` | 12.0.2 |
| `purify.min.js` | `dompurify` | 3.1.6 |
| `pptxgen.bundle.js` | `pptxgenjs` | 3.12.0 |
| `pdf.min.mjs`, `pdf.worker.min.mjs` | `pdfjs-dist` (build `legacy`, per iPhone meno recenti) | 5.7.284 |

Per rigenerare il bundle dell'SDK:

```bash
npm i @anthropic-ai/sdk@1.3.0 esbuild
echo 'export { default } from "@anthropic-ai/sdk";' > entry.mjs
npx esbuild entry.mjs --bundle --format=esm --platform=browser --minify --legal-comments=eof --outfile=anthropic-sdk.mjs
```
