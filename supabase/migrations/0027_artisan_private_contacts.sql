-- Artisan contact details are private. They lived on public.artisans, which
-- anyone can read, so a buyer could take them and deal with an artisan directly.
-- They move to an admin-only table; the public table keeps only the story.

create table if not exists public.artisan_private_contacts (
  artisan_id uuid primary key references public.artisans(id) on delete cascade,
  email      text not null default '',
  phone      text not null default '',
  website    text not null default '',
  instagram  text not null default '',
  facebook   text not null default '',
  twitter    text not null default '',
  updated_at timestamptz not null default now()
);

insert into public.artisan_private_contacts (artisan_id, email, phone, website, instagram, facebook, twitter)
select id, email, phone, website, instagram, facebook, twitter
from public.artisans
on conflict (artisan_id) do nothing;

alter table public.artisan_private_contacts enable row level security;
create policy artisan_private_contacts_admin on public.artisan_private_contacts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop trigger if exists artisan_private_contacts_set_updated_at on public.artisan_private_contacts;
create trigger artisan_private_contacts_set_updated_at before update on public.artisan_private_contacts
  for each row execute function public.set_updated_at();

drop trigger if exists audit_admin_change on public.artisan_private_contacts;
create trigger audit_admin_change after insert or update or delete on public.artisan_private_contacts
  for each row execute function public.audit_admin_change();

alter table public.artisans
  drop column email,
  drop column phone,
  drop column website,
  drop column instagram,
  drop column facebook,
  drop column twitter;
