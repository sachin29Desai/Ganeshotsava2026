import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X,
  Printer,
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  FileText,
  Archive,
  Files,
  FolderArchive,
  ArrowDownToLine
} from 'lucide-react';
import { AppSettings, Contribution } from '../types';
import { fmt, fmtDate, numWords, today } from '../utils/helpers';
import { GaneshaWatermark, DigitalSignatureBlock } from './ReceiptInvoiceModal';
import {
  generateIndividualReceiptPdfBlobs,
  createZipFromReceiptPdfs,
  downloadFilesSequentially,
  getBulkIndividualReceiptFilename,
  generateBulkReceiptsPdfBlob,
  downloadBlobAsFile,
  triggerBulkDirectPrint,
  BulkPdfProgress,
  GeneratedReceiptFile
} from '../utils/pdfGenerator';

interface BulkReceiptsModalProps {
  open: boolean;
  onClose: () => void;
  items: Contribution[];
  settings: AppSettings;
  selectedIds?: Set<string>;
  onClearSelection?: () => void;
}

export const BulkReceiptsModal: React.FC<BulkReceiptsModalProps> = ({
  open,
  onClose,
  items,
  settings,
  selectedIds,
  onClearSelection
}) => {
  const [scope, setScope] = useState<'all' | 'selected'>(() => {
    return selectedIds && selectedIds.size > 0 ? 'selected' : 'all';
  });
  // Output format: separate_zip (individual PDFs in ZIP), separate_direct (direct browser download of each file), combined_pdf
  const [exportFormat, setExportFormat] = useState<'separate_zip' | 'separate_direct' | 'combined_pdf'>('separate_zip');
  const [sortBy, setSortBy] = useState<'rcptAsc' | 'rcptDesc' | 'dateDesc' | 'nameAsc'>('rcptAsc');
  const [previewIndex, setPreviewIndex] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progress, setProgress] = useState<BulkPdfProgress | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [savedFilename, setSavedFilename] = useState<string>('');
  const [generatedFilesList, setGeneratedFilesList] = useState<GeneratedReceiptFile[]>([]);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  const renderContainerRef = useRef<HTMLDivElement>(null);

  // Generate UPI QR Code data URL once if settings.upi is present
  useEffect(() => {
    if (!settings.upi) {
      setQrCodeDataUrl('');
      return;
    }
    const upiUrl = `upi://pay?pa=${encodeURIComponent(settings.upi)}&pn=${encodeURIComponent(
      settings.payee || settings.org || 'Ganeshotsava'
    )}&cu=INR`;

    try {
      const tempDiv = document.createElement('div');
      if ((window as any).QRCode) {
        new (window as any).QRCode(tempDiv, {
          text: upiUrl,
          width: 90,
          height: 90,
          colorDark: '#000000',
          colorLight: '#ffffff',
          correctLevel: (window as any).QRCode.CorrectLevel.M
        });
        setTimeout(() => {
          const img = tempDiv.querySelector('img') as HTMLImageElement | null;
          const canvas = tempDiv.querySelector('canvas') as HTMLCanvasElement | null;
          if (canvas) {
            setQrCodeDataUrl(canvas.toDataURL('image/png'));
          } else if (img && img.src) {
            setQrCodeDataUrl(img.src);
          }
        }, 150);
      }
    } catch (e) {
      console.warn('QR code pre-render skipped:', e);
    }
  }, [settings.upi, settings.payee, settings.org]);

  // Adjust scope if selected items change
  useEffect(() => {
    if (selectedIds && selectedIds.size > 0) {
      setScope('selected');
    } else {
      setScope('all');
    }
    setDownloadSuccess(false);
    setProgress(null);
  }, [selectedIds, open]);

  // Filtered and sorted items to print
  const printableList = useMemo(() => {
    let list = items;
    if (scope === 'selected' && selectedIds && selectedIds.size > 0) {
      list = items.filter(it => selectedIds.has(it.id));
    }

    return [...list].sort((a, b) => {
      if (sortBy === 'rcptAsc') {
        return (a.rcptNo || '').localeCompare(b.rcptNo || '', undefined, { numeric: true });
      }
      if (sortBy === 'rcptDesc') {
        return (b.rcptNo || '').localeCompare(a.rcptNo || '', undefined, { numeric: true });
      }
      if (sortBy === 'dateDesc') {
        return (b.date || '').localeCompare(a.date || '');
      }
      if (sortBy === 'nameAsc') {
        return (a.name || '').localeCompare(b.name || '');
      }
      return 0;
    });
  }, [items, scope, selectedIds, sortBy]);

  // Keep preview index bounded
  useEffect(() => {
    if (previewIndex >= printableList.length) {
      setPreviewIndex(Math.max(0, printableList.length - 1));
    }
  }, [printableList.length, previewIndex]);

  if (!open) return null;

  const totalAmount = printableList.reduce((acc, curr) => acc + Number(curr.amt || 0), 0);
  const activePreviewItem = printableList[previewIndex] || printableList[0];

  // Filename for active preview item
  const activePreviewFilename = activePreviewItem
    ? getBulkIndividualReceiptFilename(activePreviewItem)
    : 'Receipt.pdf';
  const isActivePreviewNamedByContributor = Boolean(activePreviewItem && !activePreviewItem.flat?.trim());

  // Handler: Generate and save receipts as individual PDF files (or chosen format)
  const handleGeneratePdf = async () => {
    if (printableList.length === 0) {
      alert('No receipts selected for generation.');
      return;
    }

    const container = renderContainerRef.current;
    if (!container) {
      alert('Receipt render queue is not ready. Please try again.');
      return;
    }

    const elements = Array.from(container.querySelectorAll('.bulk-receipt-card')) as HTMLElement[];
    if (elements.length === 0) {
      alert('Could not locate receipt elements. Please try again.');
      return;
    }

    setIsGenerating(true);
    setDownloadSuccess(false);
    setProgress({
      current: 0,
      total: elements.length,
      percent: 0,
      currentItemName: 'Preparing individual PDF generator...'
    });

    try {
      const todayStr = new Date().toISOString().split('T')[0];

      if (exportFormat === 'combined_pdf') {
        // Single combined PDF file
        const filename = `Ganeshotsava2026_All_Receipts_Combined_${todayStr}.pdf`;
        const pdfBlob = await generateBulkReceiptsPdfBlob(
          elements,
          p => setProgress(p),
          { scale: 1.6, quality: 0.92, twoPerPage: false }
        );
        downloadBlobAsFile(pdfBlob, filename);
        setSavedFilename(filename);
        setGeneratedFilesList([]);
        setDownloadSuccess(true);
      } else {
        // Separate individual PDF files for each receipt
        // Named by Flat (or contributor name if flat is empty)
        const files = await generateIndividualReceiptPdfBlobs(
          elements,
          printableList,
          p => setProgress(p),
          { scale: 1.7, quality: 0.93 }
        );

        setGeneratedFilesList(files);

        if (exportFormat === 'separate_zip') {
          // Zip all separate PDF files into one archive
          setProgress({
            current: files.length,
            total: files.length,
            percent: 95,
            currentItemName: 'Packaging all separate PDF files into ZIP archive...'
          });

          const zipFilename = `Ganeshotsava2026_Individual_Receipt_PDFs_${todayStr}.zip`;
          const zipBlob = await createZipFromReceiptPdfs(files, pct => {
            setProgress({
              current: files.length,
              total: files.length,
              percent: pct,
              currentItemName: `Zipping separate PDFs (${pct}%)...`
            });
          });

          downloadBlobAsFile(zipBlob, zipFilename);
          setSavedFilename(zipFilename);
          setDownloadSuccess(true);
        } else if (exportFormat === 'separate_direct') {
          // Download each separate PDF file directly
          setProgress({
            current: 0,
            total: files.length,
            percent: 100,
            currentItemName: 'Saving separate PDF files to device...'
          });

          await downloadFilesSequentially(files, 250, (curr, tot) => {
            setProgress({
              current: curr,
              total: tot,
              percent: Math.round((curr / tot) * 100),
              currentItemName: `Saving ${files[curr - 1]?.filename || 'file'} to device...`
            });
          });

          setSavedFilename(`${files.length} individual PDF files saved`);
          setDownloadSuccess(true);
        }
      }
    } catch (err: any) {
      console.error('Receipt PDF generation failed:', err);
      alert(`Receipt PDF generation encountered an issue: ${err.message || 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handler: Download individual PDF files directly from generated list
  const handleDownloadDirectFromList = async () => {
    if (generatedFilesList.length === 0) return;
    setIsGenerating(true);
    try {
      await downloadFilesSequentially(generatedFilesList, 200);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handler: Download as ZIP from generated list
  const handleDownloadZipFromList = async () => {
    if (generatedFilesList.length === 0) return;
    setIsGenerating(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const zipBlob = await createZipFromReceiptPdfs(generatedFilesList);
      downloadBlobAsFile(zipBlob, `Ganeshotsava2026_Individual_Receipt_PDFs_${todayStr}.zip`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handler: Direct print all receipts via native browser print
  const handleDirectPrintAll = () => {
    if (printableList.length === 0) {
      alert('No receipts to print.');
      return;
    }

    const container = renderContainerRef.current;
    if (!container) return;

    const cards = Array.from(container.querySelectorAll('.bulk-receipt-card')) as HTMLElement[];
    const pagesHtml = cards
      .map(
        c => `
      <div class="bulk-print-page">
        ${c.outerHTML}
      </div>
    `
      )
      .join('');

    triggerBulkDirectPrint(pagesHtml, `Ganeshotsava 2026 - Bulk Receipts (${printableList.length})`);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={e => {
        if (e.target === e.currentTarget && !isGenerating) onClose();
      }}
    >
      <div className="bg-white rounded-xl border border-stone-200 shadow-2xl max-w-4xl w-full overflow-hidden my-auto flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="bg-[#991B1B] text-white px-4 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center shrink-0">
              <Files className="w-4 h-4 text-amber-300" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider truncate">
                Bulk Receipts &amp; Individual PDF Exporter
              </h2>
              <p className="text-[11px] text-amber-100/90 truncate">
                Save receipts as separate PDF files: named by Flat (or Contributor name if Flat is empty)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            title="Close modal"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Modal Controls Bar */}
        <div className="bg-stone-50 border-b border-stone-200 px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          {/* Scope selection */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-stone-700">Receipts:</span>
            <div className="inline-flex rounded-lg border border-stone-300 bg-white p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setScope('all')}
                className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                  scope === 'all'
                    ? 'bg-[#991B1B] text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                All Receipts ({items.length})
              </button>
              {selectedIds && selectedIds.size > 0 && (
                <button
                  type="button"
                  onClick={() => setScope('selected')}
                  className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                    scope === 'selected'
                      ? 'bg-[#991B1B] text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Selected ({selectedIds.size})
                </button>
              )}
            </div>

            {selectedIds && selectedIds.size > 0 && onClearSelection && (
              <button
                type="button"
                onClick={onClearSelection}
                className="text-[11px] text-stone-500 hover:text-red-700 underline cursor-pointer ml-1"
              >
                Clear Selection
              </button>
            )}
          </div>

          {/* Export Mode & Sorting */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-stone-700 font-bold">Save Mode:</span>
              <select
                value={exportFormat}
                onChange={e => setExportFormat(e.target.value as any)}
                className="border border-stone-300 rounded px-2 py-1 bg-white font-semibold text-stone-800 outline-none focus:border-[#991B1B] cursor-pointer"
              >
                <option value="separate_zip">Separate PDFs (ZIP Archive) — Recommended</option>
                <option value="separate_direct">Separate PDFs (Direct Downloads)</option>
                <option value="combined_pdf">Single Multi-Page PDF (All in One)</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-stone-600 font-medium">Sort:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="border border-stone-300 rounded px-2 py-1 bg-white font-medium text-stone-800 outline-none focus:border-[#991B1B] cursor-pointer"
              >
                <option value="rcptAsc">Receipt No (Ascending)</option>
                <option value="rcptDesc">Receipt No (Descending)</option>
                <option value="dateDesc">Date (Newest First)</option>
                <option value="nameAsc">Contributor Name (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Naming Rule & Stats Summary Strip */}
        <div className="bg-amber-50/80 border-b border-amber-200/80 px-4 py-2 sm:px-6 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <span className="text-stone-500">Total Receipts: </span>
              <strong className="text-stone-900 font-mono text-sm">{printableList.length}</strong>
            </div>
            <div>
              <span className="text-stone-500">Total Amount: </span>
              <strong className="text-emerald-700 font-mono text-sm">₹ {fmt(totalAmount)}</strong>
            </div>
          </div>

          <div className="text-[11px] text-stone-600 flex items-center gap-1.5">
            <span className="font-semibold text-[#991B1B]">File Naming:</span>
            <span>
              <strong>Flat.pdf</strong> (e.g. <code>A-101.pdf</code>) • If flat is empty: <strong>Name.pdf</strong> (e.g. <code>Sachin Desai.pdf</code>)
            </span>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-100/60">
          {/* Progress Banner when generating */}
          {isGenerating && progress && (
            <div className="mb-5 bg-white border border-[#991B1B]/30 rounded-xl p-4 shadow-sm animate-pulse">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-800 mb-2">
                <span className="inline-flex items-center gap-2 text-[#991B1B]">
                  <Loader2 className="w-4 h-4 animate-spin text-[#991B1B]" />
                  <span>
                    Generating Separate PDFs — Processing {progress.current} of {progress.total}
                  </span>
                </span>
                <span className="font-mono font-bold text-[#991B1B] text-sm">{progress.percent}%</span>
              </div>
              <div className="w-full bg-stone-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-[#991B1B] h-2.5 rounded-full transition-all duration-200"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              <p className="text-[11px] text-stone-500 mt-2 truncate">
                Current item: <strong className="text-stone-800 font-mono">{progress.currentItemName || 'Rendering...'}</strong>
              </p>
            </div>
          )}

          {/* Success Banner after download */}
          {downloadSuccess && !isGenerating && (
            <div className="mb-5 bg-emerald-50 border border-emerald-300 rounded-xl p-4 shadow-xs text-xs text-emerald-900">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-emerald-950 text-sm">
                      {exportFormat === 'combined_pdf'
                        ? 'All Receipts Saved to Combined PDF Successfully!'
                        : `All ${printableList.length} Receipts Saved as Separate PDF Files!`}
                    </h4>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      {exportFormat === 'separate_zip' ? (
                        <>
                          ZIP Archive saved to device: <strong className="font-mono">{savedFilename}</strong>.
                          Extracting this folder gives you each receipt as a separate PDF named after its Flat (or Contributor name if empty).
                        </>
                      ) : exportFormat === 'separate_direct' ? (
                        <>
                          All {printableList.length} separate PDF files were triggered for download into your device's Downloads folder.
                        </>
                      ) : (
                        <>
                          Combined PDF saved to your device: <strong className="font-mono">{savedFilename}</strong>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {generatedFilesList.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadZipFromList}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-1.5 rounded inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs text-xs"
                      title="Download as ZIP folder"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>Re-download ZIP</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadDirectFromList}
                      className="bg-stone-700 hover:bg-stone-800 text-white font-bold px-3 py-1.5 rounded inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs text-xs"
                      title="Download all individual files directly"
                    >
                      <ArrowDownToLine className="w-3.5 h-3.5" />
                      <span>Download Direct</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Quick sample list of filenames */}
              {generatedFilesList.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-emerald-200/60">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 mb-1">
                    Generated Separate PDF Files Sample:
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {generatedFilesList.slice(0, 10).map((f, i) => (
                      <span
                        key={i}
                        className="font-mono text-[10px] bg-white border border-emerald-300 text-emerald-900 px-2 py-0.5 rounded shadow-2xs"
                      >
                        📄 {f.filename}
                      </span>
                    ))}
                    {generatedFilesList.length > 10 && (
                      <span className="text-[10px] text-emerald-700 font-semibold self-center px-1">
                        +{generatedFilesList.length - 10} more files
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Interactive Preview Section */}
          {printableList.length > 0 ? (
            <div className="space-y-3">
              {/* Pagination & Filename indicator bar for preview */}
              <div className="flex flex-wrap items-center justify-between bg-white px-4 py-2.5 rounded-lg border border-stone-200 shadow-2xs text-xs gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-[#991B1B] shrink-0" />
                  <span className="font-bold text-stone-800 shrink-0">
                    Preview ({previewIndex + 1} of {printableList.length}):
                  </span>
                  {/* Highlight calculated filename */}
                  <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-300 text-amber-950 font-mono font-bold px-2 py-0.5 rounded text-[11px] shadow-2xs truncate">
                    <span>📄 {activePreviewFilename}</span>
                  </span>
                  {isActivePreviewNamedByContributor && (
                    <span className="text-[10px] text-stone-500 italic hidden sm:inline">
                      (Flat is empty → named by Contributor)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 ml-auto">
                  <button
                    type="button"
                    onClick={() => setPreviewIndex(prev => Math.max(0, prev - 1))}
                    disabled={previewIndex === 0}
                    className="p-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 disabled:opacity-30 disabled:hover:bg-stone-100 cursor-pointer"
                    title="Previous Receipt Preview"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono font-semibold px-2 text-stone-700">
                    {previewIndex + 1} / {printableList.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPreviewIndex(prev => Math.min(printableList.length - 1, prev + 1))}
                    disabled={previewIndex === printableList.length - 1}
                    className="p-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 disabled:opacity-30 disabled:hover:bg-stone-100 cursor-pointer"
                    title="Next Receipt Preview"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Display Single Active Preview Card */}
              <div className="max-w-xl mx-auto shadow-md rounded-lg overflow-hidden bg-white border-2 border-[#991B1B]">
                <ReceiptCard
                  item={activePreviewItem}
                  settings={settings}
                  qrCodeDataUrl={qrCodeDataUrl}
                  compact={false}
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-stone-500 text-sm">
              No receipts match the current selection.
            </div>
          )}
        </div>

        {/* Bottom Actions Footer */}
        <div className="bg-white border-t border-stone-200 px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-stone-600">
            Exporting <strong className="text-stone-900">{printableList.length}</strong> separate PDF file
            {printableList.length === 1 ? '' : 's'}
            <span className="text-stone-400 mx-1.5">•</span>
            <span className="text-stone-500">
              {exportFormat === 'separate_zip'
                ? 'Packaged in ZIP archive with individual filenames'
                : exportFormat === 'separate_direct'
                ? 'Direct download of individual files'
                : 'Single combined document'}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="px-4 py-2 rounded text-xs font-bold uppercase tracking-wider text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            {/* Direct Print Button */}
            <button
              type="button"
              onClick={handleDirectPrintAll}
              disabled={isGenerating || printableList.length === 0}
              className="px-4 py-2 rounded text-xs font-bold uppercase tracking-wider text-[#991B1B] bg-red-50 hover:bg-red-100 border border-red-200 inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              title="Open browser print dialog for all receipts"
            >
              <Printer className="w-4 h-4" />
              <span>Print Receipts</span>
            </button>

            {/* Primary Action: Save Separate PDF Files to Device */}
            <button
              type="button"
              onClick={handleGeneratePdf}
              disabled={isGenerating || printableList.length === 0}
              className="px-5 py-2 rounded text-xs font-bold uppercase tracking-wider text-white bg-[#991B1B] hover:bg-[#7F1D1D] inline-flex items-center gap-2 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
              title="Save each receipt as a separate PDF file named by Flat (or by contributor name if flat is empty)"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
              ) : exportFormat === 'separate_zip' ? (
                <Archive className="w-4 h-4 text-amber-300" />
              ) : (
                <Download className="w-4 h-4 text-amber-300" />
              )}
              <span>
                {isGenerating
                  ? `Generating (${progress?.percent || 0}%)...`
                  : exportFormat === 'separate_zip'
                  ? `Save All as Separate PDFs (${printableList.length} Files)`
                  : exportFormat === 'separate_direct'
                  ? `Download All ${printableList.length} PDF Files`
                  : `Save Combined PDF (${printableList.length})`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Hidden background render container for html2canvas to read all cards */}
      <div
        ref={renderContainerRef}
        id="bulk-receipts-render-container"
        style={{
          position: 'fixed',
          left: '-10000px',
          top: '0',
          width: '640px',
          pointerEvents: 'none',
          zIndex: -999,
          background: '#ffffff'
        }}
        aria-hidden="true"
      >
        {printableList.map((item, idx) => (
          <div
            key={item.id || idx}
            data-rcpt-title={`${item.rcptNo || 'VAL'} — ${item.name}`}
            className="bulk-receipt-card"
            style={{ width: '580px', margin: '0 auto 30px auto', background: '#ffffff' }}
          >
            <ReceiptCard
              item={item}
              settings={settings}
              qrCodeDataUrl={qrCodeDataUrl}
              compact={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Reusable full-fidelity receipt template matching the single receipt in ReceiptInvoiceModal
 */
interface ReceiptCardProps {
  item: Contribution;
  settings: AppSettings;
  qrCodeDataUrl?: string;
  compact?: boolean;
}

const ReceiptCard: React.FC<ReceiptCardProps> = ({ item, settings, qrCodeDataUrl, compact }) => {
  return (
    <div
      className="relative overflow-hidden bg-white p-5 sm:p-7 border-2 border-[#991B1B] rounded-lg font-sans mx-auto w-full"
      style={{ isolation: 'isolate', overflow: 'hidden' }}
    >
      <GaneshaWatermark opacity={0.22} size="full" fit="fill" />

      <div className="relative z-10">
        {/* Header */}
        <div className={`flex items-center gap-3 sm:gap-4 border-b-2 border-[#991B1B] ${compact ? 'pb-2.5 mb-2.5' : 'pb-4 mb-4'}`}>
          <img
            src={settings.logo || '/lord_ganesha.svg'}
            alt="Lord Sri Ganesha"
            className={`${compact ? 'w-12 h-12' : 'w-14 h-14 sm:w-16 sm:h-16'} object-contain rounded shrink-0`}
            referrerPolicy="no-referrer"
          />
          <div className="flex-1 text-center">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#991B1B] mb-0.5 inline-flex items-center justify-center gap-1.5">
              <img src="/lord_ganesha.svg" alt="" className="w-3.5 h-3.5 object-contain inline" referrerPolicy="no-referrer" />
              <span>GANAPATI BAPPA MORYA</span>
              <img src="/lord_ganesha.svg" alt="" className="w-3.5 h-3.5 object-contain inline" referrerPolicy="no-referrer" />
            </div>
            <h2
              className={`${compact ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'} font-serif font-black text-[#991B1B] leading-tight`}
            >
              {settings.org || 'Brigade Eldorado Residents Association'}
            </h2>
            <h3 className="text-xs sm:text-sm font-bold text-stone-800">3rd Year Ganeshotsava 2026</h3>
            <p className="text-[11px] text-stone-500">14th September – 18th September 2026</p>
            <p className="text-[11px] text-stone-500">{settings.location || 'Amphitheatre'}</p>
          </div>
        </div>

        {/* Document Number & Date Banner */}
        <div
          className={`flex justify-between text-xs py-1.5 border-b border-stone-200 mb-2.5 bg-stone-50/70 px-3 rounded font-medium`}
        >
          <span>
            <strong>Receipt No:</strong>{' '}
            <span className="font-mono font-bold text-[#991B1B] ml-1">
              {item.rcptNo || 'VAL'}
            </span>
          </span>
          <span>
            <strong>Date:</strong> {fmtDate(item.date || today())}
          </span>
        </div>

        {/* RECEIPT DETAILS */}
        <div className="space-y-1.5 text-xs py-1">
          <div className="flex">
            <span className="w-1/3 font-bold uppercase tracking-wider text-stone-600">Contributor</span>
            <span className="w-2/3 font-bold text-stone-900">{item.name}</span>
          </div>
          {item.flat && (
            <div className="flex">
              <span className="w-1/3 font-bold uppercase tracking-wider text-stone-600">Flat / Unit</span>
              <span className="w-2/3 font-semibold text-stone-800">{item.flat}</span>
            </div>
          )}
          <div className="flex">
            <span className="w-1/3 font-bold uppercase tracking-wider text-stone-600">Type</span>
            <span className="w-2/3 font-medium text-stone-800">Voluntary Resident Contribution</span>
          </div>
          {item.pay && (
            <div className="flex">
              <span className="w-1/3 font-bold uppercase tracking-wider text-stone-600">Payment Mode</span>
              <span className="w-2/3 font-medium text-stone-900">
                {item.pay}
                {item.txn ? ` (Ref: ${item.txn})` : ''}
              </span>
            </div>
          )}
          {item.notes && (
            <div className="flex">
              <span className="w-1/3 font-bold uppercase tracking-wider text-stone-600">Notes</span>
              <span className="w-2/3 italic text-stone-700">{item.notes}</span>
            </div>
          )}
        </div>

        {/* Amount Box */}
        <div
          className={`${compact ? 'my-3 p-2.5' : 'my-4 p-3.5'} text-center bg-amber-50/60 border border-amber-200 rounded`}
        >
          <div className="text-[10px] font-bold uppercase tracking-widest text-stone-600">Amount Received</div>
          <div
            className={`${compact ? 'text-2xl' : 'text-2xl sm:text-3xl'} font-mono font-bold text-[#991B1B] my-0.5`}
          >
            ₹ {fmt(item.amt)}
          </div>
          <div className="text-xs italic text-stone-600 capitalize">{numWords(item.amt)}</div>
        </div>

        {/* UPI QR Code (if available) */}
        {qrCodeDataUrl && (
          <div className="text-center my-2">
            <img
              src={qrCodeDataUrl}
              alt="UPI QR"
              className="inline-block p-1 border border-stone-300 rounded bg-white w-20 h-20 object-contain"
            />
            <div className="text-[9px] text-stone-500 mt-0.5">UPI ID: {settings.upi}</div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="text-[10px] text-stone-500 border-t border-stone-200 pt-2 mt-2 leading-relaxed">
          <strong>Disclaimer:</strong> Funds collected are held in a dedicated account solely for Ganeshotsava 2026
          celebration expenses. All contributions are voluntary.
        </div>

        {/* Digital Signature */}
        <DigitalSignatureBlock refCode={`GNS2026-SAMITHI-${item.rcptNo || 'VAL'}`} />

        {/* Footer */}
        <div className="text-center text-xs text-stone-600 border-t border-stone-200 pt-2.5 mt-3">
          Thank you for your generous support 🙏<br />
          <strong>Ganapati Bappa Morya!</strong>
        </div>
      </div>
    </div>
  );
};
