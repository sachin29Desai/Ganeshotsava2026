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
  ChevronLeft,
  Mail,
  Phone,
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
  ExternalLink,
  Globe,
  Landmark
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
  FormLinksConfig,
  extractYouTubeEmbedUrl
} from '../utils/dataUtils';
import { BalagaAuthModal } from './balaga/BalagaAuthModal';
import { BalagaVolunteerModal } from './balaga/BalagaVolunteerModal';
import { BalagaNominateModal } from './balaga/BalagaNominateModal';
import { BalagaPolicyModals } from './balaga/BalagaPolicyModals';
import { BalagaLoginView } from './balaga/BalagaLoginView';
import { BalagaEventDetailView } from './balaga/BalagaEventDetailView';
import { BalagaHistoryView } from './balaga/BalagaHistoryView';
import { BalagaAboutUsView } from './balaga/BalagaAboutUsView';
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
  | 'our-history'
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
  const [announcementIndex, setAnnouncementIndex] = useState(0);

  // Auto-movable announcements carousel loop (5 seconds interval)
  useEffect(() => {
    if (announcementsList.length <= 1) return;
    const timer = setInterval(() => {
      setAnnouncementIndex((prev) => (prev + 1) % announcementsList.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [announcementsList.length]);

  const { currentEvents, upcomingEvents, pastEvents } = classifyEvents(allEvents);

  const [pastEventIndex, setPastEventIndex] = useState(0);

  // Auto-scrolling loop for Concluded Celebrations Archive (every 6 seconds)
  useEffect(() => {
    if (!pastEvents || pastEvents.length <= 1) return;
    const timer = setInterval(() => {
      setPastEventIndex((prev) => (prev + 1) % pastEvents.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [pastEvents.length]);
  const [formLinks, setFormLinks] = useState<FormLinksConfig>(() => getStoredFormLinks());

  // Language preference state (Default: Kannada 'kn')
  const [lang, setLang] = useState<'kn' | 'en'>(() => {
    try {
      return (localStorage.getItem('kb_language_preference') as 'kn' | 'en') || 'kn';
    } catch {
      return 'kn';
    }
  });

  const toggleLanguage = () => {
    setLang((prev) => {
      const next = prev === 'kn' ? 'en' : 'kn';
      try {
        localStorage.setItem('kb_language_preference', next);
      } catch {}
      return next;
    });
  };

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
        if (cloudPhotos) {
          setPhotosList(cloudPhotos);
        }
        if (cloudAnnouncements !== null) {
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

  // Sync theme when Admin updates defaultTheme setting
  useEffect(() => {
    if (formLinks.defaultTheme) {
      const targetIsDark = formLinks.defaultTheme === 'dark';
      setIsDark(targetIsDark);
      try {
        localStorage.setItem('kb_theme_is_dark', targetIsDark ? 'true' : 'false');
      } catch {}
    }
  }, [formLinks.defaultTheme]);


  // Route initial detection matching pages + Our History + Admin Portal
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
    if (path.includes('/our-history') || path.includes('/history') || hash.includes('history')) {
      return { tab: 'our-history' };
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
  const handleNavigateTab = (tab: CommunityPageTab, sectionIdOrEventId?: string) => {
    setActiveTab(tab);
    if (tab === 'event-detail' && sectionIdOrEventId) {
      setSelectedEventId(sectionIdOrEventId);
    }
    setMobileMenuOpen(false);

    let newPath = '/';
    if (tab === 'home') newPath = '/';
    else if (tab === 'about') newPath = '/about-us';
    else if (tab === 'our-history') newPath = '/our-history';
    else if (tab === 'our-team') newPath = '/our-team';
    else if (tab === 'past-events') newPath = '/past-events';
    else if (tab === 'upcoming-events') newPath = '/upcoming-events';
    else if (tab === 'membership') newPath = '/membership';
    else if (tab === 'contact') newPath = '/contact-us';
    else if (tab === 'event-detail') newPath = `/events/${sectionIdOrEventId || selectedEventId || 'rajyotsava-2026'}`;
    else if (tab === 'login') newPath = '/login';
    else if (tab === 'admin') newPath = '/admin';

    try {
      window.history.pushState({}, '', newPath);
    } catch {}

    if (tab === 'about' && sectionIdOrEventId) {
      setTimeout(() => {
        const targetEl = document.getElementById(sectionIdOrEventId);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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

  // Navigation Links with Language preference support (pure Kannada when 'kn', pure English when 'en')
  interface NavLinkItem {
    id: string;
    sectionId: string;
    label: string;
  }

  const navLinks: NavLinkItem[] = [
    { id: 'home', sectionId: 'home', label: lang === 'kn' ? 'ಮುಖಪುಟ' : 'Home' },
    { id: 'about', sectionId: 'about', label: lang === 'kn' ? 'ನಮ್ಮ ಬಗ್ಗೆ' : 'About Us' },
    { id: 'journey', sectionId: 'journey', label: lang === 'kn' ? 'ನಮ್ಮ ಪಯಣ' : 'Our Journey' },
    { id: 'vision', sectionId: 'vision', label: lang === 'kn' ? 'ನಮ್ಮ ದೃಷ್ಟಿ' : 'Our Vision' },
    { id: 'mission', sectionId: 'mission', label: lang === 'kn' ? 'ನಮ್ಮ ಧ್ಯೇಯ' : 'Our Mission' },
    { id: 'events', sectionId: 'events', label: lang === 'kn' ? 'ಕಾರ್ಯಕ್ರಮಗಳು' : 'Events & Activities' },
    { id: 'membership', sectionId: 'membership', label: lang === 'kn' ? 'ಸದಸ್ಯತ್ವ' : 'Membership' },
    { id: 'team', sectionId: 'team', label: lang === 'kn' ? 'ಸದಸ್ಯರು ಮತ್ತು ಪದಾಧಿಕಾರಿಗಳು' : 'Members & Office Bearers' },
    { id: 'contact', sectionId: 'contact', label: lang === 'kn' ? 'ಸಂಪರ್ಕಿಸಿ' : 'Contact Us' }
  ];

  const scrollToSection = (sectionId: string) => {
    setMobileMenuOpen(false);
    if (activeTab !== 'home') {
      setActiveTab('home');
      setTimeout(() => {
        const targetEl = document.getElementById(sectionId);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      const targetEl = document.getElementById(sectionId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

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

      {/* 1. TOP NAVIGATION HEADER */}
      <header
        className={`sticky top-0 z-40 border-b-2 border-red-600 shadow-xs backdrop-blur-md transition-colors ${
          isDark ? 'bg-stone-900/95 text-stone-100' : 'bg-white/95 text-stone-900'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4 relative">
          {/* Brand Logo & Name */}
          <div
            onClick={() => scrollToSection('home')}
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

          {/* Header Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Language Switcher Button (Shows 'English' when Kannada displayed, 'ಕನ್ನಡ' when English displayed) */}
            <button
              onClick={toggleLanguage}
              className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer font-black text-xs flex items-center gap-1.5 shadow-xs ${
                lang === 'kn'
                  ? 'bg-red-600 text-yellow-300 border-yellow-400 hover:bg-red-700'
                  : 'bg-yellow-400 text-stone-950 border-amber-500 hover:bg-yellow-300'
              }`}
              title={lang === 'kn' ? 'Switch view to English' : 'ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಿ'}
            >
              <Globe className="w-3.5 h-3.5 shrink-0" />
              <span>{lang === 'kn' ? 'English' : 'ಕನ್ನಡ'}</span>
            </button>

            {/* Theme Toggle */}
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

            {/* Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`px-3.5 py-2 rounded-xl border transition-all cursor-pointer font-bold text-xs flex items-center gap-2 shadow-xs ${
                mobileMenuOpen
                  ? 'bg-red-600 text-yellow-300 border-yellow-400'
                  : isDark
                  ? 'bg-stone-800 border-stone-700 text-stone-100 hover:bg-stone-700 hover:text-yellow-300'
                  : 'bg-red-600 text-yellow-300 border-yellow-400 hover:bg-red-700'
              }`}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              <span>{lang === 'kn' ? 'ಮೆನು' : 'Menu'}</span>
            </button>
          </div>

          {/* Relative Overlay Navigation Dropdown */}
          {mobileMenuOpen && (
            <>
              {/* Backdrop listener to close when clicking outside */}
              <div
                className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40 backdrop-blur-[1px]"
                onClick={() => setMobileMenuOpen(false)}
              />

              <div className="absolute right-4 sm:right-6 top-full mt-2 z-50 w-72 sm:w-80 rounded-3xl border-2 border-red-600 bg-white dark:bg-stone-900 p-4 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between px-2 pb-2.5 border-b border-stone-200 dark:border-stone-800 text-[11px] font-bold text-red-600 dark:text-yellow-400 uppercase tracking-wider">
                  <span>{lang === 'kn' ? 'ಪರಿವಿಡಿ ಮೆನು' : 'Navigation Menu'}</span>
                  <span>ಕನ್ನಡಿಗರ ಬಳಗ</span>
                </div>
                <ul className="mt-2 space-y-1">
                  {navLinks.map((link) => (
                    <li key={link.id}>
                      <button
                        onClick={() => scrollToSection(link.sectionId)}
                        className={`w-full py-2.5 px-3.5 rounded-xl text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                          isDark
                            ? 'text-stone-200 hover:bg-stone-800 hover:text-yellow-300'
                            : 'text-stone-800 hover:bg-amber-50 hover:text-red-700'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-600" />
                          {link.label}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </header>

      {/* 2. MAIN BODY SINGLE CONTINUOUS PAGE */}
      <main className="flex-1">
        {activeTab === 'event-detail' ? (
          <BalagaEventDetailView
            event={selectedEvent}
            userRole={userRole}
            userProfile={userProfile}
            isAdmin={isAdmin}
            isMember={userRole === 'member' || userRole === 'admin' || userRole === 'read_only'}
            onBackToEvents={() => scrollToSection('events')}
            onOpenContribute={() => {}}
            onOpenVolunteer={() => window.open(formLinks.volunteerFormUrl, '_blank', 'noopener,noreferrer')}
            onOpenNominate={() => window.open(formLinks.nominationFormUrl, '_blank', 'noopener,noreferrer')}
            onNavigateToFinancialStatement={onNavigateToGaneshotsava}
            isDark={isDark}
          />
        ) : (
          <div className="space-y-16 sm:space-y-24 py-8 sm:py-12">
            
            {/* SECTION 1: HOME (#home) */}
            <section id="home" className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10 scroll-mt-24">
              
              {/* 1. AUTO-MOVABLE ANNOUNCEMENTS BANNER (AUTO-LOOPING TICKER CAROUSEL) */}
              {announcementsList.length > 0 && (
                <div
                  className={`relative rounded-3xl p-4 sm:p-5 border-2 shadow-sm transition-all overflow-hidden ${
                    isDark
                      ? 'bg-gradient-to-r from-red-950/70 via-stone-900 to-amber-950/50 border-red-800'
                      : 'bg-gradient-to-r from-red-50 via-[#FFFDF7] to-amber-50 border-red-500/50'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-10 h-10 rounded-2xl bg-red-600 text-yellow-300 flex items-center justify-center border-2 border-yellow-400 font-bold shadow-xs shrink-0 animate-pulse">
                        <Megaphone className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-red-600 text-yellow-300 px-2 py-0.5 rounded">
                          {lang === 'kn' ? 'ಅಧಿಕೃತ ಪ್ರಕಟಣೆ' : 'Official Notice'}
                        </span>
                        <h4 className="text-xs text-stone-500 font-semibold mt-0.5">
                          {lang === 'kn' ? 'ಬಳಗದ ಇತ್ತೀಚಿನ ಸುದ್ದಿಗಳು' : 'Latest Balaga Announcements'}
                        </h4>
                      </div>
                    </div>

                    {/* Auto-scrolling Announcement Content */}
                    <div
                      onClick={() => setSelectedAnnouncement(announcementsList[announcementIndex])}
                      className="flex-1 cursor-pointer group px-2 py-1"
                    >
                      <div className="flex items-center gap-2">
                        {announcementsList[announcementIndex].important && (
                          <span className="text-[10px] font-extrabold uppercase bg-amber-500 text-stone-950 px-2 py-0.5 rounded shrink-0">
                            {lang === 'kn' ? 'ಪ್ರಮುಖ' : 'Urgent'}
                          </span>
                        )}
                        <h3 className="font-serif font-black text-sm sm:text-base text-stone-900 dark:text-stone-100 group-hover:text-red-600 line-clamp-1">
                          {lang === 'kn'
                            ? (announcementsList[announcementIndex].kannadaTitle || announcementsList[announcementIndex].title)
                            : announcementsList[announcementIndex].title}
                        </h3>
                      </div>
                      <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-1 mt-0.5 font-medium">
                        {announcementsList[announcementIndex].summary || announcementsList[announcementIndex].content}
                      </p>
                    </div>

                    {/* Carousel Controls & Indicator */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() =>
                          setAnnouncementIndex(
                            (prev) => (prev - 1 + announcementsList.length) % announcementsList.length
                          )
                        }
                        className="p-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 cursor-pointer"
                        title={lang === 'kn' ? 'ಹಿಂದಿನ ಪ್ರಕಟಣೆ' : 'Previous notice'}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <span className="text-[11px] font-mono font-bold text-stone-500 px-1">
                        {announcementIndex + 1}/{announcementsList.length}
                      </span>

                      <button
                        onClick={() =>
                          setAnnouncementIndex((prev) => (prev + 1) % announcementsList.length)
                        }
                        className="p-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 cursor-pointer"
                        title={lang === 'kn' ? 'ಮುಂದಿನ ಪ್ರಕಟಣೆ' : 'Next notice'}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setSelectedAnnouncement(announcementsList[announcementIndex])}
                        className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-yellow-300 font-bold text-xs shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1 border border-yellow-400"
                      >
                        <span>{lang === 'kn' ? 'ಓದಿ' : 'Read'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. HERO CONTENT & YOUTUBE VIDEO SIDE-BY-SIDE RESPONSIVE GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Column: Hero Text + Visible Brand Image Card */}
                <div
                  className={`lg:col-span-7 rounded-3xl p-6 sm:p-10 border-2 shadow-sm flex flex-col justify-between space-y-6 ${
                    isDark
                      ? 'bg-gradient-to-br from-stone-900 via-stone-900 to-red-950/40 border-stone-800'
                      : 'bg-gradient-to-br from-white via-[#FFFDF7] to-amber-50/60 border-stone-200'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Decorative bar */}
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-10 bg-red-600 rounded-full" />
                      <div className="h-2 w-10 bg-yellow-400 rounded-full" />
                      <div className="h-2 w-4 bg-red-600 rounded-full" />
                    </div>

                    <div className="inline-flex items-center gap-2 bg-red-600 text-yellow-300 text-[11px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-xs border border-yellow-400">
                      <Flag className="w-3.5 h-3.5" />
                      <span>{lang === 'kn' ? 'ಸಿರಿಗನ್ನಡಂ ಗೆಲ್ಗೆ! ಸಿರಿಗನ್ನಡಂ ಬಾಳ್ಗೆ!' : 'SiriGannadam Gelge! SiriGannadam Baalge!'}</span>
                    </div>

                    <div>
                      <h1
                        className={`text-3xl sm:text-4xl lg:text-5xl font-serif font-black tracking-tight leading-tight ${
                          isDark ? 'text-stone-100' : 'text-stone-950'
                        }`}
                      >
                        {lang === 'kn' ? 'ಎಲ್ ಡೊರಾಡೊ ಕನ್ನಡಿಗರ ಬಳಗ' : 'EL DORADO KANNADIGARA BALAGA'}
                      </h1>
                      <span className="text-base sm:text-lg font-serif font-bold text-red-700 dark:text-yellow-400 block mt-1.5">
                        {lang === 'kn'
                          ? 'ಬ್ರಿಗೇಡ್ ಎಲ್ ಡೊರಾಡೊ • ಸಾಂಸ್ಕೃತಿಕ ಮತ್ತು ಸಾಮಾಜಿಕ ಸಂಸ್ಥೆ'
                          : 'Brigade El Dorado • Registered Cultural & Social Association'}
                      </span>
                    </div>

                    <p className={`text-sm sm:text-base leading-relaxed font-medium ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
                      {lang === 'kn'
                        ? 'ಬ್ರಿಗೇಡ್ ಎಲ್ ಡೊರಾಡೊ ಅಪಾರ್ಟ್‌ಮೆಂಟ್ ಸಮುದಾಯದಲ್ಲಿ ನೆಲೆಸಿರುವ ಕನ್ನಡ ಭಾಷೆ, ಕರ್ನಾಟಕದ ಸಂಸ್ಕೃತಿ ಮತ್ತು ಪರಂಪರೆಯನ್ನು ಪ್ರೀತಿಸುವ ನಿವಾಸಿಗಳನ್ನು ಒಗ್ಗೂಡಿಸುವ ಸಾಂಸ್ಕೃತಿಕ ಹಾಗೂ ಸಾಮಾಜಿಕ ವೇದಿಕೆ.'
                        : 'El Dorado Kannadigara Balaga is a cultural and social organisation established with the vision of bringing together residents of Brigade El Dorado under a common platform.'}
                    </p>

                    {/* VISIBLE BRAND IMAGE CARD */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950 via-stone-900 to-red-950 border-2 border-yellow-400/80 shadow-md flex items-center gap-4">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 border-yellow-400 shrink-0 bg-stone-950 shadow-inner">
                        <img
                          src="/bhuvaneshwari_kannada_flag.jpg"
                          alt="Goddess Bhuvaneshwari Devi & Karnataka Flag"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="space-y-1 text-white">
                        <h4 className="text-xs sm:text-sm font-serif font-black text-yellow-300">
                          {lang === 'kn' ? 'ಶ್ರೀ ಭುವನೇಶ್ವರಿ ದೇವಿ ಹಾಗೂ ಕನ್ನಡ ಧ್ವಜ' : 'Goddess Bhuvaneshwari & Karnataka Flag'}
                        </h4>
                        <p className="text-[11px] sm:text-xs text-stone-300 leading-snug">
                          {lang === 'kn'
                            ? 'ಕರ್ನಾಟಕದ ಪರಂಪರೆ ಹಾಗೂ ನಮ್ಮ ಸಮುದಾಯದ ಕನ್ನಡಿಗರ ಒಗ್ಗಟ್ಟಿನ ಪವಿತ್ರ ಸಂಕೇತ'
                            : 'Sacred symbol of Karnataka cultural heritage & Kannadiga unity'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* CTA Buttons */}
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => scrollToSection('events')}
                      className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-yellow-300 font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer inline-flex items-center gap-2 border border-yellow-400 active:scale-95"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>{lang === 'kn' ? 'ಕಾರ್ಯಕ್ರಮಗಳು' : 'Events'}</span>
                    </button>

                    <button
                      onClick={() => scrollToSection('membership')}
                      className="px-4 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-stone-950 font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer inline-flex items-center gap-2"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>{lang === 'kn' ? 'ಸದಸ್ಯತ್ವ ನೋಂದಣಿ' : 'Membership'}</span>
                    </button>

                    <button
                      onClick={() => scrollToSection('about')}
                      className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer inline-flex items-center gap-2 border ${
                        isDark
                          ? 'bg-stone-800 hover:bg-stone-700 border-stone-700 text-white'
                          : 'bg-white hover:bg-stone-50 border-stone-300 text-stone-800'
                      }`}
                    >
                      <Info className="w-4 h-4 text-red-600" />
                      <span>{lang === 'kn' ? 'ನಮ್ಮ ಬಗ್ಗೆ' : 'About Us'}</span>
                    </button>
                  </div>
                </div>

                {/* Right Column: Configurable YouTube Video Side-by-Side (Compact & Fitted) */}
                <div
                  className={`lg:col-span-5 w-full self-start max-w-lg mx-auto lg:mx-0 rounded-3xl p-5 sm:p-6 border-2 shadow-md flex flex-col space-y-4 ${
                    isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-[#D4AF37]/50'
                  }`}
                >
                  <div className="flex items-center gap-3 border-b border-stone-200 dark:border-stone-800 pb-3">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-red-600 text-yellow-300 flex items-center justify-center border border-yellow-400 font-bold text-xs shadow-xs shrink-0">
                      ▶
                    </div>
                    <div>
                      <h3 className="font-serif font-black text-base sm:text-lg text-stone-900 dark:text-stone-100">
                        {lang === 'kn' ? 'ಬಳಗದ ಸಾಂಸ್ಕೃತಿಕ ವಿಡಿಯೋ' : 'Balaga Cultural Spotlight'}
                      </h3>
                      <p className="text-[11px] text-stone-500">
                        {lang === 'kn' ? 'ಬ್ರಿಗೇಡ್ ಎಲ್ ಡೊರಾಡೊ ಆಚರಣೆಗಳ ವಿಶೇಷ ನೋಟ' : 'Watch highlights of Balaga celebrations'}
                      </p>
                    </div>
                  </div>

                  <div className="relative w-full aspect-video rounded-2xl overflow-hidden border-2 border-red-600/40 shadow-lg bg-black">
                    <iframe
                      src={extractYouTubeEmbedUrl(formLinks.homeYoutubeUrl)}
                      title="YouTube video player"
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                  </div>
                </div>
              </div>

              {/* 3. UPCOMING EVENT HIGHLIGHT BANNER */}
              {targetUpcomingEvent && (
                <div
                  className={`rounded-3xl border-2 p-6 sm:p-8 shadow-sm transition-all ${
                    isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                  }`}
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-3 max-w-2xl">
                      <div className="inline-flex items-center gap-2 bg-red-600 text-yellow-300 text-[11px] font-bold uppercase px-3 py-1 rounded-full border border-yellow-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{lang === 'kn' ? 'ಮುಂದಿನ ಮುಖ್ಯ ಉತ್ಸವ' : 'Next Major Celebration'}</span>
                      </div>

                      <div>
                        <h3 className="text-2xl sm:text-3xl font-serif font-black text-red-700 dark:text-yellow-400">
                          {lang === 'kn'
                            ? (targetUpcomingEvent.kannadaTitle || targetUpcomingEvent.title)
                            : targetUpcomingEvent.title}
                        </h3>
                        <span className="text-xs font-serif font-bold text-amber-700 dark:text-yellow-300 block mt-1">
                          {targetUpcomingEvent.dateDisplay || targetUpcomingEvent.startDate}
                        </span>
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
                          {lang === 'kn' ? 'ಉತ್ಸವಕ್ಕೆ ದಿನಗಳ ಲೆಕ್ಕಾಚಾರ' : 'Countdown to Event'}
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
                        onClick={() => scrollToSection('events')}
                        className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-yellow-300 font-bold text-xs shadow-xs transition-colors cursor-pointer inline-flex items-center gap-2 w-full justify-center"
                      >
                        <span>{lang === 'kn' ? 'ಕಾರ್ಯಕ್ರಮ ವಿವರಗಳು' : 'View Event Details'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </section>

            {/* SECTIONS 2, 3, 4, 5: ABOUT US, OUR JOURNEY, OUR VISION, OUR MISSION & COMMITMENT */}
            <BalagaAboutUsView
              isDark={isDark}
              lang={lang}
              onNavigateTab={(tab, secId) => scrollToSection(secId || tab)}
            />

            {/* SECTION 6: EVENTS & ACTIVITIES (#events) */}
            <section id="events" className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12 scroll-mt-24">
              <div className="text-center max-w-3xl mx-auto space-y-3">
                <div className="inline-flex items-center gap-2 bg-red-600 text-yellow-300 text-[11px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full border border-yellow-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{lang === 'kn' ? 'ಕಾರ್ಯಕ್ರಮಗಳು' : 'Events & Activities'}</span>
                </div>
                <h2 className="text-3xl sm:text-5xl font-serif font-black tracking-tight text-stone-900 dark:text-stone-100">
                  {lang === 'kn' ? 'ಕಾರ್ಯಕ್ರಮಗಳು ಮತ್ತು ಉತ್ಸವಗಳು' : 'Celebrations & Cultural Events'}
                </h2>
                <p className={`text-base leading-relaxed font-medium ${isDark ? 'text-stone-200' : 'text-stone-700'}`}>
                  {lang === 'kn'
                    ? 'ಬ್ರಿಗೇಡ್ ಎಲ್ ಡೊರಾಡೊದಲ್ಲಿ ಕನ್ನಡಿಗರ ಬಳಗ ಆಯೋಜಿಸುವ ವಾರ್ಷಿಕ ಮಹೋತ್ಸವಗಳು ಹಾಗೂ ಸಾಂಸ್ಕೃತಿಕ ಚಟುವಟಿಕೆಗಳು.'
                    : 'Annual cultural statehood festivals, Sri Ganeshotsava, and community welfare initiatives.'}
                </p>
              </div>

              {/* Featured Upcoming Event Details Card */}
              <div
                className={`p-6 sm:p-10 rounded-3xl border-2 space-y-6 shadow-md ${
                  isDark ? 'bg-stone-900 border-red-600' : 'bg-white border-red-600'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b pb-6 border-stone-200 dark:border-stone-800">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 bg-red-600 text-yellow-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                      <span>{lang === 'kn' ? 'ಮುಂಬರುವ ಮುಖ್ಯಾಂಶ' : 'Featured Upcoming Event'}</span>
                    </div>
                    <h3 className="text-3xl font-serif font-black text-red-700 dark:text-red-400">
                      Karnataka Rajyotsava 2026
                    </h3>
                    <span className="text-base font-serif font-bold text-amber-700 dark:text-yellow-400 block">
                      ಕನ್ನಡ ರಾಜ್ಯೋತ್ಸವ ೨૦೨೬ — ಸಿರಿಗನ್ನಡಂ ಗೆಲ್ಗೆ!
                    </span>
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
                ) : null}

                {/* Event Registration Actions */}
                <div className="pt-4 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => window.open(formLinks.volunteerFormUrl, '_blank', 'noopener,noreferrer')}
                    className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-yellow-300 font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer inline-flex items-center gap-2 border border-yellow-400"
                  >
                    <Users className="w-4 h-4" />
                    <span>{lang === 'kn' ? 'ಸ್ವಯಂಸೇವಕರಾಗಿ ನೋಂದಾಯಿಸಿ' : 'Volunteer for Event'}</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
                  </button>

                  <button
                    onClick={() => window.open(formLinks.nominationFormUrl, '_blank', 'noopener,noreferrer')}
                    className="px-5 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-stone-950 font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer inline-flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-stone-950" />
                    <span>{lang === 'kn' ? 'ಸಾಂಸ್ಕೃತಿಕ ಪ್ರದರ್ಶನ ನೋಂದಣಿ' : 'Nominate Stage Performance'}</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-0.5 text-stone-950" />
                  </button>
                </div>
              </div>

              {/* Concluded Celebrations Archive (Stacked Auto-Looping Card Carousel) */}
              <div className="space-y-6 pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 bg-red-600 text-yellow-300 text-[11px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full border border-yellow-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{lang === 'kn' ? 'ಕಳೆದ ವೈಭವದ ಉತ್ಸವಗಳು' : 'Concluded Celebrations'}</span>
                    </div>
                    <h3 className="text-2xl font-serif font-black text-stone-900 dark:text-stone-100">
                      {lang === 'kn' ? 'ಕಳೆದ ಆಚರಣೆಗಳ ಸಂಗ್ರಹ' : 'Concluded Celebrations Archive'}
                    </h3>
                  </div>

                  {pastEvents.length > 1 && (
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        onClick={() =>
                          setPastEventIndex((prev) => (prev - 1 + pastEvents.length) % pastEvents.length)
                        }
                        className="p-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 cursor-pointer shadow-xs"
                        title={lang === 'kn' ? 'ಹಿಂದಿನ ಆಚರಣೆ' : 'Previous celebration'}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-mono font-bold text-stone-500 px-2">
                        {pastEventIndex + 1} / {pastEvents.length}
                      </span>
                      <button
                        onClick={() =>
                          setPastEventIndex((prev) => (prev + 1) % pastEvents.length)
                        }
                        className="p-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 cursor-pointer shadow-xs"
                        title={lang === 'kn' ? 'ಮುಂದಿನ ಆಚರಣೆ' : 'Next celebration'}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {pastEvents.length === 0 ? (
                  <div className="p-8 text-center rounded-3xl border border-dashed border-stone-300 dark:border-stone-800 text-stone-500 text-xs">
                    {lang === 'kn' ? 'ಯಾವುದೇ ಕಳೆದ ಆಚರಣೆಗಳು ಲಭ್ಯವಿಲ್ಲ.' : 'No past celebrations available.'}
                  </div>
                ) : (
                  <div className="relative pt-2 pb-4">
                    {/* Visual Stack Background Layer */}
                    {pastEvents.length > 1 && (
                      <div
                        className={`absolute inset-x-3 top-5 rounded-3xl border-2 p-6 opacity-40 scale-[0.97] transition-all transform translate-y-3 pointer-events-none select-none z-0 ${
                          isDark ? 'bg-stone-900 border-stone-800' : 'bg-amber-50/60 border-amber-200'
                        }`}
                      >
                        <div className="space-y-2 opacity-50">
                          <span className="text-xs font-bold uppercase">
                            {pastEvents[(pastEventIndex + 1) % pastEvents.length].festival}
                          </span>
                          <h4 className="text-xl font-bold">
                            {lang === 'kn'
                              ? (pastEvents[(pastEventIndex + 1) % pastEvents.length].kannadaTitle || pastEvents[(pastEventIndex + 1) % pastEvents.length].title)
                              : pastEvents[(pastEventIndex + 1) % pastEvents.length].title}
                          </h4>
                        </div>
                      </div>
                    )}

                    {/* Primary Active Card */}
                    <div
                      key={pastEvents[pastEventIndex].id}
                      className={`relative z-10 p-6 sm:p-8 rounded-3xl border-2 space-y-5 shadow-lg transition-all transform duration-300 ${
                        isDark ? 'bg-stone-900 border-red-600/80' : 'bg-white border-red-600/70'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider bg-red-600 text-yellow-300 px-3 py-1 rounded-full border border-yellow-400">
                            {pastEvents[pastEventIndex].festival} • {pastEvents[pastEventIndex].year}
                          </span>
                          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{lang === 'kn' ? 'ಸಂಪನ್ನಗೊಂಡಿದೆ' : 'Concluded'}</span>
                          </span>
                        </div>

                        <div>
                          <h3 className="text-2xl sm:text-3xl font-serif font-black text-stone-900 dark:text-stone-100">
                            {lang === 'kn'
                              ? (pastEvents[pastEventIndex].kannadaTitle || pastEvents[pastEventIndex].title)
                              : pastEvents[pastEventIndex].title}
                          </h3>
                          {pastEvents[pastEventIndex].venue && (
                            <span className="text-xs font-semibold text-stone-500 block mt-1 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
                              <span>{pastEvents[pastEventIndex].venue}</span>
                            </span>
                          )}
                        </div>

                        <p className={`text-xs sm:text-sm leading-relaxed font-medium ${isDark ? 'text-stone-200' : 'text-stone-700'}`}>
                          {pastEvents[pastEventIndex].description}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-4">
                        <div className="text-xs font-bold text-stone-500 flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-red-600" />
                          <span>{pastEvents[pastEventIndex].dateDisplay}</span>
                        </div>

                        <button
                          onClick={() => handleNavigateTab('event-detail', pastEvents[pastEventIndex].id)}
                          className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-yellow-300 font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-2 shadow-sm border border-yellow-400"
                        >
                          <span>{lang === 'kn' ? 'ವಿವರಗಳನ್ನು ನೋಡಿ' : 'View Highlights'}</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

                {/* Photo Gallery (Saved in Database) */}
                <div className="space-y-4 pt-6">
                  <h4 className="text-xl font-serif font-black text-stone-900 dark:text-stone-100">
                    {lang === 'kn' ? 'ವೈಭವ ಫೋಟೋ ಗ್ಯಾಲರಿ' : 'Vaibhava Photo Gallery'}
                  </h4>

                  {photosList.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl border border-dashed border-stone-300 dark:border-stone-800 text-stone-500 text-xs">
                      {lang === 'kn'
                        ? 'ಸದ್ಯಕ್ಕೆ ಯಾವುದೇ ಫೋಟೋಗಳಿಲ್ಲ.'
                        : 'No gallery photos available yet.'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {photosList.map((photo) => (
                        <div
                          key={photo.id}
                          onClick={() => setLightboxPhoto(photo)}
                          className="group rounded-2xl border overflow-hidden cursor-pointer aspect-[4/3] relative bg-stone-950 shadow-xs hover:shadow-md transition-all"
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
                  )}
                </div>
              </section>

            {/* SECTION 7: MEMBERSHIP (#membership) */}
            <section id="membership" className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8 scroll-mt-24">
              <div className="text-center max-w-3xl mx-auto space-y-3">
                <div className="inline-flex items-center gap-2 bg-red-600 text-yellow-300 text-[11px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full border border-yellow-400">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{lang === 'kn' ? 'ಸದಸ್ಯತ್ವ ನೋಂದಣಿ' : 'Membership Registration'}</span>
                </div>
                <h2 className="text-3xl sm:text-5xl font-serif font-black tracking-tight text-stone-900 dark:text-stone-100">
                  {lang === 'kn' ? 'ಸದಸ್ಯತ್ವ ನೋಂದಣಿ ಪ್ರಾರಂಭ' : 'Membership Registration Open'}
                </h2>
              </div>

              <div
                className={`p-6 sm:p-10 rounded-3xl border-2 space-y-8 shadow-md ${
                  isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                }`}
              >
                {/* Salutation & Welcome */}
                <div className="space-y-3">
                  <h3 className="text-xl sm:text-2xl font-serif font-bold text-red-600 dark:text-yellow-400">
                    {lang === 'kn' ? 'ಆತ್ಮೀಯ ಬ್ರಿಗೇಡ್ ಎಲ್ ಡೊರಾಡೊ ನಿವಾಸಿಗಳೇ,' : 'Dear Brigade El Dorado Residents,'}
                  </h3>
                  <p className="text-sm sm:text-base font-semibold leading-relaxed">
                    {lang === 'kn'
                      ? 'ಎಲ್ ಡೊರಾಡೊ ಕನ್ನಡಿಗರ ಬಳಗದ ಅಧಿಕೃತ ಸದಸ್ಯತ್ವ ನೋಂದಣಿ ಪ್ರಾರಂಭವಾಗಿದೆ!'
                      : 'We are happy to announce that Membership Registration for El Dorado Kannadigara Balaga is now open!'}
                  </p>
                  <p className={`text-xs sm:text-sm leading-relaxed font-medium ${isDark ? 'text-stone-200' : 'text-stone-700'}`}>
                    {lang === 'kn'
                      ? 'ನಮ್ಮ ಭಾಷೆ, ಸಂಸ್ಕೃತಿ ಮತ್ತು ಸೌಹಾರ್ದತೆಯನ್ನು ಒಟ್ಟಾಗಿ ಸಂಭ್ರಮಿಸಲು ಬ್ರಿಗೇಡ್ ಎಲ್ ಡೊರಾಡೊದ ಪ್ರತಿಯೊಂದು ಕನ್ನಡಿಗ ಕುಟುಂಬವನ್ನು ಬಳಗದ ಸದಸ್ಯರಾಗಲು ಹೃತ್ಪೂರ್ವಕವಾಗಿ ಆಹ್ವಾನಿಸುತ್ತೇವೆ.'
                      : 'We warmly invite all resident families of Brigade El Dorado to become members and join hands in promoting our Kannada language, culture, traditions and community bonding.'}
                  </p>
                </div>

                {/* Membership Fees */}
                <div className="p-5 rounded-2xl bg-amber-50 dark:bg-stone-800/80 border-2 border-amber-300 dark:border-stone-700 space-y-3">
                  <div className="flex items-center gap-2 text-base font-serif font-bold text-amber-900 dark:text-yellow-300">
                    <BadgeIndianRupee className="w-5 h-5 text-red-600" />
                    <h4>💰 {lang === 'kn' ? 'ಸದಸ್ಯತ್ವ ಶುಲ್ಕ ವಿವರ' : 'Membership Fees'}</h4>
                  </div>
                  <ul className="space-y-2 text-xs sm:text-sm text-stone-800 dark:text-stone-200 font-semibold">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
                      <span>{lang === 'kn' ? 'ಮೂಲ ಸದಸ್ಯತ್ವ:' : 'Primary Member:'} <strong className="text-red-600 dark:text-yellow-300">₹999</strong></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
                      <span>{lang === 'kn' ? 'ಹೆಚ್ಚುವರಿ ಕುಟುಂಬದ ಸದಸ್ಯ (೧೮ ವರ್ಷ ಮೇಲ್ಪಟ್ಟವರು):' : 'Additional Family Member (above 18 years):'} <strong className="text-red-600 dark:text-yellow-300">₹749</strong> {lang === 'kn' ? 'ಪ್ರತಿ ಸದಸ್ಯರಿಗೆ.' : 'per member.'}</span>
                    </li>
                  </ul>
                </div>

                {/* How to Register & CTA Link */}
                <div className="p-6 sm:p-8 rounded-2xl bg-red-50 dark:bg-red-950/40 border-2 border-red-600 text-center space-y-4">
                  <div className="space-y-1">
                    <h4 className="font-serif font-bold text-base sm:text-lg text-red-700 dark:text-yellow-300 flex items-center justify-center gap-2">
                      <span>📝 {lang === 'kn' ? 'ನೋಂದಣಿ ಹೇಗೆ ಮಾಡುವುದು?' : 'How to Register?'}</span>
                    </h4>
                    <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 max-w-lg mx-auto">
                      {lang === 'kn'
                        ? 'ಕೆಳಗಿನ ಬಟನ್ ಕ್ಲಿಕ್ ಮಾಡಿ ಗೂಗಲ್ ಫಾರ್ಮ್ ಅರ್ಜಿ ಭರ್ತಿ ಮಾಡಿ:'
                        : 'Click the button below to open and fill out the official online membership application Google Form:'}
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
                      <span>{lang === 'kn' ? 'ಸದಸ್ಯತ್ವ ನೋಂದಣಿ ಅರ್ಜಿ ಫಾರ್ಮ್ 📌' : 'Register Now – Membership Application Form 📌'}</span>
                      <ExternalLink className="w-4 h-4 ml-1" />
                    </a>
                  </div>
                </div>

                {/* Why Join Eldorado Kannadigara Balaga */}
                <div className="space-y-4 pt-4 border-t border-stone-100 dark:border-stone-800">
                  <div className="space-y-1">
                    <h4 className="font-serif font-black text-lg sm:text-xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
                      <Heart className="w-5 h-5 text-red-600 fill-red-600" />
                      <span>{lang === 'kn' ? 'ಏಕೆ ಎಲ್ ಡೊರಾಡೊ ಕನ್ನಡಿಗರ ಬಳಗ ಸೇರಬೇಕು?' : 'Why Join Eldorado Kannadigara Balaga?'}</span>
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl border bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700/60 space-y-1">
                      <div className="flex items-center gap-2 text-sm font-bold text-red-600 dark:text-yellow-300">
                        <Users className="w-4 h-4 text-red-600 shrink-0" />
                        <span>{lang === 'kn' ? 'ಬಾಂಧವ್ಯ ಮತ್ತು ಒಗ್ಗಟ್ಟು' : 'Connect & Grow Together'}</span>
                      </div>
                      <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-medium">
                        {lang === 'kn'
                          ? 'ನಿವಾಸಿಗಳನ್ನು ಭೇಟಿಯಾಗಿ, ಸ್ನೇಹ ಬೆಳೆಸಿ ಸಮುದಾಯದ ಬಾಂಧವ್ಯ ಗಟ್ಟಿಗೊಳಿಸಿ.'
                          : 'Meet neighbours, build friendships and create a stronger community.'}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl border bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700/60 space-y-1">
                      <div className="flex items-center gap-2 text-sm font-bold text-red-600 dark:text-yellow-300">
                        <Sparkles className="w-4 h-4 text-red-600 shrink-0" />
                        <span>{lang === 'kn' ? 'ಸಾಂಸ್ಕೃತಿಕ ಆಚರಣೆಗಳು' : 'Celebrate Karnataka'}</span>
                      </div>
                      <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-medium">
                        {lang === 'kn'
                          ? 'ನಮ್ಮ ಹಬ್ಬಗಳು, ನುಡಿ, ಸಾಹಿತ್ಯ, ಕಲೆ ಮತ್ತು ಸಾಂಪ್ರದಾಯಿಕ ವೈಭವವನ್ನು ಒಂದಾಗಿ ಸಂಭ್ರಮಿಸಿ.'
                          : 'Celebrate our festivals, language, food, art, traditions and culture together.'}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl border bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700/60 space-y-1">
                      <div className="flex items-center gap-2 text-sm font-bold text-red-600 dark:text-yellow-300">
                        <CheckCircle className="w-4 h-4 text-red-600 shrink-0" />
                        <span>{lang === 'kn' ? 'ಮಕ್ಕಳ ಸಾಂಸ್ಕೃತಿಕ ವಿಕಾಸ' : 'Engage Kids & Families'}</span>
                      </div>
                      <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-medium">
                        {lang === 'kn'
                          ? 'ಮಕ್ಕಳಿಗೆ ಸಾಂಸ್ಕೃತಿಕ ಕಾರ್ಯಕ್ರಮಗಳು, ಕ್ರೀಡೆಗಳು ಮತ್ತು ಕನ್ನಡ ಕಲಿಕೆ ಅವಕಾಶ.'
                          : 'Organize cultural programs, Kannada learning, sports, games and fun family activities.'}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl border bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700/60 space-y-1">
                      <div className="flex items-center gap-2 text-sm font-bold text-red-600 dark:text-yellow-300">
                        <Heart className="w-4 h-4 text-red-600 shrink-0" />
                        <span>{lang === 'kn' ? 'ಸಮಾಜ ಸೇವೆ ಮತ್ತು ನೆರವು' : 'Give Back to Society'}</span>
                      </div>
                      <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-medium">
                        {lang === 'kn'
                          ? 'ಸರ್ಕಾರಿ ಕನ್ನಡ ಶಾಲೆಗಳಿಗೆ ಶೈಕ್ಷಣಿಕ ನೆರವು ಹಾಗೂ ಅಗತ್ಯವುಳ್ಳವರಿಗೆ ಸಹಾಯ.'
                          : 'Support government schools, orphanages and people in need through volunteering and contributions.'}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl border bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700/60 space-y-1">
                      <div className="flex items-center gap-2 text-sm font-bold text-red-600 dark:text-yellow-300">
                        <ShieldCheck className="w-4 h-4 text-red-600 shrink-0" />
                        <span>{lang === 'kn' ? 'ಪರಿಸರ ಮತ್ತು ಆರೋಗ್ಯ' : 'Serve Our Community'}</span>
                      </div>
                      <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-medium">
                        {lang === 'kn'
                          ? 'ರಕ್ತದಾನ ಶಿಬಿರ, ಆರೋಗ್ಯ ತಪಾಸಣೆ, ಸ್ವಚ್ಛತೆ ಮತ್ತು ವೃಕ್ಷಾರೋಪಣ ಚಟುವಟಿಕೆಗಳು.'
                          : 'Organize blood donation, health camps, cleanliness drives, plantation and other social initiatives.'}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl border bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700/60 space-y-1">
                      <div className="flex items-center gap-2 text-sm font-bold text-red-600 dark:text-yellow-300">
                        <UserCheck className="w-4 h-4 text-red-600 shrink-0" />
                        <span>{lang === 'kn' ? 'ಸಕ್ರಿಯ ಭಾಗವಹಿಸುವಿಕೆ' : 'Participate & Contribute'}</span>
                      </div>
                      <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-medium">
                        {lang === 'kn'
                          ? 'ನಿಮ್ಮ ಕಲ್ಪನೆಗಳು, ಕೌಶಲಗಳು ಮತ್ತು ಸಮಯವನ್ನು ಹಂಚಿಕೊಂಡು ಸಮುದಾಯ ಬೆಳೆಸಿ.'
                          : 'Share your ideas, skills and time, volunteer for initiatives and make a positive difference together.'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-center font-serif font-black text-xs sm:text-sm text-red-700 dark:text-yellow-300 shadow-xs tracking-wide">
                    {lang === 'kn'
                      ? 'ಸಂಪರ್ಕ • ಆಚರಣೆ • ಕೊಡುಗೆ • ಸೇವೆ • ಜೊತೆಯಾಗಿ ಬೆಳೆಯೋಣ'
                      : 'Connect • Celebrate • Contribute • Serve • Grow Together'}
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 8: MEMBERS & OFFICE BEARERS (#team) */}
            <section id="team" className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10 scroll-mt-24">
              <div className="text-center max-w-3xl mx-auto space-y-3">
                <div className="inline-flex items-center gap-2 bg-red-600 text-yellow-300 text-[11px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full border border-yellow-400">
                  <Users className="w-3.5 h-3.5" />
                  <span>{lang === 'kn' ? 'ಸದಸ್ಯರು ಮತ್ತು ಪದಾಧಿಕಾರಿಗಳು' : 'Members & Office Bearers'}</span>
                </div>
                <h2 className="text-3xl sm:text-5xl font-serif font-black tracking-tight text-stone-900 dark:text-stone-100">
                  {lang === 'kn' ? 'ಸಂಸ್ಥೆಯ ಪದಾಧಿಕಾರಿಗಳು ಮತ್ತು ಕಾರ್ಯಾಚರಣೆ ಸಮಿತಿ' : 'Meet Our Team & Office Bearers'}
                </h2>
                <p className={`text-base leading-relaxed font-medium ${isDark ? 'text-stone-200' : 'text-stone-700'}`}>
                  {lang === 'kn'
                    ? 'ಬ್ರಿಗೇಡ್ ಎಲ್ ಡೊರಾಡೊ ಕನ್ನಡಿಗರ ಬಳಗದ ಸಕ್ರಿಯ ಪದಾಧಿಕಾರಿಗಳು ಮತ್ತು ನಿವಾಸಿ ನಾಯಕರು.'
                    : 'Dedicated resident volunteers guiding festival celebrations and community initiatives.'}
                </p>
              </div>

              {/* Committee Member Cards Grid */}
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
            </section>

            {/* SECTION 9: CONTACT US (#contact) */}
            <section id="contact" className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12 scroll-mt-24">
              <div className="text-center max-w-3xl mx-auto space-y-3">
                <div className="inline-flex items-center gap-2 bg-red-600 text-yellow-300 text-[11px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full border border-yellow-400">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{lang === 'kn' ? 'ಸಂಪರ್ಕಿಸಿ' : 'Contact Us'}</span>
                </div>
                <h2 className="text-3xl sm:text-5xl font-serif font-black tracking-tight text-stone-900 dark:text-stone-100">
                  {lang === 'kn' ? 'ಸಮಿತಿಯೊಂದಿಗೆ ಸಂಪರ್ಕದಲ್ಲಿರಿ' : 'Reach Out to the Committee'}
                </h2>
                <p className={`text-base leading-relaxed font-medium ${isDark ? 'text-stone-200' : 'text-stone-700'}`}>
                  {lang === 'kn'
                    ? 'ಕಾರ್ಯಕ್ರಮಗಳು, ಸದಸ್ಯತ್ವ ಅಥವಾ ಸ್ವಯಂಸೇವಕರ ಬಗ್ಗೆ ಸಂದೇಹಗಳಿದ್ದರೆ ಸಂಪರ್ಕಿಸಿ.'
                    : 'Have questions about celebrations or volunteering? Get in touch with us!'}
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
                    <h3 className="text-2xl font-serif font-black text-red-700 dark:text-yellow-400">
                      {lang === 'kn' ? 'ಸಂಪರ್ಕ ಪದಾಧಿಕಾರಿಗಳು' : 'Contact Representatives'}
                    </h3>
                    <p className="text-xs text-stone-500">
                      {lang === 'kn' ? 'ಎಲ್ ಡೊರಾಡೊ ಕನ್ನಡಿಗರ ಬಳಗ ಕಾರ್ಯಾಚರಣೆ ಸಮಿತಿ' : 'El Dorado Kannadigara Balaga Committee'}
                    </p>
                  </div>

                  <div className="space-y-4 text-xs sm:text-sm">
                    {/* Contact Persons Phone Numbers Grid */}
                    <div className="space-y-2.5 p-4 rounded-2xl bg-amber-50/70 dark:bg-stone-800/80 border border-amber-200 dark:border-stone-700">
                      <span className="font-bold block text-stone-800 dark:text-stone-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <Phone className="w-4 h-4 text-red-600" />
                        <span>{lang === 'kn' ? 'ಪದಾಧಿಕಾರಿಗಳ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಗಳು' : 'Contact Persons & Phone'}</span>
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        {[
                          { name: 'Yuvaraj', phone: '9741660828' },
                          { name: 'Mahesh', phone: '9945511992' },
                          { name: 'Santhosh', phone: '8050579923' },
                          { name: 'Rakesh', phone: '9900153813' }
                        ].map((person) => (
                          <a
                            key={person.name}
                            href={`tel:${person.phone}`}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 hover:border-red-600 transition-colors shadow-xs group"
                          >
                            <span className="font-serif font-bold text-stone-900 dark:text-stone-100">
                              {person.name}
                            </span>
                            <span className="font-mono text-xs font-bold text-red-600 dark:text-yellow-400 group-hover:underline">
                              {person.phone}
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>

                    {/* Official Email */}
                    <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
                      <Mail className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block text-stone-800 dark:text-stone-200">{lang === 'kn' ? 'ಅಧಿಕೃತ ಇಮೇಲ್' : 'Official Email'}</span>
                        <a
                          href="mailto:eldoradokannadigarabalaga@gmail.com"
                          className="text-stone-600 dark:text-stone-300 font-mono text-xs hover:text-red-600 hover:underline transition-colors block mt-0.5"
                        >
                          eldoradokannadigarabalaga@gmail.com
                        </a>
                      </div>
                    </div>

                    {/* Venue & Address */}
                    <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
                      <MapPin className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block text-stone-800 dark:text-stone-200">{lang === 'kn' ? 'ವಿಳಾಸ' : 'Venue & Address'}</span>
                        <p className="text-stone-600 dark:text-stone-300 text-xs mt-0.5 leading-relaxed">
                          Brigade El Dorado, Aerospace Park, Hunasamaranahalli, Bengaluru, Karnataka 562149
                        </p>
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
                      {lang === 'kn' ? 'ಸಂದೇಶ ಕಳುಹಿಸಿ' : 'Send Us a Message'}
                    </h3>
                    <p className="text-xs text-stone-500">
                      {lang === 'kn'
                        ? 'ಫಾರ್ಮ್ ಭರ್ತಿ ಮಾಡಿ, ಸಮಿತಿಯ ಪದಾಧಿಕಾರಿಗಳು ಶೀಘ್ರವೇ ಉತ್ತರಿಸುತ್ತಾರೆ.'
                        : 'Fill out the form below and an executive committee member will reply shortly.'}
                    </p>
                  </div>

                  {contactSubmitted ? (
                    <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-center space-y-3 animate-in fade-in">
                      <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
                      <h4 className="text-lg font-bold text-emerald-900 dark:text-emerald-100">
                        {lang === 'kn' ? 'ಸಂದೇಶ ತಲುಪಿದೆ!' : 'Message Received!'}
                      </h4>
                      <p className="text-xs text-emerald-700 dark:text-emerald-300">
                        {lang === 'kn'
                          ? `ನಿಮ್ಮ ಸಂದೇಶವನ್ನು ಸ್ವೀಕರಿಸಲಾಗಿದೆ, ಶೀಘ್ರವೇ ${contactForm.email} ಗೆ ಉತ್ತರಿಸಲಾಗುವುದು.`
                          : `Thank you for contacting Kannadigara Balaga. We have received your query and will respond to ${contactForm.email} shortly.`}
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleContactSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold uppercase mb-1 text-stone-700 dark:text-stone-300">
                          {lang === 'kn' ? 'ಪೂರ್ಣ ಹೆಸರು *' : 'Full Name *'}
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
                            {lang === 'kn' ? 'ಇಮೇಲ್ ವಿಳಾಸ *' : 'Email Address *'}
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
                            {lang === 'kn' ? 'ಟವರ್ ಮತ್ತು ಫ್ಲ್ಯಾಟ್ ಸಂಖ್ಯೆ' : 'Tower & Flat'}
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
                          {lang === 'kn' ? 'ವಿಷಯ' : 'Subject'}
                        </label>
                        <select
                          value={contactForm.subject}
                          onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-xs ${
                            isDark ? 'bg-stone-800 border-stone-700 text-white' : 'bg-stone-50 border-stone-300 text-stone-900'
                          }`}
                        >
                          <option value="General enquiry">{lang === 'kn' ? 'ಸಾಮಾನ್ಯ ವಿಚಾರಣೆ' : 'General enquiry'}</option>
                          <option value="Volunteering">{lang === 'kn' ? 'ಸ್ವಯಂಸೇವಕ ನೋಂದಣಿ' : 'Volunteering sign-up'}</option>
                          <option value="Cultural performance">{lang === 'kn' ? 'ಸಾಂಪ್ರದಾಯಿಕ ಪ್ರದರ್ಶನ' : 'Cultural performance nomination'}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase mb-1 text-stone-700 dark:text-stone-300">
                          {lang === 'kn' ? 'ಸಂದೇಶ *' : 'Message *'}
                        </label>
                        <textarea
                          required
                          rows={4}
                          placeholder={lang === 'kn' ? 'ನಿಮ್ಮ ಸಂದೇಶವನ್ನು ಇಲ್ಲಿ ಬರೆಯಿರಿ...' : 'Write your message here...'}
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
                        <span>{lang === 'kn' ? 'ಸಂದೇಶ ಕಳುಹಿಸಿ' : 'Send Message'}</span>
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </section>

          </div>
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
                    onClick={() => scrollToSection(link.sectionId)}
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
                  onClick={() => scrollToSection('events')}
                  className="hover:text-red-600 transition-colors cursor-pointer"
                >
                  Karnataka Rajyotsava 2026
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('events')}
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

        {/* Website Development & Liability Disclaimer */}
        <div className="border-t border-stone-200 dark:border-stone-800 px-4 py-6 bg-stone-50 dark:bg-stone-900/60">
          <div className="max-w-5xl mx-auto space-y-2 text-center text-stone-600 dark:text-stone-400 text-[11px] sm:text-xs leading-relaxed font-medium">
            <p className="font-bold text-stone-800 dark:text-stone-200">
              {lang === 'kn' ? 'ತಾಂತ್ರಿಕ ಕೊಡುಗೆ ಹಾಗೂ ಜವಾಬ್ದಾರಿ ಹಕ್ಕುತ್ಯಾಗ' : 'Website Development & Liability Disclaimer'}
            </p>
            <p>
              {lang === 'kn'
                ? 'ಈ ವೆಬ್‌ಸೈಟ್ ಅನ್ನು ಎಲ್ ಡೊರಾಡೊ ಕನ್ನಡಿಗರ ಬಳಗ ನೀಡಿದ ಮಾಹಿತಿಯಾಧಾರಿತವಾಗಿ ಸಚಿನ್ ದೇಸಾಯಿ ಅವರು ತಾಂತ್ರಿಕವಾಗಿ ಅಭಿವೃದ್ಧಿಪಡಿಸಿದ್ದಾರೆ. ಸಚಿನ್ ದೇಸಾಯಿ ಅವರು ತಾಂತ್ರಿಕ ಸಹಯೋಗಿಯಾಗಿದ್ದು, ಬಳಗದ ಪದಾಧಿಕಾರಿಯಾಗಿರುವುದಿಲ್ಲ. ಸದಸ್ಯತ್ವ, ನೋಂದಣಿ, ಹಣಕಾಸು ಪಾವತಿ ಮತ್ತು ಕಾರ್ಯಕ್ರಮಗಳಿಗೆ ಸಂಪೂರ್ಣವಾಗಿ ಎಲ್ ಡೊರಾಡೊ ಕನ್ನಡಿಗರ ಬಳಗವೇ ಜವಾಬ್ದಾರವಾಗಿರುತ್ತದೆ. ಪ್ರತಿಯೊಂದು ವಿಚಾರಣೆಗೂ ಬಳಗದ ಸಮಿತಿಯನ್ನು ನೇರವಾಗಿ ಸಂಪರ್ಕಿಸಿ.'
                : 'This website was developed by Sachin Desai based on requirements and inputs provided by El Dorado Kannadigara Balaga. Sachin Desai is a technical contributor and not an office-bearer, employee, or financial representative of the organisation. All membership, registration, payment transactions, confirmations, refunds, and activities remain the sole responsibility of El Dorado Kannadigara Balaga. Members are requested to contact the Balaga Committee directly for any assistance or inquiries.'}
            </p>
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
