import React, { useState, useRef } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Printer,
  Share2,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  PhoneCall,
  Calendar,
  Lock,
  Unlock,
  Building2,
  FileText,
  Copy,
  X,
  ArrowLeft,
  HeartHandshake,
  Download,
  Package
} from 'lucide-react';
import { SevaBooking, SevaCatalogueItem, AppSettings } from '../types';
import { fmt, fmtDate, today, cleanOrgName } from '../utils/helpers';
import { ShareSevaPortalModal } from './ShareSevaPortalModal';

interface PublicSevaPortalProps {
  sevas: SevaBooking[];
  catalogue: SevaCatalogueItem[];
  settings: AppSettings;
  isAdmin: boolean;
  onSaveBooking: (booking: SevaBooking) => void;
  onDeleteBooking: (id: string) => void;
  onSaveCatalogue: (item: SevaCatalogueItem) => void;
  onDeleteCatalogue: (id: string) => void;
  onNavigateToGaneshotsava: () => void;
  onNavigateToReceipts: () => void;
  onAdminLoginSuccess?: () => void;
  onUpdateSettings?: (settings: AppSettings) => void;
}

export const PublicSevaPortal: React.FC<PublicSevaPortalProps> = ({
  sevas,
  catalogue,
  settings,
  isAdmin,
  onSaveBooking,
  onDeleteBooking,
  onSaveCatalogue,
  onDeleteCatalogue,
  onNavigateToGaneshotsava,
  onNavigateToReceipts,
  onAdminLoginSuccess,
  onUpdateSettings
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'booked' | 'confirmed'>('all');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [adminAuthModalOpen, setAdminAuthModalOpen] = useState(false);
  const [adminPassInput, setAdminPassInput] = useState('');
  const [adminError, setAdminError] = useState('');

  // Booking Modal State
  const [bookingModal, setBookingModal] = useState<{
    open: boolean;
    item?: SevaBooking | null;
    initialSeva?: string;
    initialQty?: number;
    initialAmt?: number;
  }>({ open: false });

  const [selectedSevaName, setSelectedSevaName] = useState<string>('');

  // Catalogue Item Modal State (Devotees can add/modify, but CANNOT delete)
  const [catModal, setCatModal] = useState<{ open: boolean; item?: SevaCatalogueItem | null }>({ open: false });

  // Receipt Modal State
  const [activeReceiptModal, setActiveReceiptModal] = useState<SevaBooking | null>(null);

  // Success Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Helper to calculate total booked quantity, total required, and remaining needed for each catalogue offering
  const getSevaStats = (catItem: SevaCatalogueItem) => {
    const norm = (catItem.name || '').trim().toLowerCase();
    const matchingBookings = sevas.filter(
      s => (s.seva || '').trim().toLowerCase() === norm
    );

    const bookedQty = matchingBookings.reduce((sum, b) => {
      const q = typeof b.qty === 'number' && !isNaN(b.qty) ? b.qty : 1;
      return sum + q;
    }, 0);

    const hasTotal = typeof catItem.totalRequired === 'number' && catItem.totalRequired > 0;
    const totalReq = hasTotal ? (catItem.totalRequired as number) : 0;
    const remainingQty = hasTotal ? Math.max(0, totalReq - bookedQty) : undefined;
    const isFulfilled = hasTotal && bookedQty >= totalReq;

    return {
      bookedQty,
      bookedCount: matchingBookings.length,
      hasTotal,
      totalReq,
      remainingQty,
      isFulfilled
    };
  };

  const currentModalSeva =
    bookingModal.item?.seva ||
    bookingModal.initialSeva ||
    selectedSevaName ||
    catalogue[0]?.name;

  const activeCatalogueItem = catalogue.find(c => c.name === currentModalSeva);
  const activeStats = activeCatalogueItem ? getSevaStats(activeCatalogueItem) : null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const getNextTokNo = () => {
    let maxNum = 0;
    sevas.forEach(s => {
      const match = s.tokNo?.match(/(\d+)$/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    });
    return `GE-SV-${String(maxNum + 1).padStart(4, '0')}`;
  };

  const handleConfirmBooking = (item: SevaBooking) => {
    onSaveBooking({
      ...item,
      status: 'Confirmed',
      confirmedBy: 'Admin Committee',
      confirmedAt: new Date().toISOString()
    });
    showToast(`✓ Booking ${item.tokNo} for ${item.name} confirmed!`);
  };

  const handleUnconfirmBooking = (item: SevaBooking) => {
    onSaveBooking({
      ...item,
      status: 'Booked',
      confirmedBy: undefined,
      confirmedAt: undefined
    });
    showToast(`Status reverted to Booked for ${item.tokNo}`);
  };

  const handleAdminAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassInput === settings.adminHash) {
      if (onAdminLoginSuccess) onAdminLoginSuccess();
      setAdminAuthModalOpen(false);
      setAdminPassInput('');
      setAdminError('');
      showToast('Admin Mode unlocked successfully!');
    } else {
      setAdminError('Incorrect admin passcode.');
    }
  };

  const filtered = sevas.filter(v => {
    const q = search.trim().toLowerCase();
    const cleanQ = q.replace(/[^a-z0-9]/g, '');

    const flatClean = (v.flat || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const nameMatch = (v.name || '').toLowerCase().includes(q);
    const sevaMatch = (v.seva || '').toLowerCase().includes(q);
    const tokMatch = (v.tokNo || '').toLowerCase().includes(q);
    const phoneMatch = (v.phone || '').toLowerCase().includes(q);
    const flatMatch = (v.flat || '').toLowerCase().includes(q) || (cleanQ && flatClean.includes(cleanQ));

    const matchesSearch = !q || nameMatch || sevaMatch || tokMatch || phoneMatch || flatMatch;

    const isConfirmed = v.status === 'Confirmed';
    if (statusFilter === 'confirmed') return matchesSearch && isConfirmed;
    if (statusFilter === 'booked') return matchesSearch && !isConfirmed;
    return matchesSearch;
  });

  const totalAct = sevas.reduce((s, r) => s + Number(r.amt || 0), 0);
  const bookedCount = sevas.filter(s => (s.status || 'Booked') === 'Booked').length;
  const confirmedCount = sevas.filter(s => s.status === 'Confirmed').length;

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 flex flex-col font-sans selection:bg-amber-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1C1917] text-white px-4 py-3 rounded-xl shadow-2xl border border-stone-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-[#991B1B] text-white shadow-md border-b border-[#7F1D1D]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-400 text-[#991B1B] flex items-center justify-center p-1 shadow-inner shrink-0 overflow-hidden border border-amber-300">
              <img
                src={settings.logo || '/lord_ganesha.svg'}
                alt="Lord Ganesha"
                className="w-full h-full object-contain rounded-full"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-lg font-serif font-black tracking-wide leading-tight text-white">
                  {cleanOrgName(settings.org, 'Eldorado Ganeshotsava 2026')}
                </h1>
                <span className="text-[10px] bg-amber-400 text-stone-950 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                  Sevas
                </span>
              </div>
              <p className="text-[11px] text-amber-200 font-medium">
                Devotional Seva Bookings &amp; Pooja Offerings Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Share Portal Button */}
            <button
              onClick={() => setShareModalOpen(true)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              title="Share Seva Portal Link via WhatsApp or QR Code"
            >
              <Share2 className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Share</span>
            </button>

            {/* Devotee Receipts Quick Link */}
            <button
              onClick={onNavigateToReceipts}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-400 text-stone-950 hover:bg-amber-300 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Switch to Public Devotee Receipts Portal"
            >
              <FileText className="w-3.5 h-3.5 text-[#991B1B]" />
              <span className="hidden sm:inline">Devotee Receipts</span>
              <span className="sm:hidden">Receipts</span>
            </button>

            {/* Return to Festival Home */}
            <button
              onClick={onNavigateToGaneshotsava}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              title="Return to Festival Management & Financial Portal"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Festival Ledger</span>
            </button>

            {/* Admin Unlock / Status Badge */}
            {isAdmin ? (
              <span className="bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 text-[11px] px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span className="hidden lg:inline">Admin Active</span>
              </span>
            ) : (
              <button
                onClick={() => setAdminAuthModalOpen(true)}
                className="text-[11px] text-amber-200/80 hover:text-amber-100 hover:underline inline-flex items-center gap-1 cursor-pointer px-1.5 py-1"
                title="Admin Sign In"
              >
                <Lock className="w-3 h-3" />
                <span className="hidden md:inline">Admin Login</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto w-full px-4 py-6 sm:py-8 space-y-8 flex-1">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-amber-600/15 border border-amber-300 rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="max-w-3xl space-y-3 relative z-10">
            <div className="inline-flex items-center gap-2 bg-[#991B1B] text-amber-200 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-2xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Devotional Seva Bookings Open</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-black text-stone-900 tracking-tight leading-snug">
              Offer Your Family's Devotional Seva to Lord Sri Ganesha
            </h2>
            <p className="text-sm text-stone-600 leading-relaxed">
              Book your Sankalpa Pooja, Maha Ganapati Abhishekam, Modaka Naivedya, and Archana for Sri Ganeshotsava 2026. Devotees can register their seva details and instantly receive their booking token.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <button
                onClick={() => setBookingModal({ open: true, item: null })}
                className="px-5 py-2.5 rounded-xl bg-[#991B1B] hover:bg-[#7F1D1D] text-white font-bold text-sm inline-flex items-center gap-2 transition-transform active:scale-95 shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Book a Devotional Seva Now</span>
              </button>
            </div>
          </div>
        </div>

        {/* Available Seva Catalogue */}
        <section id="seva-catalogue-section" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-3">
            <div>
              <h3 className="text-xl font-serif font-bold text-[#1A1A1A] flex items-center gap-2">
                <span>Available Sevas &amp; Offerings</span>
              </h3>
              <p className="text-xs text-stone-500">
                Choose an offering below to book your family pooja and receive an instant token.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCatModal({ open: true, item: null })}
                className="text-xs font-bold text-[#991B1B] hover:text-[#7F1D1D] bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg inline-flex items-center gap-1 cursor-pointer transition-colors"
                title="Devotees can suggest or add a new seva offering"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Suggest New Seva</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {catalogue.map(item => {
              const stats = getSevaStats(item);

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-3 relative group"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-stone-900 text-sm leading-snug">
                          {item.name}
                        </h4>
                        {item.unit && (
                          <span className="inline-block mt-0.5 text-[10px] font-bold text-stone-600 bg-stone-100 px-1.5 py-0.2 rounded border border-stone-200">
                            Unit: {item.unit}
                          </span>
                        )}
                      </div>

                      {/* NON-MANDATORY AMOUNT */}
                      <div>
                        {item.amt && Number(item.amt) > 0 ? (
                          <span className="font-mono font-bold text-emerald-700 text-sm whitespace-nowrap bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            ₹ {fmt(item.amt)}
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200 whitespace-nowrap">
                            In-Kind Material
                          </span>
                        )}
                      </div>
                    </div>

                    {item.desc && (
                      <p className="text-[11px] text-stone-500 line-clamp-2">
                        {item.desc}
                      </p>
                    )}

                    {/* TOTAL REQUIRED, BOOKED BY SPONSOR, REMAINING */}
                    {stats.hasTotal && (
                      <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-2.5 space-y-1.5 text-xs">
                        <div className="grid grid-cols-3 gap-1 text-[11px] font-mono text-center">
                          <div className="bg-white/80 p-1 rounded border border-amber-100">
                            <span className="text-[9px] text-stone-500 font-sans block uppercase">Total Req</span>
                            <span className="font-bold text-stone-800">{stats.totalReq} {item.unit}</span>
                          </div>
                          <div className="bg-white/80 p-1 rounded border border-amber-100">
                            <span className="text-[9px] text-stone-500 font-sans block uppercase">Booked</span>
                            <span className="font-bold text-stone-900">{stats.bookedQty} {item.unit}</span>
                          </div>
                          <div className="bg-white/80 p-1 rounded border border-amber-100">
                            <span className="text-[9px] text-stone-500 font-sans block uppercase">Remaining</span>
                            <span className={`font-bold ${stats.isFulfilled ? 'text-emerald-700' : 'text-amber-800'}`}>
                              {stats.remainingQty} {item.unit}
                            </span>
                          </div>
                        </div>

                        <div className="text-center pt-0.5">
                          {stats.isFulfilled ? (
                            <span className="text-emerald-800 font-bold text-[11px] inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Requirement Fulfilled! Additional sponsors welcome</span>
                            </span>
                          ) : (
                            <span className="text-amber-900 font-bold text-[11px] inline-flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-700" />
                              <span>{stats.remainingQty} {item.unit} more needed</span>
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setSelectedSevaName(item.name);
                        const suggestedQty = stats.remainingQty && stats.remainingQty > 0 ? Math.min(10, stats.remainingQty) : 1;
                        setBookingModal({
                          open: true,
                          item: null,
                          initialSeva: item.name,
                          initialQty: suggestedQty,
                          initialAmt: item.amt || 0
                        });
                      }}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-[#991B1B] hover:bg-[#7F1D1D] text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Sponsor Seva</span>
                    </button>

                    <button
                      onClick={() => setCatModal({ open: true, item })}
                      className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg cursor-pointer"
                      title="Modify Seva Offering"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          if (confirm(`Delete catalogue item "${item.name}"?`)) {
                            onDeleteCatalogue(item.id);
                          }
                        }}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                        title="Delete Catalogue Item (Admin Only)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Seva Bookings Directory */}
        <section className="space-y-4 pt-2">
          <div className="bg-white border border-stone-200 rounded-xl shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-serif font-bold text-stone-900">
                  Devotee Seva Bookings
                </h3>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Status Filter */}
                <div className="inline-flex rounded-lg bg-stone-100 p-0.5 text-xs">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                      statusFilter === 'all'
                        ? 'bg-white shadow-xs text-stone-900 font-bold'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    All ({sevas.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('booked')}
                    className={`px-3 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                      statusFilter === 'booked'
                        ? 'bg-amber-500 text-white shadow-xs font-bold'
                        : 'text-amber-800 hover:text-amber-900'
                    }`}
                  >
                    Booked ({bookedCount})
                  </button>
                  <button
                    onClick={() => setStatusFilter('confirmed')}
                    className={`px-3 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                      statusFilter === 'confirmed'
                        ? 'bg-emerald-600 text-white shadow-xs font-bold'
                        : 'text-emerald-800 hover:text-emerald-900'
                    }`}
                  >
                    Confirmed ({confirmedCount})
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Search flat, devotee name, token…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="border border-stone-300 rounded-lg pl-8 pr-3 py-1.5 text-xs bg-stone-50 focus:bg-white outline-none focus:border-[#991B1B] w-56 sm:w-64"
                  />
                </div>
              </div>
            </div>

            {/* Bookings Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#FDF8F3] border-b border-stone-200 text-[10px] font-bold text-stone-500 uppercase tracking-[0.15em]">
                    <th className="py-3 px-4">Token No</th>
                    <th className="py-3 px-4">Devotee / Resident</th>
                    <th className="py-3 px-4">Flat No</th>
                    <th className="py-3 px-4">Seva Offering</th>
                    <th className="py-3 px-3 text-center">Quantity Sponsored</th>
                    <th className="py-3 px-4 text-right">Amount (₹)</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-stone-400 text-xs">
                        No seva bookings found matching your search. Click "Book Seva" above to register an offering.
                      </td>
                    </tr>
                  ) : (
                    filtered.map(b => {
                      const isConfirmed = b.status === 'Confirmed';
                      const matchedCat = catalogue.find(
                        c => (c.name || '').trim().toLowerCase() === (b.seva || '').trim().toLowerCase()
                      );
                      const unitDisplay = b.unit || matchedCat?.unit || '';

                      return (
                        <tr key={b.id} className="hover:bg-stone-50/60 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-stone-900">
                            {b.tokNo}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-stone-900">{b.name}</div>
                            {(b.phone || b.gothra) && (
                              <div className="text-[10px] text-stone-500">
                                {b.phone && <span>📞 {b.phone} </span>}
                                {b.gothra && <span>• Gotra: {b.gothra}</span>}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="bg-stone-100 text-stone-700 text-xs font-semibold px-2 py-0.5 rounded">
                              {b.flat}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-stone-800">
                            <div>{b.seva}</div>
                            {b.notes && (
                              <div className="text-[10px] text-stone-500 truncate max-w-[180px]">
                                {b.notes}
                              </div>
                            )}
                          </td>

                          {/* QUANTITY SPONSORED */}
                          <td className="py-3 px-3 text-center font-mono">
                            <span className="bg-amber-50 text-amber-900 font-bold px-2 py-0.5 rounded border border-amber-200 text-xs inline-flex items-center gap-1">
                              <Package className="w-3 h-3 text-amber-700" />
                              <span>{b.qty || 1} {unitDisplay}</span>
                            </span>
                          </td>

                          {/* AMOUNT (NON-MANDATORY) */}
                          <td className="py-3 px-4 font-mono font-bold text-right">
                            {b.amt && Number(b.amt) > 0 ? (
                              <span className="text-emerald-700">₹ {fmt(b.amt)}</span>
                            ) : (
                              <span className="text-stone-500 text-xs font-normal italic bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200">
                                In-Kind
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-stone-600 text-xs whitespace-nowrap">
                            {fmtDate(b.date)}
                          </td>

                          {/* STATUS BADGE */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            {isConfirmed ? (
                              <span
                                className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1 shadow-2xs"
                                title={
                                  b.confirmedAt
                                    ? `Confirmed by ${b.confirmedBy || 'Admin'} on ${fmtDate(b.confirmedAt)}`
                                    : 'Confirmed by Admin Committee'
                                }
                              >
                                <CheckCircle2 className="w-3 h-3 text-emerald-700 shrink-0" />
                                <span>Confirmed</span>
                              </span>
                            ) : (
                              <span
                                className="bg-amber-100 text-amber-900 border border-amber-300 text-[11px] px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1 shadow-2xs"
                                title="Pending Admin Confirmation"
                              >
                                <Clock className="w-3 h-3 text-amber-700 shrink-0" />
                                <span>Booked (To be confirmed)</span>
                              </span>
                            )}
                          </td>

                          {/* ACTIONS */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              {/* ADMIN CONFIRM BUTTON */}
                              {isAdmin && (
                                <>
                                  {!isConfirmed ? (
                                    <button
                                      onClick={() => handleConfirmBooking(b)}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-2.5 py-1 rounded inline-flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                                      title="Confirm this seva booking as Admin"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>Confirm</span>
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleUnconfirmBooking(b)}
                                      className="bg-stone-100 hover:bg-stone-200 text-stone-600 text-[10px] font-semibold px-2 py-1 rounded transition-colors cursor-pointer"
                                      title="Revert to Booked"
                                    >
                                      Revert
                                    </button>
                                  )}
                                </>
                              )}

                              {/* View / Print Token Receipt */}
                              <button
                                onClick={() => setActiveReceiptModal(b)}
                                className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium px-2 py-1 rounded inline-flex items-center gap-1 transition-colors cursor-pointer"
                                title="View / Print Seva Token Receipt"
                              >
                                <Printer className="w-3 h-3 text-[#991B1B]" />
                                <span className="hidden sm:inline">Receipt</span>
                              </button>

                              {/* Direct Link to download PDF in /receipts portal */}
                              <a
                                href={`/receipts?q=${encodeURIComponent(b.flat || b.name || b.seva || '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-medium px-2 py-1 rounded inline-flex items-center gap-1 transition-colors cursor-pointer border border-emerald-200"
                                title="Download Official PDF Receipt in /receipts portal"
                              >
                                <Download className="w-3 h-3 text-emerald-700" />
                                <span className="hidden sm:inline">PDF</span>
                              </a>

                              {/* Devotees & Admins can modify details */}
                              <button
                                onClick={() => setBookingModal({ open: true, item: b })}
                                className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded cursor-pointer"
                                title="Modify Booking Details"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* ONLY ADMIN CAN DELETE */}
                              {isAdmin && (
                                <button
                                  onClick={() => {
                                    if (confirm(`Delete seva booking ${b.tokNo} for ${b.name}?`)) {
                                      onDeleteBooking(b.id);
                                      showToast(`Deleted booking ${b.tokNo}`);
                                    }
                                  }}
                                  className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded cursor-pointer"
                                  title="Delete Booking (Admin Only)"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      {/* Add / Edit Seva Booking Modal */}
      {bookingModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={e => {
              e.preventDefault();
              const form = e.currentTarget;
              const tokNo = (form.elements.namedItem('tokNo') as HTMLInputElement).value.trim();
              const seva = (form.elements.namedItem('seva') as HTMLSelectElement).value;
              const name = (form.elements.namedItem('name') as HTMLInputElement).value.trim();
              const flat = (form.elements.namedItem('flat') as HTMLInputElement).value.trim();
              const phone = (form.elements.namedItem('phone') as HTMLInputElement)?.value.trim() || '';
              const qty = parseFloat((form.elements.namedItem('qty') as HTMLInputElement)?.value) || 1;
              const amtRaw = (form.elements.namedItem('amt') as HTMLInputElement).value;
              const amt = amtRaw ? parseFloat(amtRaw) || 0 : 0;
              const date = (form.elements.namedItem('date') as HTMLInputElement).value;
              const notes = (form.elements.namedItem('notes') as HTMLInputElement).value.trim();

              // When adding or devotee registering, status is always 'Booked' (Pending Admin Confirmation)
              const finalStatus: 'Booked' | 'Confirmed' = bookingModal.item ? (bookingModal.item.status || 'Booked') : 'Booked';

              if (!name) return alert('Please enter devotee name.');
              if (!flat) return alert('Please enter flat number.');

              const matchedCat = catalogue.find(c => c.name === seva);

              const row: SevaBooking = {
                id: bookingModal.item?.id || Date.now().toString(),
                tokNo: tokNo || getNextTokNo(),
                seva,
                name,
                flat,
                qty,
                unit: matchedCat?.unit,
                amt,
                date: date || today(),
                phone: phone || undefined,
                gothra: bookingModal.item?.gothra || undefined,
                nakshatra: bookingModal.item?.nakshatra || undefined,
                notes: notes || undefined,
                status: finalStatus,
                createdBy: bookingModal.item?.createdBy || (isAdmin ? 'admin' : 'devotee/public'),
                confirmedBy: finalStatus === 'Confirmed' ? (bookingModal.item?.confirmedBy || 'Admin') : undefined,
                confirmedAt: finalStatus === 'Confirmed' ? (bookingModal.item?.confirmedAt || new Date().toISOString()) : undefined
              };

              onSaveBooking(row);
              setBookingModal({ open: false });
              showToast(
                isAdmin && finalStatus === 'Confirmed'
                  ? `✓ Seva Booking ${row.tokNo} saved & confirmed!`
                  : `🙏 Seva Booking registered! Token: ${row.tokNo}. Status: Booked (To be confirmed by Admin)`
              );
            }}
            className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-lg w-full p-6 space-y-4 my-8 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-xl font-serif font-bold text-[#991B1B]">
                  {bookingModal.item ? 'Modify Devotional Seva' : 'Book a Devotional Seva Offering'}
                </h3>
                <p className="text-[11px] text-stone-500">
                  {bookingModal.item
                    ? 'Update devotee and seva offering details'
                    : 'Devotee Entry: Registered as "Booked" and confirmed by Committee.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBookingModal({ open: false })}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-full hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TOKEN NO & DATE (NO CONFIRMATION STATUS OPTION) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Token No *
                </label>
                <input
                  name="tokNo"
                  defaultValue={bookingModal.item?.tokNo || getNextTokNo()}
                  required
                  className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#991B1B] font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Pooja / Seva Date
                </label>
                <input
                  name="date"
                  type="date"
                  defaultValue={bookingModal.item?.date || today()}
                  className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                Select Seva Offering *
              </label>
              <select
                name="seva"
                defaultValue={
                  bookingModal.item?.seva ||
                  bookingModal.initialSeva ||
                  catalogue[0]?.name ||
                  'Maha Ganapati Abhishekam'
                }
                onChange={e => {
                  setSelectedSevaName(e.target.value);
                  const found = catalogue.find(c => c.name === e.target.value);
                  if (found) {
                    const amtInput = (e.currentTarget.form?.elements.namedItem('amt') as HTMLInputElement);
                    if (amtInput && found.amt !== undefined) amtInput.value = found.amt > 0 ? String(found.amt) : '';
                  }
                }}
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#991B1B] bg-white font-medium"
              >
                {catalogue.map(c => (
                  <option key={c.id} value={c.name}>
                    {c.name} {c.unit ? `(${c.unit})` : ''} {c.amt && c.amt > 0 ? `— ₹ ${fmt(c.amt)}` : '— (In-Kind / Material)'}
                  </option>
                ))}
              </select>

              {/* Requirement & Availability Card */}
              {activeStats && activeStats.hasTotal && (
                <div className="mt-2 p-2.5 bg-amber-50/80 border border-amber-200 rounded-lg text-xs space-y-1">
                  <div className="flex items-center justify-between text-stone-700">
                    <span className="font-semibold text-stone-900 flex items-center gap-1">
                      <Package className="w-3.5 h-3.5 text-amber-700" />
                      Requirement Status:
                    </span>
                    <span className="font-mono text-stone-900">
                      Total Req: <strong>{activeStats.totalReq} {activeCatalogueItem?.unit}</strong>
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-amber-200/60 font-mono">
                    <span className="text-stone-600">
                      Booked by Sponsors: <strong>{activeStats.bookedQty} {activeCatalogueItem?.unit}</strong>
                    </span>
                    <span className={`font-bold ${activeStats.isFulfilled ? 'text-emerald-700' : 'text-amber-900'}`}>
                      Remaining: {activeStats.remainingQty} {activeCatalogueItem?.unit}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Devotee / Resident Name *
                </label>
                <input
                  name="name"
                  defaultValue={bookingModal.item?.name || ''}
                  required
                  placeholder="e.g. Ramesh K"
                  className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Tower &amp; Flat No *
                </label>
                <input
                  name="flat"
                  defaultValue={bookingModal.item?.flat || ''}
                  required
                  placeholder="e.g. Astra-1402"
                  className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
                />
              </div>
            </div>

            {/* PHONE / WHATSAPP (GOTRA & NAKSHATRA REMOVED) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                Phone / WhatsApp (Optional)
              </label>
              <input
                name="phone"
                defaultValue={bookingModal.item?.phone || ''}
                placeholder="e.g. 9876543210"
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
              />
            </div>

            {/* QUANTITY AND AMOUNT (NON-MANDATORY) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Quantity Sponsoring {activeCatalogueItem?.unit ? `(${activeCatalogueItem.unit})` : ''}
                </label>
                <input
                  name="qty"
                  type="number"
                  step="any"
                  min="0.1"
                  defaultValue={
                    bookingModal.item?.qty ??
                    bookingModal.initialQty ??
                    1
                  }
                  required
                  placeholder="1"
                  className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#991B1B] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Amount in ₹ (Non-Mandatory)
                </label>
                <input
                  name="amt"
                  type="number"
                  defaultValue={
                    bookingModal.item?.amt !== undefined
                      ? (bookingModal.item.amt > 0 ? bookingModal.item.amt : '')
                      : (bookingModal.initialAmt && bookingModal.initialAmt > 0 ? bookingModal.initialAmt : '')
                  }
                  placeholder="0 (Optional for in-kind)"
                  className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#991B1B] font-mono"
                />
                <span className="text-[10px] text-stone-400">Leave blank or 0 for in-kind items (rice, oil, etc.)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                Family Sankalpa / Prayer Notes (Optional)
              </label>
              <input
                name="notes"
                defaultValue={bookingModal.item?.notes || ''}
                placeholder="Family members' names or specific pooja prayer"
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setBookingModal({ open: false })}
                className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#991B1B] hover:bg-[#7F1D1D] text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg cursor-pointer shadow-xs"
              >
                Confirm Seva Booking
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Catalogue Offering Modal (Devotees can suggest/modify; NO DELETE for non-admins) */}
      {catModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={e => {
              e.preventDefault();
              const form = e.currentTarget;
              const name = (form.elements.namedItem('name') as HTMLInputElement).value.trim();
              const unit = (form.elements.namedItem('unit') as HTMLInputElement)?.value.trim() || undefined;
              const totalRequiredRaw = (form.elements.namedItem('totalRequired') as HTMLInputElement)?.value;
              const totalRequired = totalRequiredRaw ? parseFloat(totalRequiredRaw) || undefined : undefined;
              const amtRaw = (form.elements.namedItem('amt') as HTMLInputElement).value;
              const amt = amtRaw ? parseFloat(amtRaw) || 0 : 0;
              const desc = (form.elements.namedItem('desc') as HTMLInputElement)?.value.trim() || undefined;

              if (!name) return alert('Please enter seva / item name.');

              onSaveCatalogue({
                id: catModal.item?.id || Date.now().toString(),
                name,
                unit,
                totalRequired,
                amt,
                desc
              });
              setCatModal({ open: false });
              showToast(`Seva offering "${name}" saved!`);
            }}
            className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-md w-full p-6 space-y-4 my-8 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-lg font-serif font-bold text-[#991B1B]">
                  {catModal.item ? 'Modify Seva Offering' : 'Suggest Seva Offering'}
                </h3>
                <p className="text-[11px] text-stone-500">
                  Configure seva offerings, pooja materials, required quantities, and amounts.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCatModal({ open: false })}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                Seva / Item Name *
              </label>
              <input
                name="name"
                defaultValue={catModal.item?.name || ''}
                required
                placeholder="e.g. Rice (Sona Masoori), Maha Pooja, Ghee"
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Unit / Measure
                </label>
                <input
                  name="unit"
                  defaultValue={catModal.item?.unit || ''}
                  placeholder="e.g. kg, Bags, Litres, Cans"
                  className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Total Required
                </label>
                <input
                  name="totalRequired"
                  type="number"
                  step="any"
                  defaultValue={catModal.item?.totalRequired ?? ''}
                  placeholder="e.g. 50"
                  className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#991B1B] font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                Suggested Contribution in ₹ (Non-Mandatory)
              </label>
              <input
                name="amt"
                type="number"
                defaultValue={catModal.item?.amt !== undefined && catModal.item.amt > 0 ? catModal.item.amt : ''}
                placeholder="Optional (Leave blank or 0 for in-kind items)"
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#991B1B] font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                Description / Pooja Specifics (Optional)
              </label>
              <input
                name="desc"
                defaultValue={catModal.item?.desc || ''}
                placeholder="e.g. 25kg bags required for daily Mahaprasada anna santarpana"
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setCatModal({ open: false })}
                className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#991B1B] hover:bg-[#7F1D1D] text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg cursor-pointer"
              >
                Save Offering
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Seva Token Receipt Modal */}
      {activeReceiptModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-md w-full p-6 space-y-5 relative my-8 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setActiveReceiptModal(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1.5 rounded-full hover:bg-stone-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Printable Area */}
            <div id="seva-printable-token" className="border-2 border-amber-300 bg-amber-50/40 rounded-xl p-5 space-y-4">
              <div className="text-center border-b border-amber-200 pb-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-amber-400 text-[#991B1B] flex items-center justify-center p-1 shadow-inner border border-amber-300 mb-2">
                  <img
                    src={settings.logo || '/lord_ganesha.svg'}
                    alt="Lord Ganesha"
                    className="w-full h-full object-contain rounded-full"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <h4 className="font-serif font-black text-stone-900 text-base leading-tight">
                  {cleanOrgName(settings.org, 'Eldorado Ganeshotsava 2026')}
                </h4>
                <p className="text-[11px] text-stone-600">{settings.location || 'Aerospace Park, Bagalur, Bangalore'}</p>
                <div className="mt-2 inline-block bg-[#991B1B] text-amber-200 font-bold uppercase text-[10px] tracking-widest px-2.5 py-0.5 rounded">
                  Devotional Seva Booking Token
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-amber-100">
                  <span className="text-stone-500 font-bold uppercase text-[10px]">Token No</span>
                  <span className="font-mono font-black text-stone-900 text-sm">{activeReceiptModal.tokNo}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-amber-100">
                  <span className="text-stone-500 font-bold uppercase text-[10px]">Pooja / Seva</span>
                  <span className="font-bold text-[#991B1B] text-right">{activeReceiptModal.seva}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-amber-100">
                  <span className="text-stone-500 font-bold uppercase text-[10px]">Devotee Name</span>
                  <span className="font-semibold text-stone-900">{activeReceiptModal.name}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-amber-100">
                  <span className="text-stone-500 font-bold uppercase text-[10px]">Flat / Unit</span>
                  <span className="font-semibold text-stone-900">{activeReceiptModal.flat}</span>
                </div>
                {activeReceiptModal.gothra && (
                  <div className="flex justify-between items-center py-1 border-b border-amber-100">
                    <span className="text-stone-500 font-bold uppercase text-[10px]">Gotra</span>
                    <span className="font-medium text-stone-800">{activeReceiptModal.gothra}</span>
                  </div>
                )}
                {activeReceiptModal.qty && (
                  <div className="flex justify-between items-center py-1 border-b border-amber-100">
                    <span className="text-stone-500 font-bold uppercase text-[10px]">Quantity Sponsored</span>
                    <span className="font-mono font-bold text-stone-900">
                      {activeReceiptModal.qty} {activeReceiptModal.unit || ''}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center py-1 border-b border-amber-100">
                  <span className="text-stone-500 font-bold uppercase text-[10px]">Amount Contributed</span>
                  <span className="font-mono font-black text-emerald-800 text-base">
                    {activeReceiptModal.amt && Number(activeReceiptModal.amt) > 0 ? (
                      `₹ ${fmt(activeReceiptModal.amt)}`
                    ) : (
                      <span className="text-stone-600 text-xs font-medium">In-Kind Material Offering</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-amber-100">
                  <span className="text-stone-500 font-bold uppercase text-[10px]">Date of Seva</span>
                  <span className="font-medium text-stone-800">{fmtDate(activeReceiptModal.date)}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-stone-500 font-bold uppercase text-[10px]">Status</span>
                  {activeReceiptModal.status === 'Confirmed' ? (
                    <span className="bg-emerald-100 text-emerald-900 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-300 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                      <span>Confirmed by Admin</span>
                    </span>
                  ) : (
                    <span className="bg-amber-100 text-amber-900 text-[11px] font-bold px-2 py-0.5 rounded-full border border-amber-300 inline-flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-700" />
                      <span>Booked (To be confirmed)</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="text-center text-[10px] text-stone-500 pt-2 border-t border-amber-200">
                May Lord Sri Ganesha shower happiness, health &amp; prosperity on your family. 🙏
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <a
                href={`/receipts?q=${encodeURIComponent(activeReceiptModal.flat || activeReceiptModal.name || activeReceiptModal.seva || '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF Receipt</span>
              </a>

              <button
                onClick={() => window.print()}
                className="py-2.5 px-3 rounded-xl bg-[#991B1B] hover:bg-[#7F1D1D] text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Print</span>
              </button>

              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `🙏 *Sri Ganeshotsava 2026 - Seva Token Receipt*\n\nToken No: ${activeReceiptModal.tokNo}\nDevotee: ${activeReceiptModal.name} (${activeReceiptModal.flat})\nSeva: ${activeReceiptModal.seva}\nAmount: ${activeReceiptModal.amt && Number(activeReceiptModal.amt) > 0 ? `₹${fmt(activeReceiptModal.amt)}` : 'In-Kind Material Offering'}\nStatus: ${activeReceiptModal.status === 'Confirmed' ? '✓ Confirmed by Committee' : '⏳ Booked (Pending Confirmation)'}\n\n👉 *Download Official PDF Receipt:*\n${typeof window !== 'undefined' ? window.location.origin : ''}/receipts?q=${encodeURIComponent(activeReceiptModal.flat || activeReceiptModal.name || activeReceiptModal.seva || '')}\n\nMay Lord Sri Ganesha bless your family! 🌺`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                title="Share Token Receipt on WhatsApp"
              >
                <PhoneCall className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Admin Unlock Modal */}
      {adminAuthModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAdminAuthSubmit}
            className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-sm w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#991B1B]" />
                <h3 className="text-lg font-serif font-bold text-stone-900">Admin Committee Access</h3>
              </div>
              <button
                type="button"
                onClick={() => setAdminAuthModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-stone-600">
              Enter the Admin Passcode to confirm seva bookings and manage entries.
            </p>
            {adminError && (
              <p className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                {adminError}
              </p>
            )}
            <input
              type="password"
              placeholder="Admin Passcode"
              value={adminPassInput}
              onChange={e => setAdminPassInput(e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
              autoFocus
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAdminAuthModalOpen(false)}
                className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#991B1B] hover:bg-[#7F1D1D] text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg cursor-pointer"
              >
                Unlock Admin
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Share Seva Portal Modal */}
      <ShareSevaPortalModal
        open={shareModalOpen}
        settings={settings}
        onClose={() => setShareModalOpen(false)}
        onUpdateSettings={onUpdateSettings}
      />
    </div>
  );
};
