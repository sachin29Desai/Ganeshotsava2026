import React, { useState, useEffect } from 'react';
import {
  Lock,
  ArrowLeft,
  ShieldCheck,
  Plus,
  Trash2,
  Edit3,
  Calendar,
  Image as ImageIcon,
  Users,
  Megaphone,
  Bell,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Sparkles,
  MapPin,
  Clock,
  Flag,
  Search,
  ExternalLink,
  UploadCloud,
  Loader2,
  Database
} from 'lucide-react';
import { CommunityEvent, CommitteeMember, GalleryPhoto, AnnouncementItem } from '../data/communityData';
import { getStoredEvents, saveStoredEvents } from '../utils/eventUtils';
import {
  getStoredTeamMembers,
  saveStoredTeamMembers,
  getStoredPhotos,
  saveStoredPhotos,
  getStoredAnnouncements,
  saveStoredAnnouncements,
  getStoredFormLinks,
  saveStoredFormLinks,
  FormLinksConfig,
  compressImageFile
} from '../utils/dataUtils';
import {
  auth,
  googleProvider,
  signInWithPopup,
  firebaseSignOut,
  type User,
  cloudSaveCommunityEvents,
  cloudSaveCommunityTeam,
  cloudSaveCommunityPhotos,
  cloudSaveCommunityAnnouncements,
  cloudSaveCommunityFormLinks
} from '../lib/firebase';

interface AdminPortalViewProps {
  currentUser: User | null;
  onNavigateHome: () => void;
  onRefreshData: () => void;
  isDark?: boolean;
}

export const AdminPortalView: React.FC<AdminPortalViewProps> = ({
  currentUser,
  onNavigateHome,
  onRefreshData,
  isDark = false
}) => {
  const [activeTab, setActiveTab] = useState<'events' | 'photos' | 'team' | 'announcements' | 'form-links'>('events');

  // Allowed admin emails list
  const allowedAdminEmails = ['desaisachin95@gmail.com'];
  const isAuthorizedAdmin =
    currentUser?.email &&
    allowedAdminEmails.map((e) => e.toLowerCase()).includes(currentUser.email.toLowerCase());

  // Data states
  const [events, setEvents] = useState<CommunityEvent[]>(() => getStoredEvents());
  const [photos, setPhotos] = useState<GalleryPhoto[]>(() => getStoredPhotos());
  const [teamMembers, setTeamMembers] = useState<CommitteeMember[]>(() => getStoredTeamMembers());
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(() => getStoredAnnouncements());
  const [formLinks, setFormLinks] = useState<FormLinksConfig>(() => getStoredFormLinks());

  // Global Save & Loading State
  const [isSavingAll, setIsSavingAll] = useState(false);

  // Device File Upload Handler
  const handleFileUpload = async (
    file: File,
    onSuccess: (dataUrl: string) => void
  ) => {
    try {
      const dataUrl = await compressImageFile(file, 1200, 1200, 0.82);
      onSuccess(dataUrl);
      showToast('Image uploaded and optimized from device!');
    } catch (err) {
      console.error('Image upload failed:', err);
      alert('Failed to read image file. Please pick a valid JPEG or PNG image.');
    }
  };

  // Global Save All to Cloud Database Handler
  const handleSaveAllToCloud = async () => {
    setIsSavingAll(true);
    try {
      await Promise.all([
        cloudSaveCommunityEvents(events),
        cloudSaveCommunityTeam(teamMembers),
        cloudSaveCommunityPhotos(photos),
        cloudSaveCommunityAnnouncements(announcements),
        cloudSaveCommunityFormLinks(formLinks)
      ]);
      saveStoredEvents(events);
      saveStoredTeamMembers(teamMembers);
      saveStoredPhotos(photos);
      saveStoredAnnouncements(announcements);
      saveStoredFormLinks(formLinks);
      onRefreshData();
      showToast('⚡ All website data, uploaded photos & settings saved to Cloud Database!');
    } catch (err: any) {
      console.error('Error saving all data to Firestore:', err);
      showToast('Save failed: ' + (err?.message || 'Database error'));
    } finally {
      setIsSavingAll(false);
    }
  };


  // Sign in loading / error state
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Form states for Events
  const [editingEvent, setEditingEvent] = useState<CommunityEvent | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventForm, setEventForm] = useState<Partial<CommunityEvent>>({
    title: '',
    kannadaTitle: '',
    festival: 'Karnataka Rajyotsava',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    dateDisplay: '',
    venue: 'Brigade El Dorado',
    status: 'upcoming',
    description: '',
    detailsOverview: '',
    posterImage: '',
    year: new Date().getFullYear(),
    volunteersCount: 20,
    actsCount: 10
  });

  // Form states for Team Members
  const [editingMemberIndex, setEditingMemberIndex] = useState<number | null>(null);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [teamForm, setTeamForm] = useState<CommitteeMember>({
    name: '',
    role: '',
    photoUrl: ''
  });

  // Form states for Photos
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoForm, setPhotoForm] = useState<Partial<GalleryPhoto>>({
    title: '',
    celebration: 'Sri Ganesha Chaturthi',
    year: new Date().getFullYear(),
    tag: 'Ganesha Chaturthi',
    imageUrl: '',
    caption: ''
  });

  // Form states for Announcements
  const [editingAnnouncement, setEditingAnnouncement] = useState<AnnouncementItem | null>(null);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState<Partial<AnnouncementItem>>({
    title: '',
    kannadaTitle: '',
    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    category: 'event',
    important: true,
    summary: '',
    content: ''
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    type: 'event' | 'team' | 'photo' | 'announcement';
    idOrIdx: string | number;
    title: string;
  } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Google Sign-In Handler
  const handleGoogleSignIn = async () => {
    setLoadingGoogle(true);
    setAuthError(null);
    try {
      if (auth) {
        await signInWithPopup(auth, googleProvider);
      } else {
        throw new Error('Firebase Auth unavailable');
      }
    } catch (err: unknown) {
      console.warn('Google sign in popup error:', err);
      setAuthError('Google Sign-in popup was blocked or closed. Please allow popups and try again.');
    } finally {
      setLoadingGoogle(false);
    }
  };

  // Sign out handler
  const handleSignOut = async () => {
    try {
      if (auth) {
        await firebaseSignOut(auth);
      }
    } catch (err) {
      console.warn('Sign out error:', err);
    }
  };

  // ==========================================
  // EVENT MANAGEMENT HANDLERS
  // ==========================================
  const handleOpenAddEvent = () => {
    setEditingEvent(null);
    setEventForm({
      id: `evt-${Date.now()}`,
      slug: `evt-${Date.now()}`,
      title: '',
      kannadaTitle: '',
      festival: 'Karnataka Rajyotsava',
      theme: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      dateDisplay: '',
      venue: 'Brigade El Dorado Amphitheatre',
      status: 'upcoming',
      description: '',
      detailsOverview: '',
      posterImage: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&w=1200&q=80',
      year: new Date().getFullYear(),
      volunteersCount: 20,
      actsCount: 10
    });
    setIsEventModalOpen(true);
  };

  const handleOpenEditEvent = (evt: CommunityEvent) => {
    setEditingEvent(evt);
    setEventForm({ ...evt });
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.title || !eventForm.dateDisplay) return;

    let updatedList: CommunityEvent[];
    if (editingEvent) {
      updatedList = events.map((item) =>
        item.id === editingEvent.id ? ({ ...item, ...eventForm } as CommunityEvent) : item
      );
      showToast('Event modified successfully!');
    } else {
      const newEvt: CommunityEvent = {
        id: eventForm.id || `evt-${Date.now()}`,
        slug: eventForm.slug || `evt-${Date.now()}`,
        title: eventForm.title || 'New Event',
        kannadaTitle: eventForm.kannadaTitle || '',
        festival: eventForm.festival || 'Karnataka Rajyotsava',
        theme: eventForm.theme || '',
        startDate: eventForm.startDate || '2026-11-21',
        endDate: eventForm.endDate || '2026-11-22',
        dateDisplay: eventForm.dateDisplay || '',
        venue: eventForm.venue || 'Brigade El Dorado',
        status: (eventForm.status as any) || 'upcoming',
        description: eventForm.description || '',
        detailsOverview: eventForm.detailsOverview || '',
        posterImage: eventForm.posterImage || '',
        year: eventForm.year || new Date().getFullYear(),
        volunteersCount: eventForm.volunteersCount || 10,
        actsCount: eventForm.actsCount || 5
      };
      updatedList = [newEvt, ...events];
      showToast('New Event created successfully!');
    }

    setEvents(updatedList);
    saveStoredEvents(updatedList);
    onRefreshData();
    setIsEventModalOpen(false);
  };

  const requestDeleteEvent = (evt: CommunityEvent) => {
    setDeleteConfirmTarget({
      type: 'event',
      idOrIdx: evt.id,
      title: evt.title
    });
  };

  // ==========================================
  // TEAM MEMBER HANDLERS
  // ==========================================
  const handleOpenAddTeam = () => {
    setEditingMemberIndex(null);
    setTeamForm({
      name: '',
      role: '',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
      initials: ''
    });
    setIsTeamModalOpen(true);
  };

  const handleOpenEditTeam = (idx: number) => {
    setEditingMemberIndex(idx);
    setTeamForm({ ...teamMembers[idx] });
    setIsTeamModalOpen(true);
  };

  const handleSaveTeamMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamForm.name || !teamForm.role) return;

    let updatedList: CommitteeMember[];
    const initials = teamForm.name
      .split(' ')
      .map((n) => n.charAt(0))
      .join('')
      .toUpperCase();

    const memberToSave: CommitteeMember = {
      ...teamForm,
      initials: initials || 'MB'
    };

    if (editingMemberIndex !== null) {
      updatedList = teamMembers.map((m, i) => (i === editingMemberIndex ? memberToSave : m));
      showToast('Team member updated successfully!');
    } else {
      updatedList = [...teamMembers, memberToSave];
      showToast('New team member added successfully!');
    }

    setTeamMembers(updatedList);
    saveStoredTeamMembers(updatedList);
    onRefreshData();
    setIsTeamModalOpen(false);
  };

  const requestDeleteTeamMember = (idx: number, name: string) => {
    setDeleteConfirmTarget({
      type: 'team',
      idOrIdx: idx,
      title: name
    });
  };

  // ==========================================
  // PHOTO SHOWCASE HANDLERS
  // ==========================================
  const handleOpenAddPhoto = () => {
    setPhotoForm({
      id: `photo-${Date.now()}`,
      title: '',
      celebration: events[0]?.title || 'Ganesha Chaturthi 2026',
      year: new Date().getFullYear(),
      tag: 'Festive Moment',
      imageUrl: 'https://images.unsplash.com/photo-1567591370504-20a2e7c4f4a3?auto=format&fit=crop&w=800&q=80',
      caption: ''
    });
    setIsPhotoModalOpen(true);
  };

  const handleSavePhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoForm.title || !photoForm.imageUrl) return;

    const newPhoto: GalleryPhoto = {
      id: photoForm.id || `photo-${Date.now()}`,
      title: photoForm.title || 'Festive Photo',
      celebration: photoForm.celebration || 'Ganesha Chaturthi',
      year: photoForm.year || new Date().getFullYear(),
      tag: photoForm.tag || 'Festival',
      imageUrl: photoForm.imageUrl || '',
      caption: photoForm.caption || ''
    };

    const updatedList = [newPhoto, ...photos];
    setPhotos(updatedList);
    saveStoredPhotos(updatedList);
    onRefreshData();
    showToast('Photo added to showcase gallery!');
    setIsPhotoModalOpen(false);
  };

  const requestDeletePhoto = (photo: GalleryPhoto) => {
    setDeleteConfirmTarget({
      type: 'photo',
      idOrIdx: photo.id,
      title: photo.title
    });
  };

  // ==========================================
  // ANNOUNCEMENT HANDLERS
  // ==========================================
  const handleOpenAddAnnouncement = () => {
    setEditingAnnouncement(null);
    setAnnouncementForm({
      id: `ann-${Date.now()}`,
      title: '',
      kannadaTitle: '',
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      category: 'event',
      important: true,
      summary: '',
      content: ''
    });
    setIsAnnouncementModalOpen(true);
  };

  const handleOpenEditAnnouncement = (ann: AnnouncementItem) => {
    setEditingAnnouncement(ann);
    setAnnouncementForm({ ...ann });
    setIsAnnouncementModalOpen(true);
  };

  const handleSaveAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementForm.title || !announcementForm.content) return;

    let updatedList: AnnouncementItem[];
    if (editingAnnouncement) {
      updatedList = announcements.map((item) =>
        item.id === editingAnnouncement.id
          ? ({ ...item, ...announcementForm } as AnnouncementItem)
          : item
      );
      showToast('Announcement updated successfully!');
    } else {
      const newAnn: AnnouncementItem = {
        id: announcementForm.id || `ann-${Date.now()}`,
        title: announcementForm.title || 'New Announcement',
        kannadaTitle: announcementForm.kannadaTitle || '',
        date:
          announcementForm.date ||
          new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        category: (announcementForm.category as any) || 'event',
        important: announcementForm.important ?? true,
        summary: announcementForm.summary || announcementForm.title || '',
        content: announcementForm.content || ''
      };
      updatedList = [newAnn, ...announcements];
      showToast('New Announcement pushed live!');
    }

    setAnnouncements(updatedList);
    saveStoredAnnouncements(updatedList);
    onRefreshData();
    setIsAnnouncementModalOpen(false);
  };

  const requestDeleteAnnouncement = (ann: AnnouncementItem) => {
    setDeleteConfirmTarget({
      type: 'announcement',
      idOrIdx: ann.id,
      title: ann.title
    });
  };

  // ==========================================
  // FORM LINKS HANDLER
  // ==========================================
  const handleSaveFormLinks = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoredFormLinks(formLinks);
    onRefreshData();
    showToast('Google Form links updated successfully!');
  };

  // CONFIRM DELETE EXECUTION HANDLER
  const handleExecuteDelete = () => {
    if (!deleteConfirmTarget) return;

    if (deleteConfirmTarget.type === 'event') {
      const updated = events.filter((e) => e.id !== deleteConfirmTarget.idOrIdx);
      setEvents(updated);
      saveStoredEvents(updated);
      onRefreshData();
      showToast(`Event "${deleteConfirmTarget.title}" deleted.`);
    } else if (deleteConfirmTarget.type === 'team') {
      const idx = deleteConfirmTarget.idOrIdx as number;
      const updated = teamMembers.filter((_, i) => i !== idx);
      setTeamMembers(updated);
      saveStoredTeamMembers(updated);
      onRefreshData();
      showToast(`Team member "${deleteConfirmTarget.title}" removed.`);
    } else if (deleteConfirmTarget.type === 'photo') {
      const updated = photos.filter((p) => p.id !== deleteConfirmTarget.idOrIdx);
      setPhotos(updated);
      saveStoredPhotos(updated);
      onRefreshData();
      showToast(`Photo "${deleteConfirmTarget.title}" removed.`);
    } else if (deleteConfirmTarget.type === 'announcement') {
      const updated = announcements.filter((a) => a.id !== deleteConfirmTarget.idOrIdx);
      setAnnouncements(updated);
      saveStoredAnnouncements(updated);
      onRefreshData();
      showToast(`Announcement "${deleteConfirmTarget.title}" deleted.`);
    }

    setDeleteConfirmTarget(null);
  };

  // 1. UNAUTHENTICATED / NOT SIGNED IN VIEW
  if (!currentUser) {
    return (
      <div
        className={`min-h-screen flex flex-col justify-between font-sans selection:bg-red-600 selection:text-yellow-200 ${
          isDark ? 'bg-stone-950 text-stone-100' : 'bg-[#FFFDF7] text-stone-900'
        }`}
      >
        <div className="w-full flex flex-col">
          <div className="h-2.5 bg-[#DC2626] w-full" />
          <div className="h-2.5 bg-[#FBBF24] w-full" />
        </div>

        <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div
            className={`w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-xl border-2 text-center space-y-6 ${
              isDark ? 'bg-stone-900/90 border-stone-800' : 'bg-white border-stone-200'
            }`}
          >
            <button
              onClick={onNavigateHome}
              className="text-xs font-semibold inline-flex items-center gap-1.5 text-stone-500 hover:text-red-700 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Public Site</span>
            </button>

            <div className="space-y-2">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-red-600 to-amber-500 p-1 shadow-md border-2 border-yellow-400 overflow-hidden">
                <img
                  src="/bhuvaneshwari_kannada_flag.jpg"
                  alt="Bhuvaneshwari Devi"
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
              <h1 className="text-2xl font-serif font-black text-red-700 dark:text-red-500">
                Committee Admin Portal
              </h1>
              <p className="text-xs text-stone-500">
                Sign in with Gmail to manage events, photos, and team members.
              </p>
            </div>

            {authError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              onClick={handleGoogleSignIn}
              disabled={loadingGoogle}
              className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-stone-50 text-stone-800 font-bold text-sm border-2 border-stone-300 hover:border-red-600 transition-all cursor-pointer shadow-xs inline-flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{loadingGoogle ? 'Connecting with Gmail...' : 'Sign in with Gmail'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. SIGNED IN BUT NOT AUTHORIZED ADMIN VIEW
  if (!isAuthorizedAdmin) {
    return (
      <div
        className={`min-h-screen flex flex-col justify-between font-sans selection:bg-red-600 selection:text-yellow-200 ${
          isDark ? 'bg-stone-950 text-stone-100' : 'bg-[#FFFDF7] text-stone-900'
        }`}
      >
        <div className="w-full flex flex-col">
          <div className="h-2.5 bg-[#DC2626] w-full" />
          <div className="h-2.5 bg-[#FBBF24] w-full" />
        </div>

        <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div
            className={`w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-xl border-2 text-center space-y-6 ${
              isDark ? 'bg-stone-900/90 border-stone-800' : 'bg-white border-stone-200'
            }`}
          >
            <div className="w-12 h-12 mx-auto rounded-2xl bg-red-600 text-yellow-300 flex items-center justify-center shadow-md">
              <Lock className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-serif font-black text-red-700 dark:text-red-400">
                Access Restricted
              </h2>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                Your Gmail address (<strong>{currentUser.email}</strong>) is not listed as an authorized administrator. Admin portal access is restricted to authorized committee admins.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-3">
              <button
                onClick={handleSignOut}
                className="w-full py-3 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 font-bold text-xs cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out / Switch Account</span>
              </button>

              <button
                onClick={onNavigateHome}
                className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-yellow-300 font-bold text-xs cursor-pointer inline-flex items-center justify-center gap-2 border border-yellow-400"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Website</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. AUTHORIZED ADMIN MANAGEMENT DASHBOARD
  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors ${
        isDark ? 'bg-stone-950 text-stone-100' : 'bg-[#FFFDF7] text-stone-900'
      }`}
    >
      {/* Flag stripe */}
      <div className="w-full flex flex-col">
        <div className="h-2 bg-[#DC2626] w-full" />
        <div className="h-2 bg-[#FBBF24] w-full" />
      </div>

      {/* Admin Top Header */}
      <header
        className={`sticky top-0 z-40 border-b-2 border-red-600 shadow-xs backdrop-blur-md ${
          isDark ? 'bg-stone-900/95 text-stone-100' : 'bg-white/95 text-stone-900'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 p-0.5 border-2 border-yellow-400 overflow-hidden shrink-0">
              <img
                src="/bhuvaneshwari_kannada_flag.jpg"
                alt="Logo"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-black text-base text-red-600">Admin Portal</span>
                <span className="text-[10px] bg-red-600 text-yellow-300 font-black uppercase px-2 py-0.5 rounded">
                  Authorized
                </span>
              </div>
              <p className="text-[11px] text-stone-500 font-medium">{currentUser.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleSaveAllToCloud}
              disabled={isSavingAll}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 via-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-yellow-300 font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2 border border-yellow-400 disabled:opacity-50 active:scale-95"
              title="Save all events, team members, photos, announcements, and links to Cloud Database"
            >
              {isSavingAll ? (
                <Loader2 className="w-4 h-4 animate-spin text-yellow-300" />
              ) : (
                <UploadCloud className="w-4 h-4 text-yellow-300" />
              )}
              <span>{isSavingAll ? 'Saving to Database...' : 'Save All Changes to Database'}</span>
            </button>

            <button
              onClick={onNavigateHome}
              className="px-3.5 py-2 rounded-xl border text-xs font-bold hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-red-600" />
              <span>View Website</span>
            </button>

            <button
              onClick={handleSignOut}
              className="px-3.5 py-2 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Content Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 space-y-8">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="p-4 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-lg flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{toastMessage}</span>
            </div>
          </div>
        )}

        {/* Dashboard Title & Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-stone-200 dark:border-stone-800">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-black text-stone-900 dark:text-stone-100 flex items-center gap-3">
              <span>Data Management Portal</span>
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              Upload photos from your device, edit celebrations &amp; schedules, and save all changes directly to Firebase Cloud Database.
            </p>
          </div>


          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'events', label: `Events (${events.length})`, icon: Calendar },
              { id: 'photos', label: `Photos (${photos.length})`, icon: ImageIcon },
              { id: 'team', label: `Team (${teamMembers.length})`, icon: Users },
              { id: 'announcements', label: `Announcements (${announcements.length})`, icon: Megaphone },
              { id: 'form-links', label: 'Form Links', icon: ExternalLink }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-red-600 text-yellow-300 shadow-xs'
                    : isDark
                    ? 'bg-stone-900 text-stone-300 border border-stone-800 hover:bg-stone-800'
                    : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* TAB 1: MANAGE EVENTS */}
        {activeTab === 'events' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-serif font-black">All Community Events &amp; Celebrations</h2>
              <button
                onClick={handleOpenAddEvent}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-yellow-300 font-bold text-xs shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 border border-yellow-400"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Event</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((evt) => (
                <div
                  key={evt.id}
                  className={`p-6 rounded-3xl border-2 space-y-4 shadow-xs flex flex-col justify-between ${
                    isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-red-600 text-yellow-300 px-2.5 py-0.5 rounded">
                        {evt.festival}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          evt.status === 'ongoing'
                            ? 'bg-red-500/20 text-red-600'
                            : evt.status === 'upcoming'
                            ? 'bg-emerald-500/20 text-emerald-600'
                            : 'bg-stone-500/20 text-stone-500'
                        }`}
                      >
                        {evt.status}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-serif font-black text-lg text-stone-900 dark:text-stone-100">
                        {evt.title}
                      </h3>
                      <span className="text-xs font-serif font-bold text-amber-700 dark:text-yellow-400 block">
                        {evt.kannadaTitle}
                      </span>
                    </div>

                    <p className="text-xs text-stone-500 line-clamp-2">{evt.description}</p>

                    <div className="text-xs text-stone-500 space-y-1 pt-2 border-t border-stone-100 dark:border-stone-800">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-red-600" />
                        <span>{evt.dateDisplay}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-red-600" />
                        <span className="truncate">{evt.venue}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenEditEvent(evt)}
                      className="px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => requestDeleteEvent(evt)}
                      className="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/60 hover:bg-red-100 text-red-600 font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: MANAGE PHOTOS */}
        {activeTab === 'photos' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-serif font-black">Event Photos &amp; Gallery Showcase</h2>
              <button
                onClick={handleOpenAddPhoto}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-yellow-300 font-bold text-xs shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 border border-yellow-400"
              >
                <Plus className="w-4 h-4" />
                <span>Upload Event Photo</span>
              </button>
            </div>

            {photos.length === 0 ? (
              <div className="p-10 text-center rounded-3xl border-2 border-dashed border-stone-300 dark:border-stone-800 space-y-3">
                <ImageIcon className="w-8 h-8 text-stone-400 mx-auto" />
                <p className="text-sm font-bold text-stone-700 dark:text-stone-300">
                  No photos saved in database yet.
                </p>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  Click "Upload Event Photo" above to select image files from your device, then click the top "Save All Changes to Database" button to sync them to the live site.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className={`rounded-3xl border-2 overflow-hidden shadow-xs flex flex-col justify-between ${
                      isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                    }`}
                  >
                    <div className="aspect-[4/3] bg-stone-900 relative">
                      <img
                        src={photo.imageUrl}
                        alt={photo.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="p-4 space-y-2">
                      <div>
                        <span className="text-[10px] font-bold text-yellow-500 uppercase block">
                          {photo.celebration}
                        </span>
                        <h4 className="font-bold text-xs truncate">{photo.title}</h4>
                      </div>

                      <button
                        onClick={() => requestDeletePhoto(photo)}
                        className="w-full py-1.5 rounded-lg bg-red-50 dark:bg-red-950/60 hover:bg-red-100 text-red-600 font-bold text-xs transition-colors cursor-pointer inline-flex items-center justify-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Photo</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MANAGE TEAM MEMBERS */}
        {activeTab === 'team' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-serif font-black">Our Team Members</h2>
              <button
                onClick={handleOpenAddTeam}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-yellow-300 font-bold text-xs shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 border border-yellow-400"
              >
                <Plus className="w-4 h-4" />
                <span>Add Team Member</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {teamMembers.map((member, idx) => (
                <div
                  key={idx}
                  className={`rounded-3xl border-2 overflow-hidden shadow-xs text-center flex flex-col justify-between ${
                    isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                  }`}
                >
                  <div>
                    <div className="aspect-[4/5] bg-stone-900 relative">
                      {member.photoUrl ? (
                        <img
                          src={member.photoUrl}
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-red-600 text-yellow-300 font-bold text-2xl flex items-center justify-center">
                          {member.initials || member.name.charAt(0)}
                        </div>
                      )}
                    </div>

                    <div className="p-4 space-y-1">
                      <h4 className="font-serif font-bold text-sm">{member.name}</h4>
                      <p className="text-xs font-bold text-red-600 dark:text-yellow-400">
                        {member.role}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleOpenEditTeam(idx)}
                      className="px-3 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 font-bold text-xs cursor-pointer inline-flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => requestDeleteTeamMember(idx, member.name)}
                      className="px-3 py-1 rounded-lg bg-red-50 dark:bg-red-950 hover:bg-red-100 text-red-600 font-bold text-xs cursor-pointer inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: MANAGE ANNOUNCEMENTS */}
        {activeTab === 'announcements' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-serif font-black">Latest Official Announcements</h2>
                <p className="text-xs text-stone-500">
                  Announcements pushed here will immediately appear in the Latest Announcements section on the homepage.
                </p>
              </div>

              <button
                onClick={handleOpenAddAnnouncement}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-yellow-300 font-bold text-xs shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 border border-yellow-400"
              >
                <Plus className="w-4 h-4" />
                <span>Push New Announcement</span>
              </button>
            </div>

            {announcements.length === 0 ? (
              <div className="p-10 text-center rounded-3xl border-2 border-dashed border-stone-300 dark:border-stone-800 space-y-3">
                <Megaphone className="w-8 h-8 text-stone-400 mx-auto" />
                <p className="text-sm font-bold text-stone-700 dark:text-stone-300">
                  No announcements in database.
                </p>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  Click "Push New Announcement" above to add an official notice, then click "Save All Changes to Database" to publish it live to the website.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className={`p-6 rounded-3xl border-2 space-y-4 shadow-xs flex flex-col justify-between ${
                    isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-red-600 text-yellow-300 px-2.5 py-0.5 rounded">
                        {ann.category}
                      </span>
                      {ann.important && (
                        <span className="text-[10px] font-bold uppercase bg-amber-500/20 text-amber-700 dark:text-yellow-400 px-2.5 py-0.5 rounded inline-flex items-center gap-1">
                          <Bell className="w-3 h-3" />
                          <span>Important Notice</span>
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-serif font-black text-base text-stone-900 dark:text-stone-100">
                        {ann.title}
                      </h3>
                      {ann.kannadaTitle && (
                        <span className="text-xs font-serif font-bold text-amber-700 dark:text-yellow-400 block mt-0.5">
                          {ann.kannadaTitle}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-stone-500 line-clamp-3 leading-relaxed">{ann.summary || ann.content}</p>

                    <div className="text-[11px] text-stone-400 pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-red-600" />
                      <span>Posted on {ann.date}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenEditAnnouncement(ann)}
                      className="px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => requestDeleteAnnouncement(ann)}
                      className="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/60 hover:bg-red-100 text-red-600 font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

        {/* TAB 5: MANAGE GOOGLE FORM LINKS & HOMEPAGE MEDIA */}
        {activeTab === 'form-links' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-serif font-black text-stone-900 dark:text-stone-100">
                Configurable Form Links &amp; Homepage Media
              </h2>
              <p className="text-xs text-stone-500">
                Update the Google Form URLs and Homepage Embedded YouTube Video URL across the website. All changes sync to database.
              </p>
            </div>

            <form
              onSubmit={handleSaveFormLinks}
              className="max-w-2xl space-y-6 p-6 sm:p-8 rounded-3xl border-2 bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-sm text-xs"
            >
              <div className="space-y-2">
                <label className="block font-bold uppercase text-red-600 dark:text-yellow-400">
                  1. Membership Registration Google Form URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://forms.gle/..."
                  value={formLinks.membershipFormUrl}
                  onChange={(e) => setFormLinks({ ...formLinks, membershipFormUrl: e.target.value })}
                  className="w-full p-3 rounded-xl border bg-transparent text-xs font-mono"
                />
                <p className="text-[11px] text-stone-500">
                  Used when residents click "Become a Member" or "Register Now" on the Membership section.
                </p>
              </div>

              <div className="space-y-2 pt-4 border-t border-stone-100 dark:border-stone-800">
                <label className="block font-bold uppercase text-red-600 dark:text-yellow-400">
                  2. Volunteer Registration Google Form URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://forms.gle/..."
                  value={formLinks.volunteerFormUrl}
                  onChange={(e) => setFormLinks({ ...formLinks, volunteerFormUrl: e.target.value })}
                  className="w-full p-3 rounded-xl border bg-transparent text-xs font-mono"
                />
                <p className="text-[11px] text-stone-500">
                  Used when residents click "Volunteer Sign Up".
                </p>
              </div>

              <div className="space-y-2 pt-4 border-t border-stone-100 dark:border-stone-800">
                <label className="block font-bold uppercase text-red-600 dark:text-yellow-400">
                  3. Stage Performance Nomination Google Form URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://forms.gle/..."
                  value={formLinks.nominationFormUrl}
                  onChange={(e) => setFormLinks({ ...formLinks, nominationFormUrl: e.target.value })}
                  className="w-full p-3 rounded-xl border bg-transparent text-xs font-mono"
                />
                <p className="text-[11px] text-stone-500">
                  Used when residents click "Nominate Stage Performance" or "Register Stage Performance".
                </p>
              </div>

              <div className="space-y-2 pt-4 border-t border-stone-100 dark:border-stone-800">
                <label className="block font-bold uppercase text-red-600 dark:text-yellow-400">
                  4. Homepage YouTube Video Embed Link / SRC URL *
                </label>
                <input
                  type="text"
                  required
                  placeholder='src="https://www.youtube-nocookie.com/embed/..." or full <iframe src=...>'
                  value={formLinks.homeYoutubeUrl || ''}
                  onChange={(e) => setFormLinks({ ...formLinks, homeYoutubeUrl: e.target.value })}
                  className="w-full p-3 rounded-xl border bg-transparent text-xs font-mono"
                />
                <p className="text-[11px] text-stone-500">
                  You can paste a direct YouTube link, embed URL, src="..." value, or full &lt;iframe ...&gt; snippet. The video player on the homepage will automatically update with the new src.
                </p>
              </div>

              <div className="space-y-2 pt-4 border-t border-stone-100 dark:border-stone-800">
                <label className="block font-bold uppercase text-red-600 dark:text-yellow-400">
                  5. Website Default Theme Mode *
                </label>
                <select
                  value={formLinks.defaultTheme || 'light'}
                  onChange={(e) => setFormLinks({ ...formLinks, defaultTheme: e.target.value as 'light' | 'dark' })}
                  className="w-full p-3 rounded-xl border bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs font-bold cursor-pointer"
                >
                  <option value="light">☀️ Light Theme (Default Cream &amp; Gold)</option>
                  <option value="dark">🌙 Dark Theme (Rich Deep Maroon &amp; Dark Stone)</option>
                </select>
                <p className="text-[11px] text-stone-500">
                  Select the default website visual theme mode. Applying this setting updates the website theme for all visitors.
                </p>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-red-600 text-yellow-300 font-bold border border-yellow-400 hover:bg-red-700 cursor-pointer shadow-md transition-colors"
                >
                  Save All Links &amp; Media Config
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* EVENT MODAL */}
      {isEventModalOpen && (
        <div
          onClick={() => setIsEventModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative max-w-xl w-full p-6 sm:p-8 rounded-3xl border-2 border-red-600 shadow-2xl space-y-6 overflow-y-auto max-h-[90vh] ${
              isDark ? 'bg-stone-900 text-stone-100' : 'bg-white text-stone-900'
            }`}
          >
            <button
              onClick={() => setIsEventModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-900 dark:hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-serif font-black text-red-600">
              {editingEvent ? 'Modify Event' : 'Create New Event'}
            </h3>

            <form onSubmit={handleSaveEvent} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-1 uppercase">Event Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Karnataka Rajyotsava 2026"
                    value={eventForm.title}
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    className="w-full p-2.5 rounded-xl border bg-transparent"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 uppercase">Kannada Title</label>
                  <input
                    type="text"
                    placeholder="e.g. ಕನ್ನಡ ರಾಜ್ಯೋತ್ಸವ ೨೦೨೬"
                    value={eventForm.kannadaTitle}
                    onChange={(e) => setEventForm({ ...eventForm, kannadaTitle: e.target.value })}
                    className="w-full p-2.5 rounded-xl border bg-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-1 uppercase">Festival Category</label>
                  <select
                    value={eventForm.festival}
                    onChange={(e) => setEventForm({ ...eventForm, festival: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border bg-transparent"
                  >
                    <option value="Karnataka Rajyotsava">Karnataka Rajyotsava</option>
                    <option value="Ganesha Chaturthi">Ganesha Chaturthi</option>
                    <option value="Deepavali">Deepavali</option>
                    <option value="Makara Sankranti">Makara Sankranti</option>
                    <option value="Ugadi">Ugadi</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1 uppercase">Status</label>
                  <select
                    value={eventForm.status}
                    onChange={(e) => setEventForm({ ...eventForm, status: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border bg-transparent"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing (Live)</option>
                    <option value="archived">Archived (Past)</option>
                  </select>
                </div>
              </div>

              {/* DATES SECTION WITH DYNAMIC TIMER SYNC */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-yellow-400 text-xs">
                  <Calendar className="w-4 h-4" />
                  <span>Event Dates &amp; Countdown Timer Sync</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1 uppercase text-[10px]">Start Date (YYYY-MM-DD) *</label>
                    <input
                      type="date"
                      required
                      value={eventForm.startDate || ''}
                      onChange={(e) => {
                        const newStart = e.target.value;
                        setEventForm((prev) => ({
                          ...prev,
                          startDate: newStart,
                          dateDisplay: prev.dateDisplay || newStart
                        }));
                      }}
                      className="w-full p-2 rounded-xl border bg-transparent font-sans"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1 uppercase text-[10px]">End Date (YYYY-MM-DD)</label>
                    <input
                      type="date"
                      value={eventForm.endDate || ''}
                      onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                      className="w-full p-2 rounded-xl border bg-transparent font-sans"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-stone-500">
                  Note: The upcoming event timer on the home page automatically syncs with the Start Date selected here.
                </p>
              </div>

              <div>
                <label className="block font-bold mb-1 uppercase">Date Display Label *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 21st & 22nd November 2026"
                  value={eventForm.dateDisplay}
                  onChange={(e) => setEventForm({ ...eventForm, dateDisplay: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-transparent"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 uppercase">Event Theme / Tagline</label>
                <input
                  type="text"
                  placeholder="e.g. ಸಿರಿಗನ್ನಡಂ ಗೆಲ್ಗೆ, ಸಿರಿಗನ್ನಡಂ ಬಾಳ್ಗೆ"
                  value={eventForm.theme || ''}
                  onChange={(e) => setEventForm({ ...eventForm, theme: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-transparent"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 uppercase">Venue Location</label>
                <input
                  type="text"
                  placeholder="e.g. Grand Amphitheatre, Brigade El Dorado"
                  value={eventForm.venue || ''}
                  onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-transparent"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 uppercase">Short Description</label>
                <textarea
                  rows={2}
                  placeholder="Short summary of the event..."
                  value={eventForm.description || ''}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-transparent font-sans"
                />
              </div>

              <div className="p-4 rounded-2xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-red-600 dark:text-red-400 uppercase text-xs flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Day-Wise Schedule Updates (Timings &amp; Acts)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (!eventForm.detailsOverview) {
                        setEventForm((prev) => ({
                          ...prev,
                          detailsOverview: `Day 1 Schedule (21st Nov 2026)\n08:30 AM — Red & Yellow Flag Hoisting & Naadageethe\n10:00 AM — Dollu Kunitha Folk Dance Procession around Eldorado plaza\n12:30 PM — Mysore Pak & Traditional Prasadam Distribution\n\nDay 2 Cultural Evening (22nd Nov 2026)\n05:30 PM — Children Bharatanatyam & Folk Dance Performances\n07:00 PM — Resident Kannada Drama Skit & Poetry Recitation\n08:30 PM — Felicitation of Senior Residents & Volunteers`
                        }));
                      }
                    }}
                    className="text-[10px] font-bold text-amber-700 dark:text-yellow-400 underline hover:text-amber-800 cursor-pointer"
                  >
                    Insert Sample Schedule
                  </button>
                </div>
                <textarea
                  rows={8}
                  placeholder={`Day 1 Schedule (21st Nov 2026)\n08:30 AM — Red & Yellow Flag Hoisting & Naadageethe\n10:00 AM — Dollu Kunitha Procession\n12:30 PM — Mysore Pak & Prasadam\n\nDay 2 Cultural Evening (22nd Nov 2026)\n05:30 PM — Children Bharatanatyam\n07:00 PM — Kannada Drama Skit\n08:30 PM — Felicitation`}
                  value={eventForm.detailsOverview || ''}
                  onChange={(e) => setEventForm({ ...eventForm, detailsOverview: e.target.value })}
                  className="w-full p-3 rounded-xl border bg-white dark:bg-stone-900 border-stone-300 dark:border-stone-700 font-sans text-xs leading-relaxed"
                />
                <p className="text-[10px] text-stone-600 dark:text-stone-400">
                  Tip: Separate days with a blank line. Each block will automatically render as a Day Schedule card with bullet points on the website.
                </p>
              </div>

              <div>
                <label className="block font-bold mb-1 uppercase">Poster Image (Upload from Device or paste URL)</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/... or upload from device"
                      value={eventForm.posterImage || ''}
                      onChange={(e) => setEventForm({ ...eventForm, posterImage: e.target.value })}
                      className="flex-1 p-2.5 rounded-xl border bg-transparent font-mono text-xs"
                    />
                    <label className="px-3 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0">
                      <UploadCloud className="w-4 h-4" />
                      <span>Upload Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(file, (url) =>
                              setEventForm((prev) => ({ ...prev, posterImage: url }))
                            );
                          }
                        }}
                      />
                    </label>
                  </div>
                  {eventForm.posterImage && (
                    <div className="relative w-36 h-24 rounded-xl overflow-hidden border border-amber-400/50 bg-stone-950">
                      <img
                        src={eventForm.posterImage}
                        alt="Poster Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setEventForm({ ...eventForm, posterImage: '' })}
                        className="absolute top-1 right-1 bg-black/80 text-white p-1 rounded-full text-[10px] hover:bg-red-600 cursor-pointer"
                        title="Remove poster photo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border font-bold hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-red-600 text-yellow-300 font-bold border border-yellow-400 cursor-pointer"
                >
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TEAM MEMBER MODAL */}
      {isTeamModalOpen && (
        <div
          onClick={() => setIsTeamModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative max-w-md w-full p-6 sm:p-8 rounded-3xl border-2 border-red-600 shadow-2xl space-y-6 ${
              isDark ? 'bg-stone-900 text-stone-100' : 'bg-white text-stone-900'
            }`}
          >
            <button
              onClick={() => setIsTeamModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-900 dark:hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-serif font-black text-red-600">
              {editingMemberIndex !== null ? 'Modify Team Member' : 'Add Team Member'}
            </h3>

            <form onSubmit={handleSaveTeamMember} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1 uppercase">Member Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Hegde"
                  value={teamForm.name}
                  onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-transparent"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 uppercase">Post / Role *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. President, Cultural Lead, General Secretary"
                  value={teamForm.role}
                  onChange={(e) => setTeamForm({ ...teamForm, role: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-transparent"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 uppercase">Member Photo (Upload from Device or paste URL)</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/... or upload from device"
                      value={teamForm.photoUrl}
                      onChange={(e) => setTeamForm({ ...teamForm, photoUrl: e.target.value })}
                      className="flex-1 p-2.5 rounded-xl border bg-transparent font-mono text-xs"
                    />
                    <label className="px-3 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0">
                      <UploadCloud className="w-4 h-4" />
                      <span>Upload Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(file, (url) =>
                              setTeamForm((prev) => ({ ...prev, photoUrl: url }))
                            );
                          }
                        }}
                      />
                    </label>
                  </div>
                  {teamForm.photoUrl && (
                    <div className="relative w-24 h-28 rounded-xl overflow-hidden border border-amber-400/50 bg-stone-950">
                      <img
                        src={teamForm.photoUrl}
                        alt="Member Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setTeamForm({ ...teamForm, photoUrl: '' })}
                        className="absolute top-1 right-1 bg-black/80 text-white p-1 rounded-full text-[10px] hover:bg-red-600 cursor-pointer"
                        title="Remove member photo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTeamModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border font-bold hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-red-600 text-yellow-300 font-bold border border-yellow-400 cursor-pointer"
                >
                  Save Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PHOTO MODAL */}
      {isPhotoModalOpen && (
        <div
          onClick={() => setIsPhotoModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative max-w-md w-full p-6 sm:p-8 rounded-3xl border-2 border-red-600 shadow-2xl space-y-6 ${
              isDark ? 'bg-stone-900 text-stone-100' : 'bg-white text-stone-900'
            }`}
          >
            <button
              onClick={() => setIsPhotoModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-900 dark:hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-serif font-black text-red-600">
              Upload Photo to Showcase
            </h3>

            <form onSubmit={handleSavePhoto} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1 uppercase">Photo Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flag Hoisting Ceremony"
                  value={photoForm.title}
                  onChange={(e) => setPhotoForm({ ...photoForm, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-transparent"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 uppercase">Associated Celebration</label>
                <input
                  type="text"
                  placeholder="e.g. Karnataka Rajyotsava 2026"
                  value={photoForm.celebration}
                  onChange={(e) => setPhotoForm({ ...photoForm, celebration: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-transparent"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 uppercase">Gallery Photo (Upload from Device or paste URL) *</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      required
                      placeholder="https://images.unsplash.com/... or upload from device"
                      value={photoForm.imageUrl || ''}
                      onChange={(e) => setPhotoForm({ ...photoForm, imageUrl: e.target.value })}
                      className="flex-1 p-2.5 rounded-xl border bg-transparent font-mono text-xs"
                    />
                    <label className="px-3 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0">
                      <UploadCloud className="w-4 h-4" />
                      <span>Upload Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(file, (url) =>
                              setPhotoForm((prev) => ({ ...prev, imageUrl: url }))
                            );
                          }
                        }}
                      />
                    </label>
                  </div>
                  {photoForm.imageUrl && (
                    <div className="relative w-36 h-28 rounded-xl overflow-hidden border border-amber-400/50 bg-stone-950">
                      <img
                        src={photoForm.imageUrl}
                        alt="Photo Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setPhotoForm({ ...photoForm, imageUrl: '' })}
                        className="absolute top-1 right-1 bg-black/80 text-white p-1 rounded-full text-[10px] hover:bg-red-600 cursor-pointer"
                        title="Remove gallery photo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>


              <div>
                <label className="block font-bold mb-1 uppercase">Caption (Optional)</label>
                <input
                  type="text"
                  placeholder="Short description..."
                  value={photoForm.caption}
                  onChange={(e) => setPhotoForm({ ...photoForm, caption: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-transparent"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPhotoModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border font-bold hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-red-600 text-yellow-300 font-bold border border-yellow-400 cursor-pointer"
                >
                  Save Photo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ANNOUNCEMENT MODAL */}
      {isAnnouncementModalOpen && (
        <div
          onClick={() => setIsAnnouncementModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative max-w-lg w-full p-6 sm:p-8 rounded-3xl border-2 border-red-600 shadow-2xl space-y-6 overflow-y-auto max-h-[90vh] ${
              isDark ? 'bg-stone-900 text-stone-100' : 'bg-white text-stone-900'
            }`}
          >
            <button
              onClick={() => setIsAnnouncementModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-900 dark:hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-red-600">
              <Megaphone className="w-6 h-6" />
              <h3 className="text-xl font-serif font-black">
                {editingAnnouncement ? 'Modify Announcement' : 'Push New Announcement'}
              </h3>
            </div>

            <form onSubmit={handleSaveAnnouncement} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1 uppercase">Announcement Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ganesha Chaturthi Prasada Distribution Schedule"
                  value={announcementForm.title || ''}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-transparent"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 uppercase">Kannada Title</label>
                <input
                  type="text"
                  placeholder="e.g. ಗಣೇಶ ಚತುರ್ಥಿ ಪ್ರಸಾದ ವಿನಿಯೋಗ ಮಾರ್ಗಸೂಚಿಗಳು"
                  value={announcementForm.kannadaTitle || ''}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, kannadaTitle: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-transparent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-1 uppercase">Category</label>
                  <select
                    value={announcementForm.category || 'event'}
                    onChange={(e) =>
                      setAnnouncementForm({ ...announcementForm, category: e.target.value as any })
                    }
                    className="w-full p-2.5 rounded-xl border bg-transparent"
                  >
                    <option value="event">Event Notice</option>
                    <option value="cultural">Cultural Arts</option>
                    <option value="volunteer">Volunteer Seva</option>
                    <option value="finance">General / Finance</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1 uppercase">Date Label</label>
                  <input
                    type="text"
                    placeholder="e.g. 10 Sep 2026"
                    value={announcementForm.date || ''}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, date: e.target.value })}
                    className="w-full p-2.5 rounded-xl border bg-transparent"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="ann-important"
                  checked={announcementForm.important ?? true}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, important: e.target.checked })}
                  className="w-4 h-4 accent-red-600 rounded cursor-pointer"
                />
                <label htmlFor="ann-important" className="font-bold cursor-pointer text-stone-700 dark:text-stone-300">
                  Highlight as Important Notice (Red Badge)
                </label>
              </div>

              <div>
                <label className="block font-bold mb-1 uppercase">Short Summary *</label>
                <input
                  type="text"
                  required
                  placeholder="Brief 1-sentence summary for the homepage banner..."
                  value={announcementForm.summary || ''}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, summary: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-transparent"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 uppercase">Detailed Announcement Content *</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Full details, pooja timings, rules, or guidelines..."
                  value={announcementForm.content || ''}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-transparent font-sans"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAnnouncementModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border font-bold hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-red-600 text-yellow-300 font-bold border border-yellow-400 cursor-pointer"
                >
                  Push Announcement Live
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmTarget && (
        <div
          onClick={() => setDeleteConfirmTarget(null)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative max-w-md w-full p-6 sm:p-8 rounded-3xl border-2 border-red-600 shadow-2xl space-y-6 ${
              isDark ? 'bg-stone-900 text-stone-100' : 'bg-white text-stone-900'
            }`}
          >
            <button
              onClick={() => setDeleteConfirmTarget(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-900 dark:hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center mb-2">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-serif font-black text-stone-900 dark:text-stone-100">
                Confirm Removal
              </h3>
              <p className="text-xs text-stone-500">
                Are you sure you want to delete{' '}
                <strong className="text-stone-900 dark:text-stone-200">
                  "{deleteConfirmTarget.title}"
                </strong>
                ? This action will remove it from the website immediately.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmTarget(null)}
                className="px-4 py-2.5 rounded-xl border font-bold hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer text-xs"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecuteDelete}
                className="px-6 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 cursor-pointer text-xs shadow-xs"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
