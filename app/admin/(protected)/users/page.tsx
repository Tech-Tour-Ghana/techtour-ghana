'use client';

// Customer and staff accounts. Making someone an admin or suspending them is
// confirmed first, applied only when the database accepts it, and blocked for
// your own account so you cannot lock yourself out.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBan, faCheck, faCircleInfo, faShield, faShieldHalved, faUnlock, faXmark } from '@fortawesome/free-solid-svg-icons';

import { createBrowserClient } from '@/lib/supabase/client';
import AdminLayout from '@/components/AdminLayout';
import { notify } from '@/components/admin/toast';
import {
  Avatar, Button, IconButton, Modal, SearchInput, StatusPill, TableCard, Toolbar,
  confirmAction, fieldStyle, fmtDate, rowClass,
} from '@/components/admin/ui';

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string | null;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
}

type Filter = 'all' | 'admins' | 'suspended';

const nameOf = (u: Profile) => [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email || 'Unnamed user';

export default function AdminUsersPage() {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [users, setUsers] = useState<Profile[]>([]);
  const [me, setMe] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [viewUser, setViewUser] = useState<Profile | null>(null);

  const load = useCallback(async () => {
    const [list, auth] = await Promise.all([
      supabase.from('profiles').select('id, first_name, last_name, email, phone_number, is_admin, is_active, created_at').order('created_at', { ascending: false }),
      supabase.auth.getUser(),
    ]);
    setMe(auth.data.user?.id ?? null);
    if (list.error) setError('Could not load users.');
    else { setUsers(list.data ?? []); setError(''); }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  async function change(user: Profile, patch: Partial<Pick<Profile, 'is_admin' | 'is_active'>>, done: string) {
    setBusyId(user.id);
    const { error: err } = await supabase.from('profiles').update(patch).eq('id', user.id);
    setBusyId(null);
    if (err) return notify('Could not update this account. Please try again.');
    const next = { ...user, ...patch };
    setUsers((prev) => prev.map((u) => (u.id === user.id ? next : u)));
    setViewUser((v) => (v?.id === user.id ? next : v));
    notify(done, 'success');
  }

  async function toggleAdmin(user: Profile) {
    if (user.id === me) return notify('You cannot change your own admin access.');
    const grant = !user.is_admin;
    const ok = await confirmAction({
      title: grant ? 'Make this person an admin?' : 'Remove admin access?',
      message: grant
        ? `${nameOf(user)} will be able to see and change everything in the admin area, including other users.`
        : `${nameOf(user)} will lose access to the admin area.`,
      confirmLabel: grant ? 'Make admin' : 'Remove admin',
      danger: !grant,
    });
    if (ok) await change(user, { is_admin: grant }, grant ? 'Admin access granted.' : 'Admin access removed.');
  }

  async function toggleActive(user: Profile) {
    if (user.id === me) return notify('You cannot suspend your own account.');
    const suspend = user.is_active;
    const ok = await confirmAction({
      title: suspend ? 'Suspend this account?' : 'Reactivate this account?',
      message: suspend ? `${nameOf(user)} will no longer be able to use their account.` : `${nameOf(user)} will be able to sign in and use their account again.`,
      confirmLabel: suspend ? 'Suspend' : 'Reactivate',
      danger: suspend,
    });
    if (ok) await change(user, { is_active: !suspend }, suspend ? 'Account suspended.' : 'Account reactivated.');
  }

  const q = search.trim().toLowerCase();
  const visible = users.filter((u) => {
    if (filter === 'admins' && !u.is_admin) return false;
    if (filter === 'suspended' && u.is_active) return false;
    return !q || nameOf(u).toLowerCase().includes(q) || (u.email ?? '').toLowerCase().includes(q) || (u.phone_number ?? '').includes(q);
  });
  const counts = { admins: users.filter((u) => u.is_admin).length, suspended: users.filter((u) => !u.is_active).length };

  return (
    <AdminLayout title="Users" subtitle="Manage user accounts">
      <Toolbar>
        <SearchInput className="min-w-[14rem] flex-1 sm:max-w-sm" value={search} onChange={setSearch} placeholder="Search name, email or phone" label="Search users" />
        <select aria-label="Filter users" value={filter} onChange={(e) => setFilter(e.target.value as Filter)} className="px-3 py-2 text-sm" style={fieldStyle}>
          <option value="all">All users ({users.length})</option>
          <option value="admins">Admins ({counts.admins})</option>
          <option value="suspended">Suspended ({counts.suspended})</option>
        </select>
      </Toolbar>

      {error ? (
        <p role="alert" className="rounded-[var(--adm-radius-control)] p-4 text-sm" style={{ background: 'var(--adm-error-soft)', color: 'var(--adm-error)' }}>{error}</p>
      ) : (
        <TableCard
          loading={loading}
          empty={visible.length === 0}
          emptyTitle={users.length === 0 ? 'No users yet' : 'No users match'}
          emptyBody={users.length === 0 ? undefined : 'Try a different search or filter.'}
          headers={['User', 'Phone', 'Role', 'Status', 'Joined', '']}
        >
          {visible.map((u) => {
            const isMe = u.id === me;
            const busy = busyId === u.id;
            return (
              <tr key={u.id} className={rowClass} style={{ borderColor: 'var(--adm-border)' }}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={nameOf(u)} />
                    <div className="min-w-0">
                      <p className="truncate font-medium" style={{ color: 'var(--adm-text)' }}>{nameOf(u)}{isMe && <span className="ml-2 text-[11px] font-normal" style={{ color: 'var(--adm-muted)' }}>(you)</span>}</p>
                      <p className="truncate text-xs" style={{ color: 'var(--adm-muted)' }}>{u.email || '-'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--adm-text-2)' }}>{u.phone_number || '-'}</td>
                <td className="px-4 py-3"><StatusPill tone={u.is_admin ? 'info' : 'neutral'} icon={u.is_admin ? faShieldHalved : faShield}>{u.is_admin ? 'Admin' : 'User'}</StatusPill></td>
                <td className="px-4 py-3"><StatusPill tone={u.is_active ? 'success' : 'danger'} icon={u.is_active ? faCheck : faXmark}>{u.is_active ? 'Active' : 'Suspended'}</StatusPill></td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--adm-muted)' }}>{fmtDate(u.created_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <IconButton title="View profile" color="var(--adm-text-2)" onClick={() => setViewUser(u)}><FontAwesomeIcon icon={faCircleInfo} className="h-3 w-3" /></IconButton>
                    <IconButton title={u.is_admin ? 'Remove admin' : 'Make admin'} disabled={busy || isMe} onClick={() => toggleAdmin(u)}><FontAwesomeIcon icon={u.is_admin ? faShield : faShieldHalved} className="h-3 w-3" /></IconButton>
                    <IconButton title={u.is_active ? 'Suspend user' : 'Reactivate user'} color={u.is_active ? 'var(--adm-error)' : 'var(--adm-success)'} disabled={busy || isMe} onClick={() => toggleActive(u)}><FontAwesomeIcon icon={u.is_active ? faBan : faUnlock} className="h-3 w-3" /></IconButton>
                  </div>
                </td>
              </tr>
            );
          })}
        </TableCard>
      )}

      {viewUser && (
        <Modal
          title="User profile"
          maxWidth="max-w-md"
          onClose={() => setViewUser(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => toggleAdmin(viewUser)} disabled={busyId === viewUser.id || viewUser.id === me}>{viewUser.is_admin ? 'Remove admin' : 'Make admin'}</Button>
              <Button variant={viewUser.is_active ? 'danger' : 'secondary'} onClick={() => toggleActive(viewUser)} disabled={busyId === viewUser.id || viewUser.id === me}>{viewUser.is_active ? 'Suspend' : 'Reactivate'}</Button>
              <Button variant="secondary" onClick={() => setViewUser(null)}>Close</Button>
            </>
          }
        >
          <div className="mb-4 flex items-center gap-3">
            <Avatar name={nameOf(viewUser)} size={48} />
            <div className="min-w-0">
              <p className="truncate text-base font-bold" style={{ color: 'var(--adm-text)' }}>{nameOf(viewUser)}</p>
              <div className="mt-1 flex gap-2">
                <StatusPill tone={viewUser.is_admin ? 'info' : 'neutral'}>{viewUser.is_admin ? 'Admin' : 'User'}</StatusPill>
                <StatusPill tone={viewUser.is_active ? 'success' : 'danger'}>{viewUser.is_active ? 'Active' : 'Suspended'}</StatusPill>
              </div>
            </div>
          </div>
          <dl className="space-y-2 text-sm">
            {[
              ['Email', viewUser.email || '-'],
              ['Phone', viewUser.phone_number || '-'],
              ['Joined', new Date(viewUser.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })],
              ['User ID', viewUser.id],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt className="flex-shrink-0 font-medium" style={{ color: 'var(--adm-muted)' }}>{k}</dt>
                <dd className="break-all text-right" style={{ color: 'var(--adm-text)' }}>{v}</dd>
              </div>
            ))}
          </dl>
        </Modal>
      )}
    </AdminLayout>
  );
}
