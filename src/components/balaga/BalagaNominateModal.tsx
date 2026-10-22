import React, { useState } from 'react';
import { X, Sparkles, CheckCircle2 } from 'lucide-react';
import { type User } from '../../lib/firebase';

interface BalagaNominateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User | null;
  onOpenAuth?: () => void;
  isDark?: boolean;
}

export const BalagaNominateModal: React.FC<BalagaNominateModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenAuth,
  isDark = false
}) => {
  const [form, setForm] = useState({
    performerName: '',
    ageGroup: 'Children (5-12 yrs)',
    towerFlat: '',
    festival: 'Sri Ganesha Chaturthi (14-18 Sep)',
    actType: 'Solo Dance (Classical / Semi-Classical)',
    phone: '',
    songDetails: '',
    duration: '4-5 minutes'
  });
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const inputStyle = `w-full px-3.5 py-2.5 rounded-xl border outline-none font-medium transition-colors ${
    isDark
      ? 'bg-stone-800 border-stone-700 text-stone-100 placeholder-stone-400 focus:bg-stone-900 focus:border-yellow-400'
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

        <div className="space-y-1.5 mb-5 mt-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-red-900 text-[10px] font-bold uppercase tracking-wider border border-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-red-600" />
            <span>ಸಾಂಸ್ಕೃತಿಕ ವೇದಿಕೆ ನೋಂದಣಿ</span>
          </div>
          <h3 className={`text-xl font-serif font-black ${isDark ? 'text-stone-100' : 'text-stone-900'}`}>
            Nominate a Cultural Stage Act
          </h3>
          <p className={`text-xs leading-relaxed ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
            Showcase your talent in dance, devotional music, Yakshagana, drama, or slokas.
          </p>
        </div>

        {submitted ? (
          <div
            className={`border rounded-xl p-6 text-center space-y-3 ${
              isDark
                ? 'bg-emerald-950/50 border-emerald-800 text-emerald-200'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h4 className="text-base font-bold text-emerald-600 dark:text-emerald-300">Nomination Submitted!</h4>
            <p className="text-xs leading-relaxed max-w-md mx-auto opacity-90">
              The Balaga Cultural Committee will review the slot timings and contact you on WhatsApp for the rehearsal and performance schedule.
            </p>
            <button
              onClick={() => {
                onClose();
                setSubmitted(false);
              }}
              className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-yellow-300 font-bold text-xs rounded-xl cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className={labelStyle}>Performer / Group Name *</label>
              <input
                type="text"
                required
                placeholder="Name of participant(s)"
                value={form.performerName}
                onChange={(e) => setForm({ ...form, performerName: e.target.value })}
                className={inputStyle}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelStyle}>Festival Stage *</label>
                <select
                  value={form.festival}
                  onChange={(e) => setForm({ ...form, festival: e.target.value })}
                  className={inputStyle}
                >
                  <option className={optionStyle}>Sri Ganesha Chaturthi (14-18 Sep)</option>
                  <option className={optionStyle}>Karnataka Rajyotsava (01 Nov)</option>
                </select>
              </div>
              <div>
                <label className={labelStyle}>Age Category *</label>
                <select
                  value={form.ageGroup}
                  onChange={(e) => setForm({ ...form, ageGroup: e.target.value })}
                  className={inputStyle}
                >
                  <option className={optionStyle}>Children (5-12 yrs)</option>
                  <option className={optionStyle}>Youth (13-20 yrs)</option>
                  <option className={optionStyle}>Adults &amp; Seniors</option>
                  <option className={optionStyle}>Family / Mixed Group</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelStyle}>Performance Category *</label>
              <select
                value={form.actType}
                onChange={(e) => setForm({ ...form, actType: e.target.value })}
                className={inputStyle}
              >
                <option className={optionStyle}>Solo Dance (Classical / Semi-Classical / Folk)</option>
                <option className={optionStyle}>Group Dance</option>
                <option className={optionStyle}>Kannada Bhavageethe / Devotional Vocal</option>
                <option className={optionStyle}>Yakshagana / Dollu Kunitha Snippet</option>
                <option className={optionStyle}>Instrumental (Keyboard, Flute, Violin, Tabla)</option>
                <option className={optionStyle}>Sloka Chanting / Kannada Vachanas</option>
                <option className={optionStyle}>Drama / Skit</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelStyle}>Tower &amp; Flat *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jasper-804"
                  value={form.towerFlat}
                  onChange={(e) => setForm({ ...form, towerFlat: e.target.value })}
                  className={inputStyle}
                />
              </div>
              <div>
                <label className={labelStyle}>WhatsApp Phone *</label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit number"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={inputStyle}
                />
              </div>
            </div>

            <div>
              <label className={labelStyle}>Song Title / Theme &amp; Duration</label>
              <input
                type="text"
                placeholder="e.g. Ganesha Stuti Bharatanatyam (approx 4 mins)"
                value={form.songDetails}
                onChange={(e) => setForm({ ...form, songDetails: e.target.value })}
                className={inputStyle}
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold transition-colors cursor-pointer shadow-xs text-xs"
              >
                Submit Cultural Nomination
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
