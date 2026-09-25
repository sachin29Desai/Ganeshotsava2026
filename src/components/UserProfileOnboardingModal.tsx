import React, { useState } from 'react';
import {
  User,
  Building,
  Phone,
  Mail,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { UserProfile, UserRole, AppSettings } from '../types';
import { cloudSaveUserProfile } from '../lib/firebase';
import { cleanOrgName } from '../utils/helpers';

interface UserProfileOnboardingModalProps {
  email: string;
  initialName?: string;
  initialMobile?: string;
  settings: AppSettings;
  onComplete: (profile: UserProfile) => void;
  onCancel: () => void;
}

export const UserProfileOnboardingModal: React.FC<UserProfileOnboardingModalProps> = ({
  email,
  initialName = '',
  initialMobile = '',
  settings,
  onComplete,
  onCancel
}) => {
  const [name, setName] = useState(initialName);
  const [flat, setFlat] = useState('');
  const [mobile, setMobile] = useState(initialMobile);
  const [userEmail, setUserEmail] = useState(email || '');
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

    if (!trimmedName) {
      setError('Please enter your full name.');
      return;
    }
    if (!trimmedFlat) {
      setError('Please enter your flat number.');
      return;
    }
    if (cleanedMobile.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setSubmitting(true);
    try {
      const cleanEmail = (userEmail || email).toLowerCase().trim();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        setError('Please enter a valid email address.');
        setSubmitting(false);
        return;
      }

      const adminList = getAdminEmails().map(e => e.toLowerCase());
      const isCustomAdmin = cleanEmail === 'desaisachin95@gmail.com' || adminList.includes(cleanEmail);
      const role: UserRole = isCustomAdmin ? 'admin' : 'viewer';
      const status = isCustomAdmin ? 'verified' : 'unverified';

      const newProfile: UserProfile = {
        email: cleanEmail,
        name: trimmedName,
        flat: trimmedFlat,
        mobile: cleanedMobile,
        role,
        status,
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
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border-2 border-amber-400 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-4">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-[#7F1D1D] via-[#991B1B] to-[#7F1D1D] text-white p-5 text-center border-b-2 border-amber-400 relative">
          <div className="inline-flex items-center gap-1.5 bg-amber-400/20 text-amber-200 text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full border border-amber-400/40 mb-2">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Devotee Registration</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-serif font-black tracking-wide leading-snug">
            Welcome to {cleanOrgName(settings.org, 'Ganeshotsava 2026')}
          </h2>
          <p className="text-xs text-amber-200/90 font-medium mt-1">
            Record your profile details for community celebrations
          </p>
        </div>

        <div className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
            {/* Full Name */}
            <div className="space-y-1">
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
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                Flat Number <span className="text-red-500">*</span>
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
                  placeholder="e.g. A-402"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-stone-900 outline-none focus:bg-white focus:border-[#991B1B] focus:ring-2 focus:ring-[#991B1B]/20 transition-all font-medium uppercase"
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
                <input
                  type="email"
                  required
                  disabled={!!email}
                  value={userEmail}
                  onChange={e => {
                    setUserEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="e.g. devotee@gmail.com"
                  className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium outline-none transition-all ${
                    email
                      ? 'bg-stone-100 border border-stone-200 text-stone-600 cursor-not-allowed'
                      : 'bg-stone-50 border border-stone-300 text-stone-900 focus:bg-white focus:border-[#991B1B] focus:ring-2 focus:ring-[#991B1B]/20'
                  }`}
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div className="space-y-1">
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
              <p className="text-[10px] text-stone-500">
                You can use your registered email ID to sign in anytime!
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#991B1B] hover:bg-[#7F1D1D] active:scale-[0.99] text-white font-bold text-xs sm:text-sm uppercase tracking-wider py-3.5 px-4 rounded-xl shadow-md inline-flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <span>{submitting ? 'Saving Profile...' : 'Complete Registration'}</span>
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
              <span>Saved Securely</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
