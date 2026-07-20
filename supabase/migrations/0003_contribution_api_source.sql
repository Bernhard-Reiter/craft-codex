-- 0003 — Contribution API v1 (Slice 2): source tracking + idempotency.
-- Idempotent: safe to re-apply via `supabase db query -f <file> --linked`.
--
-- 1) New columns for the service-to-service intake path (Cody Studio etc.):
--      source            — which client created the row ('web' | 'cody-studio' | 'api')
--      source_session_id — opaque client session reference (e.g. Studio interview id)
--      idempotency_key   — dedupe key for POST retries (partial UNIQUE below)
-- 2) Partial UNIQUE index on idempotency_key (NULLs unconstrained).
-- 3) INSERT policy HARDENED, never loosened (ALTER POLICY WITH CHECK is a
--    no-op quirk -> DROP + CREATE): the authenticated user path must stay
--    source='web' with NO service-path fields. The API path runs as
--    service_role (bypasses RLS) and is guarded by the Bearer token + Zod.

alter table public.craft_contributions
  add column if not exists source text not null default 'web',
  add column if not exists source_session_id text,
  add column if not exists idempotency_key text;

-- CHECK constraint (guarded for idempotent re-apply):
do $$ begin
  alter table public.craft_contributions
    add constraint source_valid check (source in ('web', 'cody-studio', 'api'));
exception
  when duplicate_object then null;
end $$;

-- Idempotency: one row per key; NULL keys (web path) are unconstrained.
create unique index if not exists craft_contributions_idempotency_key_uniq
  on public.craft_contributions (idempotency_key)
  where idempotency_key is not null;

-- User path (authenticated) stays exactly the 0002-pristine insert AND must
-- not impersonate a service client: source is forced to 'web', service-path
-- fields must be NULL.
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
    -- 0002 hardening: no pre-seeded workflow/approval/publish fields
    and revision = 1
    and revision_history = '[]'::jsonb
    and review_notes = '[]'::jsonb
    and approved_revision is null
    and approved_by is null
    and approved_at is null
    and published_slug is null
    and git_commit is null
    and published_at is null
    -- 0003 hardening: user path is always the web form, never the service path
    and source = 'web'
    and source_session_id is null
    and idempotency_key is null
  );
