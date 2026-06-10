# Demo-Kit: Lienz 26./27.06.2026 (Modul 3, Tiroler Fachberufsschule, MINT-Labor)

> Ziel dieses Dokuments: Ein frischer Laptop wird in **10 Minuten** demo-fähig —
> und die Demo überlebt einen kompletten WLAN-Ausfall.
> Rollen: Barlieb fachlich · Bernhard Technik vor Ort · Cody Codebase/Support.

---

## 1. Setup — frischer Laptop → Demo in 10 Minuten

Voraussetzungen: Node ≥ 20, pnpm ≥ 9 (`corepack enable`), git.

```bash
git clone https://github.com/Bernhard-Reiter/craft-codex.git
cd craft-codex
pnpm install
pnpm --filter @craft-codex/core build   # ⚠️ PFLICHT vor allem anderen!
cd apps/tischler
pnpm build
npx next start -p 3000                  # Demo-Server: http://localhost:3000
```

> **⚠️ Die eine Falle:** Ohne `pnpm --filter @craft-codex/core build` schlagen
> Tests und Dev-Server mit `Failed to resolve entry for package "@craft-codex/core"`
> fehl — das Engine-Package liefert erst nach dem Build sein `dist/`.

**Schnelltest danach (alles muss 200 sein):**

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/dovetail
curl -s http://localhost:3000/api/voice/health
```

---

## 2. Stimme (Phase E) — drei Stufen, je nach Netz

Die Voice-Kette fällt automatisch durch: **Offline-Cache → Server-TTS → still (Text bleibt)**.
Antworten (RAG über 41 Dokumente) funktionieren **immer** — auch komplett offline.

### Stufe A — Offline-Stimme (Empfehlung für Lienz)

Einmalig MIT Internet auf dem Demo-Laptop (generiert die Top-Antworten als PCM-Audio):

```bash
cd apps/tischler
ELEVENLABS_API_KEY=sk_... pnpm tts:cache
pnpm build        # Cache wandert in den Build
```

Danach spricht die Demo **ohne jedes Netz** — die Audios liegen unter
`public/tts-cache/`.

### Stufe B — Live-Stimme (wenn Hotspot/Netz vorhanden)

`.env.local` im `apps/tischler/`-Ordner (Keys bleiben am Server, nie im Browser):

```bash
ELEVENLABS_API_KEY=sk_...     # Stimme (TTS)
ANTHROPIC_API_KEY=sk-ant-...  # Claude-Antworten statt Template (optional)
OPENAI_API_KEY=sk-...         # Whisper-Mikrofon (optional, Phase E.2)
```

### Stufe C — kein Key, kein Netz

Demo läuft trotzdem: Fragen-Buttons + Texteingabe → fachliche Text-Antworten
aus dem Korpus. Badge zeigt „Mock", die Konsole sagt ehrlich „kein Audio".

---

## 3. Quest 3 / Galaxy XR verbinden (ohne Schul-WLAN!)

WebXR verlangt HTTPS — **außer für `localhost`**. Der Trick: Das Headset hält
den Laptop für localhost.

### Quest 3 (USB-Kabel, empfohlen — null Netzabhängigkeit)

1. Quest 3: Entwicklermodus aktivieren (Meta-App am Handy → Headset → Entwicklermodus)
2. Laptop: `adb` installieren (`brew install android-platform-tools`)
3. Headset per USB-C anschließen, im Headset „USB-Debugging erlauben" bestätigen
4. ```bash
   adb reverse tcp:3000 tcp:3000
   ```
5. Im Quest-Browser öffnen: `http://localhost:3000/dovetail/xr` → **Enter AR**

> `adb reverse` hält, solange das Kabel steckt. Nach Reboot: Schritt 3-4 wiederholen.

### Galaxy XR (Android XR — gleicher Weg)

Android-XR-Geräte sprechen ebenfalls adb: Entwicklermodus → USB → `adb reverse` →
`localhost:3000`. Falls adb am Gerät nicht freigeschaltet werden kann: Fallback
Laptop-Hotspot + `next start` mit selbstsigniertem HTTPS (Notlösung, vorher testen!).

---

## 4. Demo-Drehbuch (≈ 12 Minuten)

| # | Schritt | Route | Was zeigen |
|---|---------|-------|------------|
| 1 | Einstieg 2D | `/dovetail` | Schwalbenschwanz parametrisch: Slider (Pins, Ratio) live ziehen |
| 2 | 5 Lernschritte | `/dovetail` | Anreissen → Sägen → Stemmen → Passen → Prüfen, farbige Anrisslinien erklären |
| 3 | Stimme | `/voice` oder Konsole in `/dovetail` | Demo-Frage-Button klicken → Antwort MIT Stimme; dann eine Frage **tippen** („geht auch offline") |
| 4 | Mixed Reality | `/dovetail/xr` (Headset) | Enter AR → Bretter auf Tischhöhe, Schritte per 3D-Buttons durchschalten |
| 5 | Hands-on | Headset herumgeben | Lehrlinge: Schritt wechseln, Frage stellen |

**Vor jedem Durchlauf:** Startseite → „↺ Demo zurücksetzen" (wischt Fortschritt + Platzierungen).

### Plan B (XR zickt / Headset-Akku leer)

`/dovetail` am Beamer ist eine **vollwertige 2D-Demo** — gleiche Geometrie,
gleiche Lernschritte, gleiche Stimme. Übergang ohne Gesichtsverlust:
„So sieht der Lehrling das im Headset — hier für alle an der Wand."

---

## 5. USB-Notfall-Stick

```bash
./scripts/build-demo-bundle.sh   # erzeugt dist-demo/craft-codex-demo-<datum>.tar.gz
```

Enthält Repo + fertigen Build + node_modules + diese Anleitung. Auf Zielrechner:
entpacken → `cd apps/tischler && npx next start -p 3000`. Kein Internet nötig.

---

## 6. Checklisten

### Hardware-Test (Freitag bei Barlieb — bitte notieren!)

- [ ] AR-Session startet? (`/dovetail/xr` → Enter AR)
- [ ] Flüssigkeit: ruckelt es beim Kopfdrehen? (Ziel: „fühlt sich nach 72fps an")
- [ ] Hand-Tracking: 3D-Step-Buttons mit Fingern klickbar?
- [ ] Placement: Bretter auf echte Tischhöhe ziehen — bleibt die Pose nach Reload?
- [ ] Anrisslinien: bei Werkstatt-/Schullicht lesbar? (rot/orange/blau/grün unterscheidbar)
- [ ] Akkustand nach 20 min Session?
- [ ] Browser im Headset aktuell? (Quest: Meta Browser Update prüfen)

### Generalprobe T-7 (19./20.06.) — komplett OHNE Internet

- [ ] WLAN/LAN am Laptop AUS → kompletter Durchlauf Drehbuch 1-5
- [ ] Stimme spricht aus dem Cache (Stufe A vorher befüllt!)
- [ ] Getippte Frage → Antwort + ehrliches „kein Audio" falls Cache-Miss
- [ ] adb reverse nach Laptop-Reboot geübt
- [ ] Demo-Reset zwischen zwei Durchläufen
- [ ] USB-Stick auf ZWEITEM Rechner entpackt + gestartet
- [ ] Beamer-Adapter (USB-C → HDMI) eingepackt?

### Packliste Lienz

- [ ] Demo-Laptop (Cache befüllt, .env.local falls Live-Stimme) + Netzteil
- [ ] Quest 3 + USB-C-Kabel (Daten!, nicht nur Laden) + Controller geladen
- [ ] USB-Notfall-Stick · Beamer-Adapter · Mehrfachstecker
- [ ] Handy-Hotspot als Netz-Reserve (für Live-Claude, optional)

---

## 7. Troubleshooting

| Symptom | Ursache → Fix |
|---|---|
| `Failed to resolve entry for package "@craft-codex/core"` | Core nicht gebaut → `pnpm --filter @craft-codex/core build` |
| Port 3000 belegt | `npx next start -p 3001` + adb reverse auf 3001 |
| „Enter AR" fehlt im Headset-Browser | Nicht via localhost geöffnet (HTTPS-Pflicht) → adb reverse prüfen |
| Stimme stumm trotz Cache | `public/tts-cache/manifest.json` leer? → Stufe A wiederholen + `pnpm build` |
| Antwort kommt, aber „offline-Fallback" Badge | Server-Route nicht erreichbar — ok offline; sonst `next start` neu |
| Video-Mode lädt nicht | Braucht Netz (HLS) ODER lokale Datei: MP4 nach `public/videos/` legen und im CAD/Video-Panel `loadSource("/videos/<name>.mp4")` nutzen — für Lienz: Video-Mode überspringen, wenn keine lokalen Clips vorliegen |
