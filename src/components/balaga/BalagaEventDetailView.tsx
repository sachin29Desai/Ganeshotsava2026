import React, { useState, useEffect } from 'react';
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
  CheckCircle2,
  Lock,
  ImageIcon,
  X,
  Coins,
  Receipt,
  TrendingUp,
  Clock,
  PhoneCall,
  UserCheck
} from 'lucide-react';
import { CommunityEvent, GALLERY_PHOTOS, GalleryPhoto, GANESHA_FAQS } from '../../data/communityData';
import { db } from '../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { UserRole, UserProfile } from '../../types';
import { EventVolunteersList } from './EventVolunteersList';

interface BalagaEventDetailViewProps {
  event: CommunityEvent;
  userRole?: UserRole | null;
  userProfile?: UserProfile | null;
  isAdmin?: boolean;
  isMember?: boolean;
  onBackToEvents: () => void;
  onOpenContribute: () => void;
  onOpenVolunteer: () => void;
  onOpenNominate: () => void;
  onNavigateToFinancialStatement: () => void;
  onRequestAccess?: () => void;
  isDark?: boolean;
}

export const BalagaEventDetailView: React.FC<BalagaEventDetailViewProps> = ({
  event,
  userRole,
  userProfile,
  isAdmin = false,
  isMember = false,
  onBackToEvents,
  onOpenContribute,
  onOpenVolunteer,
  onOpenNominate,
  onNavigateToFinancialStatement,
  onRequestAccess,
  isDark = false
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'gallery' | 'financials'>('overview');
  const [customPhotos, setCustomPhotos] = useState<GalleryPhoto[]>([]);
  const [lightboxPhoto, setLightboxPhoto] = useState<GalleryPhoto | null>(null);

  // Load custom photos from Firestore
  useEffect(() => {
    async function loadFirestoreHighlights() {
      try {
        const snap = await getDocs(collection(db, 'event_highlights'));
        const fetched: GalleryPhoto[] = [];
        snap.forEach((docSnap) => {
          fetched.push({ id: docSnap.id, ...docSnap.data() } as GalleryPhoto);
        });
        if (fetched.length > 0) {
          setCustomPhotos(fetched);
        }
      } catch (err) {
        console.warn('Could not load firestore highlights:', err);
      }
    }
    loadFirestoreHighlights();
  }, []);

  // Filter gallery photos for this event
  const eventPhotos = [...customPhotos, ...GALLERY_PHOTOS].filter(
    (p) =>
      (p.celebration || '').toLowerCase().includes((event.festival || '').toLowerCase()) ||
      (p.celebration || '').toLowerCase().includes((event.title || '').toLowerCase()) ||
      p.year === event.year
  );

  const canAccessFinancials = isAdmin || isMember || userRole === 'admin' || userRole === 'member' || userRole === 'read_only';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      {/* Top Back Navigation Bar */}
      <div>
        <button
          onClick={onBackToEvents}
          className={`text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer px-3 py-1.5 rounded-xl border ${
            isDark
              ? 'text-stone-300 bg-stone-900 border-stone-800 hover:text-white hover:border-stone-700'
              : 'text-stone-700 bg-white border-stone-200 hover:text-red-700 hover:border-stone-300'
          }`}
        >
          <ArrowLeft className="w-4 h-4 text-red-600" />
          <span>Back to All Balaga Celebrations</span>
        </button>
      </div>

      {/* 1. Hero Banner Panel */}
      <section
        className={`rounded-3xl border-2 overflow-hidden shadow-sm transition-all ${
          isDark
            ? 'bg-stone-900 border-stone-800 text-stone-100'
            : 'bg-white border-stone-200 text-stone-900'
        }`}
      >
        <div className="relative h-56 sm:h-72 bg-gradient-to-r from-stone-900 via-red-950 to-stone-900 overflow-hidden">
          <img
            src={event.posterImage || 'https://images.unsplash.com/photo-1567591370504-20a2e7c4f4a3?auto=format&fit=crop&w=1200&q=80'}
            alt={event.title}
            className="w-full h-full object-cover opacity-35 mix-blend-overlay scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/60 to-transparent flex flex-col justify-end p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span
                className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-xs flex items-center gap-1.5 ${
                  event.status === 'ongoing'
                    ? 'bg-red-600 text-yellow-300 animate-pulse'
                    : event.status === 'upcoming'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-stone-800 text-stone-200 border border-stone-700'
                }`}
              >
                {event.status === 'ongoing' ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>● LIVE NOW — ONGOING</span>
                  </>
                ) : event.status === 'upcoming' ? (
                  <>
                    <Clock className="w-3.5 h-3.5" />
                    <span>UPCOMING FESTIVAL</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>PAST EVENT — CONCLUDED</span>
                  </>
                )}
              </span>

              <span className="text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full">
                {event.dateDisplay}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-serif font-black text-white drop-shadow-md">
              {event.title}
            </h1>
            <span className="text-lg sm:text-2xl font-serif font-bold text-amber-300 mt-1">
              {event.kannadaTitle}
            </span>
          </div>
        </div>

        {/* Overview content */}
        <div className="p-6 sm:p-8 space-y-6">
          <p className="text-sm sm:text-base text-amber-800 dark:text-yellow-300 font-medium italic">
            "{event.theme}"
          </p>

          <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
            {event.detailsOverview || event.description}
          </p>

          <div
            className={`grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t ${
              isDark ? 'border-stone-800' : 'border-stone-100'
            }`}
          >
            <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/50">
              <Calendar className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <span className="text-[10px] text-stone-500 uppercase font-extrabold block">Schedule</span>
                <span className="text-xs font-bold">{event.dateDisplay}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/50">
              <MapPin className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <span className="text-[10px] text-stone-500 uppercase font-extrabold block">Venue</span>
                <span className="text-xs font-bold">{event.venue}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/50">
              <Users className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <span className="text-[10px] text-stone-500 uppercase font-extrabold block">Community Seva</span>
                <span className="text-xs font-bold">
                  {event.volunteersCount} Volunteers • {event.actsCount} Cultural Acts
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Embedded CTAs (Only for Upcoming and Ongoing Events; Hidden for Concluded Past Events) */}
        {event.status !== 'past' && event.status !== 'archived' ? (
          <div
            className={`p-6 sm:p-8 border-t grid grid-cols-1 sm:grid-cols-3 gap-4 ${
              isDark ? 'bg-stone-950 border-stone-800' : 'bg-amber-50/70 border-stone-200'
            }`}
          >
            <button
              onClick={onOpenContribute}
              className="p-4 rounded-2xl bg-red-600 hover:bg-red-700 text-yellow-300 font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group text-center"
            >
              <HeartHandshake className="w-6 h-6 group-hover:scale-110 transition-transform" />
              <span>Contribute to Mahaprasada</span>
              <span className="text-[11px] text-yellow-200 font-normal">
                100% voluntary devotee support
              </span>
            </button>

            <button
              onClick={onOpenVolunteer}
              className="p-4 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-stone-950 font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group text-center"
            >
              <Users className="w-6 h-6 group-hover:scale-110 transition-transform" />
              <span>Volunteer Sign Up</span>
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
              <span>Register Stage Performance</span>
              <span className={`text-[11px] font-normal ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                Kannada Dance, Music, Drama
              </span>
            </button>
          </div>
        ) : (
          <div
            className={`p-5 border-t text-center ${
              isDark ? 'bg-stone-950/70 border-stone-800 text-stone-300' : 'bg-amber-50/50 border-stone-200 text-stone-700'
            }`}
          >
            <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Concluded Event: Volunteer registrations, stage performance nominations, and contributions for this event are closed.
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Event-Specific Volunteers List */}
      <EventVolunteersList
        eventId={event.id}
        eventTitle={event.title}
        onOpenVolunteerModal={() => onOpenVolunteer()}
        isDark={isDark}
      />

      {/* 2. Photo Gallery & Moments Highlights */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-red-600" />
            <h3 className="text-xl sm:text-2xl font-serif font-black">
              Event Gallery &amp; Highlights ({eventPhotos.length})
            </h3>
          </div>
        </div>

        {eventPhotos.length === 0 ? (
          <div className="p-8 rounded-2xl border text-center text-xs text-stone-500">
            No custom photos added for this event yet. Admins can upload photos from the Admin Panel.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {eventPhotos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => setLightboxPhoto(photo)}
                className={`group rounded-2xl border-2 overflow-hidden shadow-xs cursor-pointer transition-all hover:scale-[1.02] ${
                  isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                }`}
              >
                <div className="relative aspect-4/3 overflow-hidden bg-stone-900">
                  <img
                    src={photo.imageUrl}
                    alt={photo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-end p-3.5 text-white">
                    <span className="text-[10px] font-bold text-yellow-300 uppercase tracking-wider">
                      {photo.tag}
                    </span>
                    <h4 className="font-bold text-xs sm:text-sm leading-tight">{photo.title}</h4>
                    {photo.caption && (
                      <p className="text-[11px] text-stone-300 line-clamp-1 mt-0.5">{photo.caption}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. Financial Overview & Privacy Guard */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-red-600" />
          <h3 className="text-xl sm:text-2xl font-serif font-black">
            Financials &amp; Accounts Overview
          </h3>
        </div>

        {canAccessFinancials ? (
          /* VERIFIED MEMBERS & ADMINS: SEE DETAILED FINANCIAL CARDS */
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div
                className={`p-5 rounded-2xl border-2 space-y-2 ${
                  isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase font-black text-stone-500 tracking-wider">Total Income</span>
                  <Coins className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                  ₹ 7,34,333
                </div>
                <p className="text-[11px] text-stone-500">
                  Voluntary Devotee Contributions + Corporate Sponsors + Commercial Stalls + Hundi
                </p>
              </div>

              <div
                className={`p-5 rounded-2xl border-2 space-y-2 ${
                  isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase font-black text-stone-500 tracking-wider">Total Expenses</span>
                  <Receipt className="w-5 h-5 text-red-600" />
                </div>
                <div className="text-2xl font-black text-red-700 dark:text-red-400">
                  ₹ 6,19,706.96
                </div>
                <p className="text-[11px] text-stone-500">
                  100% bank-processed vendor &amp; supplier settlements
                </p>
              </div>

              <div className="p-5 rounded-2xl border-2 border-amber-500/50 bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-transparent space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase font-black text-amber-800 dark:text-amber-300 tracking-wider">Closing Surplus</span>
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                </div>
                <div className="text-2xl font-black text-amber-700 dark:text-yellow-400">
                  ₹ 1,14,626.04
                </div>
                <p className="text-[11px] text-amber-900/80 dark:text-amber-200/80 font-medium">
                  Deposited in Fixed Deposit (FD) for future celebrations
                </p>
              </div>

              <div
                className={`p-5 rounded-2xl border-2 space-y-2 ${
                  isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase font-black text-stone-500 tracking-wider">Pending Receivables</span>
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-2xl font-black text-blue-700 dark:text-blue-400">
                  ₹ 35,000
                </div>
                <p className="text-[11px] text-stone-500">
                  Pending sponsor receivables under active follow-up
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 text-stone-900 dark:text-stone-100 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 dark:text-yellow-400 font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                <span>Verified Financial Audit &amp; Ledger Access</span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-stone-700 dark:text-stone-300">
                You are signed in as a verified Balaga member. Every rupee collected and spent is documented in the digital ledger.
              </p>
            </div>

            <div className="flex justify-center pt-2">
              <button
                onClick={onNavigateToFinancialStatement}
                className="px-6 py-3.5 rounded-xl bg-red-700 hover:bg-red-800 text-yellow-300 font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <FileText className="w-4 h-4 text-yellow-300" />
                <span>Open Full Itemized Income &amp; Expenditure Ledger</span>
              </button>
            </div>
          </div>
        ) : (
          /* PUBLIC / NON-MEMBER VISITORS: FRIENDLY LOCK BANNER */
          <div className="p-6 sm:p-8 rounded-3xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 via-white to-amber-50 dark:from-stone-900 dark:via-stone-900 dark:to-stone-900 dark:border-stone-800 text-stone-900 dark:text-stone-100 shadow-xs space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center shrink-0 shadow-xs">
                <Lock className="w-6 h-6 text-[#991B1B]" />
              </div>
              <div className="space-y-1">
                <h4 className="font-serif font-bold text-base sm:text-lg text-stone-900 dark:text-stone-100">
                  Devotee Privacy &amp; Financial Statement Protection
                </h4>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                  Public Overview Mode: Event details, photo gallery, and volunteer planner are open to all visitors. Detailed financial statements, itemized vendor accounts, and receipt search are restricted to verified Balaga members and admins.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              {onRequestAccess && (
                <button
                  onClick={onRequestAccess}
                  className="px-5 py-2.5 rounded-xl bg-[#991B1B] hover:bg-[#7F1D1D] text-white font-bold text-xs uppercase tracking-wider shadow-xs transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <PhoneCall className="w-4 h-4 text-amber-300" />
                  <span>Contact Us / Request Member Access</span>
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* 4. FAQs Section */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-xl sm:text-2xl font-serif font-black">
            Frequently Asked Questions
          </h3>
          <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
            Information regarding pooja rituals, prasadam, eco-friendly guidelines, and volunteering.
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

      {/* Lightbox Modal */}
      {lightboxPhoto && (
        <div
          onClick={() => setLightboxPhoto(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full bg-stone-950 border border-stone-800 rounded-3xl overflow-hidden shadow-2xl cursor-default"
          >
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="max-h-[75vh] bg-black flex items-center justify-center">
              <img
                src={lightboxPhoto.imageUrl}
                alt={lightboxPhoto.title}
                className="max-h-[75vh] w-auto max-w-full object-contain"
              />
            </div>
            <div className="p-5 bg-stone-900 text-white space-y-1">
              <span className="text-[10px] font-bold text-yellow-300 uppercase tracking-wider">
                {lightboxPhoto.tag} • {lightboxPhoto.celebration} ({lightboxPhoto.year})
              </span>
              <h4 className="font-serif font-bold text-base sm:text-lg">{lightboxPhoto.title}</h4>
              {lightboxPhoto.caption && (
                <p className="text-xs text-stone-300">{lightboxPhoto.caption}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
