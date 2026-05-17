# @craft-codex/core

Open-Core engine for Mixed-Reality apprentice learning in the woodworking trades.
**MIT-licensed**, framework-agnostic — pure interfaces and compute functions.

## What's inside

| Module      | Contents                                                                     |
| ----------- | ---------------------------------------------------------------------------- |
| `geometry/` | Procedural Three.js geometry for wood joints (dovetail / Schwalbenschwanz)   |
| `surface/`  | Mode-plugin interface for the master surface (blackboard, CAD, video, call) |
| `voice/`    | Provider interfaces (`ISTTProvider`, `ITTSProvider`, voice pipeline state)   |
| `tracking/` | Tracking abstraction (`ITrackingProvider`) — manual, image, ArUco            |
| `rag/`      | RAG provider interface + topic guard                                         |

## What's NOT inside

- ❌ Concrete provider implementations — those live in consumer apps
- ❌ Next.js / React — framework-agnostic
- ❌ Database/auth — consumer apps wire their own
- ❌ Enterprise multi-tenant features — separate (not in this package)

## Architecture rule

`@craft-codex/core` contains only **interfaces + pure compute functions** (e.g. dovetail geometry). Implementations live in consumer apps. The included `boundary-check.sh` script enforces this — no framework imports, no auth/db imports.

## Boundary enforcement

```bash
pnpm boundary-check    # CI: detects framework / proprietary imports
pnpm lint              # ESLint boundary rules
```

## Use cases

**Dovetail joint** (Schwalbenschwanz):

```typescript
import {
  computePins,
  generateMarkings,
  generateBoardAMesh,
  DEFAULT_DOVETAIL_PARAMS,
} from "@craft-codex/core";
import * as THREE from "three";

const params = { ...DEFAULT_DOVETAIL_PARAMS, pinCount: 7, ratio: 8 };
const pins = computePins(params);
const markings = generateMarkings("anreissen", params);
const boardA = generateBoardAMesh(params, THREE);
```

**Surface mode plugin system:**

```typescript
import { ModeManager } from "@craft-codex/core";

const manager = new ModeManager();
manager.register(new TafelMode());
manager.register(new CADMode());
await manager.switch("tafel", { target: null, state: {} });
```

## Open-Core strategy

This library is the **engine**. Schools, vocational programs, and small workshops can use it without any account or hosted backend:

- ✅ Parametric dovetail geometry (no CAD pipeline needed)
- ✅ Learning-path engine (step sequence + state)
- ✅ Surface plugin system (bring your own modes)
- ✅ Tracking abstraction (manual + marker fallbacks)

Optional commercial extensions (multi-tenant, advanced RAG, live-call mode, audit-trail) live in separate packages outside this MIT engine.

## Status

🚧 **0.1.0** — Initial release. Ships with the standalone app `@craft-codex/tischler` (Phase B + C + D voice stack ready, dormant without API keys).

## License

MIT — see [LICENSE](./LICENSE).
