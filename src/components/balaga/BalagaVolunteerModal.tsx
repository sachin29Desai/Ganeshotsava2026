import React, { useState } from 'react';
import { X, HeartHandshake, CheckCircle2, AlertTriangle, ShieldCheck, Mail, PhoneCall } from 'lucide-react';
import { type User } from '../../lib/firebase';

interface BalagaVolunteerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onOpenAuth: () => void;
}

export const BalagaVolunteerModal: React.FC<BalagaVolunteerModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenAuth
}) => {
  const [volunteerForm, setVolunteerForm] = useState({
    name: '',
    phone: '',
    towerFlat: '',
    festival: 'Sri Ganesha Chaturthi (14-18 Sep 2026)',
    department: 'Pooja Rituals & Mahaprasada Seva',
    availability: 'All festival evenings (5 PM - 10 PM)'
  });
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border-2 border-red-600 relative animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Karnataka Flag Header Strip */}
        <div className="h-2 w-full rounded-t-xl bg-gradient-to-r from-red-600 via-red-500 to-amber-400 absolute top-0 left-0" />

        <button
          onClick={() => {
            onClose();
            setSubmitted(false);
          }}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="space-y-1.5 mb-5 mt-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-red-900 text-[10px] font-bold uppercase tracking-wider border border-amber-300">
            <HeartHandshake className="w-3.5 h-3.5 text-red-600" />
            <span>ಕನ್ನಡಿಗರ ಬಳಗ ಸ್ವಯಂಸೇವಕರು</span>
          </div>
          <h3 className="text-xl font-serif font-black text-stone-900">
            Balaga Volunteer Registration
          </h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            Support Sri Ganesha Chaturthi (14–18 Sep 2026) &amp; Karnataka Rajyotsava (01 Nov 2026).
          </p>
        </div>

        {/* GATE: Must be signed in with Gmail */}
        {!currentUser ? (
          <div className="bg-amber-50 border-2 border-dashed border-amber-300 rounded-2xl p-6 text-center space-y-4 my-2">
            <div className="w-12 h-12 rounded-full bg-red-600 text-yellow-300 mx-auto flex items-center justify-center shadow-xs">
              <Mail className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-stone-900">
                Gmail Sign-in Required to Volunteer
              </h4>
              <p className="text-xs text-stone-600 max-w-sm mx-auto leading-relaxed">
                To coordinate volunteer teams, duty schedules, and share WhatsApp group links securely,
                please sign in with your Gmail account first.
              </p>
            </div>
            <button
              onClick={onOpenAuth}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-yellow-300 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center gap-2"
            >
              <Mail className="w-4 h-4 text-yellow-300" />
              <span>Sign in with Gmail</span>
            </button>
          </div>
        ) : submitted ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h4 className="text-base font-bold text-emerald-900">ಧನ್ಯವಾದಗಳು! Volunteer Enrolled!</h4>
            <p className="text-xs text-emerald-700 leading-relaxed max-w-md mx-auto">
              You are officially registered for{' '}
              <strong>{volunteerForm.department}</strong>.
              The Balaga volunteer coordination lead will reach out to you on WhatsApp.
            </p>

            <div className="pt-2">
              <a
                href="https://chat.whatsapp.com/"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl inline-flex items-center gap-2 shadow-xs"
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
                className="px-4 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {/* Signed-in badge */}
            <div className="flex items-center justify-between bg-stone-50 border border-stone-200 px-3 py-2 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-[11px] text-stone-600">
                  Signed in: <strong className="text-stone-900">{currentUser.email}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={onOpenAuth}
                className="text-[11px] text-red-600 font-bold hover:underline"
              >
                Switch
              </button>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Your Full Name *</label>
              <input
                type="text"
                required
                placeholder="Full name"
                defaultValue={currentUser.displayName || ''}
                value={volunteerForm.name || currentUser.displayName || ''}
                onChange={(e) => setVolunteerForm({ ...volunteerForm, name: e.target.value })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:bg-white focus:border-red-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-stone-700 mb-1">WhatsApp Phone *</label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit number"
                  value={volunteerForm.phone}
                  onChange={(e) => setVolunteerForm({ ...volunteerForm, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:bg-white focus:border-red-600"
                />
              </div>
              <div>
                <label className="block font-bold text-stone-700 mb-1">Tower &amp; Flat *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Feldspar-1102"
                  value={volunteerForm.towerFlat}
                  onChange={(e) => setVolunteerForm({ ...volunteerForm, towerFlat: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:bg-white focus:border-red-600"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Celebration *</label>
              <select
                value={volunteerForm.festival}
                onChange={(e) => setVolunteerForm({ ...volunteerForm, festival: e.target.value })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:bg-white focus:border-red-600"
              >
                <option>Sri Ganesha Chaturthi (14-18 Sep 2026)</option>
                <option>Karnataka Rajyotsava (01 Nov 2026)</option>
                <option>Both Celebrations</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Preferred Volunteer Team *</label>
              <select
                value={volunteerForm.department}
                onChange={(e) => setVolunteerForm({ ...volunteerForm, department: e.target.value })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:bg-white focus:border-red-600"
              >
                <option>Pooja Rituals &amp; Mahaprasada Seva</option>
                <option>Stage, Lights &amp; Cultural Coordination</option>
                <option>Flower Decoration &amp; Hall Setup</option>
                <option>Crowd Management &amp; Devotee Hospitality</option>
                <option>Media, Live Stream &amp; Photography</option>
                <option>Seva Tokens &amp; Financial Accounting Counters</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Availability</label>
              <select
                value={volunteerForm.availability}
                onChange={(e) => setVolunteerForm({ ...volunteerForm, availability: e.target.value })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:bg-white focus:border-red-600"
              >
                <option>All festival evenings (5 PM - 10 PM)</option>
                <option>Morning Pooja hours (8 AM - 1 PM)</option>
                <option>Full day support</option>
                <option>Visarjana procession day (18 Sep)</option>
                <option>Weekends / Flexible</option>
              </select>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-yellow-300 font-bold transition-colors cursor-pointer shadow-xs"
              >
                Confirm Volunteer Enrollment
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
