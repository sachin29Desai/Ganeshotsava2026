import React, { useEffect, useRef, useState } from 'react';
import {
  Share2,
  Copy,
  CheckCircle2,
  ExternalLink,
  PhoneCall,
  X,
  QrCode,
  ShieldCheck,
  Sparkles,
  Link,
  Edit3,
  Save,
  RefreshCw,
  Globe,
  AlertCircle
} from 'lucide-react';
import { AppSettings } from '../types';

interface ShareReceiptPortalModalProps {
  open: boolean;
  settings: AppSettings;
  onClose: () => void;
  onOpenPortalInApp?: () => void;
  onUpdateSettings?: (settings: AppSettings) => void;
}

export const ShareReceiptPortalModal: React.FC<ShareReceiptPortalModalProps> = ({
  open,
  settings,
  onClose,
  onOpenPortalInApp,
  onUpdateSettings
}) => {
  const qrContainerRef = useRef<HTMLDivElement>(null);
  const [copiedType, setCopiedType] = useState<'short' | 'direct' | null>(null);

  // Clean full app path (e.g., https://domain.run.app/receipts)
  const cleanDirectUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/receipts`
    : '';

  // Recommended default short link already created for this festival app
  const DEFAULT_SHORT_LINK = 'https://tinyurl.com/eldorado-receipts-2026';

  // Active short link: custom from settings, or fallback default
  const activeShortUrl = settings.customReceiptPortalUrl || DEFAULT_SHORT_LINK;

  // Custom link editor state
  const [isEditingCustom, setIsEditingCustom] = useState(false);
  const [customInput, setCustomInput] = useState(activeShortUrl);
  const [aliasInput, setAliasInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Which link to use for QR and default share: short URL preferred
  const primaryShareUrl = activeShortUrl;

  useEffect(() => {
    setCustomInput(activeShortUrl);
  }, [activeShortUrl]);

  useEffect(() => {
    if (!open) return;

    // Generate QR code using the primary short URL for high scannability
    const timer = setTimeout(() => {
      if (qrContainerRef.current && window.QRCode && primaryShareUrl) {
        qrContainerRef.current.innerHTML = '';
        try {
          new window.QRCode(qrContainerRef.current, {
            text: primaryShareUrl,
            width: 140,
            height: 140,
            colorDark: '#7F1D1D',
            colorLight: '#ffffff',
            correctLevel: window.QRCode.CorrectLevel.M
          });
        } catch (e) {
          console.warn('QR Code generation warning:', e);
        }
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [open, primaryShareUrl]);

  if (!open) return null;

  const handleCopyShortLink = async () => {
    try {
      await navigator.clipboard.writeText(primaryShareUrl);
      setCopiedType('short');
      setTimeout(() => setCopiedType(null), 2500);
    } catch (err) {
      console.error('Failed to copy short link', err);
    }
  };

  const handleCopyDirectLink = async () => {
    try {
      await navigator.clipboard.writeText(cleanDirectUrl);
      setCopiedType('direct');
      setTimeout(() => setCopiedType(null), 2500);
    } catch (err) {
      console.error('Failed to copy direct link', err);
    }
  };

  const handleSaveCustomLink = () => {
    let clean = customInput.trim();
    if (!clean) {
      clean = DEFAULT_SHORT_LINK;
    }
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'https://' + clean;
    }

    if (onUpdateSettings) {
      onUpdateSettings({
        ...settings,
        customReceiptPortalUrl: clean
      });
      setStatusMessage({
        type: 'success',
        text: 'Short URL updated and saved! Devotees and WhatsApp messages will now use this short link.'
      });
      setTimeout(() => setStatusMessage(null), 4000);
      setIsEditingCustom(false);
    }
  };

  const handleGenerateNewShortLink = async () => {
    setIsGenerating(true);
    setStatusMessage(null);
    try {
      const alias = aliasInput.trim();
      let queryUrl = `/api/create-short-link?url=${encodeURIComponent(cleanDirectUrl)}`;
      if (alias) {
        queryUrl += `&alias=${encodeURIComponent(alias)}`;
      }

      const res = await fetch(queryUrl);
      const data = await res.json();

      if (data.success && data.shortUrl) {
        setCustomInput(data.shortUrl);
        if (onUpdateSettings) {
          onUpdateSettings({
            ...settings,
            customReceiptPortalUrl: data.shortUrl
          });
        }
        setStatusMessage({
          type: 'success',
          text: `Generated new short link: ${data.shortUrl}`
        });
        setTimeout(() => setStatusMessage(null), 4000);
        setIsEditingCustom(false);
      } else {
        setStatusMessage({
          type: 'error',
          text: data.error || 'Alias may already be taken. Try a different custom alias or use TinyURL.'
        });
      }
    } catch (err: any) {
      console.error('Short link generation error:', err);
      // Fallback to opening TinyURL generator
      const fallbackUrl = `https://tinyurl.com/create.php?url=${encodeURIComponent(cleanDirectUrl)}`;
      window.open(fallbackUrl, '_blank');
      setStatusMessage({
        type: 'success',
        text: 'Opened TinyURL in a new tab where you can choose any custom name.'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShareWhatsApp = () => {
    const text = `🙏 *Ganeshotsava 2026 — Official Devotee Receipt Portal*\n*${settings.org || 'Brigade Eldorado Residents Association'}*\n\nDear Devotees & Residents,\nYou can now search and download your official Ganesh Festival voluntary contribution receipt directly on your phone or computer:\n\n👉 *Click here to download your receipt:*\n${primaryShareUrl}\n\nSimply enter your *Flat Number* (e.g. A-101) or *Name* to get your signed official PDF receipt.\n\n*Ganapati Bappa Morya!* 🌺🪔`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleOpenNewTab = () => {
    window.open(primaryShareUrl, '_blank');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-lg w-full overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#7F1D1D] via-[#991B1B] to-[#7F1D1D] text-white p-4 sm:px-6 sm:py-5 flex items-center justify-between border-b-2 border-amber-400">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-amber-400 text-[#991B1B] flex items-center justify-center font-bold text-lg shadow-inner">
              🪔
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-serif font-black tracking-wide leading-tight">
                Devotee Receipt Download Link
              </h3>
              <p className="text-[11px] text-amber-200/90 font-medium">
                Short, Meaningful & Public Self-Service Receipt Portal
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 space-y-4 text-stone-800">
          {/* Privacy & Security Guarantee Card */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-emerald-950 block">
                Strict Public Privacy Isolation
              </span>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Residents <strong>only</strong> see the receipt search and download screen.
                All expenses, budgets, vendor records, and committee controls are completely hidden.
              </p>
            </div>
          </div>

          {/* Status Message Notification */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-amber-50 text-amber-900 border border-amber-300'
                  : 'bg-red-50 text-red-900 border border-red-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span className="font-medium">{statusMessage.text}</span>
            </div>
          )}

          {/* PRIMARY SHORT MEANINGFUL URL CARD */}
          <div className="bg-amber-50/60 border-2 border-amber-300/80 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Short Meaningful Link (For Residents & WhatsApp)
              </span>
              <span className="bg-amber-200 text-amber-900 font-bold text-[10px] px-2 py-0.5 rounded-full">
                Easy to Read & Type
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-white border border-amber-300 rounded-lg p-1.5 shadow-xs">
              <Globe className="w-4 h-4 text-amber-700 shrink-0 ml-1.5" />
              <input
                type="text"
                readOnly
                value={primaryShareUrl}
                className="flex-1 bg-transparent text-xs sm:text-sm font-mono font-bold text-[#991B1B] outline-none select-all px-1"
                onClick={e => (e.target as HTMLInputElement).select()}
              />
              <button
                type="button"
                onClick={handleCopyShortLink}
                className="bg-[#991B1B] hover:bg-[#7F1D1D] text-white text-xs font-bold px-3 py-1.5 rounded-md inline-flex items-center gap-1 transition-colors cursor-pointer shrink-0 shadow-xs"
                title="Copy short link"
              >
                {copiedType === 'short' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedType === 'short' ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-0.5">
              <span className="text-stone-500">
                Directly opens the devotee receipt portal
              </span>
              <button
                type="button"
                onClick={() => setIsEditingCustom(!isEditingCustom)}
                className="text-stone-700 hover:text-[#991B1B] font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>{isEditingCustom ? 'Close Customizer' : 'Customize Alias'}</span>
              </button>
            </div>

            {/* Expandable Customizer / Shortener Drawer */}
            {isEditingCustom && (
              <div className="pt-2 border-t border-amber-200/80 space-y-2.5 bg-white/70 p-3 rounded-lg border border-amber-200">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-700 block">
                    Set Custom Short Link (TinyURL / Bitly / Custom Domain):
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={customInput}
                      onChange={e => setCustomInput(e.target.value)}
                      placeholder="e.g. https://tinyurl.com/eldorado-receipts-2026"
                      className="flex-1 bg-white border border-stone-300 rounded px-2.5 py-1.5 text-xs font-mono text-stone-800 outline-none focus:border-[#991B1B]"
                    />
                    <button
                      type="button"
                      onClick={handleSaveCustomLink}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3 py-1.5 rounded inline-flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Save className="w-3 h-3" />
                      <span>Save</span>
                    </button>
                  </div>
                </div>

                {/* Auto-generate with custom alias */}
                <div className="space-y-1 pt-1 border-t border-stone-200">
                  <label className="text-[11px] font-bold text-stone-700 block">
                    Or generate a new TinyURL alias automatically:
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-stone-500 font-mono">tinyurl.com/</span>
                    <input
                      type="text"
                      value={aliasInput}
                      onChange={e => setAliasInput(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                      placeholder="e.g. eldorado-ganesh"
                      className="flex-1 bg-white border border-stone-300 rounded px-2 py-1.5 text-xs font-mono text-stone-800 outline-none focus:border-[#991B1B]"
                    />
                    <button
                      type="button"
                      disabled={isGenerating}
                      onClick={handleGenerateNewShortLink}
                      className="bg-[#991B1B] hover:bg-[#7F1D1D] text-white text-xs font-bold px-3 py-1.5 rounded inline-flex items-center gap-1 cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
                      <span>{isGenerating ? 'Creating...' : 'Generate'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Sharing Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold uppercase tracking-wider py-2.5 px-3 rounded-xl inline-flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Share on WhatsApp Group</span>
            </button>

            <button
              type="button"
              onClick={handleOpenNewTab}
              className="w-full bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold uppercase tracking-wider py-2.5 px-3 rounded-xl inline-flex items-center justify-center gap-2 transition-colors cursor-pointer border border-stone-300"
            >
              <ExternalLink className="w-4 h-4 text-stone-600" />
              <span>Open Link in New Tab</span>
            </button>
          </div>

          {/* QR Code Section */}
          <div className="pt-2 border-t border-stone-100 flex flex-col sm:flex-row items-center gap-4 bg-stone-50/60 p-4 rounded-xl border border-stone-200">
            <div
              ref={qrContainerRef}
              className="p-2 bg-white rounded-lg border border-stone-200 shadow-xs shrink-0 flex items-center justify-center"
              style={{ minWidth: '140px', minHeight: '140px' }}
            />
            <div className="text-xs space-y-1.5 text-center sm:text-left flex-1">
              <div className="font-bold text-stone-900 flex items-center justify-center sm:justify-start gap-1">
                <QrCode className="w-4 h-4 text-[#991B1B]" />
                <span>Devotee QR Code (Scannable)</span>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                Noticeboard and elevator ready. Because the short link is used, this QR code has high error tolerance and scans instantly with any smartphone camera.
              </p>
              {onOpenPortalInApp && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenPortalInApp();
                    }}
                    className="text-xs text-[#991B1B] hover:text-[#7F1D1D] font-bold underline cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>Test Portal View right now</span>
                    <span>→</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Clean Direct App URL reference (Clean /receipts path) */}
          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
            <span className="font-medium">Direct App Path:</span>
            <div className="flex items-center gap-2">
              <code className="bg-stone-100 px-2 py-0.5 rounded text-[10px] text-stone-700">
                {cleanDirectUrl}
              </code>
              <button
                type="button"
                onClick={handleCopyDirectLink}
                className="text-[#991B1B] hover:underline font-bold cursor-pointer"
              >
                {copiedType === 'direct' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
