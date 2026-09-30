'use client';

import { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faPen, faTrash, faSpinner, faChevronDown, faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import { createBrowserClient } from '@/lib/supabase/client';
import AdminLayout from '@/components/AdminLayout';
import { Button, IconButton, ListSkeleton, Modal, StatusPill, Tabs, confirmAction, reportError, rowClass } from '@/components/admin/ui';

type Tab = 'navbar' | 'footer_links' | 'footer_info';

interface NavMenu { id: string; label: string; url: string; sort_order: number; is_active: boolean; has_dropdown: boolean; }
interface NavDropdown { id: string; parent_menu_id: string; label: string; url: string; sort_order: number; is_active: boolean; }
interface FooterQuickLink { id: string; label: string; url: string; category: string; sort_order: number; is_active: boolean; }
interface SocialLink { id: string; platform: string; url: string; sort_order: number; is_active: boolean; }
interface LegalLink { id: string; label: string; url: string; sort_order: number; is_active: boolean; }
interface FooterSettings { id: string; company_name: string; tagline: string; copyright_text: string; }
interface FooterContact { id: string; icon: string; text: string; sort_order: number; is_active: boolean; }


export default function NavigationPage() {
  const [tab, setTab] = useState<Tab>('navbar');
  const [menus, setMenus] = useState<NavMenu[]>([]);
  const [dropdowns, setDropdowns] = useState<NavDropdown[]>([]);
  const [footerLinks, setFooterLinks] = useState<FooterQuickLink[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [legalLinks, setLegalLinks] = useState<LegalLink[]>([]);
  const [footerSettings, setFooterSettings] = useState<FooterSettings | null>(null);
  const [footerContacts, setFooterContacts] = useState<FooterContact[]>([]);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<{ type: string; data: Record<string, unknown> } | null>(null);

  const fetchAll = useCallback(async () => {
    const supabase = createBrowserClient();
    const [m, d, fl, sl, ll, fs, fc] = await Promise.all([
      supabase.from('navbar_menus').select('*').order('sort_order'),
      supabase.from('navbar_dropdowns').select('*').order('sort_order'),
      supabase.from('footer_quick_links').select('*').order('sort_order'),
      supabase.from('social_links').select('*').order('sort_order'),
      supabase.from('legal_links').select('*').order('sort_order'),
      supabase.from('footer_settings').select('*').limit(1).maybeSingle(),
      supabase.from('footer_contacts').select('*').order('sort_order'),
    ]);
    setMenus((m.data ?? []) as NavMenu[]);
    setDropdowns((d.data ?? []) as NavDropdown[]);
    setFooterLinks((fl.data ?? []) as FooterQuickLink[]);
    setSocialLinks((sl.data ?? []) as SocialLink[]);
    setLegalLinks((ll.data ?? []) as LegalLink[]);
    setFooterSettings(fs.data as FooterSettings | null);
    setFooterContacts((fc.data ?? []) as FooterContact[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const themeStyles = {
    cardBg: 'var(--adm-card)',
    textPrimary: 'var(--adm-text)',
    textSecondary: 'var(--adm-text-2)',
    textMuted: 'var(--adm-muted)',
    border: 'var(--adm-border)',
    inputBg: 'var(--adm-bg)',
    inputBorder: 'var(--adm-border)',
  };

  const inputClass = 'w-full px-3 py-2 rounded-lg border text-sm focus:outline-none';
  const inputStyle = { background: themeStyles.inputBg, borderColor: themeStyles.inputBorder, color: themeStyles.textPrimary };
  const labelStyle = { color: themeStyles.textSecondary };

  async function saveModal() {
    if (!modal) return;
    setSaving(true);
    const supabase = createBrowserClient();
    const { type, data } = modal;

    const s = (v: unknown) => String(v ?? '');
    const b = (v: unknown) => (v == null ? true : Boolean(v));
    if (type === 'menu_edit' || type === 'menu_add') {
      const row = { label: s(data.label), url: s(data.url), sort_order: Number(data.sort_order) || 0, is_active: b(data.is_active) };
      if (data.id) { if (reportError((await supabase.from('navbar_menus').update(row).eq('id', String(data.id))).error)) { setSaving(false); return; } }
      else { if (reportError((await supabase.from('navbar_menus').insert(row)).error)) { setSaving(false); return; } }
    } else if (type === 'dropdown_edit' || type === 'dropdown_add') {
      const row = { parent_menu_id: s(data.parent_menu_id), label: s(data.label), url: s(data.url), sort_order: Number(data.sort_order) || 0, is_active: b(data.is_active) };
      if (data.id) { if (reportError((await supabase.from('navbar_dropdowns').update(row).eq('id', String(data.id))).error)) { setSaving(false); return; } }
      else { if (reportError((await supabase.from('navbar_dropdowns').insert(row)).error)) { setSaving(false); return; } }
    } else if (type === 'footer_link_edit' || type === 'footer_link_add') {
      const row = { label: s(data.label), url: s(data.url), category: (s(data.category) || 'company') as 'destinations' | 'services' | 'company' | 'support', sort_order: Number(data.sort_order) || 0, is_active: b(data.is_active) };
      if (data.id) { if (reportError((await supabase.from('footer_quick_links').update(row).eq('id', String(data.id))).error)) { setSaving(false); return; } }
      else { if (reportError((await supabase.from('footer_quick_links').insert(row)).error)) { setSaving(false); return; } }
    } else if (type === 'social_edit' || type === 'social_add') {
      const row = { platform: (s(data.platform) || 'other') as 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'youtube' | 'tiktok' | 'whatsapp' | 'other', url: s(data.url), sort_order: Number(data.sort_order) || 0, is_active: b(data.is_active) };
      if (data.id) { if (reportError((await supabase.from('social_links').update(row).eq('id', String(data.id))).error)) { setSaving(false); return; } }
      else { if (reportError((await supabase.from('social_links').insert(row)).error)) { setSaving(false); return; } }
    } else if (type === 'legal_edit' || type === 'legal_add') {
      const row = { label: s(data.label), url: s(data.url), sort_order: Number(data.sort_order) || 0, is_active: b(data.is_active) };
      if (data.id) { if (reportError((await supabase.from('legal_links').update(row).eq('id', String(data.id))).error)) { setSaving(false); return; } }
      else { if (reportError((await supabase.from('legal_links').insert(row)).error)) { setSaving(false); return; } }
    } else if (type === 'footer_settings') {
      if (data.id) { if (reportError((await supabase.from('footer_settings').update({ company_name: s(data.company_name), tagline: s(data.tagline), copyright_text: s(data.copyright_text) }).eq('id', String(data.id))).error)) { setSaving(false); return; } }
    } else if (type === 'footer_contact_edit' || type === 'footer_contact_add') {
      const row = { icon: s(data.icon), text: s(data.text), sort_order: Number(data.sort_order) || 0, is_active: b(data.is_active) };
      if (data.id) { if (reportError((await supabase.from('footer_contacts').update(row).eq('id', String(data.id))).error)) { setSaving(false); return; } }
      else { if (reportError((await supabase.from('footer_contacts').insert(row)).error)) { setSaving(false); return; } }
    }

    await fetchAll();
    setSaving(false);
    setModal(null);
  }

  async function del(table: 'navbar_menus' | 'navbar_dropdowns' | 'footer_quick_links' | 'social_links' | 'legal_links' | 'footer_contacts', id: string) {
    if (!(await confirmAction({ message: 'Delete this item?', danger: true }))) return;
    const supabase = createBrowserClient();
    if (reportError((await supabase.from(table).delete().eq('id', id)).error)) { return; }
    fetchAll();
  }

  const setField = (key: string, value: unknown) =>
    setModal((m) => m ? { ...m, data: { ...m.data, [key]: value } } : m);

  const BtnRow = ({ table, row, onEdit }: { table: 'navbar_menus' | 'navbar_dropdowns' | 'footer_quick_links' | 'social_links' | 'legal_links' | 'footer_contacts'; row: { id: string }; onEdit: () => void }) => (
    <div className="flex gap-2">
      <IconButton title="Edit" onClick={onEdit}><FontAwesomeIcon icon={faPen} className="h-3 w-3" /></IconButton>
      <IconButton title="Delete" color="var(--adm-error)" onClick={() => del(table, row.id)}><FontAwesomeIcon icon={faTrash} className="h-3 w-3" /></IconButton>
    </div>
  );

  const Badge = ({ active }: { active: boolean }) => <StatusPill tone={active ? 'success' : 'neutral'}>{active ? 'Active' : 'Inactive'}</StatusPill>;

  const TABS: { key: Tab; label: string }[] = [
    { key: 'navbar', label: 'Navbar Menus' },
    { key: 'footer_links', label: 'Footer Links' },
    { key: 'footer_info', label: 'Footer Info' },
  ];

  if (loading) {
    return (
      <AdminLayout title="Navigation" subtitle="Manage navbar and footer content">
        <ListSkeleton />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Navigation" subtitle="Manage navbar and footer content">
      {/* Tab bar */}
      <div className="mb-6"><Tabs value={tab} onChange={setTab} tabs={TABS.map((t) => ({ key: t.key, label: t.label }))} /></div>

      {/* Navbar Menus tab */}
      {tab === 'navbar' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold" style={{ color: themeStyles.textPrimary }}>Navbar Menus ({menus.length})</h2>
            <Button onClick={() => setModal({ type: 'menu_add', data: { label: '', url: '', sort_order: 0, is_active: true } })}><FontAwesomeIcon icon={faPlus} className="mr-2 h-3 w-3" />Add Menu</Button>
          </div>

          <div className="rounded-[var(--adm-radius-card)] overflow-hidden" style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, boxShadow: 'var(--adm-shadow)' }}>
            {menus.map((menu) => (
              <div key={menu.id}>
                <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: themeStyles.border }}>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setExpandedMenu(expandedMenu === menu.id ? null : menu.id)} style={{ color: themeStyles.textMuted }}>
                      <FontAwesomeIcon icon={expandedMenu === menu.id ? faChevronDown : faChevronRight} className="w-3 h-3" />
                    </button>
                    <div>
                      <p className="text-sm font-medium" style={{ color: themeStyles.textPrimary }}>{menu.label}</p>
                      <p className="text-xs" style={{ color: themeStyles.textMuted }}>{menu.url || '(no URL)'} · order {menu.sort_order}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge active={menu.is_active} />
                    <BtnRow table="navbar_menus" row={menu} onEdit={() => setModal({ type: 'menu_edit', data: { ...menu } })} />
                  </div>
                </div>

                {expandedMenu === menu.id && (
                  <div className="pl-8" style={{ background: 'var(--adm-track)' }}>
                    <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: themeStyles.border }}>
                      <p className="text-xs font-medium" style={{ color: themeStyles.textMuted }}>Dropdown items</p>
                      <button onClick={() => setModal({ type: 'dropdown_add', data: { parent_menu_id: menu.id, label: '', url: '', sort_order: 0, is_active: true } })}
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs"
                        style={{ background: 'var(--adm-primary-soft)', color: 'var(--adm-primary)' }}>
                        <FontAwesomeIcon icon={faPlus} className="w-2.5 h-2.5" /> Add Item
                      </button>
                    </div>
                    {dropdowns.filter((d) => d.parent_menu_id === menu.id).map((dd) => (
                      <div key={dd.id} className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: themeStyles.border }}>
                        <div>
                          <p className="text-xs font-medium" style={{ color: themeStyles.textPrimary }}>{dd.label}</p>
                          <p className="text-xs" style={{ color: themeStyles.textMuted }}>{dd.url}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge active={dd.is_active} />
                          <BtnRow table="navbar_dropdowns" row={dd} onEdit={() => setModal({ type: 'dropdown_edit', data: { ...dd } })} />
                        </div>
                      </div>
                    ))}
                    {dropdowns.filter((d) => d.parent_menu_id === menu.id).length === 0 && (
                      <p className="px-4 py-2 text-xs" style={{ color: themeStyles.textMuted }}>No dropdown items</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Links tab */}
      {tab === 'footer_links' && (
        <div className="space-y-6">
          {/* Quick links */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-semibold" style={{ color: themeStyles.textPrimary }}>Quick Links ({footerLinks.length})</h2>
              <Button onClick={() => setModal({ type: 'footer_link_add', data: { label: '', url: '', category: 'company', sort_order: 0, is_active: true } })}><FontAwesomeIcon icon={faPlus} className="mr-2 h-3 w-3" />Add Link</Button>
            </div>
            <div className="rounded-[var(--adm-radius-card)] overflow-hidden" style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, boxShadow: 'var(--adm-shadow)' }}>
              <table className="w-full text-sm">
                <thead><tr style={{ borderBottom: `1px solid ${themeStyles.border}` }}>
                  {['Title', 'URL', 'Category', 'Order', 'Status', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide" style={{ color: themeStyles.textMuted }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {footerLinks.map((link) => (
                    <tr key={link.id} className={rowClass} style={{ borderColor: themeStyles.border }}>
                      <td className="px-4 py-3 font-medium" style={{ color: themeStyles.textPrimary }}>{link.label}</td>
                      <td className="px-4 py-3" style={{ color: themeStyles.textSecondary }}>{link.url}</td>
                      <td className="px-4 py-3"><StatusPill tone="info"><span className="capitalize">{link.category}</span></StatusPill></td>
                      <td className="px-4 py-3" style={{ color: themeStyles.textMuted }}>{link.sort_order}</td>
                      <td className="px-4 py-3"><Badge active={link.is_active} /></td>
                      <td className="px-4 py-3"><BtnRow table="footer_quick_links" row={link} onEdit={() => setModal({ type: 'footer_link_edit', data: { ...link } })} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Social links */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-semibold" style={{ color: themeStyles.textPrimary }}>Social Links ({socialLinks.length})</h2>
              <Button onClick={() => setModal({ type: 'social_add', data: { platform: 'facebook', url: '', sort_order: 0, is_active: true } })}><FontAwesomeIcon icon={faPlus} className="mr-2 h-3 w-3" />Add Social</Button>
            </div>
            <div className="rounded-[var(--adm-radius-card)] overflow-hidden" style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, boxShadow: 'var(--adm-shadow)' }}>
              <table className="w-full text-sm">
                <thead><tr style={{ borderBottom: `1px solid ${themeStyles.border}` }}>
                  {['Platform', 'URL', 'Order', 'Status', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide" style={{ color: themeStyles.textMuted }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {socialLinks.map((link) => (
                    <tr key={link.id} className={rowClass} style={{ borderColor: themeStyles.border }}>
                      <td className="px-4 py-3 font-medium capitalize" style={{ color: themeStyles.textPrimary }}>{link.platform}</td>
                      <td className="px-4 py-3 max-w-xs truncate" style={{ color: themeStyles.textSecondary }}>{link.url}</td>
                      <td className="px-4 py-3" style={{ color: themeStyles.textMuted }}>{link.sort_order}</td>
                      <td className="px-4 py-3"><Badge active={link.is_active} /></td>
                      <td className="px-4 py-3"><BtnRow table="social_links" row={link} onEdit={() => setModal({ type: 'social_edit', data: { ...link } })} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legal links */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-semibold" style={{ color: themeStyles.textPrimary }}>Legal Links ({legalLinks.length})</h2>
              <Button onClick={() => setModal({ type: 'legal_add', data: { label: '', url: '', sort_order: 0, is_active: true } })}><FontAwesomeIcon icon={faPlus} className="mr-2 h-3 w-3" />Add Legal Link</Button>
            </div>
            <div className="rounded-[var(--adm-radius-card)] overflow-hidden" style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, boxShadow: 'var(--adm-shadow)' }}>
              <table className="w-full text-sm">
                <thead><tr style={{ borderBottom: `1px solid ${themeStyles.border}` }}>
                  {['Title', 'URL', 'Order', 'Status', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide" style={{ color: themeStyles.textMuted }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {legalLinks.map((link) => (
                    <tr key={link.id} className={rowClass} style={{ borderColor: themeStyles.border }}>
                      <td className="px-4 py-3 font-medium" style={{ color: themeStyles.textPrimary }}>{link.label}</td>
                      <td className="px-4 py-3" style={{ color: themeStyles.textSecondary }}>{link.url}</td>
                      <td className="px-4 py-3" style={{ color: themeStyles.textMuted }}>{link.sort_order}</td>
                      <td className="px-4 py-3"><Badge active={link.is_active} /></td>
                      <td className="px-4 py-3"><BtnRow table="legal_links" row={link} onEdit={() => setModal({ type: 'legal_edit', data: { ...link } })} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Footer Info tab */}
      {tab === 'footer_info' && (
        <div className="space-y-6">
          {/* Footer settings */}
          {footerSettings && (
            <div className="rounded-xl p-5" style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, boxShadow: 'var(--adm-shadow)' }}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-semibold" style={{ color: themeStyles.textPrimary }}>Footer Settings</h2>
                <button onClick={() => setModal({ type: 'footer_settings', data: { ...footerSettings } })}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{ background: 'var(--adm-primary-soft)', color: 'var(--adm-primary)' }}>
                  <FontAwesomeIcon icon={faPen} className="w-3 h-3" /> Edit
                </button>
              </div>
              <div className="space-y-2 text-xs">
                <p><span style={{ color: themeStyles.textMuted }}>Company: </span><span style={{ color: themeStyles.textPrimary }}>{footerSettings.company_name}</span></p>
                <p><span style={{ color: themeStyles.textMuted }}>Tagline: </span><span style={{ color: themeStyles.textPrimary }}>{footerSettings.tagline}</span></p>
                <p><span style={{ color: themeStyles.textMuted }}>Copyright: </span><span style={{ color: themeStyles.textPrimary }}>{footerSettings.copyright_text}</span></p>
              </div>
            </div>
          )}

          {/* Footer contacts */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-semibold" style={{ color: themeStyles.textPrimary }}>Footer Contacts ({footerContacts.length})</h2>
              <Button onClick={() => setModal({ type: 'footer_contact_add', data: { icon: '', text: '', sort_order: 0, is_active: true } })}><FontAwesomeIcon icon={faPlus} className="mr-2 h-3 w-3" />Add Contact</Button>
            </div>
            <div className="rounded-[var(--adm-radius-card)] overflow-hidden" style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}`, boxShadow: 'var(--adm-shadow)' }}>
              <table className="w-full text-sm">
                <thead><tr style={{ borderBottom: `1px solid ${themeStyles.border}` }}>
                  {['Icon', 'Text', 'Order', 'Status', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide" style={{ color: themeStyles.textMuted }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {footerContacts.map((c) => (
                    <tr key={c.id} className={rowClass} style={{ borderColor: themeStyles.border }}>
                      <td className="px-4 py-3 font-medium" style={{ color: themeStyles.textPrimary }}>{c.icon}</td>
                      <td className="px-4 py-3" style={{ color: themeStyles.textSecondary }}>{c.text}</td>
                      <td className="px-4 py-3" style={{ color: themeStyles.textMuted }}>{c.sort_order}</td>
                      <td className="px-4 py-3"><Badge active={c.is_active} /></td>
                      <td className="px-4 py-3"><BtnRow table="footer_contacts" row={c} onEdit={() => setModal({ type: 'footer_contact_edit', data: { ...c } })} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <Modal title={`${modal.type.includes('add') ? 'Add' : 'Edit'}${' '} ${modal.type.includes('menu') ? 'Menu' : modal.type.includes('dropdown') ? 'Dropdown Item' : modal.type.includes('footer_link') ? 'Footer Link' : modal.type.includes('social') ? 'Social Link' : modal.type.includes('legal') ? 'Legal Link' : modal.type.includes('footer_settings') ? 'Footer Settings' : 'Footer Contact'}`} maxWidth="max-w-md" onClose={() => setModal(null)}
          footer={
            <>
              <Button className="flex-1" onClick={saveModal} disabled={saving}>
{saving ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : 'Save'}
</Button>
              <Button variant="secondary" className="flex-1" onClick={() => setModal(null)}>
Cancel
</Button>
            
            </>
          }
        >
<div className="space-y-4">
            {/* Menu fields */}
            {(modal.type === 'menu_add' || modal.type === 'menu_edit') && <>
              <div><label className="block text-xs font-medium mb-1" style={labelStyle}>Label</label>
                <input className={inputClass} style={inputStyle} value={String(modal.data.label || '')} onChange={(e) => setField('label', e.target.value)} /></div>
              <div><label className="block text-xs font-medium mb-1" style={labelStyle}>URL (leave empty for parent)</label>
                <input className={inputClass} style={inputStyle} value={String(modal.data.url || '')} onChange={(e) => setField('url', e.target.value)} /></div>
              <div><label className="block text-xs font-medium mb-1" style={labelStyle}>Sort Order</label>
                <input type="number" className={inputClass} style={inputStyle} value={Number(modal.data.sort_order ?? 0)} onChange={(e) => setField('sort_order', e.target.value)} /></div>
              <label className="flex items-center gap-2 text-xs cursor-pointer" style={labelStyle}>
                <input type="checkbox" checked={Boolean(modal.data.is_active)} onChange={(e) => setField('is_active', e.target.checked)} />Active
              </label>
            </>}

            {/* Dropdown fields */}
            {(modal.type === 'dropdown_add' || modal.type === 'dropdown_edit') && <>
              <div><label className="block text-xs font-medium mb-1" style={labelStyle}>Label</label>
                <input className={inputClass} style={inputStyle} value={String(modal.data.label || '')} onChange={(e) => setField('label', e.target.value)} /></div>
              <div><label className="block text-xs font-medium mb-1" style={labelStyle}>URL</label>
                <input className={inputClass} style={inputStyle} value={String(modal.data.url || '')} onChange={(e) => setField('url', e.target.value)} /></div>
              <div><label className="block text-xs font-medium mb-1" style={labelStyle}>Sort Order</label>
                <input type="number" className={inputClass} style={inputStyle} value={Number(modal.data.sort_order ?? 0)} onChange={(e) => setField('sort_order', e.target.value)} /></div>
              <label className="flex items-center gap-2 text-xs cursor-pointer" style={labelStyle}>
                <input type="checkbox" checked={Boolean(modal.data.is_active)} onChange={(e) => setField('is_active', e.target.checked)} />Active
              </label>
            </>}

            {/* Footer link fields */}
            {(modal.type === 'footer_link_add' || modal.type === 'footer_link_edit') && <>
              <div><label className="block text-xs font-medium mb-1" style={labelStyle}>Label</label>
                <input className={inputClass} style={inputStyle} value={String(modal.data.label || '')} onChange={(e) => setField('label', e.target.value)} /></div>
              <div><label className="block text-xs font-medium mb-1" style={labelStyle}>URL</label>
                <input className={inputClass} style={inputStyle} value={String(modal.data.url || '')} onChange={(e) => setField('url', e.target.value)} /></div>
              <div><label className="block text-xs font-medium mb-1" style={labelStyle}>Category</label>
                <select className={inputClass} style={inputStyle} value={String(modal.data.category || 'company')} onChange={(e) => setField('category', e.target.value)}>
                  {['destinations', 'services', 'company', 'support'].map((c) => <option key={c} value={c}>{c}</option>)}
                </select></div>
              <div><label className="block text-xs font-medium mb-1" style={labelStyle}>Sort Order</label>
                <input type="number" className={inputClass} style={inputStyle} value={Number(modal.data.sort_order ?? 0)} onChange={(e) => setField('sort_order', e.target.value)} /></div>
              <label className="flex items-center gap-2 text-xs cursor-pointer" style={labelStyle}>
                <input type="checkbox" checked={Boolean(modal.data.is_active)} onChange={(e) => setField('is_active', e.target.checked)} />Active
              </label>
            </>}

            {/* Social link fields */}
            {(modal.type === 'social_add' || modal.type === 'social_edit') && <>
              <div><label className="block text-xs font-medium mb-1" style={labelStyle}>Platform</label>
                <select className={inputClass} style={inputStyle} value={String(modal.data.platform || 'other')} onChange={(e) => setField('platform', e.target.value)}>
                  {['facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'tiktok', 'whatsapp', 'other'].map((p) => <option key={p} value={p}>{p}</option>)}
                </select></div>
              <div><label className="block text-xs font-medium mb-1" style={labelStyle}>URL</label>
                <input className={inputClass} style={inputStyle} value={String(modal.data.url || '')} onChange={(e) => setField('url', e.target.value)} /></div>
              <div><label className="block text-xs font-medium mb-1" style={labelStyle}>Sort Order</label>
                <input type="number" className={inputClass} style={inputStyle} value={Number(modal.data.sort_order ?? 0)} onChange={(e) => setField('sort_order', e.target.value)} /></div>
              <label className="flex items-center gap-2 text-xs cursor-pointer" style={labelStyle}>
                <input type="checkbox" checked={Boolean(modal.data.is_active)} onChange={(e) => setField('is_active', e.target.checked)} />Active
              </label>
            </>}

            {/* Legal link fields */}
            {(modal.type === 'legal_add' || modal.type === 'legal_edit') && <>
              <div><label className="block text-xs font-medium mb-1" style={labelStyle}>Label</label>
                <input className={inputClass} style={inputStyle} value={String(modal.data.label || '')} onChange={(e) => setField('label', e.target.value)} /></div>
              <div><label className="block text-xs font-medium mb-1" style={labelStyle}>URL</label>
                <input className={inputClass} style={inputStyle} value={String(modal.data.url || '')} onChange={(e) => setField('url', e.target.value)} /></div>
              <div><label className="block text-xs font-medium mb-1" style={labelStyle}>Sort Order</label>
                <input type="number" className={inputClass} style={inputStyle} value={Number(modal.data.sort_order ?? 0)} onChange={(e) => setField('sort_order', e.target.value)} /></div>
              <label className="flex items-center gap-2 text-xs cursor-pointer" style={labelStyle}>
                <input type="checkbox" checked={Boolean(modal.data.is_active)} onChange={(e) => setField('is_active', e.target.checked)} />Active
              </label>
            </>}

            {/* Footer settings fields */}
            {modal.type === 'footer_settings' && <>
              <div><label className="block text-xs font-medium mb-1" style={labelStyle}>Company Name</label>
                <input className={inputClass} style={inputStyle} value={String(modal.data.company_name || '')} onChange={(e) => setField('company_name', e.target.value)} /></div>
              <div><label className="block text-xs font-medium mb-1" style={labelStyle}>Tagline</label>
                <input className={inputClass} style={inputStyle} value={String(modal.data.tagline || '')} onChange={(e) => setField('tagline', e.target.value)} /></div>
              <div><label className="block text-xs font-medium mb-1" style={labelStyle}>Copyright Text</label>
                <input className={inputClass} style={inputStyle} value={String(modal.data.copyright_text || '')} onChange={(e) => setField('copyright_text', e.target.value)} /></div>
            </>}

            {/* Footer contact fields */}
            {(modal.type === 'footer_contact_add' || modal.type === 'footer_contact_edit') && <>
              <div><label className="block text-xs font-medium mb-1" style={labelStyle}>Icon (emoji or icon name)</label>
                <input className={inputClass} style={inputStyle} value={String(modal.data.icon || '')} onChange={(e) => setField('icon', e.target.value)} /></div>
              <div><label className="block text-xs font-medium mb-1" style={labelStyle}>Text</label>
                <input className={inputClass} style={inputStyle} value={String(modal.data.text || '')} onChange={(e) => setField('text', e.target.value)} /></div>
              <div><label className="block text-xs font-medium mb-1" style={labelStyle}>Sort Order</label>
                <input type="number" className={inputClass} style={inputStyle} value={Number(modal.data.sort_order ?? 0)} onChange={(e) => setField('sort_order', e.target.value)} /></div>
              <label className="flex items-center gap-2 text-xs cursor-pointer" style={labelStyle}>
                <input type="checkbox" checked={Boolean(modal.data.is_active)} onChange={(e) => setField('is_active', e.target.checked)} />Active
              </label>
            </>}

            
          
</div>
        </Modal>
      )}
    </AdminLayout>
  );
}
