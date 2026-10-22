import React, { useState } from 'react';
import {
  Calendar,
  MapPin,
  Users,
  ArrowLeft,
  FileText,
  CheckCircle2,
  Image as ImageIcon,
  Coins,
  Receipt,
  TrendingUp,
  Clock,
  ShieldCheck,
  Edit3,
  ExternalLink,
  ChevronRight,
  X,
  Sparkles,
  Lock
} from 'lucide-react';
import { CommunityEvent, GALLERY_PHOTOS, GalleryPhoto } from '../../data/communityData';
import { EventCustomInfo } from './EventInfoAndPhotosEditorModal';

interface PastEventViewProps {
  event: CommunityEvent;
  customInfo?: EventCustomInfo;
  onBackToEvents: () => void;
  onNavigateToFinancialStatement: () => void;
  onOpenInfoAndPhotosEditor?: () => void;
  isAdmin?: boolean;
  isDark?: boolean;
}

export const PastEventView: React.FC<PastEventViewProps> = ({
  event,
  customInfo,
  onBackToEvents,
  onNavigateToFinancialStatement,
  onOpenInfoAndPhotosEditor,
  isAdmin = false,
  isDark = false
}) => {
  const [activeTab, setActiveTab] = useState<'highlights' | 'financials' | 'gallery'>('highlights');
  const [lightboxPhoto, setLightboxPhoto] = useState<GalleryPhoto | null>(null);

  // Photos resolution: customInfo override or default gallery photos for this event
  const defaultEventPhotos = GALLERY_PHOTOS.filter(
    (p) =>
      p.celebration.toLowerCase().includes(event.festival.toLowerCase()) ||
      p.year === event.year ||
      p.tag.toLowerCase().includes(event.festival.toLowerCase())
  );
  const eventPhotos = customInfo?.photos && customInfo.photos.length > 0
    ? customInfo.photos
    : defaultEventPhotos.length > 0
    ? defaultEventPhotos
    : GALLERY_PHOTOS.slice(0, 6);

  // Dynamic Event Metadata
  const displayTitle = customInfo?.title || event.title;
  const displayKannadaTitle = customInfo?.kannadaTitle || event.kannadaTitle;
  const displayDate = customInfo?.dateDisplay || event.dateDisplay;
  const displayVenue = customInfo?.venue || event.venue;
  const displayOverview = customInfo?.detailsOverview || customInfo?.description || event.detailsOverview || event.description;

  // Dynamic Financials Overview
  const totalIncome = customInfo?.totalIncome || (event.festival === 'Ganesha Chaturthi' ? '₹ 7,34,333' : '₹ 1,65,000');
  const totalExpense = customInfo?.totalExpense || (event.festival === 'Ganesha Chaturthi' ? '₹ 6,19,706.96' : '₹ 1,20,000');
  const netSurplus = customInfo?.netSurplus || (event.festival === 'Ganesha Chaturthi' ? '₹ 1,14,626.04' : '₹ 45,000');
  const pendingReceivables = customInfo?.pendingReceivables || (event.festival === 'Ganesha Chaturthi' ? '₹ 35,000' : '₹ 0');
  const auditNote = customInfo?.auditNote || 'The official audit is completed and accounts are verified by the resident committee.';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      {/* Top Navigation & Admin Edit Trigger */}
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
            <span>Edit Photos &amp; Event Template</span>
          </button>
        )}
      </div>

      {/* Hero Header Section */}
      <section
        className={`rounded-3xl border-2 overflow-hidden shadow-md transition-all ${
          isDark
            ? 'bg-stone-900 border-stone-800 text-stone-100'
            : 'bg-white border-stone-200 text-stone-900'
        }`}
      >
        <div className="relative h-52 sm:h-72 bg-gradient-to-r from-stone-950 via-red-950 to-amber-950 overflow-hidden">
          <img
            src={event.posterImage || 'https://images.unsplash.com/photo-1567591370504-20a2e7c4f4a3?auto=format&fit=crop&w=1200&q=80'}
            alt={displayTitle}
            className="w-full h-full object-cover opacity-35 mix-blend-overlay scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/50 to-transparent flex flex-col justify-end p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-black uppercase tracking-wider bg-stone-800/90 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/30 shadow-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>PAST EVENT — CONCLUDED</span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full">
                {displayDate}
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-serif font-black text-white drop-shadow-md">
              {displayTitle}
            </h1>
            <span className="text-lg sm:text-2xl font-serif font-bold text-amber-300 mt-1">
              {displayKannadaTitle}
            </span>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-stone-300' : 'text-stone-700'}`}>
            {displayOverview}
          </p>

          <div
            className={`grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t ${
              isDark ? 'border-stone-800' : 'border-stone-100'
            }`}
          >
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/50">
              <Calendar className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <span className="text-[10px] text-stone-500 uppercase font-extrabold block">Concluded Period</span>
                <span className="text-xs font-bold">{displayDate}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/50">
              <MapPin className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <span className="text-[10px] text-stone-500 uppercase font-extrabold block">Venue</span>
                <span className="text-xs font-bold">{displayVenue}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/50">
              <Users className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <span className="text-[10px] text-stone-500 uppercase font-extrabold block">Community Impact</span>
                <span className="text-xs font-bold">
                  {event.volunteersCount} Volunteers • {event.actsCount} Stage Acts
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Common Navigation Tabs */}
        <div
          className={`px-6 border-t flex items-center gap-2 overflow-x-auto ${
            isDark ? 'bg-stone-950 border-stone-800' : 'bg-stone-100/80 border-stone-200'
          }`}
        >
          <button
            onClick={() => setActiveTab('highlights')}
            className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'highlights'
                ? 'border-red-600 text-red-700 dark:text-red-400 bg-white dark:bg-stone-900 rounded-t-lg'
                : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-red-600" />
            <span>Event Highlights &amp; Summary</span>
          </button>

          <button
            onClick={() => setActiveTab('gallery')}
            className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'gallery'
                ? 'border-red-600 text-red-700 dark:text-red-400 bg-white dark:bg-stone-900 rounded-t-lg'
                : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-red-600" />
            <span>Photo Gallery ({eventPhotos.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('financials')}
            className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'financials'
                ? 'border-red-600 text-red-700 dark:text-red-400 bg-white dark:bg-stone-900 rounded-t-lg'
                : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            <FileText className="w-4 h-4 text-red-600" />
            <span>Financial Overview &amp; Accounts</span>
          </button>
        </div>
      </section>

      {/* Tab 1: Highlights & Overview */}
      {activeTab === 'highlights' && (
        <div className="space-y-8">
          {/* Key Achievements Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              className={`p-6 rounded-3xl border-2 space-y-3 ${
                isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
              }`}
            >
              <div className="flex items-center gap-2 font-serif font-black text-lg text-red-600">
                <CheckCircle2 className="w-5 h-5 text-red-600" />
                <span>Devotional &amp; Cultural Milestones</span>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-stone-600 dark:text-stone-300 list-disc list-inside">
                <li>100% Eco-friendly clay idol principles with zero chemical paints.</li>
                <li>Daily Mahaprasada Anna Santharpane served to hundreds of resident families.</li>
                <li>Evening Chende Vadya, Nashik Dhol, and traditional Dollu Kunitha folk procession.</li>
                <li>Full stage shows featuring resident children and adult cultural performances.</li>
              </ul>
            </div>

            <div
              className={`p-6 rounded-3xl border-2 space-y-3 ${
                isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
              }`}
            >
              <div className="flex items-center gap-2 font-serif font-black text-lg text-amber-600">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                <span>Transparent Financial Governance</span>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-stone-600 dark:text-stone-300 list-disc list-inside">
                <li>100% digital receipt generation for every single voluntary donor.</li>
                <li>Direct vendor payment settlements with zero unaccounted cash withdrawals.</li>
                <li>Audited ledger published transparently for public inspection and review.</li>
                <li>Closing surplus allocated towards community Fixed Deposit (FD) for future celebrations.</li>
              </ul>
            </div>
          </div>

          {/* Quick Photo Preview Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-stone-100">
                Event Preview Photos
              </h3>
              <button
                onClick={() => setActiveTab('gallery')}
                className="text-xs font-bold text-red-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>View all ({eventPhotos.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {eventPhotos.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  onClick={() => setLightboxPhoto(p)}
                  className="relative aspect-4/3 rounded-2xl border overflow-hidden cursor-pointer group bg-stone-950"
                >
                  <img
                    src={p.imageUrl}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-2.5 flex flex-col justify-end text-white">
                    <span className="text-[10px] font-bold text-yellow-300 truncate">{p.title}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Gallery */}
      {activeTab === 'gallery' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100">
              Captured Moments &amp; Visual Gallery
            </h3>
            <span className="text-xs font-semibold text-stone-500">
              {eventPhotos.length} Photos
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {eventPhotos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => setLightboxPhoto(photo)}
                className={`group rounded-2xl border-2 overflow-hidden shadow-xs cursor-pointer transition-all ${
                  isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                }`}
              >
                <div className="relative aspect-4/3 overflow-hidden bg-stone-950">
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
                    {photo.caption && (
                      <p className="text-[11px] text-stone-300 truncate mt-0.5">{photo.caption}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Financials Overview */}
      {activeTab === 'financials' && (
        <div className="space-y-8">
          {/* Key Financial Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Income */}
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
                {totalIncome}
              </div>
              <p className="text-[11px] text-stone-500">
                Devotee Voluntary Contributions &amp; Corporate Sponsors
              </p>
            </div>

            {/* Expenses */}
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
                {totalExpense}
              </div>
              <p className="text-[11px] text-stone-500">
                Vendor bills, pooja materials, stage setup &amp; prasadam
              </p>
            </div>

            {/* Net Surplus */}
            <div className="p-5 rounded-2xl border-2 border-amber-500/50 bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-transparent space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-black text-amber-800 dark:text-amber-300 tracking-wider">Net Surplus (Closing)</span>
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
              <div className="text-2xl font-black text-amber-700 dark:text-yellow-400">
                {netSurplus}
              </div>
              <p className="text-[11px] text-amber-900/80 dark:text-amber-200/80 font-medium">
                Deposited in Fixed Deposit (FD) for future celebrations
              </p>
            </div>

            {/* Receivables */}
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
                {pendingReceivables}
              </div>
              <p className="text-[11px] text-stone-500">
                Expected pending corporate sponsor receivables
              </p>
            </div>
          </div>

          {/* Audit Note */}
          <div className="p-6 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 text-stone-900 dark:text-stone-100 space-y-2">
            <div className="flex items-center gap-2 text-amber-800 dark:text-yellow-400 font-bold text-sm">
              <ShieldCheck className="w-5 h-5 text-amber-600" />
              <span>Audit &amp; Account Status</span>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed text-stone-700 dark:text-stone-300">
              {auditNote}
            </p>
          </div>

          {/* Detailed Ledger CTA */}
          <div
            className={`p-6 sm:p-8 rounded-3xl border-2 text-center space-y-4 ${
              isDark ? 'bg-stone-900 border-stone-800' : 'bg-stone-50 border-stone-200'
            }`}
          >
            <div className="max-w-xl mx-auto space-y-2">
              <h3 className="text-xl font-serif font-black text-stone-900 dark:text-stone-100">
                Detailed Itemized Financial Ledger &amp; Devotee Receipts
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
                Access the complete break-up of donor contributions, vendor payment vouchers, category-wise expenditure breakdowns, and download statement copies in PDF/Excel.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <button
                onClick={onNavigateToFinancialStatement}
                className="px-6 py-3.5 rounded-xl bg-red-700 hover:bg-red-800 text-yellow-300 font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <FileText className="w-4 h-4 text-yellow-300" />
                <span>Open Complete Itemized Financial Statement</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative max-w-4xl w-full space-y-4">
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute top-2 right-2 p-2 bg-stone-800 text-white rounded-full hover:bg-stone-700 cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={lightboxPhoto.imageUrl}
              alt={lightboxPhoto.title}
              className="w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl"
            />
            <div className="text-center text-white space-y-1">
              <h3 className="text-lg font-bold font-serif">{lightboxPhoto.title}</h3>
              <p className="text-xs text-stone-300">{lightboxPhoto.caption || lightboxPhoto.celebration}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
