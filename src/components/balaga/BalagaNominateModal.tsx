import React, { useState } from 'react';
import { X, Sparkles, CheckCircle2 } from 'lucide-react';
import { type User } from '../../lib/firebase';

interface BalagaNominateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onOpenAuth: () => void;
}

export const BalagaNominateModal: React.FC<BalagaNominateModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenAuth
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

        <div className="space-y-1.5 mb-5 mt-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-red-900 text-[10px] font-bold uppercase tracking-wider border border-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-red-600" />
            <span>ಸಾಂಸ್ಕೃತಿಕ ವೇದಿಕೆ ನೋಂದಣಿ</span>
          </div>
          <h3 className="text-xl font-serif font-black text-stone-900">
            Nominate a Cultural Stage Act
          </h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            Showcase your talent in dance, devotional music, Yakshagana, drama, or slokas.
          </p>
        </div>

        {submitted ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h4 className="text-base font-bold text-emerald-900">Nomination Submitted!</h4>
            <p className="text-xs text-emerald-700 leading-relaxed max-w-md mx-auto">
              The Balaga Cultural Committee will review the slot timings and contact you on WhatsApp for
              the rehearsal and performance schedule.
            </p>
            <button
              onClick={() => {
                onClose();
                setSubmitted(false);
              }}
              className="mt-2 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-yellow-300 font-bold text-xs rounded-lg cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-stone-700 mb-1">Performer / Group Name *</label>
              <input
                type="text"
                required
                placeholder="Name of participant(s)"
                value={form.performerName}
                onChange={(e) => setForm({ ...form, performerName: e.target.value })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:bg-white focus:border-red-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Festival Stage *</label>
                <select
                  value={form.festival}
                  onChange={(e) => setForm({ ...form, festival: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:bg-white focus:border-red-600"
                >
                  <option>Sri Ganesha Chaturthi (14-18 Sep)</option>
                  <option>Karnataka Rajyotsava (01 Nov)</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-stone-700 mb-1">Age Category *</label>
                <select
                  value={form.ageGroup}
                  onChange={(e) => setForm({ ...form, ageGroup: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:bg-white focus:border-red-600"
                >
                  <option>Children (5-12 yrs)</option>
                  <option>Youth (13-20 yrs)</option>
                  <option>Adults &amp; Seniors</option>
                  <option>Family / Mixed Group</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Performance Category *</label>
              <select
                value={form.actType}
                onChange={(e) => setForm({ ...form, actType: e.target.value })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:bg-white focus:border-red-600"
              >
                <option>Solo Dance (Classical / Semi-Classical / Folk)</option>
                <option>Group Dance</option>
                <option>Kannada Bhavageethe / Devotional Vocal</option>
                <option>Yakshagana / Dollu Kunitha Snippet</option>
                <option>Instrumental (Keyboard, Flute, Violin, Tabla)</option>
                <option>Sloka Chanting / Kannada Vachanas</option>
                <option>Drama / Skit</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Tower &amp; Flat *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jasper-804"
                  value={form.towerFlat}
                  onChange={(e) => setForm({ ...form, towerFlat: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:bg-white focus:border-red-600"
                />
              </div>
              <div>
                <label className="block font-bold text-stone-700 mb-1">WhatsApp Phone *</label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit number"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:bg-white focus:border-red-600"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">
                Song Title / Theme &amp; Duration
              </label>
              <input
                type="text"
                placeholder="e.g. Ganesha Stuti Bharatanatyam (approx 4 mins)"
                value={form.songDetails}
                onChange={(e) => setForm({ ...form, songDetails: e.target.value })}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:bg-white focus:border-red-600"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold transition-colors cursor-pointer shadow-xs"
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
