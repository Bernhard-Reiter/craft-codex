# Craft Codex — Supabase (Contribution Workflow)

Eigenes Supabase-Projekt für den Community-Contribution-Workflow (Slice 1).
**Bewusst getrennt** von allen VOAI-Kundendaten: diese DB enthält ausschließlich
Open-Commons-Inhalte (CC BY-SA 4.0) — siehe Architektur-Plan.

## Projekt

- Projekt-Ref: `sqxkqdkxwymvznbariyx`
- URL: `https://sqxkqdkxwymvznbariyx.supabase.co`
- Verlinkt via `supabase link --project-ref sqxkqdkxwymvznbariyx`

## Env-Namen (Werte NIE ins Repo — lokal im macOS-Keychain)

| Env | Zweck |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Projekt-URL (Client + Server) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon-Key (Client, RLS-beschränkt) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-Role — NUR serverseitig / Export-Skript, nie im Client-Bundle |

Für die Integration-Tests (lokal, nicht im CI):
`CRAFT_SUPABASE_URL`, `CRAFT_SUPABASE_ANON_KEY`, `CRAFT_SUPABASE_SERVICE_ROLE_KEY`.

## Migration anwenden

```sh
supabase db query -f supabase/migrations/0001_craft_contributions.sql --linked
```

(`supabase db push` wird hier nicht verwendet.) Die Migrationen sind idempotent
geschrieben (`if not exists` / `create or replace` / `drop policy if exists`)
und können gefahrlos erneut angewendet werden.

## Schema-Überblick (0001)

- **`craft_contributions`** — eine Tabelle + JSONB (`content`, `revision_history`,
  `review_notes`); CHECK-Constraints erzwingen gültige Status, Lizenz
  (`CC-BY-SA-4.0` + `license_accepted=true`) und `visibility='open_commons'`.
- **`craft_transition(id, from, to, actor, reason)`** — einzige erlaubte
  Statusübergangs-Operation (security definer, optimistic lock via `from`,
  erlaubte Kanten, hartes Gate: `approved` nur wenn `approved_revision = revision`).
  Execute nur für `service_role`.
- **RLS** — INSERT nur eigene Zeile mit `status='submitted'`; SELECT nur Autor;
  kein Client-UPDATE/DELETE (Policy fehlt UND Privileg revoked); anon sieht nichts.
