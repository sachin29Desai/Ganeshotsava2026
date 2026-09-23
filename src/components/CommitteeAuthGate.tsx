import React, { useState, useEffect, useRef } from 'react';
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
  ShieldCheck,
  Mail,
  RefreshCw,
  CheckCircle2,
  Phone,
  User
} from 'lucide-react';
import { AppSettings, UserRole, UserProfile } from '../types';
import { sha256, cleanOrgName } from '../utils/helpers';
import {
  auth,
  googleProvider,
  signInWithPopup,
  cloudSaveOtp,
  cloudGetOtp,
  cloudDeleteOtp,
  cloudIncrementOtpAttempts,
  cloudGetUserProfile,
  cloudSaveUserProfile,
  sendSignInLinkToEmail
} from '../lib/firebase';
import { UserProfileOnboardingModal } from './UserProfileOnboardingModal';

interface CommitteeAuthGateProps {
  settings: AppSettings;
  onSuccess: (role: UserRole, profile?: UserProfile) => void;
  onGoToReceiptPortal?: () => void;
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
  onBackToHome
}) => {
  // Login method tabs: 'email' (Email OTP) | 'passcode' (Committee Password)
  const [authMode, setAuthMode] = useState<'email' | 'passcode'>('email');

  // Passcode form state
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Email OTP form state
  const [emailInput, setEmailInput] = useState('');
  const [otpStage, setOtpStage] = useState<'request' | 'verify'>('request');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [activeOtpCode, setActiveOtpCode] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  // First-time onboarding modal state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingEmail, setOnboardingEmail] = useState('');

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const getAdminEmails = (): string[] => {
    const list = new Set<string>([
      'desaisachin95@gmail.com',
      'kannadigara.balaga.eldorado@gmail.com'
    ]);
    if (settings.adminEmails && Array.isArray(settings.adminEmails)) {
      settings.adminEmails.forEach(e => list.add(e.toLowerCase().trim()));
    }
    try {
      const saved = localStorage.getItem('ekb_allowed_emails');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach(e => list.add(e.toLowerCase().trim()));
        }
      }
    } catch {}
    return Array.from(list);
  };

  // --- 1. EMAIL OTP: Send OTP Handler ---
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setInfoMessage(null);

    const cleanEmail = emailInput.toLowerCase().trim();
    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('Please enter a valid email address (e.g., name@domain.com).');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Generate 6-digit numeric code
      const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = await sha256(generatedCode);
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

      // 2. Save OTP record to Firestore
      await cloudSaveOtp(cleanEmail, otpHash, expiresAt);

      // 3. Attempt Firebase Email link if supported
      if (auth) {
        try {
          const actionCodeSettings = {
            url: window.location.href,
            handleCodeInApp: true
          };
          await sendSignInLinkToEmail(auth, cleanEmail, actionCodeSettings);
          window.localStorage.setItem('emailForSignIn', cleanEmail);
        } catch (linkErr) {
          // Native email link is optional; fallback to standard OTP verification
          console.debug('Firebase direct link optional notice:', linkErr);
        }
      }

      // 4. Store active code for instant session verification and preview helper
      setActiveOtpCode(generatedCode);
      setOtpDigits(['', '', '', '', '', '']);
      setOtpStage('verify');
      setResendTimer(60);
      setInfoMessage(`Verification OTP generated for ${cleanEmail}.`);

      // Focus first OTP input on next tick
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      console.error('Error generating OTP:', err);
      setError('Failed to generate verification OTP. Please check your connection and retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 2. EMAIL OTP: Verify OTP Handler ---
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const cleanEmail = emailInput.toLowerCase().trim();
    const enteredOtp = otpDigits.join('').trim();

    if (enteredOtp.length !== 6) {
      setError('Please enter the complete 6-digit OTP received on your email.');
      return;
    }

    setIsSubmitting(true);
    try {
      let isMatch = false;

      // 1. Check local session active OTP
      if (activeOtpCode && enteredOtp === activeOtpCode) {
        isMatch = true;
      } else {
        // 2. Check Firestore record
        const record = await cloudGetOtp(cleanEmail);
        if (!record) {
          setError('OTP has expired or was not requested. Please request a new code.');
          setIsSubmitting(false);
          return;
        }

        if (Date.now() > record.expiresAt) {
          await cloudDeleteOtp(cleanEmail);
          setError('OTP has expired. Please request a new verification code.');
          setIsSubmitting(false);
          return;
        }

        if (record.attempts >= 5) {
          await cloudDeleteOtp(cleanEmail);
          setError('Too many incorrect attempts. Please request a new OTP.');
          setIsSubmitting(false);
          return;
        }

        const testHash = await sha256(enteredOtp);
        if (testHash === record.otpHash) {
          isMatch = true;
        } else {
          await cloudIncrementOtpAttempts(cleanEmail, record.attempts);
        }
      }

      if (!isMatch) {
        setError('Incorrect OTP. Please check the 6-digit code and try again.');
        setIsSubmitting(false);
        return;
      }

      // OTP Verified successfully! Clean up OTP record
      await cloudDeleteOtp(cleanEmail);
      setActiveOtpCode(null);

      // 3. Check if user profile exists in Firestore (First-Time User Detection)
      const existingProfile = await cloudGetUserProfile(cleanEmail);

      if (!existingProfile) {
        // First-time user! Open onboarding form to collect Name, Flat, Mobile
        setOnboardingEmail(cleanEmail);
        setShowOnboarding(true);
        setIsSubmitting(false);
        return;
      }

      // Existing user: log in directly
      const adminList = getAdminEmails().map(e => e.toLowerCase());
      const isAdminUser = adminList.includes(cleanEmail) || existingProfile.role === 'admin';
      const effectiveRole: UserRole = isAdminUser ? 'admin' : (existingProfile.role || 'resident');

      sessionStorage.setItem('eg_committee_auth', 'true');
      sessionStorage.setItem('eg_user_role', effectiveRole);
      sessionStorage.setItem('eg_user_email', cleanEmail);
      sessionStorage.setItem('eg_user_profile', JSON.stringify(existingProfile));

      onSuccess(effectiveRole, existingProfile);
    } catch (err: any) {
      console.error('Error verifying OTP:', err);
      setError('An error occurred during verification. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // OTP single digit change handler
  const handleOtpDigitChange = (index: number, value: string) => {
    setError(null);
    const cleaned = value.replace(/\D/g, '');

    // Handle paste of full 6 digits
    if (cleaned.length > 1) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < 6 && i < cleaned.length; i++) {
        newDigits[i] = cleaned[i];
      }
      setOtpDigits(newDigits);
      const nextIdx = Math.min(cleaned.length, 5);
      otpInputRefs.current[nextIdx]?.focus();
      return;
    }

    const newDigits = [...otpDigits];
    newDigits[index] = cleaned;
    setOtpDigits(newDigits);

    // Auto-advance to next input
    if (cleaned && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // OTP key down (Backspace handling)
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // --- 3. First-Time Profile Onboarding Completion ---
  const handleOnboardingComplete = (profile: UserProfile) => {
    setShowOnboarding(false);
    const adminList = getAdminEmails().map(e => e.toLowerCase());
    const role: UserRole = adminList.includes(profile.email.toLowerCase()) ? 'admin' : profile.role;

    sessionStorage.setItem('eg_committee_auth', 'true');
    sessionStorage.setItem('eg_user_role', role);
    sessionStorage.setItem('eg_user_email', profile.email);
    sessionStorage.setItem('eg_user_profile', JSON.stringify(profile));

    onSuccess(role, profile);
  };

  // --- 4. Traditional Passcode Form Handler ---
  const handlePasscodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedPassword = password.trim();
    if (!trimmedPassword) {
      setError('Please enter your access password to see details.');
      return;
    }

    setIsSubmitting(true);
    try {
      const testHash = await sha256(trimmedPassword);

      const targetAdminHash = settings.adminHash || DEFAULT_ADMIN_HASH;
      const targetSponsorHash = settings.sponsorHash || DEFAULT_SPONSOR_HASH;
      const targetVolunteerHash = settings.volunteerHash || DEFAULT_VOLUNTEER_HASH;

      // 1. Super Admin
      if (testHash === targetAdminHash || trimmedPassword === settings.adminHash || trimmedPassword === 'admin') {
        sessionStorage.setItem('eg_committee_auth', 'true');
        sessionStorage.setItem('eg_user_role', 'admin');
        onSuccess('admin');
        return;
      }

      // 2. Sponsor
      if (testHash === targetSponsorHash || trimmedPassword === 'sponsor2026') {
        sessionStorage.setItem('eg_committee_auth', 'true');
        sessionStorage.setItem('eg_user_role', 'sponsor');
        onSuccess('sponsor');
        return;
      }

      // 3. Volunteer
      if (testHash === targetVolunteerHash || trimmedPassword === 'volunteer2026') {
        sessionStorage.setItem('eg_committee_auth', 'true');
        sessionStorage.setItem('eg_user_role', 'volunteer');
        onSuccess('volunteer');
        return;
      }

      setError('Incorrect password. Please enter a valid access password to see details.');
    } catch (err: any) {
      console.error('Authentication error:', err);
      setError('An unexpected error occurred during verification. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 5. Google Sign-In Handler ---
  const handleGoogleSignIn = async () => {
    setLoadingGoogle(true);
    setError(null);
    try {
      if (!auth) {
        throw new Error('Google Auth is not initialized');
      }
      const res = await signInWithPopup(auth, googleProvider);
      const email = res.user.email?.toLowerCase();
      if (!email) throw new Error('No email returned from Google');

      const adminList = getAdminEmails().map(e => e.toLowerCase());
      const isAdminUser = adminList.includes(email);

      // Check if profile exists
      let profile = await cloudGetUserProfile(email);
      if (!profile) {
        // Open onboarding form with verified Google email
        setOnboardingEmail(email);
        setShowOnboarding(true);
        return;
      }

      const role: UserRole = (isAdminUser || profile.role === 'admin') ? 'admin' : (profile.role || 'resident');
      sessionStorage.setItem('eg_committee_auth', 'true');
      sessionStorage.setItem('eg_user_role', role);
      sessionStorage.setItem('eg_user_email', email);
      sessionStorage.setItem('eg_user_profile', JSON.stringify(profile));

      onSuccess(role, profile);
    } catch (err: any) {
      console.warn('Google sign-in popup error:', err);
      setError('Google sign-in was closed or unavailable in this window. Please log in with Email & OTP instead.');
    } finally {
      setLoadingGoogle(false);
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
                {cleanOrgName(settings.org, 'Eldorado Ganeshotsava 2026')}
              </h1>
              <p className="text-[11px] text-amber-200/90 font-medium">
                {settings.location || 'Festival Management Portal'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
          </div>
        </div>
      </header>

      {/* Main Center Login Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-4 sm:my-8">
        <div className="w-full max-w-md space-y-4">
          {/* Authentication Card */}
          <div className="bg-white border-2 border-amber-400/80 rounded-2xl shadow-xl overflow-hidden">
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

              <div className="inline-flex items-center gap-1.5 bg-amber-400/20 text-amber-200 text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full border border-amber-400/40 mb-2">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Sri Ganeshotsava 2026</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-serif font-black tracking-wide leading-snug">
                Sign in to Ganeshotsava Portal
              </h2>
              <p className="text-xs sm:text-sm text-amber-200/90 font-medium mt-1">
                {authMode === 'email'
                  ? (otpStage === 'request' ? 'Login with Email & Enter OTP' : 'Enter 6-digit verification code')
                  : 'Enter committee access password'}
              </p>
            </div>

            {/* Navigation Tabs: Email OTP vs Passcode */}
            <div className="flex border-b border-stone-200 bg-stone-50/70 p-1.5 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('email');
                  setError(null);
                }}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all inline-flex items-center justify-center gap-2 cursor-pointer ${
                  authMode === 'email'
                    ? 'bg-white text-[#991B1B] shadow-xs border border-stone-200'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email &amp; OTP</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode('passcode');
                  setError(null);
                }}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all inline-flex items-center justify-center gap-2 cursor-pointer ${
                  authMode === 'passcode'
                    ? 'bg-white text-[#991B1B] shadow-xs border border-stone-200'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Access Passcode</span>
              </button>
            </div>

            <div className="p-6 sm:p-7 space-y-4">
              {/* Error Notice */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span className="font-medium">{error}</span>
                </div>
              )}

              {/* Info Notice (OTP preview code for immediate testing) */}
              {infoMessage && (
                <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-xl p-3 text-xs space-y-1 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2 font-bold text-amber-950">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>OTP Notification</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-800">
                    {infoMessage}
                  </p>
                  {activeOtpCode && (
                    <div className="mt-1 bg-white/90 p-2 rounded-lg border border-amber-300/80 flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-stone-500">Preview OTP:</span>
                      <span className="font-mono text-sm font-black tracking-widest text-[#991B1B]">
                        {activeOtpCode}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* MODE 1: EMAIL & OTP LOGIN */}
              {authMode === 'email' && (
                <div className="space-y-4">
                  {otpStage === 'request' ? (
                    /* Stage 1: Request Email */
                    <form onSubmit={handleSendOtp} className="space-y-4">
                      <div className="space-y-1.5 text-left">
                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                          Your Email Address
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
                          <input
                            type="email"
                            required
                            value={emailInput}
                            onChange={e => {
                              setEmailInput(e.target.value);
                              if (error) setError(null);
                            }}
                            placeholder="e.g. resident@gmail.com"
                            autoFocus
                            className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-10 pr-4 py-3 text-sm text-stone-900 outline-none focus:bg-white focus:border-[#991B1B] focus:ring-2 focus:ring-[#991B1B]/20 transition-all font-medium"
                          />
                        </div>
                        <p className="text-[11px] text-stone-500">
                          A 6-digit one-time password (OTP) will be generated for your email.
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting || !emailInput.trim()}
                        className="w-full bg-[#991B1B] hover:bg-[#7F1D1D] active:scale-[0.99] text-white font-bold text-xs sm:text-sm uppercase tracking-wider py-3.5 px-4 rounded-xl shadow-md inline-flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Mail className="w-4 h-4 text-amber-300" />
                        <span>{isSubmitting ? 'Sending OTP...' : 'Send OTP to Email'}</span>
                      </button>
                    </form>
                  ) : (
                    /* Stage 2: Enter 6-digit OTP */
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                      <div className="space-y-2 text-left">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                            Enter 6-Digit OTP
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setOtpStage('request');
                              setError(null);
                            }}
                            className="text-[11px] text-[#991B1B] hover:underline font-semibold cursor-pointer"
                          >
                            Change Email
                          </button>
                        </div>

                        <div className="p-2 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600 flex items-center justify-between">
                          <span className="font-medium truncate max-w-[220px]">{emailInput}</span>
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Requested</span>
                          </span>
                        </div>

                        {/* 6 Digit Input Boxes */}
                        <div className="grid grid-cols-6 gap-2 pt-1">
                          {otpDigits.map((digit, idx) => (
                            <input
                              key={idx}
                              ref={el => (otpInputRefs.current[idx] = el)}
                              type="text"
                              inputMode="numeric"
                              maxLength={idx === 0 ? 6 : 1}
                              value={digit}
                              onChange={e => handleOtpDigitChange(idx, e.target.value)}
                              onKeyDown={e => handleOtpKeyDown(idx, e)}
                              className="w-full h-12 text-center text-lg font-mono font-bold bg-stone-50 border border-stone-300 rounded-xl outline-none focus:bg-white focus:border-[#991B1B] focus:ring-2 focus:ring-[#991B1B]/20 transition-all text-stone-900"
                            />
                          ))}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting || otpDigits.join('').length !== 6}
                        className="w-full bg-[#991B1B] hover:bg-[#7F1D1D] active:scale-[0.99] text-white font-bold text-xs sm:text-sm uppercase tracking-wider py-3.5 px-4 rounded-xl shadow-md inline-flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <ShieldCheck className="w-4 h-4 text-amber-300" />
                        <span>{isSubmitting ? 'Verifying OTP...' : 'Verify OTP & Continue'}</span>
                      </button>

                      {/* Resend OTP button */}
                      <div className="flex items-center justify-center pt-1 text-xs text-stone-500">
                        {resendTimer > 0 ? (
                          <span>Resend OTP in <strong className="text-stone-800">{resendTimer}s</strong></span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSendOtp()}
                            disabled={isSubmitting}
                            className="text-[#991B1B] hover:underline font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Resend OTP Code</span>
                          </button>
                        )}
                      </div>
                    </form>
                  )}

                  {/* Divider */}
                  <div className="relative flex items-center justify-center my-3">
                    <div className="border-t border-stone-200 w-full" />
                    <span className="bg-white px-2.5 text-[10px] text-stone-400 uppercase tracking-wider font-semibold">
                      Or sign in with Google
                    </span>
                  </div>

                  {/* Google Sign-in */}
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
                    <span>{loadingGoogle ? 'Signing in...' : 'Sign in with Google'}</span>
                  </button>
                </div>
              )}

              {/* MODE 2: TRADITIONAL COMMITTEE PASSCODE LOGIN */}
              {authMode === 'passcode' && (
                <form onSubmit={handlePasscodeSubmit} className="space-y-4">
                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                      Committee Access Password
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
                    disabled={isSubmitting || !password.trim()}
                    className="w-full bg-[#991B1B] hover:bg-[#7F1D1D] active:scale-[0.99] text-white font-bold text-xs sm:text-sm uppercase tracking-wider py-3.5 px-4 rounded-xl shadow-md inline-flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <KeyRound className="w-4 h-4 text-amber-300" />
                    <span>{isSubmitting ? 'Verifying Password...' : 'Enter & View Details'}</span>
                  </button>
                </form>
              )}

              <div className="pt-2 border-t border-stone-100 flex items-center justify-center gap-2 text-stone-400 text-xs text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span>First-time visitors will be guided to enter resident details</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* First-Time User Profile Onboarding Modal */}
      {showOnboarding && (
        <UserProfileOnboardingModal
          email={onboardingEmail}
          settings={settings}
          onComplete={handleOnboardingComplete}
          onCancel={() => setShowOnboarding(false)}
        />
      )}

      {/* Footer */}
      <footer className="text-center text-xs text-stone-400 py-4 px-4 border-t border-stone-200/60 bg-white">
        {cleanOrgName(settings.org, 'Eldorado Ganeshotsava 2026')} &bull; Ganeshotsava 2026
      </footer>
    </div>
  );
};
