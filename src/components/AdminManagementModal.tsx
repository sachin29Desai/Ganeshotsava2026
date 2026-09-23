import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserCheck,
  UserX,
  Mail,
  Search,
  Plus,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Users,
  Building,
  Phone,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { AppSettings, UserProfile, UserRole } from '../types';
import { cloudGetAllUserProfiles, cloudUpdateUserRole, cloudSaveSettings } from '../lib/firebase';

interface AdminManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  currentAdminEmail?: string;
}

const PRIMARY_ADMIN_EMAILS = [
  'desaisachin95@gmail.com',
  'kannadigara.balaga.eldorado@gmail.com'
];

export const AdminManagementModal: React.FC<AdminManagementModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  currentAdminEmail
}) => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'registered' | 'emails'>('registered');

  // Compute effective list of admin emails
  const getAdminEmailList = (): string[] => {
    const set = new Set<string>(PRIMARY_ADMIN_EMAILS);
    if (settings.adminEmails && Array.isArray(settings.adminEmails)) {
      settings.adminEmails.forEach(e => set.add(e.toLowerCase().trim()));
    }
    try {
      const saved = localStorage.getItem('ekb_allowed_emails');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach(e => set.add(e.toLowerCase().trim()));
        }
      }
    } catch {}
    return Array.from(set);
  };

  const [adminEmails, setAdminEmails] = useState<string[]>(getAdminEmailList());

  // Load all user profiles on open
  const loadProfiles = async () => {
    setLoading(true);
    try {
      const allProfiles = await cloudGetAllUserProfiles();
      // Sort alphabetically by name
      allProfiles.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setProfiles(allProfiles);
    } catch (err) {
      console.error('Error fetching registered profiles:', err);
      setFeedback({ type: 'error', text: 'Could not load registered devotee profiles from Firestore.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setAdminEmails(getAdminEmailList());
      loadProfiles();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Persist admin emails in settings & localStorage & Firestore
  const persistAdminEmails = async (updatedList: string[]) => {
    setAdminEmails(updatedList);
    try {
      localStorage.setItem('ekb_allowed_emails', JSON.stringify(updatedList));
    } catch {}
    const newSettings: AppSettings = {
      ...settings,
      adminEmails: updatedList
    };
    onSaveSettings(newSettings);
    await cloudSaveSettings(newSettings);
  };

  // Add new email to admin list
  const handleAddAdminEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const cleanEmail = newAdminEmail.toLowerCase().trim();

    if (!cleanEmail) {
      setFeedback({ type: 'error', text: 'Please enter an email address.' });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setFeedback({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    if (adminEmails.includes(cleanEmail)) {
      setFeedback({ type: 'error', text: `${cleanEmail} already has Admin privileges.` });
      return;
    }

    const updated = [...adminEmails, cleanEmail];
    await persistAdminEmails(updated);

    // If profile already exists, update their profile role to 'admin'
    const existing = profiles.find(p => p.email.toLowerCase() === cleanEmail);
    if (existing) {
      try {
        await cloudUpdateUserRole(cleanEmail, 'admin');
        setProfiles(prev =>
          prev.map(p => (p.email.toLowerCase() === cleanEmail ? { ...p, role: 'admin' } : p))
        );
      } catch (err) {
        console.error('Error updating profile role:', err);
      }
    }

    setNewAdminEmail('');
    setFeedback({
      type: 'success',
      text: `✓ Admin rights successfully granted to ${cleanEmail}! They will have full access upon login.`
    });
  };

  // Toggle user admin role from registered profiles
  const handleToggleUserAdmin = async (profile: UserProfile) => {
    setFeedback(null);
    const cleanEmail = profile.email.toLowerCase().trim();
    const isCurrentlyAdmin = adminEmails.includes(cleanEmail) || profile.role === 'admin';

    if (PRIMARY_ADMIN_EMAILS.includes(cleanEmail)) {
      setFeedback({
        type: 'error',
        text: 'This is the primary festival administrator account and cannot be demoted.'
      });
      return;
    }

    if (isCurrentlyAdmin) {
      // Demote to resident
      const updatedList = adminEmails.filter(e => e !== cleanEmail);
      await persistAdminEmails(updatedList);
      try {
        await cloudUpdateUserRole(cleanEmail, 'resident');
        setProfiles(prev =>
          prev.map(p => (p.email.toLowerCase() === cleanEmail ? { ...p, role: 'resident' } : p))
        );
      } catch (err) {
        console.error('Error demoting user role:', err);
      }
      setFeedback({
        type: 'success',
        text: `Admin rights removed for ${profile.name} (${cleanEmail}). They now have resident read-only access.`
      });
    } else {
      // Promote to admin
      const updatedList = [...adminEmails, cleanEmail];
      await persistAdminEmails(updatedList);
      try {
        await cloudUpdateUserRole(cleanEmail, 'admin');
        setProfiles(prev =>
          prev.map(p => (p.email.toLowerCase() === cleanEmail ? { ...p, role: 'admin' } : p))
        );
      } catch (err) {
        console.error('Error promoting user role:', err);
      }
      setFeedback({
        type: 'success',
        text: `✓ Admin rights granted to ${profile.name} (${cleanEmail})! Full permissions are active.`
      });
    }
  };

  // Revoke admin from list
  const handleRevokeEmail = async (emailToRevoke: string) => {
    setFeedback(null);
    const cleanEmail = emailToRevoke.toLowerCase().trim();

    if (PRIMARY_ADMIN_EMAILS.includes(cleanEmail)) {
      setFeedback({
        type: 'error',
        text: 'Primary festival administrator email cannot be removed.'
      });
      return;
    }

    if (currentAdminEmail && currentAdminEmail.toLowerCase() === cleanEmail) {
      if (!confirm('You are revoking admin rights for your own signed-in account. Are you sure?')) {
        return;
      }
    }

    const updatedList = adminEmails.filter(e => e !== cleanEmail);
    await persistAdminEmails(updatedList);

    // Also demote in profile if present
    const existing = profiles.find(p => p.email.toLowerCase() === cleanEmail);
    if (existing) {
      try {
        await cloudUpdateUserRole(cleanEmail, 'resident');
        setProfiles(prev =>
          prev.map(p => (p.email.toLowerCase() === cleanEmail ? { ...p, role: 'resident' } : p))
        );
      } catch (err) {}
    }

    setFeedback({
      type: 'success',
      text: `Admin rights revoked for ${cleanEmail}.`
    });
  };

  // Filter registered profiles
  const filteredProfiles = profiles.filter(p => {
    const q = searchQuery.toLowerCase();
    return (
      (p.name || '').toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q) ||
      (p.flat || '').toLowerCase().includes(q) ||
      (p.mobile || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-amber-400 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#7F1D1D] via-[#991B1B] to-[#7F1D1D] text-white p-4 sm:p-5 flex items-center justify-between border-b-2 border-amber-400">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-400 text-[#991B1B] flex items-center justify-center font-black shadow-inner shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-serif font-black tracking-wide leading-tight flex items-center gap-2">
                <span>Manage Administrator Rights</span>
                <span className="bg-amber-400/30 text-amber-200 text-[10px] uppercase font-mono px-2 py-0.5 rounded-full border border-amber-400/40">
                  Admins: {adminEmails.length}
                </span>
              </h3>
              <p className="text-xs text-amber-200/90 font-medium mt-0.5">
                Grant or revoke admin access for signed-in committee members and residents
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3 text-xs font-semibold flex items-center gap-2 border-b ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-red-50 text-red-900 border-red-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Add Admin Email Section */}
        <div className="p-4 sm:p-5 bg-amber-50/50 border-b border-stone-200">
          <form onSubmit={handleAddAdminEmail} className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
              Grant Admin Rights by Email Address
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={e => setNewAdminEmail(e.target.value)}
                  placeholder="e.g. member@gmail.com"
                  className="w-full bg-white border border-stone-300 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm outline-none focus:border-[#991B1B] focus:ring-1 focus:ring-[#991B1B]"
                />
              </div>
              <button
                type="submit"
                className="bg-[#991B1B] hover:bg-[#7F1D1D] text-white font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-xl transition-all inline-flex items-center justify-center gap-1.5 shadow-xs cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4 text-amber-300" />
                <span>Grant Admin</span>
              </button>
            </div>
            <p className="text-[11px] text-stone-500">
              Anyone logging in with this email (via Email OTP or Google) will automatically receive full Super Admin rights.
            </p>
          </form>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex border-b border-stone-200 bg-stone-50 px-4 pt-2 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('registered')}
            className={`pb-2.5 px-3 border-b-2 transition-all inline-flex items-center gap-2 cursor-pointer ${
              activeTab === 'registered'
                ? 'border-[#991B1B] text-[#991B1B]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Registered Devotee Accounts ({profiles.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('emails')}
            className={`pb-2.5 px-3 border-b-2 transition-all inline-flex items-center gap-2 cursor-pointer ${
              activeTab === 'emails'
                ? 'border-[#991B1B] text-[#991B1B]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Authorized Admin Emails ({adminEmails.length})</span>
          </button>
        </div>

        {/* Main Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {activeTab === 'registered' ? (
            <div className="space-y-3">
              {/* Search Box & Refresh */}
              <div className="flex items-center justify-between gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by devotee name, flat, mobile or email..."
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg pl-8 pr-3 py-1.5 text-xs outline-none focus:bg-white focus:border-[#991B1B]"
                  />
                </div>
                <button
                  type="button"
                  onClick={loadProfiles}
                  disabled={loading}
                  className="p-1.5 rounded-lg border border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer"
                  title="Reload registered profiles"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#991B1B]' : ''}`} />
                </button>
              </div>

              {loading ? (
                <div className="py-12 text-center text-stone-500 text-xs flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-[#991B1B]" />
                  <span>Fetching registered profiles from Firestore...</span>
                </div>
              ) : filteredProfiles.length === 0 ? (
                <div className="py-10 text-center text-stone-400 text-xs bg-stone-50 rounded-xl border border-stone-200">
                  {searchQuery
                    ? 'No registered profiles match your search.'
                    : 'No devotee profiles registered yet. Users will appear here after their first login.'}
                </div>
              ) : (
                <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden bg-white shadow-xs">
                  {filteredProfiles.map(p => {
                    const cleanEmail = p.email.toLowerCase();
                    const isUserAdmin = adminEmails.includes(cleanEmail) || p.role === 'admin';
                    const isPrimary = PRIMARY_ADMIN_EMAILS.includes(cleanEmail);

                    return (
                      <div
                        key={p.email}
                        className="p-3 sm:p-3.5 hover:bg-stone-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-900 text-xs sm:text-sm">
                              {p.name}
                            </span>
                            <span className="bg-stone-100 text-stone-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-stone-200">
                              Flat: {p.flat}
                            </span>
                            {isUserAdmin ? (
                              <span className="inline-flex items-center gap-1 bg-red-100 text-[#991B1B] text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200">
                                <ShieldCheck className="w-3 h-3 text-[#991B1B]" />
                                <span>Super Admin</span>
                              </span>
                            ) : (
                              <span className="bg-stone-100 text-stone-600 text-[10px] font-medium px-2 py-0.5 rounded-full">
                                Resident
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-stone-500">
                            <span className="inline-flex items-center gap-1">
                              <Mail className="w-3 h-3 text-stone-400" />
                              <span className="font-mono">{p.email}</span>
                            </span>
                            {p.mobile && (
                              <span className="inline-flex items-center gap-1">
                                <Phone className="w-3 h-3 text-stone-400" />
                                <span>{p.mobile}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                          {isPrimary ? (
                            <span className="text-[10px] text-stone-400 italic">Primary Admin</span>
                          ) : isUserAdmin ? (
                            <button
                              type="button"
                              onClick={() => handleToggleUserAdmin(p)}
                              className="px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-800 font-bold text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                              title="Revoke admin access and set to resident"
                            >
                              <UserX className="w-3.5 h-3.5 text-red-600" />
                              <span>Revoke Admin</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleUserAdmin(p)}
                              className="px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                              title="Promote this resident to Super Admin"
                            >
                              <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Make Admin</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Authorized Emails Tab */
            <div className="space-y-3">
              <div className="border border-stone-200 rounded-xl overflow-hidden bg-white shadow-xs divide-y divide-stone-100">
                {adminEmails.map(email => {
                  const isPrimary = PRIMARY_ADMIN_EMAILS.includes(email.toLowerCase());
                  const isCurrent = currentAdminEmail && currentAdminEmail.toLowerCase() === email.toLowerCase();

                  return (
                    <div
                      key={email}
                      className="p-3 sm:p-3.5 flex items-center justify-between gap-3 hover:bg-stone-50"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-red-100 text-[#991B1B] flex items-center justify-center shrink-0">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-mono text-xs font-semibold text-stone-900 block truncate">
                            {email}
                          </span>
                          <span className="text-[10px] text-stone-500">
                            {isPrimary ? 'Default Primary Admin' : isCurrent ? 'Your Current Session' : 'Authorized Administrator'}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isPrimary ? (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Fixed
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRevokeEmail(email)}
                            className="p-1.5 rounded text-stone-400 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                            title={`Revoke admin rights for ${email}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
          <span className="text-[11px] text-stone-500">
            Admins have complete control to edit income, expenses, sevas, and passwords.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
