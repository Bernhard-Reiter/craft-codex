# @craft-codex/tischler

KI-first Lehrtool fürs Holzhandwerk — der erste Baustein des **Craft Codex Universums**. **MIT-lizenziert, Open-Source, offline-fest.**

> **Status:** lauffähige Demo auf Enterprise-Niveau. Geführte interaktive Lektion (Zinken/Schwalbenschwanz), Meister-Stimme (RAG-geerdet), 3D + WebXR, Lehrer-Cockpit — alles offline-fähig.

---

## Was es kann

- 🪵 **Schwalbenschwanz in 3D**, parametrisch (Pin-Anzahl, Schwalbenwinkel 1:6/1:8, Brettmaße) — mit Error-Boundary + 2D-Fallback, falls kein WebGL.
- 🎓 **Geführte interaktive Lektion** (`/werkstatt`): eine Regie-Bühne, die pro Lern-Beat die passende Fläche zeigt; der Meister erzählt jeden Schritt; XR-Übergabe „jetzt du am Holz". Kiosk-Modus (`?kiosk=1`) für die narrensichere Demo.
- 🗣️ **Stimme des Meisters** (RAG + Google Gemini TTS, server-seitig): geerdete Antworten aus dem Fachkorpus mit **Citation-Badge** (zeigt die Quelle) — die KI erfindet nichts. Offline-Cache + Live-Fallback.
- 📚 **Überblick & Lernpfad** (`/lernen`): was sind Zinken, Zinkenarten, Schwalbenwinkel-Auswahl 1:6/1:8 — mit RIS-Anker (amtliche Ausbildungsordnung).
- 🧑‍🏫 **Lehrer-Cockpit** (`/cockpit`): Klassenfortschritt + „braucht Meister"-Flag.
- ⭐ **Vision** (`/universum`): das Craft-Codex-Universum-Manifest.
- 🌌 **WebXR** (`/dovetail/xr`): das Werkstück immersiv auf Quest 3 / Galaxy XR.
- 🎨 **Tafel + CAD** als Master-Surface-Modi (`/dovetail`); Video folgt (Phase D).
- 🔒 **Offline-fest & lokal:** kein Byte verlässt das Gerät; läuft ohne Netz im Template-/Cache-Modus.

## Routen

`/` Start · `/universum` Vision · `/lernen` Überblick · `/werkstatt` geführte Lektion · `/cockpit` Lehrer · `/dovetail` freies 3D-Werkstück · `/dovetail/xr` WebXR · `/voice` Stimm-Test · `/api/voice/{answer,tts,stt,health}` Server-Routen.

---

## Setup (local dev)

Voraussetzungen: Node ≥ 20, pnpm 9.

```bash
pnpm install
pnpm --filter @craft-codex/tischler dev   # → http://localhost:3100
```

Tests / Typecheck / Build:

```bash
pnpm --filter @craft-codex/tischler test
pnpm --filter @craft-codex/tischler typecheck
pnpm --filter @craft-codex/tischler build
```

### Stimme konfigurieren (optional)

Keys werden **nur server-seitig** (`app/api/voice/*`) genutzt. Ohne Keys läuft alles offline im Template-/Mock-Modus (kein Crash). Siehe **[`.env.example`](./.env.example)** — kopiere nach `.env.local`. Default-Provider ist Google Gemini (`GEMINI_API_KEY`). Vorvertonten Offline-Cache bauen: `pnpm tts:cache`.

---

## Architektur

```
apps/tischler/
├─ app/
│  ├─ layout.tsx            DE locale, Plus Jakarta Sans (vendored), globals.css
│  ├─ page.tsx              Start
│  ├─ universum/            Vision-Manifest
│  ├─ lernen/               Überblick + Lernpfad + Schwalbenwinkel
│  ├─ werkstatt/            geführte interaktive Lektion (Regie-Bühne, Kiosk)
│  ├─ cockpit/              Lehrer-Ansicht
│  ├─ dovetail/             freies 3D-Werkstück (+ /xr WebXR)
│  ├─ global-error.tsx      letztes Netz gegen weißen Screen
│  └─ api/voice/            Server-Routen: answer · tts · stt · health
├─ components/              DovetailScene, SceneBoundary, VoiceConsole,
│                           ZinkenDiagram, SchwalbenwinkelWahl, OfflineTrust …
├─ lib/
│  ├─ voice/                Pipeline, Gemini/Claude/ElevenLabs/Whisper, TTS-Cache
│  ├─ rag/                  LocalRAGProvider + TopicGuard + Fachkorpus
│  ├─ zinken/               Lernpfad- + Lektions-Datenmodell
│  ├─ surface-modes/        Tafel / CAD / Video Master-Surfaces
│  └─ storage/, tracking/   localStorage, Manual-Placement
└─ public/                  Statische Assets (+ tts-cache, gitignored)
```

**Design:** „VOAI Paper"-Form (Plus Jakarta Sans, Emboss statt Schatten, max 8 px Radius, max Semibold) mit CyberCraft-Signalgelb als einzigem Akzent. Hell, ruhig, kein Dark-Mode.

**Open-Core-Grenze:** importiert NUR aus `@craft-codex/core` (MIT) — keine proprietären/Supabase-Imports; die App bleibt standalone lauffähig.

## Stack

Next.js 15 · React 19 · TypeScript · Three.js + @react-three/fiber/drei/xr · Zod · vitest. Voice: Google Gemini (Answer + TTS) als Default; optional Claude / Whisper / ElevenLabs.

## Lizenz

MIT — siehe [LICENSE](./LICENSE). Teil des offenen Handwerks-Wissens-Commons.
