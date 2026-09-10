import React, { useState } from 'react';
import {
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
  UserCheck,
  AlertCircle,
  Package,
  Download
} from 'lucide-react';
import { SevaBooking, SevaCatalogueItem, AppSettings } from '../types';
import { fmt, fmtDate, today } from '../utils/helpers';
import { ShareSevaPortalModal } from './ShareSevaPortalModal';

interface SevasViewProps {
  sevas: SevaBooking[];
  catalogue: SevaCatalogueItem[];
  isAdmin: boolean;
  settings?: AppSettings;
  onSaveBooking: (booking: SevaBooking) => void;
  onDeleteBooking: (id: string) => void;
  onSaveCatalogue: (item: SevaCatalogueItem) => void;
  onDeleteCatalogue: (id: string) => void;
  onPrintReceipt: (booking: SevaBooking) => void;
  onShareWhatsApp?: (booking: SevaBooking) => void;
  onOpenPublicSevaPortal?: () => void;
  onUpdateSettings?: (settings: AppSettings) => void;
}

export const SevasView: React.FC<SevasViewProps> = ({
  sevas,
  catalogue,
  isAdmin,
  settings,
  onSaveBooking,
  onDeleteBooking,
  onSaveCatalogue,
  onDeleteCatalogue,
  onPrintReceipt,
  onShareWhatsApp,
  onOpenPublicSevaPortal,
  onUpdateSettings
}) => {
  const [bookingModal, setBookingModal] = useState<{
    open: boolean;
    item?: SevaBooking | null;
    initialSeva?: string;
    initialQty?: number;
    initialAmt?: number;
  }>({ open: false });

  const [catModal, setCatModal] = useState<{
    open: boolean;
    item?: SevaCatalogueItem | null;
  }>({ open: false });

  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'booked' | 'confirmed'>('all');

  // Currently selected seva in booking form for dynamic requirement card
  const [selectedSevaName, setSelectedSevaName] = useState<string>('');

  const totalAct = sevas.reduce((s, r) => s + Number(r.amt || 0), 0);
  const bookedCount = sevas.filter(s => (s.status || 'Booked') === 'Booked').length;
  const confirmedCount = sevas.filter(s => s.status === 'Confirmed').length;

  // Calculate dynamic stats for a seva catalogue item: total required, booked by sponsors, remaining
  const getSevaStats = (sc: SevaCatalogueItem) => {
    const scName = (sc.name || '').trim().toLowerCase();
    const matchingBookings = sevas.filter(
      b => (b.seva || '').trim().toLowerCase() === scName
    );
    // Sum of quantity booked by sponsors (default to 1 per booking if not specified)
    const bookedQty = matchingBookings.reduce((sum, b) => {
      const q = Number(b.qty);
      return sum + (q > 0 ? q : 1);
    }, 0);
    const totalReq = Number(sc.totalRequired || 0);
    const hasTotal = totalReq > 0;
    // Remaining = Total Required - Booked by Sponsor
    const remainingQty = hasTotal ? Math.max(0, totalReq - bookedQty) : null;
    const isFulfilled = hasTotal && bookedQty >= totalReq;
    const totalAmtCollected = matchingBookings.reduce((sum, b) => sum + Number(b.amt || 0), 0);

    return {
      matchingBookings,
      bookedCount: matchingBookings.length,
      bookedQty,
      totalReq,
      hasTotal,
      remainingQty,
      isFulfilled,
      totalAmtCollected
    };
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
  };

  const handleUnconfirmBooking = (item: SevaBooking) => {
    onSaveBooking({
      ...item,
      status: 'Booked',
      confirmedBy: undefined,
      confirmedAt: undefined
    });
  };

  const filtered = sevas.filter(v => {
    const matchesSearch =
      (v.seva || '').toLowerCase().includes(search.toLowerCase()) ||
      (v.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (v.flat || '').toLowerCase().includes(search.toLowerCase()) ||
      (v.tokNo || '').toLowerCase().includes(search.toLowerCase()) ||
      (v.phone || '').toLowerCase().includes(search.toLowerCase());

    const isConfirmed = v.status === 'Confirmed';
    if (filterStatus === 'confirmed') return matchesSearch && isConfirmed;
    if (filterStatus === 'booked') return matchesSearch && !isConfirmed;
    return matchesSearch;
  });

  // Active seva being configured in booking modal
  const activeCatalogueItem = catalogue.find(
    c => c.name === (selectedSevaName || bookingModal.item?.seva || bookingModal.initialSeva || catalogue[0]?.name)
  ) || catalogue[0];

  const activeStats = activeCatalogueItem ? getSevaStats(activeCatalogueItem) : null;

  return (
    <div className="space-y-6">
      {/* Top Banner: Shareable Seva Portal for Devotees (/ganeshotsavasevas) */}
      <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-300/80 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-[#991B1B] text-amber-200 text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider">
              Devotee Self-Service Portal
            </span>
            <span className="text-xs font-bold text-stone-800">
              Devotional Seva Bookings &amp; Catalogue
            </span>
            <span className="font-mono text-[11px] bg-amber-200 text-amber-950 px-2 py-0.5 rounded font-bold">
              /ganeshotsavasevas
            </span>
          </div>
          <p className="text-xs text-stone-600 max-w-2xl">
            Residents can browse sevas and book offerings online without committee login directly at <strong>/ganeshotsavasevas</strong>. Devotee bookings are tagged as <strong>"Booked (To be confirmed by Admin)"</strong> until confirmed.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <button
            onClick={() => setShareModalOpen(true)}
            className="px-3.5 py-2 rounded-lg text-xs font-bold bg-[#991B1B] text-white hover:bg-[#7F1D1D] transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Share Seva booking portal with residents via WhatsApp or QR Code"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Seva Portal</span>
          </button>

          {onOpenPublicSevaPortal && (
            <button
              onClick={onOpenPublicSevaPortal}
              className="px-3.5 py-2 rounded-lg text-xs font-bold bg-white text-[#991B1B] hover:bg-stone-100 border border-stone-300 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Open public devotee seva portal view (/ganeshotsavasevas)"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Devotee Portal</span>
            </button>
          )}

          <a
            href="/ganeshotsavasevas"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-lg text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Open /ganeshotsavasevas in a new browser tab"
          >
            <ExternalLink className="w-3.5 h-3.5 text-amber-800" />
            <span>Open in New Tab</span>
          </a>
        </div>
      </div>

      {/* Seva Catalogue */}
      <div className="bg-white border border-stone-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-serif font-bold text-[#1A1A1A]">Available Sevas &amp; Offerings (Catalogue)</h2>
            <p className="text-xs text-stone-500">
              Devotional sevas and item contributions (Rice, Ghee, Flowers, Poojas) with Total Required, Booked by Sponsors, and Remaining balance. Amount is non-mandatory.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCatModal({ open: true, item: null })}
              className="bg-[#991B1B] text-white hover:bg-[#7F1D1D] text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Seva Offering</span>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#FDF8F3] border-b border-stone-200 text-[10px] font-bold text-stone-500 uppercase tracking-[0.15em]">
                <th className="py-3 px-3 w-10 text-center">#</th>
                <th className="py-3 px-4 min-w-[200px]">Seva / Item Name</th>
                <th className="py-3 px-3 text-center">Unit / Measure</th>
                <th className="py-3 px-3 text-right">Total Required</th>
                <th className="py-3 px-3 text-right">Booked by Sponsor</th>
                <th className="py-3 px-4 text-center">Remaining (Needed)</th>
                <th className="py-3 px-4 text-right">Suggested Amount (₹)</th>
                <th className="py-3 px-4 text-right min-w-[140px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {catalogue.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-stone-400 text-xs">
                    No seva offerings in catalogue yet. Click "Add Seva Offering" above.
                  </td>
                </tr>
              ) : (
                catalogue.map((sc, idx) => {
                  const stats = getSevaStats(sc);

                  return (
                    <tr key={sc.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3 px-3 text-stone-400 text-xs text-center font-mono">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-stone-900">{sc.name}</div>
                        {sc.desc && <div className="text-[11px] text-stone-500 mt-0.5">{sc.desc}</div>}
                      </td>

                      {/* UNIT / MEASURE COLUMN (e.g. kg, Bags, Liters) */}
                      <td className="py-3 px-3 text-center">
                        <span className="bg-stone-100 text-stone-700 text-xs font-semibold px-2 py-0.5 rounded border border-stone-200">
                          {sc.unit || '—'}
                        </span>
                      </td>

                      {/* TOTAL REQUIRED COLUMN */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-stone-800">
                        {stats.hasTotal ? (
                          <span>
                            {stats.totalReq} <span className="text-xs font-normal text-stone-500">{sc.unit}</span>
                          </span>
                        ) : (
                          <span className="text-stone-400 text-xs italic font-normal">Open / Flexible</span>
                        )}
                      </td>

                      {/* BOOKED BY SPONSOR COLUMN */}
                      <td className="py-3 px-3 text-right font-mono">
                        <span className="font-bold text-stone-900">
                          {stats.bookedQty} {sc.unit || ''}
                        </span>
                        {stats.bookedCount > 0 && (
                          <div className="text-[10px] text-stone-500 font-normal">
                            ({stats.bookedCount} sponsor{stats.bookedCount > 1 ? 's' : ''})
                          </div>
                        )}
                      </td>

                      {/* REMAINING COLUMN (TOTAL REQUIRED - BOOKED BY SPONSOR) */}
                      <td className="py-3 px-4 text-center">
                        {stats.hasTotal ? (
                          stats.isFulfilled ? (
                            <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2.5 py-0.5 rounded-full text-xs inline-flex items-center gap-1 shadow-2xs">
                              <CheckCircle2 className="w-3 h-3 text-emerald-700 shrink-0" />
                              <span>Fulfilled (0 remaining)</span>
                            </span>
                          ) : (
                            <span className="bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2.5 py-0.5 rounded-full text-xs font-mono inline-flex items-center gap-1 shadow-2xs">
                              <Clock className="w-3 h-3 text-amber-700 shrink-0" />
                              <span>{stats.remainingQty} {sc.unit || ''} remaining</span>
                            </span>
                          )
                        ) : (
                          <span className="text-stone-400 text-xs italic">Open</span>
                        )}
                      </td>

                      {/* SUGGESTED AMOUNT (NON-MANDATORY) */}
                      <td className="py-3 px-4 text-right">
                        {sc.amt && Number(sc.amt) > 0 ? (
                          <span className="font-mono font-bold text-stone-800">₹ {fmt(sc.amt)}</span>
                        ) : (
                          <span className="text-stone-500 bg-stone-100 text-[11px] font-medium px-2 py-0.5 rounded border border-stone-200">
                            Non-Mandatory / In-Kind
                          </span>
                        )}
                      </td>

                      {/* ACTIONS */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex gap-1.5 justify-end items-center">
                          {/* QUICK BOOK / SPONSOR BUTTON */}
                          <button
                            onClick={() => {
                              setSelectedSevaName(sc.name);
                              const suggestedQty = stats.remainingQty && stats.remainingQty > 0 ? Math.min(10, stats.remainingQty) : 1;
                              setBookingModal({
                                open: true,
                                item: null,
                                initialSeva: sc.name,
                                initialQty: suggestedQty,
                                initialAmt: sc.amt || 0
                              });
                            }}
                            className="bg-[#991B1B] hover:bg-[#7F1D1D] text-white text-xs font-bold px-2.5 py-1 rounded inline-flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                            title={`Book or sponsor this seva (${sc.name})`}
                          >
                            <Plus className="w-3 h-3" />
                            <span>Sponsor</span>
                          </button>

                          <button
                            onClick={() => setCatModal({ open: true, item: sc })}
                            className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded cursor-pointer"
                            title="Modify Seva Offering"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => {
                                if (confirm(`Delete seva catalogue item "${sc.name}"?`)) {
                                  onDeleteCatalogue(sc.id);
                                }
                              }}
                              className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded cursor-pointer"
                              title="Delete Seva Offering (Admin Only)"
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

      {/* Seva Bookings */}
      <div className="bg-white border border-stone-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-serif font-bold text-[#1A1A1A]">Seva Bookings &amp; Registrations</h2>
            <div className="text-xs text-stone-500 flex items-center gap-2 mt-0.5 flex-wrap">
              <span>Seva Amount Collected: <strong className="text-emerald-700 font-mono">₹ {fmt(totalAct)}</strong></span>
              <span>•</span>
              <span className="font-semibold text-stone-800">{sevas.length} Sevas Booked</span>
              <span>•</span>
              <span className="text-amber-800 font-semibold">{bookedCount} To be Confirmed</span>
              <span>•</span>
              <span className="text-emerald-800 font-semibold">{confirmedCount} Confirmed</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Status Quick Filter */}
            <div className="inline-flex rounded-lg bg-stone-100 p-0.5 text-xs">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                  filterStatus === 'all' ? 'bg-white shadow-xs text-stone-900' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                All ({sevas.length})
              </button>
              <button
                onClick={() => setFilterStatus('booked')}
                className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                  filterStatus === 'booked' ? 'bg-amber-500 text-white shadow-xs font-bold' : 'text-amber-800 hover:text-amber-900'
                }`}
              >
                Booked ({bookedCount})
              </button>
              <button
                onClick={() => setFilterStatus('confirmed')}
                className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                  filterStatus === 'confirmed' ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'text-emerald-800 hover:text-emerald-900'
                }`}
              >
                Confirmed ({confirmedCount})
              </button>
            </div>

            <input
              type="text"
              placeholder="🔍 Search seva, resident, flat, token…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border border-stone-300 rounded px-3 py-1.5 text-xs bg-stone-50 focus:bg-white outline-none focus:border-[#991B1B] w-48 sm:w-56"
            />

            <button
              onClick={() => setBookingModal({ open: true, item: null })}
              className="bg-[#991B1B] text-white hover:bg-[#7F1D1D] text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Book Seva</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#FDF8F3] border-b border-stone-200 text-[10px] font-bold text-stone-500 uppercase tracking-[0.15em]">
                <th className="py-3 px-4">Token No</th>
                <th className="py-3 px-4">Seva Offering</th>
                <th className="py-3 px-3 text-center">Quantity Sponsored</th>
                <th className="py-3 px-4">Resident / Devotee</th>
                <th className="py-3 px-4">Flat No</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-stone-400">
                    No seva bookings found matching the current search / filter.
                  </td>
                </tr>
              ) : (
                filtered.map(v => {
                  const isConfirmed = v.status === 'Confirmed';
                  const matchedCat = catalogue.find(
                    c => (c.name || '').trim().toLowerCase() === (v.seva || '').trim().toLowerCase()
                  );
                  const unitDisplay = v.unit || matchedCat?.unit || '';

                  return (
                    <tr key={v.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-stone-900">{v.tokNo}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-stone-900">{v.seva}</div>
                        {v.notes && <div className="text-[11px] text-stone-500 truncate max-w-[180px]">{v.notes}</div>}
                      </td>

                      {/* QUANTITY SPONSORED (e.g. 10 kg, 2 Bags) */}
                      <td className="py-3 px-3 text-center font-mono">
                        <span className="bg-amber-50 text-amber-900 font-bold px-2 py-0.5 rounded border border-amber-200 text-xs inline-flex items-center gap-1">
                          <Package className="w-3 h-3 text-amber-700" />
                          <span>{v.qty || 1} {unitDisplay}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-stone-800">
                        <div className="font-medium">{v.name}</div>
                        {(v.phone || v.gothra) && (
                          <div className="text-[10px] text-stone-500">
                            {v.phone && <span>📞 {v.phone} </span>}
                            {v.gothra && <span>• Gotra: {v.gothra}</span>}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-stone-100 text-stone-700 text-xs font-medium px-2 py-0.5 rounded">
                          {v.flat}
                        </span>
                      </td>

                      {/* AMOUNT (NON-MANDATORY) */}
                      <td className="py-3 px-4 font-mono text-right">
                        {v.amt && Number(v.amt) > 0 ? (
                          <span className="font-bold text-emerald-700">₹ {fmt(v.amt)}</span>
                        ) : (
                          <span className="text-stone-500 italic text-xs bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                            In-Kind (Material)
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-stone-600 text-xs">{fmtDate(v.date)}</td>
                      
                      {/* STATUS BADGE */}
                      <td className="py-3 px-4 text-center">
                        {isConfirmed ? (
                          <span
                            className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1 shadow-2xs"
                            title={v.confirmedAt ? `Confirmed by ${v.confirmedBy || 'Admin'} on ${fmtDate(v.confirmedAt)}` : 'Confirmed by Admin'}
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
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex gap-1.5 justify-end items-center">
                          {/* ADMIN CONFIRM / UNCONFIRM BUTTON */}
                          {isAdmin && (
                            <>
                              {!isConfirmed ? (
                                <button
                                  onClick={() => handleConfirmBooking(v)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-2.5 py-1 rounded inline-flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                                  title="Confirm this seva booking as Admin"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Confirm</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUnconfirmBooking(v)}
                                  className="bg-stone-100 hover:bg-stone-200 text-stone-600 text-[10px] font-semibold px-2 py-1 rounded transition-colors cursor-pointer"
                                  title="Change back to Booked (Unconfirm)"
                                >
                                  Revert
                                </button>
                              )}
                            </>
                          )}

                          {/* Print / Token Receipt (same like voluntary receipt) */}
                          <button
                            onClick={() => onPrintReceipt(v)}
                            className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium px-2.5 py-1 rounded inline-flex items-center gap-1 transition-colors cursor-pointer"
                            title="Generate Official Seva PDF Receipt / Token"
                          >
                            <Printer className="w-3 h-3 text-[#991B1B]" />
                            <span>Receipt</span>
                          </button>

                          {/* Copy Link to /receipts portal */}
                          <button
                            onClick={() => {
                              const query = encodeURIComponent(v.flat || v.name || v.seva || '');
                              const baseUrl = settings?.customReceiptPortalUrl
                                ? settings.customReceiptPortalUrl
                                : `${window.location.origin}/receipts`;
                              const separator = baseUrl.includes('?') ? '&' : '?';
                              const url = `${baseUrl}${separator}q=${query}`;
                              navigator.clipboard.writeText(url);
                              alert(`Copied direct receipt link for ${v.name} (${v.flat || v.seva}) to clipboard! Devotees can search and download their official PDF receipt directly.`);
                            }}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-medium px-2 py-1 rounded inline-flex items-center gap-1 transition-colors cursor-pointer border border-emerald-200"
                            title="Copy direct link for devotee to download receipt in /receipts"
                          >
                            <Download className="w-3 h-3 text-emerald-700" />
                            <span className="hidden sm:inline">Link</span>
                          </button>

                          {onShareWhatsApp && (
                            <button
                              onClick={() => onShareWhatsApp(v)}
                              className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded cursor-pointer"
                              title="Share Token on WhatsApp"
                            >
                              <PhoneCall className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Modify Booking (Allowed for both admin & non-admin) */}
                          <button
                            onClick={() => {
                              setSelectedSevaName(v.seva);
                              setBookingModal({ open: true, item: v });
                            }}
                            className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded cursor-pointer"
                            title="Modify Seva Booking"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Booking: STRICTLY ONLY ADMIN CAN DELETE */}
                          {isAdmin && (
                            <button
                              onClick={() => {
                                if (confirm(`Delete seva booking ${v.tokNo} for ${v.name}?`)) {
                                  onDeleteBooking(v.id);
                                }
                              }}
                              className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded cursor-pointer"
                              title="Delete Seva Booking (Admin Only)"
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
            {filtered.length > 0 && (
              <tfoot>
                <tr className="bg-red-50/40 border-t-2 border-[#991B1B] font-bold text-xs text-[#7F1D1D]">
                  <td colSpan={5} className="py-3 px-4 uppercase tracking-wider">
                    Total Sevas ({filtered.length} Bookings)
                  </td>
                  <td className="py-3 px-4 font-mono text-right text-sm">
                    ₹ {fmt(filtered.reduce((s, r) => s + Number(r.amt || 0), 0))}
                  </td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Seva Catalogue Modal */}
      {catModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={e => {
              e.preventDefault();
              const form = e.currentTarget;
              const name = (form.elements.namedItem('name') as HTMLInputElement).value.trim();
              const unit = (form.elements.namedItem('unit') as HTMLInputElement).value.trim();
              const totalRequiredStr = (form.elements.namedItem('totalRequired') as HTMLInputElement).value.trim();
              const totalRequired = totalRequiredStr ? parseFloat(totalRequiredStr) : undefined;
              const amtStr = (form.elements.namedItem('amt') as HTMLInputElement).value.trim();
              const amt = amtStr ? parseFloat(amtStr) : 0;
              const desc = (form.elements.namedItem('desc') as HTMLInputElement).value.trim();

              if (!name) return alert('Enter seva or item name.');

              onSaveCatalogue({
                id: catModal.item?.id || Date.now().toString(),
                name,
                unit: unit || undefined,
                totalRequired: totalRequired && totalRequired > 0 ? totalRequired : undefined,
                amt: amt && amt > 0 ? amt : 0,
                desc: desc || undefined
              });
              setCatModal({ open: false });
            }}
            className="bg-white rounded-xl border border-stone-200 shadow-2xl max-w-md w-full p-6 space-y-4 my-8"
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-lg font-serif font-bold text-[#991B1B]">
                  {catModal.item ? 'Modify Seva Offering' : 'Add New Seva Offering'}
                </h3>
                <p className="text-[11px] text-stone-500">
                  Configure items like Rice, Cow Ghee, Flowers, or Poojas with required quantities. Amount is non-mandatory.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCatModal({ open: false })}
                className="text-stone-400 hover:text-stone-700 text-xl font-bold leading-none cursor-pointer"
              >
                ×
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                Seva Offering / Item Name *
              </label>
              <input
                name="name"
                defaultValue={catModal.item?.name || ''}
                required
                placeholder="e.g. Rice (Anna Prasadam), Pure Cow Ghee, Maha Ganapati Pooja"
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Unit / Measure
                </label>
                <input
                  id="cat-unit-input"
                  name="unit"
                  defaultValue={catModal.item?.unit || ''}
                  placeholder="e.g. kg, Bags, Liters"
                  className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
                />
                {/* Quick preset chips */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {['kg', 'Bags', 'Liters', 'Tins', 'Baskets', 'Slots', 'Kits'].map(u => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => {
                        const el = document.getElementById('cat-unit-input') as HTMLInputElement;
                        if (el) el.value = u;
                      }}
                      className="text-[10px] bg-stone-100 hover:bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Total Required
                </label>
                <input
                  name="totalRequired"
                  type="number"
                  min="0"
                  step="any"
                  defaultValue={catModal.item?.totalRequired ?? ''}
                  placeholder="e.g. 200, 25, 10"
                  className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B] font-mono"
                />
                <span className="text-[10px] text-stone-500">Festival requirement</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                  Suggested Amount (₹)
                </label>
                <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Non-Mandatory
                </span>
              </div>
              <input
                name="amt"
                type="number"
                min="0"
                defaultValue={catModal.item?.amt ?? ''}
                placeholder="Optional. Leave blank or 0 for material/in-kind items"
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B] font-mono"
              />
              <p className="text-[11px] text-stone-500 mt-1">
                Amount is not mandatory. If left blank or 0, this seva is marked as voluntary in-kind material.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                Description / Notes (Optional)
              </label>
              <input
                name="desc"
                defaultValue={catModal.item?.desc || ''}
                placeholder="e.g. Sona Masoori or Basmati, 25kg bags preferred"
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setCatModal({ open: false })}
                className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#991B1B] hover:bg-[#7F1D1D] text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded cursor-pointer"
              >
                Save Offering
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add / Edit Seva Booking Modal */}
      {bookingModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={e => {
              e.preventDefault();
              const form = e.currentTarget;
              const tokNo = (form.elements.namedItem('tokNo') as HTMLInputElement).value.trim();
              const seva = (form.elements.namedItem('seva') as HTMLSelectElement).value;
              const qtyStr = (form.elements.namedItem('qty') as HTMLInputElement).value.trim();
              const qty = qtyStr ? parseFloat(qtyStr) : 1;
              const name = (form.elements.namedItem('name') as HTMLInputElement).value.trim();
              const flat = (form.elements.namedItem('flat') as HTMLInputElement).value.trim();
              const phone = (form.elements.namedItem('phone') as HTMLInputElement)?.value.trim() || '';
              const amtStr = (form.elements.namedItem('amt') as HTMLInputElement)?.value.trim() || '';
              // AMOUNT IS NON-MANDATORY!
              const amt = amtStr ? parseFloat(amtStr) : 0;
              const date = (form.elements.namedItem('date') as HTMLInputElement)?.value;
              const notes = (form.elements.namedItem('notes') as HTMLInputElement)?.value.trim() || '';

              // When adding new booking, always set status to 'Booked'. If modifying existing, retain its status.
              const finalStatus: 'Booked' | 'Confirmed' = bookingModal.item ? (bookingModal.item.status || 'Booked') : 'Booked';

              if (!name) return alert('Enter devotee / resident name.');
              if (!flat) return alert('Enter flat / unit number.');

              // Look up unit for this seva
              const catItem = catalogue.find(c => c.name === seva);

              const row: SevaBooking = {
                id: bookingModal.item?.id || Date.now().toString(),
                tokNo: tokNo || getNextTokNo(),
                seva,
                qty: qty > 0 ? qty : 1,
                unit: catItem?.unit || undefined,
                name,
                flat,
                amt: amt > 0 ? amt : 0,
                date: date || today(),
                phone: phone || undefined,
                gothra: bookingModal.item?.gothra || undefined,
                nakshatra: bookingModal.item?.nakshatra || undefined,
                notes: notes || undefined,
                status: finalStatus,
                createdBy: bookingModal.item?.createdBy || (isAdmin ? 'admin' : 'public/volunteer'),
                confirmedBy: finalStatus === 'Confirmed' ? (bookingModal.item?.confirmedBy || 'Admin') : undefined,
                confirmedAt: finalStatus === 'Confirmed' ? (bookingModal.item?.confirmedAt || new Date().toISOString()) : undefined
              };

              onSaveBooking(row);
              setBookingModal({ open: false });
            }}
            className="bg-white rounded-xl border border-stone-200 shadow-2xl max-w-lg w-full p-6 space-y-4 my-8 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-lg font-serif font-bold text-[#991B1B]">
                  {bookingModal.item ? 'Modify Seva Booking' : 'Add Devotional Seva Booking'}
                </h3>
                <p className="text-[11px] text-stone-500">
                  {bookingModal.item
                    ? 'Update devotee and seva offering details'
                    : 'New seva registration (will be marked as "Booked" for Admin confirmation)'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBookingModal({ open: false })}
                className="text-stone-400 hover:text-stone-700 text-xl font-bold leading-none cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* TOKEN NUMBER & POOJA DATE (NO CONFIRMATION STATUS OPTION) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Token Number *
                </label>
                <input
                  name="tokNo"
                  defaultValue={bookingModal.item?.tokNo || getNextTokNo()}
                  required
                  className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B] font-mono font-bold"
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
                  className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
                />
              </div>
            </div>

            {/* SEVA OFFERING SELECTION */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                Seva Offering / Item *
              </label>
              <select
                name="seva"
                defaultValue={bookingModal.item?.seva || bookingModal.initialSeva || catalogue[0]?.name || 'Rice (Anna Prasadam)'}
                onChange={e => {
                  setSelectedSevaName(e.target.value);
                  const found = catalogue.find(c => c.name === e.target.value);
                  if (found) {
                    const amtInput = (e.currentTarget.form?.elements.namedItem('amt') as HTMLInputElement);
                    if (amtInput && found.amt) {
                      amtInput.value = String(found.amt);
                    }
                  }
                }}
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B] bg-white font-medium"
              >
                {catalogue.map(c => {
                  const stats = getSevaStats(c);
                  const remainingText = stats.hasTotal
                    ? `(Req: ${stats.totalReq} ${c.unit || ''} | Remaining: ${stats.remainingQty} ${c.unit || ''})`
                    : '';
                  return (
                    <option key={c.id} value={c.name}>
                      {c.name} {remainingText} {c.amt && c.amt > 0 ? `— ₹ ${fmt(c.amt)}` : '— In-Kind'}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* LIVE DYNAMIC STATS CARD FOR SELECTED SEVA */}
            {activeStats && activeCatalogueItem && (
              <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3 text-xs space-y-1">
                <div className="flex items-center justify-between font-semibold text-stone-900">
                  <span className="flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-amber-800" />
                    <span>{activeCatalogueItem.name}</span>
                  </span>
                  {activeCatalogueItem.unit && (
                    <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded">
                      Unit: {activeCatalogueItem.unit}
                    </span>
                  )}
                </div>
                {activeStats.hasTotal && (
                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-amber-200/60 font-mono text-[11px]">
                    <div>
                      <span className="text-stone-500 block text-[10px] font-sans">Total Req:</span>
                      <span className="font-bold text-stone-800">{activeStats.totalReq} {activeCatalogueItem.unit}</span>
                    </div>
                    <div>
                      <span className="text-stone-500 block text-[10px] font-sans">Booked:</span>
                      <span className="font-bold text-stone-900">{activeStats.bookedQty} {activeCatalogueItem.unit}</span>
                    </div>
                    <div>
                      <span className="text-stone-500 block text-[10px] font-sans">Remaining:</span>
                      <span className={`font-bold ${activeStats.isFulfilled ? 'text-emerald-700' : 'text-amber-800'}`}>
                        {activeStats.remainingQty} {activeCatalogueItem.unit}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* QUANTITY BOOKED BY SPONSOR & NON-MANDATORY AMOUNT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Quantity Sponsoring ({activeCatalogueItem?.unit || 'Units'}) *
                </label>
                <input
                  name="qty"
                  type="number"
                  min="0.1"
                  step="any"
                  defaultValue={
                    bookingModal.item?.qty ||
                    bookingModal.initialQty ||
                    1
                  }
                  required
                  placeholder="e.g. 10, 25, 1"
                  className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B] font-mono font-bold"
                />
                <span className="text-[10px] text-stone-500">How many units the devotee is contributing</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                    Amount (₹)
                  </label>
                  <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                    Non-Mandatory
                  </span>
                </div>
                <input
                  name="amt"
                  type="number"
                  min="0"
                  defaultValue={
                    bookingModal.item?.amt ??
                    (bookingModal.initialAmt !== undefined ? bookingModal.initialAmt : (activeCatalogueItem?.amt || ''))
                  }
                  placeholder="Optional (₹ 0 for in-kind)"
                  className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B] font-mono"
                />
                <span className="text-[10px] text-stone-500">Optional cash donation. ₹ 0 if donating material directly</span>
              </div>
            </div>

            {/* DEVOTEE NAME & FLAT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Resident / Devotee Name *
                </label>
                <input
                  name="name"
                  defaultValue={bookingModal.item?.name || ''}
                  required
                  placeholder="e.g. Ramesh K"
                  className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Flat / Unit No *
                </label>
                <input
                  name="flat"
                  defaultValue={bookingModal.item?.flat || ''}
                  required
                  placeholder="e.g. Astra-1402"
                  className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
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
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
              />
            </div>

            {/* SANKALPA / NOTES */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                Sankalpa / Notes (Optional)
              </label>
              <input
                name="notes"
                defaultValue={bookingModal.item?.notes || ''}
                placeholder="e.g. Family sankalpa, 25kg bag"
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setBookingModal({ open: false })}
                className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#991B1B] hover:bg-[#7F1D1D] text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded cursor-pointer"
              >
                Save Booking
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Share Seva Portal Modal */}
      {settings && (
        <ShareSevaPortalModal
          open={shareModalOpen}
          settings={settings}
          onClose={() => setShareModalOpen(false)}
          onOpenPortalInApp={onOpenPublicSevaPortal}
          onUpdateSettings={onUpdateSettings}
        />
      )}
    </div>
  );
};
