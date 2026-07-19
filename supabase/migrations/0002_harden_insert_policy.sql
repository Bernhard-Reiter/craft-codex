-- 0002 — Review-Härtung (PR #29 AI-Review Findings)
-- 1) BLOCKER: INSERT durfte Freigabe-/Publish-Felder mitliefern → Autor hätte
--    approved_revision=revision vor-seeden können. Jetzt: frische Zeile MUSS
--    "jungfräulich" sein (revision=1, keine Approval-/Publish-Spuren).
--    ALTER POLICY … WITH CHECK ist ein No-Op-Quirk → DROP + CREATE.
-- 2) Index auf author_id (RLS-Filter + FK-Lookup).
-- 3) updated_at-Trigger: jeder UPDATE-Pfad (auch künftige Service-Role-Edits)
--    aktualisiert updated_at, nicht nur craft_transition.

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
    -- Härtung: keine vorbelegten Workflow-/Freigabe-/Publish-Felder
    and revision = 1
    and revision_history = '[]'::jsonb
    and review_notes = '[]'::jsonb
    and approved_revision is null
    and approved_by is null
    and approved_at is null
    and published_slug is null
    and git_commit is null
    and published_at is null
  );

create index if not exists craft_contributions_author_id_idx
  on public.craft_contributions (author_id);

create or replace function public.craft_touch_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists craft_contributions_touch on public.craft_contributions;
create trigger craft_contributions_touch
  before update on public.craft_contributions
  for each row execute function public.craft_touch_updated_at();
