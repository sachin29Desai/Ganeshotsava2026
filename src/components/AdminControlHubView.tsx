import React, { useState } from 'react';
import {
  ShieldCheck,
  Users,
  Calendar,
  Coins,
  FileText,
  Plus,
  Trash2,
  Edit3,
  Save,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Settings,
  Image as ImageIcon,
  Lock,
  ChevronRight,
  Upload,
  RefreshCw,
  Search,
  UserCheck,
  UserPlus
} from 'lucide-react';
import { AppSettings } from '../types';
import { CommunityEvent, GALLERY_PHOTOS, GalleryPhoto } from '../data/communityData';
import { EventCustomInfo } from './balaga/EventInfoAndPhotosEditorModal';
import { RegisteredUsersManagement } from './RegisteredUsersManagement';

interface AdminControlHubViewProps {
  settings: AppSettings;
  events: CommunityEvent[];
  customInfos: Record<string, EventCustomInfo>;
  onSaveCustomInfo: (eventId: string, info: EventCustomInfo) => void;
  onSaveSettings?: (cfg: AppSettings) => void;
  onNavigateToFinancials: () => void;
  onNavigateToReceipts: () => void;
  currentAdminEmail?: string;
  isDark?: boolean;
}

export const AdminControlHubView: React.FC<AdminControlHubViewProps> = ({
  settings,
  events,
  customInfos,
  onSaveCustomInfo,
  onSaveSettings,
  onNavigateToFinancials,
  onNavigateToReceipts,
  currentAdminEmail = 'desaisachin95@gmail.com',
  isDark = false
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'users' | 'events' | 'financials'>('users');

  // Event Management State
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || 'ganesh-chaturthi-2026');
  const currentEvent = events.find((e) => e.id === selectedEventId) || events[0];
  const custom = customInfos[selectedEventId] || {};

  // Form State for Event Editor
  const [title, setTitle] = useState(custom.title || currentEvent?.title || '');
  const [kannadaTitle, setKannadaTitle] = useState(custom.kannadaTitle || currentEvent?.kannadaTitle || '');
  const [dateDisplay, setDateDisplay] = useState(custom.dateDisplay || currentEvent?.dateDisplay || '');
  const [venue, setVenue] = useState(custom.venue || currentEvent?.venue || '');
  const [description, setDescription] = useState(custom.description || currentEvent?.description || '');
  const [detailsOverview, setDetailsOverview] = useState(custom.detailsOverview || currentEvent?.detailsOverview || '');
  
  // Financial Summary State
  const [totalIncome, setTotalIncome] = useState(custom.totalIncome || '₹ 5,90,322');
  const [totalExpense, setTotalExpense] = useState(custom.totalExpense || '₹ 5,19,804');
  const [netSurplus, setNetSurplus] = useState(custom.netSurplus || '₹ 79,976.04');
  const [pendingReceivables, setPendingReceivables] = useState(custom.pendingReceivables || '₹ 65,000');
  const [auditNote, setAuditNote] = useState(custom.auditNote || 'Formal expense audit completed and accounts published.');

  // Photos List State
  const defaultEventPhotos = GALLERY_PHOTOS.filter(
    (p) => p.celebration.toLowerCase().includes(currentEvent?.festival?.toLowerCase() || '') || p.year === currentEvent?.year
  );
  const [photos, setPhotos] = useState<GalleryPhoto[]>(
    custom.photos || (defaultEventPhotos.length > 0 ? defaultEventPhotos : GALLERY_PHOTOS.slice(0, 4))
  );

  // New Photo Form
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoTitle, setNewPhotoTitle] = useState('');
  const [newPhotoCaption, setNewPhotoCaption] = useState('');
  const [newPhotoTag, setNewPhotoTag] = useState(currentEvent?.festival || 'Highlight');

  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Switch Event
  const handleSelectEvent = (id: string) => {
    setSelectedEventId(id);
    const ev = events.find((e) => e.id === id);
    const evCustom = customInfos[id] || {};

    setTitle(evCustom.title || ev?.title || '');
    setKannadaTitle(evCustom.kannadaTitle || ev?.kannadaTitle || '');
    setDateDisplay(evCustom.dateDisplay || ev?.dateDisplay || '');
    setVenue(evCustom.venue || ev?.venue || '');
    setDescription(evCustom.description || ev?.description || '');
    setDetailsOverview(evCustom.detailsOverview || ev?.detailsOverview || '');

    setTotalIncome(evCustom.totalIncome || (ev?.festival === 'Ganesha Chaturthi' ? '₹ 5,90,322' : '₹ 1,65,000'));
    setTotalExpense(evCustom.totalExpense || (ev?.festival === 'Ganesha Chaturthi' ? '₹ 5,19,804' : '₹ 1,20,000'));
    setNetSurplus(evCustom.netSurplus || (ev?.festival === 'Ganesha Chaturthi' ? '₹ 79,976.04' : '₹ 45,000'));
    setPendingReceivables(evCustom.pendingReceivables || (ev?.festival === 'Ganesha Chaturthi' ? '₹ 65,000' : '₹ 0'));
    setAuditNote(evCustom.auditNote || 'Formal expense audit completed and accounts published.');

    const defaultPhotos = GALLERY_PHOTOS.filter(
      (p) => p.celebration.toLowerCase().includes(ev?.festival?.toLowerCase() || '') || p.year === ev?.year
    );
    setPhotos(evCustom.photos || (defaultPhotos.length > 0 ? defaultPhotos : GALLERY_PHOTOS.slice(0, 4)));
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

  const handleSaveEventDetails = () => {
    const updatedInfo: EventCustomInfo = {
      eventId: selectedEventId,
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

    onSaveCustomInfo(selectedEventId, updatedInfo);
    setSaveSuccessMsg(`Successfully updated event details for "${title || currentEvent?.title}"!`);
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-red-900 via-stone-900 to-amber-950 text-white shadow-lg space-y-3 border-2 border-yellow-400">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-400 text-stone-950 font-black shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-yellow-300">
                Super Admin Control Hub • {currentAdminEmail}
              </span>
              <h1 className="text-2xl sm:text-3xl font-serif font-black">
                Admin Management Center
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateToFinancials}
              className="px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-stone-950 font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Coins className="w-4 h-4" />
              <span>Full Financial Ledger</span>
            </button>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-stone-300 max-w-3xl leading-relaxed">
          Admin portal strictly visible to authorized administrators to manage devotee user roles, celebration details, event photo galleries, and financial statements.
        </p>
      </div>

      {/* Primary Admin Navigation Tabs */}
      <div className="flex items-center gap-2 border-b-2 border-stone-200 dark:border-stone-800 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveAdminTab('users')}
          className={`px-5 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeAdminTab === 'users'
              ? 'border-red-600 text-red-700 dark:text-red-400 bg-red-50 dark:bg-stone-900 rounded-t-xl'
              : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900'
          }`}
        >
          <Users className="w-4 h-4 text-red-600" />
          <span>Devotees &amp; User Access ({'User Management'})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('events')}
          className={`px-5 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeAdminTab === 'events'
              ? 'border-red-600 text-red-700 dark:text-red-400 bg-red-50 dark:bg-stone-900 rounded-t-xl'
              : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900'
          }`}
        >
          <Calendar className="w-4 h-4 text-red-600" />
          <span>Events &amp; Photo Gallery Management</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('financials')}
          className={`px-5 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeAdminTab === 'financials'
              ? 'border-red-600 text-red-700 dark:text-red-400 bg-red-50 dark:bg-stone-900 rounded-t-xl'
              : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900'
          }`}
        >
          <Coins className="w-4 h-4 text-red-600" />
          <span>Financials Oversight &amp; Audit</span>
        </button>
      </div>

      {/* ========================================================
          PAGE 1: DEVOTEES & USER ACCESS MANAGEMENT
         ======================================================== */}
      {activeAdminTab === 'users' && (
        <div className="space-y-6">
          <RegisteredUsersManagement
            settings={settings}
            onSaveSettings={onSaveSettings}
            currentAdminEmail={currentAdminEmail}
          />
        </div>
      )}

      {/* ========================================================
          PAGE 2: EVENTS & PHOTO GALLERY MANAGEMENT
         ======================================================== */}
      {activeAdminTab === 'events' && (
        <div className="space-y-8">
          {saveSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* Event Selector & Basic Information Form */}
          <div
            className={`p-6 sm:p-8 rounded-3xl border-2 space-y-6 shadow-xs ${
              isDark ? 'bg-stone-900 border-stone-800 text-stone-100' : 'bg-white border-stone-200 text-stone-900'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-stone-200 dark:border-stone-800">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-red-600">
                  Event Details Editor
                </span>
                <h2 className="text-xl sm:text-2xl font-serif font-black">
                  Manage Event Details &amp; Photos
                </h2>
              </div>

              {/* Event Selector Dropdown */}
              <div className="w-full sm:w-72">
                <select
                  value={selectedEventId}
                  onChange={(e) => handleSelectEvent(e.target.value)}
                  className={`w-full p-3 rounded-xl border font-bold text-xs sm:text-sm cursor-pointer outline-none ${
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-500 uppercase">Event Title (English)</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full p-3 rounded-xl border text-xs sm:text-sm font-medium ${
                    isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-stone-50 border-stone-300 text-stone-900'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-500 uppercase">Kannada Title</label>
                <input
                  type="text"
                  value={kannadaTitle}
                  onChange={(e) => setKannadaTitle(e.target.value)}
                  className={`w-full p-3 rounded-xl border text-xs sm:text-sm font-medium ${
                    isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-stone-50 border-stone-300 text-stone-900'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-500 uppercase">Date Display Range</label>
                <input
                  type="text"
                  value={dateDisplay}
                  onChange={(e) => setDateDisplay(e.target.value)}
                  className={`w-full p-3 rounded-xl border text-xs sm:text-sm font-medium ${
                    isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-stone-50 border-stone-300 text-stone-900'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-500 uppercase">Venue Location</label>
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className={`w-full p-3 rounded-xl border text-xs sm:text-sm font-medium ${
                    isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-stone-50 border-stone-300 text-stone-900'
                  }`}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-500 uppercase">Overview &amp; Highlights Description</label>
              <textarea
                rows={3}
                value={detailsOverview || description}
                onChange={(e) => {
                  setDetailsOverview(e.target.value);
                  setDescription(e.target.value);
                }}
                className={`w-full p-3 rounded-xl border text-xs sm:text-sm font-medium ${
                  isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-stone-50 border-stone-300 text-stone-900'
                }`}
              />
            </div>

            {/* Financial Summary Figures (for Past Event Template) */}
            <div className="p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 space-y-3">
              <div className="flex items-center gap-2 font-bold text-xs text-amber-800 dark:text-yellow-400 uppercase tracking-wider">
                <Coins className="w-4 h-4 text-amber-600" />
                <span>Financial Overview Figures</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] text-stone-500 font-bold uppercase block">Total Income</label>
                  <input
                    type="text"
                    value={totalIncome}
                    onChange={(e) => setTotalIncome(e.target.value)}
                    className="w-full p-2.5 rounded-xl border text-xs font-bold bg-white dark:bg-stone-800"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-stone-500 font-bold uppercase block">Total Expense</label>
                  <input
                    type="text"
                    value={totalExpense}
                    onChange={(e) => setTotalExpense(e.target.value)}
                    className="w-full p-2.5 rounded-xl border text-xs font-bold bg-white dark:bg-stone-800"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-stone-500 font-bold uppercase block">Net Surplus</label>
                  <input
                    type="text"
                    value={netSurplus}
                    onChange={(e) => setNetSurplus(e.target.value)}
                    className="w-full p-2.5 rounded-xl border text-xs font-bold bg-white dark:bg-stone-800"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-stone-500 font-bold uppercase block">Pending Receivables</label>
                  <input
                    type="text"
                    value={pendingReceivables}
                    onChange={(e) => setPendingReceivables(e.target.value)}
                    className="w-full p-2.5 rounded-xl border text-xs font-bold bg-white dark:bg-stone-800"
                  />
                </div>
              </div>
            </div>

            {/* Photos Manager */}
            <div className="space-y-4 pt-4 border-t border-stone-200 dark:border-stone-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <ImageIcon className="w-4 h-4 text-red-600" />
                  <span>Event Photos Gallery ({photos.length})</span>
                </div>
              </div>

              {/* Add New Photo Form */}
              <form onSubmit={handleAddPhoto} className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 space-y-3">
                <span className="text-xs font-bold text-red-600 block">Add Photo to Gallery</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="url"
                    placeholder="Photo Image URL (https://...)"
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    className="p-2.5 rounded-xl border text-xs bg-white dark:bg-stone-900"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Photo Title"
                    value={newPhotoTitle}
                    onChange={(e) => setNewPhotoTitle(e.target.value)}
                    className="p-2.5 rounded-xl border text-xs bg-white dark:bg-stone-900"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Caption or description"
                    value={newPhotoCaption}
                    onChange={(e) => setNewPhotoCaption(e.target.value)}
                    className="flex-1 p-2.5 rounded-xl border text-xs bg-white dark:bg-stone-900"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-yellow-300 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Photo</span>
                  </button>
                </div>
              </form>

              {/* Photos Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative rounded-xl border overflow-hidden group bg-stone-950">
                    <img
                      src={photo.imageUrl}
                      alt={photo.title}
                      className="w-full h-28 object-cover opacity-80 group-hover:opacity-100 transition-opacity"
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

            <div className="pt-4 border-t flex justify-end">
              <button
                onClick={handleSaveEventDetails}
                className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-yellow-300 font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center gap-2 border border-yellow-400"
              >
                <Save className="w-4 h-4" />
                <span>Save Event Details &amp; Gallery</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          PAGE 3: FINANCIALS OVERSIGHT & AUDIT
         ======================================================== */}
      {activeAdminTab === 'financials' && (
        <div className="space-y-6">
          <div
            className={`p-6 sm:p-8 rounded-3xl border-2 space-y-6 shadow-xs ${
              isDark ? 'bg-stone-900 border-stone-800 text-stone-100' : 'bg-white border-stone-200 text-stone-900'
            }`}
          >
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-red-600">
                Financial Oversight Hub
              </span>
              <h2 className="text-xl sm:text-2xl font-serif font-black">
                Financial Accounts &amp; Devotee Receipts Portal
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">Devotee Digital Receipts</span>
                  <FileText className="w-5 h-5 text-red-600" />
                </div>
                <p className="text-xs text-stone-500">
                  Search, verify, generate, and download official digital receipts for all voluntary devotee contributions and seva offerings.
                </p>
                <button
                  onClick={onNavigateToReceipts}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-yellow-300 font-bold text-xs rounded-xl cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>Open Receipts Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-amber-900 dark:text-yellow-300">Complete Financial Ledger</span>
                  <Coins className="w-5 h-5 text-amber-600" />
                </div>
                <p className="text-xs text-amber-900/80 dark:text-stone-300">
                  Manage itemized income records (contributions, sponsorships, commercial stalls, sevas, hundi) and vendor payment vouchers.
                </p>
                <button
                  onClick={onNavigateToFinancials}
                  className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-stone-950 font-bold text-xs rounded-xl cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>Open Financial Statement</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
