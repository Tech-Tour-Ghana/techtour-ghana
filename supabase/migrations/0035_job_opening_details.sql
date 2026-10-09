-- 0035_job_opening_details.sql
--
-- The careers pages (CareersView, PositionsView) already render a level, tags,
-- responsibilities and benefits for every vacancy, but job_openings never had
-- columns for them, so the loader passed empty values. These four nullable
-- columns carry what the admin now edits. Additive only: existing rows and
-- queries are untouched.
--
--   level             free text, for example "Mid-level" or "Senior"
--   tags              short labels shown on the job cards
--   responsibilities  one per line, same convention as requirements
--   benefits          one per line, same convention as requirements

alter table public.job_openings
  add column if not exists level text default '',
  add column if not exists tags text[] default '{}',
  add column if not exists responsibilities text default '',
  add column if not exists benefits text default '';

comment on column public.job_openings.level is 'Seniority label shown on the careers pages. Free text.';
comment on column public.job_openings.tags is 'Short labels shown on the job cards.';
comment on column public.job_openings.responsibilities is 'One responsibility per line.';
comment on column public.job_openings.benefits is 'One benefit per line.';
