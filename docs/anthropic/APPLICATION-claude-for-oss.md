# Claude for Open Source — Application Draft

> Ziel-Formular: https://claude.com/contact-sales/claude-for-oss
> Status: DRAFT — Bernhard reviewt vor Absenden.
> Benefit des Programms: 6 Monate Claude Max 20x. (API-Credits separat: siehe API-CREDITS-PITCH.md)

---

## Project

**Name:** Craft Codex
**Repo:** https://github.com/Bernhard-Reiter/craft-codex (MIT)
**Live demo:** https://c-c-tischler.vercel.app/en

## One-line description

An open-source mixed-reality knowledge base for the skilled trades — master craftsman knowledge as a parametric 3D workpiece, a voice that answers apprentices' questions (Claude + RAG), and a hologram projected onto the real bench (WebXR).

## Why this project matters (the honest pitch)

Europe's workshops are losing their masters. When a cabinetmaker with 30 years of experience retires, the knowledge of *how to lay out a dovetail so it fits on the first try* usually retires with him. Apprentice numbers are falling; the knowledge transfer chain — master shows, apprentice copies — is breaking.

Craft Codex rebuilds that chain digitally, and openly:

- **The master's voice**: an apprentice at the bench, headset on, tools in hand, asks "why 1:8 for hardwood?" — and gets a three-sentence answer in workshop tone, grounded via RAG in a curated trade corpus (80+ documents: craft knowledge, Wikipedia-attributed material, and authentic Austrian training regulations from RIS). Claude (`claude-sonnet-4-6`) is fully integrated as an answer brain; for cost reasons the public demo currently defaults to a cheaper provider — flipping that default to Claude is exactly what we're asking for.
- **The hologram**: layout lines and tool paths projected onto the real workpiece (WebXR on Quest 3 / Galaxy XR). No avatar — the apprentice looks at the wood, not at a rendering.
- **Offline-proof**: workshops don't have fair-weather Wi-Fi. The demo chain degrades gracefully: cached audio → server → text templates. It never breaks.
- **Trade-agnostic core**: the engine is a package; each trade (cabinetmaker, mason, carpenter, electrician…) ships as its own app. The dovetail joint is workpiece #1 of a much larger map.

## Who is behind it

Bernhard Reiter, 45 — Austrian master cabinetmaker (Tischlermeister), 30 years at the bench, **no IT background**. He directs AI through spoken language; the entire codebase was built in collaboration with Claude. That is the second story this project tells: *Claude turned a master craftsman into a software author.* The knowledge in the corpus is his — checked against official sources (Austrian RIS training regulations, cited per document with license metadata).

## Honest metrics (no inflation)

- Young project (first public iteration 2026), MIT-licensed monorepo (Next.js / React Three Fiber / WebXR)
- 283 automated tests, typed end-to-end, bilingual DE/EN including the voice pipeline
- Claude (claude-sonnet-4-6) fully integrated as the RAG-grounded answer engine (streaming, topic-guarded, bilingual); the public demo currently defaults to a cheaper provider purely for cost — honesty over marketing
- Corpus: 80+ documents with per-document license + attribution metadata (own paraphrase / CC-BY-SA with attribution / official documents)

We don't meet the star thresholds — we're applying through your *"if you maintain something the ecosystem quietly depends on, apply anyway"* door: nobody else is building an open, offline-capable MR knowledge layer for the trades, and everything we learn (voice-at-the-bench UX, RAG over regulated training content, XR without avatars) lands in public code others can reuse.

## What we'd use Claude Max for

The project is developed *by* Claude (planning, code, reviews) and runs *on* Claude (the master's voice). Max keeps the development loop going: new trades, new workpieces, corpus tooling, and the evaluation harness for answer grounding.

---

## Form-Kurzfassungen (falls Felder Zeichenlimits haben)

**100 chars:** Open-source MR knowledge base for the trades — Claude answers apprentices at the workbench.

**250 chars:** Craft Codex (MIT) preserves endangered master-craftsman knowledge: parametric 3D workpieces, WebXR holograms on the real bench, and a Claude+RAG "master's voice" that answers apprentices' questions — offline-proof, trade-agnostic, built by a master cabinetmaker with no IT background.
