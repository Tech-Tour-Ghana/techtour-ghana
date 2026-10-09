-- 0033_vacation_rentals_trash.sql
-- Deleted vacation rentals go to the trash (0029) so an admin can restore them.
-- Same trigger the other content tables use.

do $$
begin
  if to_regclass('public.vacation_rentals') is not null then
    drop trigger if exists trash_capture on public.vacation_rentals;
    create trigger trash_capture before delete on public.vacation_rentals
      for each row execute function public.trash_capture();
  end if;
end $$;
