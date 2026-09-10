import React, { useState } from 'react';
import {
  AlertTriangle,
  Download,
  FileCode,
  Crown,
  Briefcase,
  Users2,
  Copy,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  Share2
} from 'lucide-react';
import { AppSettings } from '../types';
import { sha256 } from '../utils/helpers';

interface SettingsViewProps {
  settings: AppSettings;
  isAdmin: boolean;
  onSaveSettings: (settings: AppSettings) => void;
  onExportExcel: () => void;
  onSaveHTML: () => void;
  onClearAllData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  isAdmin,
  onSaveSettings,
  onExportExcel,
  onSaveHTML,
  onClearAllData
}) => {
  const [copiedRoleInfo, setCopiedRoleInfo] = useState(false);
  const [activePasswordTab, setActivePasswordTab] = useState<'admin' | 'sponsor' | 'volunteer'>('admin');

  // Input states for password changes
  const [adminP1, setAdminP1] = useState('');
  const [adminP2, setAdminP2] = useState('');
  const [sponsorP1, setSponsorP1] = useState('');
  const [sponsorP2, setSponsorP2] = useState('');
  const [volunteerP1, setVolunteerP1] = useState('');
  const [volunteerP2, setVolunteerP2] = useState('');

  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  if (!isAdmin) {
    return (
      <div className="bg-white border border-stone-200 rounded-xl p-8 text-center text-stone-500 shadow-sm">
        <ShieldCheck className="w-8 h-8 text-amber-600 mx-auto mb-2" />
        <p className="font-semibold text-stone-700">Administrator Login Required</p>
        <p className="text-xs text-stone-500 mt-1">Super User credentials are required to modify festival settings.</p>
      </div>
    );
  }

  const handleUpdateAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminP1.trim()) return alert('Enter a new admin password.');
    if (adminP1 !== adminP2) return alert('Admin passwords do not match.');
    if (adminP1.length < 4) return alert('Password must be at least 4 characters.');

    const hash = await sha256(adminP1.trim());
    onSaveSettings({ ...settings, adminHash: hash });
    setAdminP1('');
    setAdminP2('');
    setFeedbackMessage('✓ Super Admin password updated successfully! Click "Save" in the top bar to sync to cloud.');
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

  const handleUpdateSponsorPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sponsorP1.trim()) return alert('Enter a new sponsor password.');
    if (sponsorP1 !== sponsorP2) return alert('Sponsor passwords do not match.');
    if (sponsorP1.length < 4) return alert('Password must be at least 4 characters.');

    const hash = await sha256(sponsorP1.trim());
    onSaveSettings({ ...settings, sponsorHash: hash });
    setSponsorP1('');
    setSponsorP2('');
    setFeedbackMessage('✓ Sponsor access password updated successfully! Click "Save" in the top bar to sync to cloud.');
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

  const handleUpdateVolunteerPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!volunteerP1.trim()) return alert('Enter a new volunteer team password.');
    if (volunteerP1 !== volunteerP2) return alert('Volunteer passwords do not match.');
    if (volunteerP1.length < 4) return alert('Password must be at least 4 characters.');

    const hash = await sha256(volunteerP1.trim());
    onSaveSettings({ ...settings, volunteerHash: hash });
    setVolunteerP1('');
    setVolunteerP2('');
    setFeedbackMessage('✓ Volunteer team password updated successfully! Click "Save" in the top bar to sync to cloud.');
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

  const copyRoleSharingText = () => {
    const origin = window.location.origin;
    const text = `🙏 *${settings.org || 'Ganeshotsava 2026'} - Portal Access Guide*\n\n` +
      `1️⃣ *Voluntary Devotee Receipts (Residents)*\n` +
      `🔗 Link: ${origin}/ganeshotsava2026/receipts\n` +
      `🔑 Password: None needed! Search flat number or name & download official PDF receipt.\n\n` +
      `2️⃣ *Management Portal (Automatic Role Access)*\n` +
      `🔗 Link: ${origin}/ganeshotsava2026\n` +
      `💡 Simply enter your password on the login screen — the system automatically directs you to your authorized role:\n` +
      `• *Super Admin*: Full access to add, edit, delete, export, and manage settings.\n` +
      `• *Sponsors*: View all data across statements, voluntary contributions, stalls, and expenses.\n` +
      `• *Volunteers Team*: View voluntary contributions, sevas, and expenses (Sponsorship and Stalls tabs are hidden).`;

    navigator.clipboard.writeText(text);
    setCopiedRoleInfo(true);
    setTimeout(() => setCopiedRoleInfo(false), 3000);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Feedback Toast */}
      {feedbackMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl p-3.5 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Organization Settings */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-serif font-bold text-[#1A1A1A] mb-4 pb-2 border-b border-stone-100">
          Organization &amp; Event Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
              Organization Name
            </label>
            <input
              type="text"
              value={settings.org}
              onChange={e => onSaveSettings({ ...settings, org: e.target.value })}
              className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
              Event Location
            </label>
            <input
              type="text"
              value={settings.location}
              onChange={e => onSaveSettings({ ...settings, location: e.target.value })}
              className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
              UPI ID (for Receipts QR)
            </label>
            <input
              type="text"
              placeholder="e.g. society@upi"
              value={settings.upi}
              onChange={e => onSaveSettings({ ...settings, upi: e.target.value })}
              className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
              UPI Payee Name
            </label>
            <input
              type="text"
              value={settings.payee}
              onChange={e => onSaveSettings({ ...settings, payee: e.target.value })}
              className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1 flex items-center justify-between">
              <span>Public Devotee Receipt Portal URL</span>
              <span className="text-[11px] text-emerald-700 font-medium">For WhatsApp groups &amp; noticeboards</span>
            </label>
            <input
              type="text"
              placeholder="Leave blank for default: /receipts"
              value={settings.customReceiptPortalUrl || ''}
              onChange={e => onSaveSettings({ ...settings, customReceiptPortalUrl: e.target.value })}
              className="w-full border border-stone-300 rounded px-3 py-2 text-sm font-mono outline-none focus:border-[#991B1B]"
            />
            <p className="text-[11px] text-stone-500 mt-1">
              Optional custom URL for devotee receipts. If left blank, the system automatically uses the direct website path <code>/receipts</code>.
            </p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1 flex items-center justify-between">
              <span>Public Devotee Seva Booking Portal URL</span>
              <span className="text-[11px] text-amber-700 font-medium">Direct URL for seva offerings</span>
            </label>
            <input
              type="text"
              placeholder="Leave blank for default: /ganeshotsavasevas"
              value={settings.customSevaPortalUrl || ''}
              onChange={e => onSaveSettings({ ...settings, customSevaPortalUrl: e.target.value })}
              className="w-full border border-stone-300 rounded px-3 py-2 text-sm font-mono outline-none focus:border-[#991B1B]"
            />
            <p className="text-[11px] text-stone-500 mt-1">
              Direct website URL for resident devotees to book sevas and offerings. Default: <code>/ganeshotsavasevas</code> (same direct route as receipts <code>/receipts</code>, without any tiny url).
            </p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
              Logo
            </label>
            <label className="border border-dashed border-stone-300 rounded p-4 text-center cursor-pointer hover:border-[#991B1B] block bg-stone-50">
              <input
                type="file"
                accept="image/*"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = evt => {
                      onSaveSettings({ ...settings, logo: evt.target?.result as string });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="hidden"
              />
              {settings.logo ? (
                <img src={settings.logo} alt="Logo" className="max-h-20 mx-auto object-contain mb-2" referrerPolicy="no-referrer" />
              ) : (
                <div className="mb-2">
                  <img src="/lord_ganesha.svg" alt="Default Ganesha Logo" className="w-16 h-16 mx-auto object-contain" referrerPolicy="no-referrer" />
                  <span className="text-[11px] text-amber-700 font-semibold block mt-1">Default deity visual: Lord Sri Ganesha</span>
                </div>
              )}
              <p className="text-xs text-stone-500 font-medium">
                {settings.logo ? 'Click to change custom logo' : 'Click to upload custom event logo (PNG/JPG)'}
              </p>
            </label>
          </div>
        </div>
      </div>

      {/* Role-Based Passwords & Multi-Role Access Control */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-stone-100">
          <div>
            <h2 className="text-lg font-serif font-bold text-[#1A1A1A]">
              Role-Based Access &amp; Passwords
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Configure independent passwords for each role. Only Super Admin can change these passwords.
            </p>
          </div>

          <button
            type="button"
            onClick={copyRoleSharingText}
            className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer border border-stone-300 shadow-2xs"
            title="Copy formatted login guide for sharing on WhatsApp or committee groups"
          >
            {copiedRoleInfo ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-600" />}
            <span>{copiedRoleInfo ? 'Copied Access Guide!' : 'Copy Access Guide'}</span>
          </button>
        </div>

        {/* 3 Role Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Admin Card */}
          <div
            onClick={() => setActivePasswordTab('admin')}
            className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
              activePasswordTab === 'admin'
                ? 'border-[#991B1B] bg-red-50/40 shadow-xs'
                : 'border-stone-200 hover:border-stone-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-600" />
                <span>1. Super Admin</span>
              </span>
              <span className="text-[10px] bg-red-100 text-red-800 font-bold px-1.5 py-0.5 rounded">
                All Access
              </span>
            </div>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              Full control to view, add, modify, and delete data across all modules, plus settings and export.
            </p>
          </div>

          {/* Sponsor Card */}
          <div
            onClick={() => setActivePasswordTab('sponsor')}
            className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
              activePasswordTab === 'sponsor'
                ? 'border-amber-500 bg-amber-50/40 shadow-xs'
                : 'border-stone-200 hover:border-stone-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-amber-700" />
                <span>2. Sponsors</span>
              </span>
              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                Read Only
              </span>
            </div>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              Can view all statements, voluntary contributions, sponsorship, stalls, and expenditures. Cannot modify any records.
            </p>
          </div>

          {/* Volunteer Card */}
          <div
            onClick={() => setActivePasswordTab('volunteer')}
            className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
              activePasswordTab === 'volunteer'
                ? 'border-stone-700 bg-stone-100/60 shadow-xs'
                : 'border-stone-200 hover:border-stone-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <Users2 className="w-4 h-4 text-stone-700" />
                <span>3. Volunteers</span>
              </span>
              <span className="text-[10px] bg-stone-200 text-stone-800 font-bold px-1.5 py-0.5 rounded">
                Restricted View
              </span>
            </div>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              Can view statements, voluntary contributions, and expenses. <strong>Sponsorship and Stalls tabs are hidden</strong>.
            </p>
          </div>
        </div>

        {/* Active Password Update Form */}
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 sm:p-5">
          {activePasswordTab === 'admin' && (
            <form onSubmit={handleUpdateAdminPassword} className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-stone-900">
                  Update Super Admin (Super User) Password
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                    New Super Admin Password
                  </label>
                  <input
                    type="password"
                    value={adminP1}
                    onChange={e => setAdminP1(e.target.value)}
                    placeholder="Enter new admin password"
                    className="w-full bg-white border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={adminP2}
                    onChange={e => setAdminP2(e.target.value)}
                    placeholder="Confirm new admin password"
                    className="w-full bg-white border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="bg-[#991B1B] hover:bg-[#7F1D1D] text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Save Super Admin Password</span>
              </button>
            </form>
          )}

          {activePasswordTab === 'sponsor' && (
            <form onSubmit={handleUpdateSponsorPassword} className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="w-4 h-4 text-amber-700" />
                <h3 className="text-sm font-bold text-stone-900">
                  Update Sponsors Access Password (Read-Only • View All Data)
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                    New Sponsor Password
                  </label>
                  <input
                    type="password"
                    value={sponsorP1}
                    onChange={e => setSponsorP1(e.target.value)}
                    placeholder="e.g. sponsor2026"
                    className="w-full bg-white border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={sponsorP2}
                    onChange={e => setSponsorP2(e.target.value)}
                    placeholder="Confirm new sponsor password"
                    className="w-full bg-white border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-amber-600"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Save Sponsor Password</span>
              </button>
            </form>
          )}

          {activePasswordTab === 'volunteer' && (
            <form onSubmit={handleUpdateVolunteerPassword} className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Users2 className="w-4 h-4 text-stone-700" />
                <h3 className="text-sm font-bold text-stone-900">
                  Update Volunteer Team Password (Restricted View • No Sponsorship / Stalls)
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                    New Volunteer Password
                  </label>
                  <input
                    type="password"
                    value={volunteerP1}
                    onChange={e => setVolunteerP1(e.target.value)}
                    placeholder="e.g. volunteer2026"
                    className="w-full bg-white border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-stone-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={volunteerP2}
                    onChange={e => setVolunteerP2(e.target.value)}
                    placeholder="Confirm new volunteer password"
                    className="w-full bg-white border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-stone-700"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Save Volunteer Password</span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Data Management & Danger Zone */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-serif font-bold text-[#1A1A1A] mb-4 pb-2 border-b border-stone-100">
          Data Synchronization &amp; Backup
        </h2>
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={onExportExcel}
            className="bg-emerald-700 text-white hover:bg-emerald-800 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-2 shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export All Sheets to Excel</span>
          </button>
          <button
            onClick={onSaveHTML}
            className="bg-[#991B1B] text-white hover:bg-[#7F1D1D] text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-2 shadow-sm"
          >
            <FileCode className="w-4 h-4" />
            <span>Download Standalone HTML</span>
          </button>
        </div>

        <div className="border border-red-200 bg-red-50/40 rounded-xl p-4">
          <h3 className="text-sm font-bold text-red-800 mb-1 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span>Danger Zone</span>
          </h3>
          <p className="text-xs text-stone-600 mb-3">
            Permanently wipe all records from your local storage and cloud database. Cannot be undone.
          </p>
          <button
            onClick={() => {
              const ans = prompt('Type DELETE to permanently clear all data:');
              if (ans === 'DELETE') {
                onClearAllData();
              }
            }}
            className="bg-red-600 text-white hover:bg-red-700 text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            Clear All Data
          </button>
        </div>
      </div>
    </div>
  );
};
