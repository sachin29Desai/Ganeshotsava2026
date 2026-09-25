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
  Sparkles,
  Eye,
  Shield,
  Clock,
  Check,
  MessageSquare,
  UserPlus,
  Filter,
  Camera
} from 'lucide-react';
import { AppSettings, UserProfile, UserRole } from '../types';
import {
  cloudGetAllUserProfiles,
  cloudUpdateUserRole,
  cloudSaveUserProfile,
  cloudDeleteUserProfile
} from '../lib/firebase';

interface RegisteredUsersManagementProps {
  settings: AppSettings;
  onSaveSettings?: (settings: AppSettings) => void;
  currentAdminEmail?: string;
}

const PRIMARY_ADMIN_EMAILS = [
  'desaisachin95@gmail.com',
  'kannadigara.balaga.eldorado@gmail.com'
];

export const RegisteredUsersManagement: React.FC<RegisteredUsersManagementProps> = ({
  settings,
  onSaveSettings,
  currentAdminEmail
}) => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'member' | 'viewer' | 'requests'>('all');

  // Add User Form State
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserMobile, setNewUserMobile] = useState('');
  const [newUserFlat, setNewUserFlat] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('member');
  const [isSubmittingNewUser, setIsSubmittingNewUser] = useState(false);

  // User Deletion State
  const [deletingUserEmail, setDeletingUserEmail] = useState<string | null>(null);

  // Load all user profiles
  const loadProfiles = async () => {
    setLoading(true);
    try {
      const allProfiles = await cloudGetAllUserProfiles();
      // Ensure desaisachin95@gmail.com is in profiles
      const hasSachin = allProfiles.some(p => p.email.toLowerCase() === 'desaisachin95@gmail.com');
      if (!hasSachin) {
        allProfiles.push({
          email: 'desaisachin95@gmail.com',
          name: 'Sachin Desai (Global Admin)',
          flat: 'Admin Desk',
          mobile: '9880000000',
          role: 'admin',
          createdAt: new Date().toISOString()
        });
      }

      // Sort: access requests first, then by name
      allProfiles.sort((a, b) => {
        if (a.accessRequested && !b.accessRequested) return -1;
        if (!a.accessRequested && b.accessRequested) return 1;
        return (a.name || '').localeCompare(b.name || '');
      });
      setProfiles(allProfiles);
    } catch (err) {
      console.error('Error fetching registered profiles:', err);
      setFeedback({ type: 'error', text: 'Could not load registered devotee profiles from Firestore.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  // Update Role handler
  const handleRoleChange = async (profile: UserProfile, newRole: UserRole) => {
    const emailLower = profile.email.toLowerCase().trim();
    if (emailLower === 'desaisachin95@gmail.com' && newRole !== 'admin') {
      setFeedback({ type: 'error', text: 'desaisachin95@gmail.com is the permanent Global Admin and cannot be demoted.' });
      setTimeout(() => setFeedback(null), 4000);
      return;
    }

    try {
      await cloudUpdateUserRole(emailLower, newRole);

      // If user had pending access request and was granted member or admin, clear the request flag
      if (profile.accessRequested && (newRole === 'member' || newRole === 'admin')) {
        await cloudSaveUserProfile({
          ...profile,
          role: newRole,
          accessRequested: false
        });
      }

      setProfiles(prev =>
        prev.map(p =>
          p.email.toLowerCase() === emailLower
            ? { ...p, role: newRole, accessRequested: false }
            : p
        )
      );

      const roleLabels: Record<string, string> = {
        admin: 'Admin (All Rights)',
        member: 'Member (Read-Only Complete Access)',
        viewer: 'Viewer (Limited Statement & Payments)'
      };

      setFeedback({
        type: 'success',
        text: `✓ Updated ${profile.name || profile.email} to ${roleLabels[newRole] || newRole}.`
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      console.error('Failed to update user role:', err);
      setFeedback({ type: 'error', text: 'Failed to update user role. Please retry.' });
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  // Add New Devotee Profile handler
  const handleAddNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = newUserEmail.toLowerCase().trim();
    const cleanName = newUserName.trim();
    const cleanMobile = newUserMobile.replace(/\D/g, '');
    const cleanFlat = newUserFlat.trim();

    if (!cleanName) {
      setFeedback({ type: 'error', text: 'Please enter devotee full name.' });
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setFeedback({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    setIsSubmittingNewUser(true);
    try {
      const newProfile: UserProfile = {
        email: cleanEmail,
        name: cleanName,
        flat: cleanFlat || 'General',
        mobile: cleanMobile,
        role: newUserRole,
        status: 'verified', // Admin-registered devotees are instantly verified
        createdAt: new Date().toISOString()
      };

      await cloudSaveUserProfile(newProfile);

      setProfiles(prev => {
        const filtered = prev.filter(p => p.email.toLowerCase() !== cleanEmail);
        return [newProfile, ...filtered];
      });

      setNewUserName('');
      setNewUserEmail('');
      setNewUserMobile('');
      setNewUserFlat('');
      setNewUserRole('member');
      setShowAddUserForm(false);

      setFeedback({
        type: 'success',
        text: `✓ Successfully added ${cleanName} (${cleanEmail}) as ${newUserRole.toUpperCase()}!`
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      console.error('Error adding user profile:', err);
      setFeedback({ type: 'error', text: 'Failed to register devotee profile. Check internet connection.' });
    } finally {
      setIsSubmittingNewUser(false);
    }
  };

  // Remove Devotee Profile handler
  const handleConfirmDeleteUser = async (email: string) => {
    const cleanEmail = email.toLowerCase().trim();
    if (cleanEmail === 'desaisachin95@gmail.com') {
      setFeedback({ type: 'error', text: 'desaisachin95@gmail.com is the permanent Global Admin and cannot be removed.' });
      setDeletingUserEmail(null);
      setTimeout(() => setFeedback(null), 4000);
      return;
    }

    try {
      await cloudDeleteUserProfile(cleanEmail);
      setProfiles(prev => prev.filter(p => p.email.toLowerCase() !== cleanEmail));
      setDeletingUserEmail(null);
      setFeedback({ type: 'success', text: `✓ Removed user ${cleanEmail} from registered devotees list.` });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setFeedback({ type: 'error', text: 'Failed to remove user profile from database.' });
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  // Normalize role for comparison
  const normalizeRole = (r?: UserRole): 'admin' | 'member' | 'viewer' => {
    if (r === 'admin') return 'admin';
    if (r === 'member' || r === 'read_only' || r === 'sponsor') return 'member';
    return 'viewer';
  };

  // Filter profiles
  const filteredProfiles = profiles.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.name?.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.flat?.toLowerCase().includes(q) ||
      p.mobile?.includes(q);

    if (!matchesSearch) return false;

    const effRole = p.email.toLowerCase() === 'desaisachin95@gmail.com' ? 'admin' : normalizeRole(p.role);

    if (filterRole === 'requests') return !!p.accessRequested;
    if (filterRole === 'admin') return effRole === 'admin';
    if (filterRole === 'member') return effRole === 'member';
    if (filterRole === 'viewer') return effRole === 'viewer';
    return true;
  });

  const totalCount = profiles.length;
  const adminCount = profiles.filter(p => p.email.toLowerCase() === 'desaisachin95@gmail.com' || normalizeRole(p.role) === 'admin').length;
  const memberCount = profiles.filter(p => p.email.toLowerCase() !== 'desaisachin95@gmail.com' && normalizeRole(p.role) === 'member').length;
  const viewerCount = profiles.filter(p => p.email.toLowerCase() !== 'desaisachin95@gmail.com' && normalizeRole(p.role) === 'viewer').length;
  const requestsCount = profiles.filter(p => p.accessRequested).length;

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2.5 animate-in fade-in shadow-xs ${
            feedback.type === 'error'
              ? 'bg-red-50 border-red-300 text-red-800'
              : 'bg-emerald-50 border-emerald-300 text-emerald-800'
          }`}
        >
          {feedback.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Total Devotees</span>
            <Users className="w-4 h-4 text-stone-500" />
          </div>
          <div className="text-xl font-bold font-mono text-stone-900 mt-1">{totalCount}</div>
        </div>

        <div className="bg-amber-50/80 border border-amber-300 rounded-xl p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">Admins</span>
            <ShieldCheck className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-950 mt-1">{adminCount}</div>
          <span className="text-[10px] text-amber-700 font-medium">All Rights</span>
        </div>

        <div className="bg-blue-50/80 border border-blue-300 rounded-xl p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900">Members</span>
            <Eye className="w-4 h-4 text-blue-700" />
          </div>
          <div className="text-xl font-bold font-mono text-blue-950 mt-1">{memberCount}</div>
          <span className="text-[10px] text-blue-700 font-medium">Read-Only Full</span>
        </div>

        <div className="bg-stone-100 border border-stone-300 rounded-xl p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-700">Viewers</span>
            <Users className="w-4 h-4 text-stone-600" />
          </div>
          <div className="text-xl font-bold font-mono text-stone-900 mt-1">{viewerCount}</div>
          <span className="text-[10px] text-stone-600 font-medium">Statement &amp; Payments</span>
        </div>
      </div>

      {/* Access Requests Banner (if any) */}
      {requestsCount > 0 && (
        <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-amber-200 text-amber-900">
                <MessageSquare className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-950">
                  {requestsCount} Devotee{requestsCount > 1 ? 's' : ''} Requested Detailed Access
                </h4>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Devotees who logged in as viewers have requested access to view full receipts, bills, and accounting data.
                </p>
              </div>
            </div>
            <button
              onClick={() => setFilterRole('requests')}
              className="text-xs font-bold uppercase tracking-wider bg-amber-400 hover:bg-amber-300 text-stone-950 px-3 py-1.5 rounded-lg transition-colors shrink-0 cursor-pointer shadow-xs"
            >
              Review Requests
            </button>
          </div>
        </div>
      )}

      {/* Main Actions Bar: Search, Role Filter, Add Devotee Button */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by devotee name, flat number, mobile, or email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 outline-none focus:bg-white focus:border-[#991B1B] focus:ring-1 focus:ring-[#991B1B]"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Refresh Button */}
            <button
              onClick={loadProfiles}
              disabled={loading}
              className="p-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-600 transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh registered devotees list"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#991B1B]' : ''}`} />
            </button>

            {/* Add Devotee Button */}
            <button
              onClick={() => setShowAddUserForm(!showAddUserForm)}
              className="bg-[#991B1B] hover:bg-[#7F1D1D] text-white font-bold text-xs uppercase tracking-wider px-3.5 py-2 rounded-xl shadow-xs transition-colors inline-flex items-center gap-2 cursor-pointer shrink-0"
            >
              {showAddUserForm ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4 text-amber-300" />}
              <span>{showAddUserForm ? 'Cancel' : 'Add Devotee'}</span>
            </button>
          </div>
        </div>

        {/* Role Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 text-xs">
          <span className="text-stone-400 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 mr-1 shrink-0">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          <button
            onClick={() => setFilterRole('all')}
            className={`px-3 py-1 rounded-full font-bold uppercase tracking-wider transition-colors cursor-pointer text-[10px] ${
              filterRole === 'all'
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
            }`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setFilterRole('admin')}
            className={`px-3 py-1 rounded-full font-bold uppercase tracking-wider transition-colors cursor-pointer text-[10px] ${
              filterRole === 'admin'
                ? 'bg-amber-500 text-stone-950 font-black'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
            }`}
          >
            Admins ({adminCount})
          </button>
          <button
            onClick={() => setFilterRole('member')}
            className={`px-3 py-1 rounded-full font-bold uppercase tracking-wider transition-colors cursor-pointer text-[10px] ${
              filterRole === 'member'
                ? 'bg-blue-600 text-white font-black'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
            }`}
          >
            Members ({memberCount})
          </button>
          <button
            onClick={() => setFilterRole('viewer')}
            className={`px-3 py-1 rounded-full font-bold uppercase tracking-wider transition-colors cursor-pointer text-[10px] ${
              filterRole === 'viewer'
                ? 'bg-stone-700 text-white font-black'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
            }`}
          >
            Viewers ({viewerCount})
          </button>
          {requestsCount > 0 && (
            <button
              onClick={() => setFilterRole('requests')}
              className={`px-3 py-1 rounded-full font-bold uppercase tracking-wider transition-colors cursor-pointer text-[10px] ${
                filterRole === 'requests'
                  ? 'bg-amber-400 text-stone-950 font-black ring-2 ring-amber-500'
                  : 'bg-amber-100 hover:bg-amber-200 text-amber-900'
              }`}
            >
              Requests ({requestsCount})
            </button>
          )}
        </div>
      </div>

      {/* Expandable Add Devotee Form */}
      {showAddUserForm && (
        <div className="bg-white border-2 border-[#991B1B]/40 rounded-xl p-5 shadow-md animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-200">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-red-50 text-[#991B1B] rounded-lg">
                <UserPlus className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900">
                  Register New Devotee Profile
                </h3>
                <p className="text-xs text-stone-500">
                  Add devotee to the registered list with their email address and role.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAddUserForm(false)}
              className="p-1 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleAddNewUser} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Full Devotee Name *
                </label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 outline-none focus:bg-white focus:border-[#991B1B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  placeholder="e.g. devotee@gmail.com"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 outline-none focus:bg-white focus:border-[#991B1B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  10-Digit Mobile Number (optional)
                </label>
                <input
                  type="tel"
                  value={newUserMobile}
                  onChange={e => setNewUserMobile(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 outline-none focus:bg-white focus:border-[#991B1B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Flat / Villa Number
                </label>
                <input
                  type="text"
                  value={newUserFlat}
                  onChange={e => setNewUserFlat(e.target.value)}
                  placeholder="e.g. A-402, B-Block"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 outline-none focus:bg-white focus:border-[#991B1B]"
                />
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Initial Access Role *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label
                  className={`p-3 rounded-xl border-2 cursor-pointer flex flex-col gap-1 transition-all ${
                    newUserRole === 'admin'
                      ? 'border-amber-400 bg-amber-50/70 shadow-xs'
                      : 'border-stone-200 hover:border-stone-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-600" />
                      Admin
                    </span>
                    <input
                      type="radio"
                      name="newUserRole"
                      value="admin"
                      checked={newUserRole === 'admin'}
                      onChange={() => setNewUserRole('admin')}
                      className="accent-[#991B1B]"
                    />
                  </div>
                  <span className="text-[11px] text-stone-600">
                    Full Rights: Create, modify, delete data, receipts, and settings.
                  </span>
                </label>

                <label
                  className={`p-3 rounded-xl border-2 cursor-pointer flex flex-col gap-1 transition-all ${
                    newUserRole === 'member'
                      ? 'border-blue-400 bg-blue-50/70 shadow-xs'
                      : 'border-stone-200 hover:border-stone-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider text-blue-950 flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-blue-600" />
                      Member
                    </span>
                    <input
                      type="radio"
                      name="newUserRole"
                      value="member"
                      checked={newUserRole === 'member'}
                      onChange={() => setNewUserRole('member')}
                      className="accent-[#991B1B]"
                    />
                  </div>
                  <span className="text-[11px] text-stone-600">
                    Read-Only: Can view all complete festival data, but cannot edit or delete.
                  </span>
                </label>

                <label
                  className={`p-3 rounded-xl border-2 cursor-pointer flex flex-col gap-1 transition-all ${
                    newUserRole === 'viewer'
                      ? 'border-stone-500 bg-stone-100 shadow-xs'
                      : 'border-stone-200 hover:border-stone-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-stone-600" />
                      Viewer
                    </span>
                    <input
                      type="radio"
                      name="newUserRole"
                      value="viewer"
                      checked={newUserRole === 'viewer'}
                      onChange={() => setNewUserRole('viewer')}
                      className="accent-[#991B1B]"
                    />
                  </div>
                  <span className="text-[11px] text-stone-600">
                    Limited: Only sees Income &amp; Expenditure Statement &amp; Expenditure payments.
                  </span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddUserForm(false)}
                className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingNewUser}
                className="bg-[#991B1B] hover:bg-[#7F1D1D] text-white font-bold text-xs uppercase tracking-wider px-5 py-2 rounded-xl shadow-xs transition-colors inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isSubmittingNewUser ? 'Saving Devotee...' : 'Save & Register Devotee'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Devotees List / Table */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 bg-stone-50/70 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs uppercase tracking-wider text-stone-800">
              Registered Devotees ({filteredProfiles.length})
            </span>
            {searchQuery && (
              <span className="text-[11px] text-stone-500 font-mono">
                Matching: &quot;{searchQuery}&quot;
              </span>
            )}
          </div>
          <span className="text-[11px] text-stone-500">
            Changes to roles take effect immediately in cloud
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-stone-500 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-[#991B1B] mx-auto" />
            <p className="text-xs font-medium">Loading devotee profiles from Firestore...</p>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="p-12 text-center text-stone-500 space-y-2">
            <Users className="w-8 h-8 text-stone-300 mx-auto" />
            <p className="font-semibold text-stone-700">No registered devotees found</p>
            <p className="text-xs text-stone-500">
              {searchQuery
                ? 'Try a different search term or clear the search filter.'
                : 'Click "Add Devotee" above to register users.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {filteredProfiles.map(profile => {
              const emailLower = profile.email.toLowerCase().trim();
              const isGlobalAdmin = emailLower === 'desaisachin95@gmail.com';
              const currentEffectiveRole = isGlobalAdmin ? 'admin' : normalizeRole(profile.role);

              return (
                <div
                  key={profile.email}
                  className={`p-4 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    profile.accessRequested
                      ? 'bg-amber-50/50 hover:bg-amber-50/80'
                      : 'hover:bg-stone-50/80'
                  }`}
                >
                  {/* Left: Avatar, Name, Contact, Flat */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                    {/* Devotee Photo / Selfie */}
                    {profile.photoUrl ? (
                      <img
                        src={profile.photoUrl}
                        alt={profile.name}
                        className="w-11 h-11 rounded-full object-cover border-2 border-amber-400 shrink-0 shadow-xs"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-[#991B1B] text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                        {(profile.name || profile.email || 'D').charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-stone-900 truncate">
                          {profile.name || 'Unnamed Devotee'}
                        </span>
                        {profile.flat && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-stone-100 text-stone-800 border border-stone-200">
                            Flat {profile.flat}
                          </span>
                        )}
                        {profile.status === 'verified' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" /> Verified
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const updatedProfile = { ...profile, status: 'verified' as const, updatedAt: new Date().toISOString() };
                                await cloudSaveUserProfile(updatedProfile);
                                setProfiles(prev => prev.map(p => p.email.toLowerCase() === emailLower ? updatedProfile : p));
                                setFeedback({ type: 'success', text: `✓ Manually verified ${profile.name || profile.email}.` });
                                setTimeout(() => setFeedback(null), 4000);
                              } catch (err) {
                                console.error('Failed to verify user:', err);
                                setFeedback({ type: 'error', text: 'Failed to verify user profile.' });
                                setTimeout(() => setFeedback(null), 4000);
                              }
                            }}
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 flex items-center gap-1 cursor-pointer transition-colors shadow-3xs"
                            title="Click to manually verify this devotee"
                          >
                            <Clock className="w-2.5 h-2.5 text-amber-700" />
                            <span>Unverified (Verify)</span>
                          </button>
                        )}
                        {isGlobalAdmin && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-stone-950 flex items-center gap-1 shadow-2xs">
                            <Sparkles className="w-2.5 h-2.5" /> Global Super Admin
                          </span>
                        )}
                        {profile.accessRequested && !isGlobalAdmin && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-200 text-amber-900 border border-amber-300 animate-pulse flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Requested Access
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-stone-500 flex-wrap">
                        <span className="flex items-center gap-1 font-mono text-stone-700 truncate max-w-[200px] sm:max-w-none">
                          <Mail className="w-3 h-3 text-stone-400 shrink-0" />
                          {profile.email}
                        </span>
                        {profile.mobile && (
                          <span className="flex items-center gap-1 font-mono text-stone-700">
                            <Phone className="w-3 h-3 text-stone-400 shrink-0" />
                            {profile.mobile}
                          </span>
                        )}
                        {profile.createdAt && (
                          <span className="text-[10px] text-stone-400 hidden lg:inline">
                            Joined {new Date(profile.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* Devotee request notes if present */}
                      {profile.accessRequested && profile.accessRequestNotes && (
                        <p className="text-xs text-amber-900 bg-amber-100/70 px-2.5 py-1 rounded-lg border border-amber-200 mt-1 inline-block">
                          💬 &quot;{profile.accessRequestNotes}&quot;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Role Selection Selector & Delete User Button */}
                  <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                    {/* Role Segmented Controller */}
                    <div className="inline-flex rounded-xl p-1 bg-stone-100 border border-stone-200 shadow-2xs">
                      {/* Admin Button */}
                      <button
                        onClick={() => handleRoleChange(profile, 'admin')}
                        disabled={isGlobalAdmin}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                          currentEffectiveRole === 'admin'
                            ? 'bg-amber-400 text-stone-950 shadow-xs'
                            : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
                        } disabled:cursor-default`}
                        title="Admin: All rights (Create, Edit, Delete, Settings)"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-stone-900" />
                        <span>Admin</span>
                      </button>

                      {/* Member Button */}
                      <button
                        onClick={() => handleRoleChange(profile, 'member')}
                        disabled={isGlobalAdmin}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                          currentEffectiveRole === 'member'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                        title="Member: Read-Only complete data access (cannot modify)"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Member</span>
                      </button>

                      {/* Viewer Button */}
                      <button
                        onClick={() => handleRoleChange(profile, 'viewer')}
                        disabled={isGlobalAdmin}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                          currentEffectiveRole === 'viewer'
                            ? 'bg-stone-800 text-white shadow-xs'
                            : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                        title="Viewer: Limited to Income & Expenditure Statement and Expenditure payments"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Viewer</span>
                      </button>
                    </div>

                    {/* Delete User Button (Trash) */}
                    {!isGlobalAdmin && (
                      <button
                        onClick={() => setDeletingUserEmail(profile.email)}
                        className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-red-200"
                        title={`Remove ${profile.name || profile.email} from registered list`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Dialog for User Removal */}
      {deletingUserEmail && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-stone-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-stone-900">Remove Registered Devotee?</h3>
              <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                Are you sure you want to remove <strong className="text-stone-900 font-mono">{deletingUserEmail}</strong> from the registered users list? They will no longer be able to log in with this account.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setDeletingUserEmail(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs uppercase tracking-wider hover:bg-stone-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmDeleteUser(deletingUserEmail)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider shadow-xs transition-colors cursor-pointer"
              >
                Remove User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
