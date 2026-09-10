import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Download,
  Printer,
  FileText,
  CheckCircle2,
  Share2,
  Copy,
  X,
  PhoneCall,
  Sparkles,
  Loader2,
  ShieldCheck,
  Building2,
  User,
  Calendar,
  CreditCard,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Clock,
  Package,
  HeartHandshake,
  Tag
} from 'lucide-react';
import { Contribution, SevaBooking, AppSettings } from '../types';
import { fmt, fmtDate, numWords, today, cleanOrgName } from '../utils/helpers';
import { GaneshaWatermark } from './GaneshaWatermark';
import { DigitalSignatureBlock } from './ReceiptInvoiceModal';
import {
  generateReceiptPdfBlob,
  downloadBlobAsFile,
  getBulkIndividualReceiptFilename,
  triggerReceiptDirectPrint,
  getReceiptDocumentTitle
} from '../utils/pdfGenerator';

export type ReceiptRecordType = 'contribution' | 'seva';

export interface UnifiedReceiptItem {
  id: string;
  recordType: ReceiptRecordType;
  rcptNo: string; // rcptNo for contribution, tokNo for seva
  name: string;
  flat: string;
  amt: number;
  date: string;
  pay?: string;
  txn?: string;
  notes?: string;
  // Seva specific fields
  seva?: string;
  qty?: number;
  unit?: string;
  status?: 'Booked' | 'Confirmed';
  gothra?: string;
  nakshatra?: string;
  phone?: string;
  rawItem: Contribution | SevaBooking;
}

interface PublicReceiptPortalProps {
  contributions: Contribution[];
  sevas?: SevaBooking[];
  settings: AppSettings;
  onBackToApp?: () => void;
  onBackToHome?: () => void;
}

export const PublicReceiptPortal: React.FC<PublicReceiptPortalProps> = ({
  contributions,
  sevas = [],
  settings,
  onBackToApp,
  onBackToHome
}) => {
  // Read initial search query from URL parameter if provided (e.g. ?q=A-101 or ?flat=A-101 or ?name=... or ?seva=...)
  const [search, setSearch] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return (
        params.get('q') ||
        params.get('flat') ||
        params.get('name') ||
        params.get('seva') ||
        params.get('rcpt') ||
        params.get('tok') ||
        params.get('token') ||
        ''
      );
    }
    return '';
  });

  // Filter tab: 'all' | 'contribution' | 'seva'
  const [filterType, setFilterType] = useState<'all' | 'contribution' | 'seva'>('all');

  const [activeReceiptForModal, setActiveReceiptForModal] = useState<UnifiedReceiptItem | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Hidden print element ref for background PDF generation
  const offscreenReceiptRef = useRef<HTMLDivElement>(null);
  const modalReceiptRef = useRef<HTMLDivElement>(null);
  const [offscreenItem, setOffscreenItem] = useState<UnifiedReceiptItem | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input on mount if empty
  useEffect(() => {
    if (!search && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Normalization helper for flat number & keyword matching (e.g. matches "a101" to "A-101", etc.)
  const cleanStr = (s?: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  const normalizedQuery = cleanStr(search);
  const trimmedSearch = search.trim().toLowerCase();

  // Unified list of all receipts (contributions + sevas)
  const allReceiptItems = useMemo<UnifiedReceiptItem[]>(() => {
    const list: UnifiedReceiptItem[] = [];

    // Voluntary contributions
    (contributions || []).forEach(c => {
      list.push({
        id: c.id,
        recordType: 'contribution',
        rcptNo: c.rcptNo || '',
        name: c.name || '',
        flat: c.flat || '',
        amt: Number(c.amt) || 0,
        date: c.date || today(),
        pay: c.pay,
        txn: c.txn,
        notes: c.notes,
        rawItem: c
      });
    });

    // Seva bookings
    (sevas || []).forEach(s => {
      list.push({
        id: s.id,
        recordType: 'seva',
        rcptNo: s.tokNo || '',
        name: s.name || '',
        flat: s.flat || '',
        amt: Number(s.amt) || 0,
        date: s.date || today(),
        pay: 'Seva Devotional Offering',
        notes: s.notes,
        seva: s.seva,
        qty: s.qty,
        unit: s.unit,
        status: s.status || 'Booked',
        gothra: s.gothra,
        nakshatra: s.nakshatra,
        phone: s.phone,
        rawItem: s
      });
    });

    return list;
  }, [contributions, sevas]);

  // Unique list of sevas for suggestion chips
  const sevaSuggestions = useMemo(() => {
    const set = new Set<string>();
    (sevas || []).forEach(s => {
      if (s.seva && s.seva.trim()) set.add(s.seva.trim());
    });
    return Array.from(set).slice(0, 4);
  }, [sevas]);

  // Filter receipts based on Flat, Devotee Name, Seva Name, Receipt/Token No, or Notes
  const filteredReceipts = useMemo(() => {
    if (!trimmedSearch) return [];

    return allReceiptItems.filter(item => {
      // Filter tab check
      if (filterType !== 'all' && item.recordType !== filterType) {
        return false;
      }

      // 1. Flat match (both raw and normalized)
      const flatRaw = (item.flat || '').toLowerCase();
      const flatClean = cleanStr(item.flat);
      if (flatRaw.includes(trimmedSearch) || (normalizedQuery && flatClean.includes(normalizedQuery))) {
        return true;
      }

      // 2. Devotee / Contributor Name match
      const nameRaw = (item.name || '').toLowerCase();
      if (nameRaw.includes(trimmedSearch)) {
        return true;
      }

      // 3. Seva Name match (Devotional seva offering e.g. "Maha Ganapati Pooja", "Flower", "Rice", "Modak")
      if (item.recordType === 'seva' && item.seva) {
        const sevaRaw = item.seva.toLowerCase();
        if (sevaRaw.includes(trimmedSearch)) {
          return true;
        }
      }

      // 4. Receipt Number or Token Number match
      const rcptRaw = (item.rcptNo || '').toLowerCase();
      if (rcptRaw.includes(trimmedSearch) || (normalizedQuery && cleanStr(item.rcptNo).includes(normalizedQuery))) {
        return true;
      }

      // 5. Transaction ID match (if present)
      const txnRaw = (item.txn || '').toLowerCase();
      if (txnRaw && txnRaw.includes(trimmedSearch)) {
        return true;
      }

      // 6. Notes / Sankalpa match
      const notesRaw = (item.notes || '').toLowerCase();
      if (notesRaw && notesRaw.includes(trimmedSearch)) {
        return true;
      }

      // 7. Gotra match
      if (item.gothra && item.gothra.toLowerCase().includes(trimmedSearch)) {
        return true;
      }

      return false;
    });
  }, [allReceiptItems, trimmedSearch, normalizedQuery, filterType]);

  // Sub-counts for the current search
  const totalMatches = filteredReceipts.length;
  const contributionMatches = useMemo(
    () => filteredReceipts.filter(i => i.recordType === 'contribution').length,
    [filteredReceipts]
  );
  const sevaMatches = useMemo(
    () => filteredReceipts.filter(i => i.recordType === 'seva').length,
    [filteredReceipts]
  );

  // Direct PDF Download Handler
  const handleDownloadPdf = async (item: UnifiedReceiptItem) => {
    try {
      setDownloadingId(item.id);

      // If this receipt is already open in the modal, capture the active modal element directly
      let targetElement: HTMLElement | null = null;
      if (activeReceiptForModal && activeReceiptForModal.id === item.id && modalReceiptRef.current) {
        targetElement = modalReceiptRef.current;
      } else {
        setOffscreenItem(item);
        // Allow DOM to mount the receipt container completely
        await new Promise(resolve => setTimeout(resolve, 120));
        targetElement = offscreenReceiptRef.current;
      }

      if (!targetElement) {
        throw new Error('Receipt render container is not ready.');
      }

      const blob = await generateReceiptPdfBlob(targetElement, { scale: 2.2, quality: 0.96 });
      const filename = getBulkIndividualReceiptFilename({
        flat: item.flat,
        name: item.name,
        rcptNo: item.rcptNo,
        tokNo: item.recordType === 'seva' ? item.rcptNo : undefined,
        seva: item.seva,
        recordType: item.recordType
      });
      downloadBlobAsFile(blob, filename);

      showToast(`Receipt downloaded as "${filename}"`);
    } catch (err: any) {
      console.error('Failed to download receipt PDF:', err);
      alert('Failed to generate PDF. Please try again or click "Print" to print or save directly as PDF.');
    } finally {
      setDownloadingId(null);
      setOffscreenItem(null);
    }
  };

  // Copy direct link for a specific receipt / seva
  const handleCopyDirectLink = (item: UnifiedReceiptItem) => {
    try {
      const query = encodeURIComponent(item.flat || item.name || item.seva || item.rcptNo || '');
      const baseUrl = settings.customReceiptPortalUrl || `${window.location.origin}/receipts`;
      const separator = baseUrl.includes('?') ? '&' : '?';
      const fullUrl = `${baseUrl}${separator}q=${query}`;

      navigator.clipboard.writeText(fullUrl);
      showToast(`Direct receipt link copied! You can share this with ${item.name || item.flat || item.seva}.`);
    } catch (err) {
      console.error('Failed to copy direct receipt link', err);
    }
  };

  // Share receipt via WhatsApp
  const handleShareWhatsApp = (item: UnifiedReceiptItem) => {
    const isSeva = item.recordType === 'seva';
    const query = encodeURIComponent(item.flat || item.name || item.seva || item.rcptNo || '');
    const baseUrl = settings.customReceiptPortalUrl || `${window.location.origin}/receipts`;
    const separator = baseUrl.includes('?') ? '&' : '?';
    const portalUrl = `${baseUrl}${separator}q=${query}`;

    let text = '';
    if (isSeva) {
      text = `🙏 *Sri Ganeshotsava 2026 - Seva Token / Receipt*\n*${cleanOrgName(settings.org, 'Eldorado Residents Association')}*\n\n📜 *Token No:* ${item.rcptNo || '—'}\n🌺 *Seva Offering:* ${item.seva || 'Devotional Seva'}\n👤 *Devotee:* ${item.name}\n🏠 *Flat / Unit:* ${item.flat || '—'}\n${item.qty ? `📦 *Quantity:* ${item.qty} ${item.unit || ''}\n` : ''}${item.amt > 0 ? `💰 *Amount:* ₹${fmt(item.amt)} (${numWords(item.amt)} Rupees)\n` : '🌸 *Offering:* In-Kind Material Offering\n'}📅 *Date:* ${fmtDate(item.date)}\n✨ *Status:* ${item.status === 'Confirmed' ? '✓ Confirmed by Committee' : '⏳ Booked (To be confirmed)'}\n\n👉 *Download Official PDF Receipt Online:*\n${portalUrl}\n\n*May Lord Sri Ganesha Bless You & Your Family!* 🌺`;
    } else {
      text = `🙏 *Sri Ganeshotsava 2026 - Voluntary Contribution Receipt*\n*${cleanOrgName(settings.org, 'Eldorado Residents Association')}*\n\n📜 *Receipt No:* ${item.rcptNo || '—'}\n👤 *Devotee:* ${item.name}\n🏠 *Flat / Unit:* ${item.flat || '—'}\n💰 *Amount:* ₹${fmt(item.amt)} (${numWords(item.amt)} Rupees)\n📅 *Date:* ${fmtDate(item.date)}\n\n👉 *Download Official PDF Receipt Online:*\n${portalUrl}\n\n*Ganapati Bappa Morya!* 🌺`;
    }

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Direct print function - isolated receipt A4 output
  const handleDirectPrintModal = () => {
    const el = modalReceiptRef.current || document.getElementById('portal-modal-receipt-target') || document.getElementById('receipt-print-target');
    if (el && activeReceiptForModal) {
      const isRcpt = activeReceiptForModal.recordType !== 'invoice';
      const docTitle = getReceiptDocumentTitle(
        isRcpt,
        activeReceiptForModal.rcptNo,
        activeReceiptForModal.flat,
        activeReceiptForModal.recordType === 'seva'
      );
      triggerReceiptDirectPrint(el, docTitle);
      return;
    }
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#FDF8F3] text-stone-900 flex flex-col font-sans selection:bg-[#991B1B] selection:text-white">
      {/* 1. PUBLIC PORTAL HEADER */}
      <header className="bg-gradient-to-r from-[#7F1D1D] via-[#991B1B] to-[#7F1D1D] text-white shadow-md border-b-4 border-amber-400">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {settings.logo ? (
                <img
                  src={settings.logo}
                  alt="Logo"
                  className="w-12 h-12 object-contain rounded bg-white/10 p-0.5 border border-white/20 shrink-0 shadow-inner"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-amber-400 text-[#991B1B] flex items-center justify-center p-1 shadow-inner shrink-0 overflow-hidden border border-amber-300">
                  <img
                    src="/lord_ganesha.svg"
                    alt="Lord Sri Ganesha"
                    className="w-full h-full object-contain rounded-full"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded border border-amber-300/30">
                    Official Devotee Portal
                  </span>
                  <span className="text-xs text-amber-200/90 font-serif">Ganeshotsava 2026</span>
                </div>
                <h1 className="text-lg sm:text-xl font-serif font-black tracking-wide leading-tight truncate mt-0.5">
                  {cleanOrgName(settings.org, 'Eldorado Residents Association')}
                </h1>
                <p className="text-xs text-amber-100/80 truncate">
                  Voluntary Contribution &amp; Seva Booking Receipt Download
                </p>
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center gap-2">
              {onBackToHome && (
                <button
                  type="button"
                  onClick={onBackToHome}
                  className="bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition-colors shrink-0 border border-white/20 cursor-pointer"
                  title="Return to Community Celebrations Home"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Celebrations Home</span>
                </button>
              )}

              {onBackToApp && (
                <button
                  type="button"
                  onClick={onBackToApp}
                  className="bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition-colors shrink-0 shadow-xs cursor-pointer"
                  title="Return to management portal"
                >
                  <span className="hidden sm:inline">Management</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 2. MAIN SEARCH AREA */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Divine Intro Banner */}
        <div className="bg-white border border-stone-200/80 rounded-2xl p-6 sm:p-7 shadow-sm relative overflow-hidden text-center">
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-amber-100/50 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-red-100/40 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200/80 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Official E-Receipts &amp; Seva Tokens with Lord Ganesha Blessing</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-serif font-black text-[#991B1B]">
              Find &amp; Download Your Voluntary &amp; Seva Receipts
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Enter your <strong className="text-stone-900">Flat Number</strong> (e.g.{' '}
              <code className="bg-stone-100 px-1 py-0.5 rounded text-[#991B1B] font-mono font-bold">A-101</code>),{' '}
              <strong className="text-stone-900">Devotee Name</strong>, or{' '}
              <strong className="text-stone-900">Seva Name</strong> (e.g.{' '}
              <code className="bg-stone-100 px-1 py-0.5 rounded text-[#991B1B] font-mono">Pooja</code>,{' '}
              <code className="bg-stone-100 px-1 py-0.5 rounded text-[#991B1B] font-mono">Modaka</code>,{' '}
              <code className="bg-stone-100 px-1 py-0.5 rounded text-[#991B1B] font-mono">Rice</code>) below to search
              and download your official PDF receipt.
            </p>

            {/* Prominent Search Input Box */}
            <div className="pt-2">
              <div className="relative max-w-xl mx-auto">
                <Search className="w-5 h-5 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by Flat No (e.g. A-101), Name, or Seva Name (e.g. Pooja, Modaka)..."
                  className="w-full pl-12 pr-12 py-3.5 rounded-xl border-2 border-stone-300 bg-stone-50/70 focus:bg-white text-sm sm:text-base font-medium outline-none focus:border-[#991B1B] focus:ring-4 focus:ring-red-100 shadow-inner transition-all"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1.5 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Helper Tips & Suggestions */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 text-[11px] text-stone-500">
              <span className="font-semibold text-stone-700">Quick suggestions:</span>
              <button
                type="button"
                onClick={() => setSearch('101')}
                className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-2 py-0.5 rounded-md cursor-pointer transition-colors border border-stone-200"
              >
                101
              </button>
              <button
                type="button"
                onClick={() => setSearch('202')}
                className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-2 py-0.5 rounded-md cursor-pointer transition-colors border border-stone-200"
              >
                202
              </button>
              {sevaSuggestions.map(sevaName => (
                <button
                  key={sevaName}
                  type="button"
                  onClick={() => setSearch(sevaName)}
                  className="bg-amber-50 hover:bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md cursor-pointer transition-colors border border-amber-200/80 inline-flex items-center gap-1"
                >
                  <span>🌺</span>
                  <span>{sevaName}</span>
                </button>
              ))}
              <span className="text-stone-400 ml-1">
                • Total: {contributions.length} Contributions • {sevas.length} Sevas
              </span>
            </div>
          </div>
        </div>

        {/* 3. SEARCH RESULTS SECTION */}
        <div className="space-y-4">
          {/* Case A: Search input is empty */}
          {!trimmedSearch && (
            <div className="bg-white border border-dashed border-stone-300 rounded-xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto text-xl">
                🔍
              </div>
              <h3 className="text-sm font-bold text-stone-800">Awaiting Your Search Query</h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                Please enter your flat number (e.g.{' '}
                <span className="font-mono font-bold text-stone-700">A-101</span>), your devotee name, or a seva name
                above to look up and download your official receipt.
              </p>
            </div>
          )}

          {/* Case B: Search entered but no results found */}
          {trimmedSearch && filteredReceipts.length === 0 && (
            <div className="bg-white border border-stone-200 rounded-xl p-8 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-red-50 text-[#991B1B] flex items-center justify-center mx-auto text-xl">
                ⚠️
              </div>
              <h3 className="text-base font-serif font-bold text-stone-900">
                No Record Found for "{search}"
              </h3>
              <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
                We could not find any voluntary contribution or seva booking matching that flat number, name, or seva.
                Please double-check your spelling, or try searching by just the number (e.g.{' '}
                <span className="font-mono font-bold text-stone-800">402</span> instead of{' '}
                <span className="font-mono text-stone-600">Tower-2 402</span>), or try searching by Seva name (e.g.{' '}
                <span className="font-mono font-bold text-stone-800">Pooja</span>).
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="text-xs text-[#991B1B] hover:text-[#7F1D1D] font-bold underline cursor-pointer"
                >
                  Clear search and try again
                </button>
              </div>
            </div>
          )}

          {/* Case C: Matching Results Found */}
          {trimmedSearch && filteredReceipts.length > 0 && (
            <div className="space-y-3">
              {/* Category Filter Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFilterType('all')}
                    className={`text-xs font-semibold px-3 py-1 rounded-full cursor-pointer transition-colors ${
                      filterType === 'all'
                        ? 'bg-[#991B1B] text-white shadow-xs'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    All Results ({filteredReceipts.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('contribution')}
                    className={`text-xs font-semibold px-3 py-1 rounded-full cursor-pointer transition-colors ${
                      filterType === 'contribution'
                        ? 'bg-[#991B1B] text-white shadow-xs'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    Voluntary ({contributionMatches})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('seva')}
                    className={`text-xs font-semibold px-3 py-1 rounded-full cursor-pointer transition-colors ${
                      filterType === 'seva'
                        ? 'bg-[#991B1B] text-white shadow-xs'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    Sevas ({sevaMatches})
                  </button>
                </div>

                <div className="text-[11px] text-stone-500">
                  Ready to download in official PDF format
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3.5">
                {filteredReceipts.map(item => {
                  const isSeva = item.recordType === 'seva';
                  const isConfirmed = isSeva && item.status === 'Confirmed';
                  const filename = getBulkIndividualReceiptFilename({
                    flat: item.flat,
                    name: item.name,
                    rcptNo: item.rcptNo,
                    tokNo: isSeva ? item.rcptNo : undefined,
                    seva: item.seva,
                    recordType: item.recordType
                  });
                  const isDownloadingThis = downloadingId === item.id;

                  return (
                    <div
                      key={item.id}
                      className={`bg-white border-2 rounded-xl p-5 shadow-sm hover:shadow-md transition-all space-y-4 ${
                        isSeva
                          ? 'border-amber-200 hover:border-amber-500'
                          : 'border-stone-200 hover:border-amber-400'
                      }`}
                    >
                      {/* Top Row: Meta and Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {isSeva ? (
                            <span className="bg-amber-500/15 text-amber-900 font-mono text-xs font-bold px-2 py-0.5 rounded border border-amber-300 inline-flex items-center gap-1">
                              <span>TOKEN:</span>
                              <span className="font-black">{item.rcptNo || 'SEVA'}</span>
                            </span>
                          ) : (
                            <span className="bg-[#991B1B]/10 text-[#991B1B] font-mono text-xs font-bold px-2 py-0.5 rounded border border-[#991B1B]/20">
                              {item.rcptNo || 'RECEIPT'}
                            </span>
                          )}

                          <span className="text-xs text-stone-500 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-stone-400" />
                            {fmtDate(item.date)}
                          </span>

                          {isSeva && item.seva && (
                            <span className="bg-red-50 text-[#991B1B] text-xs font-bold px-2 py-0.5 rounded-full border border-red-200/80 inline-flex items-center gap-1">
                              <span>🌺</span>
                              <span>{item.seva}</span>
                            </span>
                          )}
                        </div>

                        {/* Status Badge */}
                        <div>
                          {isSeva ? (
                            isConfirmed ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-300">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Confirmed by Committee</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-amber-300">
                                <Clock className="w-3.5 h-3.5 text-amber-700" />
                                <span>Booked (To be confirmed)</span>
                              </span>
                            )
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Verified Contribution</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Middle Row: Devotee & Booking Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1 mb-0.5">
                            <User className="w-3 h-3 text-stone-400" />
                            Devotee / Resident
                          </div>
                          <div className="text-base sm:text-lg font-serif font-bold text-stone-900 leading-tight">
                            {item.name}
                          </div>

                          {item.flat && (
                            <div className="mt-1 flex items-center gap-1.5 text-xs text-stone-700">
                              <Building2 className="w-3.5 h-3.5 text-[#991B1B]" />
                              <span>Flat / Unit:</span>
                              <span className="font-bold font-mono bg-stone-100 px-1.5 py-0.5 rounded text-stone-900 border border-stone-200">
                                {item.flat}
                              </span>
                            </div>
                          )}

                          {isSeva && item.qty && (
                            <div className="mt-1 flex items-center gap-1.5 text-xs text-stone-700">
                              <Package className="w-3.5 h-3.5 text-amber-600" />
                              <span>Quantity Sponsored:</span>
                              <span className="font-bold text-stone-900">
                                {item.qty} {item.unit || ''}
                              </span>
                            </div>
                          )}

                          {isSeva && item.gothra && (
                            <div className="mt-1 text-xs text-stone-600">
                              <span>Gotra: </span>
                              <span className="font-medium text-stone-800">{item.gothra}</span>
                            </div>
                          )}
                        </div>

                        <div className="sm:text-right">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-0.5">
                            {isSeva && (!item.amt || Number(item.amt) === 0)
                              ? 'Contribution / Offering'
                              : 'Amount Contributed'}
                          </div>

                          {isSeva && (!item.amt || Number(item.amt) === 0) ? (
                            <div className="text-base sm:text-lg font-serif font-bold text-[#991B1B] leading-tight">
                              In-Kind Material Offering
                            </div>
                          ) : (
                            <>
                              <div className="text-xl sm:text-2xl font-mono font-bold text-emerald-700 leading-tight">
                                ₹ {fmt(item.amt)}
                              </div>
                              <div className="text-[11px] text-stone-500 capitalize italic">
                                {numWords(item.amt)} Rupees Only
                              </div>
                            </>
                          )}

                          <div className="mt-1 text-xs text-stone-600 flex items-center sm:justify-end gap-1">
                            {isSeva ? (
                              <span>Offering Type: <strong className="text-stone-800">Devotional Seva</strong></span>
                            ) : (
                              <>
                                <CreditCard className="w-3.5 h-3.5 text-stone-400" />
                                <span>Paid via: <strong className="text-stone-800">{item.pay || 'UPI'}</strong></span>
                                {item.txn ? <span className="text-[10px] font-mono text-stone-500 ml-1">({item.txn})</span> : null}
                              </>
                            )}
                          </div>

                          {item.notes && (
                            <div className="mt-1 text-xs italic text-stone-500 sm:text-right">
                              "{item.notes}"
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bottom Action Buttons */}
                      <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2.5">
                        <div className="text-[11px] text-stone-500 font-mono flex items-center gap-1 truncate max-w-xs">
                          <span className="text-stone-400">Target File:</span>
                          <span className="font-semibold text-stone-700 truncate">{filename}</span>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {/* 1. Download PDF Button */}
                          <button
                            type="button"
                            onClick={() => handleDownloadPdf(item)}
                            disabled={isDownloadingThis}
                            className="bg-[#991B1B] hover:bg-[#7F1D1D] text-white text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg inline-flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-75"
                            title="Download official PDF receipt file directly"
                          >
                            {isDownloadingThis ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                            <span>{isDownloadingThis ? 'Generating PDF...' : 'Download PDF Receipt'}</span>
                          </button>

                          {/* 2. View / Print Button */}
                          <button
                            type="button"
                            onClick={() => setActiveReceiptForModal(item)}
                            className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold px-3 py-2 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer border border-stone-300"
                            title="View receipt on screen or print"
                          >
                            <Printer className="w-3.5 h-3.5 text-stone-600" />
                            <span>View / Print</span>
                          </button>

                          {/* 3. Share WhatsApp */}
                          <button
                            type="button"
                            onClick={() => handleShareWhatsApp(item)}
                            className="bg-[#25D366] hover:bg-[#20bd5a] text-white p-2 rounded-lg transition-colors cursor-pointer"
                            title="Share receipt link via WhatsApp"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                          </button>

                          {/* 4. Copy Direct Link */}
                          <button
                            type="button"
                            onClick={() => handleCopyDirectLink(item)}
                            className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer border border-stone-200"
                            title="Copy direct receipt download link"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Security & Verification Disclaimer Footer (Strictly Devotee Portal Only) */}
        <div className="bg-white/80 border border-stone-200/80 rounded-xl p-4 text-center text-xs text-stone-500 space-y-1">
          <div className="flex items-center justify-center gap-1.5 font-semibold text-stone-700">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Secure Devotee Portal • Ganeshotsava Samithi 2026</span>
          </div>
          <p className="text-[11px] text-stone-500 max-w-xl mx-auto">
            This portal allows devotees and society residents to search and download their official voluntary contribution
            and devotional seva booking receipts. All contributions are held in a dedicated festival account solely for
            Ganeshotsava 2026 celebration expenses.
          </p>
        </div>
      </main>

      {/* 4. HIGH-RESOLUTION RECEIPT PREVIEW MODAL */}
      {activeReceiptForModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
          onClick={e => {
            if (e.target === e.currentTarget) setActiveReceiptForModal(null);
          }}
        >
          <div className="bg-white rounded-xl border border-stone-200 shadow-2xl max-w-xl w-full overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[94vh]">
            {/* Modal Header */}
            <div className="bg-[#991B1B] text-white p-3 sm:px-5 sm:py-3.5 sticky top-0 z-20 flex items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 shrink-0" />
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider truncate">
                  {activeReceiptForModal.recordType === 'seva'
                    ? 'Official Seva Token / Receipt'
                    : 'Official Voluntary Contribution E-Receipt'}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadPdf(activeReceiptForModal)}
                  className="bg-amber-400 hover:bg-amber-300 text-stone-900 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded inline-flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
                <button
                  type="button"
                  onClick={handleDirectPrintModal}
                  className="bg-white text-[#991B1B] hover:bg-stone-100 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded inline-flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveReceiptForModal(null)}
                  className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Printable Receipt Content */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-stone-100/70">
              <div
                ref={modalReceiptRef}
                id="portal-modal-receipt-target"
                className="receipt-card relative overflow-hidden bg-white p-5 sm:p-7 border-2 border-[#991B1B] shadow-md rounded-lg font-sans mx-auto max-w-lg"
                style={{ isolation: 'isolate', overflow: 'hidden' }}
              >
                <GaneshaWatermark opacity={0.22} size="full" fit="fill" />

                <div className="relative z-10">
                  {/* Temple / Trust Branding */}
                  <div className="flex items-center gap-3 sm:gap-4 border-b-2 border-[#991B1B] pb-4 mb-4">
                    <img
                      src={settings.logo || '/lord_ganesha.svg'}
                      alt="Lord Sri Ganesha"
                      className="w-14 h-14 sm:w-16 sm:h-16 object-contain rounded shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 text-center">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-[#991B1B] mb-0.5 inline-flex items-center justify-center gap-1.5">
                        <img src="/lord_ganesha.svg" alt="" className="w-3.5 h-3.5 object-contain inline" referrerPolicy="no-referrer" />
                        <span>GANAPATI BAPPA MORYA</span>
                        <img src="/lord_ganesha.svg" alt="" className="w-3.5 h-3.5 object-contain inline" referrerPolicy="no-referrer" />
                      </div>
                      <h2 className="text-xl sm:text-2xl font-serif font-black text-[#991B1B] leading-tight">
                        {cleanOrgName(settings.org, 'Eldorado Residents Association')}
                      </h2>
                      <h3 className="text-xs sm:text-sm font-bold text-stone-800">3rd Year Ganeshotsava 2026</h3>
                      <p className="text-[11px] text-stone-500">14th September – 18th September 2026</p>
                      <p className="text-[11px] text-stone-500">{settings.location || 'Amphitheatre'}</p>
                    </div>
                  </div>

                  {/* Receipt Number & Date */}
                  <div className="flex justify-between text-xs py-2 border-b border-stone-200 mb-3 bg-stone-50/70 px-3 rounded font-medium">
                    <span>
                      <strong>{activeReceiptForModal.recordType === 'seva' ? 'Seva Token / Receipt No:' : 'Receipt No:'}</strong>{' '}
                      <span className="font-mono font-bold text-[#991B1B] ml-1">
                        {activeReceiptForModal.rcptNo || 'VAL'}
                      </span>
                    </span>
                    <span>
                      <strong>Date:</strong> {fmtDate(activeReceiptForModal.date || today())}
                    </span>
                  </div>

                  {/* Devotee Info */}
                  <div className="space-y-2 text-xs py-2">
                    <div className="flex">
                      <span className="w-1/3 font-bold uppercase tracking-wider text-stone-600">
                        {activeReceiptForModal.recordType === 'seva' ? 'Devotee / Resident' : 'Contributor'}
                      </span>
                      <span className="w-2/3 font-bold text-stone-900">{activeReceiptForModal.name}</span>
                    </div>

                    {activeReceiptForModal.flat && (
                      <div className="flex">
                        <span className="w-1/3 font-bold uppercase tracking-wider text-stone-600">Flat / Unit</span>
                        <span className="w-2/3 font-semibold text-stone-800">{activeReceiptForModal.flat}</span>
                      </div>
                    )}

                    <div className="flex">
                      <span className="w-1/3 font-bold uppercase tracking-wider text-stone-600">Type</span>
                      <span className="w-2/3 font-medium text-stone-800">
                        {activeReceiptForModal.recordType === 'seva'
                          ? `Devotional Seva Offering (${activeReceiptForModal.seva})`
                          : 'Voluntary Resident Contribution'}
                      </span>
                    </div>

                    {activeReceiptForModal.recordType === 'seva' && (activeReceiptForModal.qty || activeReceiptForModal.unit) && (
                      <div className="flex">
                        <span className="w-1/3 font-bold uppercase tracking-wider text-stone-600">Quantity</span>
                        <span className="w-2/3 font-bold text-stone-900">
                          {activeReceiptForModal.qty || 1} {activeReceiptForModal.unit || ''}
                        </span>
                      </div>
                    )}

                    {activeReceiptForModal.recordType === 'seva' && activeReceiptForModal.status && (
                      <div className="flex">
                        <span className="w-1/3 font-bold uppercase tracking-wider text-stone-600">Status</span>
                        <span className="w-2/3 font-bold">
                          {activeReceiptForModal.status === 'Confirmed' ? (
                            <span className="text-emerald-700">✓ Confirmed by Committee</span>
                          ) : (
                            <span className="text-amber-700">⏳ Booked (To be confirmed)</span>
                          )}
                        </span>
                      </div>
                    )}

                    {activeReceiptForModal.gothra && (
                      <div className="flex">
                        <span className="w-1/3 font-bold uppercase tracking-wider text-stone-600">Gotra</span>
                        <span className="w-2/3 font-medium text-stone-800">{activeReceiptForModal.gothra}</span>
                      </div>
                    )}

                    {activeReceiptForModal.pay && activeReceiptForModal.recordType !== 'seva' && (
                      <div className="flex">
                        <span className="w-1/3 font-bold uppercase tracking-wider text-stone-600">Payment Mode</span>
                        <span className="w-2/3 font-medium text-stone-900">{activeReceiptForModal.pay}</span>
                      </div>
                    )}

                    {activeReceiptForModal.txn && (
                      <div className="flex">
                        <span className="w-1/3 font-bold uppercase tracking-wider text-stone-600">Transaction ID</span>
                        <span className="w-2/3 font-mono text-stone-800">{activeReceiptForModal.txn}</span>
                      </div>
                    )}

                    {activeReceiptForModal.notes && (
                      <div className="flex">
                        <span className="w-1/3 font-bold uppercase tracking-wider text-stone-600">Notes / Sankalpa</span>
                        <span className="w-2/3 italic text-stone-700">{activeReceiptForModal.notes}</span>
                      </div>
                    )}
                  </div>

                  {/* Amount Block */}
                  <div className="my-5 p-4 text-center bg-amber-50/60 border border-amber-200 rounded">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-stone-600">
                      {activeReceiptForModal.recordType === 'seva' && (!activeReceiptForModal.amt || Number(activeReceiptForModal.amt) === 0)
                        ? 'Contribution / Offering'
                        : 'Amount Received'}
                    </div>

                    {activeReceiptForModal.recordType === 'seva' && (!activeReceiptForModal.amt || Number(activeReceiptForModal.amt) === 0) ? (
                      <div className="text-xl sm:text-2xl font-serif font-bold text-[#991B1B] my-1">
                        In-Kind Material Offering
                      </div>
                    ) : (
                      <>
                        <div className="text-2xl sm:text-3xl font-mono font-bold text-[#991B1B] my-1">
                          ₹ {fmt(activeReceiptForModal.amt)}
                        </div>
                        <div className="text-xs italic text-stone-600 capitalize">
                          {numWords(activeReceiptForModal.amt)} Rupees Only
                        </div>
                      </>
                    )}
                  </div>

                  {/* Disclaimer */}
                  <div className="text-[10px] text-stone-500 border-t border-stone-200 pt-3 mt-3 leading-relaxed">
                    <strong>Disclaimer:</strong>{' '}
                    {activeReceiptForModal.recordType === 'seva'
                      ? 'Devotional seva offering registered for Ganeshotsava 2026 celebrations. May Lord Sri Ganesha bestow health, happiness, and prosperity.'
                      : 'Funds collected are held in a dedicated account solely for Ganeshotsava 2026 celebration expenses. All contributions are voluntary.'}
                  </div>

                  {/* Digital Signature */}
                  <DigitalSignatureBlock refCode={`GNS2026-SAMITHI-${activeReceiptForModal.rcptNo || 'VAL'}`} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. OFFSCREEN RENDER CONTAINER FOR BACKGROUND PDF GENERATION */}
      {offscreenItem && (
        <div
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            width: '600px',
            pointerEvents: 'none',
            zIndex: -999,
            background: '#ffffff',
            opacity: 1
          }}
          aria-hidden="true"
        >
          <div
            ref={offscreenReceiptRef}
            id="offscreen-receipt-print-target"
            className="receipt-card relative overflow-hidden bg-white p-7 border-2 border-[#991B1B] shadow-none rounded-lg font-sans"
            style={{ width: '580px', maxWidth: '580px', minWidth: '580px', boxSizing: 'border-box' }}
          >
            <GaneshaWatermark opacity={0.22} size="full" fit="fill" />

            <div className="relative z-10">
              <div className="flex items-center gap-4 border-b-2 border-[#991B1B] pb-4 mb-4">
                <img
                  src={settings.logo || '/lord_ganesha.svg'}
                  alt="Lord Sri Ganesha"
                  className="w-16 h-16 object-contain rounded shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 text-center">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#991B1B] mb-0.5 inline-flex items-center justify-center gap-1.5">
                    <img src="/lord_ganesha.svg" alt="" className="w-3.5 h-3.5 object-contain inline" referrerPolicy="no-referrer" />
                    <span>GANAPATI BAPPA MORYA</span>
                    <img src="/lord_ganesha.svg" alt="" className="w-3.5 h-3.5 object-contain inline" referrerPolicy="no-referrer" />
                  </div>
                  <h2 className="text-2xl font-serif font-black text-[#991B1B] leading-tight">
                    {cleanOrgName(settings.org, 'Eldorado Residents Association')}
                  </h2>
                  <h3 className="text-sm font-bold text-stone-800">3rd Year Ganeshotsava 2026</h3>
                  <p className="text-[11px] text-stone-500">14th September – 18th September 2026</p>
                  <p className="text-[11px] text-stone-500">{settings.location || 'Amphitheatre'}</p>
                </div>
              </div>

              <div className="flex justify-between text-xs py-2 border-b border-stone-200 mb-3 bg-stone-50/70 px-3 rounded font-medium">
                <span>
                  <strong>{offscreenItem.recordType === 'seva' ? 'Seva Token / Receipt No:' : 'Receipt No:'}</strong>{' '}
                  <span className="font-mono font-bold text-[#991B1B] ml-1">
                    {offscreenItem.rcptNo || 'VAL'}
                  </span>
                </span>
                <span>
                  <strong>Date:</strong> {fmtDate(offscreenItem.date || today())}
                </span>
              </div>

              <div className="space-y-2 text-xs py-2">
                <div className="flex">
                  <span className="w-1/3 font-bold uppercase tracking-wider text-stone-600">
                    {offscreenItem.recordType === 'seva' ? 'Devotee / Resident' : 'Contributor'}
                  </span>
                  <span className="w-2/3 font-bold text-stone-900">{offscreenItem.name}</span>
                </div>

                {offscreenItem.flat && (
                  <div className="flex">
                    <span className="w-1/3 font-bold uppercase tracking-wider text-stone-600">Flat / Unit</span>
                    <span className="w-2/3 font-semibold text-stone-800">{offscreenItem.flat}</span>
                  </div>
                )}

                <div className="flex">
                  <span className="w-1/3 font-bold uppercase tracking-wider text-stone-600">Type</span>
                  <span className="w-2/3 font-medium text-stone-800">
                    {offscreenItem.recordType === 'seva'
                      ? `Devotional Seva Offering (${offscreenItem.seva})`
                      : 'Voluntary Resident Contribution'}
                  </span>
                </div>

                {offscreenItem.recordType === 'seva' && (offscreenItem.qty || offscreenItem.unit) && (
                  <div className="flex">
                    <span className="w-1/3 font-bold uppercase tracking-wider text-stone-600">Quantity</span>
                    <span className="w-2/3 font-bold text-stone-900">
                      {offscreenItem.qty || 1} {offscreenItem.unit || ''}
                    </span>
                  </div>
                )}

                {offscreenItem.recordType === 'seva' && offscreenItem.status && (
                  <div className="flex">
                    <span className="w-1/3 font-bold uppercase tracking-wider text-stone-600">Status</span>
                    <span className="w-2/3 font-bold">
                      {offscreenItem.status === 'Confirmed' ? (
                        <span className="text-emerald-700">✓ Confirmed by Committee</span>
                      ) : (
                        <span className="text-amber-700">⏳ Booked (To be confirmed)</span>
                      )}
                    </span>
                  </div>
                )}

                {offscreenItem.gothra && (
                  <div className="flex">
                    <span className="w-1/3 font-bold uppercase tracking-wider text-stone-600">Gotra</span>
                    <span className="w-2/3 font-medium text-stone-800">{offscreenItem.gothra}</span>
                  </div>
                )}

                {offscreenItem.pay && offscreenItem.recordType !== 'seva' && (
                  <div className="flex">
                    <span className="w-1/3 font-bold uppercase tracking-wider text-stone-600">Payment Mode</span>
                    <span className="w-2/3 font-medium text-stone-900">{offscreenItem.pay}</span>
                  </div>
                )}

                {offscreenItem.txn && (
                  <div className="flex">
                    <span className="w-1/3 font-bold uppercase tracking-wider text-stone-600">Transaction ID</span>
                    <span className="w-2/3 font-mono text-stone-800">{offscreenItem.txn}</span>
                  </div>
                )}

                {offscreenItem.notes && (
                  <div className="flex">
                    <span className="w-1/3 font-bold uppercase tracking-wider text-stone-600">Notes / Sankalpa</span>
                    <span className="w-2/3 italic text-stone-700">{offscreenItem.notes}</span>
                  </div>
                )}
              </div>

              <div className="my-5 p-4 text-center bg-amber-50/60 border border-amber-200 rounded">
                <div className="text-[10px] font-bold uppercase tracking-widest text-stone-600">
                  {offscreenItem.recordType === 'seva' && (!offscreenItem.amt || Number(offscreenItem.amt) === 0)
                    ? 'Contribution / Offering'
                    : 'Amount Received'}
                </div>

                {offscreenItem.recordType === 'seva' && (!offscreenItem.amt || Number(offscreenItem.amt) === 0) ? (
                  <div className="text-2xl font-serif font-bold text-[#991B1B] my-1">
                    In-Kind Material Offering
                  </div>
                ) : (
                  <>
                    <div className="text-3xl font-mono font-bold text-[#991B1B] my-1">
                      ₹ {fmt(offscreenItem.amt)}
                    </div>
                    <div className="text-xs italic text-stone-600 capitalize">
                      {numWords(offscreenItem.amt)} Rupees Only
                    </div>
                  </>
                )}
              </div>

              <div className="text-[10px] text-stone-500 border-t border-stone-200 pt-3 mt-3 leading-relaxed">
                <strong>Disclaimer:</strong>{' '}
                {offscreenItem.recordType === 'seva'
                  ? 'Devotional seva offering registered for Ganeshotsava 2026 celebrations. May Lord Sri Ganesha bestow health, happiness, and prosperity.'
                  : 'Funds collected are held in a dedicated account solely for Ganeshotsava 2026 celebration expenses. All contributions are voluntary.'}
              </div>

              <DigitalSignatureBlock refCode={`GNS2026-SAMITHI-${offscreenItem.rcptNo || 'VAL'}`} />
            </div>
          </div>
        </div>
      )}

      {/* 6. TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-stone-900 text-white text-xs px-4 py-3 rounded-xl shadow-2xl border border-amber-500/50 flex items-center gap-2.5 backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
