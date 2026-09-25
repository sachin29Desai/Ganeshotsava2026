import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  User,
  Home,
  Phone,
  Mail,
  QrCode
} from 'lucide-react';
import { AppSettings, UserProfile } from '../types';
import { cleanOrgName } from '../utils/helpers';

interface RequestDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile?: UserProfile | null;
  settings: AppSettings;
  onRequestSubmitted?: () => void;
}

export const RequestDetailsModal: React.FC<RequestDetailsModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  settings
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const groupInviteUrl = 'https://chat.whatsapp.com/EAkzlpnwF0G9Xc8nenA8JY?mode=gi_t';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(groupInviteUrl)}`;

  const handleCopyDetails = () => {
    const detailsText = `Name: ${userProfile?.name || 'N/A'}\nFlat No: ${userProfile?.flat || 'N/A'}\nMobile: ${userProfile?.mobile || 'N/A'}\nEmail ID: ${userProfile?.email || 'N/A'}`;
    navigator.clipboard.writeText(detailsText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-amber-400 max-w-2xl w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#7F1D1D] via-[#991B1B] to-[#7F1D1D] text-white p-5 text-center relative border-b-2 border-amber-400">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3.5 top-3.5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 rounded-full bg-amber-400 text-[#991B1B] flex items-center justify-center mx-auto mb-2.5 shadow-md border border-amber-300">
            <QrCode className="w-6 h-6 text-[#991B1B]" />
          </div>

          <h3 className="text-lg sm:text-xl font-serif font-black tracking-wide">
            Contact Us &amp; Join Group
          </h3>
          <p className="text-xs text-amber-200/90 font-medium mt-1">
            {cleanOrgName(settings.org, 'Eldorado Residents Association')} • Ganeshotsava 2026
          </p>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Informational Banner */}
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/85 text-xs text-amber-950 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-900">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Official WhatsApp Devotee Group</span>
            </div>
            <p className="text-[12px] leading-relaxed text-amber-800">
              Please join the private community chat group to verify your resident profile and request view access for itemized receipts, vendor proofs, or audit logs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
            {/* Left Column: User details */}
            <div className="bg-amber-50/40 border border-amber-200/70 rounded-xl p-4.5 space-y-3 shadow-2xs">
              <h4 className="font-serif font-black text-xs uppercase tracking-wider text-amber-900 flex items-center gap-1.5 border-b border-amber-200 pb-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Verified Devotee Profile</span>
              </h4>

              <div className="space-y-2.5 text-xs text-stone-800">
                <div className="flex items-start gap-2.5">
                  <User className="w-4 h-4 text-[#991B1B] shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-[10px] text-stone-500 font-bold uppercase tracking-wider">Full Name</span>
                    <span className="font-semibold text-stone-900">{userProfile?.name || 'Not Registered'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Home className="w-4 h-4 text-[#991B1B] shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-[10px] text-stone-500 font-bold uppercase tracking-wider">Flat / Unit Number</span>
                    <span className="font-semibold text-stone-900 font-mono">{userProfile?.flat || 'N/A'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-[#991B1B] shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-[10px] text-stone-500 font-bold uppercase tracking-wider">Mobile Number</span>
                    <span className="font-semibold text-stone-900 font-mono">{userProfile?.mobile || 'N/A'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-[#991B1B] shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="block text-[10px] text-stone-500 font-bold uppercase tracking-wider">Email Address</span>
                    <span className="font-semibold text-stone-900 break-all">{userProfile?.email || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-amber-200/50">
                <button
                  type="button"
                  onClick={handleCopyDetails}
                  className="w-full py-2.5 px-3 rounded-lg border border-amber-300 hover:border-[#991B1B] hover:bg-amber-100/50 text-stone-800 font-bold text-[11px] uppercase tracking-wider transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 animate-in zoom-in" />
                      <span className="text-emerald-700">Profile Details Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-amber-700" />
                      <span>Copy Profile Details</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Column: WhatsApp QR */}
            <div className="flex flex-col items-center justify-center p-4 bg-white border border-stone-200 rounded-xl space-y-4 shadow-2xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 text-center">
                Scan QR or Click to Join
              </h4>

              {/* QR Image Link */}
              <a
                href={groupInviteUrl}
                target="_blank"
                rel="noreferrer"
                className="block p-2 border-2 border-dashed border-emerald-500 bg-emerald-50/20 rounded-xl hover:scale-[1.02] transition-transform duration-200 cursor-pointer shadow-2xs"
                title="Click to Open WhatsApp Invite Link directly"
              >
                <img
                  src={qrCodeUrl}
                  alt="WhatsApp Group QR Code"
                  className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-lg"
                  loading="lazy"
                />
              </a>

              <p className="text-[11px] text-stone-500 text-center leading-relaxed max-w-[240px]">
                Open this link to join my WhatsApp Group
              </p>

              {/* Action Button */}
              <a
                href={groupInviteUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#20BA5A] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Join WhatsApp Group</span>
                <ExternalLink className="w-4 h-4 text-white" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-1 text-stone-400 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Admin Review &bull; Eldorado Kannadigara Balaga</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-600 hover:text-stone-900 font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
