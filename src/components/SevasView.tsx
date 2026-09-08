import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Printer } from 'lucide-react';
import { SevaBooking, SevaCatalogueItem } from '../types';
import { fmt, fmtDate, today } from '../utils/helpers';

interface SevasViewProps {
  sevas: SevaBooking[];
  catalogue: SevaCatalogueItem[];
  isAdmin: boolean;
  onSaveBooking: (booking: SevaBooking) => void;
  onDeleteBooking: (id: string) => void;
  onSaveCatalogue: (item: SevaCatalogueItem) => void;
  onDeleteCatalogue: (id: string) => void;
  onPrintReceipt: (booking: SevaBooking) => void;
  onShareWhatsApp?: (booking: SevaBooking) => void;
}

export const SevasView: React.FC<SevasViewProps> = ({
  sevas,
  catalogue,
  isAdmin,
  onSaveBooking,
  onDeleteBooking,
  onSaveCatalogue,
  onDeleteCatalogue,
  onPrintReceipt,
  onShareWhatsApp
}) => {
  const [bookingModal, setBookingModal] = useState<{ open: boolean; item?: SevaBooking | null }>({ open: false });
  const [catModal, setCatModal] = useState<{ open: boolean; item?: SevaCatalogueItem | null }>({ open: false });
  const [search, setSearch] = useState('');

  const totalAct = sevas.reduce((s, r) => s + Number(r.amt || 0), 0);

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

  const filtered = sevas.filter(v =>
    (v.seva || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.flat || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.tokNo || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Seva Catalogue */}
      <div className="bg-white border border-stone-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-serif font-bold text-[#1A1A1A]">Available Sevas</h2>
            <p className="text-xs text-stone-500">Preset devotional offerings with suggested voluntary contribution amounts.</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setCatModal({ open: true, item: null })}
              className="bg-[#991B1B] text-white hover:bg-[#7F1D1D] text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Seva Offering</span>
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#FDF8F3] border-b border-stone-200 text-[10px] font-bold text-stone-500 uppercase tracking-[0.15em]">
                <th className="py-3 px-4 w-12">#</th>
                <th className="py-3 px-4">Seva Offering Name</th>
                <th className="py-3 px-4 text-right">Suggested Amount (₹)</th>
                {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {catalogue.map((sc, idx) => (
                <tr key={sc.id} className="hover:bg-stone-50/60 transition-colors">
                  <td className="py-3 px-4 text-stone-400 text-xs">{idx + 1}</td>
                  <td className="py-3 px-4 font-semibold text-stone-900">{sc.name}</td>
                  <td className="py-3 px-4 font-mono text-right text-stone-700">₹ {fmt(sc.amt)}</td>
                  {isAdmin && (
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex gap-1.5 justify-end">
                        <button
                          onClick={() => setCatModal({ open: true, item: sc })}
                          className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Delete this seva catalogue item?')) {
                              onDeleteCatalogue(sc.id);
                            }
                          }}
                          className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Seva Bookings */}
      <div className="bg-white border border-stone-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-serif font-bold text-[#1A1A1A]">Seva Bookings</h2>
            <div className="text-xs text-stone-500">
              Total Seva Voluntary Contributions: <strong className="text-emerald-700 font-mono">₹ {fmt(totalAct)}</strong> ({sevas.length} bookings)
            </div>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <input
              type="text"
              placeholder="🔍 Search seva, resident, flat…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border border-stone-300 rounded px-3 py-1.5 text-xs bg-stone-50 focus:bg-white outline-none focus:border-[#991B1B] w-56 sm:w-64"
            />
            {isAdmin && (
              <button
                onClick={() => setBookingModal({ open: true, item: null })}
                className="bg-[#991B1B] text-white hover:bg-[#7F1D1D] text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Seva Booking</span>
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#FDF8F3] border-b border-stone-200 text-[10px] font-bold text-stone-500 uppercase tracking-[0.15em]">
                <th className="py-3 px-4">Token No</th>
                <th className="py-3 px-4">Seva Name</th>
                <th className="py-3 px-4">Resident Name</th>
                <th className="py-3 px-4">Flat No</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-400">
                    No seva bookings found.
                  </td>
                </tr>
              ) : (
                filtered.map(v => (
                  <tr key={v.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-stone-900">{v.tokNo}</td>
                    <td className="py-3 px-4 font-semibold text-stone-900">{v.seva}</td>
                    <td className="py-3 px-4 text-stone-800">{v.name}</td>
                    <td className="py-3 px-4">
                      <span className="bg-stone-100 text-stone-700 text-xs font-medium px-2 py-0.5 rounded">
                        {v.flat}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-right font-bold text-emerald-700">₹ {fmt(v.amt)}</td>
                    <td className="py-3 px-4 text-stone-600 text-xs">{fmtDate(v.date)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex gap-1.5 justify-end">
                        <button
                          onClick={() => onPrintReceipt(v)}
                          className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium px-2.5 py-1 rounded inline-flex items-center gap-1 transition-colors cursor-pointer"
                          title="Print Seva Receipt"
                        >
                          <Printer className="w-3 h-3 text-[#991B1B]" />
                          <span>Receipt</span>
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => setBookingModal({ open: true, item: v })}
                              className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Delete this seva booking?')) {
                                  onDeleteBooking(v.id);
                                }
                              }}
                              className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded cursor-pointer"
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
                    Total Sevas
                  </td>
                  <td className="py-3 px-4 font-mono text-right text-sm">₹ {fmt(totalAct)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Seva Catalogue Modal */}
      {catModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={e => {
              e.preventDefault();
              const form = e.currentTarget;
              const name = (form.elements.namedItem('name') as HTMLInputElement).value.trim();
              const amt = parseFloat((form.elements.namedItem('amt') as HTMLInputElement).value) || 0;
              if (!name) return alert('Enter seva name.');
              onSaveCatalogue({
                id: catModal.item?.id || Date.now().toString(),
                name,
                amt
              });
              setCatModal({ open: false });
            }}
            className="bg-white rounded-lg border border-stone-200 shadow-2xl max-w-sm w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-lg font-serif font-bold text-[#991B1B]">
                {catModal.item ? 'Edit Seva Item' : 'Add Seva Item'}
              </h3>
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
                Seva Name *
              </label>
              <input
                name="name"
                defaultValue={catModal.item?.name || ''}
                required
                placeholder="e.g. Maha Ganapati Abhishekam"
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                Suggested Amount (₹) *
              </label>
              <input
                name="amt"
                type="number"
                defaultValue={catModal.item?.amt ?? ''}
                required
                placeholder="501"
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
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add / Edit Seva Booking Modal */}
      {bookingModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={e => {
              e.preventDefault();
              const form = e.currentTarget;
              const tokNo = (form.elements.namedItem('tokNo') as HTMLInputElement).value.trim();
              const seva = (form.elements.namedItem('seva') as HTMLSelectElement).value;
              const name = (form.elements.namedItem('name') as HTMLInputElement).value.trim();
              const flat = (form.elements.namedItem('flat') as HTMLInputElement).value.trim();
              const amt = parseFloat((form.elements.namedItem('amt') as HTMLInputElement).value) || 0;
              const date = (form.elements.namedItem('date') as HTMLInputElement).value;
              const notes = (form.elements.namedItem('notes') as HTMLInputElement).value.trim();

              if (!name) return alert('Enter devotee / resident name.');
              if (!amt) return alert('Enter seva amount.');

              const row: SevaBooking = {
                id: bookingModal.item?.id || Date.now().toString(),
                tokNo: tokNo || getNextTokNo(),
                seva,
                name,
                flat,
                amt,
                date: date || today(),
                notes
              };

              onSaveBooking(row);
              setBookingModal({ open: false });
            }}
            className="bg-white rounded-lg border border-stone-200 shadow-2xl max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-lg font-serif font-bold text-[#991B1B]">
                {bookingModal.item ? 'Edit Seva Booking' : 'Add Seva Booking'}
              </h3>
              <button
                type="button"
                onClick={() => setBookingModal({ open: false })}
                className="text-stone-400 hover:text-stone-700 text-xl font-bold leading-none cursor-pointer"
              >
                ×
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                Token Number *
              </label>
              <input
                name="tokNo"
                defaultValue={bookingModal.item?.tokNo || getNextTokNo()}
                required
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B] font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                Seva Offering *
              </label>
              <select
                name="seva"
                defaultValue={bookingModal.item?.seva || catalogue[0]?.name || 'Maha Pooja'}
                onChange={e => {
                  const found = catalogue.find(c => c.name === e.target.value);
                  if (found) {
                    const amtInput = (e.currentTarget.form?.elements.namedItem('amt') as HTMLInputElement);
                    if (amtInput) amtInput.value = String(found.amt);
                  }
                }}
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B] bg-white"
              >
                {catalogue.map(c => (
                  <option key={c.id} value={c.name}>
                    {c.name} — ₹ {fmt(c.amt)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Resident Name *
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
                  placeholder="e.g. B-204"
                  className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Amount (₹) *
                </label>
                <input
                  name="amt"
                  type="number"
                  defaultValue={bookingModal.item?.amt ?? (catalogue[0]?.amt || 501)}
                  required
                  placeholder="0"
                  className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Date
                </label>
                <input
                  name="date"
                  type="date"
                  defaultValue={bookingModal.item?.date || today()}
                  className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                Gotra / Devotional Remarks
              </label>
              <input
                name="notes"
                defaultValue={bookingModal.item?.notes || ''}
                placeholder="e.g. Kashyapa Gotra, Sankalpa with family"
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
    </div>
  );
};
