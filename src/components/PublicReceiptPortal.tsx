import React, { useState, useEffect, useRef } from 'react';
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
  ExternalLink
} from 'lucide-react';
import { Contribution, AppSettings } from '../types';
import { fmt, fmtDate, numWords, today } from '../utils/helpers';
import { GaneshaWatermark } from './GaneshaWatermark';
import { DigitalSignatureBlock } from './ReceiptInvoiceModal';
import {
  generateReceiptPdfBlob,
  downloadBlobAsFile,
  getBulkIndividualReceiptFilename
} from '../utils/pdfGenerator';

interface PublicReceiptPortalProps {
  contributions: Contribution[];
  settings: AppSettings;
  onBackToApp?: () => void;
}

export const PublicReceiptPortal: React.FC<PublicReceiptPortalProps> = ({
  contributions,
  settings,
  onBackToApp
}) => {
  // Read initial search query from URL parameter if provided (e.g. ?q=A-101 or ?flat=A-101 or ?name=...)
  const [search, setSearch] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return (
        params.get('q') ||
        params.get('flat') ||
        params.get('name') ||
        params.get('rcpt') ||
        ''
      );
    }
    return '';
  });

  const [activeReceiptForModal, setActiveReceiptForModal] = useState<Contribution | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Hidden print element ref for background PDF generation
  const offscreenReceiptRef = useRef<HTMLDivElement>(null);
  const [offscreenItem, setOffscreenItem] = useState<Contribution | null>(null);

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

  // Normalization helper for flat number matching (e.g. matches "A101" to "A-101", etc.)
  const cleanStr = (s?: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  const normalizedQuery = cleanStr(search);
  const trimmedSearch = search.trim().toLowerCase();

  // Filter receipts based on Flat, Devotee Name, or Receipt Number
  const filteredReceipts = contributions.filter(c => {
    if (!trimmedSearch) return false;

    // Flat match (both raw and normalized)
    const flatRaw = (c.flat || '').toLowerCase();
    const flatClean = cleanStr(c.flat);
    if (flatRaw.includes(trimmedSearch) || (normalizedQuery && flatClean.includes(normalizedQuery))) {
      return true;
    }

    // Devotee / Contributor Name match
    const nameRaw = (c.name || '').toLowerCase();
    if (nameRaw.includes(trimmedSearch)) {
      return true;
    }

    // Receipt Number match
    const rcptRaw = (c.rcptNo || '').toLowerCase();
    if (rcptRaw.includes(trimmedSearch) || (normalizedQuery && cleanStr(c.rcptNo).includes(normalizedQuery))) {
      return true;
    }

    // Transaction ID match (if present)
    const txnRaw = (c.txn || '').toLowerCase();
    if (txnRaw && txnRaw.includes(trimmedSearch)) {
      return true;
    }

    return false;
  });

  // Direct PDF Download Handler
  const handleDownloadPdf = async (item: Contribution) => {
    try {
      setDownloadingId(item.id);
      setOffscreenItem(item);

      // Give React a tick to mount the offscreen receipt
      await new Promise(resolve => setTimeout(resolve, 80));

      if (!offscreenReceiptRef.current) {
        throw new Error('Receipt render container is not ready.');
      }

      const blob = await generateReceiptPdfBlob(offscreenReceiptRef.current, { scale: 2 });
      const filename = getBulkIndividualReceiptFilename(item);
      downloadBlobAsFile(blob, filename);

      showToast(`Receipt downloaded as "${filename}"`);
    } catch (err: any) {
      console.error('Failed to download receipt PDF:', err);
      alert('Failed to generate PDF. You can also click "View / Print" to view and print the receipt.');
    } finally {
      setDownloadingId(null);
      setOffscreenItem(null);
    }
  };

  // Copy direct link for a specific receipt
  const handleCopyDirectLink = (item: Contribution) => {
    try {
      const query = encodeURIComponent(item.flat || item.name || item.rcptNo || '');
      const baseUrl = settings.customReceiptPortalUrl || `${window.location.origin}/receipts`;
      const separator = baseUrl.includes('?') ? '&' : '?';
      const fullUrl = `${baseUrl}${separator}q=${query}`;

      navigator.clipboard.writeText(fullUrl);
      showToast(`Direct receipt link copied! You can share this with ${item.name || item.flat}.`);
    } catch (err) {
      console.error('Failed to copy direct receipt link', err);
    }
  };

  // Share receipt via WhatsApp
  const handleShareWhatsApp = (item: Contribution) => {
    const query = encodeURIComponent(item.flat || item.name || item.rcptNo || '');
    const baseUrl = settings.customReceiptPortalUrl || `${window.location.origin}/receipts`;
    const separator = baseUrl.includes('?') ? '&' : '?';
    const portalUrl = `${baseUrl}${separator}q=${query}`;
    const text = `🙏 *Ganeshotsava 2026 - Voluntary Contribution Receipt*\n*${settings.org || 'Brigade Eldorado'}*\n\n📜 *Receipt No:* ${item.rcptNo || '—'}\n👤 *Devotee:* ${item.name}\n🏠 *Flat / Unit:* ${item.flat || '—'}\n💰 *Amount:* ₹${fmt(item.amt)} (${numWords(item.amt)})\n📅 *Date:* ${fmtDate(item.date)}\n\n👉 *Download Official PDF Receipt Online:*\n${portalUrl}\n\n*Ganapati Bappa Morya!* 🌺`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Direct print function
  const handleDirectPrintModal = () => {
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
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-amber-400 text-[#991B1B] flex items-center justify-center font-serif font-black text-2xl shadow-inner shrink-0 select-none">
                  🪔
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
                  {settings.org || 'Brigade Eldorado Residents Association'}
                </h1>
                <p className="text-xs text-amber-100/80 truncate">
                  Voluntary Contribution Receipt Download &amp; Verification
                </p>
              </div>
            </div>

            {/* Back button for organizers if provided */}
            {onBackToApp && (
              <button
                type="button"
                onClick={onBackToApp}
                className="bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition-colors shrink-0 border border-white/20 cursor-pointer"
                title="Return to management portal"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Management View</span>
              </button>
            )}
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
              <span>Download Official E-Receipt with Ganesha Blessing &amp; Seal</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-serif font-black text-[#991B1B]">
              Find &amp; Download Your Voluntary Contribution Receipt
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Enter your <strong className="text-stone-900">Flat Number</strong> (e.g.{' '}
              <code className="bg-stone-100 px-1 py-0.5 rounded text-[#991B1B] font-mono">A-101</code>) or{' '}
              <strong className="text-stone-900">Name</strong> below to search and download your official
              Ganeshotsava 2026 voluntary contribution receipt PDF.
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
                  placeholder="Search by Flat No (e.g. A-101) or Devotee Name..."
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

            {/* Quick Helper Tips */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] text-stone-500">
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
              <button
                type="button"
                onClick={() => setSearch('Tower')}
                className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-2 py-0.5 rounded-md cursor-pointer transition-colors border border-stone-200"
              >
                Tower
              </button>
              <span className="text-stone-400">• Total Receipts Registered: {contributions.length}</span>
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
                Please enter your apartment or flat number above, or type your name to look up your registered voluntary contribution receipt.
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
                No Receipt Found for "{search}"
              </h3>
              <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
                We could not find any voluntary contribution record matching that flat number or name. Please double-check your spelling, or try searching by just the number (e.g. <span className="font-mono font-bold text-stone-800">402</span> instead of <span className="font-mono text-stone-600">Tower-2 402</span>).
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
              <div className="flex items-center justify-between text-xs text-stone-600 px-1">
                <span className="font-semibold text-stone-800">
                  Found <strong>{filteredReceipts.length}</strong> matching {filteredReceipts.length === 1 ? 'receipt' : 'receipts'}:
                </span>
                <span className="text-[11px] text-stone-500">
                  Ready to download in PDF format
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3.5">
                {filteredReceipts.map(c => {
                  const filename = getBulkIndividualReceiptFilename(c);
                  const isDownloadingThis = downloadingId === c.id;

                  return (
                    <div
                      key={c.id}
                      className="bg-white border-2 border-stone-200 hover:border-amber-400 rounded-xl p-5 shadow-sm hover:shadow-md transition-all space-y-4"
                    >
                      {/* Top Row: Meta and Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="bg-[#991B1B]/10 text-[#991B1B] font-mono text-xs font-bold px-2 py-0.5 rounded border border-[#991B1B]/20">
                            {c.rcptNo || 'RECEIPT'}
                          </span>
                          <span className="text-xs text-stone-500 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-stone-400" />
                            {fmtDate(c.date)}
                          </span>
                        </div>

                        <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Verified Contribution</span>
                        </div>
                      </div>

                      {/* Middle Row: Devotee Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1 mb-0.5">
                            <User className="w-3 h-3 text-stone-400" />
                            Devotee / Contributor
                          </div>
                          <div className="text-base sm:text-lg font-serif font-bold text-stone-900 leading-tight">
                            {c.name}
                          </div>
                          {c.flat && (
                            <div className="mt-1 flex items-center gap-1.5 text-xs text-stone-700">
                              <Building2 className="w-3.5 h-3.5 text-[#991B1B]" />
                              <span>Flat / Unit:</span>
                              <span className="font-bold font-mono bg-stone-100 px-1.5 py-0.5 rounded text-stone-900 border border-stone-200">
                                {c.flat}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="sm:text-right">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-0.5">
                            Amount Contributed
                          </div>
                          <div className="text-xl sm:text-2xl font-mono font-bold text-emerald-700 leading-tight">
                            ₹ {fmt(c.amt)}
                          </div>
                          <div className="text-[11px] text-stone-500 capitalize italic">
                            {numWords(c.amt)} Rupees Only
                          </div>
                          <div className="mt-1 text-xs text-stone-600 flex items-center sm:justify-end gap-1">
                            <CreditCard className="w-3.5 h-3.5 text-stone-400" />
                            <span>Paid via: <strong className="text-stone-800">{c.pay || 'UPI'}</strong></span>
                            {c.txn ? <span className="text-[10px] font-mono text-stone-500 ml-1">({c.txn})</span> : null}
                          </div>
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
                            onClick={() => handleDownloadPdf(c)}
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
                            onClick={() => setActiveReceiptForModal(c)}
                            className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold px-3 py-2 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer border border-stone-300"
                            title="View receipt on screen or print"
                          >
                            <Printer className="w-3.5 h-3.5 text-stone-600" />
                            <span>View / Print</span>
                          </button>

                          {/* 3. Share WhatsApp */}
                          <button
                            type="button"
                            onClick={() => handleShareWhatsApp(c)}
                            className="bg-[#25D366] hover:bg-[#20bd5a] text-white p-2 rounded-lg transition-colors cursor-pointer"
                            title="Share receipt link via WhatsApp"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                          </button>

                          {/* 4. Copy Direct Link */}
                          <button
                            type="button"
                            onClick={() => handleCopyDirectLink(c)}
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
            This portal allows devotees and society residents to look up and download their official voluntary contribution receipts. All contributions are held in a dedicated festival account solely for Ganeshotsava 2026 celebrations.
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
                  Official E-Receipt &amp; Voucher
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadPdf(activeReceiptForModal)}
                  className="bg-amber-400 hover:bg-amber-300 text-stone-900 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded inline-flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
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
                id="receipt-print-target"
                className="relative overflow-hidden bg-white p-5 sm:p-7 border-2 border-[#991B1B] shadow-md rounded-lg font-sans mx-auto max-w-lg"
                style={{ isolation: 'isolate', overflow: 'hidden' }}
              >
                <GaneshaWatermark opacity={0.22} size="full" fit="fill" />

                <div className="relative z-10">
                  {/* Temple / Trust Branding */}
                  <div className="flex items-center gap-3 sm:gap-4 border-b-2 border-[#991B1B] pb-4 mb-4">
                    {settings.logo && (
                      <img
                        src={settings.logo}
                        alt="Logo"
                        className="w-14 h-14 sm:w-16 sm:h-16 object-contain rounded shrink-0"
                      />
                    )}
                    <div className="flex-1 text-center">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-[#991B1B] mb-0.5">
                        🪔 GANAPATI BAPPA MORYA 🪔
                      </div>
                      <h2 className="text-xl sm:text-2xl font-serif font-black text-[#991B1B] leading-tight">
                        {settings.org || 'Brigade Eldorado Residents Association'}
                      </h2>
                      <h3 className="text-xs sm:text-sm font-bold text-stone-800">3rd Year Ganeshotsava 2026</h3>
                      <p className="text-[11px] text-stone-500">14th September – 18th September 2026</p>
                      <p className="text-[11px] text-stone-500">{settings.location || 'Amphitheatre'}</p>
                    </div>
                  </div>

                  {/* Receipt Number & Date */}
                  <div className="flex justify-between text-xs py-2 border-b border-stone-200 mb-3 bg-stone-50/70 px-3 rounded font-medium">
                    <span>
                      <strong>Receipt No:</strong>{' '}
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
                      <span className="w-1/3 font-bold uppercase tracking-wider text-stone-600">Contributor</span>
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
                      <span className="w-2/3 font-medium text-stone-800">Voluntary Resident Contribution</span>
                    </div>
                    {activeReceiptForModal.pay && (
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
                        <span className="w-1/3 font-bold uppercase tracking-wider text-stone-600">Notes</span>
                        <span className="w-2/3 italic text-stone-700">{activeReceiptForModal.notes}</span>
                      </div>
                    )}
                  </div>

                  {/* Amount Block */}
                  <div className="my-5 p-4 text-center bg-amber-50/60 border border-amber-200 rounded">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-stone-600">Amount Received</div>
                    <div className="text-2xl sm:text-3xl font-mono font-bold text-[#991B1B] my-1">
                      ₹ {fmt(activeReceiptForModal.amt)}
                    </div>
                    <div className="text-xs italic text-stone-600 capitalize">
                      {numWords(activeReceiptForModal.amt)} Rupees Only
                    </div>
                  </div>

                  {/* Disclaimer */}
                  <div className="text-[10px] text-stone-500 border-t border-stone-200 pt-3 mt-3 leading-relaxed">
                    <strong>Disclaimer:</strong> Funds collected are held in a dedicated account solely for Ganeshotsava 2026 celebration expenses. All contributions are voluntary.
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
        <div style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -100 }}>
          <div
            ref={offscreenReceiptRef}
            id="receipt-print-target"
            className="relative overflow-hidden bg-white p-7 border-2 border-[#991B1B] shadow-none rounded-lg font-sans"
            style={{ width: '580px', maxWidth: '580px', minWidth: '580px', boxSizing: 'border-box' }}
          >
            <GaneshaWatermark opacity={0.22} size="full" fit="fill" />

            <div className="relative z-10">
              <div className="flex items-center gap-4 border-b-2 border-[#991B1B] pb-4 mb-4">
                {settings.logo && (
                  <img
                    src={settings.logo}
                    alt="Logo"
                    className="w-16 h-16 object-contain rounded shrink-0"
                  />
                )}
                <div className="flex-1 text-center">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#991B1B] mb-0.5">
                    🪔 GANAPATI BAPPA MORYA 🪔
                  </div>
                  <h2 className="text-2xl font-serif font-black text-[#991B1B] leading-tight">
                    {settings.org || 'Brigade Eldorado Residents Association'}
                  </h2>
                  <h3 className="text-sm font-bold text-stone-800">3rd Year Ganeshotsava 2026</h3>
                  <p className="text-[11px] text-stone-500">14th September – 18th September 2026</p>
                  <p className="text-[11px] text-stone-500">{settings.location || 'Amphitheatre'}</p>
                </div>
              </div>

              <div className="flex justify-between text-xs py-2 border-b border-stone-200 mb-3 bg-stone-50/70 px-3 rounded font-medium">
                <span>
                  <strong>Receipt No:</strong>{' '}
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
                  <span className="w-1/3 font-bold uppercase tracking-wider text-stone-600">Contributor</span>
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
                  <span className="w-2/3 font-medium text-stone-800">Voluntary Resident Contribution</span>
                </div>
                {offscreenItem.pay && (
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
                    <span className="w-1/3 font-bold uppercase tracking-wider text-stone-600">Notes</span>
                    <span className="w-2/3 italic text-stone-700">{offscreenItem.notes}</span>
                  </div>
                )}
              </div>

              <div className="my-5 p-4 text-center bg-amber-50/60 border border-amber-200 rounded">
                <div className="text-[10px] font-bold uppercase tracking-widest text-stone-600">Amount Received</div>
                <div className="text-3xl font-mono font-bold text-[#991B1B] my-1">
                  ₹ {fmt(offscreenItem.amt)}
                </div>
                <div className="text-xs italic text-stone-600 capitalize">
                  {numWords(offscreenItem.amt)} Rupees Only
                </div>
              </div>

              <div className="text-[10px] text-stone-500 border-t border-stone-200 pt-3 mt-3 leading-relaxed">
                <strong>Disclaimer:</strong> Funds collected are held in a dedicated account solely for Ganeshotsava 2026 celebration expenses. All contributions are voluntary.
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
