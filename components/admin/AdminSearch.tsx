'use client';

// Admin search: one box for every admin page and the records behind them.
//
// Opens from the topbar button, Ctrl/Cmd+K, or "/" outside a text field. Results are
// grouped (pages and actions, content, people, orders and support), each with a
// thumbnail or icon, a short detail line and a status badge. Arrow keys move, Enter
// opens, Escape clears then closes. Without a query it offers recent items, quick
// actions and the main pages.
//
// Every query runs through the signed-in admin's own RLS-checked client, so it can
// never return more than the admin could already open. Opening a record goes to its
// admin page with ?q=<what you typed>, which the shared SearchInput applies, so the
// list is already filtered to it.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faArrowRight, faBolt, faBox, faBuildingColumns, faCartShopping, faClipboardList, faClockRotateLeft, faEnvelope, faGraduationCap,
  faHammer, faHeadset, faHouse, faImage, faMagnifyingGlass, faMapLocationDot, faNewspaper, faQuoteLeft, faRoute, faSuitcaseRolling, faUser, faXmark,
} from '@fortawesome/free-solid-svg-icons';

import { createBrowserClient } from '@/lib/supabase/client';
import { STUDY_META, asStudyStatus } from '@/lib/study/meta';

export interface SearchPage { label: string; href: string; group: string; icon: IconDefinition }

type Section = 'pages' | 'content' | 'people' | 'records';
interface Hit {
  id: string;
  section: Section;
  kind: string;
  title: string;
  sub?: string;
  href: string;
  icon: IconDefinition;
  thumb?: string | null;
  badge?: string;
  /** Records open their list filtered by the search term. */
  filterable?: boolean;
}

const SECTION_LABEL: Record<Section, string> = { pages: 'Pages and actions', content: 'Content', people: 'People', records: 'Orders, bookings and support' };
const FILTERS: { key: 'all' | Section; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pages', label: 'Pages' },
  { key: 'content', label: 'Content' },
  { key: 'people', label: 'People' },
  { key: 'records', label: 'Records' },
];

const ACTIONS = [
  { label: 'Write a blog post', href: '/admin/blog/new', icon: faNewspaper, words: 'new article create blog post write' },
  { label: 'Record a study application', href: '/admin/applications', icon: faClipboardList, words: 'new student application phone enquiry' },
  { label: 'Add a testimonial', href: '/admin/testimonials', icon: faQuoteLeft, words: 'new review quote customer' },
  { label: 'Upload media', href: '/admin/media', icon: faImage, words: 'upload image photo file library' },
  { label: 'Send a notification', href: '/admin/send-notifications', icon: faBolt, words: 'announce message broadcast notify' },
  { label: 'Post a notice', href: '/admin/notices', icon: faBolt, words: 'notice board banner announcement' },
  { label: 'Open the trash', href: '/admin/trash', icon: faClockRotateLeft, words: 'restore deleted recover' },
];
const POPULAR = ['/admin', '/admin/applications', '/admin/orders', '/admin/tours', '/admin/users', '/admin/settings'];

const RECENT_KEY = 'admin-search-recent';
const readRecent = (): Hit[] => {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') as Hit[]; } catch { return []; }
};
const saveRecent = (hit: Hit) => {
  try {
    const { icon: _icon, ...rest } = hit; // eslint-disable-line @typescript-eslint/no-unused-vars
    const next = [{ ...rest, section: 'pages' as Section }, ...readRecent().filter((h) => h.href !== hit.href || h.title !== hit.title)].slice(0, 6);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch { /* private window or blocked storage: recents are a convenience */ }
};

const str = (v: unknown) => (typeof v === 'string' ? v : '');
const num = (v: unknown) => (typeof v === 'number' ? v : Number(v) || 0);
const cedi = (n: number) => `₵${n.toLocaleString('en-GH', { maximumFractionDigits: 0 })}`;
const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ') : '');
const join = (...parts: unknown[]) => parts.map(str).filter(Boolean).join(' · ');
const isImage = (mime: unknown) => str(mime).startsWith('image/');

type Row = Record<string, unknown>;
interface Source {
  section: Exclude<Section, 'pages'>;
  run: (like: (cols: string[]) => string, limit: number) => PromiseLike<{ data: Row[] | null }>;
  map: (r: Row) => Omit<Hit, 'section' | 'id'> & { id: string };
}

export default function AdminSearch({ pages }: { pages: SearchPage[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => createBrowserClient(), []);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | Section>('all');
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState<Hit[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const run = useRef(0);

  const term = query.trim();
  const clean = term.replace(/[%_\\,()"]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);

  const SOURCES: Source[] = useMemo(() => [
    { section: 'content',
      run: (m, n) => supabase.from('tours').select('id, title, location, region, is_active, featured_image_url').or(m(['title', 'location', 'region', 'slug'])).limit(n),
      map: (r) => ({ id: str(r.id), kind: 'Tour', title: str(r.title), sub: join(r.location, r.region), href: '/admin/tours', icon: faRoute, thumb: str(r.featured_image_url) || null, badge: r.is_active ? undefined : 'Hidden', filterable: true }) },
    { section: 'content',
      run: (m, n) => supabase.from('blog_posts').select('id, title, category, author, is_published, image_url').or(m(['title', 'category', 'author', 'slug'])).limit(n),
      map: (r) => ({ id: str(r.id), kind: 'Blog post', title: str(r.title), sub: join(r.category, r.author), href: `/admin/blog/${str(r.id)}`, icon: faNewspaper, thumb: str(r.image_url) || null, badge: r.is_published ? 'Published' : 'Draft' }) },
    { section: 'content',
      run: (m, n) => supabase.from('destinations').select('id, name, tagline, is_active, image_url').or(m(['name', 'tagline'])).limit(n),
      map: (r) => ({ id: str(r.id), kind: 'Destination', title: str(r.name), sub: str(r.tagline), href: '/admin/destinations', icon: faMapLocationDot, thumb: str(r.image_url) || null, badge: r.is_active ? undefined : 'Hidden', filterable: true }) },
    { section: 'content',
      run: (m, n) => supabase.from('market_products').select('id, title, sku, price, is_active, image_url').or(m(['title', 'sku', 'slug'])).limit(n),
      map: (r) => ({ id: str(r.id), kind: 'Product', title: str(r.title), sub: join(r.sku, cedi(num(r.price))), href: '/admin/market', icon: faBox, thumb: str(r.image_url) || null, badge: r.is_active ? undefined : 'Hidden', filterable: true }) },
    { section: 'content',
      run: (m, n) => supabase.from('artisans').select('id, name, craft_type, location, is_active, profile_image_url').or(m(['name', 'craft_type', 'location'])).limit(n),
      map: (r) => ({ id: str(r.id), kind: 'Artisan', title: str(r.name), sub: join(r.craft_type, r.location), href: '/admin/artisans', icon: faHammer, thumb: str(r.profile_image_url) || null, badge: r.is_active ? undefined : 'Hidden', filterable: true }) },
    { section: 'content',
      run: (m, n) => supabase.from('vacation_rentals').select('id, title, location, price_per_night, is_active, main_image_url').or(m(['title', 'location'])).limit(n),
      map: (r) => ({ id: str(r.id), kind: 'Rental', title: str(r.title), sub: join(r.location, `${cedi(num(r.price_per_night))} a night`), href: '/admin/rentals', icon: faHouse, thumb: str(r.main_image_url) || null, badge: r.is_active ? undefined : 'Hidden', filterable: true }) },
    { section: 'content',
      run: (m, n) => supabase.from('testimonials').select('id, author_name, author_position, content, status').or(m(['author_name', 'content'])).limit(n),
      map: (r) => ({ id: str(r.id), kind: 'Testimonial', title: str(r.author_name), sub: str(r.content).slice(0, 80), href: '/admin/testimonials', icon: faQuoteLeft, badge: str(r.status) === 'pending' ? 'Waiting for review' : undefined, filterable: true }) },
    { section: 'content',
      run: (m, n) => supabase.from('study_institutions').select('id, name, city, is_active, logo_url').or(m(['name', 'city'])).limit(n),
      map: (r) => ({ id: str(r.id), kind: 'University', title: str(r.name), sub: str(r.city), href: '/admin/study', icon: faBuildingColumns, thumb: str(r.logo_url) || null, badge: r.is_active ? undefined : 'Hidden', filterable: true }) },
    { section: 'content',
      run: (m, n) => supabase.from('study_programs').select('id, title, field, level, is_active').or(m(['title', 'field'])).limit(n),
      map: (r) => ({ id: str(r.id), kind: 'Programme', title: str(r.title), sub: join(cap(str(r.level)), r.field), href: '/admin/study', icon: faGraduationCap, badge: r.is_active ? undefined : 'Hidden', filterable: true }) },
    { section: 'content',
      run: (m, n) => supabase.from('media_assets').select('id, name, title, alt_text, mime_type, public_url').or(m(['name', 'title', 'alt_text'])).limit(n),
      map: (r) => ({ id: str(r.id), kind: 'Media', title: str(r.title) || str(r.name), sub: str(r.name), href: '/admin/media', icon: faImage, thumb: isImage(r.mime_type) ? str(r.public_url) || null : null, filterable: true }) },

    { section: 'people',
      run: (m, n) => supabase.from('profiles').select('id, email, first_name, last_name, phone_number, is_admin, is_active, avatar_url').or(m(['email', 'first_name', 'last_name', 'phone_number'])).limit(n),
      map: (r) => ({ id: str(r.id), kind: 'User', title: join(r.first_name, r.last_name).replace(' · ', ' ') || str(r.email), sub: join(r.email, r.phone_number), href: '/admin/users', icon: faUser, thumb: str(r.avatar_url) || null, badge: r.is_admin ? 'Admin' : r.is_active ? undefined : 'Inactive', filterable: true }) },
    { section: 'people',
      run: (m, n) => supabase.from('study_applications').select('id, full_name, email, reference, program_name, university, status').or(m(['full_name', 'email', 'reference', 'program_name', 'university'])).limit(n),
      map: (r) => ({ id: str(r.id), kind: 'Study application', title: str(r.full_name) || str(r.email), sub: join(r.reference, r.program_name, r.university), href: '/admin/applications', icon: faGraduationCap, badge: STUDY_META[asStudyStatus(str(r.status))].short, filterable: true }) },
    { section: 'people',
      run: (m, n) => supabase.from('contact_messages').select('id, name, email, subject, is_read').or(m(['name', 'email', 'subject', 'message'])).limit(n),
      map: (r) => ({ id: str(r.id), kind: 'Contact message', title: str(r.name), sub: join(r.subject, r.email), href: '/admin/contacts', icon: faEnvelope, badge: r.is_read ? undefined : 'Unread', filterable: true }) },

    { section: 'records',
      run: (m, n) => supabase.from('orders').select('id, order_number, total_price, order_status, payment_status, shipping_city, phone_number').or(m(['order_number', 'phone_number', 'shipping_city', 'tracking_number'])).limit(n),
      map: (r) => ({ id: str(r.id), kind: 'Order', title: `Order ${str(r.order_number)}`, sub: join(cedi(num(r.total_price)), r.shipping_city, r.phone_number), href: '/admin/orders', icon: faCartShopping, badge: cap(str(r.order_status)), filterable: true }) },
    { section: 'records',
      run: (m, n) => supabase.from('bookings').select('id, booking_reference, email, phone, status, total_price').or(m(['booking_reference', 'email', 'phone'])).limit(n),
      map: (r) => ({ id: str(r.id), kind: 'Tour booking', title: `Booking ${str(r.booking_reference)}`, sub: join(r.email, r.phone), href: '/admin/tours', icon: faSuitcaseRolling, badge: cap(str(r.status)) }) },
    { section: 'records',
      run: (m, n) => supabase.from('support_tickets').select('id, ticket_number, subject, status, reference').or(m(['ticket_number', 'subject', 'reference'])).limit(n),
      map: (r) => ({ id: str(r.id), kind: 'Support ticket', title: str(r.subject), sub: join(r.ticket_number), href: '/admin/helpdesk', icon: faHeadset, badge: cap(str(r.status)), filterable: true }) },
  ], [supabase]);

  // ---- open and close
  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setFilter('all');
    opener.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName));
      if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        opener.current = document.activeElement as HTMLElement | null;
        setOpen((o) => !o);
      } else if (e.key === '/' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        opener.current = document.activeElement as HTMLElement | null;
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    setRecent(readRecent());
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { clearTimeout(t); document.body.style.overflow = prev; };
  }, [open]);

  // ---- what to show without a query
  const idle = useMemo<Hit[]>(() => {
    const pageHit = (p: SearchPage): Hit => ({ id: p.href, section: 'pages', kind: p.group, title: p.label, href: p.href, icon: p.icon });
    const popular = POPULAR.map((h) => pages.find((p) => p.href === h)).filter((p): p is SearchPage => !!p).map(pageHit);
    const actions = ACTIONS.slice(0, 5).map((a): Hit => ({ id: a.href + a.label, section: 'pages', kind: 'Action', title: a.label, href: a.href, icon: a.icon }));
    return [
      ...recent.map((h): Hit => ({ ...h, icon: iconFor(h.kind), kind: `Recent · ${h.kind}` })),
      ...actions,
      ...popular,
    ].filter((h, i, all) => all.findIndex((x) => x.href === h.href && x.title === h.title) === i);
  }, [pages, recent]);

  // ---- search
  useEffect(() => {
    if (!open) return;
    if (clean.length < 2) { setHits([]); setLoading(false); return; }
    const token = ++run.current;
    setLoading(true);
    const t = setTimeout(async () => {
      const lower = clean.toLowerCase();
      const pageHits: Hit[] = [
        ...pages.filter((p) => `${p.label} ${p.group}`.toLowerCase().includes(lower)).map((p): Hit => ({ id: p.href, section: 'pages', kind: p.group, title: p.label, href: p.href, icon: p.icon })),
        ...ACTIONS.filter((a) => `${a.label} ${a.words}`.toLowerCase().includes(lower)).map((a): Hit => ({ id: a.href + a.label, section: 'pages', kind: 'Action', title: a.label, href: a.href, icon: a.icon })),
      ].slice(0, filter === 'pages' ? 10 : 4);
      const like = (cols: string[]) => cols.map((c) => `${c}.ilike.%${clean}%`).join(',');
      const wanted = SOURCES.filter((s) => filter === 'all' || filter === s.section);
      const limit = filter === 'all' ? 3 : 8;
      const results = await Promise.all(wanted.map(async (s) => {
        try {
          const { data } = await s.run(like, limit);
          return (data ?? []).map((r): Hit => ({ ...s.map(r), section: s.section }));
        } catch { return []; }
      }));
      if (token !== run.current) return;
      setHits([...(filter === 'all' || filter === 'pages' ? pageHits : []), ...results.flat()]);
      setActive(0);
      setLoading(false);
    }, 220);
    return () => clearTimeout(t);
  }, [clean, filter, open, pages, SOURCES]);

  const searching = clean.length >= 2;
  const flat = searching ? hits : idle;
  useEffect(() => { setActive(0); }, [query, filter]);
  useEffect(() => { document.getElementById(`adm-s-opt-${active}`)?.scrollIntoView({ block: 'nearest' }); }, [active]);

  function choose(hit: Hit) {
    saveRecent(hit);
    const url = hit.filterable && term ? `${hit.href}?q=${encodeURIComponent(term)}` : hit.href;
    close();
    router.push(url);
    // Already on that page: nothing remounts, so tell its search box directly.
    if (hit.filterable && term && pathname === hit.href) setTimeout(() => window.dispatchEvent(new CustomEvent('admin:q', { detail: term })), 50);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (flat.length ? (a + 1) % flat.length : 0)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (flat.length ? (a - 1 + flat.length) % flat.length : 0)); }
    else if (e.key === 'Enter') { const h = flat[active]; if (h) { e.preventDefault(); choose(h); } }
    else if (e.key === 'Escape') { e.preventDefault(); if (query) setQuery(''); else close(); }
    else if (e.key === 'Tab') {
      const nodes = panelRef.current?.querySelectorAll<HTMLElement>('input, button:not([disabled])');
      if (!nodes?.length) return;
      const first = nodes[0]!; const last = nodes[nodes.length - 1]!;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  const sections = (['pages', 'content', 'people', 'records'] as Section[])
    .map((s) => ({ s, items: flat.map((h, i) => ({ h, i })).filter(({ h }) => (searching ? h.section === s : s === 'pages')) }))
    .filter((g) => g.items.length > 0);
  const idleGroups = useMemo(() => {
    if (searching) return null;
    const groupOf = (h: Hit) => (h.kind.startsWith('Recent') ? 'Recent' : h.kind === 'Action' ? 'Quick actions' : 'Jump to');
    const order = ['Recent', 'Quick actions', 'Jump to'];
    return order.map((label) => ({ label, items: flat.map((h, i) => ({ h, i })).filter(({ h }) => groupOf(h) === label) })).filter((g) => g.items.length > 0);
  }, [flat, searching]);

  const panel = !open ? null : createPortal(
    <div className="fixed inset-0 z-[100] flex items-stretch justify-center sm:items-start sm:px-4 sm:pt-[8vh]" role="presentation">
      <div className="absolute inset-0" style={{ background: 'rgba(var(--brand-black-rgb, 0, 0, 0), 0.55)' }} onMouseDown={close} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Search the admin"
        onKeyDown={onKeyDown}
        className="relative flex h-full w-full flex-col overflow-hidden sm:h-auto sm:max-h-[78vh] sm:max-w-3xl sm:rounded-2xl"
        style={{ background: 'var(--adm-card)', border: '1px solid var(--adm-border)', boxShadow: 'var(--adm-shadow)' }}
      >
        <div className="flex items-center gap-3 border-b px-4" style={{ borderColor: 'var(--adm-border)' }}>
          <FontAwesomeIcon icon={faMagnifyingGlass} className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--adm-muted)' }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            role="combobox"
            aria-expanded="true"
            aria-controls="adm-s-list"
            aria-activedescendant={flat.length ? `adm-s-opt-${active}` : undefined}
            aria-autocomplete="list"
            aria-label="Search pages, content, people and orders"
            placeholder="Search tours, students, orders, users, pages..."
            autoComplete="off"
            spellCheck={false}
            className="min-h-[3.5rem] w-full flex-1 bg-transparent text-base outline-none"
            style={{ color: 'var(--adm-text)' }}
          />
          {query && (
            <button type="button" aria-label="Clear search" onClick={() => { setQuery(''); inputRef.current?.focus(); }} className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ color: 'var(--adm-muted)' }}>
              <FontAwesomeIcon icon={faXmark} className="h-3.5 w-3.5" />
            </button>
          )}
          <button type="button" onClick={close} className="rounded-lg px-2 py-1 text-xs font-semibold" style={{ background: 'var(--adm-track)', color: 'var(--adm-text-2)' }}>Esc</button>
        </div>

        <div className="flex gap-1.5 overflow-x-auto border-b px-3 py-2" style={{ borderColor: 'var(--adm-border)' }} role="group" aria-label="Narrow the search">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              aria-pressed={filter === f.key}
              onClick={() => { setFilter(f.key); inputRef.current?.focus(); }}
              className="min-h-[2rem] flex-shrink-0 rounded-full px-3 text-xs font-semibold"
              style={filter === f.key ? { background: 'var(--adm-primary)', color: 'rgb(var(--brand-white-rgb))' } : { background: 'var(--adm-track)', color: 'var(--adm-text-2)' }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div id="adm-s-list" role="listbox" aria-label="Results" className="min-h-0 flex-1 overflow-y-auto p-2">
          {searching && loading && flat.length === 0 && <p className="px-3 py-8 text-center text-sm" style={{ color: 'var(--adm-muted)' }}>Searching...</p>}
          {searching && !loading && flat.length === 0 && (
            <div className="px-3 py-10 text-center">
              <p className="text-sm font-semibold" style={{ color: 'var(--adm-text)' }}>No results for &ldquo;{term}&rdquo;</p>
              <p className="mt-1 text-xs" style={{ color: 'var(--adm-muted)' }}>Try a name, an email, an order number or a study reference such as SA-. Try the All filter if you narrowed it.</p>
            </div>
          )}

          {(searching ? sections.map(({ s, items }) => ({ label: SECTION_LABEL[s], items })) : idleGroups ?? []).map((g) => (
            <div key={g.label} role="group" aria-label={g.label} className="mb-1">
              <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--adm-muted)' }}>{g.label}</p>
              {g.items.map(({ h, i }) => (
                <div
                  key={`${h.section}-${h.id}-${i}`}
                  id={`adm-s-opt-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseMove={() => i !== active && setActive(i)}
                  onClick={() => choose(h)}
                  className="flex min-h-[3.25rem] cursor-pointer items-center gap-3 rounded-xl px-3 py-2"
                  style={{ background: i === active ? 'var(--adm-primary-soft)' : 'transparent' }}
                >
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg" style={{ background: 'var(--adm-track)', color: 'var(--adm-text-2)' }}>
                    {h.thumb
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={h.thumb} alt="" className="h-full w-full object-cover" loading="lazy" />
                      : <FontAwesomeIcon icon={h.icon} className="h-3.5 w-3.5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold" style={{ color: 'var(--adm-text)' }}><Highlight text={h.title} term={searching ? clean : ''} /></span>
                    <span className="block truncate text-xs" style={{ color: 'var(--adm-muted)' }}>{[h.kind, h.sub].filter(Boolean).join(' · ')}</span>
                  </span>
                  {h.badge && <span className="hidden flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold sm:inline" style={{ background: 'var(--adm-track)', color: 'var(--adm-text-2)' }}>{h.badge}</span>}
                  {i === active && <FontAwesomeIcon icon={faArrowRight} className="hidden h-3 w-3 flex-shrink-0 sm:block" style={{ color: 'var(--adm-primary)' }} />}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-2 text-[11px]" style={{ borderColor: 'var(--adm-border)', color: 'var(--adm-muted)' }}>
          <span className="hidden sm:inline">Up and down to move, Enter to open, Esc to close</span>
          <span aria-live="polite">{searching ? (loading ? 'Searching...' : `${flat.length} result${flat.length === 1 ? '' : 's'}`) : 'Type 2 or more letters'}</span>
        </div>
      </div>
    </div>,
    document.body,
  );

  return (
    <>
      <button
        type="button"
        onClick={(e) => { opener.current = e.currentTarget; setOpen(true); }}
        aria-label="Search"
        aria-haspopup="dialog"
        title="Search (Ctrl+K)"
        className="flex h-10 items-center gap-2 rounded-lg px-3 transition hover:scale-[1.02]"
        style={{ background: 'var(--adm-track)', color: 'var(--adm-text-2)' }}
      >
        <FontAwesomeIcon icon={faMagnifyingGlass} className="h-3.5 w-3.5" />
        <span className="hidden text-xs font-medium md:inline">Search</span>
        <kbd className="hidden rounded px-1.5 py-0.5 text-[10px] font-semibold lg:inline" style={{ background: 'var(--adm-card)', color: 'var(--adm-muted)', border: '1px solid var(--adm-border)' }}>Ctrl K</kbd>
      </button>
      {panel}
    </>
  );
}

/** Wraps the matching part of a title. */
function Highlight({ text, term }: { text: string; term: string }) {
  if (!term) return <>{text}</>;
  const i = text.toLowerCase().indexOf(term.toLowerCase());
  if (i < 0) return <>{text}</>;
  return <>{text.slice(0, i)}<mark className="rounded px-0.5" style={{ background: 'var(--adm-primary-soft)', color: 'var(--adm-primary)' }}>{text.slice(i, i + term.length)}</mark>{text.slice(i + term.length)}</>;
}

/** A stored recent item has no icon (functions do not survive JSON); pick one by its kind. */
function iconFor(kind: string): IconDefinition {
  const k = kind.toLowerCase();
  if (k.includes('tour') || k.includes('booking')) return faRoute;
  if (k.includes('blog')) return faNewspaper;
  if (k.includes('product')) return faBox;
  if (k.includes('order')) return faCartShopping;
  if (k.includes('study') || k.includes('universit') || k.includes('programme')) return faGraduationCap;
  if (k.includes('user')) return faUser;
  if (k.includes('message')) return faEnvelope;
  if (k.includes('ticket')) return faHeadset;
  if (k.includes('media')) return faImage;
  return faMagnifyingGlass;
}
