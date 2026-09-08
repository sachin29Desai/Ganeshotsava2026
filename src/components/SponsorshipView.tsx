import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Printer, CreditCard, Banknote, Landmark } from 'lucide-react';
import { Sponsor } from '../types';
import { fmt } from '../utils/helpers';

interface SponsorshipViewProps {
  sponsors: Sponsor[];
  isAdmin: boolean;
  onSave: (sponsor: Sponsor) => void;
  onDelete: (id: string) => void;
  onPrintInvoice: (sponsor: Sponsor) => void;
  onShareWhatsApp?: (sponsor: Sponsor) => void;
}

export const SponsorshipView: React.FC<SponsorshipViewProps> = ({
  sponsors,
  isAdmin,
  onSave,
  onDelete,
  onPrintInvoice
}) => {
  const [modal, setModal] = useState<{ open: boolean; item?: Sponsor | null }>({ open: false });
  const [search, setSearch] = useState('');

  // Modal form states
  const [payMode, setPayMode] = useState<'UPI' | 'CASH' | 'NEFT' | string>('UPI');
  const [notes, setNotes] = useState('');

  // Reset modal fields when opening/changing item
  useEffect(() => {
    if (modal.open) {
      setPayMode(modal.item?.payMode || 'UPI');
      setNotes(modal.item?.notes || '');
    }
  }, [modal]);

  const totalEst = sponsors.reduce((s, r) => s + Number(r.est || 0), 0);
  const totalAct = sponsors.reduce((s, r) => s + Number(r.act || 0), 0);

  const getNextInvNo = () => {
    let maxNum = 0;
    sponsors.forEach(s => {
      const match = s.invNo?.match(/(\d+)$/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    });
    return `GNS-SP-${String(maxNum + 1).padStart(3, '0')}`;
  };

  const filtered = sponsors.filter(s => {
    const q = search.toLowerCase();
    return (
      (s.det || '').toLowerCase().includes(q) ||
      (s.invNo || '').toLowerCase().includes(q) ||
      (s.payMode || '').toLowerCase().includes(q) ||
      (s.notes || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white border border-stone-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-serif font-bold text-[#1A1A1A]">Sponsorship</h2>
            <p className="text-xs text-stone-500">
              Commercial corporate &amp; local business sponsors. Total Actual:{' '}
              <strong className="text-emerald-700 font-mono">₹ {fmt(totalAct)}</strong> (Est: ₹ {fmt(totalEst)})
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <input
              type="text"
              placeholder="🔍 Search sponsor, invoice, UPI/CASH/NEFT..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border border-stone-300 rounded px-3 py-1.5 text-xs bg-stone-50 focus:bg-white outline-none focus:border-[#991B1B] w-56 sm:w-72"
            />
            {isAdmin && (
              <button
                onClick={() => setModal({ open: true, item: null })}
                className="bg-[#991B1B] text-white hover:bg-[#7F1D1D] text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Sponsor</span>
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#FDF8F3] border-b border-stone-200 text-[10px] font-bold text-stone-500 uppercase tracking-[0.15em]">
                <th className="py-3 px-4">Invoice No</th>
                <th className="py-3 px-4">Sponsor Details</th>
                <th className="py-3 px-4">Payment Mode &amp; Notes</th>
                <th className="py-3 px-4 text-right">Estimated (₹)</th>
                <th className="py-3 px-4 text-right">Actual (₹)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-400">
                    No sponsors recorded yet.
                  </td>
                </tr>
              ) : (
                filtered.map(s => {
                  const mode = (s.payMode || 'UPI').toUpperCase();
                  return (
                    <tr key={s.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-stone-900">{s.invNo}</td>
                      <td className="py-3 px-4 font-semibold text-stone-900 whitespace-pre-line">{s.det}</td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                              mode === 'CASH'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : mode === 'NEFT'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}
                          >
                            {mode === 'CASH' && <Banknote className="w-3 h-3" />}
                            {mode === 'NEFT' && <Landmark className="w-3 h-3" />}
                            {mode === 'UPI' && <CreditCard className="w-3 h-3" />}
                            <span>{s.payMode || 'UPI'}</span>
                          </span>
                          {s.notes && (
                            <p className="text-xs text-stone-600 italic whitespace-pre-line leading-snug">
                              {s.notes}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-right text-stone-700">₹ {fmt(s.est)}</td>
                      <td className="py-3 px-4 font-mono text-right font-bold text-emerald-700">₹ {fmt(s.act)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex gap-1.5 justify-end">
                          <button
                            onClick={() => onPrintInvoice(s)}
                            className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium px-2.5 py-1 rounded inline-flex items-center gap-1 transition-colors cursor-pointer"
                            title="Print Sponsorship Invoice"
                          >
                            <Printer className="w-3 h-3 text-[#991B1B]" />
                            <span>Invoice</span>
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => setModal({ open: true, item: s })}
                                className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded cursor-pointer"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('Delete this sponsor?')) {
                                    onDelete(s.id);
                                  }
                                }}
                                className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
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
                  <td colSpan={3} className="py-3 px-4 uppercase tracking-wider">
                    Total Sponsorship
                  </td>
                  <td className="py-3 px-4 font-mono text-right">₹ {fmt(totalEst)}</td>
                  <td className="py-3 px-4 font-mono text-right text-sm">₹ {fmt(totalAct)}</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Add / Edit Sponsor Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={e => {
              e.preventDefault();
              const form = e.currentTarget;
              const invNo = (form.elements.namedItem('invNo') as HTMLInputElement).value.trim();
              const det = (form.elements.namedItem('det') as HTMLTextAreaElement).value.trim();
              const est = parseFloat((form.elements.namedItem('est') as HTMLInputElement).value) || 0;
              const act = parseFloat((form.elements.namedItem('act') as HTMLInputElement).value) || 0;

              if (!det) return alert('Enter sponsor details.');

              const row: Sponsor = {
                id: modal.item?.id || Date.now().toString(),
                invNo: invNo || getNextInvNo(),
                det,
                est,
                act,
                payMode,
                notes: notes.trim(),
                date: modal.item?.date || new Date().toISOString().split('T')[0]
              };

              onSave(row);
              setModal({ open: false });
            }}
            className="bg-white rounded-lg border border-stone-200 shadow-2xl max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-lg font-serif font-bold text-[#991B1B]">
                {modal.item ? 'Edit Sponsor' : 'Add Sponsor'}
              </h3>
              <button
                type="button"
                onClick={() => setModal({ open: false })}
                className="text-stone-400 hover:text-stone-700 text-xl font-bold leading-none cursor-pointer"
              >
                ×
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                Invoice Number *
              </label>
              <input
                name="invNo"
                defaultValue={modal.item?.invNo || getNextInvNo()}
                required
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B] font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                Sponsor Details &amp; Company Name *
              </label>
              <textarea
                name="det"
                defaultValue={modal.item?.det || ''}
                rows={3}
                required
                placeholder="e.g. Apex Hospitalities Ltd (Contact: Rajesh Gupta - 9988776655)"
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
              />
            </div>

            {/* Payment Mode Selection: UPI / CASH / NEFT */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                Payment Mode (UPI / CASH / NEFT)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPayMode('UPI')}
                  className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    payMode === 'UPI'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-300'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>UPI</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPayMode('CASH')}
                  className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    payMode === 'CASH'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-300'
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5" />
                  <span>CASH</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPayMode('NEFT')}
                  className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    payMode === 'NEFT'
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-300'
                  }`}
                >
                  <Landmark className="w-3.5 h-3.5" />
                  <span>NEFT</span>
                </button>
              </div>
            </div>

            {/* Notes for UPI / CASH / NEFT */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                  Notes for {payMode} (Ref / UTR / Cash Details)
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const prefix = payMode === 'UPI' ? 'UPI Ref: ' : payMode === 'NEFT' ? 'NEFT UTR: ' : 'Cash Handed to: ';
                      if (!notes.includes(prefix)) {
                        setNotes(prev => (prev ? `${prev}, ${prefix}` : prefix));
                      }
                    }}
                    className="text-[10px] text-[#991B1B] hover:underline font-semibold cursor-pointer"
                  >
                    + Add {payMode} Tag
                  </button>
                </div>
              </div>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                placeholder={
                  payMode === 'UPI'
                    ? 'e.g. UPI Ref: 4293810928, paid from GooglePay'
                    : payMode === 'NEFT'
                    ? 'e.g. NEFT UTR: HDFC000192834, Axis Bank account'
                    : 'e.g. Cash handed over to Committee Treasurer on 14-Sep'
                }
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Estimated Amount (₹)
                </label>
                <input
                  name="est"
                  type="number"
                  defaultValue={modal.item?.est ?? ''}
                  placeholder="0"
                  className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Actual Amount (₹) *
                </label>
                <input
                  name="act"
                  type="number"
                  defaultValue={modal.item?.act ?? ''}
                  required
                  placeholder="0"
                  className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setModal({ open: false })}
                className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#991B1B] hover:bg-[#7F1D1D] text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded cursor-pointer"
              >
                Save Sponsor
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
