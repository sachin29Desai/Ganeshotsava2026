import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, AlertCircle, User as UserIcon, LogOut, Plus, Trash2 } from 'lucide-react';
import { auth, googleProvider, signInWithPopup, firebaseSignOut, type User } from '../../lib/firebase';

interface BalagaAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onUserChange: (user: User | null) => void;
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newEmailInput, setNewEmailInput] = useState('');

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      if (auth) {
        const result = await signInWithPopup(auth, googleProvider);
        onUserChange(result.user);
        onClose();
      } else {
        throw new Error('Firebase Auth unavailable in current environment');
      }
    } catch (err: unknown) {
      console.warn('Google popup error:', err);
      setError('Google Sign-in popup was blocked or closed. Please allow popups and complete sign in through your Gmail account.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      if (auth) {
        await firebaseSignOut(auth);
      }
    } catch (e) {
      console.warn(e);
    }
    onUserChange(null);
  };

  const handleAddAllowedEmail = () => {
    const email = newEmailInput.trim().toLowerCase();
    if (!email || !email.includes('@')) return;
    if (!allowedEmails.includes(email)) {
      onUpdateAllowedEmails([...allowedEmails, email]);
      setNewEmailInput('');
    }
  };

  const handleRemoveAllowedEmail = (emailToRemove: string) => {
    onUpdateAllowedEmails(allowedEmails.filter((e) => e !== emailToRemove));
  };

  const userEmail = currentUser?.email?.toLowerCase() || '';
  const isEmailAllowed = allowedEmails.map((e) => e.toLowerCase()).includes(userEmail);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-red-600 relative animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Karnataka Flag Header Strip */}
        <div className="h-2 w-full rounded-t-xl bg-gradient-to-r from-red-600 via-red-500 to-amber-400 absolute top-0 left-0" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand */}
        <div className="text-center space-y-2 mb-6 mt-1">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-amber-500 p-2 mx-auto flex items-center justify-center shadow-xs">
            <img
              src="/lord_ganesha.svg"
              alt="Logo"
              className="w-full h-full object-contain filter invert"
              referrerPolicy="no-referrer"
            />
          </div>
          <h3 className="text-xl font-serif font-black text-red-900">
            ಎಲ್ ಡೊರಾಡೊ ಕನ್ನಡಿಗರ ಬಳಗ
          </h3>
          <p className="text-xs text-stone-600">
            Sign in with Gmail for Volunteer Access &amp; Balaga Portal
          </p>
        </div>

        {/* Current User Status */}
        {currentUser ? (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 mb-6 space-y-3">
            <div className="flex items-center gap-3">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || ''}
                  className="w-10 h-10 rounded-full border border-amber-400"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-red-600 text-yellow-300 flex items-center justify-center font-bold font-serif">
                  {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'U'}
                </div>
              )}
              <div className="overflow-hidden">
                <h4 className="text-xs font-bold text-stone-900 truncate">
                  {currentUser.displayName || 'Resident Member'}
                </h4>
                <p className="text-[11px] text-stone-600 truncate">{currentUser.email}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-amber-200 text-xs">
              <span className="flex items-center gap-1 font-bold text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Signed In with Gmail</span>
              </span>
              <button
                onClick={handleSignOut}
                className="text-red-700 hover:text-red-900 font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl border-2 border-stone-300 hover:border-red-600 hover:bg-stone-50 font-bold text-xs text-stone-800 transition-all shadow-xs inline-flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
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
              <span>{loading ? 'Connecting with Gmail...' : 'Sign in with Gmail'}</span>
            </button>

            {error && (
              <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                {error}
              </p>
            )}

            <p className="text-[11px] text-center text-stone-500 leading-relaxed">
              Login is exclusively enabled through Gmail to verify verified residency and committee volunteer status.
            </p>
          </div>
        )}

        {/* Admin Manage Allowed Logins Section */}
        {isAdmin && (
          <div className="border-t border-stone-200 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-red-600" />
                <span>Admin: Approved Gmail Logins List</span>
              </span>
              <span className="text-[10px] bg-red-100 text-red-800 font-bold px-1.5 py-0.5 rounded">
                {allowedEmails.length} permitted
              </span>
            </div>
            <p className="text-[11px] text-stone-500">
              Only approved Gmails can access committee admin tools. Add resident emails below:
            </p>

            <div className="flex gap-2">
              <input
                type="email"
                placeholder="new.admin@gmail.com"
                value={newEmailInput}
                onChange={(e) => setNewEmailInput(e.target.value)}
                className="flex-1 text-xs px-3 py-1.5 border border-stone-300 rounded-lg outline-none focus:border-red-600"
              />
              <button
                onClick={handleAddAllowedEmail}
                className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs rounded-lg inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            <div className="max-h-32 overflow-y-auto space-y-1.5 pt-1">
              {allowedEmails.map((email) => (
                <div
                  key={email}
                  className="flex items-center justify-between bg-stone-50 px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs"
                >
                  <span className="font-mono text-stone-700 text-[11px] truncate">{email}</span>
                  {allowedEmails.length > 1 && (
                    <button
                      onClick={() => handleRemoveAllowedEmail(email)}
                      className="text-stone-400 hover:text-red-600 p-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-stone-100 text-center">
          <p className="text-[10px] text-stone-400">
            Kannadigara Balaga Portal • Secured with Google Identity &amp; DPDP compliance
          </p>
        </div>
      </div>
    </div>
  );
};
