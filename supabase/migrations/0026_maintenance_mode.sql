-- 0026_maintenance_mode.sql
-- Maintenance mode lives on the site_settings singleton. Middleware reads it
-- (public read, like the rest of site_settings) and shows the maintenance page to
-- visitors while admins keep full access. Only admins can change it (existing
-- site_settings admin write policy).

alter table public.site_settings
  add column if not exists maintenance_enabled boolean not null default false,
  add column if not exists maintenance_title text not null default 'We''ll be right back',
  add column if not exists maintenance_message text not null default 'We are making some improvements to TechTour Ghana. Thank you for your patience, we will be back very soon.',
  add column if not exists maintenance_eta timestamptz,
  add column if not exists maintenance_contact_email text not null default '';

alter table public.site_settings
  drop constraint if exists site_settings_maintenance_lengths,
  add constraint site_settings_maintenance_lengths check (
    char_length(maintenance_title) between 1 and 120 and char_length(maintenance_message) <= 1000
  );

comment on column public.site_settings.maintenance_enabled is
  'When true, non-admin visitors see /maintenance (HTTP 503) instead of the public site.';
