import React, { useState, useEffect } from 'react';
import {
  Calendar,
  MapPin,
  Users,
  ArrowLeft,
  FileText,
  CheckCircle2,
  Image as ImageIcon,
  Video,
  Download,
  Share2,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Coins,
  Receipt,
  Info,
  Clock
} from 'lucide-react';
import { CommunityEvent, GALLERY_PHOTOS, GalleryPhoto } from '../../data/communityData';
import { db } from '../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

interface PastEventViewProps {
  event: CommunityEvent;
  onBackToEvents: () => void;
  onNavigateToFinancialStatement: () => void;
  isDark?: boolean;
}

export const PastEventView: React.FC<PastEventViewProps> = ({
  event,
  onBackToEvents,
  onNavigateToFinancialStatement,
  isDark = false
}) => {
  const [activeTab, setActiveTab] = useState<'statement' | 'gallery'>('statement');
  const [customPhotos, setCustomPhotos] = useState<GalleryPhoto[]>([]);

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

  const eventPhotos = [...customPhotos, ...GALLERY_PHOTOS].filter(
    (p) =>
      (p.celebration || '').toLowerCase().includes((event.festival || '').toLowerCase()) ||
      (p.celebration || '').toLowerCase().includes('ganesha') ||
      p.year === event.year
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      {/* Back Button */}
      <div>
        <button
          onClick={onBackToEvents}
          className={`text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer px-3 py-1.5 rounded-lg border ${
            isDark
              ? 'text-stone-300 bg-stone-900 border-stone-800 hover:text-white hover:border-stone-700'
              : 'text-stone-700 bg-white border-stone-200 hover:text-red-700 hover:border-stone-300'
          }`}
        >
          <ArrowLeft className="w-4 h-4 text-red-600" />
          <span>Back to All Balaga Celebrations</span>
        </button>
      </div>

      {/* Hero Header Section */}
      <section
        className={`rounded-3xl border-2 overflow-hidden shadow-sm transition-all ${
          isDark
            ? 'bg-stone-900 border-stone-800 text-stone-100'
            : 'bg-white border-stone-200 text-stone-900'
        }`}
      >
        <div className="relative h-48 sm:h-64 bg-gradient-to-r from-stone-900 via-red-950 to-stone-900 overflow-hidden">
          <img
            src={event.posterImage || 'https://images.unsplash.com/photo-1567591370504-20a2e7c4f4a3?auto=format&fit=crop&w=1200&q=80'}
            alt={event.title}
            className="w-full h-full object-cover opacity-30 mix-blend-overlay scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/50 to-transparent flex flex-col justify-end p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-black uppercase tracking-wider bg-stone-800 text-stone-200 px-3 py-1 rounded-full border border-stone-700 shadow-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>PAST EVENT — CONCLUDED</span>
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

        <div className="p-6 sm:p-8 space-y-6">
          <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
            {event.description}
          </p>

          <div
            className={`grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t ${
              isDark ? 'border-stone-800' : 'border-stone-100'
            }`}
          >
            <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/50">
              <Calendar className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <span className="text-[10px] text-stone-500 uppercase font-extrabold block">Period</span>
                <span className="text-xs font-bold">23 Aug 2026 – 20 Sep 2026</span>
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
                <span className="text-[10px] text-stone-500 uppercase font-extrabold block">Impact</span>
                <span className="text-xs font-bold">347 Donors • 48 Volunteers • 1,500+ Devotees</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div
          className={`px-6 border-t flex items-center gap-2 overflow-x-auto ${
            isDark ? 'bg-stone-950 border-stone-800' : 'bg-stone-100/70 border-stone-200'
          }`}
        >
          <button
            onClick={() => setActiveTab('statement')}
            className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'statement'
                ? 'border-red-600 text-red-700 dark:text-red-400 bg-white dark:bg-stone-900 rounded-t-lg'
                : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <FileText className="w-4 h-4 text-red-600" />
            <span>Income &amp; Expenditure Statement</span>
          </button>

          <button
            onClick={() => setActiveTab('gallery')}
            className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'gallery'
                ? 'border-red-600 text-red-700 dark:text-red-400 bg-white dark:bg-stone-900 rounded-t-lg'
                : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-red-600" />
            <span>Event Gallery &amp; Highlights</span>
          </button>
        </div>
      </section>

      {/* Tab 1: Income & Expenditure Statement */}
      {activeTab === 'statement' && (
        <div className="space-y-8">
          {/* Key Financial Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Collections */}
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
                ₹ 5,90,322
              </div>
              <p className="text-[11px] text-stone-500">
                347 Devotee Contributions (₹ 3.29L) + Corporate Sponsors (₹ 2.61L)
              </p>
            </div>

            {/* Card 2: Expenses */}
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
                ₹ 5,19,804
              </div>
              <p className="text-[11px] text-stone-500">
                100% bank-processed vendor &amp; supplier settlements (zero cash withdrawals)
              </p>
            </div>

            {/* Card 3: Net Surplus */}
            <div className="p-5 rounded-2xl border-2 border-amber-500/50 bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-transparent space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-black text-amber-800 dark:text-amber-300 tracking-wider">Net Surplus (Closing)</span>
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
              <div className="text-2xl font-black text-amber-700 dark:text-yellow-400">
                ₹ 79,976.04
              </div>
              <p className="text-[11px] text-amber-900/80 dark:text-amber-200/80 font-medium">
                Deposited in Fixed Deposit (FD) for Ganeshotsava 2027
              </p>
            </div>

            {/* Card 4: Pending Receivables */}
            <div
              className={`p-5 rounded-2xl border-2 space-y-2 ${
                isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-black text-stone-500 tracking-wider">Pending Sponsors</span>
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-blue-700 dark:text-blue-400">
                ₹ 65,000
              </div>
              <p className="text-[11px] text-stone-500">
                Expected pending receivable from corporate sponsors (under active follow-up)
              </p>
            </div>
          </div>

          {/* Audit Announcement Box */}
          <div className="p-6 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 text-stone-900 dark:text-stone-100 space-y-2">
            <div className="flex items-center gap-2 text-amber-800 dark:text-yellow-400 font-bold text-sm">
              <ShieldCheck className="w-5 h-5 text-amber-600" />
              <span>Official Financial Audit Status</span>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed text-stone-700 dark:text-stone-300">
              The Ganeshotsava Samithi is currently processing the formal expense audit for all transactions covering the period <strong>23-08-2026 to 20-09-2026</strong>. The audit is expected to complete within <strong>15–20 days</strong>. Once the finalized audit report is received, it will be uploaded and published directly on this portal.
            </p>
          </div>

          {/* CTA Box to View Full Detailed Ledger */}
          <div
            className={`p-6 sm:p-8 rounded-3xl border-2 text-center space-y-4 ${
              isDark ? 'bg-stone-900 border-stone-800' : 'bg-stone-50 border-stone-200'
            }`}
          >
            <div className="max-w-xl mx-auto space-y-2">
              <h3 className="text-xl font-serif font-black text-stone-900 dark:text-stone-100">
                Full Itemized Financial Ledger &amp; Devotee Receipts
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
                Access the complete break-up of all 347 donor contributions, vendor payment vouchers, category-wise expenditure breakdowns, and download statement copies in PDF/Excel.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <button
                onClick={onNavigateToFinancialStatement}
                className="px-6 py-3.5 rounded-xl bg-red-700 hover:bg-red-800 text-yellow-300 font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <FileText className="w-4 h-4 text-yellow-300" />
                <span>Open Complete Income &amp; Expenditure Ledger</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Event Gallery */}
      {activeTab === 'gallery' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100">
              Sri Ganeshotsava 2026 Moments &amp; Highlights
            </h3>
            <span className="text-xs font-semibold text-stone-500">
              {eventPhotos.length} Photos Captured
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {eventPhotos.map((photo) => (
              <div
                key={photo.id}
                className={`group rounded-2xl border-2 overflow-hidden shadow-xs transition-all ${
                  isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                }`}
              >
                <div className="relative aspect-4/3 overflow-hidden bg-stone-900">
                  <img
                    src={photo.imageUrl}
                    alt={photo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3 text-white">
                    <span className="text-[10px] font-bold text-yellow-300 uppercase">
                      {photo.tag}
                    </span>
                    <h4 className="font-bold text-xs sm:text-sm">{photo.title}</h4>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
