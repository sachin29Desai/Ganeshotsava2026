import React, { useRef, useEffect, useState } from 'react';
import { Printer, PhoneCall, X, Download, Loader2, Upload, RotateCcw } from 'lucide-react';
import { AppSettings } from '../types';
import { fmt, fmtDate, numWords, today } from '../utils/helpers';
import { GaneshaWatermark } from './GaneshaWatermark';

export { GaneshaWatermark };

export interface PrintData {
  type: 'receipt' | 'invoice';
  subType?: 'contribution' | 'seva' | 'sponsor' | 'stall' | 'auction';
  item: any;
}

interface ReceiptInvoiceModalProps {
  open: boolean;
  printData: PrintData | null;
  settings: AppSettings;
  isGeneratingPdf: boolean;
  onClose: () => void;
  onDirectPrint: () => void;
  onDownloadPdf: () => void;
  onShareWhatsApp: () => void;
  modalQrRef: React.RefObject<HTMLDivElement | null>;
}

export const DigitalSignatureBlock = ({ refCode: _refCode }: { refCode?: string } = {}) => (
  <div className="mt-4 pt-3 border-t border-stone-200 flex flex-row items-end justify-end">
    <div className="flex flex-col items-center text-center shrink-0">
      <div
        className="font-signature text-xl sm:text-2xl text-[#991B1B] font-normal select-none leading-none mb-1 tracking-normal px-2 whitespace-nowrap"
        style={{ fontFamily: "'Great Vibes', 'Dancing Script', cursive" }}
      >
        Ganeshotsava Samithi
      </div>
      <div className="w-36 sm:w-44 border-t border-stone-800 my-1"></div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-stone-900 leading-tight whitespace-nowrap">
        Authorized Signatory
      </div>
      <div className="text-[9px] text-stone-500 font-medium leading-tight whitespace-nowrap">
        Ganeshotsava Samithi 2026
      </div>
    </div>
  </div>
);

export const ReceiptInvoiceModal: React.FC<ReceiptInvoiceModalProps> = ({
  open,
  printData,
  settings,
  isGeneratingPdf,
  onClose,
  onDirectPrint,
  onDownloadPdf,
  onShareWhatsApp,
  modalQrRef
}) => {
  const receiptContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [watermarkFit, setWatermarkFit] = useState<'fill' | 'contain'>(() => {
    try {
      const saved = localStorage.getItem('receipt_watermark_fit');
      if (saved === 'contain' || saved === 'fill') return saved;
    } catch {
      // ignore
    }
    return 'fill';
  });
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(0.22);
  const [hasCustomWatermark, setHasCustomWatermark] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem('custom_watermark_data'));
    } catch {
      return false;
    }
  });

  const handleWatermarkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        try {
          localStorage.setItem('custom_watermark_data', reader.result);
          setHasCustomWatermark(true);
          window.dispatchEvent(new Event('watermark_updated'));
        } catch (err) {
          console.error('Failed to save custom watermark:', err);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetWatermark = () => {
    try {
      localStorage.removeItem('custom_watermark_data');
      setHasCustomWatermark(false);
      window.dispatchEvent(new Event('watermark_updated'));
    } catch (err) {
      console.error('Failed to reset watermark:', err);
    }
  };

  const toggleWatermarkFit = (fit: 'fill' | 'contain') => {
    setWatermarkFit(fit);
    try {
      localStorage.setItem('receipt_watermark_fit', fit);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (open) {
      document.body.classList.add('receipt-modal-active');
    } else {
      document.body.classList.remove('receipt-modal-active');
    }
    return () => {
      document.body.classList.remove('receipt-modal-active');
    };
  }, [open]);

  if (!open || !printData) return null;

  const isReceipt = printData.type === 'receipt';
  const item = printData.item;
  const subType = printData.subType || (item.isSeva ? 'seva' : item.tokNo ? 'seva' : item.rcptNo ? 'contribution' : item.by ? 'auction' : 'sponsor');

  let title = 'Official E-Receipt & Voucher';
  if (subType === 'sponsor') title = 'Official Sponsorship Invoice';
  else if (subType === 'stall') title = 'Official Commercial Stall Invoice';
  else if (subType === 'auction') title = 'Official Auction Winning Bid Invoice';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto modal-backdrop"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl border border-stone-200 shadow-2xl max-w-2xl w-full overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[94vh]">
        {/* Top Header */}
        <div className="bg-[#991B1B] text-white p-3 sm:px-5 sm:py-3.5 no-print sticky top-0 z-20 shadow-md">
          <div className="flex items-center justify-between gap-2 mb-2 sm:mb-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <Printer className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 shrink-0" />
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider truncate">{title}</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-2"
              title="Close preview"
              aria-label="Close"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex-1 sm:flex-initial justify-center bg-amber-400 hover:bg-amber-300 text-stone-900 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded inline-flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-75"
              title="Save directly as a single PDF receipt file"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{isGeneratingPdf ? 'Saving PDF...' : 'Save PDF'}</span>
            </button>
            <button
              onClick={onDirectPrint}
              className="flex-1 sm:flex-initial justify-center bg-white text-[#991B1B] hover:bg-stone-100 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded inline-flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              title="Print only this single receipt"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Receipt</span>
            </button>
            <button
              onClick={onShareWhatsApp}
              disabled={isGeneratingPdf}
              className="flex-1 sm:flex-initial justify-center bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded inline-flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-75"
              title="Share receipt via WhatsApp"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Modal Body Preview */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-stone-100/70" id="receipt-preview-content">
          {/* Watermark Controls Toolbar (Hidden in print) */}
          <div className="max-w-xl mx-auto mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-600 bg-white/90 backdrop-blur-xs px-3 py-2 rounded-lg border border-stone-200 shadow-xs print:hidden">
            <div className="flex items-center gap-1.5 font-medium text-[11px]">
              <span className="text-[#991B1B] font-bold">Watermark:</span>
              <span className="text-stone-700 font-medium">
                {hasCustomWatermark ? 'Custom Image' : 'Watercolor Lord Ganesha'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleWatermarkUpload}
              />
              {/* Fit Mode Toggle */}
              <div className="inline-flex items-center rounded border border-stone-200 bg-stone-50 p-0.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => toggleWatermarkFit('fill')}
                  className={`px-2 py-0.5 rounded font-semibold transition-colors cursor-pointer ${
                    watermarkFit === 'fill' ? 'bg-[#991B1B] text-white' : 'text-stone-600 hover:text-stone-900'
                  }`}
                  title="Fit to entire receipt dimensions (Four corners locked, guaranteed inside boundaries)"
                >
                  Fill Frame
                </button>
                <button
                  type="button"
                  onClick={() => toggleWatermarkFit('contain')}
                  className={`px-2 py-0.5 rounded font-semibold transition-colors cursor-pointer ${
                    watermarkFit === 'contain' ? 'bg-[#991B1B] text-white' : 'text-stone-600 hover:text-stone-900'
                  }`}
                  title="Preserve original aspect ratio inside receipt without cropping"
                >
                  Contain
                </button>
              </div>

              {/* Opacity Selector */}
              <select
                value={watermarkOpacity}
                onChange={e => setWatermarkOpacity(Number(e.target.value))}
                className="text-[10px] font-medium bg-stone-50 border border-stone-200 rounded px-1.5 py-0.5 text-stone-700 cursor-pointer"
                title="Watermark Opacity"
              >
                <option value={0.15}>Subtle (15%)</option>
                <option value={0.22}>Balanced (22%)</option>
                <option value={0.32}>Vivid (32%)</option>
                <option value={0.45}>Bold (45%)</option>
              </select>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded cursor-pointer transition-colors"
                title="Upload image from your device to use as receipt watermark"
              >
                <Upload className="w-3 h-3 text-[#991B1B]" />
                Upload
              </button>
              {hasCustomWatermark && (
                <button
                  type="button"
                  onClick={handleResetWatermark}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-red-700 hover:text-red-800 hover:bg-red-50 rounded cursor-pointer transition-colors"
                  title="Reset to default Lord Ganesha artwork"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              )}
            </div>
          </div>

          <div
            ref={receiptContainerRef}
            id="receipt-print-target"
            className="relative overflow-hidden bg-white p-5 sm:p-7 border-2 border-[#991B1B] shadow-md rounded-lg font-sans mx-auto max-w-xl"
            style={{ isolation: 'isolate', overflow: 'hidden' }}
          >
            <GaneshaWatermark opacity={watermarkOpacity} size="full" fit={watermarkFit} />

            <div className="relative z-10">
              {/* Header */}
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
                    {settings.org || 'Brigade Eldorado Residents Association'}
                  </h2>
                  <h3 className="text-xs sm:text-sm font-bold text-stone-800">3rd Year Ganeshotsava 2026</h3>
                  <p className="text-[11px] text-stone-500">14th September – 18th September 2026</p>
                  <p className="text-[11px] text-stone-500">{settings.location || 'Amphitheatre'}</p>
                </div>
              </div>

              {/* Document Number & Date Banner */}
              <div className="flex justify-between text-xs py-2 border-b border-stone-200 mb-3 bg-stone-50/70 px-3 rounded font-medium">
                <span>
                  <strong>{isReceipt ? 'Receipt / Token No:' : 'Invoice No:'}</strong>{' '}
                  <span className="font-mono font-bold text-[#991B1B] ml-1">
                    {item.rcptNo || item.tokNo || item.invNo || 'VAL'}
                  </span>
                </span>
                <span>
                  <strong>Date:</strong> {fmtDate(item.date || today())}
                </span>
              </div>

              {/* RECEIPT DETAILS (Contributions / Sevas) */}
              {isReceipt && (
                <>
                  <div className="space-y-2 text-xs py-2">
                    <div className="flex">
                      <span className="w-1/3 font-bold uppercase tracking-wider text-stone-600">
                        {item.isSeva || subType === 'seva' ? 'Devotee / Resident' : 'Contributor'}
                      </span>
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
                      <span className="w-2/3 font-medium text-stone-900">
                        {item.isSeva || subType === 'seva' ? `Devotional Seva Offering (${item.seva})` : 'Voluntary Resident Contribution'}
                      </span>
                    </div>
                    {(item.isSeva || subType === 'seva') && (item.qty || item.unit) && (
                      <div className="flex">
                        <span className="w-1/3 font-bold uppercase tracking-wider text-stone-600">Quantity</span>
                        <span className="w-2/3 font-semibold text-stone-900">
                          {item.qty || 1} {item.unit || ''}
                        </span>
                      </div>
                    )}
                    {(item.isSeva || subType === 'seva') && item.status && (
                      <div className="flex">
                        <span className="w-1/3 font-bold uppercase tracking-wider text-stone-600">Booking Status</span>
                        <span className="w-2/3 font-bold">
                          {item.status === 'Confirmed' ? (
                            <span className="text-emerald-700">✓ Confirmed by Committee</span>
                          ) : (
                            <span className="text-amber-700">⏳ Booked (To be confirmed)</span>
                          )}
                        </span>
                      </div>
                    )}
                    {item.pay && (
                      <div className="flex">
                        <span className="w-1/3 font-bold uppercase tracking-wider text-stone-600">Payment Mode</span>
                        <span className="w-2/3 font-medium text-stone-900">
                          {item.pay}
                        </span>
                      </div>
                    )}
                    {item.notes && (
                      <div className="flex">
                        <span className="w-1/3 font-bold uppercase tracking-wider text-stone-600">Notes / Sankalpa</span>
                        <span className="w-2/3 italic text-stone-700">{item.notes}</span>
                      </div>
                    )}
                  </div>

                  <div className="my-5 p-4 text-center bg-amber-50/60 border border-amber-200 rounded">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-stone-600">
                      {(item.isSeva || subType === 'seva') && (!item.amt || Number(item.amt) === 0)
                        ? 'Contribution / Offering'
                        : 'Amount Received'}
                    </div>
                    {(item.isSeva || subType === 'seva') && (!item.amt || Number(item.amt) === 0) ? (
                      <div className="text-xl sm:text-2xl font-serif font-bold text-[#991B1B] my-1">
                        In-Kind Material Offering
                      </div>
                    ) : (
                      <>
                        <div className="text-2xl sm:text-3xl font-mono font-bold text-[#991B1B] my-1">
                          ₹ {fmt(item.amt)}
                        </div>
                        <div className="text-xs italic text-stone-600 capitalize">
                          {numWords(item.amt)} Rupees Only
                        </div>
                      </>
                    )}
                  </div>

                  {settings.upi && (
                    <div className="text-center my-3">
                      <div ref={modalQrRef} className="inline-block p-2 border border-stone-300 rounded bg-white" />
                      <div className="text-[10px] text-stone-500 mt-1">Scan to pay via UPI: {settings.upi}</div>
                    </div>
                  )}

                  <div className="text-[10px] text-stone-500 border-t border-stone-200 pt-3 mt-3 leading-relaxed">
                    <strong>Disclaimer:</strong>{' '}
                    {item.isSeva || subType === 'seva'
                      ? 'Devotional seva offering registered for Ganeshotsava 2026 celebrations. May Lord Sri Ganesha bestow health, happiness, and prosperity.'
                      : 'Funds collected are held in a dedicated account solely for Ganeshotsava 2026 celebration expenses. All contributions are voluntary.'}
                  </div>

                  <DigitalSignatureBlock refCode={`GNS2026-SAMITHI-${item.rcptNo || item.tokNo || 'VAL'}`} />
                </>
              )}

              {/* INVOICE DETAILS (Sponsors / Commercial Stalls / Auctions) */}
              {!isReceipt && (
                <>
                  <div className="bg-stone-50 border border-stone-200 rounded p-3 sm:p-4 mb-4 text-xs">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                      {subType === 'sponsor' ? 'Sponsor Particulars' : subType === 'stall' ? 'Commercial Stall & Vendor Details' : 'Auction Particulars & Winner Details'}
                    </div>
                    {subType === 'stall' && (item.particular || item.vendor) ? (
                      <div className="text-sm space-y-1 text-stone-900">
                        <div>
                          <span className="text-stone-500 font-normal">Particular: </span>
                          <span className="font-semibold">{item.particular || item.det}</span>
                        </div>
                        {item.vendor && (
                          <div>
                            <span className="text-stone-500 font-normal">Vendor Details: </span>
                            <span className="font-medium">{item.vendor}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm font-semibold whitespace-pre-line text-stone-900">
                        {item.det}
                      </div>
                    )}
                    {item.by && (
                      <div className="mt-2 pt-2 border-t border-stone-200 text-xs text-stone-800">
                        <strong>Auctioned (By) / Winner:</strong> <span className="font-bold text-[#991B1B]">{item.by}</span>
                      </div>
                    )}
                    {item.payMode && (
                      <div className="mt-1 text-xs text-stone-800">
                        <strong>Payment Mode:</strong> <span className="font-semibold text-stone-900">{item.payMode}</span>
                      </div>
                    )}
                    {item.notes && (
                      <div className="mt-1 text-xs italic text-stone-600">
                        <strong>Notes:</strong> {item.notes}
                      </div>
                    )}
                  </div>

                  <table className="w-full text-left border-collapse text-xs mb-4">
                    <thead>
                      <tr className="bg-[#991B1B] text-white uppercase text-[10px] tracking-wider">
                        <th className="p-2.5">#</th>
                        <th className="p-2.5">Description</th>
                        <th className="p-2.5 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-stone-200">
                        <td className="p-2.5">1</td>
                        <td className="p-2.5 font-medium">
                          {subType === 'sponsor'
                            ? 'Sponsorship Contribution — Ganeshotsava 2026'
                            : subType === 'stall'
                            ? `Commercial Stall Rights Fee — ${item.particular || item.det.split('\n')[0]}`
                            : `Winning Bid — ${item.det}`}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-stone-900">₹ {fmt(item.act || item.amt)}</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="font-bold border-t-2 border-[#991B1B] text-sm">
                        <td colSpan={2} className="p-2.5">Total Amount</td>
                        <td className="p-2.5 text-right font-mono text-[#991B1B]">₹ {fmt(item.act || item.amt)}</td>
                      </tr>
                    </tfoot>
                  </table>

                  <div className="text-right text-xs italic text-stone-600 mb-4 capitalize">
                    {numWords(item.act || item.amt)}
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-stone-700 mb-4">
                    <strong>Thank you for your generous partnership &amp; devotional support! 🙏</strong>
                    <br />
                    <em>Ganapati Bappa Morya!</em>
                  </div>

                  <DigitalSignatureBlock refCode={`GNS2026-${subType.toUpperCase()}-INVOICE-${item.invNo || 'VAL'}`} />
                </>
              )}

              <div className="text-center text-xs text-stone-600 border-t border-stone-200 pt-3 mt-4">
                Thank you for your generous support 🙏<br />
                <strong>Ganapati Bappa Morya!</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Bar for Dismissal */}
        <div className="p-3 sm:p-3.5 bg-stone-100 border-t border-stone-200 flex items-center justify-between no-print text-xs">
          <span className="text-stone-500 font-medium truncate">Ganeshotsava 2026 Digital Document</span>
          <button
            type="button"
            onClick={onClose}
            className="bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded transition-colors cursor-pointer"
          >
            Close (✕)
          </button>
        </div>
      </div>
    </div>
  );
};
