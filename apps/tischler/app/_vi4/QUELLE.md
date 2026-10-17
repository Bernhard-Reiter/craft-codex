# Herkunft des VI4-Looks

- **Designsystem:** »VOAI Paper« von Bernhard Reiter (VOAI), so wie es die VI4-Website verwendet.
- **Stand der Werte:** 14.10.2026. Die Quelle ist nicht öffentlich. Dieses Repo enthält **keine Kopie** davon, nur die wenigen Farb-, Radius- und Größenwerte, die `look.css` braucht.
- **Schrift:** Plus Jakarta Sans, SIL Open Font License 1.1. Lizenztext: [`app/fonts/OFL-Plus-Jakarta-Sans.txt`](../fonts/OFL-Plus-Jakarta-Sans.txt). Die Schriftdatei selbst ist unverändert die bisherige.

## Regeln

- Alles in `look.css` steht unter `[data-look="vi4"]`. Das prüft `lib/look-css.test.ts`.
- Welche Routen das Attribut tragen, steht nur in `lib/look.ts` (getestet in `lib/look.test.ts`).
- Kontraste nach WCAG 2.2 AA rechnet `lib/look-kontrast.test.ts` direkt aus den Werten in `look.css` nach.
- Ändern sich die VOAI-Werte, wird `look.css` von Hand nachgezogen und der Stand oben aktualisiert.
