import React from 'react';
import {
  Calendar,
  MapPin,
  Users,
  ChevronDown,
  ArrowLeft,
  Flame,
  Sparkles,
  HeartHandshake,
  Video,
  FileText,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { CommunityEvent, GANESHA_FAQS } from '../../data/communityData';

interface BalagaEventDetailViewProps {
  event: CommunityEvent;
  onBackToEvents: () => void;
  onOpenContribute: () => void;
  onOpenVolunteer: () => void;
  onOpenNominate: () => void;
  isDark?: boolean;
}

export const BalagaEventDetailView: React.FC<BalagaEventDetailViewProps> = ({
  event,
  onBackToEvents,
  onOpenContribute,
  onOpenVolunteer,
  onOpenNominate,
  isDark = false
}) => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      {/* Back Button */}
      <div>
        <button
          onClick={onBackToEvents}
          className={`text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
            isDark ? 'text-stone-400 hover:text-white' : 'text-stone-600 hover:text-red-700'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Celebrations</span>
        </button>
      </div>

      {/* 1. Hero Context Panel */}
      <section
        className={`rounded-3xl border-2 overflow-hidden shadow-sm transition-all ${
          isDark
            ? 'bg-stone-900 border-stone-800 text-stone-100'
            : 'bg-white border-stone-200 text-stone-900'
        }`}
      >
        <div className="p-6 sm:p-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-red-600 text-yellow-300 px-3 py-1 rounded-full shadow-xs">
                [{event.festival}]
              </span>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
                  event.status === 'ongoing'
                    ? 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/40 animate-pulse'
                    : event.status === 'upcoming'
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40'
                    : 'bg-stone-500/20 text-stone-500 border border-stone-500/40'
                }`}
              >
                {event.status === 'ongoing'
                  ? '● Live Now'
                  : event.status === 'upcoming'
                  ? 'Upcoming Festival'
                  : 'Archived Celebration'}
              </span>
            </div>

            <span className="text-xs font-bold text-amber-700 dark:text-yellow-400">
              {event.year} Edition • 3rd Year Balaga Milestone
            </span>
          </div>

          <div>
            <h1 className="text-3xl sm:text-5xl font-serif font-black tracking-tight text-red-700 dark:text-red-500">
              {event.title}
            </h1>
            <span className="text-lg sm:text-xl font-serif font-bold text-amber-800 dark:text-yellow-300 block mt-1.5">
              {event.kannadaTitle}
            </span>
            <p className="text-sm sm:text-base text-amber-900 dark:text-stone-300 font-medium italic mt-2">
              "{event.theme}"
            </p>
          </div>

          <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
            {event.detailsOverview || event.description}
          </p>

          <div
            className={`grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t ${
              isDark ? 'border-stone-800' : 'border-stone-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <span className="text-[11px] text-stone-400 uppercase font-semibold block">Date &amp; Schedule</span>
                <span className="text-xs font-bold">{event.dateDisplay}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <span className="text-[11px] text-stone-400 uppercase font-semibold block">Venue</span>
                <span className="text-xs font-bold">{event.venue}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <span className="text-[11px] text-stone-400 uppercase font-semibold block">Participation</span>
                <span className="text-xs font-bold">
                  {event.volunteersCount} Volunteers • {event.actsCount} Cultural Acts
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Embedded CTA Action Grid */}
        <div
          className={`p-6 sm:p-8 border-t grid grid-cols-1 sm:grid-cols-3 gap-4 ${
            isDark ? 'bg-stone-950 border-stone-800' : 'bg-amber-50/70 border-stone-200'
          }`}
        >
          <button
            onClick={onOpenContribute}
            className="p-4 rounded-2xl bg-red-600 hover:bg-red-700 text-yellow-300 font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group text-center"
          >
            <HeartHandshake className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span>Contribute to Anna Santharpane</span>
            <span className="text-[11px] text-yellow-200 font-normal">
              100% voluntary devotee support
            </span>
          </button>

          <button
            onClick={onOpenVolunteer}
            className="p-4 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-stone-950 font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group text-center"
          >
            <Users className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span>Sign Up as Volunteer</span>
            <span className="text-[11px] text-stone-800 font-normal">
              Join Pooja, Food, or Decor teams
            </span>
          </button>

          <button
            onClick={onOpenNominate}
            className={`p-4 rounded-2xl border-2 font-bold text-xs sm:text-sm transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group text-center ${
              isDark
                ? 'bg-stone-900 border-stone-700 text-stone-100 hover:border-red-600'
                : 'bg-white border-stone-300 text-stone-800 hover:border-red-600'
            }`}
          >
            <Sparkles className="w-6 h-6 text-red-600 group-hover:scale-110 transition-transform" />
            <span>Register for Cultural Stage Show</span>
            <span className={`text-[11px] font-normal ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
              Dance, Music, Drama &amp; Yakshagana
            </span>
          </button>
        </div>
      </section>

      {/* 3. Media Section: Highlights & Visual Framework */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Video className="w-5 h-5 text-red-600" />
          <h3 className="text-xl sm:text-2xl font-serif font-black">
            Celebration Highlights &amp; Procession
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Visual card 1 */}
          <div
            className={`rounded-2xl border-2 overflow-hidden shadow-xs ${
              isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
            }`}
          >
            <div className="relative aspect-video bg-stone-950 flex items-center justify-center overflow-hidden group">
              <img
                src="https://images.unsplash.com/photo-1567591370504-20a2e7c4f4a3?auto=format&fit=crop&w=800&q=80"
                alt="Visarjana procession"
                className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-4">
                <span className="text-[10px] font-bold text-yellow-300 uppercase tracking-wider">
                  Procession &amp; Chende Vadya
                </span>
                <h4 className="text-white font-serif font-bold text-base">
                  Grand Visarjana &amp; Rathothsava
                </h4>
                <p className="text-stone-300 text-xs mt-1">
                  Watch highlights of devotional chants, Chende percussion rhythms, and community flower shower.
                </p>
              </div>
            </div>
          </div>

          {/* Visual card 2 */}
          <div
            className={`rounded-2xl border-2 overflow-hidden shadow-xs ${
              isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
            }`}
          >
            <div className="relative aspect-video bg-stone-950 flex items-center justify-center overflow-hidden group">
              <img
                src="https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&w=800&q=80"
                alt="Cultural Evening"
                className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-4">
                <span className="text-[10px] font-bold text-yellow-300 uppercase tracking-wider">
                  Balaga Rangamandira
                </span>
                <h4 className="text-white font-serif font-bold text-base">
                  Kannada Cultural Stage Performances
                </h4>
                <p className="text-stone-300 text-xs mt-1">
                  Over 12 registered cultural acts performed by children and adult residents of our towers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FAQ Accordion System */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-xl sm:text-2xl font-serif font-black">
            Frequently Asked Questions
          </h3>
          <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
            Everything you need to know about pooja rituals, seva timings, eco-friendly guidelines, and volunteer duties.
          </p>
        </div>

        <div className="space-y-3">
          {GANESHA_FAQS.map((faq, idx) => (
            <details
              key={idx}
              className={`group rounded-2xl border p-4 transition-all open:border-red-600 ${
                isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
              }`}
            >
              <summary className="font-semibold text-sm cursor-pointer flex items-center justify-between gap-3 list-none select-none">
                <span className="text-stone-900 dark:text-stone-100">{faq.question}</span>
                <ChevronDown className="w-4 h-4 text-stone-400 group-open:rotate-180 transition-transform shrink-0" />
              </summary>
              <p
                className={`mt-3 text-xs sm:text-sm leading-relaxed border-t pt-3 ${
                  isDark ? 'border-stone-800 text-stone-300' : 'border-stone-100 text-stone-600'
                }`}
              >
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
};
