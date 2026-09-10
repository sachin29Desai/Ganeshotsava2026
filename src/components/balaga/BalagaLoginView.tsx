import React, { useState } from 'react';
import { Lock, ArrowLeft, ShieldCheck, CheckCircle2, AlertCircle, Sparkles, KeyRound } from 'lucide-react';
import { auth, googleProvider, signInWithPopup, type User } from '../../lib/firebase';
import { AppSettings } from '../../types';

interface BalagaLoginViewProps {
  settings: AppSettings;
  currentUser: User | null;
  allowedEmails: string[];
  onUserChange: (user: User | null) => void;
  onNavigateHome: () => void;
  onAdminPasscodeSuccess: () => void;
  isDark?: boolean;
}

export const BalagaLoginView: React.FC<BalagaLoginViewProps> = ({
  settings,
  currentUser,
  allowedEmails,
  onUserChange,
  onNavigateHome,
  onAdminPasscodeSuccess,
  isDark = false
}) => {
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdminPasscode, setShowAdminPasscode] = useState(false);
  const [adminPasscode, setAdminPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoadingGoogle(true);
    setError(null);
    try {
      if (auth) {
        const result = await signInWithPopup(auth, googleProvider);
        onUserChange(result.user);
        onNavigateHome();
      } else {
        throw new Error('Firebase Auth unavailable');
      }
    } catch (err: unknown) {
      console.warn('Google sign in popup error:', err);
      setError('Google Sign-in popup was blocked or closed. Please allow popups and complete sign in through your Gmail account.');
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleAdminPasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasscode.trim() === settings.adminHash) {
      onAdminPasscodeSuccess();
      onNavigateHome();
    } else {
      setPasscodeError('Invalid Admin Passcode. Only authorized committee members can enter via passcode.');
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col justify-between font-sans selection:bg-red-600 selection:text-yellow-200 ${
        isDark ? 'bg-stone-950 text-stone-100' : 'bg-[#FFFDF7] text-stone-900'
      }`}
    >
      {/* Karnataka Flag Dual Color Stripe */}
      <div className="w-full flex flex-col">
        <div className="h-2.5 bg-[#DC2626] w-full" />
        <div className="h-2.5 bg-[#FBBF24] w-full" />
      </div>

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div
          className={`w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-xl border-2 transition-all ${
            isDark
              ? 'bg-stone-900/90 border-stone-800 text-stone-100'
              : 'bg-white border-stone-200 text-stone-900'
          }`}
        >
          {/* Back button */}
          <button
            onClick={onNavigateHome}
            className={`text-xs font-semibold inline-flex items-center gap-1.5 mb-6 transition-colors cursor-pointer ${
              isDark ? 'text-stone-400 hover:text-white' : 'text-stone-500 hover:text-red-700'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Balaga Home</span>
          </button>

          {/* Logo & Branding */}
          <div className="text-center space-y-2 mb-8">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-red-600 via-red-600 to-amber-500 p-2.5 flex items-center justify-center shadow-md border-2 border-yellow-400">
              <img
                src="/lord_ganesha.svg"
                alt="Lord Sri Ganesha"
                className="w-full h-full object-contain filter invert drop-shadow-sm"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="inline-block bg-yellow-400/20 text-red-600 dark:text-yellow-400 border border-yellow-400/50 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider mt-1">
              ಕನ್ನಡಿಗರ ಬಳಗ • Resident Portal
            </div>

            <h1 className="text-2xl font-serif font-black tracking-tight text-red-700 dark:text-red-500">
              Sign in to Kannadigara Balaga
            </h1>
            <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
              Eldorado Kannadigara Balaga • Brigade El Dorado
            </p>
          </div>

          {/* Current User Logged In Notice */}
          {currentUser && (
            <div
              className={`p-4 rounded-2xl border mb-6 flex items-center justify-between gap-3 text-xs ${
                isDark
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold block">Currently Signed In:</span>
                  <span className="truncate block max-w-[200px]">{currentUser.email}</span>
                </div>
              </div>
              <button
                onClick={() => onUserChange(null)}
                className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
              >
                Sign out
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div
              className={`p-3.5 rounded-xl border mb-6 text-xs flex items-start gap-2 ${
                isDark
                  ? 'bg-red-950/50 border-red-800 text-red-300'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Primary Action: Continue with Google */}
          <div className="space-y-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={loadingGoogle}
              className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-stone-50 text-stone-800 font-bold text-sm border-2 border-stone-300 hover:border-red-600 transition-all cursor-pointer shadow-xs inline-flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
              <span>{loadingGoogle ? 'Connecting with Gmail...' : 'Sign in with Gmail'}</span>
            </button>

            <p className={`text-[11px] text-center leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
              Authentication is exclusively through your Gmail account to verify community residency status and volunteer credentials.
            </p>

            {/* Committee Admin Passcode Option */}
            <div className="pt-4 border-t border-stone-200 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setShowAdminPasscode(!showAdminPasscode)}
                className="w-full text-center text-xs text-amber-700 dark:text-amber-400 hover:underline font-semibold cursor-pointer inline-flex items-center justify-center gap-1"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{showAdminPasscode ? 'Hide Admin Passcode' : 'Committee Admin Passcode'}</span>
              </button>

              {showAdminPasscode && (
                <form onSubmit={handleAdminPasscodeSubmit} className="mt-3 space-y-2 animate-in fade-in">
                  <input
                    type="password"
                    placeholder="Enter Committee Admin Passcode..."
                    value={adminPasscode}
                    onChange={(e) => setAdminPasscode(e.target.value)}
                    className={`w-full text-xs px-3.5 py-2 rounded-xl border outline-none ${
                      isDark
                        ? 'bg-stone-800 border-stone-700 text-white focus:border-yellow-400'
                        : 'bg-stone-50 border-stone-200 text-stone-900 focus:bg-white focus:border-red-600'
                    }`}
                  />
                  {passcodeError && (
                    <p className="text-[11px] text-red-600 font-semibold">{passcodeError}</p>
                  )}
                  <button
                    type="submit"
                    className="w-full py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-stone-950 font-bold text-xs transition-colors cursor-pointer shadow-xs"
                  >
                    Authorize as Committee Admin
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer disclaimer */}
      <footer className="text-center py-4 text-[11px] text-stone-500">
        <span>© 2024–2026 Eldorado Kannadigara Balaga • DPDP Act 2023 Compliant</span>
      </footer>
    </div>
  );
};
