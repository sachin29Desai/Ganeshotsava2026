import React from 'react';
import { X, ShieldCheck, FileText, Lock, CheckCircle2, Cookie } from 'lucide-react';

interface BalagaPolicyModalsProps {
  activeModal: 'privacy' | 'terms' | 'refund' | 'cookies' | null;
  onClose: () => void;
  isDark?: boolean;
}

export const BalagaPolicyModals: React.FC<BalagaPolicyModalsProps> = ({
  activeModal,
  onClose,
  isDark = false
}) => {
  if (!activeModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div
        className={`rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border-2 border-red-600 relative animate-in fade-in zoom-in-95 max-h-[85vh] overflow-y-auto ${
          isDark ? 'bg-stone-900 text-stone-100' : 'bg-white text-stone-900'
        }`}
      >
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-1.5 rounded-lg transition-colors cursor-pointer ${
            isDark
              ? 'text-stone-400 hover:text-white hover:bg-stone-800'
              : 'text-stone-400 hover:text-stone-900 hover:bg-stone-100'
          }`}
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {activeModal === 'privacy' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 border-b border-red-600/30 pb-3">
              <ShieldCheck className="w-6 h-6 text-red-600" />
              <div>
                <h3 className="text-xl font-serif font-black text-red-600">
                  Privacy Policy &amp; DPDP Act Compliance
                </h3>
                <p className="text-xs text-amber-700 font-semibold">
                  Eldorado Kannadigara Balaga • Digital Personal Data Protection Act, 2023
                </p>
              </div>
            </div>

            <div
              className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                isDark
                  ? 'bg-red-950/40 border-red-800 text-red-200'
                  : 'bg-red-50 border-red-200 text-red-950'
              }`}
            >
              <strong>Data Fiduciary Notice:</strong> Eldorado Kannadigara Balaga is a non-profit resident
              cultural association at Brigade El Dorado, Bengaluru. We adhere strictly to the Digital
              Personal Data Protection (DPDP) Act, 2023 enacted by the Parliament of India.
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <h4 className="font-bold text-sm text-stone-800 dark:text-stone-200">
                1. Purpose of Data Collection
              </h4>
              <p className={isDark ? 'text-stone-300' : 'text-stone-600'}>
                We collect personal identifiers such as resident name, apartment tower &amp; flat number,
                email address (via Google OAuth / Gmail sign-in), and voluntary donation transaction
                references solely for the purpose of:
              </p>
              <ul
                className={`list-disc pl-5 space-y-1 ${
                  isDark ? 'text-stone-300' : 'text-stone-600'
                }`}
              >
                <li>Issuing official digital Devotee Contribution Receipts and Seva Token numbers.</li>
                <li>Verifying resident volunteer rosters and assigning festival seva responsibilities.</li>
                <li>Transmitting important festival announcements and pooja schedule notifications.</li>
              </ul>

              <h4 className="font-bold text-sm text-stone-800 dark:text-stone-200">
                2. Explicit Consent &amp; Consent Manager
              </h4>
              <p className={isDark ? 'text-stone-300' : 'text-stone-600'}>
                In accordance with Section 6 of the DPDP Act 2023, data is processed only after the user
                provides clear, unconditional, and informed affirmative consent through our interactive
                forms and Google sign-in prompts.
              </p>

              <h4 className="font-bold text-sm text-stone-800 dark:text-stone-200">
                3. No Commercial Sale or Third-Party Sharing
              </h4>
              <p className={isDark ? 'text-stone-300' : 'text-stone-600'}>
                We do not sell, rent, monetize, or disclose personal resident records to any commercial
                advertisers, marketing agencies, or outside vendors. Data is accessible solely to authorized
                Balaga cultural committee coordinators.
              </p>

              <h4 className="font-bold text-sm text-stone-800 dark:text-stone-200">
                4. Devotee Rights &amp; Grievance Redressal
              </h4>
              <p className={isDark ? 'text-stone-300' : 'text-stone-600'}>
                Residents hold the legal right to review their stored records, request rectification, or
                demand complete erasure of non-financial data upon festival conclusion by emailing our Data
                Protection Officer at{' '}
                <a
                  href="mailto:contact@kannadigarabalaga.org"
                  className="text-red-600 font-semibold underline"
                >
                  contact@kannadigarabalaga.org
                </a>
                .
              </p>
            </div>
          </div>
        )}

        {activeModal === 'terms' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 border-b border-red-600/30 pb-3">
              <FileText className="w-6 h-6 text-red-600" />
              <div>
                <h3 className="text-xl font-serif font-black text-red-600">Terms of Use</h3>
                <p className="text-xs text-amber-700 font-semibold">
                  Eldorado Kannadigara Balaga Community Platform
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <p className={isDark ? 'text-stone-300' : 'text-stone-600'}>
                Welcome to the official online portal of Eldorado Kannadigara Balaga. By using this website,
                you agree to comply with our community guidelines and code of conduct.
              </p>

              <h4 className="font-bold text-sm text-stone-800 dark:text-stone-200">
                1. Community Harmony &amp; Respect
              </h4>
              <p className={isDark ? 'text-stone-300' : 'text-stone-600'}>
                This platform is dedicated to promoting Kannada language, art, literature, and Vedic festive
                celebrations. All residents, irrespective of mother tongue or background, are warmly
                welcomed to participate. Vulgar, abusive, or divisive remarks are strictly prohibited.
              </p>

              <h4 className="font-bold text-sm text-stone-800 dark:text-stone-200">
                2. Voluntary Contributions &amp; Sevas
              </h4>
              <p className={isDark ? 'text-stone-300' : 'text-stone-600'}>
                All contributions toward Sri Ganesha Chaturthi, Karnataka Rajyotsava, and Anna Santharpane
                are 100% voluntary resident contributions. All funds are held in transparent festival
                ledgers audited by the Balaga core committee.
              </p>

              <h4 className="font-bold text-sm text-stone-800 dark:text-stone-200">
                3. Cultural Performance Rights
              </h4>
              <p className={isDark ? 'text-stone-300' : 'text-stone-600'}>
                Stage performance nominations are evaluated by the cultural subcommittee based on stage
                timing, age categories, and cultural thematic relevance to Kannada heritage.
              </p>
            </div>
          </div>
        )}

        {activeModal === 'refund' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 border-b border-red-600/30 pb-3">
              <Lock className="w-6 h-6 text-red-600" />
              <div>
                <h3 className="text-xl font-serif font-black text-red-600">
                  Refund &amp; Cancellation Policy
                </h3>
                <p className="text-xs text-amber-700 font-semibold">
                  Voluntary Religious &amp; Cultural Offerings
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <p className={isDark ? 'text-stone-300' : 'text-stone-600'}>
                All funds submitted through the Devotee Portal or Seva catalogue represent voluntary
                devotional offerings (Sevas) and resident festival contributions toward community
                decorations, pooja materials, sound/lights, stage setups, and Mahaprasada distribution.
              </p>

              <h4 className="font-bold text-sm text-stone-800 dark:text-stone-200">
                1. Non-Refundable Devotional Contributions
              </h4>
              <p className={isDark ? 'text-stone-300' : 'text-stone-600'}>
                Because festival supplies and Anna Santharpane groceries are purchased in advance, voluntary
                contributions are treated as non-refundable donations toward the celebration.
              </p>

              <h4 className="font-bold text-sm text-stone-800 dark:text-stone-200">
                2. Duplicate or Erroneous Transactions
              </h4>
              <p className={isDark ? 'text-stone-300' : 'text-stone-600'}>
                In the rare case of a double UPI transfer or mistaken duplicate payment, please email your UPI
                reference ID and flat number to{' '}
                <a
                  href="mailto:contact@kannadigarabalaga.org"
                  className="text-red-600 font-semibold underline"
                >
                  contact@kannadigarabalaga.org
                </a>
                . The committee accounts team will reconcile and issue a reversal within 5–7 banking days.
              </p>
            </div>
          </div>
        )}

        {activeModal === 'cookies' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 border-b border-red-600/30 pb-3">
              <Cookie className="w-6 h-6 text-amber-600" />
              <div>
                <h3 className="text-xl font-serif font-black text-red-600">Cookie Preferences</h3>
                <p className="text-xs text-amber-700 font-semibold">
                  Privacy-First Session Management
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <p className={isDark ? 'text-stone-300' : 'text-stone-600'}>
                Eldorado Kannadigara Balaga uses privacy-respecting client-side storage solely to maintain:
              </p>

              <div
                className={`p-3 rounded-xl border space-y-2 ${
                  isDark ? 'bg-stone-800/80 border-stone-700' : 'bg-stone-50 border-stone-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-stone-800 dark:text-stone-200">Essential Theme State:</strong>
                    <span className={isDark ? 'text-stone-400' : 'text-stone-600'}>
                      Remembers your Light/Dark mode choice across page navigations.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-stone-800 dark:text-stone-200">Authentication Token:</strong>
                    <span className={isDark ? 'text-stone-400' : 'text-stone-600'}>
                      Keeps you logged in via secure Firebase Google Session for volunteer roster access.
                    </span>
                  </div>
                </div>
              </div>

              <p className={isDark ? 'text-stone-400' : 'text-stone-500'}>
                We do NOT use cross-site tracking cookies, third-party advertising cookies, or behavioral
                profilers.
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-stone-200 dark:border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-yellow-300 font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
