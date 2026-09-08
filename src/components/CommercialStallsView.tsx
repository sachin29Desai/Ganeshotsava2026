import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Printer } from 'lucide-react';
import { CommercialStall } from '../types';
import { fmt, today } from '../utils/helpers';

interface CommercialStallsViewProps {
  stalls: CommercialStall[];
  isAdmin: boolean;
  onSave: (stall: CommercialStall) => void;
  onDelete: (id: string) => void;
  onPrintInvoice: (stall: CommercialStall) => void;
  onShareWhatsApp?: (stall: CommercialStall) => void;
}

export const getStallFields = (s: CommercialStall): { particular: string; vendor: string } => {
  if (s.particular !== undefined || s.vendor !== undefined) {
    return {
      particular: s.particular || s.det || '',
      vendor: s.vendor || ''
    };
  }
  const text = (s.det || '').trim();
  if (text.includes(' — ')) {
    const [p, ...v] = text.split(' — ');
    return { particular: p.trim(), vendor: v.join(' — ').trim() };
  }
  if (text.includes(' - ')) {
    const [p, ...v] = text.split(' - ');
    return { particular: p.trim(), vendor: v.join(' - ').trim() };
  }
  if (text.includes('\n')) {
    const [p, ...v] = text.split('\n');
    return { particular: p.trim(), vendor: v.join('\n').trim() };
  }
  return { particular: text, vendor: '' };
};

export const CommercialStallsView: React.FC<CommercialStallsViewProps> = ({
  stalls,
  isAdmin,
  onSave,
  onDelete,
  onPrintInvoice,
  onShareWhatsApp
}) => {
  const [modal, setModal] = useState<{ open: boolean; item?: CommercialStall | null }>({ open: false });
  const [search, setSearch] = useState('');

  const totalEst = stalls.reduce((s, r) => s + Number(r.est || 0), 0);
  const totalAct = stalls.reduce((s, r) => s + Number(r.act || 0), 0);

  const getNextInvNo = () => {
    let maxNum = 0;
    stalls.forEach(s => {
      const match = s.invNo?.match(/(\d+)$/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    });
    return `GNS-CS-${String(maxNum + 1).padStart(3, '0')}`;
  };

  const filtered = stalls.filter(s => {
    const { particular, vendor } = getStallFields(s);
    const q = search.toLowerCase();
    return (
      (s.det || '').toLowerCase().includes(q) ||
      particular.toLowerCase().includes(q) ||
      vendor.toLowerCase().includes(q) ||
      (s.invNo || '').toLowerCase().includes(q) ||
      (s.notes || '').toLowerCase().includes(q)
    );
  });

  const modalItemFields = modal.item ? getStallFields(modal.item) : { particular: '', vendor: '' };

  return (
    <div className="space-y-4">
      {/* Top Banner & KPI summary */}
      <div className="bg-white border border-stone-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-serif font-bold text-[#1A1A1A]">Education Fest</h2>
            <p className="text-xs text-stone-500">
              Education fest stalls, commercial counters, food kiosks, and vendor exhibitions. Total Actual:{' '}
              <strong className="text-emerald-700 font-mono">₹ {fmt(totalAct)}</strong> (Est: ₹ {fmt(totalEst)})
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <input
              type="text"
              placeholder="🔍 Search stalls, vendor, invoice..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border border-stone-300 rounded px-3 py-1.5 text-xs bg-stone-50 focus:bg-white outline-none focus:border-[#991B1B] w-56 sm:w-64"
            />
            {isAdmin && (
              <button
                onClick={() => setModal({ open: true, item: null })}
                className="bg-[#991B1B] text-white hover:bg-[#7F1D1D] text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Education Fest Stall</span>
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
                <th className="py-3 px-4">Particular</th>
                <th className="py-3 px-4">Vendor Details</th>
                <th className="py-3 px-4 text-right">Estimated (₹)</th>
                <th className="py-3 px-4 text-right">Actual (₹)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-400">
                    No commercial stalls recorded yet.
                  </td>
                </tr>
              ) : (
                filtered.map(s => {
                  const { particular, vendor } = getStallFields(s);
                  return (
                    <tr key={s.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-stone-900">{s.invNo}</td>
                      <td className="py-3 px-4 font-semibold text-stone-900 whitespace-pre-line">
                        {particular || <span className="text-stone-400 font-normal italic">Unspecified Stall</span>}
                        {s.notes && <span className="block text-xs font-normal text-stone-500 italic mt-0.5">{s.notes}</span>}
                      </td>
                      <td className="py-3 px-4 text-stone-800 whitespace-pre-line font-medium">
                        {vendor || <span className="text-stone-400 font-normal">—</span>}
                      </td>
                      <td className="py-3 px-4 font-mono text-right text-stone-700">₹ {fmt(s.est)}</td>
                      <td className="py-3 px-4 font-mono text-right font-bold text-emerald-700">₹ {fmt(s.act)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex gap-1.5 justify-end">
                          <button
                            onClick={() => onPrintInvoice(s)}
                            className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium px-2.5 py-1 rounded inline-flex items-center gap-1 transition-colors cursor-pointer"
                            title="Print Commercial Stall Invoice"
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
                                  if (confirm('Delete this commercial stall entry?')) {
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
                    Total Education Fest
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

      {/* Add / Edit Stall Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={e => {
              e.preventDefault();
              const form = e.currentTarget;
              const invNo = (form.elements.namedItem('invNo') as HTMLInputElement).value.trim();
              const particular = (form.elements.namedItem('particular') as HTMLInputElement).value.trim();
              const vendor = (form.elements.namedItem('vendor') as HTMLTextAreaElement).value.trim();
              const est = parseFloat((form.elements.namedItem('est') as HTMLInputElement).value) || 0;
              const act = parseFloat((form.elements.namedItem('act') as HTMLInputElement).value) || 0;
              const date = (form.elements.namedItem('date') as HTMLInputElement).value;
              const notes = (form.elements.namedItem('notes') as HTMLInputElement).value.trim();

              if (!particular) return alert('Enter stall particular / description.');

              const det = vendor ? `${particular} — ${vendor}` : particular;

              const row: CommercialStall = {
                id: modal.item?.id || Date.now().toString(),
                invNo: invNo || getNextInvNo(),
                particular,
                vendor,
                det,
                est,
                act,
                date: date || today(),
                notes
              };

              onSave(row);
              setModal({ open: false });
            }}
            className="bg-white rounded-lg border border-stone-200 shadow-2xl max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-lg font-serif font-bold text-[#991B1B]">
                {modal.item ? 'Edit Commercial Stall' : 'Add Commercial Stall'}
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
                Particular *
              </label>
              <input
                name="particular"
                defaultValue={modalItemFields.particular}
                required
                placeholder="e.g. Food Stall #2, Handicrafts Stall, Game Kiosk"
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                Vendor Details *
              </label>
              <textarea
                name="vendor"
                defaultValue={modalItemFields.vendor}
                rows={2}
                required
                placeholder="e.g. Sharma Chaat & Sweets (Contact: 9876543210 / Flat 402)"
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Date
                </label>
                <input
                  name="date"
                  type="date"
                  defaultValue={modal.item?.date || today()}
                  className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Notes
                </label>
                <input
                  name="notes"
                  defaultValue={modal.item?.notes || ''}
                  placeholder="e.g. Paid in full via UPI"
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
                Save Stall
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
