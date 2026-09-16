'use client';

import { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faSave } from '@fortawesome/free-solid-svg-icons';
import { createBrowserClient } from '@/lib/supabase/client';
import { useTheme } from '@/context/ThemeContext';
import AdminLayout from '@/components/AdminLayout';
import UrlWithPicker from '@/components/admin/UrlWithPicker';

const BRAND_COLORS = { tropicalTeal: '#139EA2', sandyOrange: '#E6A64D' };

interface SiteSettings {
  id: string;
  logo_url: string;
  favicon_url: string;
  login_background_url: string;
  login_headline: string;
  login_description: string;
  register_background_url: string;
  register_headline: string;
  register_description: string;
}

export default function SettingsAdminPage() {
  const { isDimMode } = useTheme();
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [settingsForm, setSettingsForm] = useState<Partial<SiteSettings>>({});
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const supabase = createBrowserClient();
    const ss = await supabase.from('site_settings').select('*').limit(1).maybeSingle();
    if (ss.data) {
      setSiteSettings(ss.data as SiteSettings);
      setSettingsForm(ss.data as SiteSettings);
    }
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

  async function saveSiteSettings() {
    if (!siteSettings) return;
    setSavingSettings(true);
    const supabase = createBrowserClient();
    await supabase.from('site_settings').update({
      logo_url: settingsForm.logo_url ?? '',
      favicon_url: settingsForm.favicon_url ?? '',
      login_background_url: settingsForm.login_background_url ?? '',
      login_headline: settingsForm.login_headline ?? '',
      login_description: settingsForm.login_description ?? '',
      register_background_url: settingsForm.register_background_url ?? '',
      register_headline: settingsForm.register_headline ?? '',
      register_description: settingsForm.register_description ?? '',
    }).eq('id', siteSettings.id);
    setSavingSettings(false);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  }

  const setField = (key: keyof SiteSettings, value: string) =>
    setSettingsForm((f) => ({ ...f, [key]: value }));

  if (loading) {
    return (
      <AdminLayout title="Settings" subtitle="Site configuration">
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: BRAND_COLORS.tropicalTeal, borderTopColor: 'transparent' }} />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Settings" subtitle="Site configuration">
      <div className="rounded-xl p-6 space-y-5" style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}>
        {!siteSettings ? (
          <p className="text-sm" style={{ color: themeStyles.textMuted }}>No site settings row found.</p>
        ) : (
          <>
            <h2 className="text-sm font-semibold" style={{ color: themeStyles.textPrimary }}>Branding</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium mb-1" style={labelStyle}>Logo URL</label>
                <UrlWithPicker inputStyle={inputStyle} value={settingsForm.logo_url ?? ''} onChange={v => setField('logo_url', v)} /></div>
              <div><label className="block text-xs font-medium mb-1" style={labelStyle}>Favicon URL</label>
                <UrlWithPicker inputStyle={inputStyle} value={settingsForm.favicon_url ?? ''} onChange={v => setField('favicon_url', v)} /></div>
            </div>

            <h2 className="text-sm font-semibold pt-2" style={{ color: themeStyles.textPrimary }}>Login Page</h2>
            <div className="space-y-3">
              <div><label className="block text-xs font-medium mb-1" style={labelStyle}>Background URL</label>
                <UrlWithPicker inputStyle={inputStyle} value={settingsForm.login_background_url ?? ''} onChange={v => setField('login_background_url', v)} /></div>
              <div><label className="block text-xs font-medium mb-1" style={labelStyle}>Headline</label>
                <input className={inputClass} style={inputStyle} value={settingsForm.login_headline ?? ''} onChange={(e) => setField('login_headline', e.target.value)} /></div>
              <div><label className="block text-xs font-medium mb-1" style={labelStyle}>Description</label>
                <textarea className={inputClass} style={inputStyle} rows={2} value={settingsForm.login_description ?? ''} onChange={(e) => setField('login_description', e.target.value)} /></div>
            </div>

            <h2 className="text-sm font-semibold pt-2" style={{ color: themeStyles.textPrimary }}>Register Page</h2>
            <div className="space-y-3">
              <div><label className="block text-xs font-medium mb-1" style={labelStyle}>Background URL</label>
                <UrlWithPicker inputStyle={inputStyle} value={settingsForm.register_background_url ?? ''} onChange={v => setField('register_background_url', v)} /></div>
              <div><label className="block text-xs font-medium mb-1" style={labelStyle}>Headline</label>
                <input className={inputClass} style={inputStyle} value={settingsForm.register_headline ?? ''} onChange={(e) => setField('register_headline', e.target.value)} /></div>
              <div><label className="block text-xs font-medium mb-1" style={labelStyle}>Description</label>
                <textarea className={inputClass} style={inputStyle} rows={2} value={settingsForm.register_description ?? ''} onChange={(e) => setField('register_description', e.target.value)} /></div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button onClick={saveSiteSettings} disabled={savingSettings}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium disabled:opacity-50"
                style={{ background: BRAND_COLORS.tropicalTeal, color: 'white' }}>
                {savingSettings ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : <FontAwesomeIcon icon={faSave} />}
                Save Settings
              </button>
              {settingsSaved && <span className="text-xs" style={{ color: '#10B981' }}>Saved successfully</span>}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
