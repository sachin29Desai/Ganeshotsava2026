import React, { useState } from 'react';
import {
  X,
  PhoneCall,
  Mail,
  MessageSquare,
  ShieldCheck,
  Send,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  HelpCircle,
  FileText,
  Users
} from 'lucide-react';
import { AppSettings, UserProfile } from '../types';
import { cloudRequestDetailedAccess } from '../lib/firebase';
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
  settings,
  onRequestSubmitted
}) => {
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const committeeEmail = 'kannadigara.balaga.eldorado@gmail.com';
  const adminEmail = 'desaisachin95@gmail.com';
  const helplinePhone = settings.upi ? '+91 98860 00000' : '+91 98450 00000';

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.email) {
      setError('Please ensure you are signed in with your email address.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await cloudRequestDetailedAccess(
        userProfile.email,
        notes.trim() || 'Devotee requested view access for complete financial details & bills.'
      );
      setSuccess(true);
      if (onRequestSubmitted) {
        onRequestSubmitted();
      }
    } catch (err: any) {
      console.error('Failed to submit access request:', err);
      setError('Could not submit request. Please try contacting the committee via WhatsApp or Email directly.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-amber-400 max-w-xl w-full overflow-hidden flex flex-col">
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
            <PhoneCall className="w-6 h-6 text-[#991B1B]" />
          </div>

          <h3 className="text-lg sm:text-xl font-serif font-black tracking-wide">
            Contact Us &amp; Request Detailed Data
          </h3>
          <p className="text-xs text-amber-200/90 font-medium mt-1">
            {cleanOrgName(settings.org, 'Eldorado Residents Association')} • Ganeshotsava 2026
          </p>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Informational banner */}
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 text-xs text-amber-950 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-900">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>General Public &amp; Devotee View</span>
            </div>
            <p className="text-[12px] leading-relaxed text-amber-800">
              You are currently viewing high-level summary statements and expenditures. To access itemized voluntary contribution receipts, vendor bill proofs, or audit ledgers, please submit a request or contact the festival committee below.
            </p>
          </div>

          {/* Quick Contact Options */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Direct Committee Contact
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              {/* 1. Email Committee */}
              <a
                href={`mailto:${committeeEmail}?subject=Ganeshotsava%202026%20Detailed%20Access%20Request&body=Hi%20Committee,%20I%20am%20${encodeURIComponent(userProfile?.name || '')}%20from%20Flat%20${encodeURIComponent(userProfile?.flat || '')}.%20Kindly%20provide%20me%20view%20access%20to%20complete%20festival%20financial%20data.`}
                className="p-3 rounded-xl border border-stone-200 hover:border-[#991B1B] hover:bg-stone-50 transition-colors flex items-center gap-2.5 text-stone-800 group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-red-100 text-[#991B1B] flex items-center justify-center shrink-0 group-hover:bg-[#991B1B] group-hover:text-white transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold block truncate">Email Committee</span>
                  <span className="text-[10px] text-stone-500 truncate block font-mono">
                    {committeeEmail}
                  </span>
                </div>
              </a>

              {/* 2. WhatsApp Direct Chat with Helpline Phone */}
              <a
                href={`https://wa.me/${helplinePhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                  `Namaste Committee! I am ${userProfile?.name || 'a resident'} (Flat: ${userProfile?.flat || 'N/A'}, Mobile: ${userProfile?.mobile || 'N/A'}). I would like to request view access for complete Sri Ganeshotsava 2026 data and vouchers.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl border border-stone-200 hover:border-emerald-600 hover:bg-emerald-50/50 transition-colors flex items-center gap-2.5 text-stone-800 group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold block truncate text-emerald-900">WhatsApp Chat</span>
                  <span className="text-[10px] text-stone-500 truncate block font-mono">
                    {helplinePhone}
                  </span>
                </div>
              </a>

              {/* 3. WhatsApp Private Chat Group */}
              <a
                href="https://chat.whatsapp.com/Ganeshotsava2026PrivateGroup"
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl border border-stone-200 hover:border-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-2.5 text-stone-800 group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Users className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold block truncate text-blue-900 font-bold">WhatsApp Group</span>
                  <span className="text-[10px] text-stone-500 truncate block">
                    Join Private Chat
                  </span>
                </div>
              </a>
            </div>
          </div>

          <div className="border-t border-stone-200 pt-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center justify-between">
              <span>Submit In-App Request to Admin</span>
              {userProfile && (
                <span className="text-[10px] font-normal text-stone-500">
                  For: {userProfile.name} ({userProfile.flat})
                </span>
              )}
            </h4>

            {success ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 space-y-2 text-center animate-in fade-in">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h5 className="font-bold text-sm">Request Submitted Successfully!</h5>
                <p className="text-xs text-emerald-800">
                  The festival administrator (<span className="font-mono">{adminEmail}</span>) has been notified. Once approved, you will have complete view access upon refreshing.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitRequest} className="space-y-3">
                {error && (
                  <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                    Purpose / Notes for Committee (Optional):
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="e.g. Resident reviewing contribution receipts, committee audit, or sponsorship reconciliation..."
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-3 text-xs text-stone-900 outline-none focus:bg-white focus:border-[#991B1B] focus:ring-1 focus:ring-[#991B1B]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#991B1B] hover:bg-[#7F1D1D] text-white font-bold text-xs uppercase tracking-wider py-3 rounded-xl shadow-md inline-flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5 text-amber-300" />
                  <span>{submitting ? 'Submitting Request...' : 'Send Request to Global Admin'}</span>
                </button>
              </form>
            )}
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
