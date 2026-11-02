import React, { useState, useEffect } from 'react';
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
  Share2,
  Users,
  Sparkles,
  Sliders
} from 'lucide-react';
import { AppSettings } from '../types';
import { sha256 } from '../utils/helpers';
import { RegisteredUsersManagement } from './RegisteredUsersManagement';

interface SettingsViewProps {
  settings: AppSettings;
  isAdmin: boolean;
  onSaveSettings: (settings: AppSettings) => void;
  onExportExcel: () => void;
  onSaveHTML: () => void;
  onClearAllData: () => void;
  onOpenAdminManagement?: () => void;
  defaultSubTab?: 'general' | 'users';
  currentAdminEmail?: string;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  isAdmin,
  onSaveSettings,
  onExportExcel,
  onSaveHTML,
  onClearAllData,
  onOpenAdminManagement,
  defaultSubTab = 'general',
  currentAdminEmail
}) => {
  const [activeSettingsTab, setActiveSettingsTab] = useState<'general' | 'users'>(defaultSubTab);

  useEffect(() => {
    if (defaultSubTab) {
      setActiveSettingsTab(defaultSubTab);
    }
  }, [defaultSubTab]);

  const [copiedRoleInfo, setCopiedRoleInfo] = useState(false);
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

  const copyRoleSharingText = () => {
    const origin = window.location.origin;
    const text = `🙏 *${settings.org || 'Ganeshotsava 2026'} - Portal Access Guide*\n\n` +
      `1️⃣ *Voluntary Devotee Receipts (Residents)*\n` +
      `🔗 Link: ${origin}/ganeshotsava2026/receipts\n` +
      `🔑 Password: Passwordless! Search flat number or name & download official PDF receipt.\n\n` +
      `2️⃣ *Management Portal (Passwordless Email Sign-In)*\n` +
      `🔗 Link: ${origin}/ganeshotsava2026\n` +
      `💡 Simply enter your registered email address on the sign-in screen to receive a verification magic link and 6-digit code:\n` +
      `• *Super Admin*: Full access to add, edit, delete, export, and manage settings (desaisachin95@gmail.com).\n` +
      `• *Sponsors & Members*: View all data across statements, voluntary contributions, stalls, and expenses.\n` +
      `• *Devotees / Viewers*: View voluntary contributions, sevas, and high-level financial summary statements.`;

    navigator.clipboard.writeText(text);
    setCopiedRoleInfo(true);
    setTimeout(() => setCopiedRoleInfo(false), 3000);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Sub-Navigation Tabs inside Settings: General Settings vs Registered Users */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveSettingsTab('general')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all inline-flex items-center gap-2 cursor-pointer shadow-xs ${
            activeSettingsTab === 'general'
              ? 'bg-[#991B1B] text-white shadow-xs'
              : 'bg-white border border-stone-200 hover:bg-stone-50 text-stone-700'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>General &amp; Event Settings</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSettingsTab('users')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all inline-flex items-center gap-2 cursor-pointer shadow-xs ${
            activeSettingsTab === 'users'
              ? 'bg-[#991B1B] text-white shadow-xs'
              : 'bg-white border border-stone-200 hover:bg-stone-50 text-stone-700'
          }`}
        >
          <Users className="w-4 h-4 text-amber-500" />
          <span>Registered Users &amp; Roles</span>
        </button>
      </div>

      {activeSettingsTab === 'users' ? (
        <RegisteredUsersManagement
          settings={settings}
          onSaveSettings={onSaveSettings}
          currentAdminEmail={currentAdminEmail}
        />
      ) : (
        <>
          {/* Feedback Toast */}
          {feedbackMessage && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl p-3.5 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200 shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{feedbackMessage}</span>
            </div>
          )}

          {/* Devotees & Roles Management Card */}
          <div className="bg-white border-2 border-amber-400 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-red-100 text-[#991B1B]">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <h2 className="text-base font-serif font-bold text-[#1A1A1A]">
                  Registered Devotee Roles &amp; Permissions
                </h2>
              </div>
              <p className="text-xs text-stone-600 mt-1">
                Global Admin: <span className="font-mono font-bold text-stone-900">desaisachin95@gmail.com</span>. Manage registered devotee accounts, photos, and grant <strong>Admin</strong> (all rights), <strong>Member</strong> (read-only complete data), or <strong>Viewer</strong> (limited statement &amp; payments).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveSettingsTab('users')}
              className="bg-[#991B1B] hover:bg-[#7F1D1D] text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-xs transition-colors inline-flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Users className="w-4 h-4 text-amber-300" />
              <span>Open Registered Users Tab</span>
            </button>
          </div>

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

      {/* Passwordless Email Access & Role Permissions Control */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-stone-100">
          <div>
            <h2 className="text-lg font-serif font-bold text-[#1A1A1A]">
              Passwordless Email Access &amp; Permissions
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              All sign-ins use passwordless email magic link verification. Manage approved members and roles in the Registered Users tab.
            </p>
          </div>

          <button
            type="button"
            onClick={copyRoleSharingText}
            className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer border border-stone-300 shadow-2xs"
            title="Copy formatted access guide for sharing on WhatsApp or committee groups"
          >
            {copiedRoleInfo ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-600" />}
            <span>{copiedRoleInfo ? 'Copied Access Guide!' : 'Copy Access Guide'}</span>
          </button>
        </div>

        {/* 3 Role Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Admin Card */}
          <div className="p-3.5 rounded-xl border-2 border-[#991B1B] bg-red-50/40 shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-600" />
                <span>1. Super Admin</span>
              </span>
              <span className="text-[10px] bg-red-100 text-red-800 font-bold px-1.5 py-0.5 rounded">
                desaisachin95@gmail.com
              </span>
            </div>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              Full control to view, add, modify, and delete data across all modules, plus settings, export, and user management.
            </p>
          </div>

          {/* Member/Sponsor Card */}
          <div className="p-3.5 rounded-xl border-2 border-amber-500 bg-amber-50/40 shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-amber-700" />
                <span>2. Members / Committee</span>
              </span>
              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                Read Only Complete Data
              </span>
            </div>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              Can view all statements, voluntary contributions, sponsorship, stalls, and expenditures via verified email link.
            </p>
          </div>

          {/* Devotee Card */}
          <div className="p-3.5 rounded-xl border-2 border-stone-300 bg-stone-50 shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <Users2 className="w-4 h-4 text-stone-700" />
                <span>3. Devotees / Residents</span>
              </span>
              <span className="text-[10px] bg-stone-200 text-stone-800 font-bold px-1.5 py-0.5 rounded">
                Devotee Access
              </span>
            </div>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              Can view financial summary statements, voluntary contribution receipts, and book sevas.
            </p>
          </div>
        </div>

        <div className="bg-amber-50/80 border border-amber-300 rounded-xl p-4 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-amber-950">Manage Registered Devotees &amp; Approved Roles</h4>
            <p className="text-[11px] text-amber-800">
              To add or update member emails and permissions, switch to the <strong>Registered Users Management</strong> tab above.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveSettingsTab('users')}
            className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs rounded-lg transition-colors cursor-pointer shrink-0 shadow-2xs"
          >
            Open User Management
          </button>
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
        </>
      )}
    </div>
  );
};
