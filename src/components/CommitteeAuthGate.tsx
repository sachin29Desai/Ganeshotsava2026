import React, { useState } from 'react';
import {
  Lock,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Mail,
  CheckCircle2,
  Phone,
  UserPlus,
  ArrowRight,
  ArrowLeft,
  LogIn,
  HeartHandshake,
  Check,
  RefreshCw
} from 'lucide-react';
import { AppSettings, UserRole, UserProfile } from '../types';
import { cleanOrgName } from '../utils/helpers';
import {
  auth,
  googleProvider,
  signInWithPopup,
  cloudGetUserProfile,
  cloudGetUserProfileByPhone,
  sendSignInLinkToEmail,
  sendOtpEmailApi,
  cloudSaveOtp,
  cloudGetOtp,
  cloudDeleteOtp,
  cloudIncrementOtpAttempts,
  cloudSaveUserProfile
} from '../lib/firebase';
import { UserProfileOnboardingModal } from './UserProfileOnboardingModal';
import { GaneshaFestivalVideoShowcase } from './GaneshaFestivalVideoShowcase';

interface CommitteeAuthGateProps {
  settings: AppSettings;
  onSuccess: (role: UserRole, profile?: UserProfile) => void;
  onGoToReceiptPortal?: () => void;
  onGoToSevaPortal?: () => void;
  onBackToHome?: () => void;
  onSaveSettings?: (newSettings: AppSettings) => void;
}

export const CommitteeAuthGate: React.FC<CommitteeAuthGateProps> = ({
  settings,
  onSuccess,
  onBackToHome
}) => {
  // Input value: can be either an Email ID or a 10-digit Mobile Number
  const [identifierInput, setIdentifierInput] = useState('');

  // First-time onboarding / registration modal state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingEmail, setOnboardingEmail] = useState('');
  const [onboardingMobile, setOnboardingMobile] = useState('');

  // Thank You modal state on complete registration
  const [showThankYou, setShowThankYou] = useState<UserProfile | null>(null);
  const [mailDeliveryFailed, setMailDeliveryFailed] = useState(false);

  // OTP login & verification states
  const [otpSentState, setOtpSentState] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

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

  // Resolve user role
  const resolveRole = (email: string, userRole?: UserRole): UserRole => {
    const cleanEmail = email.toLowerCase().trim();
    const adminList = getAdminEmails().map(e => e.toLowerCase());
    if (cleanEmail === 'desaisachin95@gmail.com' || adminList.includes(cleanEmail) || userRole === 'admin') {
      return 'admin';
    }
    if (userRole === 'member' || userRole === 'read_only' || userRole === 'sponsor') {
      return 'member';
    }
    return 'viewer';
  };

  // --- OTP GENERATION, DATABASE REGISTRATION & DISPATCH ---
  const triggerOtpSendFlow = async (targetEmail: string) => {
    setIsSubmitting(true);
    setError(null);
    setInfoMessage(null);
    setMailDeliveryFailed(false);
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    const continueUrl = `${window.location.origin}${window.location.pathname}?email=${encodeURIComponent(targetEmail)}`;

    console.log("%c👉 DEV MODE VERIFICATION DETAILS:", "color: #991B1B; font-weight: bold; font-size: 14px;");
    console.log("%cOTP Code: " + otp, "color: #059669; font-weight: bold; font-size: 13px;");
    console.log("%cMagic Link: " + continueUrl, "color: #2563EB; font-weight: bold; text-decoration: underline;");

    try {
      // 1. Save OTP to Firestore
      await cloudSaveOtp(targetEmail, otp, expiresAt);

      // 2. Try sending through Firebase (Magic Link)
      if (auth) {
        try {
          await sendSignInLinkToEmail(auth, targetEmail, {
            url: continueUrl,
            handleCodeInApp: true
          });
        } catch (authErr) {
          console.warn('Firebase Auth sendSignInLinkToEmail failed (expected if provider disabled):', authErr);
        }
      }

      // 3. Try sending through our highly-deliverable SMTP/Brevo/Resend proxy
      const proxyResult = await sendOtpEmailApi(targetEmail, otp, continueUrl, settings.org);
      if (!proxyResult || !proxyResult.success) {
        console.warn('Backend proxy OTP mail failed:', proxyResult?.error);
        setMailDeliveryFailed(true);
      }
      
      // Move to OTP screen
      setOtpSentState(targetEmail);
    } catch (err: any) {
      console.error('Failed to initialize OTP flow:', err);
      setError('An error occurred while generating your verification code. Please check your network.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- OTP VERIFICATION HANDLER ---
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpSentState) return;
    setError(null);
    setInfoMessage(null);
    const code = otpInput.trim();
    if (code.length !== 6 || !/^\d+$/.test(code)) {
      setError('Please enter a valid 6-digit numeric verification code.');
      return;
    }

    setVerifyingOtp(true);
    try {
      const savedOtp = await cloudGetOtp(otpSentState);
      if (!savedOtp) {
        setError('Verification code has expired or was not requested. Please click "Resend Code" to request a new one.');
        setVerifyingOtp(false);
        return;
      }

      if (Date.now() > savedOtp.expiresAt) {
        setError('This verification code has expired (valid for 10 minutes). Please click "Resend Code" to generate a new one.');
        await cloudDeleteOtp(otpSentState);
        setVerifyingOtp(false);
        return;
      }

      if (savedOtp.attempts >= 3) {
        setError('Too many incorrect verification attempts. Please click "Resend Code" to generate a new one.');
        await cloudDeleteOtp(otpSentState);
        setVerifyingOtp(false);
        return;
      }

      if (savedOtp.otpHash !== code) {
        await cloudIncrementOtpAttempts(otpSentState, savedOtp.attempts);
        setError('Incorrect verification code. Please check your email and try again.');
        setVerifyingOtp(false);
        return;
      }

      // Successful OTP verification!
      await cloudDeleteOtp(otpSentState);

      const profile = await cloudGetUserProfile(otpSentState);
      if (profile) {
        const verifiedProfile: UserProfile = {
          ...profile,
          status: 'verified',
          updatedAt: new Date().toISOString()
        };
        await cloudSaveUserProfile(verifiedProfile);
        
        const role = resolveRole(otpSentState, verifiedProfile.role);
        sessionStorage.setItem('eg_committee_auth', 'true');
        sessionStorage.setItem('eg_user_role', role);
        sessionStorage.setItem('eg_user_email', otpSentState);
        sessionStorage.setItem('eg_user_profile', JSON.stringify({ ...verifiedProfile, role }));

        onSuccess(role, verifiedProfile);
        setOtpSentState(null);
        setOtpInput('');
      } else {
        setOtpSentState(null);
        setError('Devotee profile not found. Please register first.');
      }
    } catch (err: any) {
      console.error('Error verifying OTP:', err);
      setError('An error occurred during verification. Please check your connection.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  // --- LOGIN HANDLER (For Existing Users Only) ---
  const handleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setInfoMessage(null);

    const rawInput = identifierInput.trim();
    if (!rawInput) {
      setError('Please enter your registered email address or 10-digit mobile number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const isDigitsOnly = /^\d+$/.test(rawInput.replace(/[\s+-]/g, ''));
      const cleanedDigits = rawInput.replace(/\D/g, '');

      // 1. DEVOTEE ENTERED PHONE NUMBER
      if (isDigitsOnly || (cleanedDigits.length >= 10 && !rawInput.includes('@'))) {
        if (cleanedDigits.length < 10) {
          setError('Please enter a valid 10-digit mobile number.');
          setIsSubmitting(false);
          return;
        }

        // Look up registered user profile in database
        const profile = await cloudGetUserProfileByPhone(cleanedDigits);
        if (!profile) {
          setError('Devotee profile not found for this mobile number. If you are a new devotee, please click the "Register" button below.');
          setIsSubmitting(false);
          return;
        }

        // Check if devotee is verified
        const isProfileAdmin = profile.role === 'admin' || getAdminEmails().map(e => e.toLowerCase()).includes(profile.email.toLowerCase());
        if (profile.status === 'unverified' && !isProfileAdmin) {
          await triggerOtpSendFlow(profile.email);
          return;
        }

        // Returning devotee found! Log in directly!
        const role = resolveRole(profile.email, profile.role);
        sessionStorage.setItem('eg_committee_auth', 'true');
        sessionStorage.setItem('eg_user_role', role);
        sessionStorage.setItem('eg_user_email', profile.email);
        sessionStorage.setItem('eg_user_profile', JSON.stringify({ ...profile, role }));

        onSuccess(role, profile);
        return;
      }

      // 2. DEVOTEE ENTERED EMAIL ADDRESS
      const cleanEmail = rawInput.toLowerCase().trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        setError('Please enter a valid email address (e.g., devotee@gmail.com) or 10-digit mobile number.');
        setIsSubmitting(false);
        return;
      }

      const adminList = getAdminEmails().map(e => e.toLowerCase());
      const isSuperAdmin = cleanEmail === 'desaisachin95@gmail.com' || adminList.includes(cleanEmail);

      // Check if user is already registered in database
      const existingProfile = await cloudGetUserProfile(cleanEmail);

      if (existingProfile || isSuperAdmin) {
        // RETURNING REGISTERED DEVOTEE or Admin: Instant login & dispatch verification link
        const profile = existingProfile || {
          email: cleanEmail,
          name: isSuperAdmin ? 'Sachin Desai (Admin)' : 'Devotee',
          flat: 'Admin Desk',
          mobile: '',
          role: 'admin' as UserRole,
          status: 'verified' as const
        };

        // Check if devotee is verified
        if (profile.status === 'unverified' && !isSuperAdmin) {
          await triggerOtpSendFlow(cleanEmail);
          return;
        }

        const role = resolveRole(cleanEmail, profile.role);
        sessionStorage.setItem('eg_committee_auth', 'true');
        sessionStorage.setItem('eg_user_role', role);
        sessionStorage.setItem('eg_user_email', cleanEmail);
        sessionStorage.setItem('eg_user_profile', JSON.stringify({ ...profile, role }));

        if (auth) {
          try {
            const continueUrl = `${window.location.origin}${window.location.pathname}?email=${encodeURIComponent(cleanEmail)}`;
            await sendSignInLinkToEmail(auth, cleanEmail, {
              url: continueUrl,
              handleCodeInApp: true
            });
          } catch {}
        }

        onSuccess(role, profile);
        return;
      }

      // UNREGISTERED FIRST-TIME USER:
      setError('We could not find a devotee profile with this email address. If you are a new resident, please click the "Register" button below to create your account.');
    } catch (err: any) {
      console.error('Error during login:', err);
      setError('An error occurred while logging in. Please verify your internet connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- GOOGLE SIGN-IN ---
  const handleGoogleSignIn = async () => {
    setError(null);
    setLoadingGoogle(true);
    try {
      if (!auth) {
        throw new Error('Authentication services are currently unavailable.');
      }
      const result = await signInWithPopup(auth, googleProvider);
      const email = (result.user.email || '').toLowerCase().trim();
      if (!email) {
        throw new Error('Could not retrieve email from Google sign-in.');
      }

      // Check if user exists in database
      const existingProfile = await cloudGetUserProfile(email);
      if (!existingProfile) {
        // Prompt first-time user to complete registration
        setOnboardingEmail(email);
        setShowOnboarding(true);
        setLoadingGoogle(false);
        return;
      }

      const role = resolveRole(email, existingProfile.role);
      sessionStorage.setItem('eg_committee_auth', 'true');
      sessionStorage.setItem('eg_user_role', role);
      sessionStorage.setItem('eg_user_email', email);
      sessionStorage.setItem('eg_user_profile', JSON.stringify({ ...existingProfile, role }));

      onSuccess(role, existingProfile);
    } catch (err: any) {
      console.warn('Google sign-in notice:', err);
      setError('Google sign-in was closed or unavailable. You can enter your email to log in directly.');
    } finally {
      setLoadingGoogle(false);
    }
  };

  // Onboarding completion handler -> Shows Custom Thank You Modal first
  const handleOnboardingComplete = async (newProfile: UserProfile) => {
    setShowOnboarding(false);
    setMailDeliveryFailed(false);
    
    // Automatically trigger OTP & magic link generation in background for the new user
    if (newProfile.email && newProfile.status === 'unverified') {
      triggerOtpSendFlow(newProfile.email).catch(() => {});
    }

    // Cache session storage values ONLY if verified!
    if (newProfile.status === 'verified') {
      const role = resolveRole(newProfile.email, newProfile.role);
      sessionStorage.setItem('eg_committee_auth', 'true');
      sessionStorage.setItem('eg_user_role', role);
      sessionStorage.setItem('eg_user_email', newProfile.email);
      sessionStorage.setItem('eg_user_profile', JSON.stringify({ ...newProfile, role }));
    } else {
      // Clear any session cache to prevent unverified bypass
      sessionStorage.removeItem('eg_committee_auth');
      sessionStorage.removeItem('eg_user_role');
      sessionStorage.removeItem('eg_user_email');
      sessionStorage.removeItem('eg_user_profile');
    }

    // Open Thank You Dialog
    setShowThankYou(newProfile);
  };

  const handleThankYouConfirm = () => {
    if (showThankYou) {
      const role = resolveRole(showThankYou.email, showThankYou.role);
      if (showThankYou.status === 'unverified') {
        setError(null);
        setInfoMessage(`Registration successful! Please enter the 6-digit verification code sent to ${showThankYou.email} below to verify your email and access the portal.`);
        setOtpSentState(showThankYou.email);
        setShowThankYou(null);
        return;
      }
      onSuccess(role, showThankYou);
      setShowThankYou(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between selection:bg-[#991B1B] selection:text-white font-sans">
      {/* Top Festive Header Bar */}
      <header className="bg-[#991B1B] text-white border-b-2 border-amber-400 py-3 px-4 sm:px-6 shadow-sm shrink-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
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
                {settings.location || 'Festival Management & Devotee Portal'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onBackToHome && (
              <button
                type="button"
                onClick={onBackToHome}
                className="bg-white/10 hover:bg-white/20 text-white font-semibold text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer border border-white/20 shrink-0"
                title="Return to Celebrations Home"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Celebrations Home</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Dual-Column Hero & Login Section */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          {/* LEFT COLUMN: Grand Sri Ganesha Festival Video Showcase */}
          <div className="lg:col-span-7 w-full space-y-3">
            <GaneshaFestivalVideoShowcase settings={settings} />

            <div className="bg-amber-50/70 border border-amber-300/80 rounded-xl p-3 flex items-center justify-between text-xs text-amber-950">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Eldorado Kannadigara Balaga</strong> &bull; Sri Ganeshotsava 2026
                </span>
              </div>
              <span className="text-[11px] text-amber-800 font-bold hidden sm:inline">
                ಸಿರಿಗನ್ನಡಂ ಗೆಲ್ಗೆ! ಸಿರಿಗನ್ನಡಂ ಬಾಳ್ಗೆ! 🚩
              </span>
            </div>
          </div>

          {/* RIGHT COLUMN: Clean Login & Registration Card */}
          <div className="lg:col-span-5 w-full">
            <div className="bg-white border-2 border-amber-400 rounded-2xl shadow-xl overflow-hidden">
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-[#7F1D1D] via-[#991B1B] to-[#7F1D1D] text-white p-5 text-center border-b-2 border-amber-400 relative">
                <div className="w-14 h-14 rounded-full bg-amber-400 text-[#991B1B] flex items-center justify-center mx-auto mb-2.5 shadow-lg ring-4 ring-amber-300/30 overflow-hidden p-1 border-2 border-amber-300">
                  <img
                    src="/lord_ganesha.svg"
                    alt="Lord Sri Ganesha"
                    className="w-full h-full object-contain rounded-full"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="inline-flex items-center gap-1.5 bg-amber-400/20 text-amber-200 text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full border border-amber-400/40 mb-1.5">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>Devotee &amp; Resident Portal</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-serif font-black tracking-wide leading-snug">
                  Login / Register by Email
                </h2>
                <p className="text-xs text-amber-200/90 font-medium mt-0.5">
                  Enter your email or phone to log in, or register as a new devotee
                </p>
              </div>

              <div className="p-5 sm:p-6 space-y-4">
                {/* Error Notice */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span className="font-medium">{error}</span>
                  </div>
                )}

                {/* Info Notice */}
                {infoMessage && (
                  <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-xl p-3 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span className="font-medium">{infoMessage}</span>
                  </div>
                )}

                {/* LOGIN / OTP CONDITIONAL FORM */}
                {otpSentState ? (
                  <form onSubmit={handleVerifyOtp} className="space-y-4 text-left animate-in fade-in duration-200">
                    <div className="p-3.5 bg-amber-50/70 border border-amber-300 rounded-xl space-y-1">
                      <span className="font-bold text-xs text-amber-900 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#991B1B]" />
                        <span>Verification Code Sent</span>
                      </span>
                      <p className="text-[11px] text-amber-950 leading-relaxed">
                        We have dispatched a secure 6-digit code and a 1-click magic link to <strong className="font-semibold text-stone-900">{otpSentState}</strong>.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                        Enter 6-Digit Verification Code
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={otpInput}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '');
                          setOtpInput(val);
                          if (error) setError(null);
                        }}
                        placeholder="e.g. 123456"
                        autoFocus
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-3.5 text-center text-xl font-mono font-black tracking-[8px] text-[#991B1B] outline-none focus:bg-white focus:border-[#991B1B] focus:ring-2 focus:ring-[#991B1B]/20 transition-all"
                      />
                      <p className="text-[10px] text-stone-500">
                        Code expires in 10 minutes. Please check your inbox and spam folder.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={verifyingOtp || otpInput.trim().length !== 6}
                      className="w-full bg-[#991B1B] hover:bg-[#7F1D1D] active:scale-[0.99] text-white font-bold text-xs sm:text-sm uppercase tracking-wider py-3.5 px-4 rounded-xl shadow-md inline-flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <ShieldCheck className="w-4 h-4 text-amber-300" />
                      <span>{verifyingOtp ? 'Verifying Code...' : 'Verify & Sign In'}</span>
                    </button>

                    {/* Resend / Sandbox Options */}
                    <div className="space-y-2 pt-1 border-t border-stone-100 mt-3">
                      <button
                        type="button"
                        onClick={() => triggerOtpSendFlow(otpSentState)}
                        disabled={isSubmitting}
                        className="w-full py-2.5 bg-stone-50 hover:bg-stone-100 border border-stone-300 rounded-xl text-stone-700 font-bold text-xs transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin text-[#991B1B]' : 'text-stone-500'}`} />
                        <span>Resend Verification Email</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setOtpSentState(null);
                          setOtpInput('');
                          setError(null);
                        }}
                        className="w-full py-2 text-stone-500 hover:text-stone-800 text-xs font-semibold underline text-center cursor-pointer"
                      >
                        Go Back to Login
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                        Email Address or Mobile Number
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
                        <input
                          type="text"
                          required
                          value={identifierInput}
                          onChange={e => {
                            setIdentifierInput(e.target.value);
                            if (error) setError(null);
                          }}
                          placeholder="e.g. resident@gmail.com or 9876543210"
                          autoFocus
                          className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-10 pr-4 py-3 text-sm text-stone-900 outline-none focus:bg-white focus:border-[#991B1B] focus:ring-2 focus:ring-[#991B1B]/20 transition-all font-medium"
                        />
                      </div>
                      <p className="text-[11px] text-stone-500">
                        Existing users: Enter your registered email ID or 10-digit mobile number to login.
                      </p>
                    </div>

                    {/* Primary Login Button (Only for existing users) */}
                    <button
                      type="submit"
                      disabled={isSubmitting || !identifierInput.trim()}
                      className="w-full bg-[#991B1B] hover:bg-[#7F1D1D] active:scale-[0.99] text-white font-bold text-xs sm:text-sm uppercase tracking-wider py-3.5 px-4 rounded-xl shadow-md inline-flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <LogIn className="w-4 h-4 text-amber-300" />
                      <span>{isSubmitting ? 'Verifying Devotee...' : 'Login'}</span>
                    </button>

                    {/* Dedicated Register Button: Register */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setOnboardingEmail(identifierInput.includes('@') ? identifierInput.trim() : '');
                          setOnboardingMobile(/^\d{10}$/.test(identifierInput.trim()) ? identifierInput.trim() : '');
                          setShowOnboarding(true);
                        }}
                        className="w-full py-2.5 px-4 rounded-xl border-2 border-dashed border-amber-400 bg-amber-50/70 hover:bg-amber-100 text-stone-900 font-bold text-xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                      >
                        <UserPlus className="w-4 h-4 text-[#991B1B]" />
                        <span>Register</span>
                      </button>
                    </div>

                    {/* Divider */}
                    <div className="relative flex items-center justify-center my-2">
                      <div className="border-t border-stone-200 w-full" />
                      <span className="bg-white px-2.5 text-[10px] text-stone-400 uppercase tracking-wider font-semibold">
                        Or 1-click Google login
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
                      <span>{loadingGoogle ? 'Signing in with Google...' : 'Sign in with Google'}</span>
                    </button>
                  </form>
                )}

                <div className="pt-2 border-t border-stone-100 flex items-center justify-center gap-2 text-stone-400 text-xs text-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span>Secure devotee portal &bull; Eldorado Kannadigara Balaga</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Devotee Registration / Onboarding Modal */}
      {showOnboarding && (
        <UserProfileOnboardingModal
          email={onboardingEmail}
          initialMobile={onboardingMobile}
          settings={settings}
          onComplete={handleOnboardingComplete}
          onCancel={() => setShowOnboarding(false)}
        />
      )}

      {/* Thank You dialog upon successful registration */}
      {showThankYou && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-amber-400 rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto border border-emerald-300">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            
            <h3 className="text-xl font-serif font-black text-stone-900 leading-snug">
              Thank You for Registering!
            </h3>
            
            <p className="text-xs text-stone-600 leading-relaxed">
              Welcome, <strong className="text-stone-900">{showThankYou.name}</strong>! Your profile (Flat {showThankYou.flat}) has been registered securely in our devotee database.
            </p>

            {mailDeliveryFailed ? (
              <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-left text-xs text-amber-950">
                <p className="leading-relaxed font-semibold">
                  Your profile is registered but pending email verification.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-amber-50/70 border border-amber-300/80 rounded-xl text-left text-[11px] text-amber-950 space-y-1">
                <span className="font-bold flex items-center gap-1 text-amber-900">
                  <Mail className="w-3.5 h-3.5 text-[#991B1B]" />
                  <span>Verification Link Sent</span>
                </span>
                <p className="leading-relaxed">
                  We have sent a secure sign-in / verification link to <strong className="font-semibold text-stone-900">{showThankYou.email}</strong>. Please check your inbox (and spam folder) and click the link to verify your email.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={handleThankYouConfirm}
              className="w-full py-3 bg-[#991B1B] hover:bg-[#7F1D1D] text-white font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-md cursor-pointer transition-colors"
            >
              Proceed to Devotee Portal
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center text-xs text-stone-400 py-3.5 px-4 border-t border-stone-200/60 bg-white shrink-0">
        {cleanOrgName(settings.org, 'Eldorado Ganeshotsava 2026')} &bull; Ganeshotsava 2026
      </footer>
    </div>
  );
};
