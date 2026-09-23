import React, { useState } from 'react';
import {
  User,
  Building,
  Phone,
  Mail,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { UserProfile, UserRole, AppSettings } from '../types';
import { cloudSaveUserProfile } from '../lib/firebase';
import { cleanOrgName } from '../utils/helpers';

interface UserProfileOnboardingModalProps {
  email: string;
  initialName?: string;
  settings: AppSettings;
  onComplete: (profile: UserProfile) => void;
  onCancel: () => void;
}

export const UserProfileOnboardingModal: React.FC<UserProfileOnboardingModalProps> = ({
  email,
  initialName = '',
  settings,
  onComplete,
  onCancel
}) => {
  const [name, setName] = useState(initialName);
  const [flat, setFlat] = useState('');
  const [mobile, setMobile] = useState('');
  const [username, setUsername] = useState('');
  const [preferences, setPreferences] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAdminEmails = (): string[] => {
    try {
      const saved = localStorage.getItem('ekb_allowed_emails');
      if (saved) return JSON.parse(saved);
    } catch {}
    return ['desaisachin95@gmail.com', 'kannadigara.balaga.eldorado@gmail.com'];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedFlat = flat.trim().toUpperCase();
    const cleanedMobile = mobile.replace(/\D/g, '');
    const trimmedUsername = username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
    const trimmedPreferences = preferences.trim();

    if (!trimmedName) {
      setError('Please enter your full name.');
      return;
    }
    if (!trimmedFlat) {
      setError('Please enter your flat or villa number.');
      return;
    }
    if (cleanedMobile.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setSubmitting(true);
    try {
      const cleanEmail = email.toLowerCase().trim();
      const adminList = getAdminEmails().map(e => e.toLowerCase());
      const role: UserRole = adminList.includes(cleanEmail) ? 'admin' : 'resident';

      const newProfile: UserProfile = {
        email: cleanEmail,
        name: trimmedName,
        flat: trimmedFlat,
        mobile: cleanedMobile,
        role,
        ...(trimmedUsername ? { username: trimmedUsername } : {}),
        ...(trimmedPreferences ? { preferences: trimmedPreferences } : {}),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await cloudSaveUserProfile(newProfile);
      onComplete(newProfile);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile. Please check your internet connection and retry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border-2 border-amber-400 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-[#7F1D1D] via-[#991B1B] to-[#7F1D1D] text-white p-6 text-center border-b-2 border-amber-400 relative">
          <div className="w-16 h-16 rounded-full bg-amber-400 text-[#991B1B] flex items-center justify-center mx-auto mb-3 shadow-lg ring-4 ring-amber-300/30 overflow-hidden p-1 border-2 border-amber-300">
            <img
              src="/lord_ganesha.svg"
              alt="Lord Sri Ganesha"
              className="w-full h-full object-contain rounded-full"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="inline-flex items-center gap-1.5 bg-amber-400/20 text-amber-200 text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full border border-amber-400/40 mb-2">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>First-Time Registration</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-serif font-black tracking-wide leading-snug">
            Welcome to {cleanOrgName(settings.org, 'Ganeshotsava 2026')}
          </h2>
          <p className="text-xs text-amber-200/90 font-medium mt-1">
            Please enter your resident details to complete your first-time login
          </p>
        </div>

        <div className="p-6 sm:p-7 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => {
                    setName(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="e.g. Sachin Desai"
                  autoFocus
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-stone-900 outline-none focus:bg-white focus:border-[#991B1B] focus:ring-2 focus:ring-[#991B1B]/20 transition-all font-medium"
                />
              </div>
            </div>

            {/* Flat Number */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                Flat / Villa Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
                <input
                  type="text"
                  required
                  value={flat}
                  onChange={e => {
                    setFlat(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="e.g. A-402 or Tower 2 - 804"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-stone-900 outline-none focus:bg-white focus:border-[#991B1B] focus:ring-2 focus:ring-[#991B1B]/20 transition-all font-medium uppercase"
                />
              </div>
            </div>

            {/* Email (Verified) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                  Email Address
                </label>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Email Verified</span>
                </span>
              </div>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full bg-stone-100 border border-stone-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-stone-600 font-medium cursor-not-allowed"
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
                <div className="absolute left-10 top-3 text-xs font-bold text-stone-500">
                  +91
                </div>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={mobile}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '');
                    setMobile(val);
                    if (error) setError(null);
                  }}
                  placeholder="10-digit mobile number"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-18 pr-4 py-2.5 text-sm text-stone-900 outline-none focus:bg-white focus:border-[#991B1B] focus:ring-2 focus:ring-[#991B1B]/20 transition-all font-medium"
                />
              </div>
            </div>

            {/* Username / Resident Handle (Optional) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                Username / Display Alias <span className="text-stone-400 text-[10px] font-normal lowercase">(optional)</span>
              </label>
              <div className="relative">
                <span className="w-4 h-4 absolute left-3.5 top-3 text-stone-400 font-mono text-sm leading-none">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="e.g. sachin_eldorado"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-stone-900 outline-none focus:bg-white focus:border-[#991B1B] focus:ring-2 focus:ring-[#991B1B]/20 transition-all font-medium lowercase"
                />
              </div>
            </div>

            {/* Devotional Preferences / Volunteering Interests (Optional) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                Preferences &amp; Interests <span className="text-stone-400 text-[10px] font-normal lowercase">(optional)</span>
              </label>
              <input
                type="text"
                value={preferences}
                onChange={e => setPreferences(e.target.value)}
                placeholder="e.g. Maha Pooja, Cultural Programs, Prasada Seva, Volunteering"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-2.5 text-sm text-stone-900 outline-none focus:bg-white focus:border-[#991B1B] focus:ring-2 focus:ring-[#991B1B]/20 transition-all font-medium"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#991B1B] hover:bg-[#7F1D1D] active:scale-[0.99] text-white font-bold text-sm uppercase tracking-wider py-3.5 px-4 rounded-xl shadow-md inline-flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <span>{submitting ? 'Saving Profile...' : 'Complete Registration & Continue'}</span>
                <ArrowRight className="w-4 h-4 text-amber-300" />
              </button>
            </div>
          </form>

          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <button
              type="button"
              onClick={onCancel}
              className="text-stone-500 hover:text-stone-800 underline cursor-pointer"
            >
              Cancel &amp; Sign out
            </button>
            <div className="flex items-center gap-1 text-stone-400 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Saved to Secure Firestore</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
