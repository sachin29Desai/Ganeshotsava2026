import React, { useState, useEffect } from 'react';
import {
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Flag,
  Flame,
  X,
  Send,
  ChevronRight,
  Mail,
  Clock,
  Menu,
  Info,
  Award,
  User as UserIcon,
  Sun,
  Moon,
  CheckCircle,
  UserCheck,
  FileCheck,
  Heart,
  BadgeIndianRupee,
  Lock,
  ShieldCheck,
  Settings,
  Megaphone,
  Bell,
  ExternalLink
} from 'lucide-react';
import { AppSettings, Contribution, UserRole, UserProfile } from '../types';
import {
  COMMUNITY_EVENTS,
  ANNOUNCEMENTS,
  CommunityEvent,
  GalleryPhoto,
  CommitteeMember,
  AnnouncementItem
} from '../data/communityData';
import { getStoredEvents, classifyEvents } from '../utils/eventUtils';
import {
  getStoredTeamMembers,
  getStoredPhotos,
  getStoredAnnouncements,
  getStoredFormLinks,
  FormLinksConfig
} from '../utils/dataUtils';
import { BalagaAuthModal } from './balaga/BalagaAuthModal';
import { BalagaVolunteerModal } from './balaga/BalagaVolunteerModal';
import { BalagaNominateModal } from './balaga/BalagaNominateModal';
import { BalagaPolicyModals } from './balaga/BalagaPolicyModals';
import { BalagaLoginView } from './balaga/BalagaLoginView';
import { BalagaEventDetailView } from './balaga/BalagaEventDetailView';
import { AdminPortalView } from './AdminPortalView';
import {
  auth,
  onAuthStateChanged,
  type User,
  cloudGetCommunityEvents,
  cloudGetCommunityTeam,
  cloudGetCommunityPhotos,
  cloudGetCommunityAnnouncements,
  cloudGetCommunityFormLinks
} from '../lib/firebase';

interface CommunityHomeViewProps {
  settings: AppSettings;
  contributions: Contribution[];
  onNavigateToGaneshotsava: () => void;
  onNavigateToReceipts: () => void;
  isAdmin?: boolean;
  userRole?: UserRole | null;
  userProfile?: UserProfile | null;
  onUpdateSettings?: (cfg: AppSettings) => void;
}

export type CommunityPageTab =
  | 'home'
  | 'about'
  | 'our-team'
  | 'past-events'
  | 'upcoming-events'
  | 'membership'
  | 'contact'
  | 'event-detail'
  | 'login'
  | 'admin';

export const CommunityHomeView: React.FC<CommunityHomeViewProps> = ({
  settings,
  contributions,
  onNavigateToGaneshotsava,
  onNavigateToReceipts,
  isAdmin = false,
  userRole,
  userProfile,
  onUpdateSettings
}) => {
  // All events list and auto-classified events
  const [allEvents, setAllEvents] = useState<CommunityEvent[]>(() => getStoredEvents());
  const [teamMembersList, setTeamMembersList] = useState<CommitteeMember[]>(() => getStoredTeamMembers());
  const [photosList, setPhotosList] = useState<GalleryPhoto[]>(() => getStoredPhotos());
  const [announcementsList, setAnnouncementsList] = useState<AnnouncementItem[]>(() => getStoredAnnouncements());
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementItem | null>(null);
  const [formLinks, setFormLinks] = useState<FormLinksConfig>(() => getStoredFormLinks());

  const refreshAllData = () => {
    setAllEvents(getStoredEvents());
    setTeamMembersList(getStoredTeamMembers());
    setPhotosList(getStoredPhotos());
    setAnnouncementsList(getStoredAnnouncements());
    setFormLinks(getStoredFormLinks());
  };

  // Continuous Cloud Sync on load
  useEffect(() => {
    async function loadCloudCommunityData() {
      try {
        const [cloudEvents, cloudTeam, cloudPhotos, cloudAnnouncements, cloudLinks] = await Promise.all([
          cloudGetCommunityEvents(),
          cloudGetCommunityTeam(),
          cloudGetCommunityPhotos(),
          cloudGetCommunityAnnouncements(),
          cloudGetCommunityFormLinks()
        ]);

        if (cloudEvents && cloudEvents.length > 0) {
          setAllEvents(cloudEvents);
        }
        if (cloudTeam && cloudTeam.length > 0) {
          setTeamMembersList(cloudTeam);
        }
        if (cloudPhotos && cloudPhotos.length > 0) {
          setPhotosList(cloudPhotos);
        }
        if (cloudAnnouncements && cloudAnnouncements.length > 0) {
          setAnnouncementsList(cloudAnnouncements);
        }
        if (cloudLinks) {
          setFormLinks(prev => ({ ...prev, ...cloudLinks }));
        }
      } catch (err) {
        console.warn('Failed to load cloud community data:', err);
      }
    }

    loadCloudCommunityData();
  }, []);

  const { currentEvents, upcomingEvents, pastEvents } = classifyEvents(allEvents);

  // Target event for home page timer (next upcoming event or active event)
  const targetUpcomingEvent = upcomingEvents[0] || currentEvents[0] || allEvents[0];

  // Theme state synced with localStorage
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      return localStorage.getItem('kb_theme_is_dark') === 'true';
    } catch {
      return false;
    }
  });

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('kb_theme_is_dark', next ? 'true' : 'false');
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);


  // Route initial detection matching the 7 Sharavati reference pages + Admin Portal
  const getInitialTabFromLocation = (): { tab: CommunityPageTab; eventId?: string } => {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();

    if (path.includes('/admin') || hash.includes('admin')) {
      return { tab: 'admin' };
    }
    if (path.includes('/login') || hash.includes('login')) {
      return { tab: 'login' };
    }
    if (path.includes('/events/') || hash.includes('/events/')) {
      const parts = path.split('/events/');
      const slug = parts[1] || 'rajyotsava-2026';
      return { tab: 'event-detail', eventId: slug.replace(/\/$/, '') };
    }
    if (path.includes('/about-us') || path.includes('/about') || hash.includes('about')) {
      return { tab: 'about' };
    }
    if (path.includes('/our-team') || path.includes('/team') || hash.includes('team')) {
      return { tab: 'our-team' };
    }
    if (path.includes('/past-events') || path.includes('/past') || hash.includes('past')) {
      return { tab: 'past-events' };
    }
    if (path.includes('/upcoming-events') || path.includes('/upcoming') || hash.includes('upcoming')) {
      return { tab: 'upcoming-events' };
    }
    if (path.includes('/membership') || hash.includes('membership')) {
      return { tab: 'membership' };
    }
    if (path.includes('/contact-us') || path.includes('/contact') || hash.includes('contact')) {
      return { tab: 'contact' };
    }
    return { tab: 'home' };
  };

  const initialRouteInfo = getInitialTabFromLocation();
  const [activeTab, setActiveTab] = useState<CommunityPageTab>(initialRouteInfo.tab);
  const [selectedEventId, setSelectedEventId] = useState<string>(
    initialRouteInfo.eventId || upcomingEvents[0]?.id || 'rajyotsava-2026'
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Authentication state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Allowed emails for admin access
  const [allowedEmails, setAllowedEmails] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ekb_allowed_emails');
      if (saved) return JSON.parse(saved);
    } catch {}
    return ['desaisachin95@gmail.com'];
  });

  const handleUpdateAllowedEmails = (emails: string[]) => {
    setAllowedEmails(emails);
    try {
      localStorage.setItem('ekb_allowed_emails', JSON.stringify(emails));
    } catch {}
  };

  useEffect(() => {
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          setCurrentUser(user);
        }
      });
      return () => unsubscribe();
    }
  }, []);

  // Lightbox Photo
  const [lightboxPhoto, setLightboxPhoto] = useState<GalleryPhoto | null>(null);

  // Modals state
  const [volunteerModalOpen, setVolunteerModalOpen] = useState(false);
  const [nominateModalOpen, setNominateModalOpen] = useState(false);
  const [policyModal, setPolicyModal] = useState<'privacy' | 'terms' | 'refund' | 'cookies' | null>(null);

  // Contact form state
  const [contactForm, setContactForm] = useState({
    fullName: '',
    email: '',
    towerFlat: '',
    subject: 'General enquiry',
    message: ''
  });
  const [contactSubmitted, setContactSubmitted] = useState(false);

  // Membership modal state
  const [membershipModalOpen, setMembershipModalOpen] = useState(false);
  const [selectedMembershipType, setSelectedMembershipType] = useState<'primary' | 'additional'>('primary');
  const [membershipForm, setMembershipForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    towerFlat: '',
    additionalMembersCount: '0',
    notes: ''
  });
  const [membershipSubmitted, setMembershipSubmitted] = useState(false);

  // Countdown state dynamically synchronized with upcoming event date
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    let targetTime: number;
    if (targetUpcomingEvent && targetUpcomingEvent.startDate) {
      // Parse YYYY-MM-DD e.g. "2026-11-21" -> timestamp
      const parsed = new Date(`${targetUpcomingEvent.startDate}T09:00:00`).getTime();
      targetTime = isNaN(parsed) ? new Date('2026-11-21T09:00:00+05:30').getTime() : parsed;
    } else {
      targetTime = new Date('2026-11-21T09:00:00+05:30').getTime();
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = Math.max(0, targetTime - now);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown({ days, hours, minutes, seconds });
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [targetUpcomingEvent?.startDate]);

  // Tab navigation & URL syncing
  const handleNavigateTab = (tab: CommunityPageTab, eventId?: string) => {
    setActiveTab(tab);
    if (eventId) {
      setSelectedEventId(eventId);
    }
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    let newPath = '/';
    if (tab === 'home') newPath = '/';
    else if (tab === 'about') newPath = '/about-us';
    else if (tab === 'our-team') newPath = '/our-team';
    else if (tab === 'past-events') newPath = '/past-events';
    else if (tab === 'upcoming-events') newPath = '/upcoming-events';
    else if (tab === 'membership') newPath = '/membership';
    else if (tab === 'contact') newPath = '/contact-us';
    else if (tab === 'event-detail') newPath = `/events/${eventId || selectedEventId || 'rajyotsava-2026'}`;
    else if (tab === 'login') newPath = '/login';
    else if (tab === 'admin') newPath = '/admin';

    try {
      window.history.pushState({}, '', newPath);
    } catch {}
  };

  useEffect(() => {
    const handlePopState = () => {
      const info = getInitialTabFromLocation();
      setActiveTab(info.tab);
      if (info.eventId) setSelectedEventId(info.eventId);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const selectedEvent =
    allEvents.find((e) => e.id === selectedEventId || e.slug === selectedEventId) ||
    allEvents[0];

  const isCurrentAdmin =
    isAdmin ||
    (!!currentUser?.email &&
      allowedEmails.map((e) => e.toLowerCase()).includes(currentUser.email.toLowerCase()));

  // Contact submit handler
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.fullName || !contactForm.email || !contactForm.message) return;
    setContactSubmitted(true);
  };

  // Membership submit handler
  const handleMembershipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!membershipForm.fullName || !membershipForm.email) return;
    setMembershipSubmitted(true);
  };

  // If viewing Admin Management Portal ('/admin' or tab === 'admin')
  if (activeTab === 'admin') {
    return (
      <AdminPortalView
        currentUser={currentUser}
        onNavigateHome={() => handleNavigateTab('home')}
        onRefreshData={refreshAllData}
        isDark={isDark}
      />
    );
  }

  // If viewing standalone Login Route ('/login' or tab === 'login')
  if (activeTab === 'login') {
    return (
      <BalagaLoginView
        settings={settings}
        currentUser={currentUser}
        allowedEmails={allowedEmails}
        onUserChange={(user) => {
          setCurrentUser(user);
          setActiveTab('home');
        }}
        onNavigateHome={() => handleNavigateTab('home')}
        onAdminPasscodeSuccess={() => {
          handleNavigateTab('admin');
        }}
        isDark={isDark}
      />
    );
  }

  // The 7 Reference Navbar Links matching sharavationline.org
  const navLinks: { id: CommunityPageTab; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About Us' },
    { id: 'our-team', label: 'Our Team' },
    { id: 'past-events', label: 'Past Events' },
    { id: 'upcoming-events', label: 'Upcoming Events' },
    { id: 'membership', label: 'Membership' },
    { id: 'contact', label: 'Contact Us' }
  ];

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 selection:bg-red-600 selection:text-yellow-200 ${
        isDark ? 'bg-stone-950 text-stone-100' : 'bg-[#FFFDF7] text-[#1C1917]'
      }`}
    >
      {/* 0. KARNATAKA FLAG BICOLOR ACCENT BAND (Red top, Yellow bottom) */}
      <div className="w-full flex flex-col no-print z-50">
        <div className="h-2.5 bg-[#DC2626] w-full" />
        <div className="h-2.5 bg-[#FBBF24] w-full" />
      </div>

      {/* 1. TOP NAVIGATION HEADER (Matching the exact 7 Sharavati Reference Pages) */}
      <header
        className={`sticky top-0 z-40 border-b-2 border-red-600 shadow-xs backdrop-blur-md transition-colors ${
          isDark ? 'bg-stone-900/95 text-stone-100' : 'bg-white/95 text-stone-900'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Brand Logo & Name */}
          <div
            onClick={() => handleNavigateTab('home')}
            className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-600 via-red-600 to-amber-500 p-1 flex items-center justify-center shadow-xs border-2 border-yellow-400 group-hover:scale-105 transition-transform overflow-hidden">
              <img
                src="/bhuvaneshwari_kannada_flag.jpg"
                alt="Goddess Bhuvaneshwari Devi with Kannada Flag"
                className="w-full h-full object-cover rounded-lg"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-black text-lg sm:text-xl text-red-600 tracking-tight">
                  ಕನ್ನಡಿಗರ ಬಳಗ
                </span>
                <span className="text-xs text-stone-400 hidden sm:inline">|</span>
                <span className="text-xs font-bold text-amber-600 dark:text-yellow-400 uppercase tracking-wider hidden md:inline">
                  Kannadigara Balaga
                </span>
              </div>
              <p className={`text-[11px] font-medium hidden sm:block ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                Eldorado • ಸಿರಿಗನ್ನಡಂ ಗೆಲ್ಗೆ!
              </p>
            </div>
          </div>

          {/* Desktop 7-Page Reference Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-semibold">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavigateTab(link.id)}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer relative inline-flex items-center gap-1.5 ${
                  activeTab === link.id
                    ? isDark
                      ? 'bg-red-950/60 text-yellow-300 font-bold border-b-2 border-red-600'
                      : 'bg-red-50 text-red-700 font-bold border-b-2 border-red-600'
                    : isDark
                    ? 'text-stone-300 hover:text-white hover:bg-stone-800'
                    : 'text-stone-700 hover:text-red-700 hover:bg-stone-50'
                }`}
              >
                <span>{link.label}</span>
              </button>
            ))}
          </nav>

          {/* Header Controls */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isDark
                  ? 'bg-stone-800 border-stone-700 text-yellow-400 hover:bg-stone-700'
                  : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100 hover:text-red-700'
              }`}
              title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Admin Portal Entry Point */}
            <button
              onClick={() => handleNavigateTab('admin')}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                isDark
                  ? 'bg-stone-800 border-stone-700 text-stone-200 hover:bg-stone-700'
                  : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
              }`}
              title="Committee Admin Portal"
            >
              <Lock className="w-3.5 h-3.5 text-red-600" />
              <span className="hidden sm:inline">Admin Portal</span>
            </button>

            <button
              onClick={() => handleNavigateTab('membership')}
              className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-yellow-300 font-bold text-xs shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 border border-yellow-400"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Become a Member</span>
              <span className="sm:hidden">Join</span>
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`lg:hidden p-2 rounded-xl border transition-colors cursor-pointer ${
                isDark
                  ? 'bg-stone-800 border-stone-700 text-white'
                  : 'bg-stone-50 border-stone-200 text-stone-700'
              }`}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div
            className={`lg:hidden border-t px-4 py-4 space-y-2 animate-in slide-in-from-top duration-200 ${
              isDark ? 'bg-stone-900 border-stone-800 text-white' : 'bg-white border-stone-200 text-stone-800'
            }`}
          >
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavigateTab(link.id)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer flex items-center justify-between ${
                  activeTab === link.id
                    ? isDark
                      ? 'bg-red-950/60 text-yellow-300 font-bold'
                      : 'bg-red-50 text-red-700 font-bold'
                    : isDark
                    ? 'text-stone-300 hover:bg-stone-800'
                    : 'text-stone-700 hover:bg-stone-50'
                }`}
              >
                <span>{link.label}</span>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </button>
            ))}

            <button
              onClick={() => handleNavigateTab('admin')}
              className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-bold text-red-600 flex items-center justify-between border border-red-200 dark:border-red-900"
            >
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                <span>Admin Portal</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </header>

      {/* 2. MAIN BODY PAGES */}
      <main className="flex-1">
        {/* ========================================================
            PAGE 1: HOME PAGE ('home')
           ======================================================== */}
        {activeTab === 'home' && (
          <div className="space-y-12 sm:space-y-16 py-8 sm:py-12">
            {/* HERO SECTION */}
            <section className="max-w-6xl mx-auto px-4 sm:px-6">
              <div
                className={`relative rounded-3xl p-6 sm:p-12 border-2 shadow-sm overflow-hidden text-center sm:text-left transition-all ${
                  isDark
                    ? 'bg-gradient-to-br from-stone-900 via-stone-900 to-red-950/40 border-stone-800'
                    : 'bg-gradient-to-br from-white via-[#FFFDF7] to-amber-50/60 border-stone-200'
                }`}
              >
                <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none select-none flex items-center justify-end pr-6">
                  <img
                    src="/bhuvaneshwari_kannada_flag.jpg"
                    alt="Goddess Bhuvaneshwari Devi &amp; Kannada Flag"
                    className="h-96 w-auto object-contain rounded-2xl opacity-25"
                  />
                </div>

                <div className="relative z-10 max-w-3xl space-y-5">
                  <div className="inline-flex items-center gap-2 bg-red-600 text-yellow-300 text-[11px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-xs border border-yellow-400">
                    <Flag className="w-3.5 h-3.5" />
                    <span>ಸಿರಿಗನ್ನಡಂ ಗೆಲ್ಗೆ! ಸಿರಿಗನ್ನಡಂ ಬಾಳ್ಗೆ!</span>
                  </div>

                  <div>
                    <h1 className={`text-3xl sm:text-5xl lg:text-6xl font-serif font-black tracking-tight leading-tight ${
                      isDark ? 'text-stone-100' : 'text-stone-950'
                    }`}>
                      Kannadigara Balaga: Celebrating Our Heritage.
                    </h1>
                    <span className="text-base sm:text-xl font-serif font-bold text-red-700 dark:text-red-400 block mt-2">
                      ಎಲ್ ಡೊರಾಡೊ ಕನ್ನಡಿಗರ ಬಳಗ: ನಮ್ಮ ಸಂಸ್ಕೃತಿ, ನಮ್ಮ ಹೆಮ್ಮೆ
                    </span>
                  </div>

                  <p className={`text-sm sm:text-base leading-relaxed font-medium ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
                    A resident-driven community forum of Eldorado dedicated to preserving and celebrating
                    Kannada language, folk traditions, Vedic poojas, and grand annual festivals in our neighborhood.
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-3 justify-center sm:justify-start">
                    <button
                      onClick={() => handleNavigateTab('upcoming-events')}
                      className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-yellow-300 font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer inline-flex items-center gap-2 border border-yellow-400 active:scale-95"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Explore Upcoming Events</span>
                    </button>

                    <button
                      onClick={() => handleNavigateTab('membership')}
                      className="px-5 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-stone-950 font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer inline-flex items-center gap-2"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Become a Member</span>
                    </button>

                    <button
                      onClick={() => handleNavigateTab('about')}
                      className={`px-5 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer inline-flex items-center gap-2 border ${
                        isDark
                          ? 'bg-stone-800 hover:bg-stone-700 border-stone-700 text-white'
                          : 'bg-white hover:bg-stone-50 border-stone-300 text-stone-800'
                      }`}
                    >
                      <Info className="w-4 h-4 text-red-600" />
                      <span>About Us</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* UPCOMING EVENT HIGHLIGHT BANNER (DYNAMICALLY SYNCED WITH ADMIN DATES) */}
            {targetUpcomingEvent && (
              <section className="max-w-6xl mx-auto px-4 sm:px-6">
                <div
                  className={`rounded-3xl border-2 p-6 sm:p-8 shadow-sm transition-all ${
                    isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                  }`}
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-3 max-w-2xl">
                      <div className="inline-flex items-center gap-2 bg-red-600 text-yellow-300 text-[11px] font-bold uppercase px-3 py-1 rounded-full border border-yellow-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Next Major Celebration</span>
                      </div>

                      <div>
                        <h3 className="text-2xl sm:text-3xl font-serif font-black text-red-700 dark:text-red-400">
                          {targetUpcomingEvent.title}
                        </h3>
                        {targetUpcomingEvent.kannadaTitle && (
                          <span className="text-sm font-serif font-bold text-amber-800 dark:text-yellow-400 block mt-0.5">
                            {targetUpcomingEvent.kannadaTitle} — {targetUpcomingEvent.dateDisplay || targetUpcomingEvent.startDate}
                          </span>
                        )}
                      </div>

                      <p className={`text-xs sm:text-sm leading-relaxed font-medium ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
                        {targetUpcomingEvent.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 pt-1">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-red-600 shrink-0" />
                          <span>{targetUpcomingEvent.dateDisplay || targetUpcomingEvent.startDate}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
                          <span>{targetUpcomingEvent.venue}</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 space-y-3 text-center md:text-right w-full md:w-auto">
                      <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-stone-800 border border-amber-200 dark:border-stone-700">
                        <span className="text-[10px] font-bold text-amber-800 dark:text-yellow-300 uppercase block mb-1">
                          Countdown to Event
                        </span>
                        <div className="flex items-center gap-2 text-red-600 font-serif font-black text-xl justify-center">
                          <span>{countdown.days}d</span>
                          <span>:</span>
                          <span>{countdown.hours}h</span>
                          <span>:</span>
                          <span>{countdown.minutes}m</span>
                          <span>:</span>
                          <span>{countdown.seconds}s</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleNavigateTab('upcoming-events')}
                        className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-yellow-300 font-bold text-xs shadow-xs transition-colors cursor-pointer inline-flex items-center gap-2 w-full justify-center"
                      >
                        <span>View Event Details</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* LATEST ANNOUNCEMENTS SECTION (PUSHED LIVE BY ADMIN) */}
            <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 bg-red-600 text-yellow-300 text-[11px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full border border-yellow-400">
                    <Megaphone className="w-3.5 h-3.5" />
                    <span>ಇತ್ತೀಚಿನ ಪ್ರಕಟಣೆಗಳು</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-serif font-black text-stone-900 dark:text-stone-100">
                    Latest Official Announcements
                  </h2>
                </div>

                {isCurrentAdmin && (
                  <button
                    onClick={() => handleNavigateTab('admin')}
                    className="px-3.5 py-1.5 rounded-xl bg-stone-900 text-yellow-300 dark:bg-stone-800 font-bold text-xs hover:bg-stone-800 cursor-pointer inline-flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <Megaphone className="w-3.5 h-3.5" />
                    <span>Manage Announcements</span>
                  </button>
                )}
              </div>

              {announcementsList.length === 0 ? (
                <div className="p-8 text-center rounded-3xl border border-dashed border-stone-300 dark:border-stone-800 text-stone-500 text-xs">
                  No official announcements posted yet. Check back soon for updates from Balaga Committee.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {announcementsList.map((ann) => (
                    <div
                      key={ann.id}
                      onClick={() => setSelectedAnnouncement(ann)}
                      className={`p-6 rounded-3xl border-2 space-y-4 shadow-xs transition-all cursor-pointer hover:border-red-600 flex flex-col justify-between ${
                        isDark
                          ? 'bg-stone-900 border-stone-800 hover:bg-stone-850'
                          : 'bg-white border-stone-200 hover:bg-amber-50/30'
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
                          <h3 className="font-serif font-black text-lg text-stone-900 dark:text-stone-100 group-hover:text-red-600">
                            {ann.title}
                          </h3>
                          {ann.kannadaTitle && (
                            <span className="text-xs font-serif font-bold text-amber-700 dark:text-yellow-400 block mt-0.5">
                              {ann.kannadaTitle}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-stone-500 leading-relaxed line-clamp-3">
                          {ann.summary || ann.content}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs text-stone-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-red-600" />
                          {ann.date}
                        </span>
                        <span className="font-bold text-red-600 dark:text-yellow-400 inline-flex items-center gap-1">
                          Read Notice <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ========================================================
            PAGE 2: ABOUT US PAGE ('about')
           ======================================================== */}
        {activeTab === 'about' && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <div className="inline-flex items-center gap-2 bg-red-600 text-yellow-300 text-[11px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full border border-yellow-400">
                <Flag className="w-3.5 h-3.5" />
                <span>ನಮ್ಮ ಬಳಗದ ಪರಿಚಯ • About Us</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-serif font-black tracking-tight text-stone-900 dark:text-stone-100">
                Eldorado Kannadigara Balaga
              </h2>
              <p className={`text-base leading-relaxed ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                Of the Residents, By the Residents, For the Celebration of Kannada Culture in Brigade El Dorado.
              </p>
            </div>

            {/* Origins & History */}
            <div
              className={`p-6 sm:p-10 rounded-3xl border-2 space-y-6 ${
                isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-amber-500 p-1 flex items-center justify-center shadow-md border-2 border-yellow-400 shrink-0">
                  <img
                    src="/bhuvaneshwari_kannada_flag.jpg"
                    alt="Bhuvaneshwari Devi"
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <div>
                  <h3 className="text-2xl font-serif font-black text-red-700 dark:text-red-400">
                    Our Foundation &amp; Journey
                  </h3>
                  <span className="text-xs font-serif font-bold text-amber-700 dark:text-yellow-400 block">
                    ಸ್ಥಾಪನೆ ಮತ್ತು ಬೆಳೆದು ಬಂದ ಹಾದಿ (2024 - 2026)
                  </span>
                </div>
              </div>

              <div className={`space-y-4 text-sm leading-relaxed font-medium ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
                <p>
                  Founded in 2024 by resident families residing at Brigade El Dorado, Eldorado Kannadigara Balaga was created as a voluntary, non-profit community forum to bring together Kannada-speaking residents and enthusiasts across all towers.
                </p>
                <p>
                  Over the past 3 years, our Balaga has grown from a modest gathering of founding volunteers into a vibrant community hosting major annual milestones: 5-day Sri Ganesha Chaturthi Mahotsava, Karnataka Rajyotsava statehood days, Kannada literature symposia, and eco-friendly tree planting drives.
                </p>
              </div>
            </div>

            {/* Vision & Mission Pillars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: 'Cultural Heritage',
                  kannada: 'ಸಾಂಸ್ಕೃತಿಕ ಪರಂಪರೆ',
                  desc: 'Promoting Kannada literature, classical music, folk arts (Dollu Kunitha, Yakshagana), and festive attire among children and youth.',
                  icon: Sparkles
                },
                {
                  title: 'Devotional Seva',
                  kannada: 'ಭಕ್ತಿ ಮತ್ತು ಸೇವೆ',
                  desc: 'Conducting traditional Vedic poojas, Atharvashirsha parayana, and daily Anna Santharpane Mahaprasada for all devotees.',
                  icon: Flame
                },
                {
                  title: 'Community Harmony',
                  kannada: 'ಸೌಹಾರ್ದತೆ',
                  desc: 'Fostering unity, mutual cooperation, and resident fellowship across all towers.',
                  icon: Users
                }
              ].map((pillar, idx) => (
                <div
                  key={idx}
                  className={`p-6 rounded-3xl border-2 space-y-3 ${
                    isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                  }`}
                >
                  <div className="w-10 h-10 rounded-2xl bg-red-600 text-yellow-300 flex items-center justify-center border border-yellow-400">
                    <pillar.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-lg font-serif font-black">{pillar.title}</h4>
                    <span className="text-xs font-serif font-bold text-amber-700 dark:text-yellow-400 block">
                      {pillar.kannada}
                    </span>
                  </div>
                  <p className={`text-xs leading-relaxed font-medium ${isDark ? 'text-stone-200' : 'text-stone-700'}`}>
                    {pillar.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Symbolism: Red & Yellow Kannada Flag */}
            <div className="p-6 sm:p-8 rounded-3xl border-2 border-red-600 bg-gradient-to-r from-red-950 via-stone-900 to-amber-950 text-white space-y-4">
              <div className="flex items-center gap-3">
                <Flag className="w-6 h-6 text-yellow-400" />
                <h3 className="text-2xl font-serif font-black text-yellow-300">
                  Symbolism of the Red &amp; Yellow Flag
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-stone-200 leading-relaxed">
                The bi-color Kannada flag represents the colors of Arishina (Turmeric - Yellow) and Kumpuma (Vermilion - Red), symbolizing health, prosperity, peace, and auspicious beginnings in Karnataka's ancient culture. Goddess Bhuvaneshwari Devi stands as our mother guardian.
              </p>
            </div>
          </div>
        )}

        {/* ========================================================
            PAGE 3: OUR TEAM PAGE ('our-team')
           ======================================================== */}
        {activeTab === 'our-team' && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <div className="inline-flex items-center gap-2 bg-red-600 text-yellow-300 text-[11px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full border border-yellow-400">
                <Users className="w-3.5 h-3.5" />
                <span>ಕಾರ್ಯಕಾರಿಣಿ ಸಮಿತಿ • Our Team</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-serif font-black tracking-tight text-stone-900 dark:text-stone-100">
                Meet Our Team
              </h2>
              <p className={`text-base leading-relaxed font-medium ${isDark ? 'text-stone-200' : 'text-stone-700'}`}>
                Dedicated resident volunteers guiding festival celebrations and community initiatives.
              </p>
            </div>

            {/* Clean Committee Member Cards Grid (Member Photo, Name, Post/Role) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {teamMembersList.map((member, idx) => (
                <div
                  key={idx}
                  className={`rounded-3xl border-2 overflow-hidden shadow-xs hover:shadow-md transition-all text-center ${
                    isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                  }`}
                >
                  <div className="aspect-[4/5] bg-stone-900 relative overflow-hidden">
                    {member.photoUrl ? (
                      <img
                        src={member.photoUrl}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-red-600 to-amber-500 text-yellow-300 font-serif font-black text-2xl flex items-center justify-center">
                        {member.initials || member.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-1">
                    <h4 className="font-serif font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100">
                      {member.name}
                    </h4>
                    <p className="text-xs font-bold text-red-600 dark:text-yellow-400">
                      {member.role}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Call to Volunteer Squad */}
            <div className="p-8 rounded-3xl bg-amber-400 text-stone-950 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="text-2xl font-serif font-black">Want to join our Volunteer Squad?</h3>
                <p className="text-xs sm:text-sm text-stone-800">
                  Enrol in Pooja, Stage Setup, Cultural Coordination, Prasadam serving, or Hospitality teams.
                </p>
              </div>

              <button
                onClick={() => {
                  if (!currentUser) setAuthModalOpen(true);
                  else setVolunteerModalOpen(true);
                }}
                className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-yellow-300 font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer border border-yellow-400 shrink-0"
              >
                Sign Up as Volunteer
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            PAGE 4: PAST EVENTS PAGE ('past-events')
           ======================================================== */}
        {activeTab === 'past-events' && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <div className="inline-flex items-center gap-2 bg-red-600 text-yellow-300 text-[11px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full border border-yellow-400">
                <Award className="w-3.5 h-3.5" />
                <span>ಕಳೆದ ಉತ್ಸವಗಳ ಇತಿಹಾಸ • Past Events Archive</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-serif font-black tracking-tight text-stone-900 dark:text-stone-100">
                Concluded Celebrations
              </h2>
              <p className={`text-base leading-relaxed font-medium ${isDark ? 'text-stone-200' : 'text-stone-700'}`}>
                Browse our history of Sri Ganeshotsava and Rajyotsava celebrations from 2024 to 2026.
              </p>
            </div>

            {/* Past Events Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {pastEvents.map((evt) => (
                <div
                  key={evt.id}
                  className={`p-6 sm:p-8 rounded-3xl border-2 space-y-5 shadow-xs flex flex-col justify-between ${
                    isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-red-600 text-yellow-300 px-2.5 py-0.5 rounded">
                        {evt.festival} • {evt.year}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Concluded</span>
                      </span>
                    </div>

                    <div>
                      <h3 className="text-2xl font-serif font-black text-stone-900 dark:text-stone-100">
                        {evt.title}
                      </h3>
                      <span className="text-xs font-serif font-bold text-amber-700 dark:text-yellow-400 block mt-0.5">
                        {evt.kannadaTitle}
                      </span>
                    </div>

                    <p className={`text-xs leading-relaxed font-medium ${isDark ? 'text-stone-200' : 'text-stone-700'}`}>
                      {evt.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-4">
                    <div className="text-xs text-stone-500">
                      <span>{evt.dateDisplay}</span>
                    </div>

                    <button
                      onClick={() => handleNavigateTab('event-detail', evt.id)}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-yellow-300 font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                    >
                      <span>View Highlights</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Gallery Lightbox Preview */}
            <div className="space-y-6 pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-serif font-black">Vaibhava Photo Gallery</h3>
                  <p className="text-xs text-stone-500">Snapshots from past resident performances</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {photosList.map((photo) => (
                  <div
                    key={photo.id}
                    onClick={() => setLightboxPhoto(photo)}
                    className="group rounded-2xl border overflow-hidden cursor-pointer aspect-[4/3] relative bg-stone-950"
                  >
                    <img
                      src={photo.imageUrl}
                      alt={photo.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                      <span className="text-white font-bold text-xs truncate">{photo.title}</span>
                      <span className="text-yellow-300 text-[10px]">{photo.celebration}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            PAGE 5: UPCOMING EVENTS PAGE ('upcoming-events')
           ======================================================== */}
        {activeTab === 'upcoming-events' && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <div className="inline-flex items-center gap-2 bg-red-600 text-yellow-300 text-[11px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full border border-yellow-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>ಮುಂಬರುವ ಕಾರ್ಯಕ್ರಮಗಳು • Upcoming Events</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-serif font-black tracking-tight text-stone-900 dark:text-stone-100">
                Upcoming Celebrations Calendar
              </h2>
              <p className={`text-base leading-relaxed font-medium ${isDark ? 'text-stone-200' : 'text-stone-700'}`}>
                Mark your calendar, sign up as a volunteer, or nominate your children for cultural performances.
              </p>
            </div>

            {/* Featured Mega Event: Rajyotsava 2026 */}
            <div
              className={`p-6 sm:p-10 rounded-3xl border-2 space-y-6 shadow-md ${
                isDark ? 'bg-stone-900 border-red-600' : 'bg-white border-red-600'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b pb-6 border-stone-200 dark:border-stone-800">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 bg-red-600 text-yellow-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                    <span>Featured Upcoming Event</span>
                  </div>
                  <h3 className="text-3xl font-serif font-black text-red-700 dark:text-red-400">
                    Karnataka Rajyotsava 2026
                  </h3>
                  <span className="text-base font-serif font-bold text-amber-700 dark:text-yellow-400 block">
                    ಕನ್ನಡ ರಾಜ್ಯೋತ್ಸವ ೨೦೨೬ — ಸಿರಿಗನ್ನಡಂ ಗೆಲ್ಗೆ!
                  </span>
                </div>

                {/* Countdown */}
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-stone-800 border border-amber-200 dark:border-stone-700 text-center shrink-0">
                  <span className="text-[10px] font-bold text-amber-800 dark:text-yellow-300 uppercase block mb-1">
                    Event Countdown
                  </span>
                  <div className="flex items-center gap-3 text-red-600 font-serif font-black text-2xl justify-center">
                    <div>
                      <span>{countdown.days}</span>
                      <span className="text-[10px] text-stone-400 block font-sans">Days</span>
                    </div>
                    <span>:</span>
                    <div>
                      <span>{countdown.hours}</span>
                      <span className="text-[10px] text-stone-400 block font-sans">Hours</span>
                    </div>
                    <span>:</span>
                    <div>
                      <span>{countdown.minutes}</span>
                      <span className="text-[10px] text-stone-400 block font-sans">Min</span>
                    </div>
                  </div>
                </div>
              </div>

              {targetUpcomingEvent.detailsOverview ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm">
                  {targetUpcomingEvent.detailsOverview.split(/\n\s*\n/).map((block, bIdx) => {
                    const lines = block.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
                    if (lines.length === 0) return null;
                    const headerLine = lines[0];
                    const itemLines = lines.slice(1);
                    const isDay2 = headerLine.toLowerCase().includes('day 2') || bIdx % 2 === 1;

                    return (
                      <div
                        key={bIdx}
                        className={`space-y-3 p-4 sm:p-5 rounded-2xl border transition-all ${
                          isDark
                            ? 'bg-stone-900/80 border-stone-800'
                            : 'bg-stone-50 border-stone-200/90 shadow-xs'
                        }`}
                      >
                        <h4 className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2 text-base">
                          {isDay2 ? (
                            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                          ) : (
                            <Flag className="w-4 h-4 text-red-600 shrink-0" />
                          )}
                          <span>{headerLine}</span>
                        </h4>

                        {itemLines.length > 0 ? (
                          <ul className="space-y-2 text-stone-800 dark:text-stone-200">
                            {itemLines.map((line, lIdx) => (
                              <li key={lIdx} className="flex items-start gap-2 font-medium">
                                <CheckCircle2
                                  className={`w-4 h-4 shrink-0 mt-0.5 ${
                                    isDay2 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600'
                                  }`}
                                />
                                <span>{line}</span>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-stone-100 dark:bg-stone-800/50 text-stone-700 dark:text-stone-300 text-xs italic">
                  Daily event schedule will be posted soon by the committee.
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => window.open(formLinks.volunteerFormUrl, '_blank', 'noopener,noreferrer')}
                  className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-yellow-300 font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer inline-flex items-center gap-2 border border-yellow-400"
                >
                  <Users className="w-4 h-4" />
                  <span>Volunteer for {targetUpcomingEvent.title || 'Rajyotsava'}</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
                </button>

                <button
                  onClick={() => window.open(formLinks.nominationFormUrl, '_blank', 'noopener,noreferrer')}
                  className="px-5 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-stone-950 font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer inline-flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-stone-950" />
                  <span>Nominate Stage Performance</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-0.5 text-stone-950" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            PAGE 6: MEMBERSHIP PAGE ('membership')
           ======================================================== */}
        {activeTab === 'membership' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <div className="inline-flex items-center gap-2 bg-red-600 text-yellow-300 text-[11px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full border border-yellow-400">
                <UserCheck className="w-3.5 h-3.5" />
                <span>ಸದಸ್ಯತ್ವ ನೋಂದಣಿ • Membership Registration</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-serif font-black tracking-tight text-stone-900 dark:text-stone-100">
                Membership Registration Open
              </h2>
            </div>

            {/* User Requested Announcement Card */}
            <div
              className={`p-6 sm:p-10 rounded-3xl border-2 space-y-8 shadow-md ${
                isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
              }`}
            >
              {/* Salutation & Welcome */}
              <div className="space-y-3">
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-red-600 dark:text-yellow-400">
                  Dear Bridge El Dorado Residents,
                </h3>
                <p className="text-sm sm:text-base font-semibold leading-relaxed">
                  We are happy to announce that Membership Registration for El Dorado Kannadigara Balaga is now open!
                </p>
                <p className={`text-xs sm:text-sm leading-relaxed font-medium ${isDark ? 'text-stone-200' : 'text-stone-700'}`}>
                  We warmly invite all Kannada-speaking families of Bridge El Dorado to become members and join hands in promoting our Kannada language, culture, traditions and community bonding.
                </p>
              </div>

              {/* Membership Fees */}
              <div className="p-5 rounded-2xl bg-amber-50 dark:bg-stone-800/80 border-2 border-amber-300 dark:border-stone-700 space-y-3">
                <div className="flex items-center gap-2 text-base font-serif font-bold text-amber-900 dark:text-yellow-300">
                  <BadgeIndianRupee className="w-5 h-5 text-red-600" />
                  <h4>💰 Membership Fees</h4>
                </div>
                <ul className="space-y-2 text-xs sm:text-sm text-stone-800 dark:text-stone-200 font-semibold">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
                    <span>Primary Member: <strong className="text-red-600 dark:text-yellow-300">₹999</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
                    <span>Additional Family Member (above 18 years): <strong className="text-red-600 dark:text-yellow-300">₹749</strong> per member.</span>
                  </li>
                </ul>
              </div>

              {/* How to Register & CTA Link */}
              <div className="p-6 sm:p-8 rounded-2xl bg-red-50 dark:bg-red-950/40 border-2 border-red-600 text-center space-y-4">
                <div className="space-y-1">
                  <h4 className="font-serif font-bold text-base sm:text-lg text-red-700 dark:text-yellow-300 flex items-center justify-center gap-2">
                    <span>📝 How to Register?</span>
                  </h4>
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 max-w-lg mx-auto">
                    Click the button below to open and fill out the official online membership application Google Form:
                  </p>
                </div>

                <div className="pt-2 flex justify-center">
                  <a
                    href={formLinks.membershipFormUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-8 py-4 rounded-2xl bg-red-600 hover:bg-red-700 text-yellow-300 font-black text-sm sm:text-base shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer inline-flex items-center gap-2 border-2 border-yellow-400"
                  >
                    <UserCheck className="w-5 h-5" />
                    <span>Register Now – Membership Application Form 📌</span>
                    <ExternalLink className="w-4 h-4 ml-1" />
                  </a>
                </div>
              </div>

              {/* Documents Required */}
              <div className="space-y-3 pt-2 border-t border-stone-100 dark:border-stone-800">
                <h4 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-red-600" />
                  <span>📌 Documents Required:</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                  <div className="p-4 rounded-2xl border bg-stone-50 dark:bg-stone-800/50 space-y-1">
                    <span className="font-bold block text-red-600 dark:text-yellow-300">1. Address Proof (any one)</span>
                    <p className="text-stone-600 dark:text-stone-300 text-xs">
                      Aadhaar, Rental Agreement / Ownership Document, Electricity / Water Bill or Brigade Allotment Letter.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl border bg-stone-50 dark:bg-stone-800/50 space-y-1">
                    <span className="font-bold block text-red-600 dark:text-yellow-300">2. Identity Proof (any one)</span>
                    <p className="text-stone-600 dark:text-stone-300 text-xs">
                      Aadhaar, Voter ID, Driving Licence, Passport or PAN Card.
                    </p>
                  </div>
                </div>
              </div>

              {/* Why Become a Member */}
              <div className="space-y-3 pt-2 border-t border-stone-100 dark:border-stone-800">
                <h4 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-600 fill-red-600" />
                  <span>❤️ Why Become a Member?</span>
                </h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-stone-700 dark:text-stone-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Celebrate Kannada festivals and cultural events together.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Encourage children's cultural and extracurricular activities.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Participate in sports and community initiatives.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Build stronger connections among Kannada families.</span>
                  </li>
                </ul>
              </div>

              {/* Closing Signoff */}
              <div className="pt-4 border-t border-stone-100 dark:border-stone-800 text-center space-y-2">
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300">
                  Your participation and support will help us build a vibrant and united Kannada community at Bridge El Dorado.
                </p>
                <p className="text-base sm:text-lg font-serif font-black text-red-600 dark:text-yellow-300">
                  Let's come together, celebrate our culture and strengthen our community! ❤️
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            PAGE 7: CONTACT US PAGE ('contact')
           ======================================================== */}
        {activeTab === 'contact' && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <div className="inline-flex items-center gap-2 bg-red-600 text-yellow-300 text-[11px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full border border-yellow-400">
                <Mail className="w-3.5 h-3.5" />
                <span>ಸಂಪರ್ಕಿಸಿ • Reach Us</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-serif font-black tracking-tight text-stone-900 dark:text-stone-100">
                Contact the Committee
              </h2>
              <p className={`text-base leading-relaxed font-medium ${isDark ? 'text-stone-200' : 'text-stone-700'}`}>
                Have questions about celebrations or volunteering? Get in touch!
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Contact Details Card */}
              <div
                className={`p-6 sm:p-8 rounded-3xl border-2 space-y-6 ${
                  isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                }`}
              >
                <div className="space-y-2">
                  <h3 className="text-2xl font-serif font-black text-red-700 dark:text-red-400">
                    Community Contact Directory
                  </h3>
                  <p className="text-xs text-stone-500">
                    Eldorado Kannadigara Balaga Working Group
                  </p>
                </div>

                <div className="space-y-4 text-xs sm:text-sm">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Venue &amp; Address</span>
                      <p className="text-stone-500">
                        Brigade El Dorado, Aerospace Park, Hunasamaranahalli, Bengaluru, Karnataka 562149
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Primary Email</span>
                      <p className="text-stone-500">desaisachin95@gmail.com</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reach Out Form */}
              <div
                className={`p-6 sm:p-8 rounded-3xl border-2 space-y-6 ${
                  isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                }`}
              >
                <div className="space-y-2">
                  <h3 className="text-2xl font-serif font-black text-stone-900 dark:text-stone-100">
                    Send Us a Message
                  </h3>
                  <p className="text-xs text-stone-500">
                    Fill out the form below and an executive committee member will reply shortly.
                  </p>
                </div>

                {contactSubmitted ? (
                  <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-center space-y-3 animate-in fade-in">
                    <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
                    <h4 className="text-lg font-bold text-emerald-900 dark:text-emerald-100">
                      Message Received!
                    </h4>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">
                      Thank you for contacting Kannadigara Balaga. We have received your query and will respond to {contactForm.email} shortly.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase mb-1 text-stone-700 dark:text-stone-300">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Anand Rao"
                        value={contactForm.fullName}
                        onChange={(e) => setContactForm({ ...contactForm, fullName: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs ${
                          isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-stone-50 border-stone-300 text-stone-900'
                        }`}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase mb-1 text-stone-700 dark:text-stone-300">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="anand@gmail.com"
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-xs ${
                            isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-stone-50 border-stone-300 text-stone-900'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase mb-1 text-stone-700 dark:text-stone-300">
                          Tower &amp; Flat
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Jasper-502"
                          value={contactForm.towerFlat}
                          onChange={(e) => setContactForm({ ...contactForm, towerFlat: e.target.value })}
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-xs ${
                            isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-stone-50 border-stone-300 text-stone-900'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase mb-1 text-stone-700 dark:text-stone-300">
                        Subject
                      </label>
                      <select
                        value={contactForm.subject}
                        onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs ${
                          isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-stone-50 border-stone-300 text-stone-900'
                        }`}
                      >
                        <option value="General enquiry">General enquiry</option>
                        <option value="Volunteering">Volunteering sign-up</option>
                        <option value="Cultural performance">Cultural performance nomination</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase mb-1 text-stone-700 dark:text-stone-300">
                        Message *
                      </label>
                      <textarea
                        required
                        rows={4}
                        placeholder="Write your message here..."
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs ${
                          isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-stone-50 border-stone-300 text-stone-900'
                        }`}
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-yellow-300 font-bold text-xs shadow-md transition-colors cursor-pointer border border-yellow-400 flex items-center justify-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Message</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            PAGE 8: COMMON UNIFIED EVENT DETAIL VIEW ('event-detail')
           ======================================================== */}
        {activeTab === 'event-detail' && (
          <BalagaEventDetailView
            event={selectedEvent}
            userRole={userRole}
            userProfile={userProfile}
            isAdmin={isAdmin}
            isMember={userRole === 'member' || userRole === 'admin' || userRole === 'read_only'}
            onBackToEvents={() => handleNavigateTab('past-events')}
            onOpenContribute={() => {}}
            onOpenVolunteer={() => window.open(formLinks.volunteerFormUrl, '_blank', 'noopener,noreferrer')}
            onOpenNominate={() => window.open(formLinks.nominationFormUrl, '_blank', 'noopener,noreferrer')}
            onNavigateToFinancialStatement={onNavigateToGaneshotsava}
            isDark={isDark}
          />
        )}
      </main>

      {/* 3. SHARED GLOBAL FOOTER NAVIGATION (Matching Sharavati reference footer layout) */}
      <footer
        className={`border-t-2 border-red-600 transition-colors ${
          isDark ? 'bg-stone-950 text-stone-300' : 'bg-stone-100 text-stone-700'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-600 p-0.5 border border-yellow-400 overflow-hidden">
                <img
                  src="/bhuvaneshwari_kannada_flag.jpg"
                  alt="Bhuvaneshwari Devi"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-serif font-black text-base text-red-600">ಕನ್ನಡಿಗರ ಬಳಗ</span>
            </div>
            <p className="text-xs text-stone-500 leading-relaxed">
              Eldorado Kannadigara Balaga is an independent resident community association in Brigade El Dorado celebrating Kannada culture and annual festivals.
            </p>
            <p className="text-xs font-serif font-bold text-amber-700 dark:text-yellow-400 italic">
              "ಸಿರಿಗನ್ನಡಂ ಗೆಲ್ಗೆ, ಸಿರಿಗನ್ನಡಂ ಬಾಳ್ಗೆ!"
            </p>
          </div>

          <div>
            <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 mb-3">
              Quick Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              {navLinks.map((link) => (
                <li key={link.id}>
                  <button
                    onClick={() => handleNavigateTab(link.id)}
                    className="hover:text-red-600 transition-colors cursor-pointer"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 mb-3">
              Major Celebrations
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => handleNavigateTab('upcoming-events')}
                  className="hover:text-red-600 transition-colors cursor-pointer"
                >
                  Karnataka Rajyotsava 2026
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigateTab('past-events')}
                  className="hover:text-red-600 transition-colors cursor-pointer"
                >
                  Sri Ganeshotsava 2026
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigateTab('admin')}
                  className="hover:text-red-600 font-bold transition-colors cursor-pointer inline-flex items-center gap-1 text-red-600 dark:text-yellow-400 mt-2"
                >
                  <Lock className="w-3 h-3" />
                  <span>Committee Admin Portal</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-stone-200 dark:border-stone-800 px-4 py-4 text-center text-xs text-stone-500">
          <p>© {new Date().getFullYear()} Eldorado Kannadigara Balaga. All rights reserved.</p>
        </div>
      </footer>

      {/* POPUP MODALS */}
      <BalagaAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        currentUser={currentUser}
        onUserChange={(user) => setCurrentUser(user)}
        allowedEmails={allowedEmails}
        onUpdateAllowedEmails={handleUpdateAllowedEmails}
        isAdmin={isCurrentAdmin}
      />

      <BalagaVolunteerModal
        isOpen={volunteerModalOpen}
        onClose={() => setVolunteerModalOpen(false)}
        currentUser={currentUser}
        onRequireLogin={() => {
          setVolunteerModalOpen(false);
          setAuthModalOpen(true);
        }}
      />

      <BalagaNominateModal
        isOpen={nominateModalOpen}
        onClose={() => setNominateModalOpen(false)}
      />

      <BalagaPolicyModals
        activeModal={policyModal}
        onClose={() => setPolicyModal(null)}
        isDark={isDark}
      />

      {/* MEMBERSHIP REGISTRATION MODAL */}
      {membershipModalOpen && (
        <div
          onClick={() => setMembershipModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative max-w-xl w-full p-6 sm:p-8 rounded-3xl border-2 border-red-600 shadow-2xl space-y-6 overflow-y-auto max-h-[90vh] ${
              isDark ? 'bg-stone-900 text-stone-100' : 'bg-white text-stone-900'
            }`}
          >
            <button
              onClick={() => setMembershipModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 bg-red-600 text-yellow-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-yellow-400">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Online Application Form</span>
              </div>
              <h3 className="text-2xl font-serif font-black text-red-700 dark:text-red-400">
                Membership Application Form
              </h3>
              <p className="text-xs text-stone-500">
                El Dorado Kannadigara Balaga Membership Registration
              </p>
            </div>

            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-stone-800 border-2 border-amber-300 dark:border-stone-700 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-yellow-300 text-xs sm:text-sm">
                  <BadgeIndianRupee className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Membership Fees &amp; Guidelines</span>
                </div>
                <ul className="text-xs space-y-1 text-stone-700 dark:text-stone-300 font-semibold pl-1">
                  <li>• Primary Member: <strong className="text-red-600 dark:text-yellow-300">₹999</strong></li>
                  <li>• Additional Family Member (&gt;18 yrs): <strong className="text-red-600 dark:text-yellow-300">₹749</strong> per member</li>
                  <li>• Required Documents: Address Proof (Aadhaar / Bill / Allotment) &amp; Identity Proof</li>
                </ul>
              </div>

              <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-950/40 border-2 border-red-600 text-center space-y-4">
                <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-200 font-medium leading-relaxed">
                  To complete your registration, click below to open the official Google Application Form:
                </p>

                <a
                  href={formLinks.membershipFormUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 rounded-2xl bg-red-600 hover:bg-red-700 text-yellow-300 font-black text-sm sm:text-base shadow-lg transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-2 border-2 border-yellow-400"
                >
                  <UserCheck className="w-5 h-5" />
                  <span>Open Official Google Form 📌</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setMembershipModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 font-bold text-xs text-stone-800 dark:text-stone-200 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX FOR VAIBHAVA GALLERY */}
      {lightboxPhoto && (
        <div
          onClick={() => setLightboxPhoto(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full space-y-3 cursor-default"
          >
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute -top-10 right-0 text-white hover:text-red-400 p-2 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <img
              src={lightboxPhoto.imageUrl}
              alt={lightboxPhoto.title}
              className="w-full max-h-[75vh] object-contain rounded-2xl border-2 border-stone-800"
            />

            <div className="text-white text-center space-y-1">
              <h4 className="font-serif font-bold text-lg">{lightboxPhoto.title}</h4>
              <span className="text-yellow-400 text-xs block">{lightboxPhoto.celebration}</span>
              {lightboxPhoto.caption && <p className="text-xs text-stone-300">{lightboxPhoto.caption}</p>}
            </div>
          </div>
        </div>
      )}

      {/* ANNOUNCEMENT DETAIL MODAL */}
      {selectedAnnouncement && (
        <div
          onClick={() => setSelectedAnnouncement(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative max-w-xl w-full p-6 sm:p-8 rounded-3xl border-2 border-red-600 shadow-2xl space-y-6 overflow-y-auto max-h-[85vh] ${
              isDark ? 'bg-stone-900 text-stone-100' : 'bg-white text-stone-900'
            }`}
          >
            <button
              onClick={() => setSelectedAnnouncement(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-900 dark:hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2 border-b border-stone-200 dark:border-stone-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-red-600 text-yellow-300 px-2.5 py-0.5 rounded">
                  {selectedAnnouncement.category}
                </span>
                {selectedAnnouncement.important && (
                  <span className="text-[10px] font-bold uppercase bg-amber-500/20 text-amber-700 dark:text-yellow-400 px-2.5 py-0.5 rounded inline-flex items-center gap-1">
                    <Bell className="w-3 h-3" />
                    <span>Important Notice</span>
                  </span>
                )}
              </div>

              <h3 className="text-2xl font-serif font-black text-red-700 dark:text-red-400">
                {selectedAnnouncement.title}
              </h3>
              {selectedAnnouncement.kannadaTitle && (
                <span className="text-sm font-serif font-bold text-amber-800 dark:text-yellow-400 block">
                  {selectedAnnouncement.kannadaTitle}
                </span>
              )}
              <span className="text-xs text-stone-400 block pt-1">
                Posted on {selectedAnnouncement.date}
              </span>
            </div>

            <div className="space-y-4 text-xs sm:text-sm leading-relaxed whitespace-pre-line text-stone-700 dark:text-stone-300">
              {selectedAnnouncement.content}
            </div>

            <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex justify-end">
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="px-6 py-2.5 rounded-xl bg-red-600 text-yellow-300 font-bold text-xs hover:bg-red-700 cursor-pointer border border-yellow-400"
              >
                Close Notice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
