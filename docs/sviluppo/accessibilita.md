# Accessibilità (per chi sviluppa)

**Obiettivo**: WCAG 2.2 livello AA. Dichiarazione per gli utenti:
[../utente/accessibilita.md](../utente/accessibilita.md).

## Controlli automatici (bloccano la CI)

| Controllo                  | Dove                               | Cosa verifica                                            |
| -------------------------- | ---------------------------------- | -------------------------------------------------------- |
| Lint `jsx-a11y-x` (strict) | `eslint.config.js`                 | etichette, ruoli ARIA, elementi interattivi, tastiera    |
| axe-core su ogni pagina    | `src/ui/a11y.test.tsx`             | nomi accessibili, liste, id duplicati, ARIA valido…      |
| Contrasto dei token        | `src/styles/contrast.node.test.ts` | testo ≥ 4,5:1, focus e indicatori ≥ 3:1, entrambi i temi |

`npm run check` li esegue tutti.

## Regole del codice

1. **Semantica nativa prima di ARIA**: `<button>` per azioni, `<a href>` per navigare, `<ol>/<ul>`
   per elenchi, `<dialog>` per i modali, `<input type="checkbox" role="switch">` per gli interruttori.
2. **Ogni controllo ha un nome**: testo visibile, `<label>` o `aria-label` preso da `src/i18n/`.
   Pulsanti solo-icona: `aria-label` obbligatorio.
3. **Un `h1` per pagina** con `tabIndex={-1}` (riceve il focus dopo la navigazione), poi `h2`, `h3`
   in ordine. Sezioni con `aria-labelledby` verso il loro titolo.
4. **Gruppi di opzioni** = `SegmentedControl` (radiogroup con frecce, Home, End, un solo Tab).
5. **Messaggi di stato**: `announce()` (`src/state/announcer-store.ts`) o `role="status"`;
   errori `role="alert"` o `announce(…, 'assertive')`. `showToast()` annuncia già da solo.
6. **Link esterni**: componente `ExternalLink` (avvisa "si apre in una nuova scheda").
7. **Immagini**: decorative `alt=""` / `aria-hidden`; le copertine sono decorative perché il titolo
   è sempre scritto accanto.
8. **Focus**: mai `outline: none` senza un'alternativa visibile; colore `--focus`.
9. **Bersagli**: comandi principali ≥ 44px (`--touch`), mai sotto 24px.
10. **Movimento**: tutte le animazioni si fermano con `prefers-reduced-motion` (regola globale).
11. **Scorciatoie a un tasto**: solo tramite `useKeyboardShortcuts`, che rispetta l'impostazione
    per disattivarle (WCAG 2.1.4).
12. **Testi**: unità `rem`; niente testo dentro le immagini.

## Verifica manuale prima di un rilascio

1. **Solo tastiera**: `Tab` dall'inizio → compare "Vai al contenuto principale"; si raggiunge ogni
   comando; il focus è sempre visibile; `Esc` chiude il dialog; nessuna trappola.
2. **Lettore di schermo** (NVDA + Chrome su Windows, TalkBack su Android): titoli delle pagine,
   regioni (navigazione, contenuto, lettore), nome dei pulsanti, annuncio del brano e dei risultati.
3. **Zoom 200% e 400%** (o finestra larga 320px): nessuno scorrimento orizzontale, niente testo
   tagliato.
4. **Preferenze di sistema**: riduci movimento, contrasto elevato di Windows, tema chiaro/scuro.
5. **axe DevTools** (estensione) su Libreria, Playlist, In riproduzione, Impostazioni.
