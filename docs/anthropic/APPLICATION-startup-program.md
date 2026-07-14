# Anthropic for Startups — Application Draft (VI4)

> Ziel-Formular: https://claude.com/programs/startups (Review 2–4 Wochen, rolling)
> Status: DRAFT — Bernhard reviewt + füllt [PLATZHALTER] vor Absenden.
> Ask-Ebene: Standard-Tier API-Credits (realistisch $1k–5k, ohne VC-Partner möglich).
> Beilage: API-CREDITS-PITCH.md (Meilensteine + Budget-Transparenz).

---

## Company

**Name:** VI4.me — [PLATZHALTER: Rechtsform, z.B. e.U./GmbH]
**Founded:** [PLATZHALTER: Gründungsdatum — muss <4 Jahre sein]
**Location:** Austria (EU)
**Website:** https://vi4.me · Products: https://voai.me · https://c-c-tischler.vercel.app
**Team:** [PLATZHALTER: z.B. "1 founder + AI-native engineering (Claude)"]
**Funding:** Bootstrapped, revenue-financed — no VC. (Terms verlangen kein VC-Funding; Bewertung ist diskretionär nach traction + Claude-Integration.)

## What we're building (one paragraph)

VI4 builds AI-native operations software for small and mid-sized businesses, from a workshop floor in Austria. Two products: **VOAI** — an operations platform ("the operating system for SMB back offices": HR, accounting, support, travel) — and **Craft Codex** (MIT open source) — a mixed-reality knowledge base for the skilled trades that preserves master-craftsman knowledge as parametric 3D workpieces, WebXR holograms on the real workbench, and a voice master that answers apprentices' questions, grounded via RAG in official Austrian training regulations. The founder is a master cabinetmaker with 30 years at the bench and no IT background — the entire company is built by directing Claude in spoken German.

## How we use Claude (today, verifiable)

1. **Engineering:** The whole VI4 codebase (~550k LOC across products) is developed with Claude (Claude Code) as the engineering team — planning, implementation, review, security. Claude is not a tool we tried; it is how this company exists.
2. **Product (Craft Codex):** `claude-sonnet-4-6` is fully integrated as the RAG-grounded "master's voice" answer engine — streaming, topic-guarded, bilingual DE/EN (hand-crafted master persona per language), 400-token answers designed for an apprentice wearing a headset with tools in hand. Full transparency: the public demo currently defaults to a cheaper provider for cost reasons — flipping the production default to Claude is milestone #1 of the credits period.
3. **Product (VOAI):** document understanding, case handling and assistant features across HR/accounting modules — Claude-first where quality is the constraint.

## What API credits unlock (90 days, measurable)

| # | Milestone | Proof |
|---|---|---|
| 1 | Craft Codex production answer brain flipped to Claude (DE/EN), day one | Live URL + env diff |
| 2 | Published grounding eval: ≥50 apprentice questions vs. corpus, both languages | Report in the open repo |
| 3 | Quest-3 demo sessions with apprentices/instructors (Austrian vocational context; pilots in preparation — honestly: not yet contracted) | Session notes in repo |
| 4 | VOAI: Claude-powered document-AI path benchmarked against current provider | Internal eval, shareable summary |

Expected usage: voice answer ≈ 1.2k input / 150 output tokens; demo + pilot + eval traffic, rate-limited server-side, keys never in the browser. We publish monthly usage notes in the open repo — credits get public accounting.

## Why this is a story for Anthropic

A 45-year-old master cabinetmaker who has never written code runs a software company by talking to Claude — and open-sources the part that preserves his trade's knowledge for the next generation. It demonstrates the claim behind Claude better than any benchmark: AI widening who gets to build software, in a sector (skilled trades / SMB) the industry rarely reaches.

---

## Form-Kurzfassungen

**One-liner:** AI-native SMB operations software + an open-source MR knowledge base for the trades — a master cabinetmaker's company, built entirely by directing Claude.

**Claude integration (250 chars):** Claude builds our entire codebase (Claude Code) and powers Craft Codex's bilingual RAG voice master for apprentices (claude-sonnet-4-6, streaming, topic-guarded). Credits flip our production default from a cheaper provider to Claude and fund a public grounding eval.
