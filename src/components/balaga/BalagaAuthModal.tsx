import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  User as UserIcon,
  LogOut,
  LogIn,
  UserPlus,
  RefreshCw,
  Loader2,
  Lock,
  Mail,
  PhoneCall
} from 'lucide-react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  firebaseSignOut,
  cloudRegisterUser,
  cloudLoginUser,
  cloudRequestPasswordResetOtp,
  cloudResetPasswordWithOtp,
  cloudResetPassword,
  type User
} from '../../lib/firebase';
import { UserProfile } from '../../types';

interface BalagaAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onUserChange: (user: User | null, profile?: UserProfile | null) => void;
  allowedEmails: string[];
  onUpdateAllowedEmails: (emails: string[]) => void;
  isAdmin: boolean;
}

export const BalagaAuthModal: React.FC<BalagaAuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChange,
  allowedEmails,
  onUpdateAllowedEmails,
  isAdmin
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>('login');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Login inputs
  const [loginQuery, setLoginQuery] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register inputs
  const [regName, setRegName] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Reset inputs
  const [resetStep, setResetStep] = useState<'request' | 'verify'>('request');
  const [resetQuery, setResetQuery] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [maskedTargetEmail, setMaskedTargetEmail] = useState('');
  const [resetPassword, setResetPassword] = useState('');

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      if (auth) {
        const result = await signInWithPopup(auth, googleProvider);
        const email = result.user.email || '';
        const userProf: UserProfile = {
          email: email.toLowerCase(),
          name: result.user.displayName || email.split('@')[0],
          mobile: '',
          flat: '',
          role: email.toLowerCase() === 'desaisachin95@gmail.com' ? 'admin' : 'viewer',
          status: 'verified',
          createdAt: new Date().toISOString()
        };
        onUserChange(result.user, userProf);
        onClose();
      } else {
        throw new Error('Firebase Auth unavailable');
      }
    } catch (err: any) {
      setError('Google Sign-in popup was blocked or closed. Please try Mobile/Email & Password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      if (auth) await firebaseSignOut(auth);
    } catch (e) {
      console.warn(e);
    }
    onUserChange(null, null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginQuery.trim() || !loginPassword) {
      setError('Please enter Email/Mobile and Password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const prof = await cloudLoginUser(loginQuery, loginPassword);
      const syntheticUser = {
        uid: `db_${prof.email.replace(/[^a-z0-9]/g, '_')}`,
        email: prof.email,
        displayName: prof.name
      } as unknown as User;

      onUserChange(syntheticUser, prof);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regMobile.trim() || !regEmail.trim() || !regPassword) {
      setError('All fields (Name, Mobile, Email, Password) are mandatory.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const prof = await cloudRegisterUser({
        name: regName,
        mobile: regMobile,
        email: regEmail,
        flat: '',
        password: regPassword
      });

      const syntheticUser = {
        uid: `db_${prof.email.replace(/[^a-z0-9]/g, '_')}`,
        email: prof.email,
        displayName: prof.name
      } as unknown as User;

      onUserChange(syntheticUser, prof);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetQuery.trim()) {
      setError('Please enter registered Email or Mobile number.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await cloudRequestPasswordResetOtp(resetQuery, 'Eldorado Kannadigara Balaga');
      setMaskedTargetEmail(res.maskedEmail);
      setResetStep('verify');
      setSuccessMsg(`Verification code sent! Dispatched to ${res.maskedEmail}. Please check your inbox.`);
    } catch (err: any) {
      setError(err?.message || 'No user profile found matching this Email or Mobile number.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetOtp.trim() || resetOtp.trim().length !== 6) {
      setError('Please enter the 6-digit verification code sent to your registered email.');
      return;
    }

    if (!resetPassword) {
      setError('Please enter your new password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await cloudResetPasswordWithOtp(resetQuery, resetOtp, resetPassword);
      setSuccessMsg('Password updated successfully! Please sign in with your new password.');
      setResetStep('request');
      setResetOtp('');
      setResetPassword('');
      setTimeout(() => {
        setActiveTab('login');
        setSuccessMsg(null);
      }, 2000);
    } catch (err: any) {
      setError(err?.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-red-600 dark:border-stone-800 relative animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto text-stone-900 dark:text-stone-100">
        {/* Karnataka Flag Header Strip */}
        <div className="h-2 w-full rounded-t-xl bg-gradient-to-r from-red-600 via-red-500 to-amber-400 absolute top-0 left-0" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 dark:hover:text-white p-1 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-2 mb-5 mt-1">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-amber-500 p-0.5 mx-auto flex items-center justify-center shadow-xs overflow-hidden">
            <img
              src="/assets/aistudio/image_8b234ce0.png"
              alt="Goddess Bhuvaneshwari Devi & Kannada Flag"
              className="w-full h-full object-cover rounded-lg"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="inline-block bg-yellow-400/20 text-red-600 dark:text-yellow-400 border border-yellow-400/50 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
            ಕನ್ನಡಿಗರ ಬಳಗ
          </div>
          <h3 className="text-lg font-serif font-black text-red-700 dark:text-red-500">
            Kannadigara Balaga Portal
          </h3>
        </div>

        {/* Current Signed In status */}
        {currentUser ? (
          <div className="bg-amber-50 dark:bg-stone-800 border border-amber-300 dark:border-stone-700 rounded-xl p-4 mb-4 space-y-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-red-600 text-yellow-300 flex items-center justify-center font-bold">
                {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'U'}
              </div>
              <div className="overflow-hidden">
                <h4 className="font-bold text-stone-900 dark:text-stone-100 truncate">
                  {currentUser.displayName || 'Resident Member'}
                </h4>
                <p className="text-[11px] text-stone-600 dark:text-stone-300 truncate">{currentUser.email}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-amber-200 dark:border-stone-700">
              <span className="flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Signed In</span>
              </span>
              <button
                onClick={handleSignOut}
                className="text-red-700 dark:text-red-400 hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Navigation Tabs */}
            <div className="flex border-b border-stone-200 dark:border-stone-800 font-bold text-xs">
              <button
                onClick={() => {
                  setActiveTab('login');
                  setError(null);
                }}
                className={`flex-1 py-2 text-center border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'login' ? 'border-red-600 text-red-700 dark:text-yellow-400 font-black' : 'border-transparent text-stone-400'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setActiveTab('register');
                  setError(null);
                }}
                className={`flex-1 py-2 text-center border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'register' ? 'border-red-600 text-red-700 dark:text-yellow-400 font-black' : 'border-transparent text-stone-400'
                }`}
              >
                Register
              </button>
              <button
                onClick={() => {
                  setActiveTab('forgot');
                  setError(null);
                }}
                className={`flex-1 py-2 text-center border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'forgot' ? 'border-red-600 text-red-700 dark:text-yellow-400 font-black' : 'border-transparent text-stone-400'
                }`}
              >
                Forgot Password
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                {successMsg}
              </div>
            )}

            {/* TAB: LOGIN */}
            {activeTab === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold mb-1 text-stone-800 dark:text-stone-200">Email or Mobile *</label>
                  <input
                    type="text"
                    required
                    placeholder="Registered email or 10-digit mobile"
                    value={loginQuery}
                    onChange={(e) => setLoginQuery(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-xl outline-none focus:border-red-600 dark:focus:border-yellow-400 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-stone-800 dark:text-stone-200">Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-xl outline-none focus:border-red-600 dark:focus:border-yellow-400 font-medium"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-yellow-300 font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                  <span>Sign In</span>
                </button>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full py-2 px-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 font-bold text-stone-700 dark:text-stone-200 cursor-pointer inline-flex items-center justify-center gap-2"
                  >
                    <span>Google Sign-In</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB: REGISTER */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold mb-1 text-stone-800 dark:text-stone-200">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Full name"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-xl outline-none focus:border-red-600 dark:focus:border-yellow-400 font-medium"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold mb-1 text-stone-800 dark:text-stone-200">Mobile *</label>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit mobile"
                      value={regMobile}
                      onChange={(e) => setRegMobile(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-xl outline-none focus:border-red-600 dark:focus:border-yellow-400 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1 text-stone-800 dark:text-stone-200">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-xl outline-none focus:border-red-600 dark:focus:border-yellow-400 font-medium"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold mb-1 text-stone-800 dark:text-stone-200">Create Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Password (min 6 chars)"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-xl outline-none focus:border-red-600 dark:focus:border-yellow-400 font-medium"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-yellow-300 font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  <span>Register Account</span>
                </button>
              </form>
            )}

            {/* TAB: FORGOT PASSWORD */}
            {activeTab === 'forgot' && (
              <div className="space-y-3 text-xs">
                {resetStep === 'request' ? (
                  <form onSubmit={handleRequestResetOtp} className="space-y-3">
                    <p className="text-stone-600 dark:text-stone-300 text-xs">
                      Enter your registered Email or Mobile number. A 6-digit verification code will be sent to your registered email address.
                    </p>
                    <div>
                      <label className="block font-bold mb-1 text-stone-800 dark:text-stone-200">Registered Email or Mobile *</label>
                      <input
                        type="text"
                        required
                        placeholder="Enter email or 10-digit mobile"
                        value={resetQuery}
                        onChange={(e) => setResetQuery(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-xl outline-none focus:border-red-600 dark:focus:border-yellow-400 font-medium"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading || !resetQuery.trim()}
                      className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-yellow-300 font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                      <span>Send Code to Email</span>
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleResetSubmit} className="space-y-3">
                    <div className="p-3 bg-amber-50 dark:bg-stone-800 border border-amber-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 text-xs space-y-1">
                      <span className="font-bold block">✓ Verification Code Dispatched!</span>
                      <p className="text-[11px] leading-relaxed">
                        A 6-digit verification code has been dispatched to <strong>{maskedTargetEmail}</strong>. Please check your email inbox or spam folder and enter the code below.
                      </p>
                    </div>
                    <div>
                      <label className="block font-bold mb-1 text-stone-800 dark:text-stone-200">6-Digit Code Received on Email *</label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="e.g. 123456"
                        value={resetOtp}
                        onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-xl outline-none text-center font-mono font-black text-lg tracking-[4px]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1 text-stone-800 dark:text-stone-200">New Password *</label>
                      <input
                        type="password"
                        required
                        placeholder="New password (min 6 chars)"
                        value={resetPassword}
                        onChange={(e) => setResetPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-xl outline-none focus:border-red-600 dark:focus:border-yellow-400 font-medium"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading || resetOtp.length !== 6 || !resetPassword}
                      className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-yellow-300 font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                      <span>Verify Code &amp; Save Password</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setResetStep('request');
                        setResetOtp('');
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      className="w-full py-1 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 text-xs font-semibold underline text-center cursor-pointer"
                    >
                      Resend Code / Change Query
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
