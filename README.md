# Craft Codex

> Mixed-Reality knowledge base for the trades. Open-source, **MIT**.

A three-layer learning augmentation for hands-on craft education — starting with the dovetail joint (Schwalbenschwanz) for woodworking apprentices.

- 🎙️ **Voice layer** — master speaks from off-stage (dormant Whisper + Claude + ElevenLabs pipeline)
- ✨ **Hologram layer** — marking lines + tool paths projected onto the real workpiece (WebXR)
- 📋 **Master surface** — floating board with a plugin system (drawing, CAD, video)

**No avatar render.** The apprentice focuses on the workpiece, not on the rendering.

The architecture is trade-agnostic: a new trade ships as a new app (e.g. `apps/metallbearbeitung`) reusing the same `packages/core` engine.

## Quick start

```bash
pnpm install
pnpm dev
# → http://localhost:3100
```

Open `/dovetail` for the 2D demo, `/dovetail/xr` for immersive WebXR (Quest 3 / Galaxy XR / Chrome with WebXR emulator).

## Languages 🌍

The site is fully bilingual — **German** (`/de`, default) and **English** (`/en`), switchable in the header. This covers UI, lessons, the RAG knowledge corpus and the voice master (system prompts, STT language hint, TTS delivery). Terminology follows [`docs/i18n/GLOSSARY.md`](docs/i18n/GLOSSARY.md) — the single source of truth for DE→EN trade terms. One deliberate exception: **Austrian legal sources (RIS) are never translated** — regulations stay authentic German and are cited as such. DE↔EN message parity is enforced in CI (`pnpm --filter @craft-codex/tischler i18n:check`).

## Project layout

The repo is organised by **Gewerk** (trade). Each trade ships as its own app sharing the same core engine. Workpieces live as routes inside the trade app.

```
.
├── apps/                       Trades (Gewerke) — one Next.js app per trade
│   ├── tischler/               🪵 Cabinetmaker (current)
│   │   ├── app/
│   │   │   ├── /                Landing — workpiece selector
│   │   │   ├── /dovetail        Schwalbenschwanz workpiece (5 learning steps)
│   │   │   ├── /dovetail/xr     Immersive WebXR session
│   │   │   ├── /werkstatt       Workshop overview
│   │   │   ├── /lernen          Learning hub
│   │   │   ├── /universum       Trade universe
│   │   │   ├── /voice           Voice pipeline test
│   │   │   ├── /beitragen       Community contribution form (magic-link auth)
│   │   │   ├── /admin/contributions   Master review UI
│   │   │   └── /api             Voice proxy + contributions REST API v1
│   │   ├── components/          R3F scene + UI building blocks
│   │   ├── lib/                 Provider implementations
│   │   └── scripts/             TTS-cache builder for offline demos
│   ├── maurer/                 🧱 Mason — planned
│   ├── zimmerer/               🪚 Framer / Carpenter — planned
│   ├── elektro/                ⚡ Electrician — planned
│   ├── schlosser/              🔧 Locksmith / Metal — planned
│   └── kfz/                    🚗 Automotive — planned
└── packages/
    └── core/                   Framework-agnostic engine (the codex)
        ├── geometry/            Procedural workpiece math + CSG helpers
        ├── tracking/            ITrackingProvider (manual / image / aruco)
        ├── surface/             SurfaceMode plugin system + ModeManager
        ├── voice/               ISTTProvider / ITTSProvider / pipeline state
        └── rag/                 RAG + topic-guard interfaces
```

### Naming convention

- **npm packages:** `@craft-codex/<gewerk>` for trade apps, `@craft-codex/core` for the shared engine
- **URLs inside a trade app:** `/<workpiece>` (e.g. `/dovetail`, future `/fingerzinken`, `/zapfen`)
- **localStorage keys:** `craft-codex:<scope>:<key>` (e.g. `craft-codex:dovetail:session`)

The Tischler app currently ships one workpiece (Schwalbenschwanz / dovetail). Future workpieces extend the route table without changing core packages.

> ⚠️ **localStorage scope across trades.** Keys are origin-scoped by the browser. If you deploy every trade on its own domain (`tischler.example.app`, `maurer.example.app`) keys cannot collide. If you deploy multiple trades behind the *same* origin (e.g. `example.app/tischler`, `example.app/maurer`), include the trade in the key prefix — bump to `craft-codex:tischler:dovetail:session` to avoid mode-state leaking between trades.

### Dev port map

Each trade app runs its own dev server. Use a different port per trade so parallel development doesn't collide.

| Trade | Port |
|---|---|
| `apps/tischler/` | 3100 |
| `apps/maurer/` (planned) | 3101 |
| `apps/zimmerer/` (planned) | 3102 |
| `apps/elektro/` (planned) | 3103 |
| `apps/schlosser/` (planned) | 3104 |
| `apps/kfz/` (planned) | 3105 |

Override per environment: `PORT=3200 pnpm --filter @craft-codex/tischler dev`.

## Phase status

| Phase | Scope | Status |
|---|---|---|
| **B** | Skeleton — geometry, scene, sliders, mode stubs, RAG stub, WebXR detection | ✅ |
| **C** | Real modes (Tafel/CAD/Video), Mode switcher, RAG corpus (41 docs), Voice foundation with mocks, full WebXR session | ✅ |
| **D** | Real voice providers (Whisper / Claude SSE / ElevenLabs), MicRecorder + AudioWorklet, TTS-cache for backup, voice factory with mode-badge | ✅ (dormant — needs API keys) |
| **E** | Server-side API routes for voice (`/api/voice/{stt,tts,answer,health}`) | ✅ |
| **F** | Community contribution platform — `/beitragen` form + magic-link auth, master review UI (`/admin`), versioned REST API v1 (Bearer auth + idempotency), deterministic corpus export with SHA-256 manifest | ✅ |
| — | Live-call mode (LiveKit / WebRTC) | ⏭️ (roadmap) |

## Tech stack

| Layer | Tool | Version |
|---|---|---|
| Framework | Next.js | 15.5.x |
| React | React | 19.2.x |
| 3D | Three.js | 0.170.x |
| 3D-React | @react-three/fiber | 9.6.x |
| 3D-Helpers | @react-three/drei | 10.7.x |
| WebXR | @react-three/xr | 6.6.x |
| CSG | three-bvh-csg | 0.0.17 |
| Drawing | perfect-freehand | 1.2.x |
| Video | hls.js | 1.5.x |
| Tests | Vitest | 2.1.x |
| Storage MVP | browser localStorage | — |

## Knowledge base

The voice pipeline answers from a **~350-document RAG corpus** (268 DE + 81 EN + community contributions) covering all five learning steps of the dovetail joint (anreissen, saegen, stemmen, passen, pruefen) plus joinery fundamentals, construction knowledge, tool knowledge, wood knowledge, and safety:

| Corpus | Docs | Source |
|---|---|---|
| `ris-corpus.ts` | 187 | **Official Austrian vocational training ordinance** (Tischlerei-Ausbildungsordnung, BGBl. II Nr. 312/2022), harvested paragraph-by-paragraph from the RIS OGD API — amtliches Werk gem. §7 UrhG, cited with source |
| `dovetail-corpus.ts` (+ `.en`) | 53 + 53 | Dovetail domain knowledge — Wikipedia DE (CC-BY-SA 4.0) + paraphrased standard works (Spannagel, Klausz, Pollak) |
| `zinken-grundlagen-corpus.ts` (+ `.en`) | 18 + 18 | Joinery fundamentals |
| `dovetail-konstruktion-corpus.ts` (+ `.en`) | 10 + 10 | Construction knowledge |
| `community/` | 1+ | Approved community contributions (CC-BY-SA 4.0), deterministic export with SHA-256 manifest |

See the corpus files under `apps/tischler/lib/rag/corpus/` for full attribution + topic coverage. Austrian legal sources are never translated (see Languages above).

## Voice modes

```typescript
import { createVoiceProviders } from "@craft-codex/tischler/lib/voice/factory";
import { LocalRAGProvider } from "@craft-codex/tischler/lib/rag/local-rag";
import { StubTopicGuard } from "@craft-codex/tischler/lib/rag/topic-guard";
import { getDovetailCorpus } from "@craft-codex/tischler/lib/rag/corpus/dovetail-corpus";

const rag = new LocalRAGProvider(getDovetailCorpus());
const guard = new StubTopicGuard({ rag, blacklist: ["bitcoin"] });

const providers = createVoiceProviders({
  rag, guard,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
  elevenLabsApiKey: process.env.ELEVENLABS_API_KEY,
});
// providers.mode === "real" if all three keys, otherwise "mock"
```

⚠️ **Security:** In a browser bundle, API keys are exposed to the client. Use the real-mode pipeline only behind the server-side proxy routes (`apps/tischler/app/api/voice/{stt,tts,answer,health}` — built in Phase E, keys stay on the server). CI enforces that no `NEXT_PUBLIC_*_API_KEY` ever reaches the bundle.

## Open-Core

This repo is the **MIT engine + reference tutor**. Optional commercial extensions (multi-tenant auth, advanced RAG, live-call mode, compliance/audit) live in separate packages outside this MIT engine.

The `boundary-check.sh` script in `packages/core/` enforces that the engine stays free of framework / database / auth imports — anyone can fork and host without any commercial dependency.

## Demo deployment

```bash
cd apps/tischler
vercel link
vercel --prod
```

WebXR requires HTTPS — Vercel provides this out of the box. See `apps/tischler/DEPLOY.md` for full setup including Permissions-Policy headers and the optional pre-cached TTS audio for offline fallback.

## Testing

```bash
pnpm test            # all packages
pnpm typecheck       # tsc --noEmit across workspace
pnpm boundary-check  # enforces open-core boundary
pnpm build           # production build
```

Currently ~430 tests across the workspace (geometry, CSG, providers, RAG, voice factory, contribution state machine + API integration, timing-safe auth, golden-master corpus export).

## Roadmap

- ~~**Q2 2026** Phase E — server-side voice proxy~~ ✅ shipped (plus contribution platform, Phase F)
- **Next** Second workpiece in `apps/tischler` (Fingerzinken / Zapfen) — the route table is built for it, core packages stay untouched
- Tafel mode: real-time AI-generated SVG diagrams; image-tracking on real boards
- Live-call mode (LiveKit / WebRTC); ArUco / OpenCV.js fallback tracking
- Additional trades — `apps/maurer`, `apps/elektro`, `apps/kfz` — reusing the same core engine

## Contributing

Pull requests welcome. The repo follows a few conventions:

- All real provider calls go through `fetchImpl` for testability
- Browser-only modules guard against SSR (`typeof window` check)
- Boundary check must pass — no framework / DB imports in `packages/core`
- TS strict mode, no `any` outside explicit boundaries

## License

MIT — see [LICENSE](./LICENSE).
