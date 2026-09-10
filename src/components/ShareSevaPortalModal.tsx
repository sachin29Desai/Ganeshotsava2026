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
  Globe,
  Edit3,
  Save,
  AlertCircle
} from 'lucide-react';
import { AppSettings } from '../types';

interface ShareSevaPortalModalProps {
  open: boolean;
  settings: AppSettings;
  onClose: () => void;
  onOpenPortalInApp?: () => void;
  onUpdateSettings?: (settings: AppSettings) => void;
}

export const ShareSevaPortalModal: React.FC<ShareSevaPortalModalProps> = ({
  open,
  settings,
  onClose,
  onOpenPortalInApp,
  onUpdateSettings
}) => {
  const qrContainerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  // Exact website direct path: website/ganeshotsavasevas (matching user request)
  const cleanDirectUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/ganeshotsavasevas`
    : '/ganeshotsavasevas';

  // Active share URL: uses clean direct website/ganeshotsavasevas (never tinyurl)
  const hasTinyUrl = settings.customSevaPortalUrl && (
    settings.customSevaPortalUrl.includes('tinyurl.com') ||
    settings.customSevaPortalUrl.includes('bit.ly') ||
    settings.customSevaPortalUrl.includes('shorturl')
  );
  const primaryShareUrl = (!hasTinyUrl && settings.customSevaPortalUrl) || cleanDirectUrl;

  // Custom link editor state
  const [isEditingCustom, setIsEditingCustom] = useState(false);
  const [customInput, setCustomInput] = useState(primaryShareUrl);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setCustomInput(primaryShareUrl);
  }, [primaryShareUrl]);

  useEffect(() => {
    if (!open) return;

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

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(primaryShareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy link', err);
    }
  };

  const handleOpenNewTab = () => {
    window.open(primaryShareUrl, '_blank');
  };

  const handleSaveCustomLink = (urlToSave: string) => {
    const trimmed = urlToSave.trim();
    if (onUpdateSettings) {
      onUpdateSettings({
        ...settings,
        customSevaPortalUrl: trimmed || ''
      });
      setStatusMessage({ type: 'success', text: 'Seva portal link updated successfully!' });
      setIsEditingCustom(false);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const shareText = `🙏 *Sri Ganeshotsava 2026 - Devotional Seva Bookings*\n*${settings.org || 'Brigade El Dorado Residents'}*\n\nDear Devotees & Residents,\nDevotional Seva bookings are now open for Sri Ganeshotsava 2026! You can browse sevas, book offerings, and view your token status online:\n\n👉 *Click here to book your Seva:*\n${primaryShareUrl}\n\nNo login required. May Lord Sri Ganesha bless you and your family! 🌺`;
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-lg w-full p-6 space-y-5 relative my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1.5 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
          title="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3.5 pr-8 border-b border-stone-100 pb-4">
          <div className="w-11 h-11 rounded-xl bg-amber-100 text-[#991B1B] flex items-center justify-center shrink-0 shadow-xs border border-amber-200">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#991B1B] bg-red-50 px-2 py-0.5 rounded border border-red-200 inline-block">
              Resident Devotee Access
            </span>
            <h3 className="text-xl font-serif font-bold text-stone-900 mt-1">
              Devotee Seva Booking Portal
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Direct website portal for Brigade El Dorado residents to browse and book sevas without committee login.
            </p>
          </div>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Primary Share Link Card */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50/90 to-orange-50/60 border border-amber-300 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-amber-700" />
              <span>Direct Website Portal Link</span>
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded font-bold">
              Direct Route
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white border border-stone-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-[#991B1B] truncate shadow-inner">
              {primaryShareUrl}
            </div>
            <button
              onClick={handleCopyLink}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0 ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#991B1B] text-white hover:bg-[#7F1D1D]'
              }`}
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={handleOpenNewTab}
              className="text-xs text-[#991B1B] hover:text-[#7F1D1D] font-bold inline-flex items-center gap-1.5 cursor-pointer"
              title="Open portal in new browser tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in New Tab</span>
            </button>

            {onOpenPortalInApp && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPortalInApp();
                }}
                className="text-xs text-stone-700 hover:text-stone-900 font-bold inline-flex items-center gap-1.5 cursor-pointer"
                title="Switch to portal in this screen"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Open in App</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsEditingCustom(!isEditingCustom)}
              className="text-xs text-stone-500 hover:text-stone-800 font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              <span>{isEditingCustom ? 'Close Customizer' : 'Custom URL'}</span>
            </button>
          </div>

          {/* Expandable Custom URL Editor */}
          {isEditingCustom && (
            <div className="pt-2 border-t border-amber-200/80 space-y-2 bg-white/80 p-3 rounded-lg border border-amber-200">
              <label className="text-[11px] font-bold text-stone-700 block">
                Custom Domain or Subdomain URL:
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={customInput}
                  onChange={e => setCustomInput(e.target.value)}
                  placeholder={cleanDirectUrl}
                  className="flex-1 bg-white border border-stone-300 rounded px-2.5 py-1.5 text-xs font-mono text-stone-800 outline-none focus:border-[#991B1B]"
                />
                <button
                  type="button"
                  onClick={() => handleSaveCustomLink(customInput)}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3 py-1.5 rounded inline-flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Save className="w-3 h-3" />
                  <span>Save</span>
                </button>
                {settings.customSevaPortalUrl && (
                  <button
                    type="button"
                    onClick={() => handleSaveCustomLink('')}
                    className="bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs px-2.5 py-1.5 rounded cursor-pointer"
                    title="Reset to default website/ganeshotsavasevas"
                  >
                    Reset
                  </button>
                )}
              </div>
              <p className="text-[10px] text-stone-500">
                Default: <code className="font-mono text-stone-700">{cleanDirectUrl}</code>
              </p>
            </div>
          )}

          {/* WhatsApp One-Click Share */}
          <a
            href={whatsappShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs inline-flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Share on WhatsApp Groups</span>
          </a>
        </div>

        {/* QR Code & Notice Board Card */}
        <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex flex-col sm:flex-row items-center gap-4">
          <div className="bg-white p-2.5 rounded-xl border border-stone-200 shadow-xs shrink-0">
            <div ref={qrContainerRef} className="w-[140px] h-[140px] flex items-center justify-center bg-stone-50 text-stone-400 text-xs">
              <QrCode className="w-8 h-8 text-stone-300" />
            </div>
          </div>
          <div className="space-y-2 text-center sm:text-left text-xs">
            <div className="font-bold text-stone-900 flex items-center justify-center sm:justify-start gap-1.5">
              <QrCode className="w-4 h-4 text-[#991B1B]" />
              <span>Devotee Notice Board QR Code</span>
            </div>
            <p className="text-stone-600 text-[11px] leading-relaxed">
              Print or project this QR code in the lobby or celebration ground so devotees can scan and book sevas instantly on their phones at <span className="font-mono font-bold text-[#991B1B]">{primaryShareUrl}</span>.
            </p>
            <div className="pt-1 flex items-center justify-center sm:justify-start gap-1.5 text-emerald-800 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Isolated Devotee Portal &bull; No admin login required</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
