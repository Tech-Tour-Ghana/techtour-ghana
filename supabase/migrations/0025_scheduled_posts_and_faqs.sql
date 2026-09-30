-- 0025_scheduled_posts_and_faqs.sql
-- Scheduled publishing and per-article FAQs.
--
-- A scheduled post is is_published = false with scheduled_at set. A pg_cron job
-- runs every minute and publishes anything that is due, so every place that
-- reads is_published (public pages, sitemap, RLS) keeps working unchanged and a
-- scheduled post is never public before its time.

alter table public.blog_posts
  add column if not exists scheduled_at timestamptz,
  add column if not exists faqs jsonb not null default '[]'::jsonb;

alter table public.blog_posts
  drop constraint if exists blog_posts_scheduled_not_published,
  add constraint blog_posts_scheduled_not_published check (scheduled_at is null or not is_published),
  drop constraint if exists blog_posts_faqs_shape,
  add constraint blog_posts_faqs_shape check (jsonb_typeof(faqs) = 'array' and jsonb_array_length(faqs) <= 10);

comment on column public.blog_posts.scheduled_at is
  'When set on an unpublished post, publish_due_blog_posts() publishes it at this time.';
comment on column public.blog_posts.faqs is
  'Visible FAQ block shown under the article, [{question, answer}]. FAQPage structured data is generated from exactly this list.';

create index if not exists blog_posts_scheduled_idx on public.blog_posts (scheduled_at) where scheduled_at is not null;

create or replace function public.publish_due_blog_posts()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare n integer;
begin
  update public.blog_posts
  set is_published = true,
      published_at = scheduled_at,
      scheduled_at = null
  where not is_published and scheduled_at is not null and scheduled_at <= now();
  get diagnostics n = row_count;
  return n;
end $$;

revoke all on function public.publish_due_blog_posts() from public, anon, authenticated;

create extension if not exists pg_cron;

do $$
begin
  perform cron.unschedule('publish-due-blog-posts');
exception when others then null;
end $$;

select cron.schedule('publish-due-blog-posts', '* * * * *', $$select public.publish_due_blog_posts()$$);
