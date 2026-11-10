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
import { cloudGetCommunityPhotos } from '../../lib/firebase';
import { getStoredPhotos, isSamplePhoto } from '../../utils/dataUtils';
import { UserRole, UserProfile } from '../../types';

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
  const [customPhotos, setCustomPhotos] = useState<GalleryPhoto[]>(() => getStoredPhotos().filter(p => !isSamplePhoto(p)));
  const [lightboxPhoto, setLightboxPhoto] = useState<GalleryPhoto | null>(null);

  // Load custom photos from Firestore
  useEffect(() => {
    async function loadFirestorePhotos() {
      try {
        const cloudPhotos = await cloudGetCommunityPhotos();
        if (cloudPhotos !== null) {
          setCustomPhotos(cloudPhotos.filter((p: any) => !isSamplePhoto(p)));
        }
      } catch (err) {
        console.warn('Could not load firestore photos:', err);
      }
    }
    loadFirestorePhotos();
  }, []);

  // Filter gallery photos for this event (strictly saved database photos)
  const eventPhotos = customPhotos.filter(
    (p) =>
      (p.celebration || '').toLowerCase().includes((event.festival || '').toLowerCase()) ||
      (p.celebration || '').toLowerCase().includes((event.title || '').toLowerCase()) ||
      p.year === event.year
  );

  const canAccessFinancials = isAdmin || userRole === 'admin';

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
            src={event.posterImage || '/bhuvaneshwari_kannada_flag.jpg'}
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

          <div className={`text-sm sm:text-base leading-relaxed whitespace-pre-line p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700/60 font-sans ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
            {event.detailsOverview || event.description}
          </div>

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
            No gallery photos available for this event yet.
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
