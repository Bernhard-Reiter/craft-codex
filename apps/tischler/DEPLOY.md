# Deployment — @craft-codex/tischler

## Production-Deployment via Vercel

### Setup (einmalig)

```bash
# 1. Vercel CLI installieren (falls noch nicht da)
pnpm dlx vercel --version

# 2. In den dovetail-app Ordner wechseln (Monorepo-Root project)
cd apps/tischler

# 3. Mit Vercel verlinken — neues Projekt erstellen ODER bestehendes "voai-lehrling" waehlen
vercel link

# Bei "voai-lehrling": Build-Settings werden aus apps/tischler/vercel.json gelesen
# Wichtig: Monorepo-Root muss als Project Root in Vercel Dashboard eingestellt sein
```

### Environment Variables (in Vercel Dashboard setzen)

**Ohne Keys:** läuft offline im Template-/Mock-Modus (kein Crash, keine env Vars nötig).

**Mit Stimme (empfohlen):** Default-Provider ist Google Gemini (ein Key für Answer UND TTS):

```
GEMINI_API_KEY=...
# optional: TTS_PROVIDER / ANSWER_PROVIDER, sonst Auto (Gemini wenn GEMINI_API_KEY)
# optionale Alternativen: ANTHROPIC_API_KEY (Claude-Answer), OPENAI_API_KEY (Whisper-STT), ELEVENLABS_API_KEY (TTS)
```

Vollständige Liste + Kommentare: siehe `.env.example`.

**Sicherheit:** Alle Keys bleiben **server-seitig** — die Voice-Provider laufen über Next.js-API-Routes als Proxy (bereits live, kein Client-Side-fetch mehr):

```
app/api/voice/answer/route.ts → Gemini/Claude (server-side)
app/api/voice/tts/route.ts    → Gemini/ElevenLabs (server-side)
app/api/voice/stt/route.ts    → Whisper (server-side)
app/api/voice/health/route.ts → Provider-Status
```

Der CI-Guard bricht ab, falls je ein `NEXT_PUBLIC_*`-Key eingecheckt wird (würde ins Browser-Bundle inlined).

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
pnpm --filter @craft-codex/tischler build
pnpm --filter @craft-codex/tischler start
# → http://localhost:3100
```

## Domain-Setup (Vorschlag fuer 26.06 Demo)

| Stage                | Domain                               |
| -------------------- | ------------------------------------ |
| Preview (jeder Push) | `craft-codex-dovetail-{commit}.vercel.app`   |
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
- **Root Directory:** `apps/tischler`
- **Build Command:** wird aus `vercel.json` gelesen
- **Install Command:** wird aus `vercel.json` gelesen
- **Output Directory:** `.next`
- **Node.js Version:** 20.x
- **Region:** Frankfurt (fra1) — naehe Europa

## Smoke-Test nach Deploy

```bash
# Vercel-URL aus Output kopieren
URL="https://craft-codex-dovetail-XYZ.vercel.app"

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

## Ausblick (nach Förderzusage)

- [x] API-Routes für Voice-Provider (Server-Side-Proxy, keine Client-Side-Keys) — **erledigt**
- [ ] Rate-Limiting auf den /api/voice-Routen (Kosten-/Abuse-Schutz)
- [ ] Multi-Tenant Auth + RLS (Supabase) für kommerzielle Berufsschulen
- [ ] Monitoring (Sentry-DSN + Vercel Analytics)
- [ ] CI: auto-deploy bei main-Push, preview-deploy bei PR
