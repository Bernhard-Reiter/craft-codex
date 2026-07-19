-- 0001_craft_contributions.sql
-- Craft Codex — Slice 1, Step 1: contribution table + state machine + RLS.
-- Idempotent: safe to re-apply via `supabase db query -f <file> --linked`.
-- Design source: .cm/artifacts/craft-codex-plattform-plan.md (SLICE 1 / Schritt 1).

-- gen_random_uuid() is built into PG13+; extension guard for completeness.
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Table: craft_contributions (one table + JSONB — deliberately NOT normalized
-- in Slice 1; revision immutability via append-only revision_history).
-- ---------------------------------------------------------------------------
create table if not exists public.craft_contributions (
  id              uuid primary key default gen_random_uuid(),
  status          text not null default 'submitted',
  trade           text not null default 'tischler',
  locale          text not null default 'de-AT',
  visibility      text not null default 'open_commons',   -- S1: always open_commons
  -- Author / identity (magic link):
  author_id       uuid references auth.users(id),
  author_email    text,
  -- Content + versioning (immutable via append-only history):
  revision        int  not null default 1,
  content         jsonb not null,          -- {title, body_md, topic, sources:[{citation,url,page}]}
  revision_history jsonb not null default '[]'::jsonb,  -- append-only snapshots
  -- License (HARD field):
  license_type      text not null,         -- 'CC-BY-SA-4.0'
  license_accepted  boolean not null default false,
  license_accepted_at timestamptz,
  terms_version     text,                  -- e.g. '2026-07'
  -- Review / approval (bound to a revision!):
  approved_revision int,                   -- must equal revision for export
  approved_by       text,
  approved_at       timestamptz,
  review_notes      jsonb not null default '[]'::jsonb,
  -- Publish (only after git merge):
  published_slug  text,                    -- deterministic target slug
  git_commit      text,
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- Hard state machine + license constraints:
  constraint status_valid check (status in
    ('submitted','in_review','changes_requested','approved','published','rejected','withdrawn')),
  constraint license_hard check (license_accepted = true and license_type = 'CC-BY-SA-4.0'),
  constraint visibility_valid check (visibility = 'open_commons')  -- S1: nothing else allowed
);

-- ---------------------------------------------------------------------------
-- State machine: transitions ONLY through this function (security definer).
-- Optimistic lock via p_from; hard gate: 'approved' requires the approval to
-- target the CURRENT revision (approved_revision = revision, NULL-safe).
-- ---------------------------------------------------------------------------
create or replace function public.craft_transition(
  p_id uuid, p_from text, p_to text, p_actor text, p_reason text
) returns public.craft_contributions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row public.craft_contributions;
begin
  select * into v_row from public.craft_contributions where id = p_id for update;
  if not found then
    raise exception 'contribution % not found', p_id;
  end if;
  if v_row.status <> p_from then
    raise exception 'stale status: expected %, got %', p_from, v_row.status;  -- optimistic lock
  end if;
  -- allowed edges:
  if not (
       (p_from = 'submitted'         and p_to in ('in_review','rejected','withdrawn'))
    or (p_from = 'in_review'         and p_to in ('changes_requested','approved','rejected'))
    or (p_from = 'changes_requested' and p_to in ('in_review','withdrawn'))
    or (p_from = 'approved'          and p_to in ('published','in_review'))   -- back-edge for re-review
  ) then
    raise exception 'illegal transition % -> %', p_from, p_to;
  end if;
  -- HARD gate: approval must target the CURRENT revision (NULL-safe comparison).
  if p_to = 'approved' and v_row.approved_revision is distinct from v_row.revision then
    raise exception 'approval must target current revision';
  end if;
  update public.craft_contributions
     set status = p_to,
         updated_at = now(),
         review_notes = review_notes || jsonb_build_object(
           'at', now(), 'actor', p_actor, 'from', p_from, 'to', p_to, 'reason', p_reason)
   where id = p_id
   returning * into v_row;
  return v_row;
end $$;

-- Only the service role (server/export script) may drive transitions.
revoke execute on function public.craft_transition(uuid, text, text, text, text) from public;
revoke execute on function public.craft_transition(uuid, text, text, text, text) from anon;
revoke execute on function public.craft_transition(uuid, text, text, text, text) from authenticated;
grant execute on function public.craft_transition(uuid, text, text, text, text) to service_role;

-- ---------------------------------------------------------------------------
-- RLS: minimal but sharp.
--  * INSERT: authenticated user may create OWN row, only status='submitted',
--    visibility='open_commons', license accepted (NULL-safe: explicit NOT NULL).
--  * SELECT: author sees only own rows. Anon: no policy => nothing.
--  * UPDATE/DELETE: no policy AND privilege revoked => no client mutation;
--    status changes only via craft_transition / service role.
-- ---------------------------------------------------------------------------
alter table public.craft_contributions enable row level security;

-- Defense in depth: even a future accidental policy cannot re-open update/delete.
revoke update, delete on table public.craft_contributions from anon, authenticated;
revoke insert on table public.craft_contributions from anon;

drop policy if exists craft_contributions_insert_own on public.craft_contributions;
create policy craft_contributions_insert_own
  on public.craft_contributions
  for insert
  to authenticated
  with check (
    author_id is not null
    and author_id = auth.uid()
    and status = 'submitted'
    and visibility = 'open_commons'
    and license_accepted = true
    and license_type = 'CC-BY-SA-4.0'
  );

drop policy if exists craft_contributions_select_own on public.craft_contributions;
create policy craft_contributions_select_own
  on public.craft_contributions
  for select
  to authenticated
  using (
    author_id is not null
    and author_id = auth.uid()
  );
