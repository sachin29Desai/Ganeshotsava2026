import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  CreditCard,
  Coins,
  Settings,
  Share2,
  Lock,
  Unlock,
  CheckCircle2,
  Copy,
  AlertTriangle,
  QrCode,
  Sparkles,
  PhoneCall,
  RefreshCw,
  Save,
  LogOut,
  Crown,
  Briefcase,
  Users2,
  Users,
  Eye,
  ShieldCheck,
  Home,
  Loader2,
  Mail,
  Video,
  X
} from 'lucide-react';
import {
  Expense,
  Contribution,
  Sponsor,
  CommercialStall,
  SevaBooking,
  SevaCatalogueItem,
  HundiCollection,
  AuctionItem,
  AppSettings,
  AppState,
  UserRole,
  UserProfile
} from './types';
import {
  INITIAL_STATE,
  DEFAULT_SEVAS,
  fmt,
  fmtDate,
  today,
  numWords,
  sha256,
  getExpenseBalance,
  getExpenseActual,
  cleanOrgName,
  prepareExpenseForStorage
} from './utils/helpers';
import { generateStandaloneHTML } from './utils/htmlExporter';
import {
  auth,
  firebaseSignOut,
  initFirestoreSync,
  cloudSyncAllData,
  cloudSaveExpense,
  cloudDeleteExpense,
  cloudSaveContribution,
  cloudDeleteContribution,
  cloudSaveSponsor,
  cloudDeleteSponsor,
  cloudSaveCommercialStall,
  cloudDeleteCommercialStall,
  cloudSaveSeva,
  cloudDeleteSeva,
  cloudSaveSevaCatalogueItem,
  cloudDeleteSevaCatalogueItem,
  cloudSaveHundi,
  cloudDeleteHundi,
  cloudSaveAuction,
  cloudDeleteAuction,
  cloudSaveSettings,
  cloudSaveCounters,
  cloudBulkImportContributions,
  cloudClearAllData,
  fetchFreshDataFromServer,
  SyncStatus,
  loadLocalSnapshotBackup,
  saveLocalSnapshotBackup,
  isQuotaExceededError,
  isSignInWithEmailLink,
  signInWithEmailLink,
  getAdditionalUserInfo,
  cloudGetUserProfile,
  cloudSaveUserProfile,
  cloudGetAllUserProfiles
} from './lib/firebase';

import { StatementView } from './components/StatementView';
import { ExpenditureView } from './components/ExpenditureView';
import { DonationsView } from './components/DonationsView';
import { SponsorshipView } from './components/SponsorshipView';
import { CommercialStallsView } from './components/CommercialStallsView';
import { SevasView } from './components/SevasView';
import { HundiView } from './components/HundiView';
import { AuctionsView } from './components/AuctionsView';
import { SettingsView } from './components/SettingsView';
import { ReceiptInvoiceModal, PrintData } from './components/ReceiptInvoiceModal';
import { PublicReceiptPortal } from './components/PublicReceiptPortal';
import { CommitteeAuthGate } from './components/CommitteeAuthGate';
import { UserProfileOnboardingModal } from './components/UserProfileOnboardingModal';
import { CommunityHomeView } from './components/CommunityHomeView';
import { PublicSevaPortal } from './components/PublicSevaPortal';
import { AdminGateForBalaga } from './components/AdminGateForBalaga';
import { AdminAccessGate } from './components/AdminAccessGate';
import { AdminManagementModal } from './components/AdminManagementModal';
import { RequestDetailsModal } from './components/RequestDetailsModal';
import { GaneshaFestivalVideoShowcase } from './components/GaneshaFestivalVideoShowcase';
import {
  getReceiptDocumentTitle,
  getReceiptPdfFilename,
  downloadBlobAsFile,
  generateReceiptPdfBlob,
  triggerReceiptDirectPrint
} from './utils/pdfGenerator';

declare global {
  interface Window {
    __E__?: AppState;
    QRCode?: any;
    XLSX?: any;
    LZString?: any;
    showOpenFilePicker?: (options?: any) => Promise<FileSystemFileHandle[]>;
    showSaveFilePicker?: (options?: any) => Promise<FileSystemFileHandle>;
  }
}

export function App() {
  // Load resilient offline ledger backup so user data and public receipts are never empty
  const initialLocalState = loadLocalSnapshotBackup();

  // --- Live Application State (Cached first, continuously synchronized with Firestore) ---
  const [expenses, setExpenses] = useState<Expense[]>(() => window.__E__?.expenses || initialLocalState?.expenses || INITIAL_STATE.expenses);
  const [contributions, setContributions] = useState<Contribution[]>(() => window.__E__?.contributions || initialLocalState?.contributions || INITIAL_STATE.contributions);
  const [sponsors, setSponsors] = useState<Sponsor[]>(() => window.__E__?.sponsors || initialLocalState?.sponsors || INITIAL_STATE.sponsors || []);
  const [commercialStalls, setCommercialStalls] = useState<CommercialStall[]>(() => window.__E__?.commercialStalls || initialLocalState?.commercialStalls || INITIAL_STATE.commercialStalls || []);
  const [sevas, setSevas] = useState<SevaBooking[]>(() => window.__E__?.sevas || initialLocalState?.sevas || INITIAL_STATE.sevas || []);
  const [sevaCatalogue, setSevaCatalogue] = useState<SevaCatalogueItem[]>(() => window.__E__?.sevaCatalogue || initialLocalState?.sevaCatalogue || DEFAULT_SEVAS);
  const [hundi, setHundi] = useState<HundiCollection[]>(() => window.__E__?.hundi || initialLocalState?.hundi || []);
  const [auctions, setAuctions] = useState<AuctionItem[]>(() => window.__E__?.auctions || initialLocalState?.auctions || []);
  const [settings, setSettings] = useState<AppSettings>(() => window.__E__?.settings || initialLocalState?.settings || INITIAL_STATE.settings);

  // In-memory counters synced with Firestore metadata/counters
  const [counters, setCounters] = useState<{
    rc?: string | null;
    sp?: string | null;
    cs?: string | null;
    sv?: string | null;
    auc?: string | null;
  }>(() => window.__E__?.counters || initialLocalState?.counters || INITIAL_STATE.counters || {});
  const countersRef = useRef<{
    rc?: string | null;
    sp?: string | null;
    cs?: string | null;
    sv?: string | null;
    auc?: string | null;
  }>({});

  useEffect(() => {
    countersRef.current = counters;
  }, [counters]);

  // --- Active Tab Navigation ---
  // First Level: 'statement' | 'income' | 'expenditure' | 'settings'
  const [activeTab, setActiveTab] = useState<'statement' | 'income' | 'expenditure' | 'settings'>('statement');
  // Sub-level under 'income': 'donations' | 'sponsorship' | 'stalls' | 'sevas' | 'hundi' | 'auctions'
  const [activeIncomeSubTab, setActiveIncomeSubTab] = useState<'donations' | 'sponsorship' | 'stalls' | 'sevas' | 'hundi' | 'auctions'>('donations');

  // --- Community Routing Architecture ---
  // 'ganeshotsava': Sri Ganeshotsava 2026 Festival Portal (Default Landing Page '/')
  // 'homepageindevelop': Eldorado Kannadigara Balaga Celebrations Page ('/homepageindevelop' - Restricted to Admin)
  // 'receipts': Isolated Public Devotee Receipts Search & Download ('/ganeshotsava2026/receipts')
  // 'sevas': Isolated Public Devotee Seva Booking & Offerings Portal ('/ganeshotsava2026/sevas')
  type AppRoute = 'ganeshotsava' | 'homepageindevelop' | 'receipts' | 'sevas';

  const getInitialRoute = (): AppRoute => {
    if (typeof window === 'undefined') return 'ganeshotsava';
    const path = (window.location.pathname || '').toLowerCase().replace(/\/+$/, '');
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash.toLowerCase();

    // 1. Receipts portal check (/receipts, /ganeshotsava2026/receipts)
    if (
      path === '/receipts' ||
      path === '/ganeshotsava2026/receipts' ||
      path === '/ganeshotsavareceipts' ||
      path === '/receipt' ||
      path === '/portal' ||
      path === '/download' ||
      path.endsWith('/receipts') ||
      path.endsWith('/receipt') ||
      path.includes('/receipts') ||
      params.get('view') === 'receipts' ||
      params.get('portal') === 'receipts' ||
      params.has('receipt-portal') ||
      params.has('receipts') ||
      hash === '#receipt-portal' ||
      hash === '#receipts' ||
      hash === '#receipt'
    ) {
      return 'receipts';
    }

    // 2. Sevas booking public portal check (/ganeshotsavasevas, /sevas, /ganeshotsava2026/sevas)
    if (
      path === '/ganeshotsavasevas' ||
      path === '/ganeshotsava2026/sevas' ||
      path === '/sevas' ||
      path === '/seva' ||
      path.endsWith('/ganeshotsavasevas') ||
      path.endsWith('/sevas') ||
      path.includes('ganeshotsavasevas') ||
      path.includes('/sevas') ||
      params.get('view') === 'sevas' ||
      params.get('portal') === 'sevas' ||
      params.has('sevas') ||
      params.has('seva') ||
      params.has('ganeshotsavasevas') ||
      hash === '#ganeshotsavasevas' ||
      hash === '#sevas' ||
      hash === '#seva'
    ) {
      return 'sevas';
    }

    // 3. Eldorado Kannadigara Balaga Page (In Development Route: '/homepageindevelop' and community routes)
    if (
      path === '/homepageindevelop' ||
      path.startsWith('/homepageindevelop') ||
      path === '/balaga' ||
      path === '/events' ||
      path.startsWith('/events') ||
      path === '/gallery' ||
      path === '/announcements' ||
      path === '/archive' ||
      path === '/about' ||
      path === '/contact' ||
      path === '/login' ||
      path.includes('homepageindevelop') ||
      params.get('view') === 'homepageindevelop' ||
      params.get('page') === 'homepageindevelop' ||
      params.get('route') === 'homepageindevelop' ||
      params.has('homepageindevelop') ||
      hash === '#homepageindevelop' ||
      hash.startsWith('#/events') ||
      hash.startsWith('#/gallery') ||
      hash.startsWith('#/announcements') ||
      hash.startsWith('#/archive') ||
      hash.startsWith('#/about') ||
      hash.startsWith('#/contact') ||
      hash.startsWith('#/login')
    ) {
      return 'homepageindevelop';
    }

    // 4. Default Landing Page: Sri Ganeshotsava 2026 ('/' or any other route)
    return 'ganeshotsava';
  };

  const [currentRoute, setCurrentRoute] = useState<AppRoute>(getInitialRoute);

  const navigateToGaneshotsava = () => {
    window.history.pushState({}, '', '/');
    setCurrentRoute('ganeshotsava');
  };

  const navigateToBalagaInDev = () => {
    window.history.pushState({}, '', '/homepageindevelop');
    setCurrentRoute('homepageindevelop');
  };

  const navigateToReceipts = () => {
    window.history.pushState({}, '', '/receipts');
    setCurrentRoute('receipts');
  };

  const navigateToSevas = () => {
    window.history.pushState({}, '', '/ganeshotsavasevas');
    setCurrentRoute('sevas');
  };

  useEffect(() => {
    const handleUrlChange = () => {
      setCurrentRoute(getInitialRoute());
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // --- Committee Authentication & Multi-Role Access Control (3-Tiers) ---
  // Tier 1: Admin ('admin') - Super User, all access to view & modify data, settings, export, sync
  // desaisachin95@gmail.com is permanently guaranteed Super Admin status
  // Tier 2: Read-Only Complete Data ('read_only') - Can view complete data across all tabs (cannot modify)
  // Tier 3: Unassigned / Basic ('unassigned') - Can ONLY see Income & Expenditure Statement and Expenditure(payments) with high-level details only
  const [userRole, setUserRole] = useState<UserRole | null>(() => {
    if (typeof window === 'undefined') return null;
    const auth = sessionStorage.getItem('eg_committee_auth') === 'true';
    if (!auth) return null;
    const r = sessionStorage.getItem('eg_user_role') as UserRole;
    return r || 'unassigned';
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('eg_committee_auth') === 'true';
  });
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    if (typeof window === 'undefined') return null;
    const p = sessionStorage.getItem('eg_user_profile');
    if (p) {
      try {
        return JSON.parse(p);
      } catch {}
    }
    return null;
  });

  const getAdminEmailList = (): string[] => {
    const list = new Set<string>([
      'desaisachin95@gmail.com',
      'kannadigara.balaga.eldorado@gmail.com'
    ]);
    if (settings.adminEmails && Array.isArray(settings.adminEmails)) {
      settings.adminEmails.forEach(e => list.add(e.toLowerCase().trim()));
    }
    try {
      const saved = localStorage.getItem('ekb_allowed_emails');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach(e => list.add(e.toLowerCase().trim()));
        }
      }
    } catch {}
    return Array.from(list);
  };

  const currentEmail = (userProfile?.email || sessionStorage.getItem('eg_user_email') || '').toLowerCase().trim();
  const isGlobalAdminEmail = currentEmail === 'desaisachin95@gmail.com' || currentEmail === 'kannadigara.balaga.eldorado@gmail.com';
  const adminEmailList = getAdminEmailList().map(e => e.toLowerCase());

  // 1. Admin (Full access: create, modify, delete, export, settings, manage roles)
  const isAdmin = isAuthenticated && (isGlobalAdminEmail || adminEmailList.includes(currentEmail) || userRole === 'admin');
  // 2. Member (Read-Only Complete Data: can view all records across all modules, cannot create/edit/delete)
  const isMember = isAuthenticated && !isAdmin && (userRole === 'member' || userRole === 'read_only' || userRole === 'sponsor');
  // 3. Viewer (Only Income & Expenditure Statement and Expenditure payments with high-level details only)
  const isViewer = isAuthenticated && !isAdmin && !isMember;

  // Backward compatibility aliases
  const isReadOnly = isMember;
  const isUnassigned = isViewer;

  const [settingsSubTab, setSettingsSubTab] = useState<'general' | 'users'>('general');

  // Modals state
  const [adminManagementModalOpen, setAdminManagementModalOpen] = useState(false);
  const [requestDetailsModalOpen, setRequestDetailsModalOpen] = useState(false);
  const [darshanVideoModalOpen, setDarshanVideoModalOpen] = useState(false);

  // --- Passwordless Email Magic Link State ---
  const [isVerifyingMagicLink, setIsVerifyingMagicLink] = useState(false);
  const [magicLinkError, setMagicLinkError] = useState<string | null>(null);
  const [promptEmailForMagicLink, setPromptEmailForMagicLink] = useState(false);
  const [manualMagicEmail, setManualMagicEmail] = useState('');
  const [firstTimeOnboardingUser, setFirstTimeOnboardingUser] = useState<{
    email: string;
    name?: string;
  } | null>(null);

  // Guard restricted tabs based on 3-tier roles:
  // Viewer: only 'statement' and 'expenditure'
  // Member: 'statement', 'income', and 'expenditure'
  // Admin: all tabs
  useEffect(() => {
    if (isViewer) {
      if (activeTab !== 'statement' && activeTab !== 'expenditure') {
        setActiveTab('statement');
      }
    } else if (isMember) {
      if (activeTab === 'settings') {
        setActiveTab('statement');
      }
    }
  }, [isViewer, isMember, activeTab]);
  const [viewOnly, setViewOnly] = useState(false);
  const [activeFileHandle, setActiveFileHandle] = useState<FileSystemFileHandle | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('connecting');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const hasUnsavedChangesRef = useRef(false);
  const [syncToast, setSyncToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // --- Modals & Printing ---
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [printData, setPrintData] = useState<PrintData | null>(null);

  // Refs
  const modalQrRef = useRef<HTMLDivElement>(null);
  const autoSaveTimerRef = useRef<any>(null);

  // Get current state snapshot in memory
  const getCurrentState = (): AppState => ({
    expenses,
    contributions,
    sponsors,
    commercialStalls,
    sevas,
    sevaCatalogue,
    hundi,
    auctions,
    settings,
    counters: {
      rc: countersRef.current.rc || null,
      sp: countersRef.current.sp || null,
      cs: countersRef.current.cs || null,
      sv: countersRef.current.sv || null,
      auc: countersRef.current.auc || null
    }
  });

  // Direct real-time server fetcher (bypasses any stale local device cache)
  const triggerLiveServerSync = async (manual = false) => {
    if (manual && hasUnsavedChanges) {
      if (!window.confirm('You have unsaved changes that will be overwritten with cloud data. Do you want to continue?')) {
        return;
      }
    }
    setIsRefreshing(true);
    try {
      const serverData = await fetchFreshDataFromServer();
      setContributions(serverData.contributions);
      setExpenses(serverData.expenses);
      setSponsors(serverData.sponsors);
      setCommercialStalls(serverData.commercialStalls);
      setSevas(serverData.sevas);
      setSevaCatalogue(serverData.sevaCatalogue);
      setHundi(serverData.hundi);
      setAuctions(serverData.auctions);
      if (serverData.settings) setSettings(prev => ({ ...prev, ...serverData.settings }));
      if (serverData.counters) {
        setCounters(serverData.counters);
        countersRef.current = serverData.counters;
      }

      setSyncStatus('synced');
      hasUnsavedChangesRef.current = false;
      setHasUnsavedChanges(false);

      if (manual) {
        setSyncToast('Data refreshed successfully');
        setTimeout(() => setSyncToast(null), 3000);
      }
    } catch (err: any) {
      if (isQuotaExceededError(err)) {
        console.warn('Firestore server read quota reached. Running in offline cache mode.');
        setSyncStatus('quota-limited');
        if (manual) {
          setSyncToast('Daily cloud read quota reached. Running smoothly on offline cache.');
          setTimeout(() => setSyncToast(null), 3500);
        }
      } else {
        console.warn('Failed to fetch direct server data:', err?.message || err);
        if (manual) {
          setSyncToast(err?.message || 'Failed to refresh data');
          setTimeout(() => setSyncToast(null), 3000);
        }
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Real-time Firestore Cloud Sync
  useEffect(() => {
    // 1. Trigger immediate fresh server pull
    triggerLiveServerSync(false);

    // 2. Establish continuous real-time listeners
    const unsub = initFirestoreSync(
      {
        onExpenses: data => {
          if (data && !hasUnsavedChangesRef.current) setExpenses(data);
        },
        onContributions: data => {
          if (data && !hasUnsavedChangesRef.current) setContributions(data);
        },
        onSponsors: data => {
          if (data && !hasUnsavedChangesRef.current) setSponsors(data);
        },
        onCommercialStalls: data => {
          if (data && !hasUnsavedChangesRef.current) setCommercialStalls(data);
        },
        onSevas: data => {
          if (data && !hasUnsavedChangesRef.current) setSevas(data);
        },
        onSevaCatalogue: data => {
          if (data && data.length > 0 && !hasUnsavedChangesRef.current) setSevaCatalogue(data);
        },
        onHundi: data => {
          if (data && !hasUnsavedChangesRef.current) setHundi(data);
        },
        onAuctions: data => {
          if (data && !hasUnsavedChangesRef.current) setAuctions(data);
        },
        onSettings: data => {
          if (data && !hasUnsavedChangesRef.current) setSettings(prev => ({ ...prev, ...data }));
        },
        onCounters: data => {
          if (data && !hasUnsavedChangesRef.current) {
            setCounters(prev => {
              const updated = {
                rc: data.rc !== undefined ? String(data.rc) : prev.rc,
                sp: data.sp !== undefined ? String(data.sp) : prev.sp,
                cs: data.cs !== undefined ? String(data.cs) : prev.cs,
                sv: data.sv !== undefined ? String(data.sv) : prev.sv,
                auc: data.auc !== undefined ? String(data.auc) : prev.auc,
              };
              countersRef.current = updated;
              return updated;
            });
          }
        },
        onStatusChange: status => {
          setSyncStatus(status);
        }
      }
    );

    return () => unsub();
  }, []);

  useEffect(() => {
    // Keep in-memory window reference and persistent offline ledger backup updated
    const currentSnapshot = getCurrentState();
    window.__E__ = currentSnapshot;
    saveLocalSnapshotBackup(currentSnapshot);

    if (isAdmin && activeFileHandle) {
      clearTimeout(autoSaveTimerRef.current);
      setSaveStatus('unsaved');
      autoSaveTimerRef.current = setTimeout(async () => {
        try {
          const doc = generateStandaloneHTML(getCurrentState(), false);
          const writable = await (activeFileHandle as any).createWritable();
          await writable.write(doc);
          await writable.close();
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus(null), 3000);
        } catch (e) {
          console.warn('Auto-save to file failed', e);
        }
      }, 700);
    }
  }, [expenses, contributions, sponsors, commercialStalls, sevas, sevaCatalogue, hundi, auctions, settings]);

  // Handle Hash on load (Share Snapshot view)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#share=')) {
      try {
        const compressed = hash.slice(7);
        if (window.LZString) {
          const decompressed = window.LZString.decompressFromEncodedURIComponent(compressed);
          if (decompressed) {
            const data = JSON.parse(decompressed);
            if (data.eg_expenses) setExpenses(data.eg_expenses);
            if (data.eg_contributions) setContributions(data.eg_contributions);
            if (data.eg_sponsors) setSponsors(data.eg_sponsors);
            if (data.eg_commercial_stalls) setCommercialStalls(data.eg_commercial_stalls);
            if (data.eg_sevas) setSevas(data.eg_sevas);
            if (data.eg_seva_catalogue) setSevaCatalogue(data.eg_seva_catalogue);
            if (data.eg_hundi) setHundi(data.eg_hundi);
            if (data.eg_auctions) setAuctions(data.eg_auctions);
            if (data.org || data.location) {
              setSettings(prev => ({ ...prev, org: data.org || prev.org, location: data.location || prev.location }));
            }
            setViewOnly(true);
          }
        }
      } catch (err) {
        console.error('Failed to parse share hash', err);
      }
    }
  }, []);

  // Summary Totals
  const ctTot = contributions.reduce((s, r) => s + Number(r.amt || 0), 0);
  const spAct = sponsors.reduce((s, r) => s + Number(r.act || 0), 0);
  const csAct = commercialStalls.reduce((s, r) => s + Number(r.act || 0), 0);
  const svTot = sevas.reduce((s, r) => s + Number(r.amt || 0), 0);
  const hundiTot = hundi.reduce((s, r) => s + Number(r.act || 0), 0);
  const aucTot = auctions.reduce((s, r) => s + Number(r.act || 0), 0);
  const totalIncome = ctTot + spAct + csAct + svTot + hundiTot + aucTot;

  const exAct = expenses.reduce((s, r) => s + getExpenseActual(r), 0);
  const netBalance = totalIncome - exAct;

  // Handlers for modifying data in memory (Cloud sync happens on manual Save click)
  const handleSaveExpense = (row: Expense) => {
    setExpenses(prev => {
      const idx = prev.findIndex(x => x.id === row.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = row;
        return next;
      }
      return [...prev, row];
    });
    hasUnsavedChangesRef.current = true;
    setHasUnsavedChanges(true);

    // Asynchronously sanitize & deduplicate bill attachments in the background
    prepareExpenseForStorage(row)
      .then(optimized => {
        setExpenses(prev => prev.map(e => (e.id === optimized.id ? optimized : e)));
      })
      .catch(err => {
        console.warn('Expense preparation warning:', err);
      });
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(x => x.id !== id));
    hasUnsavedChangesRef.current = true;
    setHasUnsavedChanges(true);
  };

  const handleSaveContribution = (row: Contribution) => {
    setContributions(prev => {
      const idx = prev.findIndex(x => x.id === row.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = row;
        return next;
      }
      return [...prev, row];
    });
    const match = row.rcptNo?.match(/(\d+)$/);
    if (match) {
      const n = parseInt(match[1], 10);
      const cur = parseInt(countersRef.current.rc || '0', 10);
      if (n > cur) {
        countersRef.current = { ...countersRef.current, rc: String(n) };
        setCounters(prev => ({ ...prev, rc: String(n) }));
        cloudSaveCounters({ rc: String(n) }).catch(() => {});
      }
    }
    hasUnsavedChangesRef.current = true;
    setHasUnsavedChanges(true);
    cloudSaveContribution(row).catch(err => {
      console.warn('Live contribution cloud sync error:', err);
    });
  };

  const handleDeleteContribution = (id: string) => {
    setContributions(prev => prev.filter(x => x.id !== id));
    hasUnsavedChangesRef.current = true;
    setHasUnsavedChanges(true);
    cloudDeleteContribution(id).catch(err => {
      console.warn('Live contribution cloud delete error:', err);
    });
  };

  const handleBulkImportContributions = (newItems: Contribution[]) => {
    let maxNum = parseInt(countersRef.current.rc || '0', 10);
    newItems.forEach(c => {
      const match = c.rcptNo?.match(/(\d+)$/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    });
    const newRc = String(maxNum);
    countersRef.current = { ...countersRef.current, rc: newRc };
    setCounters(prev => ({ ...prev, rc: newRc }));
    cloudSaveCounters({ rc: newRc }).catch(() => {});
    setContributions(prev => [...prev, ...newItems]);
    hasUnsavedChangesRef.current = true;
    setHasUnsavedChanges(true);
    cloudBulkImportContributions(newItems).catch(err => {
      console.warn('Live bulk contributions cloud sync error:', err);
    });
  };

  const handleSaveSponsor = (row: Sponsor) => {
    setSponsors(prev => {
      const idx = prev.findIndex(x => x.id === row.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = row;
        return next;
      }
      return [...prev, row];
    });
    const match = row.invNo?.match(/(\d+)$/);
    if (match) {
      const n = parseInt(match[1], 10);
      const cur = parseInt(countersRef.current.sp || '0', 10);
      if (n > cur) {
        countersRef.current = { ...countersRef.current, sp: String(n) };
        setCounters(prev => ({ ...prev, sp: String(n) }));
        cloudSaveCounters({ sp: String(n) }).catch(() => {});
      }
    }
    hasUnsavedChangesRef.current = true;
    setHasUnsavedChanges(true);
    cloudSaveSponsor(row).catch(err => {
      console.warn('Live sponsor cloud sync error:', err);
    });
  };

  const handleDeleteSponsor = (id: string) => {
    setSponsors(prev => prev.filter(x => x.id !== id));
    hasUnsavedChangesRef.current = true;
    setHasUnsavedChanges(true);
    cloudDeleteSponsor(id).catch(err => {
      console.warn('Live sponsor cloud delete error:', err);
    });
  };

  const handleSaveCommercialStall = (row: CommercialStall) => {
    setCommercialStalls(prev => {
      const idx = prev.findIndex(x => x.id === row.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = row;
        return next;
      }
      return [...prev, row];
    });
    const match = row.invNo?.match(/(\d+)$/);
    if (match) {
      const n = parseInt(match[1], 10);
      const cur = parseInt(countersRef.current.cs || '0', 10);
      if (n > cur) {
        countersRef.current = { ...countersRef.current, cs: String(n) };
        setCounters(prev => ({ ...prev, cs: String(n) }));
        cloudSaveCounters({ cs: String(n) }).catch(() => {});
      }
    }
    hasUnsavedChangesRef.current = true;
    setHasUnsavedChanges(true);
    // Realtime persistence to Firestore
    cloudSaveCommercialStall(row).catch(err => {
      console.warn('Live commercial stall cloud sync error:', err);
    });
  };

  const handleDeleteCommercialStall = (id: string) => {
    setCommercialStalls(prev => prev.filter(x => x.id !== id));
    hasUnsavedChangesRef.current = true;
    setHasUnsavedChanges(true);
    cloudDeleteCommercialStall(id).catch(err => {
      console.warn('Live commercial stall cloud delete error:', err);
    });
  };

  const handleSaveSeva = (row: SevaBooking) => {
    setSevas(prev => {
      const idx = prev.findIndex(x => x.id === row.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = row;
        return next;
      }
      return [...prev, row];
    });
    const match = row.tokNo?.match(/(\d+)$/);
    if (match) {
      const n = parseInt(match[1], 10);
      const cur = parseInt(countersRef.current.sv || '0', 10);
      if (n > cur) {
        countersRef.current = { ...countersRef.current, sv: String(n) };
        setCounters(prev => ({ ...prev, sv: String(n) }));
        cloudSaveCounters({ sv: String(n) }).catch(() => {});
      }
    }
    hasUnsavedChangesRef.current = true;
    setHasUnsavedChanges(true);
    // Realtime persistence for public devotee bookings and admin modifications
    cloudSaveSeva(row).catch(err => {
      console.warn('Live seva booking cloud sync queued:', err);
    });
  };

  const handleDeleteSeva = (id: string) => {
    setSevas(prev => prev.filter(x => x.id !== id));
    hasUnsavedChangesRef.current = true;
    setHasUnsavedChanges(true);
    cloudDeleteSeva(id).catch(err => {
      console.warn('Live seva booking cloud delete queued:', err);
    });
  };

  const handleSaveHundi = (row: HundiCollection) => {
    setHundi(prev => {
      const idx = prev.findIndex(x => x.id === row.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = row;
        return next;
      }
      return [...prev, row];
    });
    hasUnsavedChangesRef.current = true;
    setHasUnsavedChanges(true);
  };

  const handleDeleteHundi = (id: string) => {
    setHundi(prev => prev.filter(x => x.id !== id));
    hasUnsavedChangesRef.current = true;
    setHasUnsavedChanges(true);
  };

  const handleSaveAuction = (row: AuctionItem) => {
    setAuctions(prev => {
      const idx = prev.findIndex(x => x.id === row.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = row;
        return next;
      }
      return [...prev, row];
    });
    const match = row.invNo?.match(/(\d+)$/);
    if (match) {
      const n = parseInt(match[1], 10);
      const cur = parseInt(countersRef.current.auc || '0', 10);
      if (n > cur) {
        countersRef.current = { ...countersRef.current, auc: String(n) };
        setCounters(prev => ({ ...prev, auc: String(n) }));
      }
    }
    hasUnsavedChangesRef.current = true;
    setHasUnsavedChanges(true);
  };

  const handleDeleteAuction = (id: string) => {
    setAuctions(prev => prev.filter(x => x.id !== id));
    hasUnsavedChangesRef.current = true;
    setHasUnsavedChanges(true);
  };

  const handleSaveSevaCatalogue = (row: SevaCatalogueItem) => {
    setSevaCatalogue(prev => {
      const idx = prev.findIndex(x => x.id === row.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = row;
        return next;
      }
      return [...prev, row];
    });
    hasUnsavedChangesRef.current = true;
    setHasUnsavedChanges(true);
    cloudSaveSevaCatalogueItem(row).catch(err => {
      console.warn('Seva catalogue cloud sync queued:', err);
    });
  };

  const handleDeleteSevaCatalogue = (id: string) => {
    setSevaCatalogue(prev => prev.filter(x => x.id !== id));
    hasUnsavedChangesRef.current = true;
    setHasUnsavedChanges(true);
    cloudDeleteSevaCatalogueItem(id).catch(err => {
      console.warn('Seva catalogue cloud delete queued:', err);
    });
  };

  const handleSaveSettings = (cfg: AppSettings) => {
    setSettings(cfg);
    hasUnsavedChangesRef.current = true;
    setHasUnsavedChanges(true);
  };

  // Global Manual Save to Firebase Firestore (Admin Only)
  const handleSaveAllToCloud = async () => {
    if (!isAdmin) return;
    setIsSaving(true);
    try {
      // Auto-sanitize and optimize all expenses in memory before syncing
      const currentExpenses = expenses;
      const sanitizedExpenses = await Promise.all(
        currentExpenses.map(exp => prepareExpenseForStorage(exp))
      );
      setExpenses(sanitizedExpenses);

      const stateToSave = {
        ...getCurrentState(),
        expenses: sanitizedExpenses
      };

      await cloudSyncAllData(stateToSave);
      hasUnsavedChangesRef.current = false;
      setHasUnsavedChanges(false);
      setSyncToast({ message: 'All festival records successfully saved to cloud!', type: 'success' });
      setTimeout(() => setSyncToast(null), 3500);
    } catch (err: any) {
      console.error('Failed to save data:', err);
      const rawMsg = err?.message || String(err);
      const isSizeError = rawMsg.includes('exceeds the maximum allowed size') || rawMsg.includes('1,048,576');
      const displayMsg = isSizeError
        ? 'An attached bill file was too large. Large bills have been automatically compressed — please click Save again.'
        : rawMsg || 'Failed to save data. Please retry.';
      setSyncToast({ message: displayMsg, type: 'error' });
      setTimeout(() => setSyncToast(null), 5500);
    } finally {
      setIsSaving(false);
    }
  };

  // Committee Login Success handler
  const handleLoginSuccess = (role: UserRole = 'viewer', profile?: UserProfile) => {
    const adminEmails = getAdminEmailList().map(e => e.toLowerCase());
    const email = (profile?.email || sessionStorage.getItem('eg_user_email') || '').toLowerCase().trim();
    let effectiveRole: UserRole = 'viewer';
    if (email === 'desaisachin95@gmail.com' || adminEmails.includes(email) || role === 'admin' || profile?.role === 'admin') {
      effectiveRole = 'admin';
    } else if (
      profile?.role === 'member' ||
      profile?.role === 'read_only' ||
      role === 'member' ||
      role === 'read_only' ||
      role === 'sponsor' ||
      profile?.role === 'sponsor'
    ) {
      effectiveRole = 'member';
    } else {
      effectiveRole = 'viewer';
    }

    sessionStorage.setItem('eg_committee_auth', 'true');
    sessionStorage.setItem('eg_user_role', effectiveRole);
    if (profile) {
      sessionStorage.setItem('eg_user_profile', JSON.stringify({ ...profile, role: effectiveRole }));
      sessionStorage.setItem('eg_user_email', profile.email);
      setUserProfile({ ...profile, role: effectiveRole });
    }
    setUserRole(effectiveRole);
    setIsAuthenticated(true);
  };

  // --- Process Passwordless Email Magic Link Sign-In ---
  const processEmailMagicLink = async (emailToUse: string) => {
    if (!auth) return;
    setIsVerifyingMagicLink(true);
    setMagicLinkError(null);
    try {
      const cleanEmail = emailToUse.toLowerCase().trim();
      let verifiedEmail = cleanEmail;

      if (isSignInWithEmailLink(auth, window.location.href)) {
        try {
          const result = await signInWithEmailLink(auth, cleanEmail, window.location.href);
          verifiedEmail = (result.user.email || cleanEmail).toLowerCase().trim();
        } catch (authErr: any) {
          console.warn('signInWithEmailLink notice:', authErr);
        }
      }

      // Clean up localStorage and remove query parameters from URL cleanly
      window.localStorage.removeItem('emailForSignIn');
      window.history.replaceState({}, document.title, window.location.pathname);

      // Check whether user profile already exists in Firestore database
      const existingProfile = await cloudGetUserProfile(verifiedEmail);

      const adminEmails = getAdminEmailList().map(e => e.toLowerCase());
      const isSuperAdmin = verifiedEmail === 'desaisachin95@gmail.com' || adminEmails.includes(verifiedEmail);

      if (existingProfile) {
        // RETURNING REGISTERED USER:
        // AUTOMATIC LOGIN WITHOUT ASKING OR CONFIRMING EMAIL
        setPromptEmailForMagicLink(false);
        let role: UserRole = 'viewer';
        if (isSuperAdmin || existingProfile.role === 'admin') {
          role = 'admin';
        } else if (
          existingProfile.role === 'member' ||
          existingProfile.role === 'read_only' ||
          existingProfile.role === 'sponsor'
        ) {
          role = 'member';
        } else {
          role = 'viewer';
        }

        handleLoginSuccess(role, existingProfile);
        setSyncToast({
          message: `Welcome back, ${existingProfile.name}! Logged in automatically.`,
          type: 'success'
        });
        setTimeout(() => setSyncToast(null), 3500);
      } else if (isSuperAdmin) {
        // Global admin logging in
        setPromptEmailForMagicLink(false);
        const adminProfile: UserProfile = {
          email: verifiedEmail,
          name: 'Sachin Desai (Admin)',
          flat: 'Admin Desk',
          mobile: '',
          role: 'admin',
          createdAt: new Date().toISOString()
        };
        await cloudSaveUserProfile(adminProfile);
        handleLoginSuccess('admin', adminProfile);
      } else {
        // UNREGISTERED FIRST-TIME USER: Route to onboarding modal to record name, flat, mobile & picture
        setPromptEmailForMagicLink(false);
        setFirstTimeOnboardingUser({
          email: verifiedEmail,
          name: ''
        });
      }
    } catch (err: any) {
      console.error('Error during signInWithEmailLink:', err);
      // Fallback: If user is already registered in database, log them in!
      const cleanEmail = emailToUse.toLowerCase().trim();
      const existingProfile = await cloudGetUserProfile(cleanEmail);
      if (existingProfile) {
        const adminEmails = getAdminEmailList().map(e => e.toLowerCase());
        const isSuperAdmin = cleanEmail === 'desaisachin95@gmail.com' || adminEmails.includes(cleanEmail);
        const role: UserRole = isSuperAdmin ? 'admin' : (existingProfile.role || 'viewer');
        handleLoginSuccess(role, existingProfile);
        setPromptEmailForMagicLink(false);
        setSyncToast({
          message: `Welcome back, ${existingProfile.name}! Logged in automatically.`,
          type: 'success'
        });
        setTimeout(() => setSyncToast(null), 3500);
        return;
      }
      setMagicLinkError(err?.message || 'Failed to complete magic link sign-in. The link may have expired or was already used.');
    } finally {
      setIsVerifyingMagicLink(false);
    }
  };

  // Check on app initialization if the user opened the app via Email Magic Link
  useEffect(() => {
    if (!auth) return;
    try {
      const url = new URL(window.location.href);
      const isEmailLink = isSignInWithEmailLink(auth, window.location.href);
      const emailFromUrl = url.searchParams.get('email');
      const otpFromUrl = url.searchParams.get('otp');

      if (isEmailLink || (emailFromUrl && otpFromUrl)) {
        const savedEmail = (
          emailFromUrl ||
          window.localStorage.getItem('emailForSignIn') ||
          sessionStorage.getItem('eg_user_email') ||
          ''
        ).toLowerCase().trim();

        if (savedEmail) {
          processEmailMagicLink(savedEmail);
        } else {
          cloudGetAllUserProfiles().then(profiles => {
            if (profiles.length === 1) {
              processEmailMagicLink(profiles[0].email);
            } else {
              setPromptEmailForMagicLink(true);
            }
          }).catch(() => {
            setPromptEmailForMagicLink(true);
          });
        }
      }
    } catch (err) {
      console.warn('isSignInWithEmailLink check error:', err);
    }
  }, []);

  // Committee Logout & Signout handler
  const handleLogout = async () => {
    try {
      if (auth) {
        await firebaseSignOut(auth);
      }
    } catch (e) {
      console.warn('Firebase signout warning:', e);
    }
    sessionStorage.removeItem('eg_committee_auth');
    sessionStorage.removeItem('eg_user_role');
    sessionStorage.removeItem('eg_user_email');
    sessionStorage.removeItem('eg_user_profile');
    localStorage.removeItem('eg_committee_auth');
    localStorage.removeItem('eg_user_role');
    localStorage.removeItem('eg_user_profile');
    setUserProfile(null);
    setUserRole(null);
    setIsAuthenticated(false);
    setActiveTab('statement');
    setActiveIncomeSubTab('donations');
  };

  // Signout handler
  const handleToggleAdmin = () => {
    handleLogout();
  };

  // Connect File (File System Access API)
  const handleConnectFile = async () => {
    if (!window.showOpenFilePicker) {
      alert('Direct file connection is supported on Chrome, Edge, and Android Chrome. Please use "Save HTML" to download a self-contained copy.');
      return;
    }
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [{ description: 'HTML File', accept: { 'text/html': ['.html', '.htm'] } }]
      });
      setActiveFileHandle(handle);
      setSaveStatus('saved');
      alert(`⚡ Connected to "${handle.name}". All future edits will auto-save directly back into this file!`);
    } catch (err: any) {
      if (err.name !== 'AbortError') console.error(err);
    }
  };

  // Save HTML File
  const handleSaveHTML = async () => {
    const doc = generateStandaloneHTML(getCurrentState(), false);
    const blob = new Blob([doc], { type: 'text/html;charset=utf-8' });
    const filename = `GaneshaNamah_${today()}.html`;

    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [{ description: 'HTML File', accept: { 'text/html': ['.html'] } }]
        });
        const writable = await (handle as any).createWritable();
        await writable.write(blob);
        await writable.close();
        setActiveFileHandle(handle);
        setSaveStatus('saved');
        alert('💾 HTML file saved with all your latest data permanently embedded!');
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setSaveStatus('saved');
    alert('💾 Single-file standalone HTML downloaded! Open it anywhere offline.');
  };

  // WhatsApp Messaging
  const openWhatsApp = (msg: string) => {
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Generate & Download or Share PDF via WhatsApp
  const handleShareReceiptPDFWhatsApp = async () => {
    if (!printData) return;
    setIsGeneratingPdf(true);

    const isRcpt = printData.type === 'receipt';
    const num = isRcpt ? (printData.item.rcptNo || printData.item.tokNo || '') : (printData.item.invNo || '');
    const flat = printData.item.flat || '';
    const name = printData.item.name || printData.item.det || 'Partner';
    const filename = getReceiptPdfFilename(isRcpt, num, flat);

    let msg = '';
    if (isRcpt) {
      if (printData.item.isSeva || printData.subType === 'seva') {
        msg = `🙏 *Seva Booking Official Receipt — PDF Attached*\n\n*${cleanOrgName(settings.org, 'Eldorado Residents Association')}*\n3rd Year Ganeshotsava (14th – 18th Sept 2026)\n\n🎟️ Token No: ${printData.item.tokNo}\n🌺 Seva: ${printData.item.seva}\n📅 Date: ${fmtDate(printData.item.date)}\n👤 Devotee: ${printData.item.name}\n🏠 Flat: ${printData.item.flat}\n💰 Amount: ₹${fmt(printData.item.amt)} (${numWords(printData.item.amt)})\n\n📄 *Official PDF receipt with Digital Signature & Watermark is attached.*\n\nThank you for your seva and devotional support 🙏\n*Ganapati Bappa Morya!*`;
      } else {
        msg = `🙏 *Voluntary Resident Contribution Receipt — PDF Attached*\n\n*${cleanOrgName(settings.org, 'Eldorado Residents Association')}*\n3rd Year Ganeshotsava (14th – 18th Sept 2026)\n\n📋 Receipt No: ${printData.item.rcptNo}\n📅 Date: ${fmtDate(printData.item.date)}\n👤 Devotee: ${printData.item.name}\n🏠 Flat: ${printData.item.flat}\n💳 Payment: ${printData.item.pay || 'UPI'}${printData.item.txn ? ' (Ref: ' + printData.item.txn + ')' : ''}\n💰 Amount: ₹${fmt(printData.item.amt)} (${numWords(printData.item.amt)})${printData.item.notes ? '\n📝 Notes: ' + printData.item.notes : ''}\n\n📄 *Official PDF receipt with Digital Signature & Watermark is attached.*\n\nThank you for your generous contribution 🙏\n*Ganapati Bappa Morya!*`;
      }
    } else {
      const typeLabel = printData.subType === 'stall' ? 'Commercial Stall Invoice' : printData.subType === 'auction' ? 'Auction Winning Bid Invoice' : 'Sponsorship Invoice';
      msg = `📄 *${typeLabel} — PDF Attached*\n\n*${cleanOrgName(settings.org, 'Eldorado Residents Association')}*\n3rd Year Ganeshotsava (14th – 18th Sept 2026)\n\n🔖 Invoice No: ${printData.item.invNo}\n📅 Date: ${new Date().toLocaleDateString('en-IN')}\n🏢 Particulars: ${printData.item.det}\n💰 Amount: ₹${fmt(printData.item.act || printData.item.amt)} (${numWords(printData.item.act || printData.item.amt)})\n\n📄 *Official Invoice PDF with Digital Signature & Watermark is attached.*\n\nThank you for your generous partnership & support! 🙏\n*Ganapati Bappa Morya!*`;
    }

    const element = document.getElementById('receipt-print-target');
    if (element) {
      try {
        const pdfBlob = await generateReceiptPdfBlob(element, { scale: 2, quality: 0.96 });
        const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });

        if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
          try {
            await navigator.share({
              files: [pdfFile],
              title: `${isRcpt ? 'Receipt' : 'Invoice'} - ${name}`,
              text: msg
            });
            setIsGeneratingPdf(false);
            return;
          } catch (shareErr: any) {
            if (shareErr.name === 'AbortError') {
              setIsGeneratingPdf(false);
              return;
            }
          }
        }

        downloadBlobAsFile(pdfBlob, filename);

        setTimeout(() => {
          openWhatsApp(msg);
          setIsGeneratingPdf(false);
        }, 600);
        return;
      } catch (err) {
        console.error('PDF generation error:', err);
      }
    }

    openWhatsApp(msg);
    setIsGeneratingPdf(false);
  };

  // Direct download receipt/invoice as a standalone PDF file (Never opens print dialog)
  const handleDownloadReceiptPDF = async () => {
    if (!printData) return;
    setIsGeneratingPdf(true);

    const isRcpt = printData.type === 'receipt';
    const num = isRcpt ? (printData.item.rcptNo || printData.item.tokNo || '') : (printData.item.invNo || '');
    const flat = printData.item.flat || '';
    const filename = getReceiptPdfFilename(isRcpt, num, flat);

    try {
      const element = document.getElementById('receipt-print-target');
      if (!element) {
        throw new Error('Receipt preview element not found');
      }

      const pdfBlob = await generateReceiptPdfBlob(element, { scale: 2, quality: 0.96 });
      downloadBlobAsFile(pdfBlob, filename);
    } catch (err) {
      console.error('PDF download error:', err);
      alert('Could not save PDF file directly. Please check your browser download settings.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const shareWhatsAppSummary = () => {
    const msg = `📊 *Ganeshotsava 2026 — Income & Expenditure Statement*\n*${cleanOrgName(settings.org, 'Eldorado')}*\n\n💰 *INCOME (RECEIPTS)*\n• Voluntary Contributions: ₹${fmt(ctTot)}\n• Sponsorship: ₹${fmt(spAct)}\n• Commercial Stalls: ₹${fmt(csAct)}\n• Seva Bookings: ₹${fmt(svTot)}\n• Hundi Collection: ₹${fmt(hundiTot)}\n• Auctions: ₹${fmt(aucTot)}\n▶ *Total Income: ₹${fmt(totalIncome)}*\n\n📤 *EXPENDITURE (PAYMENTS)*\n• Actual Incurred: ₹${fmt(exAct)}\n▶ *Total Expenditure: ₹${fmt(exAct)}*\n\n${netBalance >= 0 ? '✅' : '⚠️'} *Net Surplus/(Deficit): ₹${fmt(Math.abs(netBalance))}${netBalance < 0 ? ' (Deficit)' : ' (Surplus)'}*\n\n_Ganapati Bappa Morya!_ 🙏🌺`;
    openWhatsApp(msg);
  };

  // QR Code generator for modal
  const generateModalQR = () => {
    if (!settings.upi || !modalQrRef.current) return;
    modalQrRef.current.innerHTML = '';
    const upiUrl = `upi://pay?pa=${encodeURIComponent(settings.upi)}&pn=${encodeURIComponent(settings.payee || settings.org || 'Ganeshotsava')}&cu=INR`;
    if (window.QRCode) {
      new window.QRCode(modalQrRef.current, {
        text: upiUrl,
        width: 110,
        height: 110,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: window.QRCode.CorrectLevel.M
      });
    }
  };

  useEffect(() => {
    if (receiptModalOpen && printData) {
      const isRcpt = printData.type === 'receipt';
      const num = isRcpt ? (printData.item?.rcptNo || printData.item?.tokNo || '') : (printData.item?.invNo || '');
      const flat = printData.item?.flat || '';
      const originalTitle = document.title;
      document.title = getReceiptDocumentTitle(isRcpt, num, flat);

      if (isRcpt) {
        setTimeout(generateModalQR, 100);
      }

      return () => {
        document.title = originalTitle;
      };
    }
  }, [receiptModalOpen, printData, settings.upi]);

  // Isolated print trigger - ensures ONLY the receipt is printed without background records
  const triggerDirectPrint = () => {
    const element = document.getElementById('receipt-print-target');
    if (element && receiptModalOpen) {
      const isRcpt = printData?.type === 'receipt';
      const num = isRcpt ? (printData?.item?.rcptNo || printData?.item?.tokNo || '') : (printData?.item?.invNo || '');
      const flat = printData?.item?.flat || '';
      const docTitle = getReceiptDocumentTitle(isRcpt, num, flat);
      triggerReceiptDirectPrint(element, docTitle);
      return;
    }

    // Default window.print for Statement view or other views
    window.print();
  };

  // Excel Export
  const handleExportExcel = () => {
    if (!window.XLSX) {
      alert('Excel export library is loading. Please try again in a moment.');
      return;
    }
    const wb = window.XLSX.utils.book_new();

    // 1. Income & Expenditure Statement
    const statementRows = [
      ['INCOME & EXPENDITURE STATEMENT — GANESHOTSAVA 2026'],
      ['Organization', cleanOrgName(settings.org, 'Eldorado')],
      ['Location', settings.location || 'Amphitheatre'],
      [],
      ['A. INCOME (RECEIPTS)', 'AMOUNT (₹)'],
      ['Voluntary Contributions Resident', ctTot],
      ['Sponsorship (Actual)', spAct],
      ['Commercial Stalls (Actual)', csAct],
      ['Seva Bookings', svTot],
      ['Hundi Collections', hundiTot],
      ['Auctions (Maha Laddu / Artifacts)', aucTot],
      ['TOTAL INCOME (A)', totalIncome],
      [],
      ['B. EXPENDITURE (PAYMENTS)', 'AMOUNT (₹)'],
      ...expenses.map(e => [e.item, getExpenseActual(e)]),
      ['TOTAL EXPENDITURE (B)', exAct],
      [],
      ['NET SURPLUS / (DEFICIT) (A - B)', netBalance]
    ];
    window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.aoa_to_sheet(statementRows), 'Statement');

    // 2. Voluntary Contributions Resident
    const ctData = contributions.map(c => ({
      'Receipt No': c.rcptNo,
      'Resident / Contributor': c.name,
      'Flat No': c.flat,
      'Amount (₹)': c.amt,
      'Date': c.date,
      'Payment Mode': c.pay,
      'Txn ID': c.txn,
      'Notes': c.notes
    }));
    window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.json_to_sheet(ctData), 'Voluntary Contributions');

    // 3. Sponsorship
    const spData = sponsors.map(s => ({
      'Invoice No': s.invNo,
      'Sponsor Details': s.det,
      'Payment Mode': s.payMode || 'UPI',
      'Notes': s.notes || '',
      'Estimated (₹)': s.est,
      'Actual (₹)': s.act
    }));
    window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.json_to_sheet(spData), 'Sponsorship');

    // 4. Commercial Stalls
    const csData = commercialStalls.map(s => {
      const p = s.particular || (s.det.includes(' — ') ? s.det.split(' — ')[0] : s.det);
      const v = s.vendor || (s.det.includes(' — ') ? s.det.split(' — ').slice(1).join(' — ') : '');
      return {
        'Invoice No': s.invNo,
        'Particular': p,
        'Vendor Details': v,
        'Estimated (₹)': s.est,
        'Actual (₹)': s.act,
        'Date': s.date,
        'Notes': s.notes
      };
    });
    window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.json_to_sheet(csData), 'Commercial Stalls');

    // 5. Sevas
    const svData = sevas.map(v => ({
      'Token No': v.tokNo,
      'Seva Name': v.seva,
      'Resident Name': v.name,
      'Flat No': v.flat,
      'Amount (₹)': v.amt,
      'Date': v.date,
      'Notes': v.notes
    }));
    window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.json_to_sheet(svData), 'Seva Bookings');

    // 6. Hundi
    const hundiData = hundi.map(h => ({
      'Particular Details': h.det,
      'Actual (₹)': h.act,
      'Date': h.date,
      'Counted By': h.countedBy,
      'Notes': h.notes
    }));
    window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.json_to_sheet(hundiData), 'Hundi Collections');

    // 7. Auctions
    const aucData = auctions.map(a => ({
      'Invoice No': a.invNo,
      'Auction Details': a.det,
      'Auctioned (By)': a.by,
      'Winning Amount (₹)': a.act,
      'Date': a.date,
      'Notes': a.notes
    }));
    window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.json_to_sheet(aucData), 'Auctions');

    // 8. Expenditure (Payments)
    const exData = expenses.map(e => {
      const bills = (e.bills && e.bills.length > 0)
        ? e.bills
        : (e.receiptUrl ? [{ name: e.receiptName || 'Bill', comments: '' }] : []);
      const billsCount = bills.length;
      const billComments = bills
        .map((b, i) => `Bill ${i + 1}: ${b.name}${b.comments ? ` [Note: ${b.comments}]` : ''}`)
        .join('; ');

      return {
        'Item': e.item,
        'Estimated (₹)': e.est,
        'Advance (₹)': e.adv,
        'Balance (₹)': getExpenseBalance(e),
        'Actual (₹)': getExpenseActual(e),
        'Bills Count': billsCount > 0 ? `${billsCount} bill${billsCount > 1 ? 's' : ''}` : 'No bills',
        'Attached Bills & Comments': billComments || (e.receiptName || 'None'),
        'Notes': e.notes || ''
      };
    });
    window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.json_to_sheet(exData), 'Expenditure');

    window.XLSX.writeFile(wb, `Ganeshotsava_Accounts_${today()}.xlsx`);
  };

  // Bulk Import Contributions
  const handleBulkImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx,.xls';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (evt: any) => {
        try {
          let rows: any[] = [];
          if (file.name.endsWith('.csv')) {
            const text = evt.target.result as string;
            const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            for (let i = 1; i < lines.length; i++) {
              const vals = lines[i].split(',').map(v => v.trim());
              const rowObj: any = {};
              headers.forEach((h, idx) => {
                rowObj[h] = vals[idx] || '';
              });
              rows.push(rowObj);
            }
          } else if (window.XLSX) {
            const data = new Uint8Array(evt.target.result);
            const wb = window.XLSX.read(data, { type: 'array' });
            const sheet = wb.Sheets[wb.SheetNames[0]];
            rows = window.XLSX.utils.sheet_to_json(sheet);
          }

          if (rows.length === 0) return alert('No data found in uploaded file.');

          let currentSeq = parseInt(countersRef.current.rc || '0', 10);
          const newContributions: Contribution[] = rows.map((r: any) => {
            currentSeq++;
            const name = r.name || r['resident / contributor'] || r.contributor || r.resident || 'Resident';
            const flat = r.flat || r['flat no'] || r['flat / unit'] || '';
            const amt = parseFloat(r.amt || r.amount || r['amount (₹)'] || 0) || 0;
            const pay = r.pay || r['payment mode'] || r.mode || 'UPI';
            const txn = r.txn || r['txn id'] || r.reference || '';
            const notes = r.notes || r.remarks || '';
            const rcptNo = r.rcptno || r['receipt no'] || `GE-2026-${String(currentSeq).padStart(4, '0')}`;

            return {
              id: `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
              rcptNo,
              name,
              flat,
              amt,
              date: r.date || today(),
              pay,
              txn,
              notes
            };
          });

          const newRcStr = String(currentSeq);
          countersRef.current = { ...countersRef.current, rc: newRcStr };
          setCounters(prev => ({ ...prev, rc: newRcStr }));
          setContributions(prev => [...prev, ...newContributions]);

          try {
            await cloudBulkImportContributions(newContributions);
            await cloudSaveCounters({ rc: String(currentSeq) });
          } catch (err) {
            console.warn('Cloud sync for bulk import pending', err);
          }

          alert(`Successfully imported ${newContributions.length} contribution records!`);
        } catch (err) {
          console.error(err);
          alert('Failed to parse file. Ensure headers match Name, Flat, Amount.');
        }
      };

      if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    };
    input.click();
  };

  // 1. DEVOTEE RECEIPTS PORTAL ('/ganeshotsava2026/receipts') - Strictly Admin Only
  if (currentRoute === 'receipts') {
    if (!isAuthenticated || !isAdmin) {
      return (
        <AdminAccessGate
          pageType="receipts"
          pageTitle="Devotee Receipts Portal"
          pageRoute="/receipts"
          settings={settings}
          currentRole={userRole}
          onSuccess={() => {
            setIsAuthenticated(true);
            setUserRole('admin');
            sessionStorage.setItem('eg_committee_auth', 'true');
            sessionStorage.setItem('eg_user_role', 'admin');
          }}
          onBackToHome={navigateToGaneshotsava}
        />
      );
    }

    return (
      <PublicReceiptPortal
        contributions={contributions}
        sevas={sevas}
        settings={settings}
        onBackToHome={navigateToGaneshotsava}
        onBackToApp={
          isAuthenticated
            ? navigateToGaneshotsava
            : undefined
        }
      />
    );
  }

  // 2. DEVOTEE SEVAS PORTAL ('/ganeshotsavasevas') - Strictly Admin Only
  if (currentRoute === 'sevas') {
    if (!isAuthenticated || !isAdmin) {
      return (
        <AdminAccessGate
          pageType="sevas"
          pageTitle="Devotee Seva Portal"
          pageRoute="/ganeshotsavasevas"
          settings={settings}
          currentRole={userRole}
          onSuccess={() => {
            setIsAuthenticated(true);
            setUserRole('admin');
            sessionStorage.setItem('eg_committee_auth', 'true');
            sessionStorage.setItem('eg_user_role', 'admin');
          }}
          onBackToHome={navigateToGaneshotsava}
        />
      );
    }

    return (
      <PublicSevaPortal
        sevas={sevas}
        catalogue={sevaCatalogue}
        settings={settings}
        isAdmin={isAdmin}
        onSaveBooking={handleSaveSeva}
        onDeleteBooking={handleDeleteSeva}
        onSaveCatalogue={handleSaveSevaCatalogue}
        onDeleteCatalogue={handleDeleteSevaCatalogue}
        onNavigateToGaneshotsava={navigateToGaneshotsava}
        onNavigateToReceipts={navigateToReceipts}
        onAdminLoginSuccess={() => {
          setIsAuthenticated(true);
          setUserRole('admin');
          sessionStorage.setItem('eg_committee_auth', 'true');
          sessionStorage.setItem('eg_user_role', 'admin');
        }}
        onUpdateSettings={handleSaveSettings}
      />
    );
  }

  // 3. ELDORADO KANNADIGARA BALAGA PAGE (IN DEVELOPMENT: '/homepageindevelop')
  // Requirement: "the balaga page should only be visible to admin"
  if (currentRoute === 'homepageindevelop') {
    if (!isAuthenticated || !isAdmin) {
      return (
        <AdminGateForBalaga
          settings={settings}
          onSuccess={() => {
            setIsAuthenticated(true);
            setUserRole('admin');
            sessionStorage.setItem('eg_committee_auth', 'true');
            sessionStorage.setItem('eg_user_role', 'admin');
          }}
          onBackToGaneshotsava={navigateToGaneshotsava}
        />
      );
    }

    return (
      <CommunityHomeView
        settings={settings}
        contributions={contributions}
        onNavigateToGaneshotsava={navigateToGaneshotsava}
        onNavigateToReceipts={navigateToReceipts}
      />
    );
  }

  // 4. GANESHOTSAVA 2026 FESTIVAL PORTAL (Default Landing Page '/')
  // A. If currently verifying magic link, show dedicated loading state
  if (isVerifyingMagicLink) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-xl border-2 border-amber-300 text-center space-y-4 animate-in fade-in">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-[#991B1B] flex items-center justify-center mx-auto">
            <Loader2 className="w-8 h-8 animate-spin text-[#991B1B]" />
          </div>
          <h2 className="text-xl font-serif font-black text-stone-900">
            Verifying Email Sign-In Link...
          </h2>
          <p className="text-sm text-stone-600">
            Authenticating your passwordless email verification link. Please wait a moment.
          </p>
        </div>
      </div>
    );
  }

  // B. If user opened magic link in a different browser/device, ask them to confirm email
  if (promptEmailForMagicLink) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-xl border-2 border-amber-400 text-center space-y-5 animate-in fade-in">
          <div className="w-16 h-16 rounded-full bg-amber-400/20 text-[#991B1B] flex items-center justify-center mx-auto border border-amber-400">
            <Mail className="w-8 h-8 text-[#991B1B]" />
          </div>
          <div>
            <h2 className="text-xl font-serif font-black text-stone-900">
              Confirm Your Email Address
            </h2>
            <p className="text-xs text-stone-600 mt-1">
              You opened this sign-in link on a new device or browser. Please confirm the email address you requested the link for.
            </p>
          </div>
          {magicLinkError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs text-left">
              {magicLinkError}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (manualMagicEmail.trim()) {
                processEmailMagicLink(manualMagicEmail.trim());
              }
            }}
            className="space-y-4 text-left"
          >
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                Email Address
              </label>
              <input
                type="email"
                required
                autoFocus
                value={manualMagicEmail}
                onChange={(e) => setManualMagicEmail(e.target.value)}
                placeholder="e.g. resident@gmail.com"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-3 text-sm text-stone-900 outline-none focus:bg-white focus:border-[#991B1B] focus:ring-2 focus:ring-[#991B1B]/20 font-medium"
              />
            </div>
            <button
              type="submit"
              disabled={!manualMagicEmail.trim() || isVerifyingMagicLink}
              className="w-full bg-[#991B1B] hover:bg-[#7F1D1D] text-white font-bold text-sm uppercase tracking-wider py-3.5 rounded-xl shadow-md cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              <span>{isVerifyingMagicLink ? 'Verifying...' : 'Confirm & Sign In'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setPromptEmailForMagicLink(false);
                setMagicLinkError(null);
                window.history.replaceState({}, document.title, window.location.pathname);
              }}
              className="w-full text-center text-xs text-stone-500 hover:text-stone-800 underline cursor-pointer pt-1"
            >
              Cancel and Return to Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  // C. If first-time user after magic link sign-in, show onboarding form
  if (firstTimeOnboardingUser) {
    return (
      <UserProfileOnboardingModal
        email={firstTimeOnboardingUser.email}
        initialName={firstTimeOnboardingUser.name}
        settings={settings}
        onComplete={(newProfile) => {
          const adminEmails = getAdminEmailList();
          const role: UserRole = newProfile.role || (adminEmails.includes(newProfile.email.toLowerCase()) ? 'admin' : 'unassigned');
          handleLoginSuccess(role, newProfile);
          setFirstTimeOnboardingUser(null);
          setSyncToast({
            message: `Welcome to Ganeshotsava 2026, ${newProfile.name}! Your profile has been registered.`,
            type: 'success'
          });
          setTimeout(() => setSyncToast(null), 4000);
        }}
        onCancel={() => {
          setFirstTimeOnboardingUser(null);
          handleLogout();
        }}
      />
    );
  }

  // D. If not authenticated, require Committee Authentication before showing financial data, statements, or expenses!
  if (!isAuthenticated) {
    return (
      <CommitteeAuthGate
        settings={settings}
        onSuccess={handleLoginSuccess}
        onSaveSettings={handleSaveSettings}
      />
    );
  }

  return (
    <div id="mainAppView" className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A] flex flex-col font-sans selection:bg-[#991B1B] selection:text-white pb-12">
      {/* 1. TOP HEADER */}
      <header className="bg-[#991B1B] text-white shadow-md border-b-2 border-[#7F1D1D] no-print sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Brand / Logo */}
          <div className="flex items-center gap-3">
            {settings.logo ? (
              <img
                src={settings.logo}
                alt="Logo"
                className="w-10 h-10 object-contain rounded bg-white/10 p-0.5 border border-white/20"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-amber-400 text-[#991B1B] flex items-center justify-center p-0.5 shadow-inner shrink-0 overflow-hidden border border-amber-300">
                <img
                  src="/lord_ganesha.svg"
                  alt="Lord Sri Ganesha"
                  className="w-full h-full object-contain rounded-full"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-serif font-black tracking-wide leading-tight">
                  {cleanOrgName(settings.org, 'Eldorado Residents Association')}
                </h1>
                <span className="hidden sm:inline-block bg-amber-400 text-stone-900 text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wider uppercase">
                  3rd Year
                </span>
                {isAdmin && (
                  <span className="bg-amber-300 text-[#7F1D1D] text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 uppercase tracking-wider shadow-2xs">
                    <Crown className="w-3 h-3 text-[#991B1B]" />
                    <span>Super Admin</span>
                  </span>
                )}
                {isReadOnly && (
                  <span className="bg-blue-100 text-blue-900 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 uppercase tracking-wider shadow-2xs">
                    <Eye className="w-3 h-3 text-blue-700" />
                    <span>Read-Only (Complete Data)</span>
                  </span>
                )}
                {isUnassigned && (
                  <span className="bg-stone-200 text-stone-900 text-[10px] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 tracking-wider shadow-2xs">
                    <span>Summary View</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-amber-200/90 font-medium">
                Ganeshotsava 2026 • {settings.location || 'Amphitheatre'}
              </p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {/* 1. UNASSIGNED / BASIC USERS: STRICTLY ONLY CONTACT US + LOGOUT */}
            {isUnassigned ? (
              <>
                {/* Watch Festival Video & Darshan Button */}
                <button
                  onClick={() => setDarshanVideoModalOpen(true)}
                  className="px-2.5 py-1 rounded-full font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-all cursor-pointer text-[11px] bg-gradient-to-r from-amber-400 to-amber-500 text-stone-950 hover:brightness-110 shadow-xs"
                  title="Watch Sri Ganeshotsava 2026 Festival Darshan Video"
                >
                  <Video className="w-3.5 h-3.5 text-[#991B1B]" />
                  <span>Festival Video</span>
                </button>

                {/* Button to request details on detailed data */}
                <button
                  onClick={() => setRequestDetailsModalOpen(true)}
                  className="px-3 py-1.5 rounded-full font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-all cursor-pointer text-[11px] bg-amber-400 text-stone-950 hover:bg-amber-300 shadow-sm"
                  title="Request access to detailed data or contact the committee"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-[#991B1B]" />
                  <span>Contact Us for Details</span>
                </button>

                {/* Devotee Profile Badge with Photo */}
                {userProfile && (
                  <div
                    className="px-2.5 py-1 rounded-full text-[11px] bg-white/15 text-white border border-white/20 inline-flex items-center gap-1.5 shadow-xs"
                    title={`Signed in as ${userProfile.name} (Flat: ${userProfile.flat}, Mobile: ${userProfile.mobile}, Email: ${userProfile.email})`}
                  >
                    {userProfile.photoUrl ? (
                      <img
                        src={userProfile.photoUrl}
                        alt={userProfile.name}
                        className="w-4 h-4 rounded-full object-cover border border-amber-300 shrink-0"
                      />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-amber-400 text-stone-900 flex items-center justify-center font-bold text-[9px] shrink-0">
                        {(userProfile.name || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="font-bold max-w-[120px] truncate hidden sm:inline">
                      {userProfile.name}
                    </span>
                    {userProfile.flat && (
                      <span className="text-[10px] text-amber-200 font-mono hidden md:inline">
                        [{userProfile.flat}]
                      </span>
                    )}
                  </div>
                )}

                {/* Only Logout option seen by basic unassigned users */}
                <button
                  onClick={handleLogout}
                  className="px-3 py-1 rounded-full font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors cursor-pointer text-[11px] bg-white/10 text-white hover:bg-white/20 border border-white/20 shadow-xs active:scale-95"
                  title="Sign out of portal"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Logout</span>
                </button>
              </>
            ) : isReadOnly ? (
              /* 2. READ-ONLY COMPLETE USERS */
              <>
                <button
                  onClick={() => triggerLiveServerSync(true)}
                  disabled={isRefreshing}
                  className="px-2.5 py-1 rounded-full font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors cursor-pointer text-[11px] bg-white/10 text-amber-200 hover:text-white hover:bg-white/20 border border-white/20 shadow-xs disabled:opacity-50"
                  title="Refresh Data"
                >
                  <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-amber-300' : ''}`} />
                  <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                </button>

                {/* Watch Festival Video & Darshan Button */}
                <button
                  onClick={() => setDarshanVideoModalOpen(true)}
                  className="px-2.5 py-1 rounded-full font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-all cursor-pointer text-[11px] bg-gradient-to-r from-amber-400 to-amber-500 text-stone-950 hover:brightness-110 shadow-xs"
                  title="Watch Sri Ganeshotsava 2026 Festival Darshan Video"
                >
                  <Video className="w-3.5 h-3.5 text-[#991B1B]" />
                  <span>Festival Video</span>
                </button>

                <button
                  onClick={() => setRequestDetailsModalOpen(true)}
                  className="px-2.5 py-1 rounded-full font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-all cursor-pointer text-[11px] bg-white/10 text-amber-200 hover:bg-white/20 border border-white/20 shadow-xs"
                  title="Contact festival coordinators"
                >
                  <PhoneCall className="w-3 h-3 text-amber-300" />
                  <span>Contact Us</span>
                </button>

                {/* User Profile Badge with Photo */}
                {userProfile && (
                  <div
                    className="px-2.5 py-1 rounded-full text-[11px] bg-white/15 text-white border border-white/20 inline-flex items-center gap-1.5 shadow-xs"
                    title={`Signed in as ${userProfile.name} (Flat: ${userProfile.flat}, Mobile: ${userProfile.mobile}, Email: ${userProfile.email})`}
                  >
                    {userProfile.photoUrl ? (
                      <img
                        src={userProfile.photoUrl}
                        alt={userProfile.name}
                        className="w-4 h-4 rounded-full object-cover border border-amber-300 shrink-0"
                      />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-amber-400 text-stone-900 flex items-center justify-center font-bold text-[9px] shrink-0">
                        {(userProfile.name || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="font-bold max-w-[120px] truncate hidden sm:inline">
                      {userProfile.name}
                    </span>
                    {userProfile.flat && (
                      <span className="text-[10px] text-amber-200 font-mono hidden md:inline">
                        [{userProfile.flat}]
                      </span>
                    )}
                  </div>
                )}

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="px-2.5 py-1 rounded-full font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors cursor-pointer text-[11px] bg-white/10 text-white hover:bg-white/20 border border-white/20 shadow-xs active:scale-95"
                  title="Sign out of portal"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              /* 3. ADMIN: FULL CONTROLS & MANAGEMENT */
              <>
                {/* Manual Live Cloud Refresh Button */}
                <button
                  onClick={() => triggerLiveServerSync(true)}
                  disabled={isRefreshing || isSaving}
                  className="px-2.5 py-1 rounded-full font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors cursor-pointer text-[11px] bg-white/10 text-amber-200 hover:text-white hover:bg-white/20 border border-white/20 shadow-xs disabled:opacity-50"
                  title="Refresh Data"
                >
                  <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-amber-300' : ''}`} />
                  <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                </button>

                {/* Save Button (Admin Only) */}
                <button
                  onClick={handleSaveAllToCloud}
                  disabled={isSaving || isRefreshing}
                  className={`px-3 py-1 rounded-full font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-all cursor-pointer text-[11px] shadow-xs ${
                    hasUnsavedChanges
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-emerald-300 ring-offset-1 ring-offset-[#991B1B]'
                      : 'bg-white/10 text-white/90 hover:bg-white/20 border border-white/20'
                  } disabled:opacity-50`}
                  title={hasUnsavedChanges ? 'Unsaved changes! Click to save modified data' : 'Save data'}
                >
                  <Save className={`w-3 h-3 ${isSaving ? 'animate-bounce' : ''}`} />
                  <span>{isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save *' : 'Save'}</span>
                </button>

                {/* Manage Devotee Roles Button (Admin Only) */}
                <button
                  onClick={() => {
                    setActiveTab('settings');
                    setSettingsSubTab('users');
                  }}
                  className="px-2.5 py-1 rounded-full font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors cursor-pointer text-[11px] bg-amber-400 text-stone-950 hover:bg-amber-300 shadow-xs"
                  title="Manage Devotee Roles: Assign Admin, Member, or Viewer permissions"
                >
                  <Users className="w-3 h-3 text-[#991B1B]" />
                  <span>Registered Users</span>
                </button>

                {/* Watch Festival Video & Darshan Button */}
                <button
                  onClick={() => setDarshanVideoModalOpen(true)}
                  className="px-2.5 py-1 rounded-full font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-all cursor-pointer text-[11px] bg-gradient-to-r from-amber-400 to-amber-500 text-stone-950 hover:brightness-110 shadow-xs"
                  title="Watch Sri Ganeshotsava 2026 Festival Darshan Video"
                >
                  <Video className="w-3.5 h-3.5 text-[#991B1B]" />
                  <span>Festival Video</span>
                </button>

                {/* Eldorado Kannadigara Balaga Page */}
                <button
                  onClick={navigateToBalagaInDev}
                  className="px-2.5 py-1 rounded-full font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors cursor-pointer text-[11px] bg-white/10 text-white hover:bg-white/20 border border-white/20 shadow-xs"
                  title="Open Eldorado Kannadigara Balaga Page (/homepageindevelop - Admin Only)"
                >
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span className="hidden sm:inline">Balaga</span>
                  <span className="text-[9px] bg-amber-400 text-stone-950 font-bold px-1 rounded">Admin</span>
                </button>

                {/* Devotee Sevas Booking Portal */}
                <button
                  onClick={navigateToSevas}
                  className="px-2.5 py-1 rounded-full font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors cursor-pointer text-[11px] bg-white/10 text-white hover:bg-white/20 border border-white/20 shadow-xs"
                  title="Open Devotee Seva Booking Portal (/ganeshotsavasevas - Admin Only)"
                >
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span className="hidden sm:inline">Sevas</span>
                  <span className="text-[9px] bg-amber-400 text-stone-950 font-bold px-1 rounded">Admin</span>
                </button>

                {/* Devotee Receipt Portal */}
                <button
                  onClick={navigateToReceipts}
                  className="px-2.5 py-1 rounded-full font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors cursor-pointer text-[11px] bg-white/10 text-white hover:bg-white/20 border border-white/20 shadow-xs"
                  title="Open Devotee Receipt Portal (/receipts - Admin Only)"
                >
                  <FileText className="w-3 h-3 text-amber-300" />
                  <span className="hidden sm:inline">Receipts</span>
                  <span className="text-[9px] bg-amber-400 text-stone-950 font-bold px-1 rounded">Admin</span>
                </button>

                {/* User Profile Badge */}
                {userProfile && (
                  <div
                    className="px-2.5 py-1 rounded-full text-[11px] bg-white/15 text-white border border-white/20 inline-flex items-center gap-1.5 shadow-xs"
                    title={`Logged in as ${userProfile.name} (Flat: ${userProfile.flat}, Mobile: ${userProfile.mobile}, Email: ${userProfile.email})`}
                  >
                    {userProfile.photoUrl ? (
                      <img
                        src={userProfile.photoUrl}
                        alt={userProfile.name}
                        className="w-4 h-4 rounded-full object-cover border border-amber-300 shrink-0"
                      />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-amber-400 text-stone-900 flex items-center justify-center font-bold text-[9px] shrink-0">
                        {(userProfile.name || 'A').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="font-bold max-w-[120px] truncate hidden sm:inline">
                      {userProfile.name}
                    </span>
                    {userProfile.flat && (
                      <span className="text-[10px] text-amber-200 font-mono hidden md:inline">
                        [{userProfile.flat}]
                      </span>
                    )}
                  </div>
                )}

                {/* Signout Button */}
                <button
                  onClick={handleLogout}
                  className="px-2.5 py-1 rounded-full font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors cursor-pointer text-[11px] bg-white/10 text-white hover:bg-white/20 border border-white/20 shadow-xs active:scale-95"
                  title="Sign out of management portal"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Signout</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* 2. PRIMARY FIRST-LEVEL NAVIGATION TABS */}
        <div className="bg-[#7F1D1D] border-t border-red-800/60 overflow-x-auto no-scrollbar">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 sm:gap-2 text-xs font-bold uppercase tracking-wider py-1">
            {isAdmin ? (
              <>
                {/* Admin Tab 1: Income & Expenditure statement */}
                <button
                  onClick={() => setActiveTab('statement')}
                  className={`px-3.5 py-2 rounded-t font-semibold transition-all inline-flex items-center gap-2 cursor-pointer border-b-2 whitespace-nowrap ${
                    activeTab === 'statement'
                      ? 'bg-[#FDFBF7] text-[#991B1B] border-amber-400 shadow-xs'
                      : 'text-white/85 hover:text-white hover:bg-red-900/50 border-transparent'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Income &amp; Expenditure statement</span>
                </button>

                {/* Admin Tab 2: Income(receipts) */}
                <button
                  onClick={() => setActiveTab('income')}
                  className={`px-3.5 py-2 rounded-t font-semibold transition-all inline-flex items-center gap-2 cursor-pointer border-b-2 whitespace-nowrap ${
                    activeTab === 'income'
                      ? 'bg-[#FDFBF7] text-[#991B1B] border-amber-400 shadow-xs'
                      : 'text-white/85 hover:text-white hover:bg-red-900/50 border-transparent'
                  }`}
                >
                  <Coins className="w-4 h-4" />
                  <span>Income(receipts)</span>
                  <span className="bg-amber-400 text-[#991B1B] text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
                    ₹{fmt(totalIncome)}
                  </span>
                </button>

                {/* Admin Tab 3: Expenditure(payments) */}
                <button
                  onClick={() => setActiveTab('expenditure')}
                  className={`px-3.5 py-2 rounded-t font-semibold transition-all inline-flex items-center gap-2 cursor-pointer border-b-2 whitespace-nowrap ${
                    activeTab === 'expenditure'
                      ? 'bg-[#FDFBF7] text-[#991B1B] border-amber-400 shadow-xs'
                      : 'text-white/85 hover:text-white hover:bg-red-900/50 border-transparent'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Expenditure(payments)</span>
                  <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
                    ₹{fmt(exAct)}
                  </span>
                </button>

                {/* Admin Tab 4: Settings */}
                <button
                  onClick={() => {
                    setActiveTab('settings');
                    setSettingsSubTab('general');
                  }}
                  className={`px-3.5 py-2 rounded-t font-semibold transition-all inline-flex items-center gap-2 cursor-pointer border-b-2 whitespace-nowrap ${
                    activeTab === 'settings'
                      ? 'bg-[#FDFBF7] text-[#991B1B] border-amber-400 shadow-xs'
                      : 'text-white/85 hover:text-white hover:bg-red-900/50 border-transparent'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>
              </>
            ) : isReadOnly ? (
              <>
                {/* Read-Only Tab 1: Income & Expenditure statement */}
                <button
                  onClick={() => setActiveTab('statement')}
                  className={`px-3.5 py-2 rounded-t font-semibold transition-all inline-flex items-center gap-2 cursor-pointer border-b-2 whitespace-nowrap ${
                    activeTab === 'statement'
                      ? 'bg-[#FDFBF7] text-[#991B1B] border-amber-400 shadow-xs'
                      : 'text-white/85 hover:text-white hover:bg-red-900/50 border-transparent'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Income &amp; Expenditure statement</span>
                </button>

                {/* Read-Only Tab 2: Income(receipts) (Complete View) */}
                <button
                  onClick={() => setActiveTab('income')}
                  className={`px-3.5 py-2 rounded-t font-semibold transition-all inline-flex items-center gap-2 cursor-pointer border-b-2 whitespace-nowrap ${
                    activeTab === 'income'
                      ? 'bg-[#FDFBF7] text-[#991B1B] border-amber-400 shadow-xs'
                      : 'text-white/85 hover:text-white hover:bg-red-900/50 border-transparent'
                  }`}
                >
                  <Coins className="w-4 h-4" />
                  <span>Income(receipts)</span>
                  <span className="bg-amber-400 text-[#991B1B] text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
                    ₹{fmt(totalIncome)}
                  </span>
                </button>

                {/* Read-Only Tab 3: Expenditure(payments) */}
                <button
                  onClick={() => setActiveTab('expenditure')}
                  className={`px-3.5 py-2 rounded-t font-semibold transition-all inline-flex items-center gap-2 cursor-pointer border-b-2 whitespace-nowrap ${
                    activeTab === 'expenditure'
                      ? 'bg-[#FDFBF7] text-[#991B1B] border-amber-400 shadow-xs'
                      : 'text-white/85 hover:text-white hover:bg-red-900/50 border-transparent'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Expenditure(payments)</span>
                  <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
                    ₹{fmt(exAct)}
                  </span>
                </button>
              </>
            ) : (
              /* UNASSIGNED / BASIC USERS: STRICTLY ONLY 2 TABS */
              <>
                {/* Unassigned Tab 1: Income & Expenditure statement */}
                <button
                  onClick={() => setActiveTab('statement')}
                  className={`px-3.5 py-2 rounded-t font-semibold transition-all inline-flex items-center gap-2 cursor-pointer border-b-2 whitespace-nowrap ${
                    activeTab === 'statement'
                      ? 'bg-[#FDFBF7] text-[#991B1B] border-amber-400 shadow-xs'
                      : 'text-white/85 hover:text-white hover:bg-red-900/50 border-transparent'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Income &amp; Expenditure statement</span>
                </button>

                {/* Unassigned Tab 2: Expenditure(payments) */}
                <button
                  onClick={() => setActiveTab('expenditure')}
                  className={`px-3.5 py-2 rounded-t font-semibold transition-all inline-flex items-center gap-2 cursor-pointer border-b-2 whitespace-nowrap ${
                    activeTab === 'expenditure'
                      ? 'bg-[#FDFBF7] text-[#991B1B] border-amber-400 shadow-xs'
                      : 'text-white/85 hover:text-white hover:bg-red-900/50 border-transparent'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Expenditure(payments)</span>
                  <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
                    ₹{fmt(exAct)}
                  </span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* 3. FLOATING SUB-LEVEL NAVIGATION TABS (Admin & Read-Only Complete) */}
        {(isAdmin || isReadOnly) && activeTab === 'income' && (
          <div className="bg-[#F8EFE5] border-t border-red-800/40 border-b border-stone-300 shadow-md overflow-x-auto no-scrollbar">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-1.5 sm:gap-2">
              {/* Sub-tab 1: Voluntary Contributions Resident */}
              <button
                onClick={() => setActiveIncomeSubTab('donations')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeIncomeSubTab === 'donations'
                    ? 'bg-[#991B1B] text-white shadow-xs'
                    : 'bg-white text-stone-700 hover:bg-stone-200 border border-stone-300'
                }`}
              >
                <span>Voluntary Contributions Resident</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeIncomeSubTab === 'donations' ? 'bg-white/25 text-white' : 'bg-stone-100 text-stone-600'
                }`}>
                  {contributions.length}
                </span>
              </button>

              {/* Sub-tab 2: Sponsorship (Admin and Members) */}
              {(isAdmin || isMember || isReadOnly) && (
                <button
                  onClick={() => setActiveIncomeSubTab('sponsorship')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    activeIncomeSubTab === 'sponsorship'
                      ? 'bg-[#991B1B] text-white shadow-xs'
                      : 'bg-white text-stone-700 hover:bg-stone-200 border border-stone-300'
                  }`}
                >
                  <span>Sponsorship</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    activeIncomeSubTab === 'sponsorship' ? 'bg-white/25 text-white' : 'bg-stone-100 text-stone-600'
                  }`}>
                    {sponsors.length}
                  </span>
                </button>
              )}

              {/* Sub-tab 3: Education Fest (Admin and Members) */}
              {(isAdmin || isMember || isReadOnly) && (
                <button
                  onClick={() => setActiveIncomeSubTab('stalls')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    activeIncomeSubTab === 'stalls'
                      ? 'bg-[#991B1B] text-white shadow-xs'
                      : 'bg-white text-stone-700 hover:bg-stone-200 border border-stone-300'
                  }`}
                >
                  <span>EDUCATION FEST</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    activeIncomeSubTab === 'stalls' ? 'bg-white/25 text-white' : 'bg-stone-100 text-stone-600'
                  }`}>
                    {commercialStalls.length}
                  </span>
                </button>
              )}

              {/* Sub-tab 4: sevas */}
              <button
                onClick={() => setActiveIncomeSubTab('sevas')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeIncomeSubTab === 'sevas'
                    ? 'bg-[#991B1B] text-white shadow-xs'
                    : 'bg-white text-stone-700 hover:bg-stone-200 border border-stone-300'
                }`}
              >
                <span>Sevas</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeIncomeSubTab === 'sevas' ? 'bg-white/25 text-white' : 'bg-stone-100 text-stone-600'
                }`}>
                  {sevas.length}
                </span>
              </button>

              {/* Sub-tab 5: Hundi */}
              <button
                onClick={() => setActiveIncomeSubTab('hundi')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeIncomeSubTab === 'hundi'
                    ? 'bg-[#991B1B] text-white shadow-xs'
                    : 'bg-white text-stone-700 hover:bg-stone-200 border border-stone-300'
                }`}
              >
                <span>Hundi</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeIncomeSubTab === 'hundi' ? 'bg-white/25 text-white' : 'bg-stone-100 text-stone-600'
                }`}>
                  {hundi.length}
                </span>
              </button>

              {/* Sub-tab 6: Auctions */}
              <button
                onClick={() => setActiveIncomeSubTab('auctions')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeIncomeSubTab === 'auctions'
                    ? 'bg-[#991B1B] text-white shadow-xs'
                    : 'bg-white text-stone-700 hover:bg-stone-200 border border-stone-300'
                }`}
              >
                <span>Auctions</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeIncomeSubTab === 'auctions' ? 'bg-white/25 text-white' : 'bg-stone-100 text-stone-600'
                }`}>
                  {auctions.length}
                </span>
              </button>
            </div>
          </div>
        )}
      </header>
 
      {/* Quota-Limited Notification Banner */}
      {syncStatus === 'quota-limited' && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-900 shadow-2xs">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
              <span>
                <strong>Offline Ledger Active:</strong> Cloud daily read limit reached. All community records, calculations, devotee receipt downloads, and updates remain fully active and saved in your browser.
              </span>
            </div>
            <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded self-start sm:self-auto whitespace-nowrap">
              Cloud Quota Resets Daily
            </span>
          </div>
        </div>
      )}

      {/* 4. MAIN BODY CONTAINER */}
      <main id="mainAppContent" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6">
        {/* Banner for Unassigned / Basic Devotee Users */}
        {isUnassigned && (
          <div className="mb-5 bg-gradient-to-r from-amber-50 via-white to-amber-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-full bg-amber-400 text-stone-900">
                  <Sparkles className="w-4 h-4" />
                </span>
                <h3 className="font-serif font-bold text-stone-900 text-sm sm:text-base">
                  High-Level Summary View
                </h3>
              </div>
              <p className="text-xs text-stone-600">
                You are viewing summary Income &amp; Expenditure statements and expenditures. Need itemized contribution receipts, vendor bill proofs, or audit ledgers?
              </p>
            </div>
            <button
              type="button"
              onClick={() => setRequestDetailsModalOpen(true)}
              className="bg-[#991B1B] hover:bg-[#7F1D1D] text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <PhoneCall className="w-3.5 h-3.5 text-amber-300" />
              <span>Contact Us for More Details</span>
            </button>
          </div>
        )}

        {/* TAB 1: Income & Expenditure Statement */}
        {activeTab === 'statement' && (
          <StatementView
            expenses={expenses}
            contributions={contributions}
            sponsors={sponsors}
            commercialStalls={commercialStalls}
            sevas={sevas}
            hundi={hundi}
            auctions={auctions}
            settings={settings}
            userRole={userRole || undefined}
            isAdmin={isAdmin}
            isMember={isMember || isReadOnly}
            onNavigateToTab={(subTab) => {
              setActiveTab('income');
              setActiveIncomeSubTab(subTab);
            }}
            onPrintInvoice={s => {
              setPrintData({ type: 'invoice', subType: 'stall', item: s });
              setReceiptModalOpen(true);
            }}
            onAddStall={() => {
              setActiveTab('income');
              setActiveIncomeSubTab('stalls');
            }}
            onShareWhatsApp={shareWhatsAppSummary}
            onExportExcel={handleExportExcel}
            onPrint={triggerDirectPrint}
          />
        )}

        {/* TAB 2: Income(receipts) with sub-tabs */}
        {activeTab === 'income' && (
          <div>
            {activeIncomeSubTab === 'donations' && (
              <DonationsView
                contributions={contributions}
                isAdmin={isAdmin}
                settings={settings}
                userProfile={userProfile}
                onSave={handleSaveContribution}
                onDelete={handleDeleteContribution}
                onBulkImport={handleBulkImportContributions}
                onPrintReceipt={c => {
                  setPrintData({ type: 'receipt', subType: 'contribution', item: c });
                  setReceiptModalOpen(true);
                }}
                onOpenReceiptPortal={navigateToReceipts}
                onUpdateSettings={handleSaveSettings}
              />
            )}

            {activeIncomeSubTab === 'sponsorship' && (isAdmin || isMember || isReadOnly) && (
              <SponsorshipView
                sponsors={sponsors}
                isAdmin={isAdmin}
                onSave={handleSaveSponsor}
                onDelete={handleDeleteSponsor}
                onPrintInvoice={s => {
                  setPrintData({ type: 'invoice', subType: 'sponsor', item: s });
                  setReceiptModalOpen(true);
                }}
              />
            )}

            {activeIncomeSubTab === 'stalls' && (isAdmin || isMember || isReadOnly) && (
              <CommercialStallsView
                stalls={commercialStalls}
                isAdmin={isAdmin}
                onSave={handleSaveCommercialStall}
                onDelete={handleDeleteCommercialStall}
                onPrintInvoice={s => {
                  setPrintData({ type: 'invoice', subType: 'stall', item: s });
                  setReceiptModalOpen(true);
                }}
              />
            )}

            {activeIncomeSubTab === 'sevas' && (
              <SevasView
                sevas={sevas}
                catalogue={sevaCatalogue}
                isAdmin={isAdmin}
                settings={settings}
                onSaveBooking={handleSaveSeva}
                onDeleteBooking={handleDeleteSeva}
                onSaveCatalogue={handleSaveSevaCatalogue}
                onDeleteCatalogue={handleDeleteSevaCatalogue}
                onOpenPublicSevaPortal={navigateToSevas}
                onUpdateSettings={handleSaveSettings}
                onPrintReceipt={v => {
                  setPrintData({ type: 'receipt', subType: 'seva', item: { ...v, isSeva: true } });
                  setReceiptModalOpen(true);
                }}
              />
            )}

            {activeIncomeSubTab === 'hundi' && (isAdmin || isReadOnly) && (
              <HundiView
                hundi={hundi}
                isAdmin={isAdmin}
                onSave={handleSaveHundi}
                onDelete={handleDeleteHundi}
              />
            )}

            {activeIncomeSubTab === 'auctions' && (isAdmin || isReadOnly) && (
              <AuctionsView
                auctions={auctions}
                isAdmin={isAdmin}
                onSave={handleSaveAuction}
                onDelete={handleDeleteAuction}
                onPrintInvoice={a => {
                  setPrintData({ type: 'invoice', subType: 'auction', item: a });
                  setReceiptModalOpen(true);
                }}
              />
            )}
          </div>
        )}

        {/* TAB 3: Expenditure(payments) */}
        {activeTab === 'expenditure' && (
          <ExpenditureView
            expenses={expenses}
            isAdmin={isAdmin}
            onSave={handleSaveExpense}
            onDelete={handleDeleteExpense}
          />
        )}

        {/* TAB 4: Settings (Admin Only) */}
        {activeTab === 'settings' && isAdmin && (
          <SettingsView
            settings={settings}
            isAdmin={isAdmin}
            defaultSubTab={settingsSubTab}
            currentAdminEmail={currentEmail}
            onSaveSettings={handleSaveSettings}
            onExportExcel={handleExportExcel}
            onSaveHTML={handleSaveHTML}
            onOpenAdminManagement={() => setAdminManagementModalOpen(true)}
            onClearAllData={async () => {
              try {
                localStorage.clear();
              } catch {}
              setExpenses([]);
              setContributions([]);
              setSponsors([]);
              setCommercialStalls([]);
              setSevas([]);
              setHundi([]);
              setAuctions([]);
              setCounters({});
              countersRef.current = {};
              try {
                await cloudClearAllData();
              } catch (err) {
                console.warn('Cloud clear warning', err);
              }
              alert('All data reset in Firebase.');
            }}
          />
        )}
      </main>

      {/* 5. OFFICIAL RECEIPT & INVOICE PREVIEW MODAL */}
      <ReceiptInvoiceModal
        open={receiptModalOpen}
        printData={printData}
        settings={settings}
        isGeneratingPdf={isGeneratingPdf}
        onClose={() => setReceiptModalOpen(false)}
        onDirectPrint={triggerDirectPrint}
        onDownloadPdf={handleDownloadReceiptPDF}
        onShareWhatsApp={handleShareReceiptPDFWhatsApp}
        modalQrRef={modalQrRef}
      />

      {/* 6. ADMIN DEVOTEE ROLES MANAGEMENT MODAL */}
      <AdminManagementModal
        isOpen={adminManagementModalOpen}
        onClose={() => setAdminManagementModalOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        currentAdminEmail={currentEmail}
      />

      {/* 7. DEVOTEE DETAILED ACCESS REQUEST / CONTACT US MODAL */}
      <RequestDetailsModal
        isOpen={requestDetailsModalOpen}
        onClose={() => setRequestDetailsModalOpen(false)}
        userProfile={userProfile}
        settings={settings}
        onRequestSubmitted={() => {
          setSyncToast({
            message: 'Your access request has been sent to the festival administrator.',
            type: 'success'
          });
          setTimeout(() => setSyncToast(null), 4000);
        }}
      />

      {/* 8. FESTIVAL VIDEO & GRAND DARSHAN MODAL */}
      {darshanVideoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in">
          <div className="bg-stone-950 border-2 border-amber-400 rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl space-y-0 my-4">
            <div className="bg-[#991B1B] text-white p-3.5 px-5 flex items-center justify-between border-b border-amber-400 shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <h3 className="font-serif font-black text-sm sm:text-base text-amber-200">
                  ಶ್ರೀ ಗಣೇಶೋತ್ಸವ ೨೦೨೬ ಮಹಾದರ್ಶನ &bull; Grand Festival Darshan Video
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDarshanVideoModalOpen(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
                title="Close video"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 sm:p-5">
              <GaneshaFestivalVideoShowcase />
            </div>
          </div>
        </div>
      )}

      {/* 8. REAL-TIME CLOUD SYNC TOAST NOTIFICATION */}
      {syncToast && (
        <div
          className={`fixed bottom-4 right-4 z-50 bg-stone-900/95 text-white text-xs px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-2.5 backdrop-blur-md max-w-md transition-all animate-in fade-in slide-in-from-bottom-3 duration-200 ${
            syncToast.type === 'error' ? 'border-rose-500/60 text-rose-100' : 'border-emerald-500/60'
          }`}
        >
          {syncToast.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span className="font-medium leading-relaxed">{syncToast.message}</span>
        </div>
      )}
    </div>
  );
}

export default App;

