-- 0045_admin_sidebar_counts.sql
-- One call for every number the admin sidebar shows next to a menu item: things
-- waiting for a person. Admin only. Trash counts deletions (a tour and its
-- departures are one), not rows.

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
    'applications', (select count(*) from study_applications where status = 'pending'),
    'feedback', (select count(*) from suggestions where not is_read) + (select count(*) from issue_reports where not is_read),
    'emails', (select count(*) from email_log where status in ('failed', 'bounced') and created_at > now() - interval '7 days'),
    'notifications', (select count(*) from notifications where user_id = auth.uid() and not is_read)
  );
end $$;
revoke all on function public.admin_sidebar_counts() from public, anon;
grant execute on function public.admin_sidebar_counts() to authenticated;
