# @voai/lehrling-edu

Standalone WebXR Lehrlings-Lehrtool fuer Holzhandwerk. **MIT-lizenziert, Open-Source.**

> **Status:** Phase B Test-Ballon — Schwalbenschwanz-Demo lokal lauffaehig.
> Voice-Pipeline + RAG + WebXR-Tracking sind Phase C.

---

## Was es kann (Phase B)

- 🪵 **Schwalbenschwanz-3D-Modell** mit live einstellbaren Parametern (Pin-Anzahl, Schwalbenwinkel 1:N, Brettstaerke, Brettbreite).
- 📐 **Anrisslinien fuer alle 5 Lernschritte** (Anreissen → Saegen → Stemmen → Passen → Pruefen).
- 🎬 **Manual-Placement-Tracking** (Phase B): Brett im 3D-Raum positionieren via Drag-Handles.
- 🌌 **WebXR-Skelett** mit Fallback-UI (Phase B Stub).
- 💾 **localStorage-Persistence** fuer Session-State (Phase C: server-side DB).

## Was es noch nicht kann (Phase C)

- Voice-Pipeline (Whisper → Claude → ElevenLabs)
- RAG-Korpus + Topic-Guard
- Tafel-Mode mit perfect-freehand
- ImageTracking via WebXR API
- ArUco/OpenCV.js Fallback-Tracking

---

## Setup (local dev)

Voraussetzungen: Node ≥ 20, pnpm 9.

```bash
pnpm install
pnpm --filter @voai/lehrling-edu dev
# → http://localhost:3100
```

Build:

```bash
pnpm --filter @voai/lehrling-edu build
pnpm --filter @voai/lehrling-edu start
```

Tests:

```bash
pnpm --filter @voai/lehrling-edu test
```

---

## Architektur

```
apps/lehrling-edu/
├─ app/
│  ├─ layout.tsx            DE locale, dark mode CSS variables
│  ├─ page.tsx              Landing — 3 Cards (Schwalbenschwanz / XR / Settings)
│  ├─ dovetail/page.tsx     Demo-Page — DovetailScene + Sliders + ModeBar
│  ├─ dovetail/xr/page.tsx  WebXR-Variante (Phase B Stub mit Fallback)
│  └─ globals.css           CSS-Variables (kein Tailwind)
├─ components/
│  ├─ DovetailScene.tsx     Three.js Scene (R3F + drei OrbitControls)
│  ├─ ModeBar.tsx           Lernschritt-Switcher
│  ├─ ParamSliders.tsx      Param-Sliders fuer Geometrie
│  └─ PlacementHandles.tsx  Drag-Handles fuer Manual-Placement
├─ lib/
│  ├─ storage/              localStorage (MVP) — Phase C: server-side DB
│  ├─ tracking/             ITrackingProvider Implementations
│  └─ surface-modes/        SurfaceMode Plugins (Tafel/CAD/Video Stubs)
└─ public/                  Static Assets
```

**Open-Core Boundary:** Diese App importiert NUR aus `@voai/lehrlings-core` (MIT). KEINE VOAI-Pro / Supabase / LiveKit Imports — die App muss standalone lauffaehig bleiben.

## Stack

| Layer      | Tool               | Version |
| ---------- | ------------------ | ------- |
| Framework  | Next.js            | 15.5.x  |
| React      | React              | 19.2.x  |
| 3D         | Three.js           | 0.170.x |
| 3D-React   | @react-three/fiber | 9.6.x   |
| 3D-Helpers | @react-three/drei  | 10.7.x  |
| WebXR      | @react-three/xr    | 6.6.x   |
| CSG        | three-bvh-csg      | 0.0.17  |
| Validation | Zod                | 3.25.x  |
| Storage    | localStorage       | (MVP)   |

## Roadmap

- **Phase B (jetzt):** Skeleton + Schwalbenschwanz-Demo + Manual-Placement
- **Phase C (Q3 2026):** Voice + RAG + Tafel/CAD/Video Modes
- **Phase D (Q4 2026):** Live-Call-Mode + ImageTracking + ArUco-Fallback

## Lizenz

MIT — siehe [LICENSE](./LICENSE).
