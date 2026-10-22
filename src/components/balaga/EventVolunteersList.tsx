import React, { useState, useEffect } from 'react';
import { Users, HeartHandshake, UserPlus, CheckCircle2, ShieldCheck, RefreshCw, Loader2, Sparkles } from 'lucide-react';
import { EventVolunteer } from '../../types';
import { cloudGetVolunteersByEvent } from '../../lib/firebase';

interface EventVolunteersListProps {
  eventId: string;
  eventTitle: string;
  onOpenVolunteerModal: (eventId: string, eventTitle: string) => void;
  isDark?: boolean;
}

export const EventVolunteersList: React.FC<EventVolunteersListProps> = ({
  eventId,
  eventTitle,
  onOpenVolunteerModal,
  isDark = false
}) => {
  const [volunteers, setVolunteers] = useState<EventVolunteer[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-stone-200 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-red-600 shrink-0" />
            <h3 className="text-xl sm:text-2xl font-serif font-black">
              Volunteers Roster — {eventTitle}
            </h3>
            <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-yellow-300 border border-red-200 dark:border-red-800">
              {volunteers.length} Enrolled
            </span>
          </div>
          <p className={`text-xs mt-1 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
            Devotees and residents registered for seva and team duties specifically for this celebration.
          </p>
        </div>

        <div className="flex items-center gap-2">
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

          <button
            onClick={() => onOpenVolunteerModal(eventId, eventTitle)}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-yellow-300 font-bold text-xs shadow-xs transition-colors cursor-pointer inline-flex items-center gap-2 border border-yellow-400"
          >
            <UserPlus className="w-4 h-4" />
            <span>Enrol as Volunteer</span>
          </button>
        </div>
      </div>

      {/* Volunteer List */}
      {loading ? (
        <div className="p-8 rounded-2xl border text-center space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-red-600 mx-auto" />
          <p className="text-xs text-stone-500">Loading registered volunteers for {eventTitle}...</p>
        </div>
      ) : volunteers.length === 0 ? (
        <div
          className={`p-8 rounded-2xl border-2 border-dashed text-center space-y-3 ${
            isDark ? 'bg-stone-900/50 border-stone-800 text-stone-400' : 'bg-amber-50/50 border-amber-200 text-stone-600'
          }`}
        >
          <HeartHandshake className="w-10 h-10 text-red-600 mx-auto opacity-80" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
              No Volunteers Enrolled Yet for This Event
            </h4>
            <p className="text-xs max-w-md mx-auto">
              Be the first resident to step forward! Join Pooja, Food Distribution, Stage Setup, or Cultural teams for {eventTitle}.
            </p>
          </div>
          <button
            onClick={() => onOpenVolunteerModal(eventId, eventTitle)}
            className="px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-stone-950 font-bold text-xs shadow-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-red-700" />
            <span>Be First Volunteer for {eventTitle}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {volunteers.map((vol) => (
            <div
              key={vol.id}
              className={`p-4 rounded-2xl border-2 transition-all space-y-2 ${
                isDark ? 'bg-stone-900 border-stone-800 text-stone-100' : 'bg-white border-stone-200 text-stone-900'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-red-600 text-yellow-300 flex items-center justify-center font-bold text-xs">
                    {vol.name ? vol.name[0].toUpperCase() : 'V'}
                  </div>
                  <div>
                    <h5 className="font-bold text-xs sm:text-sm">{vol.name}</h5>
                    <span className="text-[11px] font-semibold text-stone-500">{vol.flat}</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-700 dark:text-yellow-300 px-2 py-0.5 rounded border border-amber-400/40">
                  {vol.department}
                </span>
              </div>

              {vol.availability && (
                <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed border-t pt-1.5 border-stone-100 dark:border-stone-800">
                  🗓 {vol.availability}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
