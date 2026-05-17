# Workshop Pattern — Hands-On Module With This Tool

Reference structure for a 1.5-day apprentice workshop using `@craft-codex/tischler`. Used in the initial demo cohort (June 2026). Adaptable to any vocational program.

## Goals

1. Apprentices experience the dovetail as a three-layer augmentation (voice + hologram + master surface) — not as an avatar render.
2. The instructor observes whether their pedagogical method is faithfully reflected in the tool, and gives feedback.
3. Sponsors / observers see scaling potential.
4. Project team collects user feedback for the next iteration (with consent).

## Day 1

### 09:00–09:30 — Setup + welcome

- Charge XR headsets, verify all can reach the tunnel URL
- Pre-position workpieces (20 mm oak boards) at each workbench
- Tools per station: marking gauge, sliding bevel, marking knife, Japanese ryoba, two chisels
- Backup XR device pre-loaded
- Edge-server laptop on LAN (mock mode is enough for a basic backup)

The instructor frames the pedagogical contract: *the tool guides, I don't lecture, you build*.

### 09:30–10:30 — Live demo (all together, projected)

The presenter walks through the tool on their own headset with the headset view projected on a beamer:

1. `/dovetail` — board A + board B + marking lines visible
2. Mode bar through the five steps (anreissen → pruefen)
3. Sliders explained: pin count 5, dovetail ratio 1:6 (hardwood)
4. `/dovetail/xr` → enter AR → board appears in the room
5. XR step bar tried out — quader buttons via controller or pinch
6. Voice test: mic → ask a question → RAG-grounded answer
7. Tafel mode opened → quick sketch (dovetail angle demonstration)

### 10:45–12:30 — Hands-on block 1 (marking + sawing)

Five teams of two. Per team: one headset + one workpiece.

- 30 min **marking** — marking gauge all around, dovetail angle with sliding bevel
  - Team member 1: headset on, follows AR marking lines
  - Team member 2: observes + transfers to real wood
  - Swap after 15 minutes
- 30 min **sawing** — pins-first method, kerf on the waste side
  - Headset shows the cut-line hologram
- 30 min **group reflection** — instructor moderates: what helped, what was distracting

### 13:30–15:30 — Hands-on block 2 (chiseling + fitting)

- 60 min **chiseling** — vertical chops on the marking gauge line, then flat removal, never deeper than the gauge
- 60 min **fitting** — dry fit, identify shiny spots (the high points), pare locally

### 15:30–16:00 — Day-1 close

- Apprentices photograph their workpiece (whatever state)
- One-sentence feedback per person
- Workpieces stay covered overnight in the workshop

## Day 2

### 09:00–10:30 — Inspection + assessment

- Tool shows the green target geometry for the "pruefen" step
- Apprentice compares against their workpiece
- Gap > 0.2 mm → "needs rework"
- Gap ≤ 0.2 mm → "passed"
- Self-assessment (marking / sawing / chiseling / fitting quality)
- Instructor assessment + notes

### 10:30–11:30 — Reflection round + feedback doc

Instructor moderates. Each apprentice answers briefly:

1. What was helpful about the tool?
2. What was confusing or distracting?
3. If you used it again — what should be different?
4. Would you recommend it?

The team writes everything down → becomes the next iteration's input.

### 11:30–12:00 — Observer briefing

The team explains:

- Reach (today: 10 apprentices, scalable to 100+ via multi-tenant)
- ROI estimate for vocational schools
- Roadmap (next phase)
- Sponsorship / scaling question

## Material checklist

### Hardware

- [ ] 5 × XR headsets pre-loaded (battery ≥ 80%)
- [ ] 1 × backup XR device
- [ ] Laptop with production build of the tool
- [ ] Edge-server laptop (LAN fallback if internet drops)
- [ ] Power banks for the headsets
- [ ] Mobile 5G / LTE backup if the school WiFi isn't released
- [ ] Beamer + adapter for the live demo

### Tools

- 10 × marking gauge
- 10 × sliding bevel
- 5 × marking knife
- 5 × Japanese ryoba (14–16 TPI)
- 10 × chisels 6–25 mm + mortise chisel
- 5 × wooden mallet
- 10 × oak boards 200 × 100 × 20 mm
- 10 × oak boards 200 × 100 × 20 mm for board B
- 8000-grit waterstone (honing during workshop)
- First-aid kit (cuts + splinters are common)

### Software / demo setup

- [ ] Production build (`pnpm build && pnpm start`) — not dev
- [ ] HTTPS tunnel with stable URL
- [ ] Pre-cached top-20 TTS audios (offline fallback)
- [ ] Backup MP4 screen captures per learning step (worst case)
- [ ] PDF slides with theory (in case the tool can't run at all)

## 4-tier backup plan

```
Tier 1: Headset hardware fault
  → swap to backup headset (same build)

Tier 2: WiFi / internet down
  → edge-server laptop on LAN, cached corpus
  → voice pipeline runs in mock mode (no API calls)

Tier 3: Voice API down (Whisper / Claude / ElevenLabs)
  → pre-cached top-20 PCM audios served from /public/tts-cache/
  → template synthesizer (createDovetailAnswerFn) instead of Claude SSE

Tier 4: Power out
  → battery laptop + power bank
  → 2D MP4 screen captures + PDF slides
  → work the theory with apprentices without the tool
```

## Success definition

| Tier | Result |
|---|---|
| **Minimum** | All apprentices complete the five steps with tool support; ≥ 60% of workpieces pass (gap ≤ 0.2 mm) |
| **Stretch** | ≥ 80% pass; all apprentices report "would recommend" |
| **Wow** | ≥ 90% pass; sponsor commits to next phase; ≥ 1 apprentice becomes a peer mentor |

## What to bring home

- Feedback document (all reflection answers as text)
- Workpiece photos (with consent) — marketing material
- Voice pipeline telemetry (with consent): query count, off-topic rate, average latency per phase
- Hardware wear report (headset battery time, hand-tracking reliability over 2 h, display comfort)
- Instructor notes on pedagogical impact

## Known risks + mitigations

| Risk | P × I | Mitigation |
|---|---|---|
| Apprentice's hand trembles → marking line jitters → unsure | M × M | Manual placement: fix the board pose, marking line stays still |
| Voice pipeline > 5 s — too slow for real-time | M × M | Top-20 cache (< 1 s); pipeline state shows "thinking …" |
| One apprentice can't use the headset (glasses wearer, poor vision) | H × L | Tablet variant as 2D fallback for that person |
| Group dynamic: one apprentice dominates, others passive | M × M | Instructor moderates the swap rhythm; teams of two rotate explicitly |
| Workpieces missing on day 2 | L × H | Pieces tagged + stored centrally; building security informed |

## Post-workshop

- Feedback doc cleaned and shared with instructor + observers
- Pedagogical report from the instructor
- Sponsor decides on the next phase
- Project team updates the roadmap baseline
