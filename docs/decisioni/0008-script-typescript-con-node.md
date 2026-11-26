# 0008 — Script in TypeScript eseguiti direttamente da Node

- **Stato**: accettata
- **Data**: 2026-11-25

## Contesto

Gli script devono riusare la logica di `src/domain/` senza una build.

## Decisione

`scripts/*.ts` girano con `node script.ts` (type stripping nativo di Node 24 o successivo) e importano `src/domain/`. I test che usano API Node si chiamano `*.node.test.ts` e sono controllati con `tsconfig.node.json`.

## Conseguenze

In `src/domain/` solo sintassi "erasable" (`erasableSyntaxOnly`) e import con estensione `.ts`.
