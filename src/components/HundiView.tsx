import React, { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { HundiCollection } from '../types';
import { fmt, fmtDate, today } from '../utils/helpers';

interface HundiViewProps {
  hundi: HundiCollection[];
  isAdmin: boolean;
  onSave: (hundi: HundiCollection) => void;
  onDelete: (id: string) => void;
  onShareWhatsApp?: (hundi: HundiCollection) => void;
}

export const HundiView: React.FC<HundiViewProps> = ({
  hundi,
  isAdmin,
  onSave,
  onDelete
}) => {
  const [modal, setModal] = useState<{ open: boolean; item?: HundiCollection | null }>({ open: false });
  const [search, setSearch] = useState('');

  const totalAct = hundi.reduce((s, r) => s + Number(r.act || 0), 0);

  const filtered = hundi.filter(h =>
    (h.det || '').toLowerCase().includes(search.toLowerCase()) ||
    (h.countedBy || '').toLowerCase().includes(search.toLowerCase()) ||
    (h.notes || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white border border-stone-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-serif font-bold text-[#1A1A1A]">Hundi Collections</h2>
            <p className="text-xs text-stone-500">
              Sanctum hundi counts, daily aarti collections, and hundi count particulars. Total Collection:{' '}
              <strong className="text-emerald-700 font-mono">₹ {fmt(totalAct)}</strong> ({hundi.length} countings)
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <input
              type="text"
              placeholder="🔍 Search hundi particulars..."
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
                <span>Add Hundi Count</span>
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#FDF8F3] border-b border-stone-200 text-[10px] font-bold text-stone-500 uppercase tracking-[0.15em]">
                <th className="py-3 px-4 w-12">#</th>
                <th className="py-3 px-4">Particular Details</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Counted / Supervised By</th>
                <th className="py-3 px-4 text-right">Actual Amount (₹)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-400">
                    No hundi collections recorded yet.
                  </td>
                </tr>
              ) : (
                filtered.map((h, idx) => (
                  <tr key={h.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="py-3 px-4 text-stone-400 text-xs">{idx + 1}</td>
                    <td className="py-3 px-4 font-semibold text-stone-900 whitespace-pre-line">
                      {h.det}
                      {h.notes && <span className="block text-xs font-normal text-stone-500 italic mt-0.5">{h.notes}</span>}
                    </td>
                    <td className="py-3 px-4 text-stone-600 text-xs">{fmtDate(h.date)}</td>
                    <td className="py-3 px-4 text-stone-700 text-xs">{h.countedBy || '—'}</td>
                    <td className="py-3 px-4 font-mono text-right font-bold text-emerald-700">₹ {fmt(h.act)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex gap-1.5 justify-end">
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => setModal({ open: true, item: h })}
                              className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded cursor-pointer"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Delete this hundi record?')) {
                                  onDelete(h.id);
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
                ))
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="bg-red-50/40 border-t-2 border-[#991B1B] font-bold text-xs text-[#7F1D1D]">
                  <td colSpan={4} className="py-3 px-4 uppercase tracking-wider">
                    Total Hundi Collection
                  </td>
                  <td className="py-3 px-4 font-mono text-right text-sm">₹ {fmt(totalAct)}</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Add / Edit Hundi Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={e => {
              e.preventDefault();
              const form = e.currentTarget;
              const det = (form.elements.namedItem('det') as HTMLTextAreaElement).value.trim();
              const act = parseFloat((form.elements.namedItem('act') as HTMLInputElement).value) || 0;
              const date = (form.elements.namedItem('date') as HTMLInputElement).value;
              const countedBy = (form.elements.namedItem('countedBy') as HTMLInputElement).value.trim();
              const notes = (form.elements.namedItem('notes') as HTMLInputElement).value.trim();

              if (!det) return alert('Enter particular details.');

              const row: HundiCollection = {
                id: modal.item?.id || Date.now().toString(),
                det,
                act,
                date: date || today(),
                countedBy,
                notes
              };

              onSave(row);
              setModal({ open: false });
            }}
            className="bg-white rounded-lg border border-stone-200 shadow-2xl max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-lg font-serif font-bold text-[#991B1B]">
                {modal.item ? 'Edit Hundi Count' : 'Add Hundi Count'}
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
                Particular Details *
              </label>
              <textarea
                name="det"
                defaultValue={modal.item?.det || ''}
                rows={3}
                required
                placeholder="e.g. Day 1 Main Sanctum Hundi Cash Count"
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Date *
                </label>
                <input
                  name="date"
                  type="date"
                  defaultValue={modal.item?.date || today()}
                  required
                  className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Counted / Supervised By
                </label>
                <input
                  name="countedBy"
                  defaultValue={modal.item?.countedBy || ''}
                  placeholder="e.g. Committee Members"
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
                  placeholder="e.g. Verified with 3 witnesses"
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
                Save Hundi Count
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
