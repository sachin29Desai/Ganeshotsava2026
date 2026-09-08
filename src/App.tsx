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
  Users2
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
  UserRole
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
  getExpenseActual
} from './utils/helpers';
import { generateStandaloneHTML } from './utils/htmlExporter';
import {
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
  SyncStatus
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
import {
  getReceiptDocumentTitle,
  getReceiptPdfFilename,
  downloadBlobAsFile,
  generateReceiptPdfBlob
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
  // Purge any historical on-device localStorage items so NO application data is stored on the device
  useEffect(() => {
    try {
      const keysToRemove = [
        'eg_expenses',
        'eg_contributions',
        'eg_sponsors',
        'eg_commercial_stalls',
        'eg_sevas',
        'eg_seva_catalogue',
        'eg_hundi',
        'eg_auctions',
        'eg_settings',
        'eg_rc_num',
        'eg_sp_num',
        'eg_cs_num',
        'eg_sv_num',
        'eg_auc_num'
      ];
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch {}
  }, []);

  // --- Live Application State (Purely sourced from Firebase) ---
  const [expenses, setExpenses] = useState<Expense[]>(() => window.__E__?.expenses || []);
  const [contributions, setContributions] = useState<Contribution[]>(() => window.__E__?.contributions || []);
  const [sponsors, setSponsors] = useState<Sponsor[]>(() => window.__E__?.sponsors || []);
  const [commercialStalls, setCommercialStalls] = useState<CommercialStall[]>(() => window.__E__?.commercialStalls || []);
  const [sevas, setSevas] = useState<SevaBooking[]>(() => window.__E__?.sevas || []);
  const [sevaCatalogue, setSevaCatalogue] = useState<SevaCatalogueItem[]>(() => window.__E__?.sevaCatalogue || DEFAULT_SEVAS);
  const [hundi, setHundi] = useState<HundiCollection[]>(() => window.__E__?.hundi || []);
  const [auctions, setAuctions] = useState<AuctionItem[]>(() => window.__E__?.auctions || []);
  const [settings, setSettings] = useState<AppSettings>(() => window.__E__?.settings || INITIAL_STATE.settings);

  // In-memory counters synced with Firestore metadata/counters
  const [counters, setCounters] = useState<{
    rc?: string | null;
    sp?: string | null;
    cs?: string | null;
    sv?: string | null;
    auc?: string | null;
  }>({});
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

  // Dedicated Isolated Public Devotee Receipt Portal check
  const checkIsReceiptPortal = () => {
    if (typeof window === 'undefined') return false;
    const path = (window.location.pathname || '').toLowerCase().replace(/\/+$/, '');
    const isPathMatch = path === '/receipts' || path === '/receipt' || path === '/portal' || path === '/download';
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash.toLowerCase();
    return (
      isPathMatch ||
      params.get('view') === 'receipts' ||
      params.get('portal') === 'receipts' ||
      params.has('receipt-portal') ||
      params.has('receipts') ||
      hash === '#receipt-portal' ||
      hash === '#receipts' ||
      hash === '#receipt'
    );
  };

  const [isReceiptPortal, setIsReceiptPortal] = useState<boolean>(checkIsReceiptPortal);

  useEffect(() => {
    const handleUrlChange = () => {
      setIsReceiptPortal(checkIsReceiptPortal());
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // --- Committee Authentication & Multi-Role Access Control (3-Tiers) ---
  // Tier 1: Admin - Super User, all access to view & modify data, settings, export, sync
  // Tier 2: Sponsor - Read-only access to view all data (cannot modify)
  // Tier 3: Volunteer - Read-only access, restricted from Sponsorship & Commercial Stalls tabs
  const [userRole, setUserRole] = useState<UserRole | null>(() => {
    if (typeof window === 'undefined') return null;
    const auth = sessionStorage.getItem('eg_committee_auth') === 'true';
    if (!auth) return null;
    const r = sessionStorage.getItem('eg_user_role') as UserRole;
    return r || 'admin';
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('eg_committee_auth') === 'true';
  });
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const auth = sessionStorage.getItem('eg_committee_auth') === 'true';
    const r = sessionStorage.getItem('eg_user_role');
    return auth && (r === 'admin' || !r);
  });

  // Guard restricted tabs for Volunteers
  useEffect(() => {
    if (userRole === 'volunteer') {
      if (activeIncomeSubTab === 'sponsorship' || activeIncomeSubTab === 'stalls') {
        setActiveIncomeSubTab('donations');
      }
    }
  }, [userRole, activeIncomeSubTab]);

  // Guard settings for Non-Admins
  useEffect(() => {
    if (userRole && userRole !== 'admin' && activeTab === 'settings') {
      setActiveTab('statement');
    }
  }, [userRole, activeTab]);
  const [viewOnly, setViewOnly] = useState(false);
  const [activeFileHandle, setActiveFileHandle] = useState<FileSystemFileHandle | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('connecting');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const hasUnsavedChangesRef = useRef(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

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
      console.error('Failed to fetch direct server data:', err);
      if (manual) {
        setSyncToast(err?.message || 'Failed to refresh data');
        setTimeout(() => setSyncToast(null), 3000);
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
    // Zero on-device storage. Live state is saved and synced exclusively to Firebase.
    window.__E__ = getCurrentState();

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
      }
    }
    hasUnsavedChangesRef.current = true;
    setHasUnsavedChanges(true);
  };

  const handleDeleteContribution = (id: string) => {
    setContributions(prev => prev.filter(x => x.id !== id));
    hasUnsavedChangesRef.current = true;
    setHasUnsavedChanges(true);
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
    setContributions(prev => [...prev, ...newItems]);
    hasUnsavedChangesRef.current = true;
    setHasUnsavedChanges(true);
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
      }
    }
    hasUnsavedChangesRef.current = true;
    setHasUnsavedChanges(true);
  };

  const handleDeleteSponsor = (id: string) => {
    setSponsors(prev => prev.filter(x => x.id !== id));
    hasUnsavedChangesRef.current = true;
    setHasUnsavedChanges(true);
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
      }
    }
    hasUnsavedChangesRef.current = true;
    setHasUnsavedChanges(true);
  };

  const handleDeleteCommercialStall = (id: string) => {
    setCommercialStalls(prev => prev.filter(x => x.id !== id));
    hasUnsavedChangesRef.current = true;
    setHasUnsavedChanges(true);
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
      }
    }
    hasUnsavedChangesRef.current = true;
    setHasUnsavedChanges(true);
  };

  const handleDeleteSeva = (id: string) => {
    setSevas(prev => prev.filter(x => x.id !== id));
    hasUnsavedChangesRef.current = true;
    setHasUnsavedChanges(true);
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
  };

  const handleDeleteSevaCatalogue = (id: string) => {
    setSevaCatalogue(prev => prev.filter(x => x.id !== id));
    hasUnsavedChangesRef.current = true;
    setHasUnsavedChanges(true);
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
      await cloudSyncAllData(getCurrentState());
      hasUnsavedChangesRef.current = false;
      setHasUnsavedChanges(false);
      setSyncToast('Data saved successfully');
      setTimeout(() => setSyncToast(null), 3000);
    } catch (err: any) {
      console.error('Failed to save data:', err);
      setSyncToast(err?.message || 'Failed to save data. Please retry.');
      setTimeout(() => setSyncToast(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  // Committee Login Success handler
  const handleLoginSuccess = (role: UserRole = 'admin') => {
    sessionStorage.setItem('eg_committee_auth', 'true');
    sessionStorage.setItem('eg_user_role', role);
    setUserRole(role);
    setIsAuthenticated(true);
    setIsAdmin(role === 'admin');
  };

  // Committee Logout & Lock handler
  const handleLogout = () => {
    sessionStorage.removeItem('eg_committee_auth');
    sessionStorage.removeItem('eg_user_role');
    setUserRole(null);
    setIsAuthenticated(false);
    setIsAdmin(false);
  };

  // Lock / Sign out handler
  const handleToggleAdmin = async () => {
    if (window.confirm('Lock the management portal and sign out?')) {
      handleLogout();
    }
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
        msg = `🙏 *Seva Booking Official Receipt — PDF Attached*\n\n*${settings.org || 'Brigade Eldorado Residents Association'}*\n3rd Year Ganeshotsava (14th – 18th Sept 2026)\n\n🎟️ Token No: ${printData.item.tokNo}\n🪔 Seva: ${printData.item.seva}\n📅 Date: ${fmtDate(printData.item.date)}\n👤 Devotee: ${printData.item.name}\n🏠 Flat: ${printData.item.flat}\n💰 Amount: ₹${fmt(printData.item.amt)} (${numWords(printData.item.amt)})\n\n📄 *Official PDF receipt with Digital Signature & Watermark is attached.*\n\nThank you for your seva and devotional support 🙏\n*Ganapati Bappa Morya!*`;
      } else {
        msg = `🪔 *Voluntary Resident Contribution Receipt — PDF Attached*\n\n*${settings.org || 'Brigade Eldorado Residents Association'}*\n3rd Year Ganeshotsava (14th – 18th Sept 2026)\n\n📋 Receipt No: ${printData.item.rcptNo}\n📅 Date: ${fmtDate(printData.item.date)}\n👤 Contributor: ${printData.item.name}\n🏠 Flat: ${printData.item.flat}\n💳 Payment: ${printData.item.pay || 'UPI'}${printData.item.txn ? ' (Ref: ' + printData.item.txn + ')' : ''}\n💰 Amount: ₹${fmt(printData.item.amt)} (${numWords(printData.item.amt)})${printData.item.notes ? '\n📝 Notes: ' + printData.item.notes : ''}\n\n📄 *Official PDF receipt with Digital Signature & Watermark is attached.*\n\nThank you for your generous contribution 🙏\n*Ganapati Bappa Morya!*`;
      }
    } else {
      const typeLabel = printData.subType === 'stall' ? 'Commercial Stall Invoice' : printData.subType === 'auction' ? 'Auction Winning Bid Invoice' : 'Sponsorship Invoice';
      msg = `📄 *${typeLabel} — PDF Attached*\n\n*${settings.org || 'Brigade Eldorado Residents Association'}*\n3rd Year Ganeshotsava (14th – 18th Sept 2026)\n\n🔖 Invoice No: ${printData.item.invNo}\n📅 Date: ${new Date().toLocaleDateString('en-IN')}\n🏢 Particulars: ${printData.item.det}\n💰 Amount: ₹${fmt(printData.item.act || printData.item.amt)} (${numWords(printData.item.act || printData.item.amt)})\n\n📄 *Official Invoice PDF with Digital Signature & Watermark is attached.*\n\nThank you for your generous partnership & support! 🙏\n*Ganapati Bappa Morya!*`;
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
    const msg = `📊 *Ganeshotsava 2026 — Income & Expenditure Statement*\n*${settings.org || 'Brigade Eldorado'}*\n\n💰 *INCOME (RECEIPTS)*\n• Voluntary Contributions: ₹${fmt(ctTot)}\n• Sponsorship: ₹${fmt(spAct)}\n• Commercial Stalls: ₹${fmt(csAct)}\n• Seva Bookings: ₹${fmt(svTot)}\n• Hundi Collection: ₹${fmt(hundiTot)}\n• Auctions: ₹${fmt(aucTot)}\n▶ *Total Income: ₹${fmt(totalIncome)}*\n\n📤 *EXPENDITURE (PAYMENTS)*\n• Actual Incurred: ₹${fmt(exAct)}\n▶ *Total Expenditure: ₹${fmt(exAct)}*\n\n${netBalance >= 0 ? '✅' : '⚠️'} *Net Surplus/(Deficit): ₹${fmt(Math.abs(netBalance))}${netBalance < 0 ? ' (Deficit)' : ' (Surplus)'}*\n\n_Ganapati Bappa Morya!_ 🪔`;
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
      // Remove any existing print frame
      const oldFrame = document.getElementById('receipt-print-iframe');
      if (oldFrame) oldFrame.remove();

      const printFrame = document.createElement('iframe');
      printFrame.id = 'receipt-print-iframe';
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = '0';
      printFrame.style.opacity = '0';
      printFrame.style.pointerEvents = 'none';
      document.body.appendChild(printFrame);

      const frameDoc = printFrame.contentWindow?.document || printFrame.contentDocument;
      if (frameDoc) {
        // Collect existing styles and external stylesheet links
        const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
          .map(el => el.outerHTML)
          .join('\n');

        const isRcpt = printData?.type === 'receipt';
        const num = isRcpt ? (printData?.item?.rcptNo || printData?.item?.tokNo || '') : (printData?.item?.invNo || '');
        const flat = printData?.item?.flat || '';
        const docTitle = getReceiptDocumentTitle(isRcpt, num, flat);

        frameDoc.open();
        frameDoc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>${docTitle}</title>
              <link rel="preconnect" href="https://fonts.googleapis.com">
              <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
              <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Great+Vibes&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&family=Playfair+Display:ital,wght@0,600;0,700;0,900;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
              ${styles}
              <style>
                * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }
                body { margin: 0; padding: 12px; background: #fff !important; font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; }
                .font-serif { font-family: 'Playfair Display', Georgia, serif; }
                .font-mono { font-family: 'JetBrains Mono', monospace; }
                .font-signature { font-family: 'Great Vibes', 'Dancing Script', cursive; }
                #isolated-receipt-wrapper { max-width: 650px; margin: 0 auto; background: #fff; }
                @page { size: A4 portrait; margin: 10mm 12mm; }
              </style>
            </head>
            <body>
              <div id="isolated-receipt-wrapper">
                ${element.outerHTML}
              </div>
            </body>
          </html>
        `);
        frameDoc.close();

        setTimeout(() => {
          try {
            printFrame.contentWindow?.focus();
            printFrame.contentWindow?.print();
          } catch (e) {
            console.error('Frame print failed:', e);
            window.print();
          }
        }, 350);
        return;
      }
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
      ['Organization', settings.org || 'Brigade Eldorado'],
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

  // If visiting the public receipt portal link, render ONLY the isolated receipt search and download page.
  // Completely public and accessible by ANY resident/devotee without password!
  if (isReceiptPortal) {
    return (
      <PublicReceiptPortal
        contributions={contributions}
        settings={settings}
        onBackToApp={
          isAuthenticated
            ? () => {
                const url = new URL(window.location.href);
                url.searchParams.delete('view');
                url.searchParams.delete('portal');
                url.searchParams.delete('receipt-portal');
                url.searchParams.delete('receipts');
                url.searchParams.delete('q');
                url.searchParams.delete('flat');
                url.searchParams.delete('name');
                url.searchParams.delete('rcpt');
                url.pathname = '/';
                url.hash = '';
                window.history.pushState({}, '', '/');
                setIsReceiptPortal(false);
              }
            : undefined
        }
      />
    );
  }

  // If visiting the root or main application link without /receipts, and NOT yet authenticated,
  // require Committee Authentication before showing ANY financial data, statements, or expenses!
  if (!isAuthenticated) {
    return (
      <CommitteeAuthGate
        settings={settings}
        onSuccess={handleLoginSuccess}
        onGoToReceiptPortal={() => {
          window.history.pushState({}, '', '/receipts');
          setIsReceiptPortal(true);
        }}
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
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-amber-400 text-[#991B1B] flex items-center justify-center font-bold font-serif text-xl shadow-inner select-none shrink-0">
                🪔
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-serif font-black tracking-wide leading-tight">
                  {settings.org || 'Brigade Eldorado Residents Association'}
                </h1>
                <span className="hidden sm:inline-block bg-amber-400 text-stone-900 text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wider uppercase">
                  3rd Year
                </span>
                {userRole === 'admin' && (
                  <span className="bg-amber-300 text-[#7F1D1D] text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 uppercase tracking-wider shadow-2xs">
                    <Crown className="w-3 h-3 text-[#991B1B]" />
                    <span>Super Admin</span>
                  </span>
                )}
                {userRole === 'sponsor' && (
                  <span className="bg-amber-200 text-amber-950 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 uppercase tracking-wider shadow-2xs">
                    <Briefcase className="w-3 h-3 text-amber-800" />
                    <span>Sponsors (View Only)</span>
                  </span>
                )}
                {userRole === 'volunteer' && (
                  <span className="bg-stone-200 text-stone-900 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 uppercase tracking-wider shadow-2xs">
                    <Users2 className="w-3 h-3 text-stone-700" />
                    <span>Volunteers (Restricted)</span>
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
            {isAdmin && (
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
            )}

            {/* Direct Devotee Portal Quick Switch */}
            <button
              onClick={() => {
                window.history.pushState({}, '', '/receipts');
                setIsReceiptPortal(true);
              }}
              className="px-2.5 py-1 rounded-full font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors cursor-pointer text-[11px] bg-amber-400 text-stone-950 hover:bg-amber-300 shadow-xs"
              title="Open Public Devotee Receipt Portal"
            >
              <FileText className="w-3 h-3 text-[#991B1B]" />
              <span>Devotee Portal</span>
            </button>

            {/* Lock / Logout Button */}
            <button
              onClick={handleToggleAdmin}
              className="px-2.5 py-1 rounded-full font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors cursor-pointer text-[11px] bg-white/10 text-white hover:bg-white/20 border border-white/20"
              title="Lock management portal and sign out"
            >
              <LogOut className="w-3 h-3" />
              <span>Lock &amp; Sign Out</span>
            </button>
          </div>
        </div>

        {/* 2. PRIMARY FIRST-LEVEL NAVIGATION TABS */}
        <div className="bg-[#7F1D1D] border-t border-red-800/60 overflow-x-auto no-scrollbar">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 sm:gap-2 text-xs font-bold uppercase tracking-wider py-1">
            {/* Tab 1: Income & Expenditure statement */}
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

            {/* Tab 2: Income(receipts) */}
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

            {/* Tab 3: Expenditure(payments) */}
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

            {/* Tab 4: Settings (Admin Only) */}
            {isAdmin && (
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-3.5 py-2 rounded-t font-semibold transition-all inline-flex items-center gap-2 cursor-pointer border-b-2 whitespace-nowrap ${
                  activeTab === 'settings'
                    ? 'bg-[#FDFBF7] text-[#991B1B] border-amber-400 shadow-xs'
                    : 'text-white/85 hover:text-white hover:bg-red-900/50 border-transparent'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. FLOATING SUB-LEVEL NAVIGATION TABS (Inside sticky header: continuously floats while scrolling through data) */}
        {activeTab === 'income' && (
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

              {/* Sub-tab 2: Sponsorship (Hidden for Volunteers) */}
              {userRole !== 'volunteer' && (
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

              {/* Sub-tab 3: Education Fest (Hidden for Volunteers) */}
              {userRole !== 'volunteer' && (
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

      {/* 4. MAIN BODY CONTAINER */}
      <main id="mainAppContent" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6">
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
                onSave={handleSaveContribution}
                onDelete={handleDeleteContribution}
                onBulkImport={handleBulkImportContributions}
                onPrintReceipt={c => {
                  setPrintData({ type: 'receipt', subType: 'contribution', item: c });
                  setReceiptModalOpen(true);
                }}
                onOpenReceiptPortal={() => {
                  window.history.pushState({}, '', '/receipts');
                  setIsReceiptPortal(true);
                }}
                onUpdateSettings={handleSaveSettings}
              />
            )}

            {activeIncomeSubTab === 'sponsorship' && userRole !== 'volunteer' && (
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

            {activeIncomeSubTab === 'stalls' && userRole !== 'volunteer' && (
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
                onSaveBooking={handleSaveSeva}
                onDeleteBooking={handleDeleteSeva}
                onSaveCatalogue={handleSaveSevaCatalogue}
                onDeleteCatalogue={handleDeleteSevaCatalogue}
                onPrintReceipt={v => {
                  setPrintData({ type: 'receipt', subType: 'seva', item: { ...v, isSeva: true } });
                  setReceiptModalOpen(true);
                }}
              />
            )}

            {activeIncomeSubTab === 'hundi' && (
              <HundiView
                hundi={hundi}
                isAdmin={isAdmin}
                onSave={handleSaveHundi}
                onDelete={handleDeleteHundi}
              />
            )}

            {activeIncomeSubTab === 'auctions' && (
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
        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            isAdmin={isAdmin}
            onSaveSettings={handleSaveSettings}
            onExportExcel={handleExportExcel}
            onSaveHTML={handleSaveHTML}
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

      {/* 6. REAL-TIME CLOUD SYNC TOAST NOTIFICATION */}
      {syncToast && (
        <div className="fixed bottom-4 right-4 z-50 bg-stone-900/95 text-white text-xs px-4 py-3 rounded-xl shadow-2xl border border-amber-500/40 flex items-center gap-2.5 backdrop-blur-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{syncToast}</span>
        </div>
      )}
    </div>
  );
}

export default App;

