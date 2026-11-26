# 0007 — TypeScript 6.0 invece di 7

- **Stato**: accettata
- **Data**: 2026-11-25

## Contesto

TypeScript 7 (compilatore nativo) è uscito, ma `typescript-eslint` supporta solo TypeScript `< 6.1`.

## Decisione

`typescript ~6.0.3`; Dependabot ignora i major di TypeScript.

## Conseguenze

Da rivedere quando `npm view typescript-eslint peerDependencies` includerà TypeScript 7.
