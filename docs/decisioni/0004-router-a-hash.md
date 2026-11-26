# 0004 — Router a hash

- **Stato**: accettata
- **Data**: 2026-11-25

## Contesto

GitHub Pages non riscrive gli URL verso `index.html`.

## Decisione

URL come `#/playlist/<chiave>` gestiti da `src/app/router.ts`.

## Conseguenze

Link profondi e pulsante indietro funzionano ovunque, anche nella TWA. Lo skip link non usa l'hash (vedi `src/ui/a11y/SkipLink.tsx`).
