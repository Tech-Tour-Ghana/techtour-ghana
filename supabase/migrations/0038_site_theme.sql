-- 0038_site_theme.sql
-- Brand colours and the default theme, edited in Admin > Settings > Branding.
-- `theme` holds only the colours an admin changed, as
--   {"light": {"primary": "#0D7A7D", ...}, "dark": {...}}
-- so an empty object means the built-in palette. The app validates every value
-- as a hex colour before it reaches a stylesheet.
alter table public.site_settings
  add column if not exists theme jsonb not null default '{}'::jsonb,
  add column if not exists default_theme text not null default 'system';

alter table public.site_settings
  drop constraint if exists site_settings_theme_is_object,
  add constraint site_settings_theme_is_object check (jsonb_typeof(theme) = 'object'),
  drop constraint if exists site_settings_default_theme_valid,
  add constraint site_settings_default_theme_valid check (default_theme in ('system', 'light', 'dark'));

comment on column public.site_settings.theme is
  'Brand colour overrides per theme (light, dark). Only changed keys are stored.';
comment on column public.site_settings.default_theme is
  'Theme for first-time visitors: system (follow the device), light or dark.';
