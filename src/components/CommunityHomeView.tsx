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
import { AppSettings, Contribution } from '../types';
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
import { BalagaAuthModal } from './balaga/BalagaAuthModal';
import { BalagaVolunteerModal } from './balaga/BalagaVolunteerModal';
import { BalagaNominateModal } from './balaga/BalagaNominateModal';
import { BalagaPolicyModals } from './balaga/BalagaPolicyModals';
import { BalagaLoginView } from './balaga/BalagaLoginView';
import { BalagaEventDetailView } from './balaga/BalagaEventDetailView';
import { auth, onAuthStateChanged, firebaseSignOut, type User } from '../lib/firebase';

interface CommunityHomeViewProps {
  settings: AppSettings;
  contributions: Contribution[];
  onNavigateToGaneshotsava: () => void;
  onNavigateToReceipts: () => void;
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
  onNavigateToReceipts
}) => {
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
      const slug = parts[1] || 'ganesh-chaturthi-2026';
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
    initialRouteInfo.eventId || 'ganesh-chaturthi-2026'
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
    return ['desaisachin95@gmail.com', 'kannadigara.balaga.eldorado@gmail.com'];
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

  // Countdown state: Targeted at Karnataka Rajyotsava 2026 on Nov 1, with toggle for Ganesha Chaturthi
  const [countdownTarget, setCountdownTarget] = useState<'rajyotsava' | 'ganesha'>('rajyotsava');
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const targetDateStr =
      countdownTarget === 'rajyotsava'
        ? '2026-11-01T08:30:00+05:30'
        : '2026-09-13T09:00:00+05:30';
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
    else if (tab === 'event-detail') newPath = `/events/${eventId || selectedEventId || 'ganesh-chaturthi-2026'}`;
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
    COMMUNITY_EVENTS.find((e) => e.id === selectedEventId || e.slug === selectedEventId) ||
    COMMUNITY_EVENTS[0];

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

  // Events filtered
  const filteredEvents = COMMUNITY_EVENTS.filter((e) => {
    if (eventFilterStatus !== 'all' && e.status !== eventFilterStatus) return false;
    if (eventFilterFestival !== 'all' && e.festival !== eventFilterFestival) return false;
    return true;
  });

  const isCurrentAdmin =
    !!currentUser?.email &&
    allowedEmails.map((e) => e.toLowerCase()).includes(currentUser.email.toLowerCase());

  // If viewing standalone Authentication Route ('/login' or tab === 'login')
  // Bypasses global header/footer wrappers as required!
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
              <span>← Back to Ganeshotsava 2026</span>
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
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-600 via-red-600 to-amber-500 p-1.5 flex items-center justify-center shadow-xs border-2 border-yellow-400 group-hover:scale-105 transition-transform">
              <img
                src="/lord_ganesha.svg"
                alt="Lord Sri Ganesha"
                className="w-full h-full object-contain filter drop-shadow-sm invert"
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
              { id: 'events', label: 'Events', badge: 'Live' },
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
                {link.badge && (
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-ping inline-block" />
                )}
              </button>
            ))}
          </nav>

          {/* Header Controls: Theme Switcher, Account, Volunteer Button, Mobile Hamburger */}
          <div className="flex items-center gap-2.5">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isDark
                  ? 'bg-stone-800 border-stone-700 text-yellow-400 hover:bg-stone-700'
                  : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100 hover:text-red-700'
              }`}
              title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Authentication Button / User profile */}
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

            {/* Primary Action Button: Volunteer */}
            <button
              onClick={() => {
                if (!currentUser) {
                  setAuthModalOpen(true);
                } else {
                  setVolunteerModalOpen(true);
                }
              }}
              className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-yellow-300 font-bold text-xs shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 border border-yellow-400"
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Volunteer</span>
              <span className="sm:hidden">Join</span>
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`lg:hidden p-2 rounded-xl border transition-colors cursor-pointer ${
                isDark
                  ? 'bg-stone-800 border-stone-700 text-white'
                  : 'bg-stone-50 border-stone-200 text-stone-700'
              }`}
              aria-label="Toggle navigation menu"
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

            <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <span className="text-xs font-medium text-stone-400">Appearance Theme</span>
              <button
                onClick={toggleTheme}
                className="text-xs font-bold px-3 py-1 rounded-lg border flex items-center gap-1.5 cursor-pointer"
              >
                {isDark ? <Sun className="w-3.5 h-3.5 text-yellow-400" /> : <Moon className="w-3.5 h-3.5 text-stone-700" />}
                <span>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
              </button>
            </div>
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
                {/* Background decorative watermark */}
                <div className="absolute right-0 top-0 bottom-0 opacity-5 pointer-events-none select-none flex items-center justify-end pr-6">
                  <img src="/lord_ganesha.svg" alt="" className="h-96 w-auto object-contain filter invert" />
                </div>

                <div className="relative z-10 max-w-3xl space-y-5">
                  {/* Badge */}
                  <div className="inline-flex items-center gap-2 bg-red-600 text-yellow-300 text-[11px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-xs border border-yellow-400">
                    <Flag className="w-3.5 h-3.5" />
                    <span>ಸಿರಿಗನ್ನಡಂ ಗೆಲ್ಗೆ! ಸಿರಿಗನ್ನಡಂ ಬಾಳ್ಗೆ!</span>
                  </div>

                  {/* Main Large H1 */}
                  <div>
                    <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-black tracking-tight text-stone-900 dark:text-stone-100 leading-tight">
                      Kannadigara Balaga: Celebrating Our Heritage.
                    </h1>
                    <span className="text-base sm:text-xl font-serif font-bold text-red-600 dark:text-red-400 block mt-2">
                      ಎಲ್ ಡೊರಾಡೊ ಕನ್ನಡಿಗರ ಬಳಗ: ನಮ್ಮ ಸಂಸ್ಕೃತಿ, ನಮ್ಮ ಹೆಮ್ಮೆ
                    </span>
                  </div>

                  {/* Sub-headline */}
                  <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                    A volunteer-driven community forum of Eldorado residents dedicated to
                    preserving and celebrating Kannada language, folk traditions, Vedic poojas, and grand
                    annual festivals in our neighborhood.
                  </p>

                  {/* Primary CTAs */}
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
                      <span>Explore Events</span>
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

            {/* LIVE INTERACTIVE COUNTDOWN COMPONENT (Targeting Karnataka Rajyotsava Nov 1st) */}
            <section className="max-w-6xl mx-auto px-4 sm:px-6">
              <div
                className={`p-6 sm:p-8 rounded-3xl border-2 shadow-xs transition-all ${
                  isDark ? 'bg-stone-900 border-stone-800 text-stone-100' : 'bg-white border-stone-200 text-stone-900'
                }`}
              >
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  {/* Countdown Header */}
                  <div className="space-y-1.5 text-center md:text-left">
                    <div className="inline-flex items-center gap-1.5 bg-yellow-400/20 text-red-600 dark:text-yellow-400 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {countdownTarget === 'rajyotsava'
                          ? 'Upcoming Festival Countdown'
                          : 'Live Festival Countdown'}
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-serif font-black">
                      {countdownTarget === 'rajyotsava'
                        ? 'Karnataka Rajyotsava 2026'
                        : 'Sri Ganesha Chaturthi 2026'}
                    </h3>
                    <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                      {countdownTarget === 'rajyotsava'
                        ? 'November 1, 2026 • Grand Flag Hoisting & Kannada Cultural Acts'
                        : '13th to 18th of this month • 5-Day Vedic Mahotsava at Clubhouse Grand Arena'}
                    </p>

                    {/* Switch target toggle */}
                    <div className="pt-2 flex items-center gap-2 justify-center md:justify-start">
                      <span className="text-[11px] text-stone-400">Switch target:</span>
                      <button
                        onClick={() => setCountdownTarget('rajyotsava')}
                        className={`text-[11px] px-2.5 py-0.5 rounded-md font-bold transition-colors cursor-pointer ${
                          countdownTarget === 'rajyotsava'
                            ? 'bg-red-600 text-yellow-300'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                        }`}
                      >
                        Rajyotsava (Nov 1)
                      </button>
                      <button
                        onClick={() => setCountdownTarget('ganesha')}
                        className={`text-[11px] px-2.5 py-0.5 rounded-md font-bold transition-colors cursor-pointer ${
                          countdownTarget === 'ganesha'
                            ? 'bg-red-600 text-yellow-300'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                        }`}
                      >
                        Ganesha Chaturthi
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Metric Tickers */}
                  <div className="grid grid-cols-4 gap-3 text-center shrink-0">
                    {[
                      { label: 'Days', val: countdown.days },
                      { label: 'Hours', val: countdown.hours },
                      { label: 'Minutes', val: countdown.minutes },
                      { label: 'Seconds', val: countdown.seconds }
                    ].map((item, i) => (
                      <div
                        key={i}
                        className={`p-3 sm:p-4 rounded-2xl border min-w-[64px] sm:min-w-[80px] shadow-xs ${
                          isDark ? 'bg-stone-800/80 border-stone-700' : 'bg-stone-50 border-stone-200'
                        }`}
                      >
                        <span className="text-2xl sm:text-3xl font-serif font-black text-red-600 block leading-none mb-1">
                          {String(item.val).padStart(2, '0')}
                        </span>
                        <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-stone-500">
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* BANNER SECTION: "Ganesha Chaturthi 2026 is Here!" */}
            <section className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="relative rounded-3xl p-6 sm:p-8 border-2 border-red-600 bg-gradient-to-r from-red-600 via-red-600 to-amber-600 text-white shadow-lg overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 max-w-xl text-center md:text-left">
                  <div className="inline-flex items-center gap-1.5 bg-yellow-400 text-stone-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider shadow-xs">
                    <Flame className="w-3.5 h-3.5 text-red-700 fill-red-700" />
                    <span>Ongoing Celebration</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-serif font-black text-yellow-300">
                    Ganesha Chaturthi 2026 is Here!
                  </h3>
                  <p className="text-xs sm:text-sm text-yellow-100 leading-relaxed">
                    Our festive lineup is running from the 13th to the 18th of this month at the Clubhouse
                    Grand Arena! Join daily poojas, Anna Santharpane, and evening cultural programs.
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  <button
                    onClick={() => handleNavigateTab('event-detail', 'ganesh-chaturthi-2026')}
                    className="px-6 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-stone-950 font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer inline-flex items-center gap-2 active:scale-95"
                  >
                    <span>Join the Festivities</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </section>

            {/* STATISTICS COUNTER GRID (3-Year Momentum Track Record) */}
            <section className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
                <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
                  3 Years of Community Momentum
                </span>
                <h3 className="text-2xl sm:text-3xl font-serif font-black">
                  Built on Devotion, Culture &amp; Resident Unity
                </h3>
                <p className={`text-xs sm:text-sm ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                  Celebrating together since our inaugural year 2024 with 100% voluntary participation and
                  transparent accounting.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  <span className="text-[11px] text-stone-500">Rajyotsava 2026 (Nov 1)</span>
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

                <div
                  className={`p-5 rounded-2xl border-2 text-center shadow-xs ${
                    isDark ? 'bg-stone-900 border-yellow-400' : 'bg-white border-yellow-400'
                  }`}
                >
                  <span className="text-3xl sm:text-4xl font-black font-serif text-emerald-600 block mb-1">
                    100%
                  </span>
                  <span className="text-xs font-semibold block">Transparent Receipts</span>
                  <span className="text-[11px] text-stone-500">Every rupee accounted</span>
                </div>
              </div>
            </section>

            {/* EVENT TEASER: Preview Card for "Ganesha Chaturthi 2026" */}
            <section className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
                    Featured Celebration
                  </span>
                  <h3 className="text-2xl font-serif font-black">Festival Preview</h3>
                </div>
                <button
                  onClick={() => handleNavigateTab('events')}
                  className="text-xs font-bold text-red-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>All celebrations</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div
                className={`rounded-3xl border-2 overflow-hidden shadow-xs hover:border-red-600 transition-all ${
                  isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                }`}
              >
                <div className="p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="space-y-3 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-red-600 text-yellow-300 px-2.5 py-0.5 rounded shadow-xs">
                        Ganesha Chaturthi
                      </span>
                      <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 px-2 py-0.5 rounded border border-red-200 dark:border-red-800">
                        ● Ongoing
                      </span>
                    </div>

                    <div>
                      <h4 className="text-2xl font-serif font-black text-red-700 dark:text-red-400">
                        Ganesha Chaturthi 2026
                      </h4>
                      <span className="text-sm font-serif font-bold text-amber-800 dark:text-yellow-400 block mt-0.5">
                        ಶ್ರೀ ವಿನಾಯಕ ಚತುರ್ಥಿ ಮಹೋತ್ಸವ ೨೦೨೬
                      </span>
                    </div>

                    <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                      13th to 18th of this month | Clubhouse Grand Arena | 45 volunteers, 12 cultural acts.
                      Grand 5-day celebration with daily Mahaprasada Anna Santharpane and Vedic poojas.
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 pt-1">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-red-600 shrink-0" />
                        <span>13th to 18th of this month</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
                        <span>Clubhouse Grand Arena</span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <button
                      onClick={() => handleNavigateTab('event-detail', 'ganesh-chaturthi-2026')}
                      className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-yellow-300 font-bold text-xs shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <span>Explore Festival Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* LATEST ANNOUNCEMENT SNAPSHOT: "Grand Ganesha Visarjana & Cultural Night Planning" */}
            <section className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
                    Official Bulletin
                  </span>
                  <h3 className="text-2xl font-serif font-black">Latest Announcement</h3>
                </div>
                <button
                  onClick={() => handleNavigateTab('announcements')}
                  className="text-xs font-bold text-red-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>View All Bulletins</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div
                className={`rounded-3xl border-2 p-6 sm:p-8 space-y-4 shadow-xs ${
                  isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2 border-b pb-3 border-stone-100 dark:border-stone-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-yellow-300 px-2.5 py-0.5 rounded">
                    Cultural &amp; Event Notice
                  </span>
                  <span className="text-xs text-stone-400">10 Sep 2026</span>
                </div>

                <div>
                  <h4 className="text-xl font-serif font-black text-red-700 dark:text-red-400">
                    Grand Ganesha Visarjana &amp; Cultural Night Planning
                  </h4>
                  <span className="text-xs font-serif font-bold text-amber-800 dark:text-yellow-400 block mt-0.5">
                    ಮಹಾ ಗಣೇಶ ವಿಸರ್ಜನೆ ಹಾಗೂ ಸಾಂಸ್ಕೃತಿಕ ಸಂಜೆ ಸಿದ್ಧತೆಗಳು
                  </span>
                </div>

                <div
                  className={`text-xs sm:text-sm leading-relaxed p-4 rounded-2xl border font-sans whitespace-pre-line ${
                    isDark
                      ? 'bg-stone-800/60 border-stone-700 text-stone-200'
                      : 'bg-amber-50/60 border-amber-200 text-stone-800'
                  }`}
                >
                  The grand immersion procession (Visarjana Shobhayatre) for Sri Ganeshotsava 2026 will
                  commence on the final evening. Special Chende drums, floral decoration squad, and eco-pond
                  immersion are arranged within the premises. Residents are invited to join the farewell
                  bhajans and maha mangalarathi.
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-stone-400">— Kannadigara Balaga Committee</span>
                  <button
                    onClick={() => handleNavigateTab('announcements')}
                    className="text-xs font-bold text-red-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Read complete notice</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </section>

            {/* PAST CELEBRATIONS GRID (Visual Archiving Links) */}
            <section className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
                    Our 2-Year Heritage
                  </span>
                  <h3 className="text-2xl font-serif font-black">
                    Past Celebrations (2025 &amp; 2024)
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                    Sri Ganesha Chaturthi and Karnataka Rajyotsava across our inaugural two seasons.
                  </p>
                </div>
                <button
                  onClick={() => handleNavigateTab('archive')}
                  className="text-xs font-bold text-red-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Full Archive</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                  onClick={() => handleNavigateTab('archive')}
                  className={`p-4 rounded-2xl border-2 hover:border-red-600 transition-colors cursor-pointer shadow-xs space-y-2 ${
                    isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 px-1.5 py-0.5 rounded">
                      2025
                    </span>
                    <span className="text-stone-400">01 Nov</span>
                  </div>
                  <h5 className="text-sm font-serif font-bold">Karnataka Rajyotsava 2025</h5>
                  <p className="text-xs text-stone-500">Amphitheatre • Flag Hoisting &amp; 16 acts</p>
                </div>

                <div
                  onClick={() => handleNavigateTab('archive')}
                  className={`p-4 rounded-2xl border-2 hover:border-red-600 transition-colors cursor-pointer shadow-xs space-y-2 ${
                    isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="bg-yellow-100 dark:bg-yellow-950/60 text-yellow-900 dark:text-yellow-300 px-1.5 py-0.5 rounded">
                      2025
                    </span>
                    <span className="text-stone-400">27-31 Aug</span>
                  </div>
                  <h5 className="text-sm font-serif font-bold">Ganesha Chaturthi 2025</h5>
                  <p className="text-xs text-stone-500">5 Days • 45 volunteers • 310 contributors</p>
                </div>

                <div
                  onClick={() => handleNavigateTab('archive')}
                  className={`p-4 rounded-2xl border-2 hover:border-red-600 transition-colors cursor-pointer shadow-xs space-y-2 ${
                    isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 px-1.5 py-0.5 rounded">
                      2024
                    </span>
                    <span className="text-stone-400">01 Nov</span>
                  </div>
                  <h5 className="text-sm font-serif font-bold">Karnataka Rajyotsava 2024</h5>
                  <p className="text-xs text-stone-500">Inaugural Rajyotsava • Folk songs &amp; quiz</p>
                </div>

                <div
                  onClick={() => handleNavigateTab('archive')}
                  className={`p-4 rounded-2xl border-2 hover:border-red-600 transition-colors cursor-pointer shadow-xs space-y-2 ${
                    isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="bg-yellow-100 dark:bg-yellow-950/60 text-yellow-900 dark:text-yellow-300 px-1.5 py-0.5 rounded">
                      2024
                    </span>
                    <span className="text-stone-400">07-11 Sep</span>
                  </div>
                  <h5 className="text-sm font-serif font-bold">Ganesha Chaturthi 2024</h5>
                  <p className="text-xs text-stone-500">First historic celebration • Foundation year</p>
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
                { id: 'all', label: 'All', count: COMMUNITY_EVENTS.length },
                {
                  id: 'ongoing',
                  label: 'Ongoing / Live: 1',
                  count: COMMUNITY_EVENTS.filter((e) => e.status === 'ongoing').length
                },
                {
                  id: 'upcoming',
                  label: 'Upcoming: 1',
                  count: COMMUNITY_EVENTS.filter((e) => e.status === 'upcoming').length
                },
                {
                  id: 'archived',
                  label: 'Archived: 4',
                  count: COMMUNITY_EVENTS.filter((e) => e.status === 'archived').length
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

            {/* Tag Filters */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-stone-400 font-semibold">Filter by Festival:</span>
              {['all', 'Ganesha Chaturthi', 'Karnataka Rajyotsava'].map((fest) => (
                <button
                  key={fest}
                  onClick={() => setEventFilterFestival(fest)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    eventFilterFestival === fest
                      ? 'bg-yellow-400 text-stone-950 font-bold'
                      : isDark
                      ? 'bg-stone-900 text-stone-400 border border-stone-800 hover:text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {fest === 'all' ? 'All Festivals' : fest}
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
                      <p className="text-xs text-amber-900 dark:text-stone-400 font-medium italic mt-1">
                        {evt.theme}
                      </p>
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
                    <div className="flex items-center gap-2 text-xs text-stone-500">
                      <span>
                        <strong className="text-stone-800 dark:text-stone-200">{evt.volunteersCount}</strong> vols
                      </span>
                      <span>•</span>
                      <span>
                        <strong className="text-stone-800 dark:text-stone-200">{evt.actsCount}</strong> acts
                      </span>
                    </div>

                    <button
                      onClick={() => handleNavigateTab('event-detail', evt.slug || evt.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-yellow-300 font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1 shadow-xs"
                    >
                      <span>View Details</span>
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
              <p className={`text-sm max-w-2xl ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                Capturing moments of Kannada pride, traditional attire, and festival rituals through the
                years.
              </p>
            </div>

            {/* Multi-dimensional Filter Bar */}
            <div
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 ${
                isDark ? 'border-stone-800' : 'border-stone-200'
              }`}
            >
              {/* Chronological filter row */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-stone-400">Year:</span>
                {['all', '2026', '2025', '2024'].map((yr) => (
                  <button
                    key={yr}
                    onClick={() => setGalleryYear(yr)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      galleryYear === yr
                        ? 'bg-red-600 text-yellow-300 shadow-xs'
                        : isDark
                        ? 'bg-stone-900 border border-stone-800 text-stone-300 hover:bg-stone-800'
                        : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    {yr === 'all' ? 'All years' : yr}
                  </button>
                ))}
              </div>

              {/* Festival dropdown / select element */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-stone-400">Celebration:</span>
                <select
                  value={galleryCelebration}
                  onChange={(e) => setGalleryCelebration(e.target.value)}
                  className={`text-xs px-3 py-1.5 rounded-xl border outline-none font-semibold ${
                    isDark
                      ? 'bg-stone-900 border-stone-700 text-stone-200 focus:border-red-500'
                      : 'bg-white border-stone-200 text-stone-800 focus:border-red-600'
                  }`}
                >
                  <option value="all">All celebrations</option>
                  <option value="Ganesha Chaturthi 2026">Ganesha Chaturthi 2026</option>
                  <option value="Ganesha Chaturthi 2025">Ganesha Chaturthi 2025</option>
                  <option value="Karnataka Rajyotsava 2025">Karnataka Rajyotsava 2025</option>
                  <option value="Ganesha Chaturthi 2024">Ganesha Chaturthi 2024</option>
                  <option value="Karnataka Rajyotsava 2024">Karnataka Rajyotsava 2024</option>
                </select>
              </div>
            </div>

            {/* Photo Grid Layout */}
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
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                      <span className="text-[10px] font-bold text-yellow-300 uppercase tracking-wider">
                        {photo.performanceType || photo.celebration}
                      </span>
                      <span className="text-white text-xs font-serif font-bold">{photo.title}</span>
                    </div>
                    <span className="absolute top-2 left-2 text-[10px] font-bold bg-black/70 text-white px-2 py-0.5 rounded backdrop-blur-xs">
                      {photo.year}
                    </span>
                  </div>

                  <div className="p-4 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold truncate text-stone-900 dark:text-stone-100">
                        {photo.title}
                      </span>
                      <span className="text-stone-400 shrink-0 ml-1">{photo.celebration}</span>
                    </div>
                    {photo.caption && (
                      <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed">
                        {photo.caption}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Lightbox Modal */}
            {lightboxPhoto && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
                onClick={() => setLightboxPhoto(null)}
              >
                <div
                  className="max-w-3xl w-full bg-stone-900 rounded-3xl overflow-hidden border-2 border-red-600 shadow-2xl relative animate-in fade-in"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setLightboxPhoto(null)}
                    className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-full hover:bg-red-600 transition-colors cursor-pointer z-10"
                    aria-label="Close photo"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <img
                    src={lightboxPhoto.imageUrl}
                    alt={lightboxPhoto.title}
                    className="w-full max-h-[70vh] object-contain bg-black"
                  />
                  <div className="p-5 text-white space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-serif font-bold text-base text-yellow-300">
                        {lightboxPhoto.title}
                      </h4>
                      <span className="text-xs bg-red-600 px-2 py-0.5 rounded font-bold">
                        {lightboxPhoto.celebration} ({lightboxPhoto.year})
                      </span>
                    </div>
                    {lightboxPhoto.caption && (
                      <p className="text-xs text-stone-300">{lightboxPhoto.caption}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
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
              <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                Latest notes from the cultural committee for Sri Ganesha Chaturthi, Karnataka Rajyotsava,
                volunteer rosters, and audited receipts.
              </p>
            </div>

            {/* Filter Pills & Search */}
            <div
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 ${
                isDark ? 'border-stone-800' : 'border-stone-200'
              }`}
            >
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 text-xs">
                {['all', 'event', 'cultural', 'volunteer', 'finance'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setAnnouncementCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl font-bold capitalize transition-colors cursor-pointer ${
                      announcementCategory === cat
                        ? 'bg-red-600 text-yellow-300 shadow-xs'
                        : isDark
                        ? 'bg-stone-900 border border-stone-800 text-stone-300 hover:bg-stone-800'
                        : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    {cat === 'all' ? 'All Updates' : cat}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search notices..."
                  value={announcementSearch}
                  onChange={(e) => setAnnouncementSearch(e.target.value)}
                  className={`w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border outline-none ${
                    isDark
                      ? 'bg-stone-900 border-stone-800 text-white focus:border-red-500'
                      : 'bg-white border-stone-200 text-stone-900 focus:border-red-600'
                  }`}
                />
              </div>
            </div>

            {/* Stream Feed List */}
            <div className="space-y-6">
              {filteredAnnouncements.map((ann) => (
                <article
                  key={ann.id}
                  className={`rounded-3xl border-2 hover:border-red-600 p-6 sm:p-8 shadow-xs space-y-4 ${
                    isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                  }`}
                >
                  <div
                    className={`flex flex-wrap items-center justify-between gap-2 border-b pb-3 ${
                      isDark ? 'border-stone-800' : 'border-stone-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-red-600 text-yellow-300 px-2.5 py-0.5 rounded">
                        {ann.category}
                      </span>
                      {ann.important && (
                        <span className="text-[10px] font-bold uppercase bg-amber-400 text-stone-950 px-2 py-0.5 rounded">
                          Priority
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-stone-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{ann.date}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl sm:text-2xl font-serif font-black text-red-700 dark:text-red-400">
                      {ann.title}
                    </h3>
                    {ann.kannadaTitle && (
                      <span className="text-sm font-serif font-bold text-amber-800 dark:text-yellow-400 block mt-1">
                        {ann.kannadaTitle}
                      </span>
                    )}
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

                  <div className="pt-2 flex items-center justify-between flex-wrap gap-2 text-xs">
                    <span className="text-stone-400 italic">
                      {ann.closingSignature || '— Kannadigara Balaga Committee'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyText(ann.content, ann.id)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer ${
                          isDark
                            ? 'border-stone-700 text-stone-300 hover:bg-stone-800'
                            : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        {copiedId === ann.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-stone-400" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleShareWhatsApp(ann.title, ann.summary)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Share on WhatsApp</span>
                      </button>
                    </div>
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
              <p className={`text-sm max-w-2xl leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                Detailed history of our community gatherings over 2026, 2025, and 2024 alongside an audited,
                transparent asset map.
              </p>
            </div>

            <div className="space-y-10">
              {ARCHIVE_RECORDS.map((yrRecord) => (
                <div key={yrRecord.year} className="space-y-4">
                  <div className="flex items-center justify-between border-b-2 border-red-600 pb-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-serif font-black">{yrRecord.year}</h3>
                      {yrRecord.milestoneTag && (
                        <span className="text-xs font-bold text-red-600 dark:text-yellow-300 bg-red-50 dark:bg-red-950/60 px-2.5 py-0.5 rounded-full border border-red-200 dark:border-red-800">
                          {yrRecord.milestoneTag}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-stone-500 font-semibold">
                      {yrRecord.celebrationsCount} Major Celebrations
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {yrRecord.celebrations.map((cel, idx) => (
                      <div
                        key={idx}
                        className={`rounded-3xl border-2 p-6 shadow-xs space-y-3 ${
                          isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-red-600 uppercase tracking-wider">
                            {cel.festival}
                          </span>
                          <span className="text-stone-400 font-medium">{cel.dates}</span>
                        </div>

                        <div>
                          <h4 className="text-lg font-serif font-black text-stone-900 dark:text-stone-100">
                            {cel.name}
                          </h4>
                          {cel.kannadaName && (
                            <span className="text-xs font-serif font-bold text-amber-700 dark:text-yellow-400 block">
                              {cel.kannadaName}
                            </span>
                          )}
                        </div>

                        <p className={`text-xs leading-relaxed ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                          {cel.description}
                        </p>

                        <div
                          className={`pt-3 border-t grid grid-cols-2 gap-2 text-xs ${
                            isDark ? 'border-stone-800 text-stone-400' : 'border-stone-100 text-stone-500'
                          }`}
                        >
                          <div>
                            <span className="block font-bold text-stone-800 dark:text-stone-200">
                              {cel.volunteersCount} Volunteers
                            </span>
                            <span className="text-[11px]">Seva &amp; organizing team</span>
                          </div>
                          <div>
                            <span className="block font-bold text-stone-800 dark:text-stone-200">
                              {cel.contributorsCount}+ Devotees
                            </span>
                            <span className="text-[11px]">{cel.amountAccounted || '100% Accounted'}</span>
                          </div>
                        </div>
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
                Kannadigara Balaga: Of the Residents, By the Residents, For the Residents
              </h2>
              <p className={`text-sm max-w-2xl leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                A volunteer working group within Eldorado dedicated to honoring Kannada heritage,
                organizing community festival sevas, and creating lifelong memories for all apartment
                families.
              </p>
            </div>

            {/* Grid Callouts: Distinct mission panels */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div
                className={`p-6 rounded-3xl border-2 space-y-2.5 ${
                  isDark ? 'bg-stone-900 border-red-600/40' : 'bg-white border-red-600/30'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-red-600 text-yellow-300 flex items-center justify-center font-bold">
                  1
                </div>
                <h3 className="text-lg font-serif font-bold text-red-700 dark:text-red-400">
                  Cultural Preservation
                </h3>
                <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                  Nurturing Kannada language, traditional folk dances (Dollu Kunitha, Yakshagana), poetry,
                  and classical music among the next generation living in our community towers.
                </p>
              </div>

              <div
                className={`p-6 rounded-3xl border-2 space-y-2.5 ${
                  isDark ? 'bg-stone-900 border-yellow-400/40' : 'bg-white border-yellow-400/40'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-yellow-400 text-stone-950 flex items-center justify-center font-bold">
                  2
                </div>
                <h3 className="text-lg font-serif font-bold text-amber-700 dark:text-yellow-400">
                  Community Harmony
                </h3>
                <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                  Fostering strong neighborly brotherhood, mutual assistance, and festive joy across all
                  buildings and clusters in Eldorado through shared celebrations.
                </p>
              </div>

              <div
                className={`p-6 rounded-3xl border-2 space-y-2.5 ${
                  isDark ? 'bg-stone-900 border-yellow-400/40' : 'bg-white border-yellow-400/40'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                  3
                </div>
                <h3 className="text-lg font-serif font-bold text-amber-700 dark:text-yellow-400">
                  Inclusivity
                </h3>
                <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                  Warmly welcoming all residents of any background, linguistic group, or region to immerse in
                  Karnataka's rich hospitalities, festive Anna Santharpane, and cultural stage acts.
                </p>
              </div>

              <div
                className={`p-6 rounded-3xl border-2 space-y-2.5 ${
                  isDark ? 'bg-stone-900 border-red-600/40' : 'bg-white border-red-600/30'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  4
                </div>
                <h3 className="text-lg font-serif font-bold text-emerald-700 dark:text-emerald-400">
                  Absolute Financial Accountability
                </h3>
                <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                  Every single rupee contributed by a resident generates an instantaneous digital receipt
                  with transparent live audit ledgers searchable by tower and flat number.
                </p>
              </div>
            </div>

            {/* Core Committee Profile Grid */}
            <div className="space-y-6">
              <div className="border-b pb-3 border-stone-200 dark:border-stone-800">
                <h3 className="text-2xl font-serif font-black">Volunteer Working Group &amp; Committee</h3>
                <p className={`text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                  Eldorado residents volunteering their time for cultural, logistics, pooja, and financial
                  coordination.
                </p>
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

            {/* Transparency Pledge Panel */}
            <div
              className={`p-6 sm:p-8 rounded-3xl border-2 border-yellow-400 flex flex-col sm:flex-row items-center justify-between gap-6 ${
                isDark ? 'bg-stone-900 text-stone-100' : 'bg-amber-50/80 text-stone-900'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-emerald-600" />
                  <h3 className="text-xl font-serif font-bold">Our Transparency Pledge</h3>
                </div>
                <p className={`text-xs sm:text-sm max-w-xl ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                  We maintain complete accountability down to the last rupee. All voluntary contributions,
                  sponsorships, stall revenues, and expense vouchers are audited and accessible to devotees.
                </p>
              </div>
              <button
                onClick={onNavigateToReceipts}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-yellow-300 font-bold text-xs shadow-xs transition-colors cursor-pointer shrink-0 inline-flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                <span>View Financial Tracking Sheet</span>
              </button>
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
              <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                Have a suggestion, want to nominate a cultural act, volunteer for decoration, or have queries
                on devotional sevas? We are here for you.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Column A: Reactive Form */}
              <div
                className={`md:col-span-2 rounded-3xl border-2 p-6 sm:p-8 shadow-xs ${
                  isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                }`}
              >
                {contactSubmitted ? (
                  <div className="py-12 text-center space-y-3">
                    <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                    <h3 className="text-xl font-serif font-black text-emerald-600">
                      Dhanyavadagalu! Message Received
                    </h3>
                    <p className={`text-xs max-w-md mx-auto ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                      Our Balaga volunteer coordinator will review your note and respond within 24–48 hours.
                    </p>
                    <button
                      onClick={() => setContactSubmitted(false)}
                      className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-xs font-bold hover:bg-stone-200 transition-colors cursor-pointer"
                    >
                      Send another query
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!contactForm.dpdpConsent) {
                        alert('Please accept the DPDP Act consent checkbox to proceed.');
                        return;
                      }
                      setContactSubmitted(true);
                    }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold mb-1">Full Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="Your Name"
                          value={contactForm.fullName}
                          onChange={(e) => setContactForm({ ...contactForm, fullName: e.target.value })}
                          className={`w-full text-xs px-3.5 py-2.5 rounded-xl border outline-none ${
                            isDark
                              ? 'bg-stone-800 border-stone-700 text-white focus:border-red-500'
                              : 'bg-stone-50 border-stone-200 text-stone-900 focus:bg-white focus:border-red-600'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold mb-1">Email *</label>
                        <input
                          type="email"
                          required
                          placeholder="your.email@gmail.com"
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                          className={`w-full text-xs px-3.5 py-2.5 rounded-xl border outline-none ${
                            isDark
                              ? 'bg-stone-800 border-stone-700 text-white focus:border-red-500'
                              : 'bg-stone-50 border-stone-200 text-stone-900 focus:bg-white focus:border-red-600'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1">Tower &amp; Flat (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Feldspar-1402"
                        value={contactForm.towerFlat}
                        onChange={(e) => setContactForm({ ...contactForm, towerFlat: e.target.value })}
                        className={`w-full text-xs px-3.5 py-2.5 rounded-xl border outline-none ${
                          isDark
                            ? 'bg-stone-800 border-stone-700 text-white focus:border-red-500'
                            : 'bg-stone-50 border-stone-200 text-stone-900 focus:bg-white focus:border-red-600'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1">Subject *</label>
                      <select
                        value={contactForm.subject}
                        onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                        className={`w-full text-xs px-3.5 py-2.5 rounded-xl border outline-none font-semibold ${
                          isDark
                            ? 'bg-stone-800 border-stone-700 text-white focus:border-red-500'
                            : 'bg-stone-50 border-stone-200 text-stone-900 focus:bg-white focus:border-red-600'
                        }`}
                      >
                        <option>General enquiry</option>
                        <option>Volunteering for Decoration</option>
                        <option>Cultural Performance Nomination</option>
                        <option>Contributions &amp; Sponsorships</option>
                        <option>Feedback</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1">Message *</label>
                      <textarea
                        required
                        rows={4}
                        placeholder="How can the Balaga help?"
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        className={`w-full text-xs px-3.5 py-2.5 rounded-xl border outline-none ${
                          isDark
                            ? 'bg-stone-800 border-stone-700 text-white focus:border-red-500'
                            : 'bg-stone-50 border-stone-200 text-stone-900 focus:bg-white focus:border-red-600'
                        }`}
                      />
                    </div>

                    {/* Notice Drawer: Nested toggle accordion for DPDP policy */}
                    <div
                      className={`p-3 rounded-2xl border text-xs ${
                        isDark ? 'bg-stone-800/60 border-stone-700' : 'bg-stone-50 border-stone-200'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setDpdpNoticeDrawerOpen(!dpdpNoticeDrawerOpen)}
                        className="w-full flex items-center justify-between font-semibold text-stone-500 cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-red-600" />
                          <span>Data Handling Policy under DPDP Act 2023</span>
                        </span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform ${
                            dpdpNoticeDrawerOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {dpdpNoticeDrawerOpen && (
                        <p
                          className={`mt-2 pt-2 border-t text-[11px] leading-relaxed ${
                            isDark ? 'border-stone-700 text-stone-300' : 'border-stone-200 text-stone-600'
                          }`}
                        >
                          We process your name and contact details strictly for community event updates and
                          volunteer assignment. You may request data deletion at any time by contacting{' '}
                          <a
                            href="mailto:contact@kannadigarabalaga.org"
                            className="text-red-600 underline"
                          >
                            contact@kannadigarabalaga.org
                          </a>
                          .
                        </p>
                      )}
                    </div>

                    {/* DPDP Consent Checkbox */}
                    <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={contactForm.dpdpConsent}
                        onChange={(e) =>
                          setContactForm({ ...contactForm, dpdpConsent: e.target.checked })
                        }
                        className="mt-0.5 rounded border-stone-300 text-red-600 focus:ring-red-500"
                      />
                      <span className={`text-[11px] leading-relaxed ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                        I consent to my information being collected for the purpose of getting loop updates
                        regarding community events *
                      </span>
                    </label>

                    <button
                      type="submit"
                      disabled={!contactForm.dpdpConsent}
                      className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-yellow-300 font-bold text-xs transition-colors cursor-pointer shadow-xs inline-flex items-center justify-center gap-1.5 border border-yellow-400"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Message</span>
                    </button>
                  </form>
                )}
              </div>

              {/* Column B: Info Column */}
              <div className="space-y-5">
                <div
                  className={`rounded-3xl border-2 p-6 shadow-xs space-y-4 ${
                    isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                  }`}
                >
                  <h4 className="text-base font-serif font-black">Direct Communication Channels</h4>
                  <div className="space-y-4 text-xs">
                    <div className="flex items-start gap-3">
                      <Mail className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">Balaga Official Email</span>
                        <a
                          href="mailto:contact@kannadigarabalaga.org"
                          className="text-red-600 hover:underline break-all"
                        >
                          contact@kannadigarabalaga.org
                        </a>
                      </div>
                    </div>

                    <div
                      className={`flex items-start gap-3 pt-3 border-t ${
                        isDark ? 'border-stone-800' : 'border-stone-100'
                      }`}
                    >
                      <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">Response SLA</span>
                        <span className="text-stone-500">24–48 hours response time</span>
                      </div>
                    </div>

                    <div
                      className={`flex items-start gap-3 pt-3 border-t ${
                        isDark ? 'border-stone-800' : 'border-stone-100'
                      }`}
                    >
                      <MapPin className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">Physical Address</span>
                        <span className="text-stone-500 leading-relaxed block">
                          Brigade El Dorado, KIADB, Aerospace Park, Bengaluru, Karnataka - 562149
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={`rounded-3xl border-2 p-6 shadow-xs space-y-2.5 ${
                    isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                  }`}
                >
                  <h4 className="text-sm font-serif font-bold text-red-600">Volunteer Hotline</h4>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                    Active volunteers can directly connect via WhatsApp group updates by signing in with
                    Gmail.
                  </p>
                  <button
                    onClick={() => {
                      if (!currentUser) setAuthModalOpen(true);
                      else setVolunteerModalOpen(true);
                    }}
                    className="w-full py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-stone-950 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Open Volunteer Portal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            PAGE 8: DEEP EVENT DETAIL VIEW ('/events/:slug')
           ======================================================== */}
        {activeTab === 'event-detail' && (
          <BalagaEventDetailView
            event={selectedEvent}
            onBackToEvents={() => handleNavigateTab('events')}
            onOpenContribute={() => setContributeModalOpen(true)}
            onOpenVolunteer={() => {
              if (!currentUser) setAuthModalOpen(true);
              else setVolunteerModalOpen(true);
            }}
            onOpenNominate={() => setNominateModalOpen(true)}
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
          {/* Column 1: Brand Column */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-600 p-1 flex items-center justify-center border border-yellow-400 shadow-xs">
                <img
                  src="/lord_ganesha.svg"
                  alt="Lord Ganesha"
                  className="w-full h-full object-contain filter invert"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="font-serif font-black text-base text-red-600">ಕನ್ನಡಿಗರ ಬಳಗ</span>
            </div>

            <p className="text-xs font-serif font-bold text-amber-700 dark:text-yellow-400 italic">
              "Bringing the Spirit of Karnataka to Our Community."
            </p>
            <p className="text-xs font-serif font-bold text-stone-800 dark:text-stone-200">
              ಸಿರಿಗನ್ನಡಂ ಗೆಲ್ಗೆ! ಸಿರಿಗನ್ನಡಂ ಬಾಳ್ಗೆ!
            </p>

            {/* Privacy Compliance Visual Badge */}
            <div className="pt-2">
              <div
                className={`p-2.5 rounded-xl border text-[11px] leading-relaxed flex items-start gap-2 ${
                  isDark
                    ? 'bg-stone-900 border-stone-800 text-stone-400'
                    : 'bg-white border-stone-200 text-stone-600'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Compliant with <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong> —
                  Privacy-first data handling with explicit consent.
                </span>
              </div>
            </div>
          </div>

          {/* Column 2: Explore Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
              Explore Links
            </h4>
            <ul className="space-y-2 text-xs font-medium">
              <li>
                <button
                  onClick={() => handleNavigateTab('home')}
                  className="hover:text-red-600 cursor-pointer"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigateTab('events')}
                  className="hover:text-red-600 cursor-pointer"
                >
                  Events &amp; Celebrations
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigateTab('gallery')}
                  className="hover:text-red-600 cursor-pointer"
                >
                  Vaibhava Gallery
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigateTab('announcements')}
                  className="hover:text-red-600 cursor-pointer"
                >
                  Announcements
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigateTab('archive')}
                  className="hover:text-red-600 cursor-pointer"
                >
                  Celebration Archive
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigateTab('login')}
                  className="hover:text-red-600 cursor-pointer"
                >
                  Sign in Portal
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal Modals */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
              Legal &amp; Compliance
            </h4>
            <ul className="space-y-2 text-xs font-medium">
              <li>
                <button
                  onClick={() => setPolicyModal('privacy')}
                  className="hover:text-red-600 cursor-pointer text-left"
                >
                  Privacy Policy (DPDP Act)
                </button>
              </li>
              <li>
                <button
                  onClick={() => setPolicyModal('terms')}
                  className="hover:text-red-600 cursor-pointer text-left"
                >
                  Terms of Use
                </button>
              </li>
              <li>
                <button
                  onClick={() => setPolicyModal('refund')}
                  className="hover:text-red-600 cursor-pointer text-left"
                >
                  Refund &amp; Cancellation
                </button>
              </li>
              <li>
                <button
                  onClick={() => setPolicyModal('cookies')}
                  className="hover:text-red-600 cursor-pointer text-left"
                >
                  Cookie Preferences
                </button>
              </li>
              <li>
                <button
                  onClick={onNavigateToReceipts}
                  className="text-red-600 dark:text-yellow-400 font-bold hover:underline cursor-pointer text-left inline-flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Devotee Receipts &amp; Tokens</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact Info */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
              Contact Info
            </h4>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Mail className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                <a
                  href="mailto:contact@kannadigarabalaga.org"
                  className="hover:text-red-600 underline break-all"
                >
                  contact@kannadigarabalaga.org
                </a>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  Brigade El Dorado, KIADB, Aerospace Park, Bengaluru, Karnataka - 562149
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div
          className={`border-t py-4 px-4 sm:px-6 ${
            isDark ? 'border-stone-800 text-stone-500' : 'border-stone-200 text-stone-500'
          }`}
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
            <span>© 2024-2026 Eldorado Kannadigara Balaga. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setPolicyModal('cookies')}
                className="hover:text-red-600 cursor-pointer"
              >
                Cookie Preferences
              </button>
              <span>•</span>
              <button
                onClick={() => setPolicyModal('privacy')}
                className="hover:text-red-600 cursor-pointer"
              >
                DPDP Notice
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* POPUP MODALS */}
      {/* 1. Balaga Auth Modal */}
      <BalagaAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        currentUser={currentUser}
        onUserChange={(user) => setCurrentUser(user)}
        allowedEmails={allowedEmails}
        onUpdateAllowedEmails={handleUpdateAllowedEmails}
        isAdmin={isCurrentAdmin}
      />

      {/* 2. Volunteer Roster Modal */}
      <BalagaVolunteerModal
        isOpen={volunteerModalOpen}
        onClose={() => setVolunteerModalOpen(false)}
        currentUser={currentUser}
        onRequireLogin={() => {
          setVolunteerModalOpen(false);
          setAuthModalOpen(true);
        }}
      />

      {/* 3. Nominate Cultural Act Modal */}
      <BalagaNominateModal
        isOpen={nominateModalOpen}
        onClose={() => setNominateModalOpen(false)}
      />

      {/* 4. Policy Modals */}
      <BalagaPolicyModals
        activeModal={policyModal}
        onClose={() => setPolicyModal(null)}
        isDark={isDark}
      />

      {/* 5. Contribute Modal / Link to Devotee Receipts */}
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
                Voluntary Devotee Seva Contribution
              </h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                Support community Anna Santharpane, flower decorations, sound &amp; stage setup, and Vedic
                pooja rituals for Ganesha Chaturthi and Karnataka Rajyotsava.
              </p>

              <div
                className={`p-4 rounded-2xl border text-left text-xs space-y-1.5 ${
                  isDark ? 'bg-stone-800/80 border-stone-700' : 'bg-amber-50 border-amber-200'
                }`}
              >
                <div className="flex justify-between">
                  <span className="text-stone-500">Official UPI ID:</span>
                  <span className="font-mono font-bold text-red-600">
                    {settings.upiId || 'kannadigara.balaga@upi'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Payee Name:</span>
                  <span className="font-bold">{settings.org || 'Eldorado Kannadigara Balaga'}</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => {
                    setContributeModalOpen(false);
                    onNavigateToReceipts();
                  }}
                  className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-yellow-300 font-bold text-xs transition-colors cursor-pointer shadow-xs inline-flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Open Devotee Receipts &amp; Token Records</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
