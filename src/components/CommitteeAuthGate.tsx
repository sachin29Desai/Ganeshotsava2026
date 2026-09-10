import React, { useState } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  FileText,
  ArrowRight,
  ArrowLeft,
  Home,
  Sparkles,
  KeyRound,
  ShieldCheck
} from 'lucide-react';
import { AppSettings, UserRole } from '../types';
import { sha256 } from '../utils/helpers';

interface CommitteeAuthGateProps {
  settings: AppSettings;
  onSuccess: (role: UserRole) => void;
  onGoToReceiptPortal: () => void;
  onGoToSevaPortal?: () => void;
  onBackToHome?: () => void;
  onSaveSettings?: (newSettings: AppSettings) => void;
}

// Known default fallback hashes
const DEFAULT_ADMIN_HASH = '3cc551dd68cb8a0b7720b812b167715dd6f9c0405d26981eeb560f0b7dd8e616'; // 'admin'
const DEFAULT_SPONSOR_HASH = 'a0c7176691b16f74d4449e8163db3bf87eee545d3881e24987e4b0effea0042c'; // 'sponsor2026'
const DEFAULT_VOLUNTEER_HASH = '1916dd5824e8d6a9a0d3904631bf922f9c2c87f25b6bb0a43e177adcc560831b'; // 'volunteer2026'

export const CommitteeAuthGate: React.FC<CommitteeAuthGateProps> = ({
  settings,
  onSuccess,
  onGoToReceiptPortal,
  onGoToSevaPortal,
  onBackToHome
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedPassword = password.trim();
    if (!trimmedPassword) {
      setError('Please enter your password to see details.');
      return;
    }

    setIsSubmitting(true);
    try {
      const testHash = await sha256(trimmedPassword);

      const targetAdminHash = settings.adminHash || DEFAULT_ADMIN_HASH;
      const targetSponsorHash = settings.sponsorHash || DEFAULT_SPONSOR_HASH;
      const targetVolunteerHash = settings.volunteerHash || DEFAULT_VOLUNTEER_HASH;

      // 1. Check Super Admin
      if (testHash === targetAdminHash) {
        sessionStorage.setItem('eg_committee_auth', 'true');
        sessionStorage.setItem('eg_user_role', 'admin');
        onSuccess('admin');
        return;
      }

      // 2. Check Sponsor (View Only - All Data)
      if (testHash === targetSponsorHash) {
        sessionStorage.setItem('eg_committee_auth', 'true');
        sessionStorage.setItem('eg_user_role', 'sponsor');
        onSuccess('sponsor');
        return;
      }

      // 3. Check Volunteer Team (Restricted View - Sponsorship & Stalls hidden)
      if (testHash === targetVolunteerHash) {
        sessionStorage.setItem('eg_committee_auth', 'true');
        sessionStorage.setItem('eg_user_role', 'volunteer');
        onSuccess('volunteer');
        return;
      }

      // If no role matched
      setError('Incorrect password. Please enter a valid access password to see details.');
    } catch (err: any) {
      console.error('Authentication error:', err);
      setError('An unexpected error occurred during verification. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between selection:bg-[#991B1B] selection:text-white font-sans">
      {/* Top Banner */}
      <header className="bg-[#991B1B] text-white border-b-2 border-amber-400 py-3.5 px-4 sm:px-6 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {settings.logo ? (
              <img
                src={settings.logo}
                alt="Logo"
                className="w-9 h-9 object-contain rounded bg-white/10 p-0.5 border border-white/20"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-amber-400 text-[#991B1B] flex items-center justify-center p-0.5 shadow-inner shrink-0 overflow-hidden border border-amber-300">
                <img
                  src="/lord_ganesha.svg"
                  alt="Lord Sri Ganesha"
                  className="w-full h-full object-contain rounded-full"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
            <div>
              <h1 className="text-sm sm:text-base font-serif font-black tracking-wide leading-tight">
                {settings.org || 'Brigade Eldorado Ganeshotsava 2026'}
              </h1>
              <p className="text-[11px] text-amber-200/90 font-medium">
                {settings.location || 'Festival Management Portal'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onGoToSevaPortal && (
              <button
                type="button"
                onClick={onGoToSevaPortal}
                className="bg-white/10 hover:bg-white/20 text-white font-semibold text-xs px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer border border-white/20 shrink-0"
                title="Book Devotional Sevas for Sri Ganeshotsava 2026"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">Devotee Sevas</span>
                <span className="text-[9px] bg-amber-400 text-stone-950 font-bold px-1 rounded">Open</span>
              </button>
            )}

            {onBackToHome && (
              <button
                type="button"
                onClick={onBackToHome}
                className="bg-white/10 hover:bg-white/20 text-white font-semibold text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer border border-white/20 shrink-0"
                title="Return to Community Celebrations Home"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Celebrations Home</span>
              </button>
            )}

            <button
              type="button"
              onClick={onGoToReceiptPortal}
              className="bg-amber-400 hover:bg-amber-300 text-[#7F1D1D] font-bold text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
              title="Open the public receipt portal for devotees"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Devotee Receipts</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Center Login Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-4 sm:my-8">
        <div className="w-full max-w-md space-y-5">
          {/* Authentication Card */}
          <div className="bg-white border border-stone-200 rounded-2xl shadow-xl overflow-hidden">
            {/* Header / Welcoming Banner */}
            <div className="bg-gradient-to-r from-[#7F1D1D] via-[#991B1B] to-[#7F1D1D] text-white p-6 text-center border-b-2 border-amber-400 relative">
              <div className="w-16 h-16 rounded-full bg-amber-400 text-[#991B1B] flex items-center justify-center mx-auto mb-3 shadow-lg ring-4 ring-amber-300/30 overflow-hidden p-1 border-2 border-amber-300">
                <img
                  src="/lord_ganesha.svg"
                  alt="Lord Sri Ganesha"
                  className="w-full h-full object-contain rounded-full"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-black tracking-wide leading-snug">
                Welcome to El Dorado Ganeshotsava 2026
              </h2>
              <p className="text-xs sm:text-sm text-amber-200 font-medium mt-1.5">
                Enter password to see details
              </p>
            </div>

            <div className="p-6 sm:p-7 space-y-4">
              {/* Error Notice */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span className="font-medium">{error}</span>
                </div>
              )}

              {/* Form with single password input */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                    Access Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => {
                        setPassword(e.target.value);
                        if (error) setError(null);
                      }}
                      placeholder="Enter password to see details"
                      autoFocus
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-3.5 pr-10 py-3 text-sm text-stone-900 outline-none focus:bg-white focus:border-[#991B1B] focus:ring-2 focus:ring-[#991B1B]/20 transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer p-1"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#991B1B] hover:bg-[#7F1D1D] active:scale-[0.99] text-white font-bold text-xs sm:text-sm uppercase tracking-wider py-3.5 px-4 rounded-xl shadow-md inline-flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <KeyRound className="w-4 h-4 text-amber-300" />
                  <span>{isSubmitting ? 'Verifying Password...' : 'Enter & View Details'}</span>
                </button>
              </form>

              <div className="pt-2 border-t border-stone-100 flex items-center justify-center gap-2 text-stone-400 text-xs text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span>Secure role-based access verified automatically</span>
              </div>
            </div>
          </div>

          {/* Devotee Redirection Card */}
          <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-4 sm:p-5 text-center space-y-3 shadow-xs">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-950 bg-amber-200/80 px-2.5 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>Devotee &amp; Resident Self-Service</span>
            </div>
            <div>
              <h3 className="text-sm font-serif font-bold text-stone-900">
                Devotee Receipts &amp; Devotional Seva Bookings
              </h3>
              <p className="text-xs text-stone-600 mt-1 max-w-sm mx-auto leading-relaxed">
                Residents do <strong>not</strong> need any committee password. Download your contribution receipts or book devotional sevas directly:
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={onGoToReceiptPortal}
                className="w-full bg-amber-400 hover:bg-amber-300 text-[#7F1D1D] font-bold text-xs py-2.5 px-3 rounded-xl inline-flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4 text-[#991B1B]" />
                <span>Devotee Receipts</span>
              </button>

              {onGoToSevaPortal && (
                <button
                  type="button"
                  onClick={onGoToSevaPortal}
                  className="w-full bg-[#991B1B] hover:bg-[#7F1D1D] text-white font-bold text-xs py-2.5 px-3 rounded-xl inline-flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Book Sevas</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-stone-400 py-4 px-4 border-t border-stone-200/60 bg-white">
        {settings.org || 'Brigade Eldorado Ganeshotsava 2026'} &bull; Ganeshotsava 2026
      </footer>
    </div>
  );
};
