import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Download,
  Printer,
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  UploadCloud,
  CheckCircle2,
  Loader2,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet
} from 'lucide-react';
import { Expense, ExpenseBill } from '../types';
import { fmt, fmtDate, today, getExpenseBalance, getExpenseActual, compressImageFile } from '../utils/helpers';

interface ExpenditureViewProps {
  expenses: Expense[];
  isAdmin: boolean;
  onSave: (exp: Expense) => void;
  onDelete: (id: string) => void;
}

export const getExpenseBills = (e: Expense): ExpenseBill[] => {
  if (e.bills && Array.isArray(e.bills) && e.bills.length > 0) {
    return e.bills;
  }
  if (e.receiptUrl) {
    return [
      {
        id: 'legacy-1',
        url: e.receiptUrl,
        name: e.receiptName || 'Attached_Bill',
        type: e.receiptType || 'image/jpeg',
        date: e.receiptDate || today(),
        comments: ''
      }
    ];
  }
  return [];
};

export const ExpenditureView: React.FC<ExpenditureViewProps> = ({
  expenses,
  isAdmin,
  onSave,
  onDelete
}) => {
  const [modal, setModal] = useState<{ open: boolean; item?: Expense | null }>({ open: false });
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  const [activeBillIdx, setActiveBillIdx] = useState<number>(0);
  const [search, setSearch] = useState('');

  // Quick Attach Modal State
  const [quickAttachModal, setQuickAttachModal] = useState<{
    open: boolean;
    expense: Expense | null;
    bills: ExpenseBill[];
  }>({
    open: false,
    expense: null,
    bills: []
  });

  // Form State for Add / Edit Modal
  const [formData, setFormData] = useState<{
    id: string;
    item: string;
    est: string;
    adv: string;
    bal: string;
    act: string;
    notes: string;
    bills: ExpenseBill[];
  }>({
    id: '',
    item: '',
    est: '',
    adv: '',
    bal: '',
    act: '',
    notes: '',
    bills: []
  });

  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Totals calculations
  const totalEst = expenses.reduce((s, r) => s + Number(r.est || 0), 0);
  const totalAdv = expenses.reduce((s, r) => s + Number(r.adv || 0), 0);
  const totalBal = expenses.reduce((s, r) => s + getExpenseBalance(r), 0);
  const totalAct = expenses.reduce((s, r) => s + getExpenseActual(r), 0);
  const totalAttachedBills = expenses.reduce((sum, e) => sum + getExpenseBills(e).length, 0);

  const filtered = expenses.filter(e => {
    const s = search.toLowerCase();
    const bills = getExpenseBills(e);
    const hasMatchInBills = bills.some(
      b => (b.name || '').toLowerCase().includes(s) || (b.comments || '').toLowerCase().includes(s)
    );
    return (
      (e.item || '').toLowerCase().includes(s) ||
      (e.notes || '').toLowerCase().includes(s) ||
      (e.receiptName || '').toLowerCase().includes(s) ||
      hasMatchInBills
    );
  });

  const openAddModal = () => {
    setFormData({
      id: Date.now().toString(),
      item: '',
      est: '',
      adv: '',
      bal: '',
      act: '',
      notes: '',
      bills: []
    });
    setModal({ open: true, item: null });
  };

  const openEditModal = (e: Expense) => {
    const estNum = Number(e.est || 0);
    const advNum = Number(e.adv || 0);
    const balNum = getExpenseBalance(e);
    const actNum = getExpenseActual(e);

    setFormData({
      id: e.id,
      item: e.item || '',
      est: estNum ? String(estNum) : '',
      adv: advNum ? String(advNum) : '',
      bal: balNum ? String(balNum) : '',
      act: actNum ? String(actNum) : '',
      notes: e.notes || '',
      bills: getExpenseBills(e)
    });
    setModal({ open: true, item: e });
  };

  // Dynamic calculations when typing
  const handleEstChange = (val: string) => {
    const estVal = parseFloat(val) || 0;
    const advVal = parseFloat(formData.adv) || 0;
    const computedBal = Math.max(0, estVal - advVal);
    const computedAct = estVal === computedBal ? 0 : advVal > 0 ? advVal : Math.max(0, estVal - computedBal);

    setFormData(prev => ({
      ...prev,
      est: val,
      bal: computedBal > 0 ? String(computedBal) : '0',
      act: String(computedAct)
    }));
  };

  const handleAdvChange = (val: string) => {
    const advVal = parseFloat(val) || 0;
    const estVal = parseFloat(formData.est) || 0;
    const computedBal = Math.max(0, estVal - advVal);
    const computedAct = estVal === computedBal ? 0 : advVal > 0 ? advVal : Math.max(0, estVal - computedBal);

    setFormData(prev => ({
      ...prev,
      adv: val,
      bal: computedBal > 0 ? String(computedBal) : '0',
      act: String(computedAct)
    }));
  };

  const handleBalChange = (val: string) => {
    const balVal = parseFloat(val) || 0;
    const estVal = parseFloat(formData.est) || 0;
    const advVal = parseFloat(formData.adv) || 0;
    const computedAct = estVal === balVal ? 0 : advVal > 0 ? advVal : Math.max(0, estVal - balVal);

    setFormData(prev => ({
      ...prev,
      bal: val,
      act: String(computedAct)
    }));
  };

  // Process multiple file uploads
  const processFiles = async (files: FileList | File[]): Promise<ExpenseBill[]> => {
    const newBills: ExpenseBill[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const { dataUrl, name, type } = await compressImageFile(file);
      newBills.push({
        id: `bill-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        url: dataUrl,
        name: name,
        type: type,
        date: today(),
        comments: ''
      });
    }
    return newBills;
  };

  // Multi-file upload for Add / Edit Modal
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsProcessingFile(true);
    try {
      const added = await processFiles(files);
      setFormData(prev => ({
        ...prev,
        bills: [...prev.bills, ...added]
      }));
    } catch (err) {
      console.error('Failed to process receipt file(s):', err);
      alert('Unable to process the uploaded file(s). Please select valid images or PDFs.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleUpdateBillComment = (billId: string, comments: string) => {
    setFormData(prev => ({
      ...prev,
      bills: prev.bills.map(b => (b.id === billId ? { ...b, comments } : b))
    }));
  };

  const handleRemoveBill = (billId: string) => {
    setFormData(prev => ({
      ...prev,
      bills: prev.bills.filter(b => b.id !== billId)
    }));
  };

  // Quick Attach Modal handlers
  const openQuickAttach = (e: Expense) => {
    setQuickAttachModal({
      open: true,
      expense: e,
      bills: getExpenseBills(e)
    });
  };

  const handleQuickAttachUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsProcessingFile(true);
    try {
      const added = await processFiles(files);
      setQuickAttachModal(prev => ({
        ...prev,
        bills: [...prev.bills, ...added]
      }));
    } catch (err) {
      console.error('Quick attach error:', err);
      alert('Error processing file(s). Please retry.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleSaveQuickAttach = () => {
    if (!quickAttachModal.expense) return;
    const bills = quickAttachModal.bills;
    const primary = bills[0];
    const updated: Expense = {
      ...quickAttachModal.expense,
      bills: bills,
      receiptUrl: primary?.url,
      receiptName: primary?.name,
      receiptType: primary?.type,
      receiptDate: primary?.date
    };
    onSave(updated);

    // If viewer is currently viewing this expense, synchronize it
    if (viewingExpense && viewingExpense.id === updated.id) {
      setViewingExpense(updated);
    }

    setQuickAttachModal({ open: false, expense: null, bills: [] });
  };

  // Inline comment edit in the Viewer modal
  const handleQuickEditCommentInViewer = (billId: string, newComment: string) => {
    if (!viewingExpense) return;
    const currentBills = getExpenseBills(viewingExpense);
    const updatedBills = currentBills.map(b => (b.id === billId ? { ...b, comments: newComment } : b));
    const primary = updatedBills[0];
    const updated: Expense = {
      ...viewingExpense,
      bills: updatedBills,
      receiptUrl: primary?.url,
      receiptName: primary?.name,
      receiptType: primary?.type,
      receiptDate: primary?.date
    };
    onSave(updated);
    setViewingExpense(updated);
  };

  // Delete bill directly in the Viewer modal
  const handleDeleteBillInViewer = (billId: string) => {
    if (!viewingExpense) return;
    if (!confirm('Are you sure you want to remove this attached bill?')) return;
    const currentBills = getExpenseBills(viewingExpense);
    const updatedBills = currentBills.filter(b => b.id !== billId);
    const primary = updatedBills[0];
    const updated: Expense = {
      ...viewingExpense,
      bills: updatedBills,
      receiptUrl: primary?.url,
      receiptName: primary?.name,
      receiptType: primary?.type,
      receiptDate: primary?.date
    };
    onSave(updated);
    if (updatedBills.length === 0) {
      setViewingExpense(null);
    } else {
      setViewingExpense(updated);
      setActiveBillIdx(prev => Math.min(prev, updatedBills.length - 1));
    }
  };

  // Add bill directly from the Viewer modal
  const handleAddBillInViewer = async (files: FileList | null) => {
    if (!files || files.length === 0 || !viewingExpense) return;
    setIsProcessingFile(true);
    try {
      const added = await processFiles(files);
      const currentBills = getExpenseBills(viewingExpense);
      const updatedBills = [...currentBills, ...added];
      const primary = updatedBills[0];
      const updated: Expense = {
        ...viewingExpense,
        bills: updatedBills,
        receiptUrl: primary?.url,
        receiptName: primary?.name,
        receiptType: primary?.type,
        receiptDate: primary?.date
      };
      onSave(updated);
      setViewingExpense(updated);
      setActiveBillIdx(updatedBills.length - 1);
    } catch (err) {
      console.error('Viewer file add error:', err);
      alert('Error uploading bill.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.item.trim()) {
      alert('Please enter an Item / Description.');
      return;
    }

    const estNum = parseFloat(formData.est) || 0;
    const advNum = parseFloat(formData.adv) || 0;
    const balNum = Math.max(0, estNum - advNum);
    const parsedAct = parseFloat(formData.act);
    const actNum =
      estNum === balNum
        ? 0
        : !isNaN(parsedAct) && parsedAct > 0
        ? parsedAct
        : advNum > 0
        ? advNum
        : Math.max(0, estNum - balNum);

    const bills = formData.bills || [];
    const primaryBill = bills[0];

    const expenseItem: Expense = {
      id: formData.id || Date.now().toString(),
      item: formData.item.trim(),
      est: estNum,
      adv: advNum,
      bal: balNum,
      act: actNum,
      notes: formData.notes?.trim() || undefined,
      bills: bills,
      receiptUrl: primaryBill?.url,
      receiptName: primaryBill?.name,
      receiptType: primaryBill?.type,
      receiptDate: primaryBill?.date
    };

    onSave(expenseItem);
    setModal({ open: false });
  };

  // Print currently active bill in Viewer modal
  const printActiveBill = () => {
    if (!viewingExpense) return;
    const bills = getExpenseBills(viewingExpense);
    const activeBill = bills[activeBillIdx] || bills[0];
    if (!activeBill?.url) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print the receipt.');
      return;
    }

    const isPdf = activeBill.type === 'application/pdf';
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bill Receipt - ${viewingExpense.item}</title>
          <style>
            body { font-family: system-ui, sans-serif; margin: 20px; text-align: center; }
            .header { margin-bottom: 16px; border-bottom: 2px solid #991B1B; padding-bottom: 8px; }
            h2 { color: #991B1B; margin: 0 0 4px 0; }
            p { color: #555; font-size: 14px; margin: 4px 0; }
            .comment-card { background: #FFFBEB; border: 1px solid #FDE68A; padding: 12px 16px; border-radius: 6px; margin: 12px auto; max-width: 600px; text-align: left; }
            .comment-tag { font-weight: 700; font-size: 11px; text-transform: uppercase; color: #92400E; letter-spacing: 0.05em; }
            .comment-text { font-size: 13px; color: #78350F; margin-top: 4px; white-space: pre-wrap; }
            img { max-width: 100%; max-height: 80vh; object-fit: contain; margin-top: 10px; border-radius: 4px; }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Expenditure Bill / Receipt</h2>
            <p><strong>Item:</strong> ${viewingExpense.item} | <strong>Amount:</strong> ₹ ${fmt(getExpenseActual(viewingExpense))}</p>
            <p><strong>File:</strong> ${activeBill.name || 'Receipt'} | <strong>Date:</strong> ${activeBill.date ? fmtDate(activeBill.date) : today()}</p>
          </div>
          ${
            activeBill.comments
              ? `<div class="comment-card"><div class="comment-tag">Bill Comment / Note</div><div class="comment-text">${activeBill.comments}</div></div>`
              : ''
          }
          ${
            isPdf
              ? `<p>PDF document attached: ${activeBill.name || 'Receipt.pdf'}. Please print directly from the PDF reader.</p>`
              : `<img src="${activeBill.url}" onload="window.print();window.close();" />`
          }
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const currentViewingBills = viewingExpense ? getExpenseBills(viewingExpense) : [];
  const currentActiveBill = currentViewingBills[activeBillIdx] || currentViewingBills[0];

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white border border-stone-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-serif font-bold text-[#1A1A1A]">Expenditure (Payments)</h2>
              <span className="text-[11px] bg-red-100 text-red-800 font-semibold px-2 py-0.5 rounded-full border border-red-200">
                {expenses.length} Records
              </span>
              <span className="text-[11px] bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                <Paperclip className="w-3 h-3 text-emerald-600" />
                {totalAttachedBills} Attached Bills
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Track vendor payments, advance advances, pending balance, and attach multiple bills with comments.
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <input
              type="text"
              placeholder="🔍 Search item, bill comments, notes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border border-stone-300 rounded px-3 py-1.5 text-xs bg-stone-50 focus:bg-white outline-none focus:border-[#991B1B] w-56 sm:w-64"
            />
            {isAdmin && (
              <button
                onClick={openAddModal}
                className="bg-[#991B1B] text-white hover:bg-[#7F1D1D] text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Expense Item</span>
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider">
                <th className="py-3 px-4 w-10 text-center">#</th>
                <th className="py-3 px-4 min-w-[200px]">Item / Description</th>
                <th className="py-3 px-4 text-right">Estimated (₹)</th>
                <th className="py-3 px-4 text-right">Advance (₹)</th>
                <th className="py-3 px-4 text-right">
                  <span className="inline-flex items-center gap-1 justify-end">
                    <span>Balance (₹)</span>
                  </span>
                </th>
                <th className="py-3 px-4 text-right">Actual (₹)</th>
                <th className="py-3 px-4 text-center min-w-[140px]">Attached Bills</th>
                {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="py-10 text-center text-stone-400">
                    <p className="font-serif text-stone-500 text-sm">No expenditure records match your search.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((e, idx) => {
                  const bal = getExpenseBalance(e);
                  const act = getExpenseActual(e);
                  const bills = getExpenseBills(e);
                  const hasBills = bills.length > 0;
                  const firstComment = bills.find(b => Boolean(b.comments?.trim()))?.comments;

                  return (
                    <tr key={e.id} className="hover:bg-amber-50/30 transition-colors group">
                      <td className="py-3 px-4 text-stone-400 text-xs text-center">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-stone-900">{e.item}</div>
                        {e.notes && (
                          <div className="text-[11px] text-stone-500 italic mt-0.5 line-clamp-1">{e.notes}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-right text-stone-700">₹ {fmt(e.est)}</td>
                      <td className="py-3 px-4 font-mono text-right text-amber-800 font-medium">₹ {fmt(e.adv)}</td>
                      <td className="py-3 px-4 font-mono text-right font-medium text-blue-800">
                        {bal > 0 ? (
                          <span>₹ {fmt(bal)}</span>
                        ) : (
                          <span className="text-emerald-700 text-xs font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            Settled (₹ 0)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-right font-bold text-red-700">₹ {fmt(act)}</td>

                      {/* Multiple Bills & Comments Column */}
                      <td className="py-3 px-4 text-center">
                        {hasBills ? (
                          <div className="inline-flex flex-col items-center">
                            <button
                              onClick={() => {
                                setZoomLevel(1);
                                setRotation(0);
                                setActiveBillIdx(0);
                                setViewingExpense(e);
                              }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs transition-all cursor-pointer group-hover:border-emerald-300"
                              title={`Click to view ${bills.length} attached bill(s) and comments`}
                            >
                              <Paperclip className="w-3.5 h-3.5 text-emerald-600" />
                              <span>
                                {bills.length} {bills.length === 1 ? 'Bill' : 'Bills'}
                              </span>
                            </button>
                            {firstComment && (
                              <span
                                className="text-[10px] text-stone-500 truncate max-w-[130px] mt-0.5 italic flex items-center gap-0.5"
                                title={bills.map(b => b.comments).filter(Boolean).join(' | ')}
                              >
                                <MessageSquare className="w-2.5 h-2.5 text-amber-600 inline shrink-0" />
                                <span className="truncate">{firstComment}</span>
                              </span>
                            )}
                          </div>
                        ) : isAdmin ? (
                          <button
                            onClick={() => openQuickAttach(e)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium text-stone-500 hover:text-stone-800 hover:bg-stone-100 border border-dashed border-stone-300 hover:border-stone-400 cursor-pointer transition-colors"
                            title="Attach multiple bills with comments"
                          >
                            <Paperclip className="w-3.5 h-3.5" />
                            <span>+ Attach Bills</span>
                          </button>
                        ) : (
                          <span className="text-stone-300 text-xs">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      {isAdmin && (
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex gap-1.5 justify-end">
                            <button
                              onClick={() => openEditModal(e)}
                              className="p-1 text-stone-400 hover:text-amber-700 hover:bg-amber-50 rounded transition-colors cursor-pointer"
                              title="Edit Expense & Manage Bills"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete expenditure "${e.item}"?`)) {
                                  onDelete(e.id);
                                }
                              }}
                              className="p-1 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded transition-colors cursor-pointer"
                              title="Delete Expense Item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="bg-stone-50/80 border-t-2 border-stone-300 font-bold text-xs text-stone-800">
                  <td colSpan={2} className="py-3 px-4 uppercase tracking-wider text-stone-600">
                    Totals ({filtered.length} Items)
                  </td>
                  <td className="py-3 px-4 font-mono text-right text-stone-700">₹ {fmt(totalEst)}</td>
                  <td className="py-3 px-4 font-mono text-right text-amber-800">₹ {fmt(totalAdv)}</td>
                  <td className="py-3 px-4 font-mono text-right text-blue-800">₹ {fmt(totalBal)}</td>
                  <td className="py-3 px-4 font-mono text-right text-red-700 text-sm">₹ {fmt(totalAct)}</td>
                  <td className="py-3 px-4 text-center text-emerald-800 text-[11px] font-semibold">
                    {totalAttachedBills} Bills Total
                  </td>
                  {isAdmin && <td></td>}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Bill Receipt Viewer Modal (Multi-bill support with comments) */}
      {viewingExpense && currentActiveBill && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-stone-200 shadow-2xl max-w-3xl w-full max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-3.5 bg-gradient-to-r from-[#991B1B] to-[#7F1D1D] text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-amber-400 text-stone-900 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                    Official Bill Receipts
                  </span>
                  <span className="text-xs text-amber-100 font-mono">
                    Bill {activeBillIdx + 1} of {currentViewingBills.length}
                  </span>
                  <span className="text-xs text-amber-200/80 font-mono">
                    • {currentActiveBill.date ? fmtDate(currentActiveBill.date) : today()}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-serif font-bold mt-1 text-white">
                  {viewingExpense.item}
                </h3>
              </div>
              <button
                onClick={() => setViewingExpense(null)}
                className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* If multiple bills: Tabs / Carousel Selector */}
            {currentViewingBills.length > 1 && (
              <div className="bg-stone-100 border-b border-stone-200 px-4 py-2 flex items-center justify-between gap-2 overflow-x-auto">
                <button
                  onClick={() => {
                    setActiveBillIdx(prev => Math.max(0, prev - 1));
                    setZoomLevel(1);
                    setRotation(0);
                  }}
                  disabled={activeBillIdx === 0}
                  className="p-1 rounded text-stone-600 hover:text-stone-900 hover:bg-stone-200 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                  title="Previous Bill"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2 overflow-x-auto py-0.5">
                  {currentViewingBills.map((b, idx) => (
                    <button
                      key={b.id || idx}
                      onClick={() => {
                        setActiveBillIdx(idx);
                        setZoomLevel(1);
                        setRotation(0);
                      }}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                        activeBillIdx === idx
                          ? 'bg-[#991B1B] text-white shadow-xs'
                          : 'bg-white text-stone-700 hover:bg-stone-200 border border-stone-300'
                      }`}
                    >
                      {b.type === 'application/pdf' ? (
                        <FileText className="w-3.5 h-3.5" />
                      ) : (
                        <ImageIcon className="w-3.5 h-3.5" />
                      )}
                      <span>Bill {idx + 1}</span>
                      {b.comments && (
                        <span className="opacity-85 max-w-[100px] truncate text-[10px] font-normal">
                          ({b.comments})
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    setActiveBillIdx(prev => Math.min(currentViewingBills.length - 1, prev + 1));
                    setZoomLevel(1);
                    setRotation(0);
                  }}
                  disabled={activeBillIdx === currentViewingBills.length - 1}
                  className="p-1 rounded text-stone-600 hover:text-stone-900 hover:bg-stone-200 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                  title="Next Bill"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Bill Comments Callout */}
            <div className="bg-amber-50/80 border-b border-amber-200/80 px-6 py-2.5 flex items-start justify-between gap-3 text-xs">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <MessageSquare className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800 block">
                    Bill Comment / Description
                  </span>
                  {currentActiveBill.comments ? (
                    <p className="text-amber-950 font-medium mt-0.5 whitespace-pre-wrap leading-relaxed text-xs">
                      {currentActiveBill.comments}
                    </p>
                  ) : (
                    <span className="text-stone-400 italic text-xs">No comments provided for this bill.</span>
                  )}
                </div>
              </div>
              {isAdmin && (
                <button
                  onClick={() => {
                    const promptVal = prompt(
                      'Enter comments/notes for this bill:',
                      currentActiveBill.comments || ''
                    );
                    if (promptVal !== null) {
                      handleQuickEditCommentInViewer(currentActiveBill.id, promptVal);
                    }
                  }}
                  className="text-amber-800 hover:text-amber-950 underline text-xs font-bold shrink-0 cursor-pointer"
                >
                  {currentActiveBill.comments ? 'Edit Comment' : '+ Add Comment'}
                </button>
              )}
            </div>

            {/* Cost Details Pill & Controls */}
            <div className="bg-stone-50 border-b border-stone-200 px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4 flex-wrap">
                <div>
                  <span className="text-stone-500">Estimated: </span>
                  <strong className="font-mono text-stone-800">₹ {fmt(viewingExpense.est)}</strong>
                </div>
                <div className="border-l border-stone-200 pl-4">
                  <span className="text-stone-500">Advance: </span>
                  <strong className="font-mono text-amber-800">₹ {fmt(viewingExpense.adv)}</strong>
                </div>
                <div className="border-l border-stone-200 pl-4">
                  <span className="text-stone-500">Balance: </span>
                  <strong className="font-mono text-blue-800">₹ {fmt(getExpenseBalance(viewingExpense))}</strong>
                </div>
                <div className="border-l border-stone-200 pl-4">
                  <span className="text-stone-500">Actual: </span>
                  <strong className="font-mono text-red-700">₹ {fmt(getExpenseActual(viewingExpense))}</strong>
                </div>
              </div>

              {/* Viewer Controls for Images */}
              {currentActiveBill.type !== 'application/pdf' && (
                <div className="flex items-center gap-1 bg-white border border-stone-200 rounded px-1.5 py-0.5 shadow-2xs">
                  <button
                    onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
                    className="p-1 text-stone-600 hover:text-stone-900 rounded hover:bg-stone-100 cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-mono font-semibold px-1 text-stone-600 min-w-[40px] text-center">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))}
                    className="p-1 text-stone-600 hover:text-stone-900 rounded hover:bg-stone-100 cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setRotation(prev => (prev + 90) % 360)}
                    className="p-1 text-stone-600 hover:text-stone-900 rounded hover:bg-stone-100 cursor-pointer border-l border-stone-200 ml-1"
                    title="Rotate 90°"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Receipt Preview Body */}
            <div className="flex-1 overflow-auto p-4 sm:p-6 bg-stone-900/5 flex items-center justify-center min-h-[340px] max-h-[58vh]">
              {currentActiveBill.url ? (
                currentActiveBill.type === 'application/pdf' ? (
                  <div className="w-full h-[52vh] flex flex-col bg-white rounded-lg border border-stone-200 overflow-hidden shadow-xs">
                    <iframe
                      src={currentActiveBill.url}
                      title="PDF Bill Receipt"
                      className="w-full flex-1 border-0"
                    />
                    <div className="p-2.5 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600">
                      <span>📄 {currentActiveBill.name || 'Attached_Bill.pdf'}</span>
                      <a
                        href={currentActiveBill.url}
                        download={currentActiveBill.name || `Bill_${viewingExpense.item}.pdf`}
                        className="text-red-700 hover:text-red-900 font-semibold underline inline-flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download PDF
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="relative overflow-auto max-w-full max-h-full flex items-center justify-center">
                    <img
                      src={currentActiveBill.url}
                      alt={currentActiveBill.name || viewingExpense.item}
                      style={{
                        transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                        transformOrigin: 'center center',
                        transition: 'transform 0.15s ease-out'
                      }}
                      className="max-h-[52vh] object-contain rounded border border-stone-300 shadow-md bg-white select-none"
                    />
                  </div>
                )
              ) : (
                <div className="text-center py-12 text-stone-400">
                  <Paperclip className="w-10 h-10 mx-auto mb-2 text-stone-300" />
                  <p>No receipt file attached for this item.</p>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-3 bg-white border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-stone-500 font-mono truncate max-w-xs">
                {currentActiveBill.name && `📎 ${currentActiveBill.name}`}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {currentActiveBill.url && (
                  <>
                    <a
                      href={currentActiveBill.url}
                      download={
                        currentActiveBill.name ||
                        `Bill_${viewingExpense.item.replace(/\s+/g, '_')}_${activeBillIdx + 1}${
                          currentActiveBill.type === 'application/pdf' ? '.pdf' : '.jpg'
                        }`
                      }
                      className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-stone-600" />
                      <span>Download</span>
                    </a>
                    <button
                      onClick={printActiveBill}
                      className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-stone-600" />
                      <span>Print</span>
                    </button>
                  </>
                )}
                {isAdmin && (
                  <>
                    <label className="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded inline-flex items-center gap-1.5 transition-colors cursor-pointer">
                      <Plus className="w-3.5 h-3.5 text-emerald-700" />
                      <span>+ Attach Another</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={e => handleAddBillInViewer(e.target.files)}
                      />
                    </label>
                    <button
                      onClick={() => handleDeleteBillInViewer(currentActiveBill.id)}
                      className="bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Remove this bill"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-600" />
                      <span>Delete Bill</span>
                    </button>
                    <button
                      onClick={() => {
                        const cur = viewingExpense;
                        setViewingExpense(null);
                        openEditModal(cur);
                      }}
                      className="bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Manage All</span>
                    </button>
                  </>
                )}
                <button
                  onClick={() => setViewingExpense(null)}
                  className="bg-[#991B1B] hover:bg-[#7F1D1D] text-white text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded cursor-pointer transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Attach Modal (From Table Row) */}
      {quickAttachModal.open && quickAttachModal.expense && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl border border-stone-200 shadow-2xl max-w-lg w-full p-6 space-y-4 my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-lg font-serif font-bold text-[#991B1B]">Attach Bills & Comments</h3>
                <p className="text-xs text-stone-600 font-medium mt-0.5">
                  For: <strong className="text-stone-900">{quickAttachModal.expense.item}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuickAttachModal({ open: false, expense: null, bills: [] })}
                className="text-stone-400 hover:text-stone-700 text-xl font-bold leading-none cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* List of Attached Bills with Comments */}
            {quickAttachModal.bills.length > 0 && (
              <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                {quickAttachModal.bills.map((bill, bIdx) => (
                  <div
                    key={bill.id || bIdx}
                    className="bg-stone-50 border border-stone-200 rounded-lg p-3 space-y-2 shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 overflow-hidden">
                        {bill.type === 'application/pdf' ? (
                          <div className="w-8 h-8 rounded bg-red-100 flex items-center justify-center text-red-700 shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                        ) : (
                          <img
                            src={bill.url}
                            alt="thumb"
                            className="w-8 h-8 object-cover rounded border border-stone-300 shrink-0"
                          />
                        )}
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-stone-900 truncate">{bill.name || `Bill #${bIdx + 1}`}</p>
                          <span className="text-[10px] text-stone-500 font-mono">
                            {bill.date ? fmtDate(bill.date) : today()}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setQuickAttachModal(prev => ({
                            ...prev,
                            bills: prev.bills.filter(b => b.id !== bill.id)
                          }))
                        }
                        className="text-stone-400 hover:text-red-700 p-1 rounded hover:bg-red-50 cursor-pointer transition-colors"
                        title="Remove bill"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Comment Input */}
                    <div>
                      <label className="flex items-center gap-1 text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-1">
                        <MessageSquare className="w-3 h-3 text-amber-700" />
                        <span>Comment / Note for this bill</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 50% Advance paid, Final settlement bill, Sound equipment rental..."
                        value={bill.comments || ''}
                        onChange={e => {
                          const val = e.target.value;
                          setQuickAttachModal(prev => ({
                            ...prev,
                            bills: prev.bills.map(b => (b.id === bill.id ? { ...b, comments: val } : b))
                          }));
                        }}
                        className="w-full border border-stone-300 rounded px-2.5 py-1.5 text-xs outline-none focus:border-[#991B1B] bg-white font-medium"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Dropzone to add more files */}
            <label className="border-2 border-dashed border-stone-300 hover:border-[#991B1B] rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-stone-50 hover:bg-white group">
              {isProcessingFile ? (
                <div className="flex items-center gap-2 text-stone-600 py-1">
                  <Loader2 className="w-5 h-5 animate-spin text-[#991B1B]" />
                  <span className="text-xs font-semibold">Processing & compressing bills...</span>
                </div>
              ) : (
                <>
                  <UploadCloud className="w-7 h-7 text-stone-400 group-hover:text-[#991B1B] mb-1 transition-colors" />
                  <span className="text-xs font-bold text-stone-700 group-hover:text-[#991B1B]">
                    {quickAttachModal.bills.length > 0 ? '+ Add More Bills / Receipts' : 'Click to upload bills (Select multiple)'}
                  </span>
                  <span className="text-[10px] text-stone-400 mt-0.5">
                    Supports JPG, PNG, PDF (Select multiple files at once)
                  </span>
                </>
              )}
              <input
                type="file"
                multiple
                accept="image/*,application/pdf"
                className="hidden"
                disabled={isProcessingFile}
                onChange={e => handleQuickAttachUpload(e.target.files)}
              />
            </label>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setQuickAttachModal({ open: false, expense: null, bills: [] })}
                className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveQuickAttach}
                disabled={isProcessingFile}
                className="bg-[#991B1B] hover:bg-[#7F1D1D] text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded cursor-pointer shadow-xs disabled:opacity-75"
              >
                Save Attached Bills ({quickAttachModal.bills.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Expense Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveForm}
            className="bg-white rounded-xl border border-stone-200 shadow-2xl max-w-lg w-full p-6 space-y-4 my-8 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-lg font-serif font-bold text-[#991B1B]">
                  {modal.item ? 'Edit Expense Item' : 'Add Expense Item'}
                </h3>
                <p className="text-xs text-stone-500">
                  Enter estimated and advance details; attach multiple bills with custom comments.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModal({ open: false })}
                className="text-stone-400 hover:text-stone-700 text-xl font-bold leading-none cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Item description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                Item / Description *
              </label>
              <input
                type="text"
                value={formData.item}
                onChange={e => setFormData({ ...formData, item: e.target.value })}
                required
                placeholder="e.g. Stage Setup & Decoration, Sound System, Flowers"
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B] bg-white font-medium"
              />
            </div>

            {/* Estimated & Advance */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Estimated / Expected (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-stone-400 text-sm font-semibold">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.est}
                    onChange={e => handleEstChange(e.target.value)}
                    required
                    placeholder="0"
                    className="w-full border border-stone-300 rounded pl-7 pr-3 py-2 text-sm outline-none focus:border-[#991B1B] font-mono font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Advance Paid (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-stone-400 text-sm font-semibold">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.adv}
                    onChange={e => handleAdvChange(e.target.value)}
                    placeholder="0"
                    className="w-full border border-stone-300 rounded pl-7 pr-3 py-2 text-sm outline-none focus:border-[#991B1B] font-mono font-semibold text-amber-800"
                  />
                </div>
              </div>
            </div>

            {/* Balance & Actual */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-stone-50 p-3 rounded-lg border border-stone-200">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                    Balance Pending (₹)
                  </label>
                  <span className="text-[10px] text-stone-400 font-normal">Auto-calculated</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-stone-400 text-sm font-semibold">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.bal}
                    onChange={e => handleBalChange(e.target.value)}
                    placeholder="0"
                    className="w-full border border-stone-300 rounded pl-7 pr-3 py-1.5 text-sm outline-none focus:border-[#991B1B] font-mono font-bold text-blue-800 bg-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                    Actual Total (₹)
                  </label>
                  <span className="text-[10px] text-stone-400 font-normal">Auto-calculated</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-stone-400 text-sm font-semibold">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.act}
                    onChange={e => setFormData({ ...formData, act: e.target.value })}
                    placeholder="0"
                    className="w-full border border-stone-300 rounded pl-7 pr-3 py-1.5 text-sm outline-none focus:border-[#991B1B] font-mono font-bold text-red-700 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Vendor Contact / Notes */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                Vendor Contact / Notes (Optional)
              </label>
              <input
                type="text"
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                placeholder="e.g. Vendor: Ramesh Decorators (9876543210), Final bill due on Visarjan"
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
              />
            </div>

            {/* Multiple Bills Section with Comments */}
            <div className="border-t border-stone-200 pt-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                  Attached Bills & Invoices ({formData.bills.length})
                </label>
                <span className="text-[10px] text-stone-400 font-normal">Supports JPG, PNG, PDF</span>
              </div>

              {/* List of current bills */}
              {formData.bills.length > 0 && (
                <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                  {formData.bills.map((bill, bIdx) => (
                    <div
                      key={bill.id || bIdx}
                      className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-2.5 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 overflow-hidden">
                          {bill.type === 'application/pdf' ? (
                            <div className="w-8 h-8 rounded bg-red-100 flex items-center justify-center text-red-700 shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                          ) : (
                            <img
                              src={bill.url}
                              alt="preview"
                              className="w-8 h-8 object-cover rounded border border-emerald-300 shrink-0"
                            />
                          )}
                          <div className="overflow-hidden">
                            <p className="text-xs font-bold text-emerald-950 truncate">
                              {bill.name || `Bill #${bIdx + 1}`}
                            </p>
                            <span className="text-[10px] text-emerald-700 font-mono">
                              {bill.date ? fmtDate(bill.date) : today()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleRemoveBill(bill.id)}
                            className="text-stone-400 hover:text-red-700 p-1 rounded hover:bg-red-50 cursor-pointer transition-colors"
                            title="Remove bill"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Comments Input */}
                      <div>
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-stone-600 mb-0.5">
                          <MessageSquare className="w-3 h-3 text-amber-600" />
                          <span>Comments / Description for this bill:</span>
                        </div>
                        <input
                          type="text"
                          placeholder="e.g. 50% Advance paid via UPI, Final settlement bill, Material receipt..."
                          value={bill.comments || ''}
                          onChange={e => handleUpdateBillComment(bill.id, e.target.value)}
                          className="w-full border border-stone-300 rounded px-2.5 py-1 text-xs outline-none focus:border-[#991B1B] bg-white font-medium"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Dropzone */}
              <label className="border-2 border-dashed border-stone-300 hover:border-[#991B1B] rounded-lg p-3.5 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-stone-50 hover:bg-white group">
                {isProcessingFile ? (
                  <div className="flex items-center gap-2 text-stone-600 py-1">
                    <Loader2 className="w-5 h-5 animate-spin text-[#991B1B]" />
                    <span className="text-xs font-semibold">Processing & compressing bills...</span>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="w-6 h-6 text-stone-400 group-hover:text-[#991B1B] mb-1 transition-colors" />
                    <span className="text-xs font-bold text-stone-700 group-hover:text-[#991B1B]">
                      {formData.bills.length > 0
                        ? '+ Add More Bills / Receipts'
                        : 'Click to upload bills (Select multiple files)'}
                    </span>
                    <span className="text-[10px] text-stone-400 mt-0.5">
                      JPG, PNG, or PDF — Select multiple files at once
                    </span>
                  </>
                )}
                <input
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  className="hidden"
                  disabled={isProcessingFile}
                  onChange={e => handleFileUpload(e.target.files)}
                />
              </label>
            </div>

            {/* Actions */}
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
                disabled={isProcessingFile}
                className="bg-[#991B1B] hover:bg-[#7F1D1D] text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded cursor-pointer shadow-xs disabled:opacity-75"
              >
                {modal.item ? 'Save Changes' : 'Add Expense'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
