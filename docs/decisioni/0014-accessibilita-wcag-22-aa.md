# 0014 — Accessibilità WCAG 2.2 AA verificata in CI

- **Stato**: accettata
- **Data**: 2026-11-26

## Contesto

L'accessibilità deve restare completa anche dopo modifiche future fatte da persone o AI.

## Decisione

Tre controlli automatici: lint `eslint-plugin-jsx-a11y-x` (fork mantenuto che supporta ESLint 10), axe-core sulle pagine in `src/ui/a11y.test.tsx`, test dei contrasti dei token. Infrastruttura comune: skip link, annunciatore, focus al titolo dopo la navigazione, scorciatoie disattivabili.

## Conseguenze

Una regressione blocca la CI. Regole in [../sviluppo/accessibilita.md](../sviluppo/accessibilita.md).
