# Lehrling-Edu — Phase Plan

A staged build-up from procedural geometry to a complete voice-driven AR teaching tool. Each phase is an additive layer: code from earlier phases stays untouched in later phases.

## Phase B — Foundation

Procedural dovetail math, 3D scene, learning step switcher, parameter sliders. Stubs for the master surface modes and the voice pipeline.

**Engine work** (`packages/lehrlings-core/`):

- `computePins(params)` — parametric pin geometry (3 distribution modes)
- `generateMarkings(step, params)` — marking lines per learning step
- `generateBoardAMesh / generateBoardBMesh` — CSG cuts via three-bvh-csg
- `markingsToLineSegments` — polylines → THREE.LineSegments with vertex colors
- Interface stubs for `SurfaceMode`, `ITrackingProvider`, `IRAGProvider`, voice providers

**App work** (`apps/lehrling-edu/`):

- Next.js 15 + React 19 + Three.js / R3F v9 / drei v10 / @react-three/xr v6
- `/` landing, `/dovetail` 3D scene, sliders, mode bar
- Manual placement provider with `drei TransformControls`
- WebXR capability detection (`detectXRSupport()`)
- localStorage persistence (SSR-safe wrappers)

## Phase C — Real modes + voice mocks

Replace stubs with full implementations. Wire everything into `/dovetail`.

**Modes:**

- **Tafel** — `perfect-freehand` SVG-stroke drawing canvas
- **CAD** — `GLTFLoader` viewer with `<Suspense>` + error boundary + default CC0 models + `parametric:dovetail` URL handler for procedural mesh
- **Video** — `hls.js` for HLS streams + native MP4 fallback, drift-tolerant seeking

**WebXR full session:**

- `createXRStore` + `<XR>` wrapper around the scene
- `XRStepBar` — 5 clickable 3D buttons in immersive mode (works with controllers + hand tracking)
- Boards positioned at table-height (1.2 m up, 0.6 m forward, 3× scale)

**Knowledge corpus** (41 documents, multi-licensed):

- Wikipedia DE (CC-BY-SA 4.0 full-text)
- Lehrplan-AT vocational ordinance (official document)
- Paraphrased domain knowledge with source attribution
- Topic coverage: anreissen, saegen, stemmen, passen, pruefen, uebersicht, werkzeug, holzkunde, sicherheit

**Voice foundation (mocks):**

- `VoicePipeline` orchestrator with state transitions (idle / listening / thinking / speaking)
- `MockSTTProvider` rotating sample queries
- `MockTTSProvider` emitting silent PCM
- `createDovetailAnswerFn` — template synthesizer pulling top-K RAG hits with citation lines
- `VoiceConsole` UI component (mic button, Q/A display, latency badge, mode badge)

## Phase D — Real voice providers (dormant)

Drop-in replacements for the mocks. All providers are **dormant without API keys** — the constructor never throws, only the first call does. This keeps SSR and tests working without configuration.

| Provider | Class | Endpoint | Default model |
|---|---|---|---|
| STT | `WhisperSTTProvider` | api.openai.com / Groq | whisper-1 |
| TTS | `ElevenLabsTTSProvider` | api.elevenlabs.io | eleven_flash_v2_5 |
| LLM | `createClaudeAnswerFn()` | api.anthropic.com (SSE) | claude-sonnet-4-6 |

Plus:

- `MicRecorder` — AudioWorklet (`/public/worklets/pcm-recorder.js`) for browser-native PCM Int16 stream
- `pcmToWavBlob()` helper for Whisper upload
- `CachedTTSProvider` — wraps any TTS provider with a SHA-256 cache lookup (backup tier 3)
- `scripts/build-tts-cache.mjs` — pre-generates top-20 PCM audios offline; stub mode when no API key, real generation when key provided
- `createVoiceProviders(config)` factory — auto-picks real vs mock based on key availability, returns a `{ mode, stt, tts, answer }` bundle

## Phase E — Server-side proxy + multi-tenant

API keys in the browser bundle leak to clients. Phase E moves all real-provider calls to server-side Next.js API routes:

- `app/api/voice/stt/route.ts` — Whisper proxy
- `app/api/voice/tts/route.ts` — ElevenLabs streaming proxy
- `app/api/voice/answer/route.ts` — Claude SSE proxy with RAG context injection
- Optional rate limiting + per-session quota tracking

Plus optional commercial features outside the MIT engine:

- Multi-tenant auth (separate)
- Live-call mode (WebRTC: LiveKit / Daily.co)
- CRM / apprentice-mentor pairing
- Compliance / audit trail
- Image-tracking provider (WebXR `image-tracking` feature when stable)
- ArUco / OpenCV.js fallback tracking

## Testing strategy

- Pure-logic unit tests dominate (vitest `environment: "node"`)
- Custom `fetchImpl` parameter on all real providers → tests use mocked fetch, no live API calls
- `MemoryStorage` polyfill in storage tests (avoids jsdom complexity)
- Boundary check script enforces no framework / DB imports in `lehrlings-core`

## Build performance

| Route | First Load JS |
|---|---|
| `/` | 105 kB |
| `/dovetail` | 397 kB (three + R3F + drei + perfect-freehand + hls.js) |
| `/dovetail/xr` | 399 kB (+ @react-three/xr) |
| `/voice` | 121 kB (lib/rag + lib/voice only) |

## Decisions taken

- **Procedural geometry** instead of CAD-pipeline (no asset risk, live parametric)
- **Standard voice** (German) instead of voice cloning (no GDPR / personality-rights burden)
- **Manual placement** as the primary tracking strategy (WebXR image tracking remains incubation as of 2026)
- **localStorage** for the open MVP (no DB requirement — anyone can self-host)
- **Bag-of-words RAG** in MVP (replaceable with embeddings via `IRAGProvider` interface)
