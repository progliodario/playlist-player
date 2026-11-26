# 0009 — Android Gradle senza wrapper

- **Stato**: accettata
- **Data**: 2026-11-25

## Contesto

Il wrapper Gradle aggiunge file binari al repository.

## Decisione

Nessun `gradlew`; la CI usa `gradle/actions/setup-gradle` con una versione fissata.

## Conseguenze

In locale Android Studio genera il wrapper se serve.
