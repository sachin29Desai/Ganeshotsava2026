import React, { useState } from 'react';
import {
  Lock,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  UserPlus,
  LogIn,
  RefreshCw,
  PhoneCall,
  Mail,
  User as UserIcon,
  Home,
  Loader2,
  Eye,
  EyeOff,
  KeyRound
} from 'lucide-react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  cloudRegisterUser,
  cloudLoginUser,
  cloudRequestPasswordResetOtp,
  cloudResetPasswordWithOtp,
  cloudResetPassword,
  type User
} from '../../lib/firebase';
import { AppSettings, UserProfile } from '../../types';

interface BalagaLoginViewProps {
  settings: AppSettings;
  currentUser: User | null;
  allowedEmails: string[];
  onUserChange: (user: User | null, profile?: UserProfile | null) => void;
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
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>('login');

  // Loading & Feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Show/Hide Password Toggle
  const [showPassword, setShowPassword] = useState(false);

  // Form Inputs for Login
  const [loginQuery, setLoginQuery] = useState(''); // Email or Mobile
  const [loginPassword, setLoginPassword] = useState('');

  // Form Inputs for Registration (Mandatory: Name, Mobile, Email, Password)
  const [regName, setRegName] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Form Inputs for Secure OTP-Verified Forgot Password
  const [resetStep, setResetStep] = useState<'request' | 'verify'>('request');
  const [resetQuery, setResetQuery] = useState(''); // Email or Mobile
  const [resetOtp, setResetOtp] = useState('');
  const [maskedTargetEmail, setMaskedTargetEmail] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');

  // 1. Google Sign-in Handler
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      if (auth) {
        const result = await signInWithPopup(auth, googleProvider);
        const email = result.user.email || '';
        
        // Ensure user profile in Firestore
        const isSuperAdmin = email.toLowerCase() === 'desaisachin95@gmail.com';
        const userProf: UserProfile = {
          email: email.toLowerCase(),
          name: result.user.displayName || email.split('@')[0],
          mobile: '',
          flat: '',
          role: isSuperAdmin ? 'admin' : 'viewer',
          status: 'verified',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        onUserChange(result.user, userProf);
        onNavigateHome();
      } else {
        throw new Error('Firebase Auth unavailable');
      }
    } catch (err: any) {
      console.warn('Google sign in error:', err);
      setError('Google Sign-in popup was blocked or closed. Please try signing in with Mobile/Email & Password.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Mobile / Email + Password Login Handler
  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginQuery.trim() || !loginPassword) {
      setError('Please enter your registered Email or Mobile number and Password.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const profile = await cloudLoginUser(loginQuery, loginPassword);
      
      const syntheticUser = {
        uid: `db_${profile.email.replace(/[^a-z0-9]/g, '_')}`,
        email: profile.email,
        displayName: profile.name,
        photoURL: profile.photoUrl || null
      } as unknown as User;

      onUserChange(syntheticUser, profile);
      setSuccessMsg(`Welcome back, ${profile.name}! Signed in successfully.`);
      setTimeout(() => onNavigateHome(), 1000);
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // 3. User Registration Handler (Mandatory: Name, Mobile, Email, Password)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!regName.trim() || !regMobile.trim() || !regEmail.trim() || !regPassword) {
      setError('Full Name, Mobile Number, Email Address, and Password are all required.');
      return;
    }

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match. Please re-enter identical passwords.');
      return;
    }

    setLoading(true);

    try {
      const newProfile = await cloudRegisterUser({
        name: regName,
        mobile: regMobile,
        email: regEmail,
        flat: '',
        password: regPassword
      });

      const syntheticUser = {
        uid: `db_${newProfile.email.replace(/[^a-z0-9]/g, '_')}`,
        email: newProfile.email,
        displayName: newProfile.name,
        photoURL: null
      } as unknown as User;

      onUserChange(syntheticUser, newProfile);
      setSuccessMsg('Registration Successful! Account created.');
      setTimeout(() => onNavigateHome(), 1200);
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 4a. Forgot Password - Step 1: Dispatch Verification Code
  const handleRequestResetOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!resetQuery.trim()) {
      setError('Please enter your registered Email or Mobile number.');
      return;
    }

    setLoading(true);

    try {
      const res = await cloudRequestPasswordResetOtp(resetQuery, settings.org);
      setMaskedTargetEmail(res.maskedEmail);
      setResetStep('verify');
      setSuccessMsg(`✓ Verification code sent! A 6-digit code has been sent to ${res.maskedEmail}. Please enter the code from your inbox below.`);
    } catch (err: any) {
      setError(err?.message || 'Could not find account matching this Email or Mobile number.');
    } finally {
      setLoading(false);
    }
  };

  // 4b. Forgot Password - Step 2: Verify OTP & Save New Password
  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!resetOtp.trim() || resetOtp.trim().length !== 6) {
      setError('Please enter the 6-digit verification code sent to your registered email.');
      return;
    }

    if (!resetPassword) {
      setError('Please enter your new password.');
      return;
    }

    if (resetPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (resetPassword !== resetConfirmPassword) {
      setError('Passwords do not match. Please verify your new password.');
      return;
    }

    setLoading(true);

    try {
      const updatedProf = await cloudResetPasswordWithOtp(resetQuery, resetOtp, resetPassword);
      setSuccessMsg(`✓ Password for ${updatedProf.name} updated successfully! You can now sign in with your new password.`);
      setResetPassword('');
      setResetConfirmPassword('');
      setResetOtp('');
      setResetStep('request');
      setTimeout(() => {
        setActiveTab('login');
        setLoginQuery(resetQuery);
        setSuccessMsg(null);
      }, 2500);
    } catch (err: any) {
      setError(err?.message || 'Password update failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col justify-between font-sans selection:bg-red-600 selection:text-yellow-200 ${
        isDark ? 'bg-stone-950 text-stone-100' : 'bg-[#FFFDF7] text-stone-900'
      }`}
    >
      {/* Karnataka Flag Dual Color Stripe */}
      <div className="w-full flex flex-col z-50">
        <div className="h-2.5 bg-[#DC2626] w-full" />
        <div className="h-2.5 bg-[#FBBF24] w-full" />
      </div>

      {/* Main Form Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 my-4">
        <div
          className={`w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border-2 transition-all ${
            isDark ? 'bg-stone-900/95 border-stone-800 text-stone-100' : 'bg-white border-stone-200 text-stone-900'
          }`}
        >
          {/* Top Return Button */}
          <button
            onClick={onNavigateHome}
            className={`text-xs font-semibold inline-flex items-center gap-1.5 mb-6 transition-colors cursor-pointer ${
              isDark ? 'text-stone-300 hover:text-white' : 'text-stone-600 hover:text-red-700'
            }`}
          >
            <ArrowLeft className="w-4 h-4 text-red-600" />
            <span>Return Home</span>
          </button>

          {/* Logo & Header */}
          <div className="text-center space-y-2 mb-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-red-600 via-red-600 to-amber-500 p-0.5 flex items-center justify-center shadow-md border-2 border-yellow-400 overflow-hidden">
              <img
                src="/assets/aistudio/image_8b234ce0.png"
                alt="Goddess Bhuvaneshwari Devi & Kannada Flag"
                className="w-full h-full object-cover rounded-xl"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="inline-block bg-yellow-400/20 text-red-600 dark:text-yellow-400 border border-yellow-400/50 text-[11px] font-black uppercase px-3 py-0.5 rounded-full tracking-wider">
              ಕನ್ನಡಿಗರ ಬಳಗ
            </div>

            <h1 className="text-2xl font-serif font-black tracking-tight text-red-700 dark:text-red-500">
              Kannadigara Balaga Portal
            </h1>
          </div>

          {/* Currently Signed In Indicator */}
          {currentUser && (
            <div
              className={`p-4 rounded-2xl border mb-6 flex items-center justify-between gap-3 text-xs ${
                isDark
                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-200'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold block">Currently Signed In:</span>
                  <span className="truncate block max-w-[200px]">{currentUser.email || currentUser.displayName}</span>
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

          {/* Sub-Tab Navigation: Login vs Register vs Forgot Password */}
          <div className="flex border-b border-stone-200 dark:border-stone-800 mb-6 font-bold text-xs">
            <button
              onClick={() => {
                setActiveTab('login');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2.5 text-center border-b-2 transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 ${
                activeTab === 'login'
                  ? 'border-red-600 text-red-700 dark:text-yellow-400 font-black'
                  : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('register');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2.5 text-center border-b-2 transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 ${
                activeTab === 'register'
                  ? 'border-red-600 text-red-700 dark:text-yellow-400 font-black'
                  : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('forgot');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2.5 text-center border-b-2 transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 ${
                activeTab === 'forgot'
                  ? 'border-red-600 text-red-700 dark:text-yellow-400 font-black'
                  : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Forgot Password</span>
            </button>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div
              className={`p-3.5 rounded-xl border mb-6 text-xs flex items-start gap-2 ${
                isDark ? 'bg-red-950/70 border-red-800 text-red-200' : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div
              className={`p-3.5 rounded-xl border mb-6 text-xs flex items-start gap-2 ${
                isDark ? 'bg-emerald-950/70 border-emerald-800 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: SIGN IN */}
          {activeTab === 'login' && (
            <div className="space-y-5">
              <form onSubmit={handleCredentialLogin} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold mb-1 text-stone-800 dark:text-stone-200">
                    Email Address or Mobile Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter registered email or 10-digit mobile"
                    value={loginQuery}
                    onChange={(e) => setLoginQuery(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border outline-none font-medium ${
                      isDark
                        ? 'bg-stone-800 border-stone-600 text-stone-100 placeholder-stone-400 focus:border-yellow-400'
                        : 'bg-white border-stone-300 text-stone-900 placeholder-stone-400 focus:border-red-600'
                    }`}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-stone-800 dark:text-stone-200">Password *</label>
                    <button
                      type="button"
                      onClick={() => setActiveTab('forgot')}
                      className="text-[11px] text-red-600 dark:text-yellow-400 hover:underline font-bold"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border outline-none pr-10 font-medium ${
                        isDark
                          ? 'bg-stone-800 border-stone-600 text-stone-100 placeholder-stone-400 focus:border-yellow-400'
                          : 'bg-white border-stone-300 text-stone-900 placeholder-stone-400 focus:border-red-600'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700 dark:hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-yellow-300 font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                  <span>Sign In</span>
                </button>
              </form>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-stone-200 dark:border-stone-800"></div>
                <span className="flex-shrink mx-3 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  Or Sign In With
                </span>
                <div className="flex-grow border-t border-stone-200 dark:border-stone-800"></div>
              </div>

              {/* Google Sign-In */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs border-2 transition-all cursor-pointer shadow-xs inline-flex items-center justify-center gap-2.5 ${
                  isDark
                    ? 'bg-stone-800 border-stone-700 text-stone-100 hover:bg-stone-750 hover:border-yellow-400'
                    : 'bg-white border-stone-300 text-stone-800 hover:bg-stone-50 hover:border-red-600'
                }`}
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google / Gmail</span>
              </button>
            </div>
          )}

          {/* TAB 2: REGISTER NEW ACCOUNT (Mandatory: Name, Mobile, Email, Password) */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold mb-1 text-stone-800 dark:text-stone-200">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border outline-none font-medium ${
                    isDark
                      ? 'bg-stone-800 border-stone-600 text-stone-100 placeholder-stone-400 focus:border-yellow-400'
                      : 'bg-white border-stone-300 text-stone-900 placeholder-stone-400 focus:border-red-600'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-stone-800 dark:text-stone-200">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile number"
                    value={regMobile}
                    onChange={(e) => setRegMobile(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border outline-none font-medium ${
                      isDark
                        ? 'bg-stone-800 border-stone-600 text-stone-100 placeholder-stone-400 focus:border-yellow-400'
                        : 'bg-white border-stone-300 text-stone-900 placeholder-stone-400 focus:border-red-600'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-stone-800 dark:text-stone-200">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border outline-none font-medium ${
                      isDark
                        ? 'bg-stone-800 border-stone-600 text-stone-100 placeholder-stone-400 focus:border-yellow-400'
                        : 'bg-white border-stone-300 text-stone-900 placeholder-stone-400 focus:border-red-600'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-stone-800 dark:text-stone-200">
                    Create Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border outline-none font-medium ${
                      isDark
                        ? 'bg-stone-800 border-stone-600 text-stone-100 placeholder-stone-400 focus:border-yellow-400'
                        : 'bg-white border-stone-300 text-stone-900 placeholder-stone-400 focus:border-red-600'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-stone-800 dark:text-stone-200">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Repeat password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border outline-none font-medium ${
                      isDark
                        ? 'bg-stone-800 border-stone-600 text-stone-100 placeholder-stone-400 focus:border-yellow-400'
                        : 'bg-white border-stone-300 text-stone-900 placeholder-stone-400 focus:border-red-600'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-yellow-300 font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                <span>Register Account</span>
              </button>
            </form>
          )}

          {/* TAB 3: FORGOT PASSWORD */}
          {activeTab === 'forgot' && (
            <div className="space-y-4 text-xs">
              {resetStep === 'request' ? (
                <form onSubmit={handleRequestResetOtpSubmit} className="space-y-4">
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                    Enter your registered Email or Mobile number. A <strong>6-digit verification code</strong> will be sent to the registered email address associated with your account to verify your identity.
                  </p>

                  <div>
                    <label className="block font-bold mb-1 text-stone-800 dark:text-stone-200">
                      Registered Email or Mobile Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter email or 10-digit mobile"
                      value={resetQuery}
                      onChange={(e) => setResetQuery(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border outline-none font-medium ${
                        isDark
                          ? 'bg-stone-800 border-stone-600 text-stone-100 placeholder-stone-400 focus:border-yellow-400'
                          : 'bg-white border-stone-300 text-stone-900 placeholder-stone-400 focus:border-red-600'
                      }`}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !resetQuery.trim()}
                    className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-yellow-300 font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                    <span>Send Magic Access Link to Email</span>
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100 space-y-2 text-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                    <span className="font-extrabold text-sm block">📩 Magic Access Link Dispatched!</span>
                    <p className="text-xs leading-relaxed">
                      A secure portal access link has been sent to <strong>{maskedTargetEmail}</strong>.
                    </p>
                    <p className="text-[11px] text-stone-600 dark:text-stone-300 pt-1">
                      Please check your email inbox or spam folder and click the link to automatically access your account or reset your password.
                    </p>
                  </div>

                  <form onSubmit={handlePasswordResetSubmit} className="space-y-3 pt-2">
                    <p className="text-[11px] font-bold text-stone-600 dark:text-stone-300">
                      Or set a new password directly below:
                    </p>
                    <div>
                      <label className="block font-bold mb-1 text-stone-800 dark:text-stone-200">
                        New Password *
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Enter new password (min 6 chars)"
                        value={resetPassword}
                        onChange={(e) => setResetPassword(e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl border outline-none font-medium ${
                          isDark
                            ? 'bg-stone-800 border-stone-600 text-stone-100 placeholder-stone-400 focus:border-yellow-400'
                            : 'bg-white border-stone-300 text-stone-900 placeholder-stone-400 focus:border-red-600'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block font-bold mb-1 text-stone-800 dark:text-stone-200">
                        Confirm New Password *
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Confirm new password"
                        value={resetConfirmPassword}
                        onChange={(e) => setResetConfirmPassword(e.target.value)}
                        className={`w-full px-3.5 py-2.5 rounded-xl border outline-none font-medium ${
                          isDark
                            ? 'bg-stone-800 border-stone-600 text-stone-100 placeholder-stone-400 focus:border-yellow-400'
                            : 'bg-white border-stone-300 text-stone-900 placeholder-stone-400 focus:border-red-600'
                        }`}
                      />
                    </div>

                    <div className="space-y-2 pt-1">
                      <button
                        type="submit"
                        disabled={loading || !resetPassword}
                        className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-yellow-300 font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                        <span>Save New Password</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setResetStep('request');
                          setResetOtp('');
                          setError(null);
                          setSuccessMsg(null);
                        }}
                        className="w-full py-2 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 text-xs font-semibold underline text-center cursor-pointer"
                      >
                        Resend Magic Access Link
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer disclaimer */}
      <footer className="text-center py-4 text-[11px] text-stone-500">
        <span>© 2024–2026 Eldorado Kannadigara Balaga • DPDP Act 2023 Compliant Data Security</span>
      </footer>
    </div>
  );
};
