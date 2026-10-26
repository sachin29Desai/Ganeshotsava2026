import React, { useState, useEffect } from 'react';
import {
  Users,
  HeartHandshake,
  UserPlus,
  RefreshCw,
  Loader2,
  Sparkles,
  Search,
  Filter,
  Trash2,
  PhoneCall,
  MessageSquare,
  Copy,
  Check,
  Calendar,
  Building,
  Mail,
  ShieldCheck,
  AlertTriangle,
  X
} from 'lucide-react';
import { EventVolunteer } from '../../types';
import { cloudGetVolunteersByEvent, cloudDeleteVolunteer } from '../../lib/firebase';

interface EventVolunteersListProps {
  eventId: string;
  eventTitle: string;
  onOpenVolunteerModal: (eventId: string, eventTitle: string) => void;
  isAdmin?: boolean;
  isDark?: boolean;
}

export const EventVolunteersList: React.FC<EventVolunteersListProps> = ({
  eventId,
  eventTitle,
  onOpenVolunteerModal,
  isAdmin = false,
  isDark = false
}) => {
  const [volunteers, setVolunteers] = useState<EventVolunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [copiedRoster, setCopiedRoster] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteVol, setConfirmDeleteVol] = useState<EventVolunteer | null>(null);

  const fetchVolunteers = async () => {
    setLoading(true);
    try {
      const data = await cloudGetVolunteersByEvent(eventId);
      setVolunteers(data);
    } catch (err) {
      console.warn('Failed to load event volunteers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchVolunteers();
    }
  }, [eventId]);

  const handleDeleteVolunteer = async (vol: EventVolunteer) => {
    setDeletingId(vol.id);
    try {
      await cloudDeleteVolunteer(vol.id);
      setVolunteers((prev) => prev.filter((v) => v.id !== vol.id));
      setConfirmDeleteVol(null);
    } catch (err) {
      console.error('Failed to delete volunteer:', err);
      alert('Failed to remove volunteer. Please check network connection.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyRoster = () => {
    if (filteredVolunteers.length === 0) return;
    const textLines = [
      `🌺 *${eventTitle} — Volunteer Roster* (${filteredVolunteers.length} Members)`,
      `──────────────────────────────`
    ];

    filteredVolunteers.forEach((v, idx) => {
      textLines.push(
        `${idx + 1}. *${v.name}* (${v.flat}) - ${v.department}` +
          (isAdmin && v.mobile ? ` | 📱 ${v.mobile}` : '')
      );
    });

    textLines.push(`──────────────────────────────`);
    textLines.push(`🚩 Eldorado Kannadigara Balaga`);

    const fullText = textLines.join('\n');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullText);
      setCopiedRoster(true);
      setTimeout(() => setCopiedRoster(false), 2500);
    }
  };

  // Filter volunteers
  const filteredVolunteers = volunteers.filter((v) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (v.name || '').toLowerCase().includes(q) ||
      (v.flat || '').toLowerCase().includes(q) ||
      (v.mobile || '').toLowerCase().includes(q) ||
      (v.department || '').toLowerCase().includes(q);

    const matchesDept = selectedDept === 'ALL' || v.department === selectedDept;

    return matchesSearch && matchesDept;
  });

  // Extract department options dynamically
  const deptOptions = Array.from(new Set(volunteers.map((v) => v.department).filter(Boolean)));

  const cardBg = isDark
    ? 'bg-stone-900 border-stone-800 text-stone-100'
    : 'bg-white border-stone-200 text-stone-900';

  const inputBg = isDark
    ? 'bg-stone-800 border-stone-700 text-stone-100 placeholder-stone-400 focus:border-red-500'
    : 'bg-white border-stone-300 text-stone-900 placeholder-stone-400 focus:border-red-600';

  return (
    <section className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-3 border-stone-200 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Users className="w-5 h-5 text-red-600 shrink-0" />
            <h3 className="text-xl sm:text-2xl font-serif font-black">
              Volunteers Roster — {eventTitle}
            </h3>
            <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-yellow-300 border border-red-200 dark:border-red-800">
              {volunteers.length} Enrolled
            </span>
            {isAdmin && (
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-400 text-stone-950 flex items-center gap-1 border border-amber-500">
                <ShieldCheck className="w-3 h-3" />
                <span>Admin View</span>
              </span>
            )}
          </div>
          <p className={`text-xs mt-1 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
            Devotees and residents registered for seva and team duties specifically for this celebration.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchVolunteers}
            disabled={loading}
            className={`p-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
              isDark
                ? 'bg-stone-900 border-stone-800 text-stone-300 hover:text-white'
                : 'bg-white border-stone-200 text-stone-600 hover:text-red-700'
            }`}
            title="Refresh Volunteers"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {volunteers.length > 0 && (
            <button
              onClick={handleCopyRoster}
              className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                isDark
                  ? 'bg-stone-800 border-stone-700 text-stone-200 hover:bg-stone-700'
                  : 'bg-stone-100 border-stone-300 text-stone-800 hover:bg-stone-200'
              }`}
              title="Copy volunteer list summary for WhatsApp"
            >
              {copiedRoster ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-red-600" />
                  <span>Copy Roster</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={() => onOpenVolunteerModal(eventId, eventTitle)}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-yellow-300 font-bold text-xs shadow-xs transition-colors cursor-pointer inline-flex items-center gap-2 border border-yellow-400"
          >
            <UserPlus className="w-4 h-4" />
            <span>{isAdmin ? '+ Add Volunteer' : 'Enrol as Volunteer'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      {volunteers.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, flat, mobile or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border outline-none font-medium transition-colors ${inputBg}`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {deptOptions.length > 0 && (
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <Filter className="w-4 h-4 text-stone-400 shrink-0" />
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className={`w-full sm:w-auto px-3 py-2 text-xs rounded-xl border outline-none font-semibold ${inputBg}`}
              >
                <option value="ALL">All Departments ({volunteers.length})</option>
                {deptOptions.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept} ({volunteers.filter((v) => v.department === dept).length})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Volunteer List Cards */}
      {loading ? (
        <div className="p-8 rounded-2xl border text-center space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-red-600 mx-auto" />
          <p className="text-xs text-stone-500">Loading registered volunteers for {eventTitle}...</p>
        </div>
      ) : filteredVolunteers.length === 0 ? (
        <div
          className={`p-8 rounded-2xl border-2 border-dashed text-center space-y-3 ${
            isDark ? 'bg-stone-900/50 border-stone-800 text-stone-400' : 'bg-amber-50/50 border-amber-200 text-stone-600'
          }`}
        >
          <HeartHandshake className="w-10 h-10 text-red-600 mx-auto opacity-80" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
              {volunteers.length === 0
                ? 'No Volunteers Enrolled Yet for This Event'
                : 'No Volunteers Match Your Search Filter'}
            </h4>
            <p className="text-xs max-w-md mx-auto">
              {volunteers.length === 0
                ? `Be the first resident to step forward! Join Pooja, Food Distribution, Stage Setup, or Cultural teams for ${eventTitle}.`
                : 'Try clearing your search query or selecting All Departments.'}
            </p>
          </div>
          {volunteers.length === 0 ? (
            <button
              onClick={() => onOpenVolunteerModal(eventId, eventTitle)}
              className="px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-stone-950 font-bold text-xs shadow-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-red-700" />
              <span>Be First Volunteer for {eventTitle}</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedDept('ALL');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-bold text-xs cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredVolunteers.map((vol) => {
            const cleanPhone = (vol.mobile || '').replace(/\D/g, '');
            const waUrl = cleanPhone
              ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
                  `Hi ${vol.name}, regarding ${eventTitle} volunteer seva in Eldorado Balaga:`
                )}`
              : undefined;

            return (
              <div
                key={vol.id}
                className={`p-4 rounded-2xl border-2 transition-all space-y-3 flex flex-col justify-between ${cardBg}`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-600 to-amber-600 text-yellow-300 flex items-center justify-center font-black text-sm shrink-0 shadow-xs border border-yellow-400/40">
                        {vol.name ? vol.name[0].toUpperCase() : 'V'}
                      </div>
                      <div>
                        <h5 className="font-extrabold text-xs sm:text-sm leading-tight text-stone-900 dark:text-stone-100">
                          {vol.name}
                        </h5>
                        <div className="flex items-center gap-1 mt-0.5 text-stone-500 dark:text-stone-400 text-[11px] font-semibold">
                          <Building className="w-3 h-3 shrink-0 text-red-600" />
                          <span>{vol.flat || 'Eldorado Resident'}</span>
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-800 dark:text-yellow-300 px-2 py-0.5 rounded border border-amber-400/40 shrink-0">
                      {vol.department || 'General Seva'}
                    </span>
                  </div>

                  {/* Availability & Timings */}
                  {vol.availability && (
                    <div className="text-[11px] text-stone-600 dark:text-stone-300 leading-snug border-t pt-2 border-stone-100 dark:border-stone-800 flex items-start gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>{vol.availability}</span>
                    </div>
                  )}

                  {/* Admin Details: Contact info & Date */}
                  {isAdmin && (
                    <div className="space-y-1.5 pt-2 border-t border-stone-200 dark:border-stone-800 text-[11px] bg-stone-50 dark:bg-stone-800/80 p-2.5 rounded-xl">
                      {vol.mobile && (
                        <div className="flex items-center justify-between gap-1 font-mono text-stone-700 dark:text-stone-300 font-semibold">
                          <span className="text-stone-500 font-sans">Mobile:</span>
                          <span>{vol.mobile}</span>
                        </div>
                      )}
                      {vol.email && (
                        <div className="flex items-center justify-between gap-1 text-stone-600 dark:text-stone-400 truncate">
                          <span className="text-stone-500 shrink-0">Email:</span>
                          <span className="truncate">{vol.email}</span>
                        </div>
                      )}
                      {vol.createdAt && (
                        <div className="text-[10px] text-stone-400 text-right font-medium">
                          Reg: {new Date(vol.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Admin Quick Action Controls */}
                {isAdmin && (
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-200 dark:border-stone-800">
                    <div className="flex items-center gap-1.5">
                      {waUrl && (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] inline-flex items-center gap-1 shadow-xs transition-colors"
                          title="Chat on WhatsApp"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                      {vol.mobile && (
                        <a
                          href={`tel:${vol.mobile}`}
                          className="p-1.5 rounded-lg bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:text-red-600 transition-colors"
                          title="Call Volunteer"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>

                    <button
                      onClick={() => setConfirmDeleteVol(vol)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors cursor-pointer"
                      title="Remove volunteer from roster"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Delete Confirmation Modal */}
      {confirmDeleteVol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className={`rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 space-y-4 animate-in fade-in zoom-in-95 ${
              isDark ? 'bg-stone-900 border-stone-800 text-stone-100' : 'bg-white border-red-600 text-stone-900'
            }`}
          >
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h4 className="font-serif font-black text-lg">Remove Volunteer?</h4>
            </div>

            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
              Are you sure you want to remove <strong>{confirmDeleteVol.name}</strong> ({confirmDeleteVol.flat}) from the volunteer roster for <strong>{eventTitle}</strong>?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmDeleteVol(null)}
                disabled={!!deletingId}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteVolunteer(confirmDeleteVol)}
                disabled={!!deletingId}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                {deletingId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Confirm Remove</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
