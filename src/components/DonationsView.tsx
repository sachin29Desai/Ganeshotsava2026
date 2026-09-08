import React, { useState, useRef } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Printer,
  Upload,
  CheckCircle2,
  FileSpreadsheet,
  Info,
  Share2,
  Link2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Contribution, AppSettings } from '../types';
import { fmt, fmtDate, today } from '../utils/helpers';
import { BulkReceiptsModal } from './BulkReceiptsModal';
import { ShareReceiptPortalModal } from './ShareReceiptPortalModal';

interface DonationsViewProps {
  contributions: Contribution[];
  isAdmin: boolean;
  settings: AppSettings;
  onSave: (contribution: Contribution) => void;
  onDelete: (id: string) => void;
  onBulkImport: (newContributions: Contribution[]) => void;
  onPrintReceipt: (contribution: Contribution) => void;
  onShareWhatsApp?: (contribution: Contribution) => void;
  onOpenReceiptPortal?: () => void;
  onUpdateSettings?: (settings: AppSettings) => void;
}

export const DonationsView: React.FC<DonationsViewProps> = ({
  contributions,
  isAdmin,
  settings,
  onSave,
  onDelete,
  onBulkImport,
  onPrintReceipt,
  onShareWhatsApp,
  onOpenReceiptPortal,
  onUpdateSettings
}) => {
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'warning' | 'info' | 'error';
    text: string;
  } | null>(null);

  const [modal, setModal] = useState<{ open: boolean; item?: Contribution | null }>({ open: false });
  const [search, setSearch] = useState('');
  const [bulkPrintOpen, setBulkPrintOpen] = useState<boolean>(false);
  const [sharePortalModalOpen, setSharePortalModalOpen] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalCollected = contributions.reduce((s, r) => s + Number(r.amt || 0), 0);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length && filtered.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(c => c.id)));
    }
  };

  const getNextRcptNo = () => {
    let maxNum = 0;
    contributions.forEach(c => {
      const match = c.rcptNo?.match(/(\d+)$/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    });
    return `GE-2026-${String(maxNum + 1).padStart(4, '0')}`;
  };

  // Filtered rows for display
  const filtered = contributions.filter(c =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.flat || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.rcptNo || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.notes || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.txn || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.pay || '').toLowerCase().includes(search.toLowerCase())
  );

  // Helper to parse dates from various formats (DD-MM-YYYY, D/M/YYYY, Excel serial, ISO)
  const parseExcelDate = (val: any): string => {
    if (!val) return today();
    if (val instanceof Date && !isNaN(val.getTime())) {
      return val.toISOString().split('T')[0];
    }
    if (typeof val === 'number') {
      // Excel serial date to YYYY-MM-DD
      const d = new Date(Math.round((val - 25569) * 86400 * 1000));
      if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    }
    const str = String(val).trim();
    // YYYY-MM-DD
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(str)) {
      const [y, m, d] = str.split('-');
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    // DD-MM-YYYY or DD/MM/YYYY or D/M/YYYY
    const dmMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
    if (dmMatch) {
      return `${dmMatch[3]}-${dmMatch[2].padStart(2, '0')}-${dmMatch[1].padStart(2, '0')}`;
    }
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
    return today();
  };

  // Helper to parse numeric amount from strings with ₹, commas, decimals
  const parseAmount = (val: any): number => {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (!val) return 0;
    const cleaned = String(val).replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  // BULK IMPORT LOGIC
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt: ProgressEvent<FileReader>) => {
      try {
        const buffer = evt.target?.result;
        if (!buffer) return;

        const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
        const sheetName = wb.SheetNames[0];
        const sheet = wb.Sheets[sheetName];
        if (!sheet) {
          alert('Could not find a valid sheet in the uploaded file.');
          return;
        }

        // Convert to array of objects with empty default value
        const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (rawRows.length === 0) {
          alert('No records found in the uploaded file.');
          return;
        }

        // Find starting receipt sequence
        let currentSeq = 0;
        contributions.forEach(c => {
          const match = c.rcptNo?.match(/(\d+)$/);
          if (match) {
            const n = parseInt(match[1], 10);
            if (n > currentSeq) currentSeq = n;
          }
        });

        const newItems: Contribution[] = [];

        for (let i = 0; i < rawRows.length; i++) {
          const r = rawRows[i];

          // Normalize all key names (lowercase, strip non-alphanumeric)
          const norm: Record<string, any> = {};
          for (const k of Object.keys(r)) {
            const cleanKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
            norm[cleanKey] = r[k];
          }

          // Extract Resident Name
          const name = String(
            norm.name ||
            norm.resident ||
            norm.contributor ||
            norm.residentcontributor ||
            norm.donor ||
            norm.donorname ||
            norm.particulars ||
            ''
          ).trim();

          // Skip completely blank rows where both name and amount are missing
          const rawAmt = norm.amountinr || norm.amount || norm.amt || norm.donation || norm.donationamt || norm.rs || norm.inr;
          const amt = parseAmount(rawAmt);

          if (!name && amt <= 0) {
            continue;
          }

          // Extract Flat No (supports 'G-0118', 'XXXXXXX', 'F-1007', etc.)
          const flat = String(
            norm.flatno ||
            norm.flat ||
            norm.flatunit ||
            norm.unit ||
            norm.door ||
            norm.apartment ||
            ''
          ).trim();

          // Extract Date
          const rawDate = norm.date || norm.receiptdate || norm.txndate || norm.dt;
          const date = parseExcelDate(rawDate);

          // Extract Transaction Ref (supports 'W59634397', 'UTR', 'Ref ID', etc.)
          const txn = String(
            norm.transactionref ||
            norm.txnref ||
            norm.txnid ||
            norm.txn ||
            norm.utr ||
            norm.reference ||
            norm.ref ||
            norm.refno ||
            ''
          ).trim();

          // Extract Payment Mode
          let pay = String(norm.paymentmode || norm.pay || norm.mode || norm.paymentmethod || '').trim();
          if (!pay) {
            pay = txn ? 'UPI' : 'Cash';
          }

          // Extract or Auto-generate Receipt No
          let rcptNo = String(norm.receiptno || norm.rcptno || norm.rcpt || norm.receipt || '').trim();
          if (!rcptNo) {
            currentSeq++;
            rcptNo = `GE-2026-${String(currentSeq).padStart(4, '0')}`;
          }

          // Extract Notes / Remarks
          const notes = String(norm.notes || norm.remarks || norm.comment || norm.remark || '').trim();

          newItems.push({
            id: `${Date.now()}_${i}_${Math.random().toString(36).substring(2, 7)}`,
            rcptNo,
            name: name || 'Resident',
            flat,
            amt,
            date,
            pay,
            txn,
            notes
          });
        }

        if (newItems.length === 0) {
          alert('Could not parse valid voluntary contribution rows. Please check headers: Name, Flat No, Amount (₹), Payment Mode, Transaction Ref.');
          return;
        }

        onBulkImport(newItems);
        setStatusMessage({
          type: 'info',
          text: `📥 ${newItems.length} records imported from ${file.name}. Click "Save" next to the Refresh button to commit changes to cloud.`
        });
      } catch (err) {
        console.error('Failed to parse Excel file', err);
        alert('Failed to read file. Please ensure it is a valid Excel (.xlsx / .xls) or CSV file.');
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // BULK EXPORT LOGIC (Exact columns matching user template)
  const handleBulkExport = () => {
    if (contributions.length === 0) {
      alert('No voluntary contribution records available to export.');
      return;
    }

    const exportRows = contributions.map(c => ({
      'Receipt No': c.rcptNo || '',
      'Date': c.date ? fmtDate(c.date) : '',
      'Name': c.name || '',
      'Flat No': c.flat || '',
      'Amount (₹)': Number(c.amt || 0),
      'Payment Mode': c.pay || 'UPI',
      'Transaction Ref': c.txn || '',
      'Notes': c.notes || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);

    // Set custom column widths for readability
    ws['!cols'] = [
      { wch: 15 }, // Receipt No
      { wch: 14 }, // Date
      { wch: 28 }, // Name
      { wch: 12 }, // Flat No
      { wch: 14 }, // Amount (₹)
      { wch: 15 }, // Payment Mode
      { wch: 22 }, // Transaction Ref
      { wch: 25 }  // Notes
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Voluntary Contributions');

    const filename = `Voluntary_Contributions_Resident_${today()}.xlsx`;
    XLSX.writeFile(wb, filename);

    setStatusMessage({
      type: 'info',
      text: `✓ Exported ${contributions.length} voluntary contribution records to ${filename}.`
    });
  };

  // ADD OR EDIT RECORD
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const rcptNo = (form.elements.namedItem('rcptNo') as HTMLInputElement).value.trim();
    const name = (form.elements.namedItem('name') as HTMLInputElement).value.trim();
    const flat = (form.elements.namedItem('flat') as HTMLInputElement).value.trim();
    const amt = parseFloat((form.elements.namedItem('amt') as HTMLInputElement).value) || 0;
    const date = (form.elements.namedItem('date') as HTMLInputElement).value;
    const pay = (form.elements.namedItem('pay') as HTMLSelectElement).value;
    const txn = (form.elements.namedItem('txn') as HTMLInputElement).value.trim();
    const notes = (form.elements.namedItem('notes') as HTMLInputElement).value.trim();

    if (!name) return alert('Enter resident name.');
    if (!amt) return alert('Enter a valid voluntary contribution amount.');

    const row: Contribution = {
      id: modal.item?.id || `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      rcptNo: rcptNo || getNextRcptNo(),
      name,
      flat,
      amt,
      date: date || today(),
      pay,
      txn,
      notes
    };

    onSave(row);
    setModal({ open: false });
    setStatusMessage({
      type: 'info',
      text: `Record saved in memory. Click "Save" next to the Refresh button to commit to cloud.`
    });
  };

  // DELETE RECORD
  const handleDeleteRow = (id: string) => {
    if (confirm('Delete this voluntary contribution record from list? Click "Save" next to Refresh afterwards to commit.')) {
      onDelete(id);
      setStatusMessage({
        type: 'info',
        text: 'Record removed. Click "Save" next to the Refresh button to commit changes to cloud.'
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden File Input for Bulk Import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Status Feedback Notification */}
      {statusMessage && (
        <div
          className={`rounded-lg p-3 text-xs flex items-center justify-between gap-2 transition-all ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : statusMessage.type === 'error'
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-blue-50 text-blue-800 border border-blue-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-stone-400 hover:text-stone-700 font-bold px-1 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Top Controls & Banner */}
      <div className="bg-white border border-stone-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-serif font-bold text-[#1A1A1A]">
              Voluntary Contributions Resident
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Devotee &amp; resident voluntary contributions for Ganeshotsava 2026. Total Collected:{' '}
              <strong className="text-emerald-700 font-mono text-sm">₹ {fmt(totalCollected)}</strong> ({contributions.length} contributors)
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Box */}
            <input
              type="text"
              placeholder="🔍 Search contributor, flat, ref, receipt..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border border-stone-300 rounded px-3 py-1.5 text-xs bg-stone-50 focus:bg-white outline-none focus:border-[#991B1B] w-52 sm:w-60"
            />

            {/* Bulk Print Receipts Button */}
            <button
              onClick={() => setBulkPrintOpen(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Print receipts in bulk and save all receipts in a consolidated PDF document onto your device"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{selectedIds.size > 0 ? `Bulk Print (${selectedIds.size})` : 'Bulk Print Receipts'}</span>
            </button>

            {/* Public Devotee Receipt Portal Link Button */}
            <button
              onClick={() => setSharePortalModalOpen(true)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Share the isolated Devotee Receipt Download link with residents and society WhatsApp groups"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Receipt Download Link</span>
            </button>

            {isAdmin && (
              <>
                {/* Bulk Export Button (Admin Only) */}
                <button
                  onClick={handleBulkExport}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded inline-flex items-center gap-1.5 transition-colors cursor-pointer border border-stone-200"
                  title="Export all resident voluntary contribution records to Excel (.xlsx)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Bulk Export</span>
                </button>

                {/* Bulk Import Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded inline-flex items-center gap-1.5 transition-colors cursor-pointer border border-stone-200"
                  title="Import Excel (.xlsx, .xls) or CSV records"
                >
                  <Upload className="w-3.5 h-3.5 text-[#991B1B]" />
                  <span>Bulk Import</span>
                </button>

                {/* Add Voluntary Contribution Button */}
                <button
                  onClick={() => setModal({ open: true, item: null })}
                  className="bg-[#991B1B] text-white hover:bg-[#7F1D1D] text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Voluntary Contribution</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Selection Banner */}
        {selectedIds.size > 0 && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-900 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-600"></span>
              <span>
                <strong>{selectedIds.size}</strong> of {filtered.length} voluntary contributions selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setBulkPrintOpen(true)}
                className="bg-[#991B1B] hover:bg-[#7F1D1D] text-white px-3 py-1 rounded font-bold text-xs inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Selected Receipts ({selectedIds.size})</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="text-stone-600 hover:text-stone-900 text-xs underline cursor-pointer px-1"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Donations Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#FDF8F3] border-b border-stone-200 text-[10px] font-bold text-stone-500 uppercase tracking-[0.15em]">
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selectedIds.size === filtered.length}
                    onChange={toggleSelectAll}
                    className="rounded border-stone-300 text-[#991B1B] focus:ring-[#991B1B] cursor-pointer"
                    title="Select all / Deselect all"
                  />
                </th>
                <th className="py-3 px-4">Receipt No</th>
                <th className="py-3 px-4">Resident / Contributor</th>
                <th className="py-3 px-4">Flat / Unit</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Mode / Ref</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-stone-400">
                    No resident voluntary contributions found. Click "Bulk Import" to upload your Excel sheet or "Add Voluntary Contribution" to create a record.
                  </td>
                </tr>
              ) : (
                filtered.map(c => (
                  <tr
                    key={c.id}
                    className={`transition-colors ${
                      selectedIds.has(c.id) ? 'bg-amber-50/50' : 'hover:bg-stone-50/60'
                    }`}
                  >
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(c.id)}
                        onChange={() => toggleSelect(c.id)}
                        className="rounded border-stone-300 text-[#991B1B] focus:ring-[#991B1B] cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-stone-900">{c.rcptNo}</td>
                    <td className="py-3 px-4 font-semibold text-stone-900">
                      {c.name}
                      {c.notes && <span className="block text-xs font-normal text-stone-500 italic">{c.notes}</span>}
                    </td>
                    <td className="py-3 px-4">
                      {c.flat ? (
                        <span className="bg-stone-100 text-stone-700 text-xs font-medium px-2 py-0.5 rounded">
                          {c.flat}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-4 text-stone-600 text-xs">{fmtDate(c.date)}</td>
                    <td className="py-3 px-4 text-xs text-stone-600">
                      <span className="font-medium text-stone-800">{c.pay || 'UPI'}</span>
                      {c.txn ? <span className="block text-[10px] font-mono text-stone-500">{c.txn}</span> : null}
                    </td>
                    <td className="py-3 px-4 font-mono text-right font-bold text-emerald-700">₹ {fmt(c.amt)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex gap-1.5 justify-end">
                        <button
                          onClick={() => onPrintReceipt(c)}
                          className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium px-2.5 py-1 rounded inline-flex items-center gap-1 transition-colors cursor-pointer"
                          title="Print Official E-Receipt"
                        >
                          <Printer className="w-3 h-3 text-[#991B1B]" />
                          <span>Receipt</span>
                        </button>
                        <button
                          onClick={() => {
                            const query = encodeURIComponent(c.flat || c.name || '');
                            const baseUrl = settings.customReceiptPortalUrl
                              ? settings.customReceiptPortalUrl
                              : `${window.location.origin}/receipts`;
                            const separator = baseUrl.includes('?') ? '&' : '?';
                            const url = `${baseUrl}${separator}q=${query}`;
                            navigator.clipboard.writeText(url);
                            setStatusMessage({
                              type: 'success',
                              text: `Copied direct receipt link for ${c.flat || c.name}! Devotee can open this short link to download their receipt.`
                            });
                            setTimeout(() => setStatusMessage(null), 4000);
                          }}
                          className="p-1.5 text-stone-600 hover:text-[#991B1B] hover:bg-stone-100 rounded transition-colors cursor-pointer border border-stone-200"
                          title="Copy direct receipt download link for this devotee"
                        >
                          <Link2 className="w-3 h-3" />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => setModal({ open: true, item: c })}
                              className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded cursor-pointer"
                              title="Edit Record"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteRow(c.id)}
                              className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded cursor-pointer"
                              title="Delete Record"
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
                  <td colSpan={5} className="py-3 px-4 uppercase tracking-wider">
                    Total Voluntary Contributions ({filtered.length} records)
                  </td>
                  <td className="py-3 px-4 font-mono text-right text-sm">₹ {fmt(totalCollected)}</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Add / Edit Voluntary Contribution Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleFormSubmit}
            className="bg-white rounded-lg border border-stone-200 shadow-2xl max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-lg font-serif font-bold text-[#991B1B]">
                {modal.item ? 'Edit Voluntary Contribution' : 'Add Voluntary Contribution'}
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
                Receipt Number *
              </label>
              <input
                name="rcptNo"
                defaultValue={modal.item?.rcptNo || getNextRcptNo()}
                required
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B] font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Resident Name *
                </label>
                <input
                  name="name"
                  defaultValue={modal.item?.name || ''}
                  required
                  placeholder="e.g. ABISHEK KUMAR"
                  className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Flat / Unit No
                </label>
                <input
                  name="flat"
                  defaultValue={modal.item?.flat || ''}
                  placeholder="e.g. G-0118 / XXXXXXX"
                  className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Voluntary Contribution Amount (₹) *
                </label>
                <input
                  name="amt"
                  type="number"
                  defaultValue={modal.item?.amt ?? ''}
                  required
                  placeholder="1000"
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
                  defaultValue={modal.item?.date || today()}
                  className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Payment Mode
                </label>
                <select
                  name="pay"
                  defaultValue={modal.item?.pay || 'UPI'}
                  className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B] bg-white"
                >
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer / NEFT</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Transaction Ref / ID
                </label>
                <input
                  name="txn"
                  defaultValue={modal.item?.txn || ''}
                  placeholder="e.g. W59634397"
                  className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                Notes
              </label>
              <input
                name="notes"
                defaultValue={modal.item?.notes || ''}
                placeholder="Optional devotional remark or note"
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
              />
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
                Done (Pending Save)
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bulk Receipts Modal for Printing and PDF Export */}
      <BulkReceiptsModal
        open={bulkPrintOpen}
        onClose={() => setBulkPrintOpen(false)}
        items={contributions}
        settings={settings}
        selectedIds={selectedIds}
        onClearSelection={() => setSelectedIds(new Set())}
      />

      {/* Devotee Receipt Download Portal Share Modal */}
      <ShareReceiptPortalModal
        open={sharePortalModalOpen}
        settings={settings}
        onClose={() => setSharePortalModalOpen(false)}
        onOpenPortalInApp={onOpenReceiptPortal}
        onUpdateSettings={onUpdateSettings}
      />
    </div>
  );
};
