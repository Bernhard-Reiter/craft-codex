# Deployment — lehrling-edu

## Production-Deployment via Vercel

### Setup (einmalig)

```bash
# 1. Vercel CLI installieren (falls noch nicht da)
pnpm dlx vercel --version

# 2. In den lehrling-edu Ordner wechseln (Monorepo-Root project)
cd apps/lehrling-edu

# 3. Mit Vercel verlinken — neues Projekt erstellen ODER bestehendes "voai-lehrling" waehlen
vercel link

# Bei "voai-lehrling": Build-Settings werden aus apps/lehrling-edu/vercel.json gelesen
# Wichtig: Monorepo-Root muss als Project Root in Vercel Dashboard eingestellt sein
```

### Environment Variables (in Vercel Dashboard setzen)

**Phase C — Mock-Only (default):**

Keine env Vars noetig. Voice-Pipeline laeuft mit Mocks (Demo-Modus).

**Phase D — Real Voice Providers (optional):**

```
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=...
```

**WICHTIG:** Diese sind serverseitig — Client-Code kann sie NICHT lesen. Phase D Real-Provider muss ueber Next.js API-Routes proxen:

```
app/api/voice/stt/route.ts   → Whisper-Proxy (Server-Side fetch)
app/api/voice/tts/route.ts   → ElevenLabs-Proxy
app/api/voice/answer/route.ts → Claude SSE-Proxy
```

Code dafuer wartet auf Phase E PR — derzeit nutzen alle Provider direkten Client-Side fetch, was fuer Browser-API-Key-Exposure NICHT geeignet ist. Daher Phase C Mock-Mode bleibt Default bis Phase E.

### Deploy

```bash
# Preview-Deploy (jede git push → automatisch wenn integriert)
vercel

# Production-Deploy
vercel --prod
```

### Production-Build lokal testen

```bash
cd $(workspace root)
pnpm --filter @voai/lehrling-edu build
pnpm --filter @voai/lehrling-edu start
# → http://localhost:3100
```

## Domain-Setup (Vorschlag fuer 26.06 Demo)

| Stage                | Domain                               |
| -------------------- | ------------------------------------ |
| Preview (jeder Push) | `lehrling-edu-{commit}.vercel.app`   |
| Stable Demo          | `lehrling.voai.app` (CNAME → vercel) |

Domain via Vercel Dashboard → Settings → Domains. CNAME im VOAI DNS auf `cname.vercel-dns.com`.

## WebXR-Anforderungen

Damit WebXR auf Quest 3 / Galaxy XR funktioniert:

1. **HTTPS Pflicht** — Vercel macht das automatisch (Let's Encrypt)
2. **Permissions-Policy** — `vercel.json` setzt Header fuer `xr-spatial-tracking`, `camera`, `microphone`
3. **COEP/COOP** fuer Worklets — gesetzt in `vercel.json`
4. **Browser-Kompat** — Chrome ≥ 110, Quest Browser ≥ v32, Samsung Internet ≥ v22

## Build-Performance

| Metric                    | Wert                                                       |
| ------------------------- | ---------------------------------------------------------- |
| Cold-Build                | ~45-60s (Mac Mini, M2)                                     |
| Hot-Build (Turbo-Cache)   | ~5-10s                                                     |
| `.next` Output            | ~50 MB                                                     |
| First Load JS shared      | 101 kB                                                     |
| `/dovetail` First Load    | 397 kB (Three.js + R3F + drei + perfect-freehand + hls.js) |
| `/dovetail/xr` First Load | 399 kB (+ @react-three/xr)                                 |
| `/voice` First Load       | 121 kB (lib/rag + lib/voice nur)                           |

## Vercel-Project-Settings (Manual Setup im Dashboard)

- **Framework Preset:** Next.js
- **Root Directory:** `apps/lehrling-edu`
- **Build Command:** wird aus `vercel.json` gelesen
- **Install Command:** wird aus `vercel.json` gelesen
- **Output Directory:** `.next`
- **Node.js Version:** 20.x
- **Region:** Frankfurt (fra1) — naehe Europa

## Smoke-Test nach Deploy

```bash
# Vercel-URL aus Output kopieren
URL="https://lehrling-edu-XYZ.vercel.app"

# HTTP-Status check
curl -s -o /dev/null -w "/: %{http_code}\n" $URL/
curl -s -o /dev/null -w "/dovetail: %{http_code}\n" $URL/dovetail
curl -s -o /dev/null -w "/dovetail/xr: %{http_code}\n" $URL/dovetail/xr
curl -s -o /dev/null -w "/voice: %{http_code}\n" $URL/voice
```

Alle sollten 200. Falls 500 → Vercel Logs checken (`vercel logs <url>`).

## Rollback

```bash
# Vercel Dashboard → Deployments → ältere Deploys → "Promote to Production"
# ODER CLI:
vercel rollback
```

## Phase E TODO

- [ ] API-Routes fuer Voice-Provider (Server-Side-Proxy, keine Client-Side-Keys)
- [ ] Multi-Tenant Auth (Supabase) fuer kommerzielle Berufsschulen
- [ ] Monitoring (Sentry-DSN + Vercel Analytics)
- [ ] CI: auto-deploy bei main-Push, preview-deploy bei PR
