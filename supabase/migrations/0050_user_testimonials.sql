-- Signed-in users can write a testimonial. It is held for review: nothing a user
-- writes is public until an admin approves it. The homepage still reads
-- is_active, so a pending or declined testimonial can never appear.

alter table public.testimonials
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists status text not null default 'approved' check (status in ('pending', 'approved', 'rejected'));
create index if not exists testimonials_user_idx on public.testimonials (user_id) where user_id is not null;

-- A user reads their own testimonials (any status) and can withdraw one that is still pending.
create policy testimonials_select_own on public.testimonials for select to authenticated
  using (user_id = (select auth.uid()));
create policy testimonials_delete_own_pending on public.testimonials for delete to authenticated
  using (user_id = (select auth.uid()) and status = 'pending');
-- No insert or update policy for users on purpose: they go through submit_testimonial().

create or replace function public.submit_testimonial(
  p_author_name text, p_author_position text, p_rating integer, p_content text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  v_name text := btrim(coalesce(p_author_name, ''));
  v_content text := btrim(coalesce(p_content, ''));
  new_id uuid;
begin
  if uid is null then raise exception 'Please sign in to share your experience.' using errcode = 'P0001'; end if;
  if char_length(v_name) < 2 or char_length(v_name) > 80 then raise exception 'Please enter your name.' using errcode = 'P0001'; end if;
  if p_rating is null or p_rating < 1 or p_rating > 5 then raise exception 'Choose a rating from 1 to 5.' using errcode = 'P0001'; end if;
  if char_length(v_content) < 20 then raise exception 'Please write at least a couple of sentences.' using errcode = 'P0001'; end if;
  if char_length(v_content) > 1000 then raise exception 'Please keep it under 1000 characters.' using errcode = 'P0001'; end if;
  if char_length(coalesce(p_author_position, '')) > 80 then raise exception 'That location or role is too long.' using errcode = 'P0001'; end if;
  if (select count(*) from public.testimonials where user_id = uid and status = 'pending') >= 3 then
    raise exception 'You already have testimonials waiting for review. We will let you know when they are looked at.' using errcode = 'P0001';
  end if;
  if (select count(*) from public.testimonials where user_id = uid) >= 10 then
    raise exception 'You have shared the maximum number of testimonials.' using errcode = 'P0001';
  end if;

  insert into public.testimonials (author_name, author_position, content, rating, is_active, is_featured, user_id, status)
  values (v_name, btrim(coalesce(p_author_position, '')), v_content, p_rating, false, false, uid, 'pending')
  returning id into new_id;

  perform public.notify_admins('general', 'New testimonial to review', left(v_name || ': ' || v_content, 140), '/admin/testimonials');
  return new_id;
end $$;
revoke all on function public.submit_testimonial(text, text, integer, text) from public, anon;
grant execute on function public.submit_testimonial(text, text, integer, text) to authenticated;

-- Approving shows it on the site, declining hides it. The author is told either way.
create or replace function public.testimonial_status_changed() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status is not distinct from old.status then return new; end if;
  if new.status = 'approved' then new.is_active := true;
  elsif new.status = 'rejected' then new.is_active := false; end if;
  if new.user_id is not null and new.status in ('approved', 'rejected') then
    insert into public.notifications (user_id, type, title, message, link)
    values (new.user_id, 'general',
            case new.status when 'approved' then 'Your testimonial is live' else 'About your testimonial' end,
            case new.status when 'approved' then 'Thank you for sharing your experience. It now appears on our website.'
                            else 'We could not publish your testimonial this time. You are welcome to write another.' end,
            '/auth/testimonials');
  end if;
  return new;
end $$;
revoke all on function public.testimonial_status_changed() from public, anon, authenticated;
drop trigger if exists testimonial_status_changed on public.testimonials;
create trigger testimonial_status_changed before update on public.testimonials
  for each row execute function public.testimonial_status_changed();

-- Sidebar badge: testimonials waiting for review.
create or replace function public.admin_sidebar_counts() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Not allowed'; end if;
  return jsonb_build_object(
    'trash', (select count(distinct batch) from trash_items),
    'helpdesk', (select count(*) from support_tickets where status = 'open'),
    'contacts', (select count(*) from contact_messages where not is_read),
    'orders', (select count(*) from orders where payment_status = 'success' and order_status in ('pending', 'processing')),
    'tours', (select count(*) from bookings where status = 'pending') + (select count(*) from tour_reviews where status = 'pending'),
    'rentals', (select count(*) from vacation_bookings where status = 'pending'),
    'applications', (select count(*) from study_applications where status = 'enquiry') + (select count(*) from study_application_documents where status = 'uploaded'),
    'feedback', (select count(*) from suggestions where not is_read) + (select count(*) from issue_reports where not is_read),
    'testimonials', (select count(*) from testimonials where status = 'pending'),
    'emails', (select count(*) from email_log where status in ('failed', 'bounced') and created_at > now() - interval '7 days'),
    'notifications', (select count(*) from notifications where user_id = auth.uid() and not is_read)
  );
end $$;
