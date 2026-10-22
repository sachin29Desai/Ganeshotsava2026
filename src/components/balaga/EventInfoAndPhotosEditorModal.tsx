import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Image as ImageIcon,
  Calendar,
  MapPin,
  Coins,
  Receipt,
  TrendingUp,
  Save,
  CheckCircle2,
  Upload,
  Info,
  Sparkles
} from 'lucide-react';
import { CommunityEvent, GALLERY_PHOTOS, GalleryPhoto } from '../../data/communityData';

export interface EventCustomInfo {
  eventId: string;
  title?: string;
  kannadaTitle?: string;
  dateDisplay?: string;
  venue?: string;
  description?: string;
  detailsOverview?: string;
  totalIncome?: string;
  totalExpense?: string;
  netSurplus?: string;
  pendingReceivables?: string;
  auditNote?: string;
  photos?: GalleryPhoto[];
}

interface EventInfoAndPhotosEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: CommunityEvent[];
  selectedEventId: string;
  customInfos: Record<string, EventCustomInfo>;
  onSaveCustomInfo: (eventId: string, info: EventCustomInfo) => void;
  isDark?: boolean;
}

export const EventInfoAndPhotosEditorModal: React.FC<EventInfoAndPhotosEditorModalProps> = ({
  isOpen,
  onClose,
  events,
  selectedEventId: initialSelectedEventId,
  customInfos,
  onSaveCustomInfo,
  isDark = false
}) => {
  const [activeEventId, setActiveEventId] = useState<string>(initialSelectedEventId || events[0]?.id || 'ganesh-chaturthi-2026');

  const currentEvent = events.find((e) => e.id === activeEventId) || events[0];
  const existingCustom = customInfos[activeEventId] || {};

  // Local Form State
  const [title, setTitle] = useState(existingCustom.title || currentEvent?.title || '');
  const [kannadaTitle, setKannadaTitle] = useState(existingCustom.kannadaTitle || currentEvent?.kannadaTitle || '');
  const [dateDisplay, setDateDisplay] = useState(existingCustom.dateDisplay || currentEvent?.dateDisplay || '');
  const [venue, setVenue] = useState(existingCustom.venue || currentEvent?.venue || '');
  const [description, setDescription] = useState(existingCustom.description || currentEvent?.description || '');
  const [detailsOverview, setDetailsOverview] = useState(existingCustom.detailsOverview || currentEvent?.detailsOverview || '');
  
  // Financials
  const [totalIncome, setTotalIncome] = useState(existingCustom.totalIncome || '₹ 7,34,333');
  const [totalExpense, setTotalExpense] = useState(existingCustom.totalExpense || '₹ 6,19,706.96');
  const [netSurplus, setNetSurplus] = useState(existingCustom.netSurplus || '₹ 1,14,626.04');
  const [pendingReceivables, setPendingReceivables] = useState(existingCustom.pendingReceivables || '₹ 35,000');
  const [auditNote, setAuditNote] = useState(existingCustom.auditNote || 'Formal expense audit completed and accounts published.');

  // Photos List
  const defaultEventPhotos = GALLERY_PHOTOS.filter(
    (p) => p.celebration.toLowerCase().includes(currentEvent?.festival?.toLowerCase() || '') || p.year === currentEvent?.year
  );
  const [photos, setPhotos] = useState<GalleryPhoto[]>(
    existingCustom.photos || (defaultEventPhotos.length > 0 ? defaultEventPhotos : GALLERY_PHOTOS.slice(0, 4))
  );

  // New Photo State
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoTitle, setNewPhotoTitle] = useState('');
  const [newPhotoCaption, setNewPhotoCaption] = useState('');
  const [newPhotoTag, setNewPhotoTag] = useState(currentEvent?.festival || 'Highlight');

  // Handle Event Change
  const handleSelectEvent = (id: string) => {
    setActiveEventId(id);
    const ev = events.find((e) => e.id === id);
    const custom = customInfos[id] || {};

    setTitle(custom.title || ev?.title || '');
    setKannadaTitle(custom.kannadaTitle || ev?.kannadaTitle || '');
    setDateDisplay(custom.dateDisplay || ev?.dateDisplay || '');
    setVenue(custom.venue || ev?.venue || '');
    setDescription(custom.description || ev?.description || '');
    setDetailsOverview(custom.detailsOverview || ev?.detailsOverview || '');
    
    setTotalIncome(custom.totalIncome || (ev?.festival === 'Ganesha Chaturthi' ? '₹ 7,34,333' : '₹ 1,65,000'));
    setTotalExpense(custom.totalExpense || (ev?.festival === 'Ganesha Chaturthi' ? '₹ 6,19,706.96' : '₹ 1,20,000'));
    setNetSurplus(custom.netSurplus || (ev?.festival === 'Ganesha Chaturthi' ? '₹ 1,14,626.04' : '₹ 45,000'));
    setPendingReceivables(custom.pendingReceivables || (ev?.festival === 'Ganesha Chaturthi' ? '₹ 35,000' : '₹ 0'));
    setAuditNote(custom.auditNote || 'Formal expense audit completed and accounts published.');

    const defaultPhotos = GALLERY_PHOTOS.filter(
      (p) => p.celebration.toLowerCase().includes(ev?.festival?.toLowerCase() || '') || p.year === ev?.year
    );
    setPhotos(custom.photos || (defaultPhotos.length > 0 ? defaultPhotos : GALLERY_PHOTOS.slice(0, 4)));
  };

  const handleAddPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhotoUrl.trim()) return;

    const newPhoto: GalleryPhoto = {
      id: `photo_${Date.now()}`,
      title: newPhotoTitle.trim() || 'Festival Moment',
      celebration: currentEvent?.title || 'Community Event',
      year: currentEvent?.year || 2026,
      tag: newPhotoTag || 'Gallery',
      imageUrl: newPhotoUrl.trim(),
      caption: newPhotoCaption.trim() || 'Captured during celebrations'
    };

    setPhotos((prev) => [newPhoto, ...prev]);
    setNewPhotoUrl('');
    setNewPhotoTitle('');
    setNewPhotoCaption('');
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSave = () => {
    const updatedInfo: EventCustomInfo = {
      eventId: activeEventId,
      title,
      kannadaTitle,
      dateDisplay,
      venue,
      description,
      detailsOverview,
      totalIncome,
      totalExpense,
      netSurplus,
      pendingReceivables,
      auditNote,
      photos
    };

    onSaveCustomInfo(activeEventId, updatedInfo);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div
        className={`relative w-full max-w-3xl my-8 rounded-3xl border-2 shadow-2xl overflow-hidden transition-all ${
          isDark ? 'bg-stone-900 border-stone-800 text-stone-100' : 'bg-white border-stone-200 text-stone-900'
        }`}
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-red-900 via-amber-900 to-red-900 text-white flex items-center justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 bg-yellow-400 text-stone-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Admin / Committee Manager</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-black">
              Edit Event Photos &amp; Template Info
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* 1. Event Selection Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Select Event to Customize
            </label>
            <select
              value={activeEventId}
              onChange={(e) => handleSelectEvent(e.target.value)}
              className={`w-full p-3 rounded-xl border font-bold text-sm cursor-pointer ${
                isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-stone-50 border-stone-300 text-stone-900'
              }`}
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} ({ev.dateDisplay}) [{ev.status.toUpperCase()}]
                </option>
              ))}
            </select>
          </div>

          {/* 2. Basic Event Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-500">Event Title (English)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full p-2.5 rounded-xl border text-xs font-medium ${
                  isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-stone-50 border-stone-300 text-stone-900'
                }`}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-500">Kannada Title</label>
              <input
                type="text"
                value={kannadaTitle}
                onChange={(e) => setKannadaTitle(e.target.value)}
                className={`w-full p-2.5 rounded-xl border text-xs font-medium ${
                  isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-stone-50 border-stone-300 text-stone-900'
                }`}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-500">Date Display Range</label>
              <input
                type="text"
                value={dateDisplay}
                onChange={(e) => setDateDisplay(e.target.value)}
                className={`w-full p-2.5 rounded-xl border text-xs font-medium ${
                  isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-stone-50 border-stone-300 text-stone-900'
                }`}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-500">Venue Location</label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className={`w-full p-2.5 rounded-xl border text-xs font-medium ${
                  isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-stone-50 border-stone-300 text-stone-900'
                }`}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-500">Event Overview &amp; Highlights Description</label>
            <textarea
              rows={3}
              value={detailsOverview || description}
              onChange={(e) => {
                setDetailsOverview(e.target.value);
                setDescription(e.target.value);
              }}
              className={`w-full p-2.5 rounded-xl border text-xs font-medium ${
                isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-stone-50 border-stone-300 text-stone-900'
              }`}
            />
          </div>

          {/* 3. Financial Overview (For Past Events) */}
          {currentEvent?.status === 'archived' && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
              <div className="flex items-center gap-2 font-bold text-xs text-amber-800 dark:text-yellow-400">
                <Coins className="w-4 h-4 text-amber-600" />
                <span>Financial Overview Figures (Past Event Template)</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] text-stone-500 font-bold uppercase block">Total Income</label>
                  <input
                    type="text"
                    value={totalIncome}
                    onChange={(e) => setTotalIncome(e.target.value)}
                    className="w-full p-2 rounded-lg border text-xs font-bold bg-white dark:bg-stone-800"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-stone-500 font-bold uppercase block">Total Expense</label>
                  <input
                    type="text"
                    value={totalExpense}
                    onChange={(e) => setTotalExpense(e.target.value)}
                    className="w-full p-2 rounded-lg border text-xs font-bold bg-white dark:bg-stone-800"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-stone-500 font-bold uppercase block">Net Surplus</label>
                  <input
                    type="text"
                    value={netSurplus}
                    onChange={(e) => setNetSurplus(e.target.value)}
                    className="w-full p-2 rounded-lg border text-xs font-bold bg-white dark:bg-stone-800"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-stone-500 font-bold uppercase block">Pending Receivables</label>
                  <input
                    type="text"
                    value={pendingReceivables}
                    onChange={(e) => setPendingReceivables(e.target.value)}
                    className="w-full p-2 rounded-lg border text-xs font-bold bg-white dark:bg-stone-800"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. Event Photos Manager */}
          <div className="space-y-4 pt-2 border-t border-stone-200 dark:border-stone-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <ImageIcon className="w-4 h-4 text-red-600" />
                <span>Event Gallery Photos ({photos.length})</span>
              </div>
            </div>

            {/* Add New Photo Form */}
            <form onSubmit={handleAddPhoto} className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 space-y-3">
              <span className="text-xs font-bold text-red-600 block">Add New Event Photo</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="url"
                  placeholder="Photo Image URL (https://...)"
                  value={newPhotoUrl}
                  onChange={(e) => setNewPhotoUrl(e.target.value)}
                  className="p-2 rounded-lg border text-xs bg-white dark:bg-stone-900"
                  required
                />
                <input
                  type="text"
                  placeholder="Photo Title (e.g., Grand Alankara)"
                  value={newPhotoTitle}
                  onChange={(e) => setNewPhotoTitle(e.target.value)}
                  className="p-2 rounded-lg border text-xs bg-white dark:bg-stone-900"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Caption or description"
                  value={newPhotoCaption}
                  onChange={(e) => setNewPhotoCaption(e.target.value)}
                  className="flex-1 p-2 rounded-lg border text-xs bg-white dark:bg-stone-900"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-yellow-300 font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Photo</span>
                </button>
              </div>
            </form>

            {/* Current Photos Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((photo) => (
                <div key={photo.id} className="relative rounded-xl border overflow-hidden group bg-stone-950">
                  <img
                    src={photo.imageUrl}
                    alt={photo.title}
                    className="w-full h-24 object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-2 flex flex-col justify-end text-white">
                    <span className="text-[10px] font-bold truncate">{photo.title}</span>
                  </div>
                  <button
                    onClick={() => handleRemovePhoto(photo.id)}
                    className="absolute top-1.5 right-1.5 p-1 bg-red-600/90 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Remove photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-stone-50 dark:bg-stone-950 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border text-xs font-bold text-stone-600 dark:text-stone-300 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-yellow-300 font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center gap-2 border border-yellow-400"
          >
            <Save className="w-4 h-4" />
            <span>Save Event Details &amp; Photos</span>
          </button>
        </div>
      </div>
    </div>
  );
};
