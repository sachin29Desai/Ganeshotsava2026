import React, { useState } from 'react';
import { Lock, ShieldAlert, ArrowLeft, KeyRound, Sparkles, FileText, Mail, CheckCircle2 } from 'lucide-react';
import { AppSettings } from '../types';
import { auth, googleProvider, signInWithPopup, type User } from '../lib/firebase';

interface AdminGateForBalagaProps {
  settings: AppSettings;
  onSuccess: () => void;
  onBackToGaneshotsava: () => void;
  onGoToReceipts?: () => void;
}

export const AdminGateForBalaga: React.FC<AdminGateForBalagaProps> = ({
  settings,
  onSuccess,
  onBackToGaneshotsava,
  onGoToReceipts
}) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  // Check allowed emails
  const getAllowedEmails = (): string[] => {
    try {
      const saved = localStorage.getItem('ekb_allowed_emails');
      if (saved) return JSON.parse(saved);
    } catch {}
    return ['desaisachin95@gmail.com', 'kannadigara.balaga.eldorado@gmail.com'];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim() === settings.adminHash) {
      onSuccess();
    } else {
      setError('Incorrect Admin Passcode. Only authorized committee admins may access this page.');
    }
  };

  const handleGoogleSignIn = async () => {
    setLoadingGoogle(true);
    setError('');
    try {
      if (auth) {
        const res = await signInWithPopup(auth, googleProvider);
        const email = res.user.email?.toLowerCase();
        const allowed = getAllowedEmails().map((e) => e.toLowerCase());
        if (email && (allowed.includes(email) || email === 'desaisachin95@gmail.com')) {
          onSuccess();
        } else {
          setError(
            `Access Denied: ${email} is not in the Admin approved list. Contact the Balaga President.`
          );
        }
      } else {
        throw new Error('Google Auth not initialized');
      }
    } catch (err: unknown) {
      console.warn('Google sign in popup closed or error:', err);
      setError('Google Sign-in closed or unavailable in this window. Please use the Admin Passcode.');
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF7] text-[#1C1917] flex flex-col justify-between font-sans selection:bg-red-600 selection:text-yellow-200">
      {/* Karnataka Flag Dual Color Top Strip */}
      <div className="w-full flex flex-col no-print">
        <div className="h-2 bg-[#DC2626] w-full" />
        <div className="h-2 bg-[#FBBF24] w-full" />
      </div>

      {/* Header */}
      <header className="border-b-2 border-red-600 px-6 py-4 bg-white shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-amber-500 text-yellow-300 flex items-center justify-center p-1 shadow-xs border-2 border-yellow-400">
              <img
                src={settings.logo || '/lord_ganesha.svg'}
                alt="Lord Sri Ganesha"
                className="w-full h-full object-contain filter invert"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-serif font-black tracking-wide text-red-900 leading-tight">
                ಎಲ್ ಡೊರಾಡೊ ಕನ್ನಡಿಗರ ಬಳಗ
              </h1>
              <p className="text-[11px] text-amber-800 font-semibold">
                Eldorado Kannadigara Balaga Celebrations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onBackToGaneshotsava}
              className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer border border-stone-300"
              title="Return to Ganeshotsava 2026 Festival Portal"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Ganeshotsava 2026</span>
            </button>
            {onGoToReceipts && (
              <button
                onClick={onGoToReceipts}
                className="bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                title="Open Public Receipts Portal"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Devotee Receipts</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Lock Gate Card */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border-2 border-red-600 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-amber-500 text-yellow-300 mx-auto flex items-center justify-center shadow-md border-2 border-yellow-400">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-red-100 text-red-900 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-red-300">
              <Sparkles className="w-3 h-3 text-red-600" />
              <span>Admin &amp; Committee Gate</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 tracking-tight">
              ಎಲ್ ಡೊರಾಡೊ ಕನ್ನಡಿಗರ ಬಳಗ
            </h2>
            <p className="text-xs text-stone-600 leading-relaxed max-w-sm mx-auto">
              This page (<code className="text-red-700 font-mono text-[11px]">/homepageindevelop</code>)
              is reserved for Kannadigara Balaga committee administrators. Sign in with an approved Gmail or enter the Admin passcode.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs text-left flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign-in for Admins */}
          <div className="space-y-3">
            <button
              onClick={handleGoogleSignIn}
              disabled={loadingGoogle}
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

            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-stone-200 w-full" />
              <span className="bg-white px-2 text-[10px] text-stone-400 uppercase tracking-wider font-semibold">
                Or enter committee passcode
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
                  <input
                    type="password"
                    value={passcode}
                    onChange={(e) => {
                      setPasscode(e.target.value);
                      setError('');
                    }}
                    placeholder="Admin passcode"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:border-red-600 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-yellow-300 font-bold text-sm transition-all shadow-xs active:scale-98 cursor-pointer border border-yellow-400"
              >
                Unlock Balaga Page
              </button>
            </form>
          </div>

          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <button
              onClick={onBackToGaneshotsava}
              className="hover:text-stone-800 inline-flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Ganeshotsava 2026</span>
            </button>
            <span className="text-[11px] text-stone-400">Route: /homepageindevelop</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 py-3 text-center text-xs text-stone-500 bg-white">
        Eldorado • Eldorado Kannadigara Balaga Committee • ಸಿರಿಗನ್ನಡಂ ಗೆಲ್ಗೆ!
      </footer>
    </div>
  );
};
