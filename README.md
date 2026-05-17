# Lehrling-Edu MVP

> Mixed-Reality teaching tool for woodworking apprentices. Open-source, **MIT**.

A three-layer learning augmentation for the trade of cabinetmaking — starting with the dovetail joint (Schwalbenschwanz):

- 🎙️ **Voice layer** — master speaks from off-stage (Phase D dormant pipeline: Whisper + Claude + ElevenLabs)
- ✨ **Hologram layer** — marking lines + tool paths projected onto the real workpiece (WebXR)
- 📋 **Master surface** — floating board with plugin system (drawing, CAD, video)

**No avatar render.** The apprentice focuses on the workpiece, not on the rendering.

## Quick start

```bash
pnpm install
pnpm dev
# → http://localhost:3100
```

Open `/dovetail` for the 2D demo, `/dovetail/xr` for immersive WebXR (Quest 3 / Galaxy XR / Chrome with WebXR emulator).

## Project layout

```
.
├── apps/
│   └── lehrling-edu/          Next.js 15 standalone app (MIT)
│       ├── app/               /, /dovetail, /dovetail/xr, /voice
│       ├── components/        R3F scene + UI building blocks
│       ├── lib/               Provider implementations
│       └── scripts/           TTS-cache builder for offline demos
└── packages/
    └── lehrlings-core/        Framework-agnostic engine (MIT)
        ├── geometry/          Procedural dovetail math + CSG helpers
        ├── tracking/          ITrackingProvider (3 strategies)
        ├── surface/           SurfaceMode plugin system + ModeManager
        ├── voice/             ISTTProvider / ITTSProvider / pipeline state
        └── rag/               RAG + topic-guard interfaces
```

## Phase status

| Phase | Scope | Status |
|---|---|---|
| **B** | Skeleton — geometry, scene, sliders, mode stubs, RAG stub, WebXR detection | ✅ |
| **C** | Real modes (Tafel/CAD/Video), Mode switcher, RAG corpus (41 docs), Voice foundation with mocks, full WebXR session | ✅ |
| **D** | Real voice providers (Whisper / Claude SSE / ElevenLabs), MicRecorder + AudioWorklet, TTS-cache for backup, voice factory with mode-badge | ✅ (dormant — needs API keys + server-side proxy) |
| **E** | Server-side API routes for voice (`/api/voice/{stt,tts,answer}`), multi-tenant auth, live-call mode | ⏭️ |

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

The Voice pipeline answers from a **41-document RAG corpus** covering all five learning steps (anreissen, saegen, stemmen, passen, pruefen) plus tool knowledge, wood knowledge, and safety. Sources include:

- Wikipedia DE (CC-BY-SA 4.0, full-text chunks)
- Lehrplan-AT vocational ordinance (official document)
- Paraphrased domain knowledge from standard works (Spannagel, Klausz, Pollak) — original works are copyrighted

See `apps/lehrling-edu/lib/rag/corpus/dovetail-corpus.ts` for full attribution + topic coverage.

## Voice modes

```typescript
import {
  createVoiceProviders,
  LocalRAGProvider,
  StubTopicGuard,
  getDovetailCorpus,
} from "@voai/lehrling-edu/lib/voice";

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

⚠️ **Security:** In a browser bundle, API keys are exposed to the client. Use the real-mode pipeline only behind a server-side proxy (e.g. Next.js API routes calling the providers from the server). Phase E will add those routes.

## Open-Core

This repo is the **MIT engine + reference app**. Optional commercial features (multi-tenant auth, advanced RAG, live-call mode, compliance/audit) are not part of this package.

The `boundary-check.sh` script in `packages/lehrlings-core/` enforces that the core stays free of framework / database / auth imports — anyone can fork and host without any commercial dependency.

## Demo deployment

```bash
cd apps/lehrling-edu
vercel link
vercel --prod
```

WebXR requires HTTPS — Vercel provides this out of the box. See `apps/lehrling-edu/DEPLOY.md` for full setup including Permissions-Policy headers and the optional pre-cached TTS audio for offline fallback.

## Testing

```bash
pnpm test            # all packages
pnpm typecheck       # tsc --noEmit across workspace
pnpm boundary-check  # enforces open-core boundary in lehrlings-core
pnpm build           # production build
```

Currently ~220 unit tests across the workspace (geometry, CSG, providers, RAG, voice factory).

## Roadmap

- **Q2 2026** Phase E — server-side voice proxy + auth integration
- **Q3 2026** Tafel mode: real-time AI-generated SVG diagrams; image-tracking on real boards
- **Q4 2026** Live-call mode (LiveKit / WebRTC); ArUco / OpenCV.js fallback tracking

## Contributing

Pull requests welcome. The repo follows a few conventions:

- All real provider calls go through `fetchImpl` for testability
- Browser-only modules guard against SSR (typeof window check)
- Boundary check must pass — no framework / DB imports in `lehrlings-core`
- TS strict mode, no `any` outside explicit boundaries

## License

MIT — see [LICENSE](./LICENSE).
