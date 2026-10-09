'use client';

// Inbox for the contact form. Opening a message marks it read, unread ones are
// bold with a dot, and each message can be answered by email in one click.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faEnvelopeOpen, faReply, faTrash } from '@fortawesome/free-solid-svg-icons';

import { createBrowserClient } from '@/lib/supabase/client';
import AdminLayout from '@/components/AdminLayout';
import { notify } from '@/components/admin/toast';
import { Avatar, Button, EmptyBlock, ListSkeleton, Modal, SearchInput, StatusPill, Surface, Tabs, Toolbar, confirmAction } from '@/components/admin/ui';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

type FilterTab = 'all' | 'unread' | 'read';

const when = (s: string) => {
  const d = new Date(s);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' }) });
};

export default function AdminContactsPage() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState<ContactMessage | null>(null);

  const load = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('contact_messages')
      .select('id, name, email, phone, subject, message, is_read, created_at')
      .order('created_at', { ascending: false });
    if (err) setError('Could not load messages.');
    else { setMessages((data as ContactMessage[]) ?? []); setError(''); }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  async function setRead(msg: ContactMessage, is_read: boolean, quiet = false) {
    const { error: err } = await supabase.from('contact_messages').update({ is_read }).eq('id', msg.id);
    if (err) { if (!quiet) notify('Could not update the message.'); return; }
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, is_read } : m)));
    setOpen((o) => (o?.id === msg.id ? { ...o, is_read } : o));
  }

  function openMessage(msg: ContactMessage) {
    setOpen(msg);
    if (!msg.is_read) void setRead(msg, true, true);
  }

  async function remove(msg: ContactMessage) {
    if (!(await confirmAction({ message: `Delete the message from ${msg.name || msg.email}? You can restore it from Trash.`, danger: true }))) return;
    const { error: err } = await supabase.from('contact_messages').delete().eq('id', msg.id);
    if (err) return notify('Could not delete the message.');
    setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    setOpen(null);
    notify('Message deleted.', 'success');
  }

  const counts = { all: messages.length, unread: messages.filter((m) => !m.is_read).length, read: messages.filter((m) => m.is_read).length };
  const q = search.trim().toLowerCase();
  const visible = messages.filter((m) => {
    if (tab === 'unread' && m.is_read) return false;
    if (tab === 'read' && !m.is_read) return false;
    return !q || [m.name, m.email, m.subject ?? '', m.message].some((t) => t.toLowerCase().includes(q));
  });

  return (
    <AdminLayout title="Contact Messages" subtitle="Inbox of contact form submissions">
      <Toolbar>
        <Tabs value={tab} onChange={setTab} tabs={(['all', 'unread', 'read'] as const).map((key) => ({ key, label: key === 'all' ? 'All' : key === 'unread' ? 'Unread' : 'Read', count: counts[key] }))} />
        <SearchInput className="min-w-[14rem] flex-1 sm:max-w-sm sm:ml-auto" value={search} onChange={setSearch} placeholder="Search sender, subject or message" label="Search messages" />
      </Toolbar>

      {error ? (
        <p role="alert" className="rounded-[var(--adm-radius-control)] p-4 text-sm" style={{ background: 'var(--adm-error-soft)', color: 'var(--adm-error)' }}>{error}</p>
      ) : (
        <Surface className="overflow-hidden">
          {loading ? (
            <ListSkeleton />
          ) : visible.length === 0 ? (
            <EmptyBlock title={messages.length === 0 ? 'No messages yet' : 'No messages match'} body={messages.length === 0 ? 'Messages sent from the Contact Us page appear here.' : 'Try a different search or tab.'} />
          ) : (
            <ul>
              {visible.map((m) => (
                <li key={m.id} className="border-b last:border-b-0" style={{ borderColor: 'var(--adm-border)' }}>
                  <button type="button" onClick={() => openMessage(m)} className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-black/[0.03]">
                    <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full" style={{ background: m.is_read ? 'transparent' : 'var(--adm-primary)' }} aria-hidden />
                    <Avatar name={m.name || m.email} size={36} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className={`truncate text-sm ${m.is_read ? 'font-medium' : 'font-bold'}`} style={{ color: 'var(--adm-text)' }}>
                          {m.name || m.email}
                          {!m.is_read && <span className="sr-only"> (unread)</span>}
                        </span>
                        <span className="flex-shrink-0 text-xs" style={{ color: 'var(--adm-muted)' }}>{when(m.created_at)}</span>
                      </span>
                      <span className={`block truncate text-sm ${m.is_read ? '' : 'font-semibold'}`} style={{ color: 'var(--adm-text)' }}>{m.subject || 'No subject'}</span>
                      <span className="block truncate text-xs" style={{ color: 'var(--adm-muted)' }}>{m.message}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Surface>
      )}

      {open && (
        <Modal
          title={open.subject || 'Message'}
          subtitle={`From ${open.name || open.email} · ${new Date(open.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
          maxWidth="max-w-xl"
          onClose={() => setOpen(null)}
          footer={
            <>
              <Button variant="danger" onClick={() => remove(open)}><FontAwesomeIcon icon={faTrash} className="mr-2 h-3 w-3" />Delete</Button>
              <Button variant="secondary" onClick={() => setRead(open, !open.is_read)}>
                <FontAwesomeIcon icon={open.is_read ? faEnvelope : faEnvelopeOpen} className="mr-2 h-3 w-3" />{open.is_read ? 'Mark unread' : 'Mark read'}
              </Button>
              <a
                href={`mailto:${open.email}?subject=${encodeURIComponent(`Re: ${open.subject || 'Your message to TechTour Ghana'}`)}`}
                className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white"
                style={{ background: 'var(--adm-primary)', borderRadius: 'var(--adm-radius-control)' }}
              >
                <FontAwesomeIcon icon={faReply} className="mr-2 h-3 w-3" />Reply
              </a>
            </>
          }
        >
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <StatusPill tone={open.is_read ? 'neutral' : 'warning'}>{open.is_read ? 'Read' : 'Unread'}</StatusPill>
            <a href={`mailto:${open.email}`} className="text-xs font-semibold" style={{ color: 'var(--adm-primary)' }}>{open.email}</a>
            {open.phone && <a href={`tel:${open.phone.replace(/[^\d+]/g, '')}`} className="text-xs" style={{ color: 'var(--adm-text-2)' }}>{open.phone}</a>}
          </div>
          <p className="whitespace-pre-wrap rounded-[var(--adm-radius-control)] p-4 text-sm leading-relaxed" style={{ background: 'var(--adm-bg)', border: '1px solid var(--adm-border)', color: 'var(--adm-text)' }}>{open.message}</p>
        </Modal>
      )}
    </AdminLayout>
  );
}
