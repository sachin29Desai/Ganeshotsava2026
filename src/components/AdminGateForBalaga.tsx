import React, { useState } from 'react';
import { Lock, ShieldAlert, ArrowLeft, KeyRound, Sparkles, FileText } from 'lucide-react';
import { AppSettings } from '../types';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim() === settings.adminHash) {
      onSuccess();
    } else {
      setError('Incorrect Admin Passcode. Only authorized committee admins may access this page.');
    }
  };

  return (
    <div className="min-h-screen bg-[#1C1917] text-white flex flex-col justify-between font-sans selection:bg-amber-400 selection:text-stone-950">
      {/* Header */}
      <header className="border-b border-stone-800 px-6 py-4 bg-stone-900/50 backdrop-blur-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-400 text-[#991B1B] flex items-center justify-center p-0.5 shadow-inner shrink-0 overflow-hidden border border-amber-300">
              <img
                src={settings.logo || '/lord_ganesha.svg'}
                alt="Lord Sri Ganesha"
                className="w-full h-full object-contain rounded-full"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-serif font-black tracking-wide leading-tight">
                {settings.org || 'Brigade Eldorado Ganeshotsava 2026'}
              </h1>
              <p className="text-[11px] text-amber-300/90 font-medium">
                Eldorado Kannadigara Balaga Celebrations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onBackToGaneshotsava}
              className="bg-white/10 hover:bg-white/20 text-white font-semibold text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer border border-white/20 shrink-0"
              title="Return to Ganeshotsava 2026 Festival Portal"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Ganeshotsava 2026</span>
            </button>
            {onGoToReceipts && (
              <button
                onClick={onGoToReceipts}
                className="bg-amber-400 hover:bg-amber-300 text-[#7F1D1D] font-bold text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
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
        <div className="max-w-md w-full bg-stone-900 border border-stone-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-amber-400/10 text-amber-400 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-amber-400/20">
              <Sparkles className="w-3 h-3" />
              <span>Admin Only Section</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight">
              Eldorado Kannadigara Balaga
            </h2>
            <p className="text-xs text-stone-400 leading-relaxed max-w-sm mx-auto">
              This celebrations page (<code className="text-amber-300 font-mono text-[11px]">/homepageindevelop</code>) is currently in development and is strictly restricted to Admin Committee members.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs text-left flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-400">
                Enter Admin Committee Passcode
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-stone-500" />
                <input
                  type="password"
                  value={passcode}
                  onChange={e => {
                    setPasscode(e.target.value);
                    setError('');
                  }}
                  placeholder="Admin passcode"
                  className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-stone-600 outline-none focus:border-amber-400 transition-colors"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-sm transition-all shadow-md active:scale-98 cursor-pointer"
            >
              Unlock Balaga Page
            </button>
          </form>

          <div className="pt-2 border-t border-stone-800 flex items-center justify-between text-xs text-stone-500">
            <button
              onClick={onBackToGaneshotsava}
              className="hover:text-stone-300 inline-flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Ganeshotsava 2026</span>
            </button>
            <span className="text-[11px] text-stone-600">Route: /homepageindevelop</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-800 py-3 text-center text-xs text-stone-600">
        Brigade El Dorado • Eldorado Kannadigara Balaga Committee
      </footer>
    </div>
  );
};
