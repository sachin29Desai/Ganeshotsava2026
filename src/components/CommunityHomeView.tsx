import React, { useState, useEffect } from 'react';
import {
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  ArrowRight,
  FileText,
  ShieldCheck,
  HeartHandshake,
  Sparkles,
  Lock,
  Flag,
  Flame,
  X,
  Send,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Share2,
  Copy,
  Mail,
  Clock,
  Play,
  Filter,
  Search,
  Check,
  PhoneCall,
  Menu,
  Info,
  HelpCircle,
  ExternalLink,
  Award,
  Video,
  Receipt,
  User as UserIcon,
  LogOut,
  Image as ImageIcon,
  Sun,
  Moon,
  Cookie,
  Layers,
  Compass
} from 'lucide-react';
import { AppSettings, Contribution, UserRole, UserProfile } from '../types';
import { fmt } from '../utils/helpers';
import {
  COMMUNITY_EVENTS,
  COMMITTEE_MEMBERS,
  ANNOUNCEMENTS,
  GALLERY_PHOTOS,
  ARCHIVE_RECORDS,
  GANESHA_FAQS,
  CommunityEvent,
  AnnouncementItem,
  GalleryPhoto
} from '../data/communityData';
import { getStoredEvents, classifyEvents } from '../utils/eventUtils';
import { BalagaAuthModal } from './balaga/BalagaAuthModal';
import { BalagaVolunteerModal } from './balaga/BalagaVolunteerModal';
import { BalagaNominateModal } from './balaga/BalagaNominateModal';
import { BalagaPolicyModals } from './balaga/BalagaPolicyModals';
import { BalagaLoginView } from './balaga/BalagaLoginView';
import { BalagaEventDetailView } from './balaga/BalagaEventDetailView';
import { AdminEventHighlightsManager } from './balaga/AdminEventHighlightsManager';
import { GaneshaFestivalVideoShowcase } from './GaneshaFestivalVideoShowcase';
import { auth, onAuthStateChanged, firebaseSignOut, type User } from '../lib/firebase';

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
  | 'events'
  | 'event-detail'
  | 'gallery'
  | 'announcements'
  | 'archive'
  | 'about'
  | 'contact'
  | 'login';

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

  const refreshEventData = () => {
    setAllEvents(getStoredEvents());
  };

  const { currentEvents, upcomingEvents, pastEvents } = classifyEvents(allEvents);

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

  // Route initial detection
  const getInitialTabFromLocation = (): { tab: CommunityPageTab; eventId?: string } => {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();

    if (path.includes('/login') || hash.includes('login')) {
      return { tab: 'login' };
    }
    if (path.includes('/events/') || hash.includes('/events/')) {
      const parts = path.split('/events/');
      const slug = parts[1] || 'rajyotsava-2026';
      return { tab: 'event-detail', eventId: slug.replace(/\/$/, '') };
    }
    if (path.includes('/events') || hash.includes('events')) {
      return { tab: 'events' };
    }
    if (path.includes('/gallery') || hash.includes('gallery')) {
      return { tab: 'gallery' };
    }
    if (path.includes('/announcements') || hash.includes('announcements')) {
      return { tab: 'announcements' };
    }
    if (path.includes('/archive') || hash.includes('archive')) {
      return { tab: 'archive' };
    }
    if (path.includes('/about') || hash.includes('about')) {
      return { tab: 'about' };
    }
    if (path.includes('/contact') || hash.includes('contact')) {
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

  // Filter states
  const [eventFilterStatus, setEventFilterStatus] = useState<string>('all');
  const [eventFilterFestival, setEventFilterFestival] = useState<string>('all');
  const [galleryYear, setGalleryYear] = useState<string>('all');
  const [galleryCelebration, setGalleryCelebration] = useState<string>('all');
  const [announcementCategory, setAnnouncementCategory] = useState<string>('all');
  const [announcementSearch, setAnnouncementSearch] = useState('');

  // Modals state
  const [volunteerModalOpen, setVolunteerModalOpen] = useState(false);
  const [nominateModalOpen, setNominateModalOpen] = useState(false);
  const [contributeModalOpen, setContributeModalOpen] = useState(false);
  const [highlightsManagerOpen, setHighlightsManagerOpen] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<GalleryPhoto | null>(null);
  const [policyModal, setPolicyModal] = useState<'privacy' | 'terms' | 'refund' | 'cookies' | null>(null);

  // Contact form state
  const [contactForm, setContactForm] = useState({
    fullName: '',
    email: '',
    towerFlat: '',
    subject: 'General enquiry',
    message: '',
    dpdpConsent: true
  });
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [dpdpNoticeDrawerOpen, setDpdpNoticeDrawerOpen] = useState(false);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Countdown state: Targeted at Karnataka Rajyotsava 2026 on Nov 21
  const [countdownTarget, setCountdownTarget] = useState<'rajyotsava' | 'ganesha'>('rajyotsava');
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const targetDateStr =
      countdownTarget === 'rajyotsava'
        ? '2026-11-21T08:30:00+05:30'
        : '2026-08-23T09:00:00+05:30';
    const target = new Date(targetDateStr).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = Math.max(0, target - now);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown({ days, hours, minutes, seconds });
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [countdownTarget]);

  // Tab navigation & URL syncing
  const handleNavigateTab = (tab: CommunityPageTab, eventId?: string) => {
    setActiveTab(tab);
    if (eventId) {
      setSelectedEventId(eventId);
    }
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    let newPath = '/homepageindevelop';
    if (tab === 'home') newPath = '/homepageindevelop';
    else if (tab === 'events') newPath = '/events';
    else if (tab === 'event-detail') newPath = `/events/${eventId || selectedEventId || 'rajyotsava-2026'}`;
    else if (tab === 'gallery') newPath = '/gallery';
    else if (tab === 'announcements') newPath = '/announcements';
    else if (tab === 'archive') newPath = '/archive';
    else if (tab === 'about') newPath = '/about';
    else if (tab === 'contact') newPath = '/contact';
    else if (tab === 'login') newPath = '/login';

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

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShareWhatsApp = (title: string, summary: string) => {
    const text = encodeURIComponent(
      `*${title}*\n${summary}\n\n🚩 ಸಿರಿಗನ್ನಡಂ ಗೆಲ್ಗೆ! ಸಿರಿಗನ್ನಡಂ ಬಾಳ್ಗೆ! 💛\nಎಲ್ ಡೊರಾಡೊ ಕನ್ನಡಿಗರ ಬಳಗ • Eldorado`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const selectedEvent =
    allEvents.find((e) => e.id === selectedEventId || e.slug === selectedEventId) ||
    allEvents[0];

  // Gallery filtered
  const filteredPhotos = GALLERY_PHOTOS.filter((p) => {
    if (galleryYear !== 'all' && p.year.toString() !== galleryYear) return false;
    if (galleryCelebration !== 'all' && p.celebration !== galleryCelebration && p.tag !== galleryCelebration)
      return false;
    return true;
  });

  // Announcements filtered
  const filteredAnnouncements = ANNOUNCEMENTS.filter((a) => {
    if (announcementCategory !== 'all' && a.category !== announcementCategory) return false;
    if (
      announcementSearch.trim() &&
      !a.title.toLowerCase().includes(announcementSearch.toLowerCase()) &&
      !a.content.toLowerCase().includes(announcementSearch.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  // Events filtered for /events hub tab
  const filteredEvents = allEvents.filter((e) => {
    if (eventFilterStatus !== 'all' && e.status !== eventFilterStatus) return false;
    if (eventFilterFestival !== 'all' && e.festival !== eventFilterFestival) return false;
    return true;
  });

  const isCurrentAdmin =
    isAdmin ||
    (!!currentUser?.email &&
      allowedEmails.map((e) => e.toLowerCase()).includes(currentUser.email.toLowerCase()));

  // If viewing standalone Authentication Route ('/login' or tab === 'login')
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
          handleNavigateTab('home');
        }}
        isDark={isDark}
      />
    );
  }

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

      {/* TOP STATUS BAR & ROUTE NOTIFICATION */}
      <aside
        aria-label="Development Route Notice"
        className={`px-4 py-1.5 text-xs font-semibold border-b no-print ${
          isDark ? 'bg-stone-900 text-stone-300 border-stone-800' : 'bg-stone-900 text-stone-200 border-stone-800'
        }`}
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-red-600 text-yellow-300 text-[10px] uppercase font-black px-2 py-0.5 rounded-sm tracking-wider">
              {activeTab === 'home' ? 'Kannadigara Balaga Portal' : `Route: /${activeTab}`}
            </span>
            <span className="text-yellow-400 font-bold hidden sm:inline">
              ಎಲ್ ಡೊರಾಡೊ ಕನ್ನಡಿಗರ ಬಳಗ • Eldorado Kannadigara Balaga
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isCurrentAdmin && (
              <button
                onClick={() => setHighlightsManagerOpen(true)}
                className="bg-red-700 hover:bg-red-800 text-yellow-300 text-xs font-bold px-2.5 py-1 rounded-md transition-colors inline-flex items-center gap-1 cursor-pointer border border-yellow-400"
                title="Manage Events & Photo Highlights"
              >
                <ImageIcon className="w-3.5 h-3.5 text-yellow-300" />
                <span>Manage Events &amp; Photos</span>
              </button>
            )}
            <button
              onClick={onNavigateToReceipts}
              className="text-stone-300 hover:text-white text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5 text-amber-400" />
              <span>Devotee Receipts</span>
            </button>
            <span className="text-stone-600">•</span>
            <button
              onClick={onNavigateToGaneshotsava}
              className="bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold px-3 py-1 rounded-md transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Ganeshotsava Ledger</span>
            </button>
          </div>
        </div>
      </aside>

      {/* 1. TOP KANNADIGARA BALAGA NAVIGATION HEADER */}
      <header
        className={`sticky top-0 z-40 border-b-2 border-red-600 shadow-xs backdrop-blur-md transition-colors ${
          isDark ? 'bg-stone-900/95 text-stone-100' : 'bg-white/95 text-stone-900'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Brand Logo & Name */}
          <div
            onClick={() => handleNavigateTab('home')}
            className="flex items-center gap-3 cursor-pointer group select-none"
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
                <span className="text-xs text-stone-400">|</span>
                <span className="text-xs font-bold text-amber-600 dark:text-yellow-400 uppercase tracking-wider hidden sm:inline">
                  Kannadigara Balaga
                </span>
              </div>
              <p className={`text-[11px] font-medium ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                Eldorado • ಸಿರಿಗನ್ನಡಂ ಗೆಲ್ಗೆ, ಸಿರಿಗನ್ನಡಂ ಬಾಳ್ಗೆ!
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-semibold">
            {[
              { id: 'home', label: 'Home' },
              { id: 'events', label: 'Events Hub' },
              { id: 'gallery', label: 'Gallery' },
              { id: 'announcements', label: 'Announcements' },
              { id: 'archive', label: 'Archive' },
              { id: 'about', label: 'About' },
              { id: 'contact', label: 'Contact' }
            ].map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavigateTab(link.id as CommunityPageTab)}
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
          <div className="flex items-center gap-2.5">
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

            {currentUser ? (
              <div className="relative group">
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                    isDark
                      ? 'bg-stone-800 border-stone-700 text-stone-200 hover:bg-stone-700'
                      : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <UserIcon className="w-3.5 h-3.5 text-red-600" />
                  <span className="max-w-[100px] truncate">{currentUser.email?.split('@')[0]}</span>
                  {isCurrentAdmin && (
                    <span className="text-[9px] bg-red-600 text-yellow-300 px-1.5 py-0.2 rounded font-black uppercase">
                      Admin
                    </span>
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleNavigateTab('login')}
                className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-stone-800 border-stone-700 text-stone-200 hover:bg-stone-700'
                    : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <Mail className="w-3.5 h-3.5 text-red-600" />
                <span>Sign in</span>
              </button>
            )}

            <button
              onClick={() => {
                if (!currentUser) setAuthModalOpen(true);
                else setVolunteerModalOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-yellow-300 font-bold text-xs shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 border border-yellow-400"
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Volunteer</span>
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
            {[
              { id: 'home', label: 'Home' },
              { id: 'events', label: 'Celebrations & Events' },
              { id: 'gallery', label: 'Vaibhava Gallery' },
              { id: 'announcements', label: 'Announcements & Notices' },
              { id: 'archive', label: 'Past 2-Year Archive' },
              { id: 'about', label: 'About Balaga' },
              { id: 'contact', label: 'Contact Committee' },
              { id: 'login', label: 'Sign in / Account' }
            ].map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavigateTab(link.id as CommunityPageTab)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer flex items-center justify-between ${
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
          </div>
        )}
      </header>

      {/* 2. MAIN BODY CONTENT */}
      <main className="flex-1">
        {/* ========================================================
            PAGE 1: HOME VIEW
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
                  <img src="/bhuvaneshwari_kannada_flag.jpg" alt="Goddess Bhuvaneshwari Devi & Kannada Flag" className="h-96 w-auto object-contain rounded-2xl opacity-25" />
                </div>

                <div className="relative z-10 max-w-3xl space-y-5">
                  <div className="inline-flex items-center gap-2 bg-red-600 text-yellow-300 text-[11px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-xs border border-yellow-400">
                    <Flag className="w-3.5 h-3.5" />
                    <span>ಸಿರಿಗನ್ನಡಂ ಗೆಲ್ಗೆ! ಸಿರಿಗನ್ನಡಂ ಬಾಳ್ಗೆ!</span>
                  </div>

                  <div>
                    <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-black tracking-tight text-stone-900 dark:text-stone-100 leading-tight">
                      Kannadigara Balaga: Celebrating Our Heritage.
                    </h1>
                    <span className="text-base sm:text-xl font-serif font-bold text-red-600 dark:text-red-400 block mt-2">
                      ಎಲ್ ಡೊರಾಡೊ ಕನ್ನಡಿಗರ ಬಳಗ: ನಮ್ಮ ಸಂಸ್ಕೃತಿ, ನಮ್ಮ ಹೆಮ್ಮೆ
                    </span>
                  </div>

                  <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                    A volunteer-driven community forum of Eldorado residents dedicated to
                    preserving and celebrating Kannada language, folk traditions, Vedic poojas, and grand
                    annual festivals in our neighborhood.
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-3 justify-center sm:justify-start">
                    <button
                      onClick={() => setContributeModalOpen(true)}
                      className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-yellow-300 font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer inline-flex items-center gap-2 border border-yellow-400 active:scale-95"
                    >
                      <HeartHandshake className="w-4 h-4" />
                      <span>Contribute</span>
                    </button>

                    <button
                      onClick={() => handleNavigateTab('events')}
                      className={`px-5 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer inline-flex items-center gap-2 border ${
                        isDark
                          ? 'bg-stone-800 hover:bg-stone-700 border-stone-700 text-white'
                          : 'bg-white hover:bg-stone-50 border-stone-300 text-stone-800'
                      }`}
                    >
                      <Compass className="w-4 h-4 text-red-600" />
                      <span>Explore Events Hub</span>
                    </button>

                    <button
                      onClick={() => {
                        if (!currentUser) setAuthModalOpen(true);
                        else setVolunteerModalOpen(true);
                      }}
                      className="px-5 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-stone-950 font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer inline-flex items-center gap-2"
                    >
                      <Users className="w-4 h-4" />
                      <span>Volunteer</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* WIDGET 1: CURRENT / ONGOING EVENT BANNER (If active) */}
            {currentEvents.length > 0 && (
              <section className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="rounded-3xl border-2 border-red-600 bg-gradient-to-r from-red-600 via-red-700 to-amber-600 text-white p-6 sm:p-8 shadow-lg space-y-4 animate-pulse">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 bg-yellow-400 text-stone-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Ongoing Celebration</span>
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-serif font-black text-yellow-300">
                        {currentEvents[0].title}
                      </h3>
                      <p className="text-xs sm:text-sm text-yellow-100">
                        {currentEvents[0].dateDisplay} • {currentEvents[0].venue}
                      </p>
                    </div>

                    <button
                      onClick={() => handleNavigateTab('event-detail', currentEvents[0].id)}
                      className="px-6 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-stone-950 font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer inline-flex items-center gap-2 shrink-0"
                    >
                      <span>Join Live Event</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* WIDGET 2: UPCOMING EVENT WIDGET (Next upcoming celebration, e.g. Rajyotsava 2026) */}
            {upcomingEvents.length > 0 && (
              <section className="max-w-6xl mx-auto px-4 sm:px-6">
                <div
                  className={`rounded-3xl border-2 p-6 sm:p-8 shadow-sm transition-all ${
                    isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                  }`}
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-3 max-w-2xl">
                      <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold uppercase px-3 py-1 rounded-full border border-emerald-500/40">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Next Upcoming Event</span>
                      </div>

                      <div>
                        <h3 className="text-2xl sm:text-3xl font-serif font-black text-red-700 dark:text-red-400">
                          {upcomingEvents[0].title}
                        </h3>
                        <span className="text-sm font-serif font-bold text-amber-800 dark:text-yellow-400 block mt-0.5">
                          {upcomingEvents[0].kannadaTitle}
                        </span>
                      </div>

                      <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                        {upcomingEvents[0].description}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 pt-1">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-red-600 shrink-0" />
                          <span>{upcomingEvents[0].dateDisplay}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
                          <span>{upcomingEvents[0].venue}</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 space-y-3 text-center md:text-right">
                      {/* Countdown Display */}
                      <div className="p-3 rounded-2xl bg-amber-50 dark:bg-stone-800 border border-amber-200 dark:border-stone-700">
                        <span className="text-[10px] font-bold text-amber-800 dark:text-yellow-300 uppercase block mb-1">
                          Countdown to Event
                        </span>
                        <div className="flex items-center gap-2 text-red-600 font-serif font-black text-xl justify-center">
                          <span>{countdown.days}d</span>
                          <span>:</span>
                          <span>{countdown.hours}h</span>
                          <span>:</span>
                          <span>{countdown.minutes}m</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleNavigateTab('event-detail', upcomingEvents[0].id)}
                        className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-yellow-300 font-bold text-xs shadow-xs transition-colors cursor-pointer inline-flex items-center gap-2 w-full justify-center"
                      >
                        <span>View Upcoming Details</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* WIDGET 3: PAST EVENTS CAROUSEL / GRID (With Zero Duplication) */}
            <section className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
                    Concluded Past Celebrations
                  </span>
                  <h3 className="text-2xl font-serif font-black">Event Highlights</h3>
                </div>
                <button
                  onClick={() => handleNavigateTab('archive')}
                  className="text-xs font-bold text-red-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>View Full Archive</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastEvents.slice(0, 2).map((evt) => (
                  <div
                    key={evt.id}
                    onClick={() => handleNavigateTab('event-detail', evt.id)}
                    className={`rounded-3xl border-2 hover:border-red-600 overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between ${
                      isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                    }`}
                  >
                    <div className="p-6 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 px-2.5 py-0.5 rounded">
                          {evt.festival}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Concluded</span>
                        </span>
                      </div>

                      <div>
                        <h4 className="text-xl font-serif font-black text-stone-900 dark:text-stone-100">
                          {evt.title}
                        </h4>
                        <span className="text-xs font-serif font-bold text-amber-800 dark:text-yellow-400 block mt-0.5">
                          {evt.kannadaTitle}
                        </span>
                      </div>

                      <p className={`text-xs line-clamp-2 leading-relaxed ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                        {evt.description}
                      </p>

                      <div className="pt-2 space-y-1.5 text-xs text-stone-500 border-t border-stone-100 dark:border-stone-800">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-red-600 shrink-0" />
                          <span>{evt.dateDisplay}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
                          <span className="truncate">{evt.venue}</span>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`px-6 py-3.5 border-t flex items-center justify-between gap-2 ${
                        isDark ? 'bg-stone-950 border-stone-800' : 'bg-amber-50/50 border-stone-100'
                      }`}
                    >
                      <span className="text-xs font-bold text-red-600 dark:text-yellow-400 inline-flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Highlights &amp; Recap</span>
                      </span>
                      <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-red-600" />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* SRI GANESHOTSAVA FESTIVAL DARSHAN VIDEO */}
            <section className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="inline-flex items-center gap-1.5 bg-red-600 text-yellow-300 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-yellow-400">
                      <Sparkles className="w-3 h-3" />
                      <span>ಶ್ರೀ ಗಣೇಶ ಮಹಾದರ್ಶನ • Festival Video Showcase</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-serif font-black tracking-tight text-stone-900 dark:text-stone-100 mt-1">
                      Sri Ganesha Festival Darshan &amp; Alankara
                    </h2>
                  </div>
                </div>
                <GaneshaFestivalVideoShowcase
                  settings={settings}
                  isAdmin={isAdmin}
                  onUpdateSettings={onUpdateSettings}
                />
              </div>
            </section>

            {/* STATISTICS COUNTER GRID */}
            <section className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
                <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
                  3 Years of Community Momentum
                </span>
                <h3 className="text-2xl sm:text-3xl font-serif font-black">
                  Built on Devotion, Culture &amp; Resident Unity
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div
                  className={`p-5 rounded-2xl border-2 text-center shadow-xs ${
                    isDark ? 'bg-stone-900 border-red-600' : 'bg-white border-red-600'
                  }`}
                >
                  <span className="text-3xl sm:text-4xl font-black font-serif text-red-600 block mb-1">
                    3
                  </span>
                  <span className="text-xs font-semibold block">Years of Togetherness</span>
                  <span className="text-[11px] text-stone-500">Celebrating since 2024</span>
                </div>

                <div
                  className={`p-5 rounded-2xl border-2 text-center shadow-xs ${
                    isDark ? 'bg-stone-900 border-yellow-400' : 'bg-white border-yellow-400'
                  }`}
                >
                  <span className="text-3xl sm:text-4xl font-black font-serif text-amber-500 block mb-1">
                    1
                  </span>
                  <span className="text-xs font-semibold block">Upcoming Mega Event</span>
                  <span className="text-[11px] text-stone-500">Rajyotsava 2026</span>
                </div>

                <div
                  className={`p-5 rounded-2xl border-2 text-center shadow-xs ${
                    isDark ? 'bg-stone-900 border-red-600' : 'bg-white border-red-600'
                  }`}
                >
                  <span className="text-3xl sm:text-4xl font-black font-serif text-red-600 block mb-1">
                    50+
                  </span>
                  <span className="text-xs font-semibold block">Active Volunteers</span>
                  <span className="text-[11px] text-stone-500">Residents giving seva</span>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ========================================================
            PAGE 2: EVENTS HUB VIEW ('/events')
           ======================================================== */}
        {activeTab === 'events' && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
            <div className="space-y-2">
              <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
                ಕನ್ನಡಿಗರ ಬಳಗ ಉತ್ಸವಗಳು
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif font-black">
                Our Celebrations
              </h2>
              <p className={`text-sm max-w-2xl ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                Our annual celebrations of Sri Ganesha Chaturthi and Karnataka Rajyotsava, along with our
                2-year past celebrations archive.
              </p>
            </div>

            {/* Status Counter Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b pb-4 border-stone-200 dark:border-stone-800 text-xs font-bold">
              {[
                { id: 'all', label: 'All Events', count: allEvents.length },
                {
                  id: 'ongoing',
                  label: `Ongoing: ${currentEvents.length}`,
                  count: currentEvents.length
                },
                {
                  id: 'upcoming',
                  label: `Upcoming: ${upcomingEvents.length}`,
                  count: upcomingEvents.length
                },
                {
                  id: 'archived',
                  label: `Archived: ${pastEvents.length}`,
                  count: pastEvents.length
                }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setEventFilterStatus(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer inline-flex items-center gap-2 ${
                    eventFilterStatus === tab.id
                      ? 'bg-red-600 text-yellow-300 shadow-xs'
                      : isDark
                      ? 'bg-stone-900 text-stone-300 border border-stone-800 hover:bg-stone-800'
                      : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((evt) => (
                <div
                  key={evt.id}
                  className={`rounded-3xl border-2 hover:border-red-600 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                    isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                  }`}
                >
                  <div className="p-6 space-y-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-red-600 text-yellow-300 px-2.5 py-0.5 rounded">
                        {evt.festival}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          evt.status === 'ongoing'
                            ? 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/40 animate-pulse'
                            : evt.status === 'upcoming'
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            : 'bg-stone-500/20 text-stone-500'
                        }`}
                      >
                        {evt.status === 'ongoing'
                          ? 'Live / Ongoing'
                          : evt.status === 'upcoming'
                          ? 'Upcoming'
                          : 'Archived'}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-serif font-black text-stone-900 dark:text-stone-100">
                        {evt.title}
                      </h3>
                      <span className="text-xs font-serif font-bold text-amber-800 dark:text-yellow-400 block mt-0.5">
                        {evt.kannadaTitle}
                      </span>
                    </div>

                    <p className={`text-xs leading-relaxed ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                      {evt.description}
                    </p>

                    <div
                      className={`pt-2 space-y-2 text-xs border-t ${
                        isDark ? 'border-stone-800 text-stone-400' : 'border-stone-100 text-stone-500'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-red-600 shrink-0" />
                        <span>{evt.dateDisplay}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
                        <span>{evt.venue}</span>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`px-6 py-4 border-t flex items-center justify-between gap-2 ${
                      isDark ? 'bg-stone-950 border-stone-800' : 'bg-stone-50 border-stone-100'
                    }`}
                  >
                    <button
                      onClick={() => handleNavigateTab('event-detail', evt.slug || evt.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-yellow-300 font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1 shadow-xs ml-auto"
                    >
                      <span>View Event Details</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================
            PAGE 3: GALLERY GRID VIEW ('/gallery')
           ======================================================== */}
        {activeTab === 'gallery' && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
            <div className="space-y-2">
              <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
                ನೆನಪುಗಳು • Memories
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif font-black">
                Vaibhava Gallery
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {filteredPhotos.map((photo) => (
                <div
                  key={photo.id}
                  onClick={() => setLightboxPhoto(photo)}
                  className={`group rounded-3xl border-2 hover:border-red-600 overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col ${
                    isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                  }`}
                >
                  <div className="relative aspect-[4/3] bg-stone-950 overflow-hidden">
                    <img
                      src={photo.imageUrl}
                      alt={photo.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>

                  <div className="p-4 space-y-1">
                    <span className="font-bold text-xs block text-stone-900 dark:text-stone-100 truncate">
                      {photo.title}
                    </span>
                    {photo.caption && (
                      <p className="text-[11px] text-stone-500 line-clamp-2">{photo.caption}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================
            PAGE 4: ANNOUNCEMENTS FEED VIEW ('/announcements')
           ======================================================== */}
        {activeTab === 'announcements' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
            <div className="space-y-2">
              <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
                ಸುದ್ದಿ ಮತ್ತು ಪ್ರಕಟಣೆಗಳು
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif font-black">
                Balaga Updates
              </h2>
            </div>

            <div className="space-y-6">
              {filteredAnnouncements.map((ann) => (
                <article
                  key={ann.id}
                  className={`rounded-3xl border-2 hover:border-red-600 p-6 sm:p-8 shadow-xs space-y-4 ${
                    isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                  }`}
                >
                  <div>
                    <h3 className="text-xl sm:text-2xl font-serif font-black text-red-700 dark:text-red-400">
                      {ann.title}
                    </h3>
                  </div>

                  <div
                    className={`text-xs sm:text-sm leading-relaxed whitespace-pre-line p-4 rounded-2xl border font-sans ${
                      isDark
                        ? 'bg-stone-800/60 border-stone-700 text-stone-200'
                        : 'bg-amber-50/60 border-amber-200 text-stone-800'
                    }`}
                  >
                    {ann.content}
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================
            PAGE 5: CELEBRATION ARCHIVE VIEW ('/archive')
           ======================================================== */}
        {activeTab === 'archive' && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-10">
            <div className="space-y-2">
              <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
                ಕಳೆದ ೨ ವರ್ಷಗಳ ಇತಿಹಾಸ
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif font-black">
                Our Journey &amp; Transparency Ledger
              </h2>
            </div>

            <div className="space-y-10">
              {ARCHIVE_RECORDS.map((yrRecord) => (
                <div key={yrRecord.year} className="space-y-4">
                  <div className="flex items-center justify-between border-b-2 border-red-600 pb-2">
                    <h3 className="text-2xl font-serif font-black">{yrRecord.year}</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {yrRecord.celebrations.map((cel, idx) => (
                      <div
                        key={idx}
                        className={`rounded-3xl border-2 p-6 shadow-xs space-y-3 ${
                          isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                        }`}
                      >
                        <h4 className="text-lg font-serif font-black text-stone-900 dark:text-stone-100">
                          {cel.name}
                        </h4>
                        <p className={`text-xs leading-relaxed ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                          {cel.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================
            PAGE 6: ABOUT STRUCTURE VIEW ('/about')
           ======================================================== */}
        {activeTab === 'about' && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-12">
            <div className="space-y-2">
              <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
                ನಮ್ಮ ಬಳಗದ ಪರಿಚಯ
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif font-black">
                Kannadigara Balaga: Of the Residents, By the Residents
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {COMMITTEE_MEMBERS.map((member, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border text-center space-y-2 ${
                    isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                  }`}
                >
                  <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-red-600 to-amber-500 text-yellow-300 font-serif font-bold flex items-center justify-center shadow-xs border-2 border-yellow-400">
                    {member.initials}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm">{member.name}</h4>
                    <span className="text-[11px] text-red-600 dark:text-yellow-400 font-semibold block">
                      {member.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================
            PAGE 7: INTERACTIVE CONTACT VIEW ('/contact')
           ======================================================== */}
        {activeTab === 'contact' && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
            <div className="space-y-2">
              <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
                ಸಂಪರ್ಕಿಸಿ • Reach Us
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif font-black">
                Get in Touch with the Balaga
              </h2>
            </div>
          </div>
        )}

        {/* ========================================================
            PAGE 8: COMMON UNIFIED EVENT DETAIL VIEW ('/events/:slug')
           ======================================================== */}
        {activeTab === 'event-detail' && (
          <BalagaEventDetailView
            event={selectedEvent}
            userRole={userRole}
            userProfile={userProfile}
            isAdmin={isAdmin}
            isMember={userRole === 'member' || userRole === 'admin' || userRole === 'read_only'}
            onBackToEvents={() => handleNavigateTab('events')}
            onOpenContribute={() => setContributeModalOpen(true)}
            onOpenVolunteer={() => {
              if (!currentUser) setAuthModalOpen(true);
              else setVolunteerModalOpen(true);
            }}
            onOpenNominate={() => setNominateModalOpen(true)}
            onNavigateToFinancialStatement={onNavigateToGaneshotsava}
            isDark={isDark}
          />
        )}
      </main>

      {/* 3. SHARED GLOBAL FOOTER NAVIGATION */}
      <footer
        className={`border-t-2 border-red-600 transition-colors ${
          isDark ? 'bg-stone-950 text-stone-300' : 'bg-stone-100 text-stone-700'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="font-serif font-black text-base text-red-600">ಕನ್ನಡಿಗರ ಬಳಗ</span>
            </div>
            <p className="text-xs font-serif font-bold text-amber-700 dark:text-yellow-400 italic">
              "Bringing the Spirit of Karnataka to Our Community."
            </p>
          </div>
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

      {contributeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div
            className={`rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border-2 border-red-600 relative animate-in fade-in ${
              isDark ? 'bg-stone-900 text-stone-100' : 'bg-white text-stone-900'
            }`}
          >
            <button
              onClick={() => setContributeModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-900 dark:hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-red-600 text-yellow-300 flex items-center justify-center mx-auto shadow-md border-2 border-yellow-400">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-serif font-black text-red-600">
                Voluntary Devotee Contribution
              </h3>
              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => {
                    setContributeModalOpen(false);
                    onNavigateToReceipts();
                  }}
                  className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-yellow-300 font-bold text-xs transition-colors cursor-pointer shadow-xs inline-flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Open Devotee Receipts Portal</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN EVENT HIGHLIGHTS & PHOTO MANAGER MODAL */}
      <AdminEventHighlightsManager
        isOpen={highlightsManagerOpen}
        onClose={() => setHighlightsManagerOpen(false)}
        isDark={isDark}
        onRefreshEvents={refreshEventData}
      />
    </div>
  );
};
