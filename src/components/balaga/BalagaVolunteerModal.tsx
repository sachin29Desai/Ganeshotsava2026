import React, { useState, useEffect } from 'react';
import { X, HeartHandshake, CheckCircle2, AlertTriangle, ShieldCheck, Mail, PhoneCall, Loader2, Sparkles } from 'lucide-react';
import { type User, cloudSaveVolunteer } from '../../lib/firebase';
import { UserProfile, EventVolunteer } from '../../types';

interface BalagaVolunteerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  userProfile?: UserProfile | null;
  eventId?: string;
  eventTitle?: string;
  onOpenAuth?: () => void;
  onRequireLogin?: () => void;
  onVolunteerAdded?: () => void;
  isDark?: boolean;
}

export const BalagaVolunteerModal: React.FC<BalagaVolunteerModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  userProfile,
  eventId = 'karnataka-rajyotsava-2026',
  eventTitle = 'Karnataka Rajyotsava 2026',
  onOpenAuth,
  onRequireLogin,
  onVolunteerAdded,
  isDark = false
}) => {
  const [volunteerForm, setVolunteerForm] = useState({
    name: userProfile?.name || currentUser?.displayName || '',
    phone: userProfile?.mobile || '',
    email: userProfile?.email || currentUser?.email || '',
    towerFlat: userProfile?.flat || '',
    department: 'Pooja Rituals & Mahaprasada Seva',
    availability: 'All event hours (5 PM - 10 PM)'
  });

  // Sync state if userProfile or currentUser changes
  useEffect(() => {
    if (currentUser || userProfile) {
      setVolunteerForm((prev) => ({
        ...prev,
        name: prev.name || userProfile?.name || currentUser?.displayName || '',
        phone: prev.phone || userProfile?.mobile || '',
        email: prev.email || userProfile?.email || currentUser?.email || '',
        towerFlat: prev.towerFlat || userProfile?.flat || ''
      }));
    }
  }, [currentUser, userProfile]);

  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!volunteerForm.name.trim() || !volunteerForm.phone.trim() || !volunteerForm.towerFlat.trim()) {
      setError('Please fill in Name, Phone, and Tower/Flat.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const volObj: EventVolunteer = {
        id: 'vol_' + Date.now(),
        eventId: eventId,
        eventTitle: eventTitle,
        name: volunteerForm.name.trim(),
        email: volunteerForm.email.trim() || currentUser?.email || '',
        mobile: volunteerForm.phone.trim(),
        flat: volunteerForm.towerFlat.trim(),
        department: volunteerForm.department,
        availability: volunteerForm.availability,
        createdAt: new Date().toISOString()
      };

      await cloudSaveVolunteer(volObj);
      setSubmitted(true);
      if (onVolunteerAdded) onVolunteerAdded();
    } catch (err: any) {
      console.error('Failed to register volunteer:', err);
      setError('Could not register volunteer. Please check network connectivity.');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = `w-full px-3.5 py-2.5 rounded-xl border outline-none font-medium transition-colors ${
    isDark
      ? 'bg-stone-800 border-stone-700 text-stone-100 placeholder-stone-400 focus:bg-stone-900 focus:border-red-500'
      : 'bg-stone-50 border-stone-200 text-stone-900 placeholder-stone-400 focus:bg-white focus:border-red-600'
  }`;

  const labelStyle = `block font-bold mb-1 text-xs ${isDark ? 'text-stone-200' : 'text-stone-700'}`;

  const optionStyle = isDark ? 'bg-stone-900 text-stone-100' : 'bg-white text-stone-900';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        className={`rounded-2xl max-w-lg w-full p-6 shadow-2xl border-2 relative animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto transition-colors ${
          isDark ? 'bg-stone-900 border-stone-700 text-stone-100' : 'bg-white border-red-600 text-stone-900'
        }`}
      >
        {/* Karnataka Flag Header Strip */}
        <div className="h-2 w-full rounded-t-xl bg-gradient-to-r from-red-600 via-red-500 to-amber-400 absolute top-0 left-0" />

        <button
          onClick={() => {
            onClose();
            setSubmitted(false);
          }}
          className={`absolute top-4 right-4 p-1 cursor-pointer transition-colors ${
            isDark ? 'text-stone-400 hover:text-stone-200' : 'text-stone-400 hover:text-stone-700'
          }`}
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title Header */}
        <div className="space-y-1.5 mb-5 mt-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-red-900 text-[10px] font-bold uppercase tracking-wider border border-amber-300">
            <HeartHandshake className="w-3.5 h-3.5 text-red-600" />
            <span>ಕನ್ನಡಿಗರ ಬಳಗ ಸ್ವಯಂಸೇವಕರು</span>
          </div>
          <h3 className={`text-xl font-serif font-black ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
            Volunteer Enrolment for {eventTitle}
          </h3>
          <p className={`text-xs leading-relaxed ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
            Registered volunteers receive team badges, WhatsApp group invite, and seva assignments for {eventTitle}.
          </p>
        </div>

        {/* Form Body */}
        {submitted ? (
          <div
            className={`border rounded-xl p-6 text-center space-y-3 ${
              isDark
                ? 'bg-emerald-950/50 border-emerald-800 text-emerald-200'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h4 className="text-base font-bold text-emerald-600 dark:text-emerald-300">
              ಧನ್ಯವಾದಗಳು! Volunteer Enrolled for {eventTitle}!
            </h4>
            <p className="text-xs leading-relaxed max-w-md mx-auto opacity-90">
              You are officially registered under <strong>{volunteerForm.department}</strong>. Your name is added to the event roster.
            </p>

            <div className="pt-2">
              <a
                href="https://chat.whatsapp.com/EAkzlpnwF0G9Xc8nenA8JY?mode=gi_t"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl inline-flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Join Balaga Volunteer WhatsApp Group</span>
              </a>
            </div>

            <div className="pt-3">
              <button
                onClick={() => {
                  onClose();
                  setSubmitted(false);
                }}
                className={`px-4 py-1.5 font-bold text-xs rounded-lg cursor-pointer ${
                  isDark ? 'bg-stone-800 hover:bg-stone-700 text-stone-200' : 'bg-stone-100 hover:bg-stone-200 text-stone-800'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {error && (
              <div
                className={`p-3 rounded-xl border text-xs font-semibold ${
                  isDark
                    ? 'bg-red-950/60 border-red-800 text-red-300'
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}
              >
                {error}
              </div>
            )}

            <div>
              <label className={labelStyle}>Your Full Name *</label>
              <input
                type="text"
                required
                placeholder="Full name"
                value={volunteerForm.name}
                onChange={(e) => setVolunteerForm({ ...volunteerForm, name: e.target.value })}
                className={inputStyle}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelStyle}>WhatsApp Mobile *</label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit mobile number"
                  value={volunteerForm.phone}
                  onChange={(e) => setVolunteerForm({ ...volunteerForm, phone: e.target.value })}
                  className={inputStyle}
                />
              </div>
              <div>
                <label className={labelStyle}>Tower &amp; Flat *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Feldspar-1102"
                  value={volunteerForm.towerFlat}
                  onChange={(e) => setVolunteerForm({ ...volunteerForm, towerFlat: e.target.value })}
                  className={inputStyle}
                />
              </div>
            </div>

            <div>
              <label className={labelStyle}>Event Target *</label>
              <input
                type="text"
                disabled
                value={eventTitle}
                className={`w-full px-3.5 py-2.5 border rounded-xl font-bold cursor-not-allowed ${
                  isDark
                    ? 'bg-stone-800/80 border-stone-700 text-amber-300'
                    : 'bg-stone-100 border-stone-200 text-stone-800'
                }`}
              />
            </div>

            <div>
              <label className={labelStyle}>Preferred Seva / Volunteer Team *</label>
              <select
                value={volunteerForm.department}
                onChange={(e) => setVolunteerForm({ ...volunteerForm, department: e.target.value })}
                className={inputStyle}
              >
                <option className={optionStyle}>Pooja Rituals &amp; Mahaprasada Seva</option>
                <option className={optionStyle}>Stage, Lights &amp; Cultural Coordination</option>
                <option className={optionStyle}>Flower Decoration &amp; Hall Setup</option>
                <option className={optionStyle}>Crowd Management &amp; Devotee Hospitality</option>
                <option className={optionStyle}>Media, Live Stream &amp; Photography</option>
                <option className={optionStyle}>Seva Tokens &amp; Financial Accounting Counters</option>
              </select>
            </div>

            <div>
              <label className={labelStyle}>Availability</label>
              <select
                value={volunteerForm.availability}
                onChange={(e) => setVolunteerForm({ ...volunteerForm, availability: e.target.value })}
                className={inputStyle}
              >
                <option className={optionStyle}>All event hours (5 PM - 10 PM)</option>
                <option className={optionStyle}>Morning hours (8 AM - 1 PM)</option>
                <option className={optionStyle}>Full day support</option>
                <option className={optionStyle}>Flexible / As needed</option>
              </select>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-yellow-300 font-bold transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-2 border border-yellow-400 text-xs"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Confirm Volunteer Enrolment for {eventTitle}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
