'use client';

import { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faPen, faTrash, faSpinner, faChevronDown, faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import { createBrowserClient } from '@/lib/supabase/client';
import { useTheme } from '@/context/ThemeContext';
import AdminLayout from '@/components/AdminLayout';

const BRAND_COLORS = { tropicalTeal: '#139EA2', sandyOrange: '#E6A64D' };

type Tab = 'navbar' | 'footer_links' | 'footer_info';

interface NavMenu { id: string; label: string; url: string; sort_order: number; is_active: boolean; has_dropdown: boolean; }
interface NavDropdown { id: string; parent_menu_id: string; label: string; url: string; sort_order: number; is_active: boolean; }
interface FooterQuickLink { id: string; label: string; url: string; category: string; sort_order: number; is_active: boolean; }
interface SocialLink { id: string; platform: string; url: string; sort_order: number; is_active: boolean; }
interface LegalLink { id: string; label: string; url: string; sort_order: number; is_active: boolean; }
interface FooterSettings { id: string; company_name: string; tagline: string; copyright_text: string; }
interface FooterContact { id: string; icon: string; text: string; sort_order: number; is_active: boolean; }

const toSlug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export default function NavigationPage() {
  const { isDimMode } = useTheme();
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
    cardBg: isDimMode ? '#1A1A1A' : '#FFFFFF',
    textPrimary: isDimMode ? '#FFFFFF' : '#111827',
    textSecondary: isDimMode ? '#B0B0B0' : '#4B5563',
    textMuted: isDimMode ? '#6B7280' : '#9CA3AF',
    border: isDimMode ? 'rgba(255,255,255,0.05)' : '#E5E7EB',
    inputBg: isDimMode ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
    inputBorder: isDimMode ? 'rgba(255,255,255,0.1)' : '#E5E7EB',
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
      if (data.id) await supabase.from('navbar_menus').update(row).eq('id', String(data.id));
      else await supabase.from('navbar_menus').insert(row);
    } else if (type === 'dropdown_edit' || type === 'dropdown_add') {
      const row = { parent_menu_id: s(data.parent_menu_id), label: s(data.label), url: s(data.url), sort_order: Number(data.sort_order) || 0, is_active: b(data.is_active) };
      if (data.id) await supabase.from('navbar_dropdowns').update(row).eq('id', String(data.id));
      else await supabase.from('navbar_dropdowns').insert(row);
    } else if (type === 'footer_link_edit' || type === 'footer_link_add') {
      const row = { label: s(data.label), url: s(data.url), category: (s(data.category) || 'company') as 'destinations' | 'services' | 'company' | 'support', sort_order: Number(data.sort_order) || 0, is_active: b(data.is_active) };
      if (data.id) await supabase.from('footer_quick_links').update(row).eq('id', String(data.id));
      else await supabase.from('footer_quick_links').insert(row);
    } else if (type === 'social_edit' || type === 'social_add') {
      const row = { platform: (s(data.platform) || 'other') as 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'youtube' | 'tiktok' | 'whatsapp' | 'other', url: s(data.url), sort_order: Number(data.sort_order) || 0, is_active: b(data.is_active) };
      if (data.id) await supabase.from('social_links').update(row).eq('id', String(data.id));
      else await supabase.from('social_links').insert(row);
    } else if (type === 'legal_edit' || type === 'legal_add') {
      const row = { label: s(data.label), url: s(data.url), sort_order: Number(data.sort_order) || 0, is_active: b(data.is_active) };
      if (data.id) await supabase.from('legal_links').update(row).eq('id', String(data.id));
      else await supabase.from('legal_links').insert(row);
    } else if (type === 'footer_settings') {
      if (data.id) await supabase.from('footer_settings').update({ company_name: s(data.company_name), tagline: s(data.tagline), copyright_text: s(data.copyright_text) }).eq('id', String(data.id));
    } else if (type === 'footer_contact_edit' || type === 'footer_contact_add') {
      const row = { icon: s(data.icon), text: s(data.text), sort_order: Number(data.sort_order) || 0, is_active: b(data.is_active) };
      if (data.id) await supabase.from('footer_contacts').update(row).eq('id', String(data.id));
      else await supabase.from('footer_contacts').insert(row);
    }

    await fetchAll();
    setSaving(false);
    setModal(null);
  }

  async function del(table: 'navbar_menus' | 'navbar_dropdowns' | 'footer_quick_links' | 'social_links' | 'legal_links' | 'footer_contacts', id: string) {
    if (!window.confirm('Delete this item?')) return;
    const supabase = createBrowserClient();
    await supabase.from(table).delete().eq('id', id);
    fetchAll();
  }

  const setField = (key: string, value: unknown) =>
    setModal((m) => m ? { ...m, data: { ...m.data, [key]: value } } : m);

  const BtnRow = ({ table, row, onEdit }: { table: 'navbar_menus' | 'navbar_dropdowns' | 'footer_quick_links' | 'social_links' | 'legal_links' | 'footer_contacts'; row: { id: string }; onEdit: () => void }) => (
    <div className="flex gap-1">
      <button onClick={onEdit} className="px-2 py-1 rounded text-xs" style={{ background: `${BRAND_COLORS.tropicalTeal}22`, color: BRAND_COLORS.tropicalTeal }}>
        <FontAwesomeIcon icon={faPen} className="w-3 h-3" />
      </button>
      <button onClick={() => del(table, row.id)} className="px-2 py-1 rounded text-xs" style={{ background: '#EF444422', color: '#EF4444' }}>
        <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
      </button>
    </div>
  );

  const Badge = ({ active }: { active: boolean }) => (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: active ? '#10B98122' : '#EF444422', color: active ? '#10B981' : '#EF4444' }}>
      {active ? 'Active' : 'Inactive'}
    </span>
  );

  const TABS: { key: Tab; label: string }[] = [
    { key: 'navbar', label: 'Navbar Menus' },
    { key: 'footer_links', label: 'Footer Links' },
    { key: 'footer_info', label: 'Footer Info' },
  ];

  if (loading) {
    return (
      <AdminLayout title="Navigation" subtitle="Manage navbar and footer content">
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: BRAND_COLORS.tropicalTeal, borderTopColor: 'transparent' }} />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Navigation" subtitle="Manage navbar and footer content">
      {/* Tab bar */}
      <div className="flex gap-1 mb-6 rounded-xl p-1" style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-4 py-2 rounded-lg text-xs font-medium transition flex-1"
            style={{ background: tab === t.key ? BRAND_COLORS.tropicalTeal : 'transparent', color: tab === t.key ? '#fff' : themeStyles.textSecondary }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Navbar Menus tab */}
      {tab === 'navbar' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold" style={{ color: themeStyles.textPrimary }}>Navbar Menus ({menus.length})</h2>
            <button onClick={() => setModal({ type: 'menu_add', data: { label: '', url: '', sort_order: 0, is_active: true } })}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: BRAND_COLORS.tropicalTeal, color: 'white' }}>
              <FontAwesomeIcon icon={faPlus} className="w-3 h-3" /> Add Menu
            </button>
          </div>

          <div className="rounded-xl overflow-hidden" style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}>
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
                  <div className="pl-8" style={{ background: isDimMode ? 'rgba(255,255,255,0.02)' : '#F9FAFB' }}>
                    <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: themeStyles.border }}>
                      <p className="text-xs font-medium" style={{ color: themeStyles.textMuted }}>Dropdown items</p>
                      <button onClick={() => setModal({ type: 'dropdown_add', data: { parent_menu_id: menu.id, label: '', url: '', sort_order: 0, is_active: true } })}
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs"
                        style={{ background: `${BRAND_COLORS.tropicalTeal}22`, color: BRAND_COLORS.tropicalTeal }}>
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
              <button onClick={() => setModal({ type: 'footer_link_add', data: { label: '', url: '', category: 'company', sort_order: 0, is_active: true } })}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: BRAND_COLORS.tropicalTeal, color: 'white' }}>
                <FontAwesomeIcon icon={faPlus} className="w-3 h-3" /> Add Link
              </button>
            </div>
            <div className="rounded-xl overflow-hidden" style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}>
              <table className="w-full text-xs">
                <thead><tr style={{ borderBottom: `1px solid ${themeStyles.border}` }}>
                  {['Title', 'URL', 'Category', 'Order', 'Status', ''].map((h) => (
                    <th key={h} className="px-4 py-2 text-left font-medium" style={{ color: themeStyles.textMuted }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {footerLinks.map((link) => (
                    <tr key={link.id} style={{ borderBottom: `1px solid ${themeStyles.border}` }}>
                      <td className="px-4 py-2 font-medium" style={{ color: themeStyles.textPrimary }}>{link.label}</td>
                      <td className="px-4 py-2" style={{ color: themeStyles.textSecondary }}>{link.url}</td>
                      <td className="px-4 py-2"><span className="px-2 py-0.5 rounded-full text-[10px]" style={{ background: `${BRAND_COLORS.tropicalTeal}22`, color: BRAND_COLORS.tropicalTeal }}>{link.category}</span></td>
                      <td className="px-4 py-2" style={{ color: themeStyles.textMuted }}>{link.sort_order}</td>
                      <td className="px-4 py-2"><Badge active={link.is_active} /></td>
                      <td className="px-4 py-2"><BtnRow table="footer_quick_links" row={link} onEdit={() => setModal({ type: 'footer_link_edit', data: { ...link } })} /></td>
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
              <button onClick={() => setModal({ type: 'social_add', data: { platform: 'facebook', url: '', sort_order: 0, is_active: true } })}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: BRAND_COLORS.tropicalTeal, color: 'white' }}>
                <FontAwesomeIcon icon={faPlus} className="w-3 h-3" /> Add Social
              </button>
            </div>
            <div className="rounded-xl overflow-hidden" style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}>
              <table className="w-full text-xs">
                <thead><tr style={{ borderBottom: `1px solid ${themeStyles.border}` }}>
                  {['Platform', 'URL', 'Order', 'Status', ''].map((h) => (
                    <th key={h} className="px-4 py-2 text-left font-medium" style={{ color: themeStyles.textMuted }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {socialLinks.map((link) => (
                    <tr key={link.id} style={{ borderBottom: `1px solid ${themeStyles.border}` }}>
                      <td className="px-4 py-2 font-medium capitalize" style={{ color: themeStyles.textPrimary }}>{link.platform}</td>
                      <td className="px-4 py-2 max-w-xs truncate" style={{ color: themeStyles.textSecondary }}>{link.url}</td>
                      <td className="px-4 py-2" style={{ color: themeStyles.textMuted }}>{link.sort_order}</td>
                      <td className="px-4 py-2"><Badge active={link.is_active} /></td>
                      <td className="px-4 py-2"><BtnRow table="social_links" row={link} onEdit={() => setModal({ type: 'social_edit', data: { ...link } })} /></td>
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
              <button onClick={() => setModal({ type: 'legal_add', data: { label: '', url: '', sort_order: 0, is_active: true } })}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: BRAND_COLORS.tropicalTeal, color: 'white' }}>
                <FontAwesomeIcon icon={faPlus} className="w-3 h-3" /> Add Legal Link
              </button>
            </div>
            <div className="rounded-xl overflow-hidden" style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}>
              <table className="w-full text-xs">
                <thead><tr style={{ borderBottom: `1px solid ${themeStyles.border}` }}>
                  {['Title', 'URL', 'Order', 'Status', ''].map((h) => (
                    <th key={h} className="px-4 py-2 text-left font-medium" style={{ color: themeStyles.textMuted }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {legalLinks.map((link) => (
                    <tr key={link.id} style={{ borderBottom: `1px solid ${themeStyles.border}` }}>
                      <td className="px-4 py-2 font-medium" style={{ color: themeStyles.textPrimary }}>{link.label}</td>
                      <td className="px-4 py-2" style={{ color: themeStyles.textSecondary }}>{link.url}</td>
                      <td className="px-4 py-2" style={{ color: themeStyles.textMuted }}>{link.sort_order}</td>
                      <td className="px-4 py-2"><Badge active={link.is_active} /></td>
                      <td className="px-4 py-2"><BtnRow table="legal_links" row={link} onEdit={() => setModal({ type: 'legal_edit', data: { ...link } })} /></td>
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
            <div className="rounded-xl p-5" style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-semibold" style={{ color: themeStyles.textPrimary }}>Footer Settings</h2>
                <button onClick={() => setModal({ type: 'footer_settings', data: { ...footerSettings } })}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{ background: `${BRAND_COLORS.tropicalTeal}22`, color: BRAND_COLORS.tropicalTeal }}>
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
              <button onClick={() => setModal({ type: 'footer_contact_add', data: { icon: '', text: '', sort_order: 0, is_active: true } })}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: BRAND_COLORS.tropicalTeal, color: 'white' }}>
                <FontAwesomeIcon icon={faPlus} className="w-3 h-3" /> Add Contact
              </button>
            </div>
            <div className="rounded-xl overflow-hidden" style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}>
              <table className="w-full text-xs">
                <thead><tr style={{ borderBottom: `1px solid ${themeStyles.border}` }}>
                  {['Icon', 'Text', 'Order', 'Status', ''].map((h) => (
                    <th key={h} className="px-4 py-2 text-left font-medium" style={{ color: themeStyles.textMuted }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {footerContacts.map((c) => (
                    <tr key={c.id} style={{ borderBottom: `1px solid ${themeStyles.border}` }}>
                      <td className="px-4 py-2 font-medium" style={{ color: themeStyles.textPrimary }}>{c.icon}</td>
                      <td className="px-4 py-2" style={{ color: themeStyles.textSecondary }}>{c.text}</td>
                      <td className="px-4 py-2" style={{ color: themeStyles.textMuted }}>{c.sort_order}</td>
                      <td className="px-4 py-2"><Badge active={c.is_active} /></td>
                      <td className="px-4 py-2"><BtnRow table="footer_contacts" row={c} onEdit={() => setModal({ type: 'footer_contact_edit', data: { ...c } })} /></td>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setModal(null)}>
          <div className="w-full max-w-md rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto" style={{ background: themeStyles.cardBg }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold" style={{ color: themeStyles.textPrimary }}>
              {modal.type.includes('add') ? 'Add' : 'Edit'}{' '}
              {modal.type.includes('menu') ? 'Menu' : modal.type.includes('dropdown') ? 'Dropdown Item' :
               modal.type.includes('footer_link') ? 'Footer Link' : modal.type.includes('social') ? 'Social Link' :
               modal.type.includes('legal') ? 'Legal Link' : modal.type.includes('footer_settings') ? 'Footer Settings' : 'Footer Contact'}
            </h3>

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

            <div className="flex gap-2 pt-2">
              <button onClick={saveModal} disabled={saving}
                className="flex-1 py-2 rounded-lg text-xs font-medium disabled:opacity-50"
                style={{ background: BRAND_COLORS.tropicalTeal, color: 'white' }}>
                {saving ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : 'Save'}
              </button>
              <button onClick={() => setModal(null)} className="flex-1 py-2 rounded-lg text-xs font-medium" style={{ background: themeStyles.border, color: themeStyles.textSecondary }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
