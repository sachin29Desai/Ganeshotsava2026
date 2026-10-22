import React, { useState } from 'react';
import {
  Calendar,
  MapPin,
  Users,
  ArrowLeft,
  Sparkles,
  HeartHandshake,
  Flag,
  Clock,
  CheckCircle2,
  Share2,
  Copy,
  Check,
  ChevronRight,
  Info,
  CalendarCheck,
  Edit3,
  UserPlus,
  Music,
  Send
} from 'lucide-react';
import { CommunityEvent } from '../../data/communityData';
import { EventCustomInfo } from './EventInfoAndPhotosEditorModal';

interface UpcomingEventViewProps {
  event: CommunityEvent;
  customInfo?: EventCustomInfo;
  onBackToEvents: () => void;
  onOpenVolunteer: () => void;
  onOpenNominate: () => void;
  onOpenInfoAndPhotosEditor?: () => void;
  isAdmin?: boolean;
  isDark?: boolean;
}

export const UpcomingEventView: React.FC<UpcomingEventViewProps> = ({
  event,
  customInfo,
  onBackToEvents,
  onOpenVolunteer,
  onOpenNominate,
  onOpenInfoAndPhotosEditor,
  isAdmin = false,
  isDark = false
}) => {
  const [copied, setCopied] = useState(false);

  const displayTitle = customInfo?.title || event.title;
  const displayKannadaTitle = customInfo?.kannadaTitle || event.kannadaTitle;
  const displayDate = customInfo?.dateDisplay || event.dateDisplay;
  const displayVenue = customInfo?.venue || event.venue;
  const displayOverview = customInfo?.detailsOverview || customInfo?.description || event.detailsOverview || event.description;

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/homepageindevelop?event=${event.slug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      {/* Back Button & Admin Edit Button */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBackToEvents}
          className={`text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer px-3.5 py-2 rounded-xl border ${
            isDark
              ? 'text-stone-300 bg-stone-900 border-stone-800 hover:text-white hover:border-stone-700'
              : 'text-stone-700 bg-white border-stone-200 hover:text-red-700 hover:border-stone-300'
          }`}
        >
          <ArrowLeft className="w-4 h-4 text-red-600" />
          <span>Back to All Balaga Celebrations</span>
        </button>

        {isAdmin && onOpenInfoAndPhotosEditor && (
          <button
            onClick={onOpenInfoAndPhotosEditor}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Upcoming Event Details</span>
          </button>
        )}
      </div>

      {/* Hero Banner Section */}
      <section
        className={`rounded-3xl border-2 overflow-hidden shadow-sm transition-all ${
          isDark
            ? 'bg-stone-900 border-stone-800 text-stone-100'
            : 'bg-white border-stone-200 text-stone-900'
        }`}
      >
        {/* Banner image overlay */}
        <div className="relative h-56 sm:h-72 bg-gradient-to-r from-red-900 via-amber-900 to-yellow-800 overflow-hidden">
          <img
            src={event.posterImage || 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&w=1200&q=80'}
            alt={displayTitle}
            className="w-full h-full object-cover opacity-35 mix-blend-overlay scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent flex flex-col justify-end p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-xs font-black uppercase tracking-wider bg-red-600 text-yellow-300 px-3 py-1 rounded-full border border-yellow-400/40 shadow-xs flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5" />
                <span>UPCOMING EVENT</span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider bg-yellow-400 text-stone-950 px-3 py-1 rounded-full shadow-xs">
                {displayDate}
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-serif font-black text-white drop-shadow-md">
              {displayTitle}
            </h1>
            <span className="text-lg sm:text-2xl font-serif font-bold text-yellow-300 mt-1">
              {displayKannadaTitle}
            </span>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-sm italic font-serif flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
            <span>"{event.theme}"</span>
          </div>

          <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
            {displayOverview}
          </p>

          {/* Key Event Metadata */}
          <div
            className={`grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t ${
              isDark ? 'border-stone-800' : 'border-stone-100'
            }`}
          >
            <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/50">
              <Calendar className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <span className="text-[10px] text-stone-500 uppercase font-extrabold block">Dates</span>
                <span className="text-xs font-bold">{displayDate}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/50">
              <MapPin className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <span className="text-[10px] text-stone-500 uppercase font-extrabold block">Venue</span>
                <span className="text-xs font-bold">{displayVenue}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/50">
              <Users className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <span className="text-[10px] text-stone-500 uppercase font-extrabold block">Participation</span>
                <span className="text-xs font-bold">
                  {event.volunteersCount} Volunteers Registered • {event.actsCount}+ Acts Planned
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Grid */}
        <div
          className={`p-6 sm:p-8 border-t grid grid-cols-1 sm:grid-cols-3 gap-4 ${
            isDark ? 'bg-stone-950 border-stone-800' : 'bg-gradient-to-r from-amber-50/80 to-yellow-50/50 border-stone-200'
          }`}
        >
          <button
            onClick={onOpenNominate}
            className="p-4 rounded-2xl bg-red-700 hover:bg-red-800 text-yellow-300 font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group text-center"
          >
            <Sparkles className="w-6 h-6 group-hover:scale-110 transition-transform text-yellow-300" />
            <span>Register Cultural Performance</span>
            <span className="text-[11px] text-yellow-100 font-normal">
              Dance, Music, Poetry &amp; Drama Registration
            </span>
          </button>

          <button
            onClick={onOpenVolunteer}
            className="p-4 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-stone-950 font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group text-center"
          >
            <Users className="w-6 h-6 group-hover:scale-110 transition-transform text-stone-950" />
            <span>Join Volunteer Team</span>
            <span className="text-[11px] text-stone-800 font-normal">
              Hospitality, Stage, Decor &amp; Food teams
            </span>
          </button>

          <button
            onClick={handleShare}
            className={`p-4 rounded-2xl border-2 font-bold text-xs sm:text-sm transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group text-center ${
              isDark
                ? 'bg-stone-900 border-stone-700 text-stone-100 hover:border-red-600'
                : 'bg-white border-stone-300 text-stone-800 hover:border-red-600'
            }`}
          >
            {copied ? <Check className="w-6 h-6 text-emerald-600" /> : <Share2 className="w-6 h-6 text-red-600 group-hover:scale-110 transition-transform" />}
            <span>{copied ? 'Link Copied!' : 'Share Event Details'}</span>
            <span className={`text-[11px] font-normal ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
              Invite Eldorado neighbors &amp; friends
            </span>
          </button>
        </div>
      </section>

      {/* Program Schedule & Planner Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <CalendarCheck className="w-6 h-6 text-red-600" />
          <h2 className="text-2xl sm:text-3xl font-serif font-black">
            Event Planner &amp; Itinerary
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Day 1 */}
          <div
            className={`rounded-2xl border-2 p-6 space-y-4 ${
              isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3 border-stone-200 dark:border-stone-800">
              <div>
                <span className="text-xs font-bold text-red-600 uppercase tracking-wider block">Day 1</span>
                <h3 className="text-lg font-serif font-bold">Statehood Flag Hoisting &amp; Naadageethe</h3>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400">
                Morning &amp; Evening
              </span>
            </div>

            <ul className="space-y-3 text-xs sm:text-sm">
              <li className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">08:30 AM:</span> Red &amp; Yellow Flag Hoisting &amp; Anthem "Jaya Bharatha Jananiya Tanujathe".
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">11:00 AM:</span> Kannada Literature &amp; Book Exhibition + Children's Drawing Competition.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">05:30 PM:</span> Grand Evening Cultural Showcase: Folk Dances, Dollu Kunitha &amp; Classical Vocal.
                </div>
              </li>
            </ul>
          </div>

          {/* Day 2 */}
          <div
            className={`rounded-2xl border-2 p-6 space-y-4 ${
              isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3 border-stone-200 dark:border-stone-800">
              <div>
                <span className="text-xs font-bold text-red-600 uppercase tracking-wider block">Day 2</span>
                <h3 className="text-lg font-serif font-bold">Kannada Siri Sampada &amp; Grand Finale</h3>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-yellow-100 dark:bg-yellow-950/60 text-amber-800 dark:text-yellow-400">
                All-Day Celebrations
              </span>
            </div>

            <ul className="space-y-3 text-xs sm:text-sm">
              <li className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">10:00 AM:</span> Traditional Karnataka Village Games &amp; Family Fun Activities.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">02:00 PM:</span> Kannada Poetry Recitation &amp; Heritage Quiz.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">05:30 PM:</span> Grand Finale Drama / Yakshagana, Balaga Achiever Awards &amp; Community Feast.
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Volunteer & Nomination Registration Callout */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-gradient-to-br from-red-900 to-amber-900 text-white space-y-4 shadow-md">
          <div className="flex items-center gap-2 text-yellow-300 font-serif font-bold text-lg">
            <UserPlus className="w-5 h-5" />
            <span>Join Volunteer Team</span>
          </div>
          <p className="text-xs sm:text-sm text-stone-200 leading-relaxed">
            Be part of the core resident team managing stage setup, guest hospitality, food distribution, and decorations.
          </p>
          <button
            onClick={onOpenVolunteer}
            className="px-5 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-stone-950 font-black text-xs transition-colors cursor-pointer inline-flex items-center gap-2"
          >
            <span>Enrol as Volunteer Now</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-900 to-stone-900 text-white space-y-4 shadow-md">
          <div className="flex items-center gap-2 text-yellow-300 font-serif font-bold text-lg">
            <Music className="w-5 h-5" />
            <span>Perform on Stage</span>
          </div>
          <p className="text-xs sm:text-sm text-stone-200 leading-relaxed">
            Calling all resident artists, dancers, singers, and performers of all ages to showcase Kannada culture.
          </p>
          <button
            onClick={onOpenNominate}
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-yellow-300 font-black text-xs transition-colors cursor-pointer inline-flex items-center gap-2 border border-yellow-400"
          >
            <span>Register Performance Act</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
};
