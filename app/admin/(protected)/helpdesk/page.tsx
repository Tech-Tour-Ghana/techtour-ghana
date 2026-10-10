'use client';

// Helpdesk kanban. Staff drag tickets between status columns (or use each card's
// "Move to" menu), open a ticket in a side drawer, and reply or leave notes.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRotateRight } from '@fortawesome/free-solid-svg-icons';

import { createBrowserClient } from '@/lib/supabase/client';
import AdminLayout from '@/components/AdminLayout';
import { Button, ListSkeleton, SearchInput, Surface, Toggle, Toolbar, confirmAction, fieldStyle, reportError } from '@/components/admin/ui';
import Board from '@/components/admin/helpdesk/Board';
import TicketDrawer, { type TicketPatch } from '@/components/admin/helpdesk/TicketDrawer';
import { MIN_TAP, personName, type AdminTicket, type AdminUser, type PersonRef } from '@/components/admin/helpdesk/types';
import {
  CATEGORY_LABELS, PRIORITY_META, STATUS_META, TICKET_CATEGORIES, TICKET_PRIORITIES,
  type SupportTicket, type TicketCategory, type TicketPriority, type TicketStatus,
} from '@/lib/support/meta';

const OPEN_COLUMNS: TicketStatus[] = ['open', 'in_progress', 'waiting', 'resolved'];
const COLUMNS_WITH_CLOSED: TicketStatus[] = [...OPEN_COLUMNS, 'closed'];

type Row = SupportTicket & { customer: PersonRef | null; assignee: PersonRef | null; staff: { count: number }[] | null };

export default function AdminHelpdeskPage() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [meId, setMeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showClosed, setShowClosed] = useState(false);
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState<TicketPriority | ''>('');
  const [category, setCategory] = useState<TicketCategory | ''>('');
  const [mine, setMine] = useState(false);
  const [selected, setSelected] = useState<AdminTicket | null>(null);
  const [announce, setAnnounce] = useState('');
  const busy = useRef(0);

  const fetchRows = useCallback(async (closed: boolean): Promise<AdminTicket[] | null> => {
    const base = supabase
      .from('support_tickets')
      .select('*, customer:profiles!support_tickets_user_id_fkey(first_name,last_name,email), assignee:profiles!support_tickets_assigned_to_fkey(first_name,last_name), staff:support_messages(count)')
      .eq('staff.is_staff', true)
      .eq('staff.is_internal', false);
    const { data, error } = await (closed
      ? base.eq('status', 'closed').order('closed_at', { ascending: false }).limit(100)
      : base.neq('status', 'closed').order('last_activity_at', { ascending: true }));
    if (reportError(error)) return null;
    return ((data ?? []) as unknown as Row[]).map(({ staff, ...t }) => ({ ...t, staff_replies: staff?.[0]?.count ?? 0 }));
  }, [supabase]);

  const loadOpen = useCallback(async () => {
    const rows = await fetchRows(false);
    if (rows) setTickets((prev) => [...rows, ...prev.filter((t) => t.status === 'closed')]);
    setLoading(false);
  }, [fetchRows]);

  const loadClosed = useCallback(async () => {
    const rows = await fetchRows(true);
    if (rows) setTickets((prev) => [...prev.filter((t) => t.status !== 'closed'), ...rows]);
  }, [fetchRows]);

  const refresh = useCallback(async () => {
    if (busy.current > 0) return; // do not clobber an optimistic move in flight
    await loadOpen();
    if (showClosed) await loadClosed();
  }, [loadOpen, loadClosed, showClosed]);

  useEffect(() => {
    void loadOpen();
    void supabase.auth.getUser().then(({ data }) => setMeId(data.user?.id ?? null));
    void supabase.from('profiles').select('id, first_name, last_name, email').eq('is_admin', true).then(({ data, error }) => {
      if (!reportError(error)) setAdmins((data as AdminUser[]) ?? []);
    });
  }, [supabase, loadOpen]);

  useEffect(() => {
    if (showClosed) void loadClosed();
    else setTickets((prev) => prev.filter((t) => t.status !== 'closed'));
  }, [showClosed, loadClosed]);

  useEffect(() => {
    const tick = () => { if (document.visibilityState === 'visible') void refresh(); };
    const id = window.setInterval(tick, 60_000);
    window.addEventListener('focus', tick);
    return () => { window.clearInterval(id); window.removeEventListener('focus', tick); };
  }, [refresh]);

  // Optimistic update with rollback. Moves into Resolved or Closed ask first.
  const patch = useCallback(async (t: AdminTicket, p: TicketPatch) => {
    if ((p.status === 'resolved' || p.status === 'closed') && p.status !== t.status) {
      const ok = await confirmAction({
        title: `Mark as ${STATUS_META[p.status].label.toLowerCase()}?`,
        message: `${t.ticket_number} will be marked ${STATUS_META[p.status].label.toLowerCase()} and the customer will be notified.`,
        confirmLabel: 'Yes, move it',
      });
      if (!ok) return;
    }
    const assignee = 'assigned_to' in p ? admins.find((a) => a.id === p.assigned_to) ?? null : undefined;
    const apply = (x: AdminTicket): AdminTicket => ({ ...x, ...p, ...(assignee !== undefined ? { assignee } : {}) });
    const before = t;
    setTickets((prev) => prev.map((x) => (x.id === t.id ? apply(x) : x)));
    setSelected((s) => (s?.id === t.id ? apply(s) : s));
    busy.current += 1;
    const { error } = await supabase.from('support_tickets').update(p).eq('id', t.id);
    busy.current -= 1;
    if (reportError(error)) {
      setTickets((prev) => prev.map((x) => (x.id === t.id ? before : x)));
      setSelected((s) => (s?.id === t.id ? before : s));
      return;
    }
    if (p.status) setAnnounce(`Moved ${t.ticket_number} to ${STATUS_META[p.status].label}`);
    void refresh();
  }, [supabase, admins, refresh]);

  const q = search.trim().toLowerCase();
  const visible = useMemo(() => tickets.filter((t) => {
    if (priority && t.priority !== priority) return false;
    if (category && t.category !== category) return false;
    if (mine && t.assigned_to !== meId) return false;
    if (!q) return true;
    return [t.ticket_number, t.subject, personName(t.customer, ''), t.customer?.email ?? ''].some((s) => s.toLowerCase().includes(q));
  }), [tickets, priority, category, mine, meId, q]);

  const live = selected ? tickets.find((t) => t.id === selected.id) ?? selected : null;

  return (
    <AdminLayout title="Helpdesk" subtitle="Work customer tickets on the board">
      <Toolbar
        actions={
          <>
            <Toggle on={mine} onClick={() => setMine((v) => !v)} label="Assigned to me" />
            <Toggle on={showClosed} onClick={() => setShowClosed((v) => !v)} label={showClosed ? 'Hide closed' : 'Show closed'} />
            <Button variant="secondary" onClick={() => void refresh()} className={MIN_TAP} aria-label="Refresh tickets">
              <FontAwesomeIcon icon={faRotateRight} className="mr-2 h-3 w-3" />Refresh
            </Button>
          </>
        }
      >
        <SearchInput className="min-w-[14rem] flex-1 sm:max-w-sm" value={search} onChange={setSearch} placeholder="Search number, subject or customer" label="Search tickets" />
        <label>
          <span className="sr-only">Filter by priority</span>
          <select value={priority} onChange={(e) => setPriority(e.target.value as TicketPriority | '')} className={`${MIN_TAP} px-2 text-sm`} style={fieldStyle}>
            <option value="">All priorities</option>
            {TICKET_PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_META[p].label}</option>)}
          </select>
        </label>
        <label>
          <span className="sr-only">Filter by category</span>
          <select value={category} onChange={(e) => setCategory(e.target.value as TicketCategory | '')} className={`${MIN_TAP} px-2 text-sm`} style={fieldStyle}>
            <option value="">All categories</option>
            {TICKET_CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
          </select>
        </label>
      </Toolbar>

      {loading ? (
        <Surface><ListSkeleton /></Surface>
      ) : (
        <Board
          tickets={visible}
          columns={showClosed ? COLUMNS_WITH_CLOSED : OPEN_COLUMNS}
          onOpen={setSelected}
          onMove={(t, status) => void patch(t, { status })}
        />
      )}

      <div className="sr-only" role="status" aria-live="polite">{announce}</div>

      {live && (
        <TicketDrawer
          key={live.id}
          ticket={live}
          admins={admins}
          meId={meId}
          onClose={() => setSelected(null)}
          onPatch={(t, p) => void patch(t, p)}
          onChanged={() => void refresh()}
        />
      )}
    </AdminLayout>
  );
}
