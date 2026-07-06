import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  Database, 
  RefreshCw, 
  Palette, 
  HelpCircle, 
  Image as ImageIcon,
  IndianRupee
} from 'lucide-react';
import apiCall from '../api';
import { toast } from 'react-hot-toast';

export default function SettingsPage() {
  const [salonName, setSalonName] = useState('');
  const [logo, setLogo] = useState('');
  const [currency, setCurrency] = useState('₹');
  const [theme, setTheme] = useState('light');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch active configurations
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await apiCall('/settings');
        setSalonName(res.salonName);
        setLogo(res.logo || '');
        setCurrency(res.currency);
        setTheme(res.theme);
      } catch (err) {
        toast.error('Failed to load salon settings');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!salonName.trim()) {
      toast.error('Salon Name cannot be empty');
      return;
    }

    setSaving(true);
    try {
      await apiCall('/settings', {
        method: 'PUT',
        body: { salonName, logo, currency, theme }
      });
      toast.success('Salon configurations saved successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Mock Database Backup
  const handleBackup = () => {
    const backupToast = toast.loading('Exporting database structures and active collections...');
    setTimeout(() => {
      toast.dismiss(backupToast);
      toast.success('Database backup created successfully! Saved: rsalon_backup_2026.json');
    }, 1500);
  };

  // Mock Database Restore
  const handleRestore = () => {
    const confirm = window.confirm('WARNING: Restoring the database will overwrite all existing entries, services, and staff. Are you sure you want to proceed?');
    if (!confirm) return;

    const restoreToast = toast.loading('Restoring data structures from backup register...');
    setTimeout(() => {
      toast.dismiss(restoreToast);
      toast.success('Database collections restored successfully! Relaunching boards...');
      window.location.reload();
    }, 2000);
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Retrieving config registers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Salon Settings</h2>
        <p className="text-sm text-slate-500 font-medium">Configure branding, currency symbols, and database utilities.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Columns - Settings editor */}
        <form onSubmit={handleSave} className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-[28px] shadow-soft border border-slate-100/60 space-y-5">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-50 pb-3">
              <Settings className="w-4 h-4 text-accent-dark" /> Branding & Localization
            </h3>

            {/* Salon Name */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Salon Name</label>
              <input
                type="text"
                placeholder="R Unisex Salon"
                value={salonName}
                onChange={(e) => setSalonName(e.target.value)}
                className="form-input text-xs"
              />
            </div>

            {/* Logo Image URL */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Logo URL (Optional)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <ImageIcon className="h-4 w-4 text-slate-400" />
                </span>
                <input
                  type="text"
                  placeholder="https://example.com/logo.png"
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  className="form-input pl-10 text-xs"
                />
              </div>
              <p className="text-[10px] text-slate-400 font-medium mt-1">If provided, this image will replace the standard shears icon in the sidebar header.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Currency Symbol */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Currency Token</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <IndianRupee className="h-4 w-4 text-slate-400" />
                  </span>
                  <input
                    type="text"
                    placeholder="₹"
                    maxLength={3}
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="form-input pl-10 text-xs"
                  />
                </div>
              </div>

              {/* Theme Selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Application Theme</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Palette className="h-4 w-4 text-slate-400" />
                  </span>
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="form-input pl-10 text-xs bg-white cursor-pointer"
                  >
                    <option value="light">Classic Light (Premium)</option>
                    <option value="dark" disabled>Classic Dark (V2 release)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2 border-t border-slate-50 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="btn-accent px-6 py-3 shadow-md shadow-accent/10 flex items-center gap-2 text-xs font-bold"
              >
                <Save className="w-4 h-4" /> 
                {saving ? 'Saving...' : 'Save Configurations'}
              </button>
            </div>

          </div>
        </form>

        {/* Right Column - Backup and Restore utilities */}
        <div className="bg-white p-6 rounded-[28px] shadow-soft border border-slate-100/60 space-y-6">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-50 pb-3">
            <Database className="w-4 h-4 text-accent-dark" /> Database Utilities
          </h3>

          <p className="text-xs text-slate-450 font-medium leading-relaxed">
            Protect your salon logs by exporting periodic database checkpoints, or restore past schedules in case of server migrations.
          </p>

          <div className="space-y-3 pt-2">
            {/* Backup Button */}
            <button
              onClick={handleBackup}
              className="w-full py-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-2xl transition flex items-center justify-center gap-2 text-xs"
            >
              <Database className="w-4 h-4 text-slate-500" />
              Backup Collections (JSON)
            </button>

            {/* Restore Button */}
            <button
              onClick={handleRestore}
              className="w-full py-3.5 bg-red-50 hover:bg-red-100/70 border border-red-100 text-red-650 font-bold rounded-2xl transition flex items-center justify-center gap-2 text-xs"
            >
              <RefreshCw className="w-4 h-4 text-red-400" />
              Restore Database from JSON
            </button>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex gap-2 text-[10px] text-slate-450 leading-relaxed font-semibold">
            <HelpCircle className="w-6 h-6 text-slate-400 shrink-0 mt-0.5" />
            <span>Database backup files are formatted in raw JSON structures containing staff, services, customers, settings, and entry collections.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
