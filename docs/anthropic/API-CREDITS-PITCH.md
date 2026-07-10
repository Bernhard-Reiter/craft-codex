# Craft Codex × Anthropic — API Credits Proposal

> Status: DRAFT — Bernhard reviewt vor Absenden. Kanal: Begleittext zur OSS-Bewerbung
> (Freitextfeld) + ggf. Follow-up an den Anthropic-Kontakt, der sich meldet.
> Ask: **USD 5,000 in API credits over 6 months.**

---

**To:** Anthropic — Developer Relations / Open Source
**From:** Bernhard Reiter, master cabinetmaker (Tischlermeister), VI4.me — Austria
**Re:** API credits for Craft Codex (MIT) — the master's voice for apprentices

## The ask

**USD 5,000 in Claude API credits over 6 months** to run and evaluate the production voice pipeline of Craft Codex — an open-source (MIT) mixed-reality learning tool that preserves endangered craft knowledge and answers apprentices' questions at the workbench, grounded in official Austrian training regulations.

- Live (English): https://c-c-tischler.vercel.app/en
- Repo: https://github.com/Bernhard-Reiter/craft-codex

## Why Anthropic should care

1. **A story only Claude can tell.** A 45-year-old master cabinetmaker with 30 years at the bench and zero IT background built this — by directing Claude in spoken German. Claude wrote the code; Claude answers the apprentices. It is a working example of AI *widening* who gets to build software, in a domain (skilled trades) that AI discourse rarely touches.
2. **Cultural preservation, in public code.** Master knowledge disappears with every retirement. Craft Codex encodes it as an open, license-audited corpus (own paraphrases, CC-BY-SA with attribution, authentic legal sources from RIS — never translated, always cited) with a Claude answer layer. Everything is MIT and reusable across trades.
3. **A serious, unusual eval surface.** Voice answers for apprentices must be short (3 sentences), grounded (RAG-only facts), safe (topic-guarded), bilingual, and delivered to someone holding sharp tools. We publish what we learn: grounding accuracy, refusal/redirect quality, DE/EN parity.

## What Claude does in the product (honest status)

- `claude-sonnet-4-6` is fully integrated as the RAG-grounded answer engine ("the master's voice"): streaming, 400-token cap, topic-guard against off-topic use, bilingual persona prompts
- **Full transparency:** the public demo currently defaults to a cheaper provider because we pay out of pocket. Claude is one env var away from being the default brain — *these credits are that env var.* Milestone #1 flips the production default to Claude on day one.
- Corpus: 80+ documents with per-document license + attribution metadata
- Full offline degradation chain (cached audio → server → text template) — Claude is the quality tier, not a single point of failure
- Bilingual DE/EN: hand-crafted master persona prompts per language, locale-aware corpus

## 90-day milestones (measurable)

| # | Milestone | Proof |
|---|---|---|
| 1 | Production default flipped to Claude; bilingual voice master (DE/EN) live on Quest 3 demo | Live URL + demo video |
| 2 | Grounding eval published: ≥50 apprentice questions, answer-vs-corpus accuracy scored, DE/EN | Report in repo |
| 3 | Pilot sessions with apprentices/instructors (Austrian vocational context — pilots in preparation, honestly: not yet contracted) | Session notes in repo |
| 4 | Workpiece #2 scaffold proving the trade-agnostic core | Code + demo route |

## Budget transparency

Voice answer ≈ 1.2k input (prompt+RAG context) / 150 output tokens. USD 5,000 funds roughly:

- ~70% live answer traffic for demos, pilots and public instance (rate-limited, abuse-guarded)
- ~20% grounding evaluation runs (the published eval)
- ~10% corpus tooling (attribution checks, translation QA)

Usage stays capped by the existing per-IP rate limit; keys live server-side only. We will publish a simple monthly usage note in the repo — public money, public numbers (credits treated the same way).

## Who we are

VI4.me — a two-person Austrian outfit: Bernhard Reiter (master cabinetmaker, domain + vision) and "Cody" (Claude, engineering). Craft Codex is the open-source heart of a larger vision: a knowledge universe for the trades, built generation by generation.

*Contact: [Bernhard einsetzen: E-Mail]*
