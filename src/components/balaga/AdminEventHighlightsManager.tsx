import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  X,
  CheckCircle2,
  Sparkles,
  Save,
  Loader2,
  FileText,
  Calendar,
  Layers,
  Edit2,
  CalendarPlus
} from 'lucide-react';
import { GalleryPhoto, COMMUNITY_EVENTS, CommunityEvent } from '../../data/communityData';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { getStoredEvents, saveStoredEvents } from '../../utils/eventUtils';

interface AdminEventHighlightsManagerProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
  onRefreshEvents?: () => void;
}

export const AdminEventHighlightsManager: React.FC<AdminEventHighlightsManagerProps> = ({
  isOpen,
  onClose,
  isDark = false,
  onRefreshEvents
}) => {
  const [activeTab, setActiveTab] = useState<'photos' | 'create-event'>('photos');
  const [allEvents, setAllEvents] = useState<CommunityEvent[]>(() => getStoredEvents());
  const [selectedEventId, setSelectedEventId] = useState<string>('ganesh-chaturthi-2026');
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // New photo form state
  const [newPhoto, setNewPhoto] = useState<{
    title: string;
    tag: string;
    imageUrl: string;
    caption: string;
    performanceType: string;
  }>({
    title: '',
    tag: 'Alankara & Pooja',
    imageUrl: '',
    caption: '',
    performanceType: ''
  });

  // Create event form state
  const [newEvent, setNewEvent] = useState<{
    title: string;
    kannadaTitle: string;
    festival: 'Ganesha Chaturthi' | 'Karnataka Rajyotsava' | 'Deepavali' | 'Makara Sankranti' | 'Ugadi';
    theme: string;
    startDate: string;
    endDate: string;
    dateDisplay: string;
    venue: string;
    description: string;
    detailsOverview: string;
    posterImage: string;
  }>({
    title: '',
    kannadaTitle: '',
    festival: 'Karnataka Rajyotsava',
    theme: '',
    startDate: '2026-11-21',
    endDate: '2026-11-22',
    dateDisplay: '21st & 22nd November 2026',
    venue: 'Grand Amphitheatre, Brigade El Dorado',
    description: '',
    detailsOverview: '',
    posterImage: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&w=1200&q=80'
  });

  const TAG_OPTIONS = [
    'Alankara & Pooja',
    'Mahaprasadam',
    'Procession & Chende',
    'Cultural Stage Show',
    'Folk Art & Dollu Kunitha',
    'Flag Hoisting',
    'Community Awards',
    'Eco Visarjana'
  ];

  // Reload events on mount or open
  useEffect(() => {
    if (isOpen) {
      setAllEvents(getStoredEvents());
    }
  }, [isOpen]);

  // Fetch photos for selected event from Firestore
  const loadHighlights = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'event_highlights'));
      const fetched: GalleryPhoto[] = [];
      snap.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() } as GalleryPhoto);
      });

      const currentEvt = allEvents.find((e) => e.id === selectedEventId || e.slug === selectedEventId);
      const filtered = fetched.filter(
        (p) =>
          p.celebration.toLowerCase().includes((currentEvt?.festival || '').toLowerCase()) ||
          p.year === currentEvt?.year
      );

      setPhotos(filtered);
    } catch (err) {
      console.warn('Could not load event highlights from Firestore:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadHighlights();
    }
  }, [isOpen, selectedEventId]);

  if (!isOpen) return null;

  const currentEvent = allEvents.find((e) => e.id === selectedEventId || e.slug === selectedEventId);

  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhoto.imageUrl.trim() || !newPhoto.title.trim()) {
      setToast({ msg: 'Please provide both an image URL and a photo title.', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      const photoId = 'h_' + Date.now();
      const photoDoc: GalleryPhoto = {
        id: photoId,
        title: newPhoto.title.trim(),
        celebration: currentEvent?.festival || 'Ganesha Chaturthi',
        year: currentEvent?.year || 2026,
        tag: newPhoto.tag || 'Highlights',
        imageUrl: newPhoto.imageUrl.trim(),
        caption: newPhoto.caption.trim(),
        performanceType: newPhoto.performanceType.trim()
      };

      await setDoc(doc(db, 'event_highlights', photoId), photoDoc);

      setPhotos((prev) => [photoDoc, ...prev]);
      setNewPhoto({
        title: '',
        tag: 'Alankara & Pooja',
        imageUrl: '',
        caption: '',
        performanceType: ''
      });

      setToast({ msg: 'Photo highlight added successfully!', type: 'success' });
      setTimeout(() => setToast(null), 3000);
      if (onRefreshEvents) onRefreshEvents();
    } catch (err: any) {
      console.error('Failed to save highlight:', err);
      setToast({ msg: 'Error saving photo: ' + (err?.message || String(err)), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Are you sure you want to delete this highlight photo?')) return;
    try {
      await deleteDoc(doc(db, 'event_highlights', photoId));
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      setToast({ msg: 'Photo highlight removed.', type: 'success' });
      setTimeout(() => setToast(null), 3000);
      if (onRefreshEvents) onRefreshEvents();
    } catch (err: any) {
      console.error('Failed to delete photo:', err);
      setToast({ msg: 'Error deleting photo: ' + (err?.message || String(err)), type: 'error' });
    }
  };

  const handleCreateEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title.trim() || !newEvent.startDate || !newEvent.endDate) {
      setToast({ msg: 'Please fill in Title, Start Date, and End Date.', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      const slug = newEvent.title.toLowerCase().replace(/[^a-z0-0]/g, '-').replace(/-+/g, '-');
      const eventId = `${slug}-${new Date().getFullYear()}`;
      
      const created: CommunityEvent = {
        id: eventId,
        slug,
        title: newEvent.title.trim(),
        kannadaTitle: newEvent.kannadaTitle.trim() || newEvent.title.trim(),
        festival: newEvent.festival,
        theme: newEvent.theme.trim() || 'Community Celebration',
        startDate: newEvent.startDate,
        endDate: newEvent.endDate,
        dateDisplay: newEvent.dateDisplay.trim() || `${newEvent.startDate} to ${newEvent.endDate}`,
        venue: newEvent.venue.trim(),
        status: newEvent.endDate < new Date().toISOString().split('T')[0] ? 'archived' : 'upcoming',
        volunteersCount: 25,
        actsCount: 10,
        description: newEvent.description.trim(),
        detailsOverview: newEvent.detailsOverview.trim() || newEvent.description.trim(),
        posterImage: newEvent.posterImage.trim(),
        year: parseInt(newEvent.startDate.split('-')[0]) || 2026
      };

      const updatedList = [created, ...allEvents];
      setAllEvents(updatedList);
      saveStoredEvents(updatedList);

      try {
        await setDoc(doc(db, 'community_events', eventId), created);
      } catch (fErr) {
        console.warn('Saved locally, firestore sync note:', fErr);
      }

      setToast({ msg: `New event "${created.title}" successfully created!`, type: 'success' });
      setSelectedEventId(eventId);
      setActiveTab('photos');
      setNewEvent({
        title: '',
        kannadaTitle: '',
        festival: 'Karnataka Rajyotsava',
        theme: '',
        startDate: '2026-11-21',
        endDate: '2026-11-22',
        dateDisplay: '21st & 22nd November 2026',
        venue: 'Grand Amphitheatre, Brigade El Dorado',
        description: '',
        detailsOverview: '',
        posterImage: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&w=1200&q=80'
      });

      if (onRefreshEvents) onRefreshEvents();
    } catch (err: any) {
      console.error('Failed to create event:', err);
      setToast({ msg: 'Failed to create event: ' + (err?.message || String(err)), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
      <div
        className={`rounded-3xl border-2 max-w-4xl w-full overflow-hidden shadow-2xl space-y-0 my-4 ${
          isDark ? 'bg-stone-900 border-stone-800 text-stone-100' : 'bg-white border-stone-200 text-stone-900'
        }`}
      >
        {/* Modal Header */}
        <div className="bg-red-700 text-white p-4 sm:p-5 flex items-center justify-between border-b border-yellow-400">
          <div className="flex items-center gap-2.5">
            <ImageIcon className="w-5 h-5 text-yellow-300" />
            <div>
              <h3 className="font-serif font-black text-base sm:text-lg text-yellow-200">
                Admin: Event Management &amp; Highlights Portal
              </h3>
              <p className="text-xs text-yellow-100">
                Create new events, upload photo highlights, and manage event metadata across the application.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Sub-Tabs */}
        <div className="bg-stone-950 text-white px-6 border-b border-stone-800 flex items-center gap-3">
          <button
            onClick={() => setActiveTab('photos')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer inline-flex items-center gap-2 ${
              activeTab === 'photos'
                ? 'border-yellow-400 text-yellow-300'
                : 'border-transparent text-stone-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Manage Photo Highlights</span>
          </button>

          <button
            onClick={() => setActiveTab('create-event')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer inline-flex items-center gap-2 ${
              activeTab === 'create-event'
                ? 'border-yellow-400 text-yellow-300'
                : 'border-transparent text-stone-400 hover:text-white'
            }`}
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Create New Community Event</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {toast && (
            <div
              className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
                toast.type === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-200'
                  : 'bg-red-50 border-red-300 text-red-800 dark:bg-red-950/60 dark:border-red-800 dark:text-red-200'
              }`}
            >
              <span>{toast.msg}</span>
              <button onClick={() => setToast(null)} className="text-xs underline font-bold cursor-pointer">
                Dismiss
              </button>
            </div>
          )}

          {activeTab === 'photos' && (
            <div className="space-y-6">
              {/* Select Event */}
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-stone-800/80 border border-amber-200 dark:border-stone-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 mb-1">
                    Select Event to Manage Photos
                  </label>
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className={`text-xs font-bold px-3 py-2 rounded-xl border outline-none cursor-pointer ${
                      isDark
                        ? 'bg-stone-900 border-stone-700 text-stone-100'
                        : 'bg-white border-stone-300 text-stone-900'
                    }`}
                  >
                    {allEvents.map((evt) => (
                      <option key={evt.id} value={evt.id}>
                        {evt.title} ({evt.year}) — [{evt.status.toUpperCase()}]
                      </option>
                    ))}
                  </select>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-stone-500 block">Event Period</span>
                  <span className="text-xs font-bold text-red-600 dark:text-yellow-400">
                    {currentEvent?.dateDisplay}
                  </span>
                </div>
              </div>

              {/* Add Photo Form */}
              <form
                onSubmit={handleAddPhoto}
                className={`p-5 rounded-2xl border-2 space-y-4 ${
                  isDark ? 'bg-stone-950 border-stone-800' : 'bg-stone-50 border-stone-200'
                }`}
              >
                <div className="flex items-center gap-2 border-b pb-2 border-stone-200 dark:border-stone-800">
                  <Plus className="w-4 h-4 text-red-600" />
                  <h4 className="font-serif font-bold text-sm">Add New Photo Highlight</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-1">Photo Title / Caption *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Grand Maha Mangalarathi & Floral Alankara"
                      value={newPhoto.title}
                      onChange={(e) => setNewPhoto({ ...newPhoto, title: e.target.value })}
                      className={`w-full text-xs px-3.5 py-2.5 rounded-xl border outline-none ${
                        isDark
                          ? 'bg-stone-900 border-stone-700 text-white focus:border-red-500'
                          : 'bg-white border-stone-300 text-stone-900 focus:border-red-600'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1">Image Direct URL *</label>
                    <input
                      type="url"
                      required
                      placeholder="https://images.unsplash.com/... or hosted image link"
                      value={newPhoto.imageUrl}
                      onChange={(e) => setNewPhoto({ ...newPhoto, imageUrl: e.target.value })}
                      className={`w-full text-xs px-3.5 py-2.5 rounded-xl border outline-none ${
                        isDark
                          ? 'bg-stone-900 border-stone-700 text-white focus:border-red-500'
                          : 'bg-white border-stone-300 text-stone-900 focus:border-red-600'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1">Tag / Category</label>
                    <select
                      value={newPhoto.tag}
                      onChange={(e) => setNewPhoto({ ...newPhoto, tag: e.target.value })}
                      className={`w-full text-xs px-3.5 py-2.5 rounded-xl border outline-none font-semibold ${
                        isDark
                          ? 'bg-stone-900 border-stone-700 text-white'
                          : 'bg-white border-stone-300 text-stone-900'
                      }`}
                    >
                      {TAG_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1">Sub-Caption (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Flower shower by resident families"
                      value={newPhoto.caption}
                      onChange={(e) => setNewPhoto({ ...newPhoto, caption: e.target.value })}
                      className={`w-full text-xs px-3.5 py-2.5 rounded-xl border outline-none ${
                        isDark
                          ? 'bg-stone-900 border-stone-700 text-white focus:border-red-500'
                          : 'bg-white border-stone-300 text-stone-900 focus:border-red-600'
                      }`}
                    />
                  </div>
                </div>

                {newPhoto.imageUrl.trim() && (
                  <div className="aspect-video max-h-40 rounded-xl overflow-hidden border border-stone-300 bg-stone-900 relative">
                    <img
                      src={newPhoto.imageUrl.trim()}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <span className="absolute bottom-2 left-2 text-[10px] bg-black/70 text-white px-2 py-0.5 rounded font-mono">
                      Live Preview
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 rounded-xl bg-red-700 hover:bg-red-800 disabled:opacity-50 text-yellow-300 font-bold text-xs shadow-sm transition-all cursor-pointer inline-flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Photo Highlight to Event Gallery</span>
                </button>
              </form>

              {/* Current Gallery List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif font-bold text-sm">
                    Current Highlights for {currentEvent?.title} ({photos.length})
                  </h4>
                  {loading && <Loader2 className="w-4 h-4 animate-spin text-red-600" />}
                </div>

                {photos.length === 0 ? (
                  <div className="p-6 rounded-2xl border text-center text-xs text-stone-500">
                    No custom highlights added for this event yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {photos.map((p) => (
                      <div
                        key={p.id}
                        className={`rounded-2xl border overflow-hidden shadow-xs relative group ${
                          isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                        }`}
                      >
                        <div className="aspect-video bg-stone-900 overflow-hidden relative">
                          <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                          <button
                            onClick={() => handleDeletePhoto(p.id)}
                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-600/90 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm"
                            title="Delete photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="p-3 space-y-1">
                          <span className="text-[10px] font-bold text-amber-600 uppercase block">{p.tag}</span>
                          <h5 className="font-bold text-xs truncate">{p.title}</h5>
                          {p.caption && <p className="text-[11px] text-stone-500 truncate">{p.caption}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'create-event' && (
            <form onSubmit={handleCreateEventSubmit} className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-stone-800/80 border border-amber-200 dark:border-stone-700">
                <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">
                  Create a New Community Event
                </h4>
                <p className="text-xs text-stone-600 dark:text-stone-300 mt-1">
                  Newly created events will automatically classify as Current, Upcoming, or Past on the Home Page and render under the Common Event Template.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">Event Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Deepavali Deepotsava 2026"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    className={`w-full text-xs px-3.5 py-2.5 rounded-xl border outline-none ${
                      isDark
                        ? 'bg-stone-900 border-stone-700 text-white'
                        : 'bg-white border-stone-300 text-stone-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">Kannada Title</label>
                  <input
                    type="text"
                    placeholder="e.g. ದೀಪಾವಳಿ ದೀಪೋತ್ಸವ ೨೦೨೬"
                    value={newEvent.kannadaTitle}
                    onChange={(e) => setNewEvent({ ...newEvent, kannadaTitle: e.target.value })}
                    className={`w-full text-xs px-3.5 py-2.5 rounded-xl border outline-none ${
                      isDark
                        ? 'bg-stone-900 border-stone-700 text-white'
                        : 'bg-white border-stone-300 text-stone-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">Festival Type</label>
                  <select
                    value={newEvent.festival}
                    onChange={(e) => setNewEvent({ ...newEvent, festival: e.target.value as any })}
                    className={`w-full text-xs px-3.5 py-2.5 rounded-xl border outline-none font-semibold ${
                      isDark
                        ? 'bg-stone-900 border-stone-700 text-white'
                        : 'bg-white border-stone-300 text-stone-900'
                    }`}
                  >
                    <option value="Karnataka Rajyotsava">Karnataka Rajyotsava</option>
                    <option value="Ganesha Chaturthi">Ganesha Chaturthi</option>
                    <option value="Deepavali">Deepavali</option>
                    <option value="Makara Sankranti">Makara Sankranti</option>
                    <option value="Ugadi">Ugadi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">Venue</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amphitheatre & Plaza, Brigade El Dorado"
                    value={newEvent.venue}
                    onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })}
                    className={`w-full text-xs px-3.5 py-2.5 rounded-xl border outline-none ${
                      isDark
                        ? 'bg-stone-900 border-stone-700 text-white'
                        : 'bg-white border-stone-300 text-stone-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">Start Date * (YYYY-MM-DD)</label>
                  <input
                    type="date"
                    required
                    value={newEvent.startDate}
                    onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
                    className={`w-full text-xs px-3.5 py-2.5 rounded-xl border outline-none ${
                      isDark
                        ? 'bg-stone-900 border-stone-700 text-white'
                        : 'bg-white border-stone-300 text-stone-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">End Date * (YYYY-MM-DD)</label>
                  <input
                    type="date"
                    required
                    value={newEvent.endDate}
                    onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                    className={`w-full text-xs px-3.5 py-2.5 rounded-xl border outline-none ${
                      isDark
                        ? 'bg-stone-900 border-stone-700 text-white'
                        : 'bg-white border-stone-300 text-stone-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">Display Schedule Text</label>
                  <input
                    type="text"
                    placeholder="e.g. 21st & 22nd November 2026"
                    value={newEvent.dateDisplay}
                    onChange={(e) => setNewEvent({ ...newEvent, dateDisplay: e.target.value })}
                    className={`w-full text-xs px-3.5 py-2.5 rounded-xl border outline-none ${
                      isDark
                        ? 'bg-stone-900 border-stone-700 text-white'
                        : 'bg-white border-stone-300 text-stone-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">Poster Image URL</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={newEvent.posterImage}
                    onChange={(e) => setNewEvent({ ...newEvent, posterImage: e.target.value })}
                    className={`w-full text-xs px-3.5 py-2.5 rounded-xl border outline-none ${
                      isDark
                        ? 'bg-stone-900 border-stone-700 text-white'
                        : 'bg-white border-stone-300 text-stone-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Theme / Motto</label>
                <input
                  type="text"
                  placeholder="e.g. ಸಿರಿಗನ್ನಡಂ ಗೆಲ್ಗೆ, ಸಿರಿಗನ್ನಡಂ ಬಾಳ್ಗೆ — Cultural Pride"
                  value={newEvent.theme}
                  onChange={(e) => setNewEvent({ ...newEvent, theme: e.target.value })}
                  className={`w-full text-xs px-3.5 py-2.5 rounded-xl border outline-none ${
                    isDark
                      ? 'bg-stone-900 border-stone-700 text-white'
                      : 'bg-white border-stone-300 text-stone-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Event Description &amp; Overview</label>
                <textarea
                  rows={3}
                  placeholder="Write a brief overview of the upcoming or past celebration..."
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value, detailsOverview: e.target.value })}
                  className={`w-full text-xs px-3.5 py-2.5 rounded-xl border outline-none ${
                    isDark
                      ? 'bg-stone-900 border-stone-700 text-white'
                      : 'bg-white border-stone-300 text-stone-900'
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 rounded-xl bg-red-700 hover:bg-red-800 disabled:opacity-50 text-yellow-300 font-bold text-xs shadow-md transition-all cursor-pointer inline-flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarPlus className="w-4 h-4" />}
                <span>Create &amp; Publish Event</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
