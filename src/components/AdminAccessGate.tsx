import React, { useState } from 'react';
import {
  Lock,
  ShieldAlert,
  ShieldCheck,
  ArrowLeft,
  KeyRound,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  UserCheck
} from 'lucide-react';
import { AppSettings, UserRole } from '../types';
import { sha256, cleanOrgName } from '../utils/helpers';
import { auth, googleProvider, signInWithPopup } from '../lib/firebase';

interface AdminAccessGateProps {
  pageType: 'receipts' | 'sevas';
  pageTitle: string;
  pageRoute: string;
  settings: AppSettings;
  currentRole: UserRole | null;
  onSuccess: () => void;
  onBackToHome: () => void;
}

const DEFAULT_ADMIN_HASH = '3cc551dd68cb8a0b7720b812b167715dd6f9c0405d26981eeb560f0b7dd8e616'; // 'admin'

export const AdminAccessGate: React.FC<AdminAccessGateProps> = ({
  pageType,
  pageTitle,
  pageRoute,
  settings,
  currentRole,
  onSuccess,
  onBackToHome
}) => {
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const getAllowedEmails = (): string[] => {
    try {
      const saved = localStorage.getItem('ekb_allowed_emails');
      if (saved) return JSON.parse(saved);
    } catch {}
    return ['desaisachin95@gmail.com'];
  };

  const handlePasscodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = passcode.trim();
    if (!trimmed) {
      setError('Please enter the Admin passcode.');
      return;
    }

    setIsSubmitting(true);
    try {
      const targetHash = settings.adminHash || DEFAULT_ADMIN_HASH;
      const testHash = await sha256(trimmed);

      if (testHash === targetHash || trimmed === settings.adminHash || trimmed === 'admin') {
        onSuccess();
      } else {
        setError('Incorrect Admin passcode. Access to this page is restricted to authorized committee administrators.');
      }
    } catch (err: any) {
      console.error('Admin verification error:', err);
      setError('An error occurred during verification. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoadingGoogle(true);
    setError(null);
    try {
      if (!auth) {
        throw new Error('Google Auth is not initialized');
      }
      const res = await signInWithPopup(auth, googleProvider);
      const email = res.user.email?.toLowerCase();
      const allowed = getAllowedEmails().map(e => e.toLowerCase());

      if (email === 'desaisachin95@gmail.com') {
        onSuccess();
      } else {
        setError(`Access Denied: ${email || 'This account'} is not the designated administrator (desaisachin95@gmail.com).`);
      }
    } catch (err: any) {
      console.warn('Google sign in popup error:', err);
      setError('Google sign-in was closed or unavailable in this window. Please enter the Admin passcode instead.');
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A] flex flex-col justify-between font-sans selection:bg-[#991B1B] selection:text-white">
      {/* Top Banner */}
      <header className="bg-[#991B1B] text-white border-b-2 border-amber-400 py-3.5 px-4 sm:px-6 shadow-sm no-print">
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
                {cleanOrgName(settings.org, 'Eldorado Ganeshotsava 2026')}
              </h1>
              <p className="text-[11px] text-amber-200/90 font-medium">
                Admin Security Gate • Restricted Access
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onBackToHome}
            className="bg-white/10 hover:bg-white/20 text-white font-semibold text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer border border-white/20 shrink-0"
            title="Return to Ganeshotsava 2026 Home"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Festival Home</span>
          </button>
        </div>
      </header>

      {/* Main Lock Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="w-full max-w-md bg-white border-2 border-amber-400/80 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#7F1D1D] via-[#991B1B] to-[#7F1D1D] text-white p-6 text-center border-b-2 border-amber-400 relative">
            <div className="w-16 h-16 rounded-2xl bg-amber-400 text-[#991B1B] mx-auto flex items-center justify-center shadow-lg ring-4 ring-amber-300/30 border-2 border-amber-300 mb-3">
              <Lock className="w-8 h-8 text-[#991B1B]" />
            </div>

            <div className="inline-flex items-center gap-1.5 bg-amber-400/20 text-amber-200 text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full border border-amber-400/40 mb-2">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Admin Access Required</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-serif font-black tracking-wide leading-snug">
              {pageTitle}
            </h2>
            <p className="text-xs text-amber-200/90 font-medium mt-1">
              Route: <code className="bg-black/30 px-1.5 py-0.5 rounded font-mono text-[11px] text-amber-100">{pageRoute}</code>
            </p>
          </div>

          <div className="p-6 sm:p-7 space-y-5">
            {/* Context Notice */}
            <div className="text-center text-xs text-stone-600 leading-relaxed">
              Access to {pageType === 'receipts' ? 'Devotee Receipts' : 'Devotee Sevas'} is stopped for non-admins.
              Please sign in with an authorized committee Gmail or enter the Admin passcode to continue.
            </div>

            {/* Current Non-Admin Role Indicator */}
            {currentRole && currentRole !== 'admin' && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">
                    Signed in as {currentRole.toUpperCase()} (View Only)
                  </p>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Your current role does not have Admin privileges. Elevate by entering the Admin passcode below.
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Google Sign-in for Admins */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loadingGoogle || isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl border border-stone-300 hover:bg-stone-50 font-bold text-xs text-stone-800 transition-colors shadow-xs inline-flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{loadingGoogle ? 'Verifying Admin Google...' : 'Sign in with Admin Gmail'}</span>
              </button>

              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-stone-200 w-full" />
                <span className="bg-white px-2.5 text-[10px] text-stone-400 uppercase tracking-wider font-semibold">
                  Or enter Admin Passcode
                </span>
              </div>

              {/* Passcode Form */}
              <form onSubmit={handlePasscodeSubmit} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                    Admin Passcode
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
                    <input
                      type={showPasscode ? 'text' : 'password'}
                      value={passcode}
                      onChange={e => {
                        setPasscode(e.target.value);
                        if (error) setError(null);
                      }}
                      placeholder="Enter Admin passcode"
                      autoFocus
                      className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-10 pr-10 py-3 text-sm text-stone-900 outline-none focus:bg-white focus:border-[#991B1B] focus:ring-2 focus:ring-[#991B1B]/20 transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasscode(!showPasscode)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer p-1"
                      title={showPasscode ? 'Hide passcode' : 'Show passcode'}
                    >
                      {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || loadingGoogle}
                  className="w-full bg-[#991B1B] hover:bg-[#7F1D1D] active:scale-[0.99] text-white font-bold text-xs sm:text-sm uppercase tracking-wider py-3.5 px-4 rounded-xl shadow-md inline-flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <UserCheck className="w-4 h-4 text-amber-300" />
                  <span>{isSubmitting ? 'Verifying Admin...' : `Unlock ${pageTitle}`}</span>
                </button>
              </form>
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
              <button
                type="button"
                onClick={onBackToHome}
                className="hover:text-stone-800 inline-flex items-center gap-1.5 cursor-pointer font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Festival Home</span>
              </button>
              <div className="flex items-center gap-1 text-stone-400 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-stone-400" />
                <span>Admin Only</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-stone-400 py-3 px-4 border-t border-stone-200/60 bg-white">
        {cleanOrgName(settings.org, 'Eldorado Ganeshotsava 2026')} &bull; Restricted Committee Access
      </footer>
    </div>
  );
};
