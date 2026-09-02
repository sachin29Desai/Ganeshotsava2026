import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  DollarSign,
  Users,
  Building2,
  HeartHandshake,
  Settings,
  Share2,
  Lock,
  Unlock,
  Plus,
  Edit2,
  Trash2,
  Printer,
  Download,
  Upload,
  Zap,
  CheckCircle2,
  Copy,
  AlertTriangle,
  QrCode,
  Sparkles,
  PhoneCall
} from 'lucide-react';
import {
  Expense,
  Contribution,
  Sponsor,
  SevaBooking,
  SevaCatalogueItem,
  AppSettings,
  AppState
} from './types';
import {
  INITIAL_STATE,
  DEFAULT_SEVAS,
  fmt,
  fmtDate,
  today,
  numWords,
  sha256
} from './utils/helpers';
import { generateStandaloneHTML } from './utils/htmlExporter';
import {
  initFirestoreSync,
  cloudSaveExpense,
  cloudDeleteExpense,
  cloudSaveContribution,
  cloudDeleteContribution,
  cloudSaveSponsor,
  cloudDeleteSponsor,
  cloudSaveSeva,
  cloudDeleteSeva,
  cloudSaveSevaCatalogueItem,
  cloudDeleteSevaCatalogueItem,
  cloudSaveSettings,
  cloudSaveCounters,
  cloudBulkImportContributions,
  cloudClearAllData,
  SyncStatus
} from './lib/firebase';

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
  // --- Persistent State ---
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem('eg_expenses');
      if (saved) return JSON.parse(saved);
    } catch {}
    return window.__E__?.expenses || INITIAL_STATE.expenses;
  });

  const [contributions, setContributions] = useState<Contribution[]>(() => {
    try {
      const saved = localStorage.getItem('eg_contributions');
      if (saved) return JSON.parse(saved);
    } catch {}
    return window.__E__?.contributions || INITIAL_STATE.contributions;
  });

  const [sponsors, setSponsors] = useState<Sponsor[]>(() => {
    try {
      const saved = localStorage.getItem('eg_sponsors');
      if (saved) return JSON.parse(saved);
    } catch {}
    return window.__E__?.sponsors || INITIAL_STATE.sponsors;
  });

  const [sevas, setSevas] = useState<SevaBooking[]>(() => {
    try {
      const saved = localStorage.getItem('eg_sevas');
      if (saved) return JSON.parse(saved);
    } catch {}
    return window.__E__?.sevas || INITIAL_STATE.sevas;
  });

  const [sevaCatalogue, setSevaCatalogue] = useState<SevaCatalogueItem[]>(() => {
    try {
      const saved = localStorage.getItem('eg_seva_catalogue');
      if (saved) return JSON.parse(saved);
    } catch {}
    return window.__E__?.sevaCatalogue || DEFAULT_SEVAS;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('eg_settings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return window.__E__?.settings || INITIAL_STATE.settings;
  });

  // --- Active Tab & Admin State ---
  const [activeTab, setActiveTab] = useState<'report' | 'expenses' | 'contributions' | 'sponsors' | 'sevas' | 'settings'>('report');
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewOnly, setViewOnly] = useState(false);
  const [activeFileHandle, setActiveFileHandle] = useState<FileSystemFileHandle | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('connecting');

  // Search States
  const [ctSearch, setCtSearch] = useState('');
  const [svSearch, setSvSearch] = useState('');

  // Modals
  const [expModal, setExpModal] = useState<{ open: boolean; item?: Expense | null }>({ open: false });
  const [ctModal, setCtModal] = useState<{ open: boolean; item?: Contribution | null }>({ open: false });
  const [spModal, setSpModal] = useState<{ open: boolean; item?: Sponsor | null }>({ open: false });
  const [svModal, setSvModal] = useState<{ open: boolean; item?: SevaBooking | null }>({ open: false });
  const [scModal, setScModal] = useState<{ open: boolean; item?: SevaCatalogueItem | null }>({ open: false });
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Print Bill State
  const [printData, setPrintData] = useState<{ type: 'receipt' | 'invoice'; item: any } | null>(null);

  // Refs
  const shareQrRef = useRef<HTMLDivElement>(null);
  const rcpQrRef = useRef<HTMLDivElement>(null);
  const autoSaveTimerRef = useRef<any>(null);

  // Sync to local storage & embedded state
  const getCurrentState = (): AppState => ({
    expenses,
    contributions,
    sponsors,
    sevas,
    sevaCatalogue,
    settings,
    counters: {
      rc: localStorage.getItem('eg_rc_num'),
      sp: localStorage.getItem('eg_sp_num'),
      sv: localStorage.getItem('eg_sv_num')
    }
  });

  // Real-time Firestore Cloud Sync
  useEffect(() => {
    const unsub = initFirestoreSync(
      {
        onExpenses: data => {
          if (data && data.length > 0) setExpenses(data);
        },
        onContributions: data => {
          if (data && data.length > 0) setContributions(data);
        },
        onSponsors: data => {
          if (data && data.length > 0) setSponsors(data);
        },
        onSevas: data => {
          if (data && data.length > 0) setSevas(data);
        },
        onSevaCatalogue: data => {
          if (data && data.length > 0) setSevaCatalogue(data);
        },
        onSettings: data => {
          if (data) setSettings(prev => ({ ...prev, ...data }));
        },
        onCounters: data => {
          if (data?.rc) localStorage.setItem('eg_rc_num', String(data.rc));
          if (data?.sp) localStorage.setItem('eg_sp_num', String(data.sp));
          if (data?.sv) localStorage.setItem('eg_sv_num', String(data.sv));
        },
        onStatusChange: status => {
          setSyncStatus(status);
        }
      },
      getCurrentState()
    );

    return () => unsub();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('eg_expenses', JSON.stringify(expenses));
      localStorage.setItem('eg_contributions', JSON.stringify(contributions));
      localStorage.setItem('eg_sponsors', JSON.stringify(sponsors));
      localStorage.setItem('eg_sevas', JSON.stringify(sevas));
      localStorage.setItem('eg_seva_catalogue', JSON.stringify(sevaCatalogue));
      localStorage.setItem('eg_settings', JSON.stringify(settings));
    } catch {}

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
  }, [expenses, contributions, sponsors, sevas, sevaCatalogue, settings]);

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
            if (data.eg_sevas) setSevas(data.eg_sevas);
            if (data.eg_seva_catalogue) setSevaCatalogue(data.eg_seva_catalogue);
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

  // Summary Calculations
  const spAct = sponsors.reduce((s, r) => s + Number(r.act || 0), 0);
  const ctTot = contributions.reduce((s, r) => s + Number(r.amt || 0), 0);
  const svTot = sevas.reduce((s, r) => s + Number(r.amt || 0), 0);
  const exAct = expenses.reduce((s, r) => s + Number(r.act || (Number(r.adv || 0) + Number(r.bal || 0))), 0);
  const totalIncome = spAct + ctTot + svTot;
  const netBalance = totalIncome - exAct;

  // Cloud & Local Handlers
  const handleSaveExpense = async (row: Expense) => {
    setExpenses(prev => {
      const idx = prev.findIndex(x => x.id === row.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = row;
        return next;
      }
      return [...prev, row];
    });
    try {
      await cloudSaveExpense(row);
    } catch (e) {
      console.warn('Saved locally; cloud sync pending', e);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    setExpenses(prev => prev.filter(x => x.id !== id));
    try {
      await cloudDeleteExpense(id);
    } catch (e) {
      console.warn('Deleted locally; cloud delete pending', e);
    }
  };

  const handleSaveContribution = async (row: Contribution) => {
    setContributions(prev => {
      const idx = prev.findIndex(x => x.id === row.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = row;
        return next;
      }
      return [...prev, row];
    });
    try {
      await cloudSaveContribution(row);
      await cloudSaveCounters({ rc: localStorage.getItem('eg_rc_num') });
    } catch (e) {
      console.warn('Saved locally; cloud sync pending', e);
    }
  };

  const handleDeleteContribution = async (id: string) => {
    setContributions(prev => prev.filter(x => x.id !== id));
    try {
      await cloudDeleteContribution(id);
    } catch (e) {
      console.warn('Deleted locally; cloud delete pending', e);
    }
  };

  const handleSaveSponsor = async (row: Sponsor) => {
    setSponsors(prev => {
      const idx = prev.findIndex(x => x.id === row.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = row;
        return next;
      }
      return [...prev, row];
    });
    try {
      await cloudSaveSponsor(row);
      await cloudSaveCounters({ sp: localStorage.getItem('eg_sp_num') });
    } catch (e) {
      console.warn('Saved locally; cloud sync pending', e);
    }
  };

  const handleDeleteSponsor = async (id: string) => {
    setSponsors(prev => prev.filter(x => x.id !== id));
    try {
      await cloudDeleteSponsor(id);
    } catch (e) {
      console.warn('Deleted locally; cloud delete pending', e);
    }
  };

  const handleSaveSeva = async (row: SevaBooking) => {
    setSevas(prev => {
      const idx = prev.findIndex(x => x.id === row.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = row;
        return next;
      }
      return [...prev, row];
    });
    try {
      await cloudSaveSeva(row);
      await cloudSaveCounters({ sv: localStorage.getItem('eg_sv_num') });
    } catch (e) {
      console.warn('Saved locally; cloud sync pending', e);
    }
  };

  const handleDeleteSeva = async (id: string) => {
    setSevas(prev => prev.filter(x => x.id !== id));
    try {
      await cloudDeleteSeva(id);
    } catch (e) {
      console.warn('Deleted locally; cloud delete pending', e);
    }
  };

  const handleSaveSevaCatalogue = async (row: SevaCatalogueItem) => {
    setSevaCatalogue(prev => {
      const idx = prev.findIndex(x => x.id === row.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = row;
        return next;
      }
      return [...prev, row];
    });
    try {
      await cloudSaveSevaCatalogueItem(row);
    } catch (e) {
      console.warn('Saved locally; cloud sync pending', e);
    }
  };

  const handleDeleteSevaCatalogue = async (id: string) => {
    setSevaCatalogue(prev => prev.filter(x => x.id !== id));
    try {
      await cloudDeleteSevaCatalogueItem(id);
    } catch (e) {
      console.warn('Deleted locally; cloud delete pending', e);
    }
  };

  const handleSaveSettings = async (cfg: AppSettings) => {
    setSettings(cfg);
    try {
      await cloudSaveSettings(cfg);
    } catch (e) {
      console.warn('Settings saved locally; cloud sync pending', e);
    }
  };

  // Admin toggling
  const handleToggleAdmin = async () => {
    if (viewOnly) {
      alert('This is a view-only snapshot. Admin features are disabled.');
      return;
    }
    if (isAdmin) {
      setIsAdmin(false);
      return;
    }
    if (!settings.adminHash) {
      const p1 = window.prompt('No admin password set yet.\nEnter a new admin password:');
      if (!p1) return;
      const p2 = window.prompt('Confirm new admin password:');
      if (p1 !== p2) {
        alert('Passwords do not match.');
        return;
      }
      const hash = await sha256(p1);
      setSettings(prev => ({ ...prev, adminHash: hash }));
      setIsAdmin(true);
      alert('Admin password created! Admin mode is now active.');
      return;
    }
    const entered = window.prompt('Enter admin password:');
    if (!entered) return;
    const testHash = await sha256(entered);
    if (testHash === settings.adminHash) {
      setIsAdmin(true);
    } else {
      alert('Incorrect password.');
    }
  };

  // Next Sequence Numbers
  const getNextNum = (key: string, prefix: string): string => {
    const current = parseInt(localStorage.getItem(key) || '0', 10) + 1;
    try {
      localStorage.setItem(key, String(current));
    } catch {}
    return `${prefix}${String(current).padStart(4, '0')}`;
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

  // Mobile Snapshot File Share
  const handleShareSnapshotFile = async () => {
    const doc = generateStandaloneHTML(getCurrentState(), true);
    const filename = `Ganeshotsava_Snapshot_${today()}.html`;
    const file = new File([doc], filename, { type: 'text/html' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `${settings.org || 'Brigade Eldorado'} Ganeshotsava 2026 Snapshot`,
          text: 'Here is the latest financial ledger & budget snapshot.'
        });
        return;
      } catch (e: any) {
        if (e.name === 'AbortError') return;
      }
    }

    const blob = new Blob([doc], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    alert('📱 Snapshot file ready! Share this file via WhatsApp, AirDrop, or Google Drive for 100% offline view on iPhone & Android.');
  };

  // Open Share Modal & Generate QR
  const handleOpenShareModal = () => {
    const payload = {
      eg_expenses: expenses,
      eg_contributions: contributions,
      eg_sponsors: sponsors,
      eg_sevas: sevas,
      eg_seva_catalogue: sevaCatalogue,
      org: settings.org,
      location: settings.location
    };
    if (window.LZString) {
      const compressed = window.LZString.compressToEncodedURIComponent(JSON.stringify(payload));
      const url = `${window.location.origin}${window.location.pathname}#share=${compressed}`;
      setShareUrl(url);
      setShareModalOpen(true);
      setTimeout(() => {
        if (shareQrRef.current && window.QRCode) {
          shareQrRef.current.innerHTML = '';
          new window.QRCode(shareQrRef.current, {
            text: url,
            width: 140,
            height: 140,
            correctLevel: window.QRCode.CorrectLevel.M
          });
        }
      }, 100);
    } else {
      setShareUrl(window.location.href);
      setShareModalOpen(true);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      alert('Copied link to clipboard!');
    }
  };

  // WhatsApp Helpers
  const openWhatsApp = (msg: string) => {
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const shareWhatsAppSummary = () => {
    const msg = `📊 *Ganeshotsava 2026 — Budget Summary*\n*${settings.org || 'Brigade Eldorado'}*\n\n💰 *INCOME*\n• Sponsor Contributions: ₹${fmt(spAct)}\n• Resident Contributions: ₹${fmt(ctTot)}\n• Seva Bookings: ₹${fmt(svTot)}\n▶ *Total Income: ₹${fmt(totalIncome)}*\n\n📤 *EXPENDITURE*\n• Expenses (Actual): ₹${fmt(exAct)}\n▶ *Total Expenditure: ₹${fmt(exAct)}*\n\n${netBalance >= 0 ? '✅' : '⚠️'} *Net Balance: ₹${fmt(Math.abs(netBalance))}${netBalance < 0 ? ' (Deficit)' : ''}*\n\n_Ganapati Bappa Morya!_ 🪔`;
    openWhatsApp(msg);
  };

  const shareWhatsAppContribution = (c: Contribution) => {
    const msg = `🪔 *Ganeshotsava Contribution Receipt*\n\n*${settings.org || 'Brigade Eldorado'}*\n3rd Year Ganeshotsava\n14th September – 18th September 2026\n\n📋 Receipt No: ${c.rcptNo}\n📅 Date: ${fmtDate(c.date)}\n👤 Contributor: ${c.name}\n🏠 Flat: ${c.flat}\n💳 Payment: ${c.pay || ''}${c.txn ? ' — ' + c.txn : ''}\n💰 Amount: ₹${fmt(c.amt)}\n    (${numWords(c.amt)})${c.notes ? '\n📝 Notes: ' + c.notes : ''}\n\nThank you for your generous contribution and support 🙏\n*Ganapati Bappa Morya!*`;
    openWhatsApp(msg);
  };

  const shareWhatsAppSeva = (s: SevaBooking) => {
    const msg = `🙏 *Seva Booking Confirmation*\n\n*${settings.org || 'Brigade Eldorado'}*\n3rd Year Ganeshotsava\n14th September – 18th September 2026\n\n🎟️ Token No: ${s.tokNo}\n🪔 Seva: ${s.seva}\n📅 Date: ${fmtDate(s.date)}\n👤 Resident: ${s.name}\n🏠 Flat: ${s.flat}\n💰 Amount: ₹${fmt(s.amt)}\n    (${numWords(s.amt)})\n\nThank you for your participation 🙏\n*Ganapati Bappa Morya!*`;
    openWhatsApp(msg);
  };

  const shareWhatsAppSponsor = (s: Sponsor) => {
    const msg = `📄 *Sponsorship Invoice*\n\n*${settings.org || 'Brigade Eldorado'}*\n3rd Year Ganeshotsava\n14th September – 18th September 2026\n\n🔖 Invoice No: ${s.invNo}\n📅 Date: ${new Date().toLocaleDateString('en-IN')}\n🏢 Sponsor: ${s.det}\n💰 Amount: ₹${fmt(s.act)}\n    (${numWords(s.act)})\n\nThank you for your generous sponsorship! 🙏\n*Ganapati Bappa Morya!*`;
    openWhatsApp(msg);
  };

  // Print Handlers
  const handlePrintReceipt = (item: Contribution | SevaBooking, isSeva = false) => {
    setPrintData({ type: 'receipt', item: { ...item, isSeva } });
    setTimeout(() => {
      if (settings.upi && rcpQrRef.current && window.QRCode) {
        rcpQrRef.current.innerHTML = '';
        const upiUrl = `upi://pay?pa=${encodeURIComponent(settings.upi)}&pn=${encodeURIComponent(settings.payee)}&am=${encodeURIComponent(item.amt || 0)}&cu=INR`;
        new window.QRCode(rcpQrRef.current, { text: upiUrl, width: 95, height: 95, correctLevel: window.QRCode.CorrectLevel.H });
      }
      window.print();
    }, 200);
  };

  const handlePrintInvoice = (item: Sponsor) => {
    setPrintData({ type: 'invoice', item });
    setTimeout(() => {
      window.print();
    }, 200);
  };

  // Excel Export
  const handleExportExcel = () => {
    if (!window.XLSX) {
      alert('Excel library not loaded.');
      return;
    }
    const wb = window.XLSX.utils.book_new();

    // Expenses Sheet
    const expRows = [
      ['#', 'Item / Description', 'Estimated Amount (₹)', 'Advance (₹)', 'Balance (₹)', 'Actual Amount (₹)'],
      ...expenses.map((r, i) => [i + 1, r.item, Number(r.est) || 0, Number(r.adv) || 0, Number(r.bal) || 0, Number(r.act) || 0]),
      ['', 'TOTAL', expenses.reduce((s, r) => s + (r.est || 0), 0), expenses.reduce((s, r) => s + (r.adv || 0), 0), expenses.reduce((s, r) => s + (r.bal || 0), 0), expenses.reduce((s, r) => s + (r.act || 0), 0)]
    ];
    window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.aoa_to_sheet(expRows), 'Estimated Expenses');

    // Contributions Sheet
    const ctRows = [
      ['Receipt No', 'Date', 'Name', 'Flat No', 'Amount (₹)', 'Payment Mode', 'Transaction Ref', 'Notes'],
      ...contributions.map(r => [r.rcptNo, r.date, r.name, r.flat, Number(r.amt) || 0, r.pay || '', r.txn || '', r.notes || '']),
      ['', '', '', 'TOTAL', ctTot, '', '', '']
    ];
    window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.aoa_to_sheet(ctRows), 'Contributions');

    // Sponsors Sheet
    const spRows = [
      ['Invoice No', 'Sponsor Details', 'Estimated Amount (₹)', 'Actual Amount (₹)'],
      ...sponsors.map(r => [r.invNo, r.det, Number(r.est) || 0, Number(r.act) || 0]),
      ['', 'TOTAL', sponsors.reduce((s, r) => s + (r.est || 0), 0), spAct]
    ];
    window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.aoa_to_sheet(spRows), 'Sponsors');

    // Sevas Sheet
    const svRows = [
      ['Token No', 'Seva Name', 'Resident Name', 'Flat No', 'Amount (₹)', 'Date'],
      ...sevas.map(r => [r.tokNo, r.seva, r.name, r.flat, Number(r.amt) || 0, r.date]),
      ['', '', '', 'TOTAL', svTot, '']
    ];
    window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.aoa_to_sheet(svRows), 'Seva Bookings');

    // Budget Report Sheet
    const rptRows = [
      ['Particulars', 'Amount (₹)'],
      ['─── INCOME ───', ''],
      ['Sponsor Contributions (Actual)', spAct],
      ['Resident Contributions', ctTot],
      ['Seva Bookings', svTot],
      ['Total Income', totalIncome],
      ['─── EXPENDITURE ───', ''],
      ['Expenses (Actual)', exAct],
      ['Total Expenditure', exAct],
      ['Net Balance', netBalance]
    ];
    window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.aoa_to_sheet(rptRows), 'Budget Report');

    window.XLSX.writeFile(wb, `${(settings.org || 'Ganeshotsava_2026').replace(/\s+/g, '_')}_Financials.xlsx`);
  };

  // Excel Import
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !window.XLSX) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const wb = window.XLSX.read(evt.target?.result, { type: 'array' });
        const getSheet = (...names: string[]) => {
          for (const n of names) {
            const s = wb.Sheets[n];
            if (s) return window.XLSX.utils.sheet_to_json(s, { header: 1, defval: '' }) as any[][];
          }
          return null;
        };
        let imported = 0;

        const es = getSheet('Estimated Expenses', 'Expenses', 'Sheet1');
        if (es && es.length > 1) {
          const rows = es.slice(1).filter(r => r[1] && String(r[1]).toUpperCase() !== 'TOTAL');
          if (rows.length) {
            setExpenses(rows.map((r, i) => ({
              id: `imp_e_${Date.now()}_${i}`,
              item: String(r[1] || ''),
              est: Number(r[2]) || 0,
              adv: Number(r[3]) || 0,
              bal: Number(r[4]) || 0,
              act: Number(r[3] || 0) + Number(r[4] || 0)
            })));
            imported++;
          }
        }

        const cs = getSheet('Contributions', 'Sheet2');
        if (cs && cs.length > 1) {
          const rows = cs.slice(1).filter(r => r[0] && !String(r[2]).toUpperCase().includes('TOTAL'));
          if (rows.length) {
            let maxN = 0;
            const newCt = rows.map((r, i) => {
              const n = parseInt(String(r[0]).split('-').pop() || '0', 10);
              if (n > maxN) maxN = n;
              return {
                id: `imp_c_${Date.now()}_${i}`,
                rcptNo: String(r[0]),
                date: String(r[1] || today()),
                name: String(r[2] || ''),
                flat: String(r[3] || ''),
                amt: Number(r[4]) || 0,
                pay: String(r[5] || 'UPI'),
                txn: String(r[6] || ''),
                notes: String(r[7] || '')
              };
            });
            setContributions(newCt);
            if (maxN) localStorage.setItem('eg_rc_num', String(maxN));
            cloudBulkImportContributions(newCt).catch(e => console.warn('Cloud batch import error', e));
            imported++;
          }
        }

        alert(`✅ Excel file parsed successfully! ${imported} sheet(s) imported.`);
      } catch (err: any) {
        alert(`Failed to import Excel: ${err.message}`);
      }
      e.target.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="min-h-screen bg-[#FDF8F3] text-[#1A1A1A] font-sans antialiased flex flex-col selection:bg-[#991B1B] selection:text-white">
      {/* Top Framing Accent Stripe */}
      <div className="h-1.5 bg-[#991B1B] w-full" />

      {/* Header */}
      <header className="bg-white border-b border-stone-200 px-6 py-4 shadow-sm no-print">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            {settings.logo ? (
              <img
                src={settings.logo}
                alt="Logo"
                className="w-14 h-14 object-contain rounded border border-stone-200"
              />
            ) : null}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#991B1B] mb-0.5">
                {settings.org || 'Brigade Eldorado Residents Association'}
              </div>
              <h1 className="text-2xl font-serif font-black tracking-tight text-[#1A1A1A] flex items-center gap-2">
                <span>🪔 Ganeshotsava 2026</span>
              </h1>
              <p className="text-xs text-stone-500 font-medium tracking-wide">
                3rd Year Celebration • 14th September – 18th September 2026 • {settings.location || 'Amphitheatre'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {viewOnly && (
              <span className="bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full inline-flex items-center gap-1.5">
                👁 View Only Snapshot
              </span>
            )}

            {/* Cloud Sync Status Indicator */}
            {(syncStatus === 'synced' || syncStatus === 'connected') && (
              <span
                className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full inline-flex items-center gap-1.5"
                title="Google Firebase Firestore (Live Multi-Device Sync Active)"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Cloud Synced</span>
              </span>
            )}
            {syncStatus === 'saving' && (
              <span className="bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                <span>Syncing Cloud...</span>
              </span>
            )}
            {syncStatus === 'connecting' && (
              <span className="bg-stone-100 border border-stone-200 text-stone-700 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-stone-400"></span>
                <span>Connecting Cloud...</span>
              </span>
            )}

            {isAdmin && (
              <button
                onClick={handleOpenShareModal}
                className="bg-white border border-stone-300 text-stone-800 hover:bg-stone-50 text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded inline-flex items-center gap-1.5 transition-colors shadow-sm"
                title="Universal Share for Android & iPhone"
              >
                <Share2 className="w-3.5 h-3.5 text-[#991B1B]" />
                <span>Share Snapshot</span>
              </button>
            )}

            {isAdmin && saveStatus && (
              <span
                className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full inline-flex items-center gap-1 ${
                  saveStatus === 'saved'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-amber-50 border border-amber-200 text-amber-800'
                }`}
              >
                {saveStatus === 'saved' ? '✓ Saved' : '⏺ Unsaved'}
              </span>
            )}

            {isAdmin && (
              <>
                <button
                  onClick={handleConnectFile}
                  className="bg-stone-900 text-white hover:bg-stone-800 text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded inline-flex items-center gap-1.5 transition-colors shadow-sm"
                  title="Direct 2-way sync with local HTML file"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>{activeFileHandle ? `⚡ Connected (${activeFileHandle.name})` : '⚡ Connect File'}</span>
                </button>

                <button
                  onClick={handleSaveHTML}
                  className="bg-[#991B1B] text-white hover:bg-[#7F1D1D] text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded inline-flex items-center gap-1.5 transition-colors shadow-sm"
                  title="Download standalone self-updating HTML"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save HTML</span>
                </button>
              </>
            )}

            {isAdmin ? (
              <span className="bg-red-50 border border-red-200 text-[#991B1B] text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full inline-flex items-center gap-1">
                <Unlock className="w-3 h-3" /> Admin Active
              </span>
            ) : null}

            {!viewOnly && (
              <button
                onClick={handleToggleAdmin}
                className="bg-stone-100 hover:bg-stone-200 text-stone-700 p-2 rounded transition-colors"
                title={isAdmin ? 'Lock Admin Mode' : 'Enter Admin Mode'}
              >
                {isAdmin ? <Unlock className="w-4 h-4 text-[#991B1B]" /> : <Lock className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-stone-200 px-6 overflow-x-auto no-print">
        <div className="max-w-7xl mx-auto flex gap-6">
          <button
            onClick={() => setActiveTab('report')}
            className={`py-3.5 font-sans text-xs font-bold uppercase tracking-[0.15em] border-b-2 transition-all whitespace-nowrap inline-flex items-center gap-2 ${
              activeTab === 'report'
                ? 'border-[#991B1B] text-[#991B1B]'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Budget Report</span>
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className={`py-3.5 font-sans text-xs font-bold uppercase tracking-[0.15em] border-b-2 transition-all whitespace-nowrap inline-flex items-center gap-2 ${
              activeTab === 'expenses'
                ? 'border-[#991B1B] text-[#991B1B]'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Expenses ({expenses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('contributions')}
            className={`py-3.5 font-sans text-xs font-bold uppercase tracking-[0.15em] border-b-2 transition-all whitespace-nowrap inline-flex items-center gap-2 ${
              activeTab === 'contributions'
                ? 'border-[#991B1B] text-[#991B1B]'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Contributions ({contributions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('sponsors')}
            className={`py-3.5 font-sans text-xs font-bold uppercase tracking-[0.15em] border-b-2 transition-all whitespace-nowrap inline-flex items-center gap-2 ${
              activeTab === 'sponsors'
                ? 'border-[#991B1B] text-[#991B1B]'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Sponsors ({sponsors.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('sevas')}
            className={`py-3.5 font-sans text-xs font-bold uppercase tracking-[0.15em] border-b-2 transition-all whitespace-nowrap inline-flex items-center gap-2 ${
              activeTab === 'sevas'
                ? 'border-[#991B1B] text-[#991B1B]'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <HeartHandshake className="w-4 h-4" />
            <span>Sevas ({sevas.length})</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-3.5 font-sans text-xs font-bold uppercase tracking-[0.15em] border-b-2 transition-all whitespace-nowrap inline-flex items-center gap-2 ${
                activeTab === 'settings'
                  ? 'border-[#991B1B] text-[#991B1B]'
                  : 'border-transparent text-stone-500 hover:text-stone-900'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          )}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto p-6 flex-1">
        {/* TAB 1: BUDGET REPORT */}
        {activeTab === 'report' && (
          <div className="space-y-6">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white border border-stone-200 rounded p-4 shadow-sm">
                <div className="text-[10px] font-bold text-stone-500 uppercase tracking-[0.18em] mb-1">
                  Sponsor Inflow
                </div>
                <div className="text-2xl font-mono font-semibold text-emerald-700">
                  ₹ {fmt(spAct)}
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded p-4 shadow-sm">
                <div className="text-[10px] font-bold text-stone-500 uppercase tracking-[0.18em] mb-1">
                  Resident Contributions
                </div>
                <div className="text-2xl font-mono font-semibold text-emerald-700">
                  ₹ {fmt(ctTot)}
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded p-4 shadow-sm">
                <div className="text-[10px] font-bold text-stone-500 uppercase tracking-[0.18em] mb-1">
                  Seva Bookings
                </div>
                <div className="text-2xl font-mono font-semibold text-emerald-700">
                  ₹ {fmt(svTot)}
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded p-4 shadow-sm">
                <div className="text-[10px] font-bold text-stone-500 uppercase tracking-[0.18em] mb-1">
                  Total Expenditure (Actual)
                </div>
                <div className="text-2xl font-mono font-semibold text-red-600">
                  ₹ {fmt(exAct)}
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded p-4 shadow-sm">
                <div className="text-[10px] font-bold text-stone-500 uppercase tracking-[0.18em] mb-1">
                  Net Balance
                </div>
                <div className={`text-2xl font-mono font-bold ${netBalance >= 0 ? 'text-[#991B1B]' : 'text-red-600'}`}>
                  ₹ {fmt(Math.abs(netBalance))} {netBalance < 0 && '(Deficit)'}
                </div>
              </div>
            </div>

            {/* Detailed Ledger Breakdown */}
            <div className="bg-white border border-stone-200 rounded shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-stone-200 bg-stone-50/50">
                <h2 className="text-lg font-serif font-bold text-[#1A1A1A]">
                  Editorial Financial Ledger Summary
                </h2>
              </div>
              <div className="divide-y divide-stone-100 font-sans text-sm">
                <div className="bg-[#FDF8F3] px-6 py-2.5 text-[10px] font-bold text-stone-500 uppercase tracking-[0.18em]">
                  Income Sources
                </div>
                <div className="px-6 py-3.5 flex justify-between items-center">
                  <span className="text-stone-700">Sponsor Contributions (Actual)</span>
                  <span className="font-mono font-medium">₹ {fmt(spAct)}</span>
                </div>
                <div className="px-6 py-3.5 flex justify-between items-center">
                  <span className="text-stone-700">Resident Contributions</span>
                  <span className="font-mono font-medium">₹ {fmt(ctTot)}</span>
                </div>
                <div className="px-6 py-3.5 flex justify-between items-center">
                  <span className="text-stone-700">Seva Bookings</span>
                  <span className="font-mono font-medium">₹ {fmt(svTot)}</span>
                </div>
                <div className="bg-red-50/40 px-6 py-3 flex justify-between items-center font-bold text-[#7F1D1D]">
                  <span>Total Income</span>
                  <span className="font-mono text-base">₹ {fmt(totalIncome)}</span>
                </div>

                <div className="bg-[#FDF8F3] px-6 py-2.5 text-[10px] font-bold text-stone-500 uppercase tracking-[0.18em]">
                  Expenditure
                </div>
                <div className="px-6 py-3.5 flex justify-between items-center">
                  <span className="text-stone-700">Expenses (Actual Incurred)</span>
                  <span className="font-mono font-medium">₹ {fmt(exAct)}</span>
                </div>
                <div className="bg-red-50/40 px-6 py-3 flex justify-between items-center font-bold text-[#7F1D1D]">
                  <span>Total Expenditure</span>
                  <span className="font-mono text-base">₹ {fmt(exAct)}</span>
                </div>

                <div className={`px-6 py-4 flex justify-between items-center font-bold text-base ${netBalance >= 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
                  <span>Net Ledger Balance</span>
                  <span className="font-mono text-lg">
                    ₹ {fmt(Math.abs(netBalance))} {netBalance < 0 && '(Deficit)'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EXPENSES */}
        {activeTab === 'expenses' && (
          <div className="bg-white border border-stone-200 rounded shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-serif font-bold text-[#1A1A1A]">Estimated Expenses</h2>
                <p className="text-xs text-stone-500">Track budgeted items, advances, balance, and actual costs.</p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => setExpModal({ open: true, item: null })}
                  className="bg-[#991B1B] text-white hover:bg-[#7F1D1D] text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded inline-flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Expense</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#FDF8F3] border-b border-stone-200 text-[10px] font-bold text-stone-500 uppercase tracking-[0.15em]">
                    <th className="py-3 px-4 w-12">#</th>
                    <th className="py-3 px-4">Item / Description</th>
                    <th className="py-3 px-4 text-right">Estimated (₹)</th>
                    <th className="py-3 px-4 text-right">Advance (₹)</th>
                    <th className="py-3 px-4 text-right">Balance (₹)</th>
                    <th className="py-3 px-4 text-right">Actual (₹)</th>
                    {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 7 : 6} className="py-8 text-center text-stone-400">
                        No expenses recorded yet.
                      </td>
                    </tr>
                  ) : (
                    expenses.map((e, idx) => (
                      <tr key={e.id} className="hover:bg-stone-50/60 transition-colors">
                        <td className="py-3 px-4 text-stone-400 text-xs">{idx + 1}</td>
                        <td className="py-3 px-4 font-semibold text-stone-900">{e.item}</td>
                        <td className="py-3 px-4 font-mono text-right text-stone-700">₹ {fmt(e.est)}</td>
                        <td className="py-3 px-4 font-mono text-right text-emerald-700">₹ {fmt(e.adv)}</td>
                        <td className="py-3 px-4 font-mono text-right text-stone-700">₹ {fmt(e.bal)}</td>
                        <td className="py-3 px-4 font-mono text-right font-bold text-stone-900">
                          ₹ {fmt(e.act || Number(e.adv || 0) + Number(e.bal || 0))}
                        </td>
                        {isAdmin && (
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex gap-1.5 justify-end">
                              <button
                                onClick={() => setExpModal({ open: true, item: e })}
                                className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('Delete this expense?')) {
                                    handleDeleteExpense(e.id);
                                  }
                                }}
                                className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-red-50/50 border-t-2 border-[#991B1B] text-xs font-bold text-[#7F1D1D] font-mono">
                    <td colSpan={2} className="py-3 px-4 font-sans uppercase">Total</td>
                    <td className="py-3 px-4 text-right">₹ {fmt(expenses.reduce((s, r) => s + (r.est || 0), 0))}</td>
                    <td className="py-3 px-4 text-right">₹ {fmt(expenses.reduce((s, r) => s + (r.adv || 0), 0))}</td>
                    <td className="py-3 px-4 text-right">₹ {fmt(expenses.reduce((s, r) => s + (r.bal || 0), 0))}</td>
                    <td className="py-3 px-4 text-right font-black">₹ {fmt(exAct)}</td>
                    {isAdmin && <td></td>}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: CONTRIBUTIONS */}
        {activeTab === 'contributions' && (
          <div className="bg-white border border-stone-200 rounded shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-serif font-bold text-[#1A1A1A]">Resident Contributions</h2>
                <div className="text-xs text-stone-500">
                  Total Collected: <strong className="text-emerald-700 font-mono">₹ {fmt(ctTot)}</strong> ({contributions.length} receipts)
                </div>
              </div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <input
                  type="text"
                  placeholder="🔍 Search name, flat, receipt…"
                  value={ctSearch}
                  onChange={e => setCtSearch(e.target.value)}
                  className="border border-stone-300 rounded px-3 py-1.5 text-xs bg-stone-50 focus:bg-white outline-none focus:border-[#991B1B] w-64"
                />
                {isAdmin && (
                  <>
                    <button
                      onClick={handleExportExcel}
                      className="bg-emerald-700 text-white hover:bg-emerald-800 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded transition-colors"
                      title="Export Contributions to Excel"
                    >
                      Export
                    </button>
                    <label className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded cursor-pointer transition-colors">
                      Import
                      <input type="file" accept=".xlsx,.xls" onChange={handleImportExcel} className="hidden" />
                    </label>
                    <button
                      onClick={() => setCtModal({ open: true, item: null })}
                      className="bg-[#991B1B] text-white hover:bg-[#7F1D1D] text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded inline-flex items-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#FDF8F3] border-b border-stone-200 text-[10px] font-bold text-stone-500 uppercase tracking-[0.15em]">
                    <th className="py-3 px-4">Receipt No</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Contributor Name</th>
                    <th className="py-3 px-4">Flat No</th>
                    <th className="py-3 px-4 text-right">Amount (₹)</th>
                    <th className="py-3 px-4">Mode</th>
                    <th className="py-3 px-4">Txn Ref</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {contributions
                    .filter(
                      c =>
                        c.name.toLowerCase().includes(ctSearch.toLowerCase()) ||
                        (c.flat || '').toLowerCase().includes(ctSearch.toLowerCase()) ||
                        (c.rcptNo || '').toLowerCase().includes(ctSearch.toLowerCase())
                    )
                    .map(c => (
                      <tr key={c.id} className="hover:bg-stone-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-stone-900">{c.rcptNo}</td>
                        <td className="py-3 px-4 text-stone-600 text-xs">{fmtDate(c.date)}</td>
                        <td className="py-3 px-4 font-semibold text-stone-900">{c.name}</td>
                        <td className="py-3 px-4">
                          <span className="bg-stone-100 text-stone-700 text-xs font-medium px-2 py-0.5 rounded">
                            {c.flat}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-right font-bold text-emerald-700">₹ {fmt(c.amt)}</td>
                        <td className="py-3 px-4 text-stone-600 text-xs">{c.pay}</td>
                        <td className="py-3 px-4 font-mono text-stone-500 text-xs">{c.txn || '—'}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex gap-1.5 justify-end">
                            <button
                              onClick={() => handlePrintReceipt(c, false)}
                              className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium px-2.5 py-1 rounded inline-flex items-center gap-1 transition-colors"
                              title="Print Receipt"
                            >
                              <Printer className="w-3 h-3 text-[#991B1B]" />
                              <span>Receipt</span>
                            </button>
                            <button
                              onClick={() => shareWhatsAppContribution(c)}
                              className="bg-[#25D366] hover:bg-[#20bd5a] text-white p-1.5 rounded transition-colors"
                              title="Share on WhatsApp"
                            >
                              <PhoneCall className="w-3 h-3" />
                            </button>
                            {isAdmin && (
                              <>
                                <button
                                  onClick={() => setCtModal({ open: true, item: c })}
                                  className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded"
                                  title="Edit"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm('Delete this contribution?')) {
                                      handleDeleteContribution(c.id);
                                    }
                                  }}
                                  className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: SPONSORS */}
        {activeTab === 'sponsors' && (
          <div className="bg-white border border-stone-200 rounded shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-serif font-bold text-[#1A1A1A]">Sponsors</h2>
                <p className="text-xs text-stone-500">Corporate & community partners backing the celebration.</p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => setSpModal({ open: true, item: null })}
                  className="bg-[#991B1B] text-white hover:bg-[#7F1D1D] text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded inline-flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Sponsor</span>
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#FDF8F3] border-b border-stone-200 text-[10px] font-bold text-stone-500 uppercase tracking-[0.15em]">
                    <th className="py-3 px-4">Invoice No</th>
                    <th className="py-3 px-4">Sponsor Details</th>
                    <th className="py-3 px-4 text-right">Estimated (₹)</th>
                    <th className="py-3 px-4 text-right">Actual (₹)</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {sponsors.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-stone-400">
                        No sponsors added yet.
                      </td>
                    </tr>
                  ) : (
                    sponsors.map(s => (
                      <tr key={s.id} className="hover:bg-stone-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-stone-900">{s.invNo}</td>
                        <td className="py-3 px-4 font-semibold text-stone-900 whitespace-pre-line">{s.det}</td>
                        <td className="py-3 px-4 font-mono text-right text-stone-700">₹ {fmt(s.est)}</td>
                        <td className="py-3 px-4 font-mono text-right font-bold text-emerald-700">₹ {fmt(s.act)}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex gap-1.5 justify-end">
                            <button
                              onClick={() => handlePrintInvoice(s)}
                              className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium px-2.5 py-1 rounded inline-flex items-center gap-1 transition-colors"
                              title="Print Invoice"
                            >
                              <Printer className="w-3 h-3 text-[#991B1B]" />
                              <span>Invoice</span>
                            </button>
                            <button
                              onClick={() => shareWhatsAppSponsor(s)}
                              className="bg-[#25D366] hover:bg-[#20bd5a] text-white p-1.5 rounded transition-colors"
                              title="Share on WhatsApp"
                            >
                              <PhoneCall className="w-3 h-3" />
                            </button>
                            {isAdmin && (
                              <>
                                <button
                                  onClick={() => setSpModal({ open: true, item: s })}
                                  className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded"
                                  title="Edit"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm('Delete this sponsor?')) {
                                      handleDeleteSponsor(s.id);
                                    }
                                  }}
                                  className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: SEVAS */}
        {activeTab === 'sevas' && (
          <div className="space-y-6">
            {/* Seva Catalogue */}
            <div className="bg-white border border-stone-200 rounded shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-serif font-bold text-[#1A1A1A]">Available Sevas Catalogue</h2>
                  <p className="text-xs text-stone-500">Preset offerings with suggested donation amounts.</p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => setScModal({ open: true, item: null })}
                    className="bg-[#991B1B] text-white hover:bg-[#7F1D1D] text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Seva</span>
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-[#FDF8F3] border-b border-stone-200 text-[10px] font-bold text-stone-500 uppercase tracking-[0.15em]">
                      <th className="py-3 px-4 w-12">#</th>
                      <th className="py-3 px-4">Seva Name</th>
                      <th className="py-3 px-4 text-right">Suggested Amount (₹)</th>
                      {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {sevaCatalogue.map((sc, idx) => (
                      <tr key={sc.id} className="hover:bg-stone-50/60 transition-colors">
                        <td className="py-3 px-4 text-stone-400 text-xs">{idx + 1}</td>
                        <td className="py-3 px-4 font-semibold text-stone-900">{sc.name}</td>
                        <td className="py-3 px-4 font-mono text-right text-stone-700">₹ {fmt(sc.amt)}</td>
                        {isAdmin && (
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex gap-1.5 justify-end">
                              <button
                                onClick={() => setScModal({ open: true, item: sc })}
                                className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('Delete this seva catalogue item?')) {
                                    handleDeleteSevaCatalogue(sc.id);
                                  }
                                }}
                                className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Seva Bookings */}
            <div className="bg-white border border-stone-200 rounded shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-stone-200 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-serif font-bold text-[#1A1A1A]">Seva Bookings</h2>
                  <div className="text-xs text-stone-500">
                    Total Sevas: <strong className="text-emerald-700 font-mono">₹ {fmt(svTot)}</strong> ({sevas.length} bookings)
                  </div>
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <input
                    type="text"
                    placeholder="🔍 Search seva, resident, flat…"
                    value={svSearch}
                    onChange={e => setSvSearch(e.target.value)}
                    className="border border-stone-300 rounded px-3 py-1.5 text-xs bg-stone-50 focus:bg-white outline-none focus:border-[#991B1B] w-64"
                  />
                  {isAdmin && (
                    <button
                      onClick={() => setSvModal({ open: true, item: null })}
                      className="bg-[#991B1B] text-white hover:bg-[#7F1D1D] text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded inline-flex items-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Booking</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-[#FDF8F3] border-b border-stone-200 text-[10px] font-bold text-stone-500 uppercase tracking-[0.15em]">
                      <th className="py-3 px-4">Token No</th>
                      <th className="py-3 px-4">Seva Name</th>
                      <th className="py-3 px-4">Resident Name</th>
                      <th className="py-3 px-4">Flat No</th>
                      <th className="py-3 px-4 text-right">Amount (₹)</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {sevas
                      .filter(
                        v =>
                          v.seva.toLowerCase().includes(svSearch.toLowerCase()) ||
                          v.name.toLowerCase().includes(svSearch.toLowerCase()) ||
                          (v.flat || '').toLowerCase().includes(svSearch.toLowerCase())
                      )
                      .map(v => (
                        <tr key={v.id} className="hover:bg-stone-50/60 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-stone-900">{v.tokNo}</td>
                          <td className="py-3 px-4 font-semibold text-stone-900">{v.seva}</td>
                          <td className="py-3 px-4 text-stone-800">{v.name}</td>
                          <td className="py-3 px-4">
                            <span className="bg-stone-100 text-stone-700 text-xs font-medium px-2 py-0.5 rounded">
                              {v.flat}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-right font-bold text-emerald-700">₹ {fmt(v.amt)}</td>
                          <td className="py-3 px-4 text-stone-600 text-xs">{fmtDate(v.date)}</td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex gap-1.5 justify-end">
                              <button
                                onClick={() => handlePrintReceipt(v, true)}
                                className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium px-2.5 py-1 rounded inline-flex items-center gap-1 transition-colors"
                              >
                                <Printer className="w-3 h-3 text-[#991B1B]" />
                                <span>Receipt</span>
                              </button>
                              <button
                                onClick={() => shareWhatsAppSeva(v)}
                                className="bg-[#25D366] hover:bg-[#20bd5a] text-white p-1.5 rounded transition-colors"
                              >
                                <PhoneCall className="w-3 h-3" />
                              </button>
                              {isAdmin && (
                                <>
                                  <button
                                    onClick={() => setSvModal({ open: true, item: v })}
                                    className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm('Delete this seva booking?')) {
                                        handleDeleteSeva(v.id);
                                      }
                                    }}
                                    className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: SETTINGS (ADMIN ONLY) */}
        {activeTab === 'settings' && isAdmin && (
          <div className="space-y-6">
            {/* Organization Settings */}
            <div className="bg-white border border-stone-200 rounded p-6 shadow-sm">
              <h2 className="text-lg font-serif font-bold text-[#1A1A1A] mb-4 pb-2 border-b border-stone-100">
                Organization &amp; Event Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    value={settings.org}
                    onChange={e => handleSaveSettings({ ...settings, org: e.target.value })}
                    className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                    Event Location
                  </label>
                  <input
                    type="text"
                    value={settings.location}
                    onChange={e => handleSaveSettings({ ...settings, location: e.target.value })}
                    className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                    UPI ID (for Receipts QR)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. society@upi"
                    value={settings.upi}
                    onChange={e => handleSaveSettings({ ...settings, upi: e.target.value })}
                    className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                    UPI Payee Name
                  </label>
                  <input
                    type="text"
                    value={settings.payee}
                    onChange={e => handleSaveSettings({ ...settings, payee: e.target.value })}
                    className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                    Logo
                  </label>
                  <label className="border border-dashed border-stone-300 rounded p-4 text-center cursor-pointer hover:border-[#991B1B] block bg-stone-50">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = evt => {
                            handleSaveSettings({ ...settings, logo: evt.target?.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                    {settings.logo ? (
                      <img src={settings.logo} alt="Logo" className="max-h-20 mx-auto object-contain mb-2" />
                    ) : null}
                    <p className="text-xs text-stone-500 font-medium">
                      {settings.logo ? 'Click to change logo' : 'Click to upload event logo (PNG/JPG)'}
                    </p>
                  </label>
                </div>
              </div>
            </div>

            {/* Admin Password */}
            <div className="bg-white border border-stone-200 rounded p-6 shadow-sm">
              <h2 className="text-lg font-serif font-bold text-[#1A1A1A] mb-4 pb-2 border-b border-stone-100">
                Admin Security Password
              </h2>
              <form
                onSubmit={async e => {
                  e.preventDefault();
                  const p1 = (e.currentTarget.elements.namedItem('p1') as HTMLInputElement).value;
                  const p2 = (e.currentTarget.elements.namedItem('p2') as HTMLInputElement).value;
                  if (!p1) return alert('Enter a password.');
                  if (p1 !== p2) return alert('Passwords do not match.');
                  const hash = await sha256(p1);
                  handleSaveSettings({ ...settings, adminHash: hash });
                  alert('Password updated!');
                  (e.target as HTMLFormElement).reset();
                }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                    New Password
                  </label>
                  <input
                    name="p1"
                    type="password"
                    placeholder="Enter new password"
                    className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                    Confirm Password
                  </label>
                  <input
                    name="p2"
                    type="password"
                    placeholder="Confirm new password"
                    className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
                  />
                </div>
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    className="bg-stone-900 text-white hover:bg-stone-800 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded transition-colors"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </div>

            {/* Data Management & Danger Zone */}
            <div className="bg-white border border-stone-200 rounded p-6 shadow-sm">
              <h2 className="text-lg font-serif font-bold text-[#1A1A1A] mb-4 pb-2 border-b border-stone-100">
                Data Synchronization &amp; Backup
              </h2>
              <div className="flex flex-wrap gap-3 mb-6">
                <button
                  onClick={handleExportExcel}
                  className="bg-emerald-700 text-white hover:bg-emerald-800 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded transition-colors"
                >
                  Export All Sheets to Excel
                </button>
                <button
                  onClick={handleSaveHTML}
                  className="bg-[#991B1B] text-white hover:bg-[#7F1D1D] text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded transition-colors"
                >
                  Download Standalone HTML
                </button>
              </div>

              <div className="border border-red-200 bg-red-50/40 rounded p-4">
                <h3 className="text-sm font-bold text-red-800 mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>Danger Zone</span>
                </h3>
                <p className="text-xs text-stone-600 mb-3">
                  Permanently wipe all records from your local storage. Cannot be undone.
                </p>
                <button
                  onClick={async () => {
                    const ans = prompt('Type DELETE to permanently clear all data:');
                    if (ans === 'DELETE') {
                      localStorage.clear();
                      setExpenses([]);
                      setContributions([]);
                      setSponsors([]);
                      setSevas([]);
                      try {
                        await cloudClearAllData();
                      } catch (err) {
                        console.warn('Cloud clear warning', err);
                      }
                      alert('All data reset.');
                    }
                  }}
                  className="bg-red-600 text-white hover:bg-red-700 text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded transition-colors"
                >
                  Clear All Data
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODALS */}
      {/* 1. Universal Share Modal */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-stone-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-lg font-serif font-bold text-[#991B1B] flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                <span>Universal Mobile Snapshot</span>
              </h3>
              <button
                onClick={() => setShareModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-xl font-bold leading-none"
              >
                ×
              </button>
            </div>

            {/* Direct File Share (Works 100% on iOS and Android) */}
            <div className="bg-emerald-50 border border-emerald-200 rounded p-4 space-y-2">
              <div className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Zero Server • 100% Offline Compatible</span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Send a self-contained snapshot directly to residents via WhatsApp, AirDrop, or Drive without URL length restrictions.
              </p>
              <button
                onClick={handleShareSnapshotFile}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider py-2.5 rounded shadow-sm transition-colors mt-2"
              >
                📤 Send / Share Snapshot File
              </button>
            </div>

            {/* Live QR Code Scanner */}
            <div className="bg-stone-50 border border-stone-200 rounded p-4 text-center space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-stone-700">
                📷 Scan with Phone Camera (Instant Live View)
              </div>
              <div className="inline-block p-2 bg-white rounded border border-stone-300 shadow-xs">
                <div ref={shareQrRef} />
              </div>
            </div>

            {/* Web Link */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                Web Link
              </label>
              <textarea
                value={shareUrl}
                readOnly
                rows={2}
                onClick={e => (e.target as HTMLTextAreaElement).select()}
                className="w-full text-xs font-mono bg-stone-50 border border-stone-200 rounded p-2 text-stone-600 outline-none resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                onClick={() => setShareModalOpen(false)}
                className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded"
              >
                Close
              </button>
              <button
                onClick={handleCopyLink}
                className="bg-[#991B1B] hover:bg-[#7F1D1D] text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded inline-flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedLink ? '✓ Copied' : 'Copy Link'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Expense Modal */}
      {expModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={e => {
              e.preventDefault();
              const form = e.currentTarget;
              const item = (form.elements.namedItem('item') as HTMLInputElement).value.trim();
              const est = parseFloat((form.elements.namedItem('est') as HTMLInputElement).value) || 0;
              const adv = parseFloat((form.elements.namedItem('adv') as HTMLInputElement).value) || 0;
              const bal = parseFloat((form.elements.namedItem('bal') as HTMLInputElement).value) || 0;
              if (!item) return alert('Enter an item description.');

              const row: Expense = {
                id: expModal.item?.id || Date.now().toString(),
                item,
                est,
                adv,
                bal,
                act: adv + bal
              };

              handleSaveExpense(row);
              setExpModal({ open: false });
            }}
            className="bg-white rounded-lg border border-stone-200 shadow-2xl max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-lg font-serif font-bold text-[#991B1B]">
                {expModal.item ? 'Edit Expense' : 'Add Expense'}
              </h3>
              <button
                type="button"
                onClick={() => setExpModal({ open: false })}
                className="text-stone-400 hover:text-stone-700 text-xl font-bold leading-none"
              >
                ×
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                Item / Description *
              </label>
              <input
                name="item"
                defaultValue={expModal.item?.item || ''}
                placeholder="e.g. Flower Decoration"
                required
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Estimated (₹)
                </label>
                <input
                  name="est"
                  type="number"
                  step="0.01"
                  defaultValue={expModal.item?.est || ''}
                  className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Advance (₹)
                </label>
                <input
                  name="adv"
                  type="number"
                  step="0.01"
                  defaultValue={expModal.item?.adv || ''}
                  className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Balance (₹)
                </label>
                <input
                  name="bal"
                  type="number"
                  step="0.01"
                  defaultValue={expModal.item?.bal || ''}
                  className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setExpModal({ open: false })}
                className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#991B1B] hover:bg-[#7F1D1D] text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded"
              >
                Save Expense
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Contribution Modal */}
      {ctModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={e => {
              e.preventDefault();
              const form = e.currentTarget;
              const name = (form.elements.namedItem('name') as HTMLInputElement).value.trim();
              const flat = (form.elements.namedItem('flat') as HTMLInputElement).value.trim();
              const amt = parseFloat((form.elements.namedItem('amt') as HTMLInputElement).value);
              const date = (form.elements.namedItem('date') as HTMLInputElement).value;
              const pay = (form.elements.namedItem('pay') as HTMLSelectElement).value;
              const txn = (form.elements.namedItem('txn') as HTMLInputElement).value.trim();
              const notes = (form.elements.namedItem('notes') as HTMLTextAreaElement).value.trim();

              if (!name || !flat || !amt || !date) return alert('Please fill in required fields.');

              const row: Contribution = {
                id: ctModal.item?.id || Date.now().toString(),
                rcptNo: ctModal.item?.rcptNo || getNextNum('eg_rc_num', 'GE-2026-'),
                name,
                flat,
                amt,
                date,
                pay,
                txn,
                notes
              };

              handleSaveContribution(row);
              setCtModal({ open: false });
            }}
            className="bg-white rounded-lg border border-stone-200 shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-lg font-serif font-bold text-[#991B1B]">
                {ctModal.item ? 'Edit Contribution' : 'Add Contribution'}
              </h3>
              <button
                type="button"
                onClick={() => setCtModal({ open: false })}
                className="text-stone-400 hover:text-stone-700 text-xl font-bold leading-none"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Contributor Name *
                </label>
                <input
                  name="name"
                  defaultValue={ctModal.item?.name || ''}
                  required
                  placeholder="Full name"
                  className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Flat Number *
                </label>
                <input
                  name="flat"
                  defaultValue={ctModal.item?.flat || ''}
                  required
                  placeholder="e.g. B-1254"
                  className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Amount (₹) *
                </label>
                <input
                  name="amt"
                  type="number"
                  step="1"
                  min="1"
                  defaultValue={ctModal.item?.amt || ''}
                  required
                  placeholder="e.g. 1000"
                  className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Date *
                </label>
                <input
                  name="date"
                  type="date"
                  defaultValue={ctModal.item?.date || today()}
                  required
                  className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Payment Mode
                </label>
                <select
                  name="pay"
                  defaultValue={ctModal.item?.pay || 'UPI'}
                  className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
                >
                  <option>UPI</option>
                  <option>Bank Transfer</option>
                  <option>Cash</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Transaction Ref ID
                </label>
                <input
                  name="txn"
                  defaultValue={ctModal.item?.txn || ''}
                  placeholder="UPI Ref / Txn ID"
                  className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  name="notes"
                  defaultValue={ctModal.item?.notes || ''}
                  placeholder="Additional notes..."
                  className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setCtModal({ open: false })}
                className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#991B1B] hover:bg-[#7F1D1D] text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded"
              >
                Save Contribution
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. Sponsor Modal */}
      {spModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={e => {
              e.preventDefault();
              const form = e.currentTarget;
              const det = (form.elements.namedItem('det') as HTMLTextAreaElement).value.trim();
              const est = parseFloat((form.elements.namedItem('est') as HTMLInputElement).value) || 0;
              const act = parseFloat((form.elements.namedItem('act') as HTMLInputElement).value) || 0;
              if (!det) return alert('Enter sponsor details.');

              const row: Sponsor = {
                id: spModal.item?.id || Date.now().toString(),
                invNo: spModal.item?.invNo || getNextNum('eg_sp_num', 'SP-2026-'),
                det,
                est,
                act
              };

              handleSaveSponsor(row);
              setSpModal({ open: false });
            }}
            className="bg-white rounded-lg border border-stone-200 shadow-2xl max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-lg font-serif font-bold text-[#991B1B]">
                {spModal.item ? 'Edit Sponsor' : 'Add Sponsor'}
              </h3>
              <button
                type="button"
                onClick={() => setSpModal({ open: false })}
                className="text-stone-400 hover:text-stone-700 text-xl font-bold leading-none"
              >
                ×
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                Sponsor Details *
              </label>
              <textarea
                name="det"
                defaultValue={spModal.item?.det || ''}
                required
                placeholder="Company / Sponsor name, contact person, etc."
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Estimated (₹)
                </label>
                <input
                  name="est"
                  type="number"
                  step="0.01"
                  defaultValue={spModal.item?.est || ''}
                  className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Actual Amount (₹)
                </label>
                <input
                  name="act"
                  type="number"
                  step="0.01"
                  defaultValue={spModal.item?.act || ''}
                  className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setSpModal({ open: false })}
                className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#991B1B] hover:bg-[#7F1D1D] text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded"
              >
                Save Sponsor
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 5. Seva Booking Modal */}
      {svModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={e => {
              e.preventDefault();
              const form = e.currentTarget;
              const sel = (form.elements.namedItem('sevaSelect') as HTMLSelectElement).value;
              const custom = (form.elements.namedItem('sevaCustom') as HTMLInputElement)?.value.trim();
              const seva = sel === '__other__' ? custom : sel;
              const name = (form.elements.namedItem('name') as HTMLInputElement).value.trim();
              const flat = (form.elements.namedItem('flat') as HTMLInputElement).value.trim();
              const amt = parseFloat((form.elements.namedItem('amt') as HTMLInputElement).value);
              const date = (form.elements.namedItem('date') as HTMLInputElement).value;

              if (!seva || !name || !flat || !amt || !date) return alert('Please fill in required fields.');

              const row: SevaBooking = {
                id: svModal.item?.id || Date.now().toString(),
                tokNo: svModal.item?.tokNo || getNextNum('eg_sv_num', 'SV-2026-'),
                seva,
                name,
                flat,
                amt,
                date
              };

              handleSaveSeva(row);
              setSvModal({ open: false });
            }}
            className="bg-white rounded-lg border border-stone-200 shadow-2xl max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-lg font-serif font-bold text-[#991B1B]">
                {svModal.item ? 'Edit Seva Booking' : 'Add Seva Booking'}
              </h3>
              <button
                type="button"
                onClick={() => setSvModal({ open: false })}
                className="text-stone-400 hover:text-stone-700 text-xl font-bold leading-none"
              >
                ×
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                Seva Name *
              </label>
              <select
                name="sevaSelect"
                defaultValue={svModal.item?.seva || ''}
                onChange={e => {
                  const val = e.target.value;
                  const customInput = document.getElementById('sevaCustomInput') as HTMLInputElement;
                  const amtInput = document.getElementById('sevaAmtInput') as HTMLInputElement;
                  if (customInput) customInput.style.display = val === '__other__' ? 'block' : 'none';
                  if (val && val !== '__other__') {
                    const match = sevaCatalogue.find(s => s.name === val);
                    if (match && amtInput) amtInput.value = String(match.amt);
                  }
                }}
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
              >
                <option value="">-- Select a Seva --</option>
                {sevaCatalogue.map(sc => (
                  <option key={sc.id} value={sc.name}>
                    {sc.name} — ₹{fmt(sc.amt)}
                  </option>
                ))}
                <option value="__other__">Other (custom)…</option>
              </select>
              <input
                id="sevaCustomInput"
                name="sevaCustom"
                placeholder="Enter custom seva name"
                style={{ display: 'none' }}
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B] mt-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Resident Name *
                </label>
                <input
                  name="name"
                  defaultValue={svModal.item?.name || ''}
                  required
                  placeholder="Full name"
                  className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Flat Number *
                </label>
                <input
                  name="flat"
                  defaultValue={svModal.item?.flat || ''}
                  required
                  placeholder="e.g. A-101"
                  className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Amount (₹) *
                </label>
                <input
                  id="sevaAmtInput"
                  name="amt"
                  type="number"
                  step="1"
                  min="1"
                  defaultValue={svModal.item?.amt || ''}
                  required
                  placeholder="e.g. 500"
                  className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Date *
                </label>
                <input
                  name="date"
                  type="date"
                  defaultValue={svModal.item?.date || today()}
                  required
                  className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setSvModal({ open: false })}
                className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#991B1B] hover:bg-[#7F1D1D] text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded"
              >
                Save Booking
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 6. Seva Catalogue Item Modal */}
      {scModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={e => {
              e.preventDefault();
              const form = e.currentTarget;
              const name = (form.elements.namedItem('name') as HTMLInputElement).value.trim();
              const amt = parseFloat((form.elements.namedItem('amt') as HTMLInputElement).value) || 0;
              if (!name) return alert('Enter a seva name.');

              const row: SevaCatalogueItem = {
                id: scModal.item?.id || Date.now().toString(),
                name,
                amt
              };

              handleSaveSevaCatalogue(row);
              setScModal({ open: false });
            }}
            className="bg-white rounded-lg border border-stone-200 shadow-2xl max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-lg font-serif font-bold text-[#991B1B]">
                {scModal.item ? 'Edit Catalogue Seva' : 'Add Catalogue Seva'}
              </h3>
              <button
                type="button"
                onClick={() => setScModal({ open: false })}
                className="text-stone-400 hover:text-stone-700 text-xl font-bold leading-none"
              >
                ×
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                Seva Name *
              </label>
              <input
                name="name"
                defaultValue={scModal.item?.name || ''}
                required
                placeholder="e.g. Flower Seva"
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                Suggested Amount (₹)
              </label>
              <input
                name="amt"
                type="number"
                defaultValue={scModal.item?.amt || ''}
                placeholder="0"
                className="w-full border border-stone-300 rounded px-3 py-2 text-sm outline-none focus:border-[#991B1B]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setScModal({ open: false })}
                className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#991B1B] hover:bg-[#7F1D1D] text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded"
              >
                Save Catalogue Item
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PRINT CONTAINER (PRINT MEDIA ONLY) */}
      <div id="billContainer" className="bill-container">
        {printData?.type === 'receipt' && (
          <div className="receipt max-w-2xl mx-auto p-8 bg-white border-2 border-[#991B1B] font-sans">
            <div className="flex items-center gap-4 border-b-2 border-[#991B1B] pb-4 mb-4">
              {settings.logo && (
                <img src={settings.logo} alt="Logo" className="w-16 h-16 object-contain" />
              )}
              <div className="flex-1 text-center">
                <h2 className="text-2xl font-serif font-black text-[#991B1B]">
                  {settings.org || 'Brigade Eldorado'}
                </h2>
                <h3 className="text-sm font-bold text-stone-800">3rd Year Ganeshotsava</h3>
                <p className="text-xs text-stone-500">14th September – 18th September 2026</p>
                <p className="text-xs text-stone-500">{settings.location}</p>
              </div>
            </div>

            <div className="flex justify-between text-xs py-2 border-b border-stone-200 mb-3">
              <span><strong>Receipt / Token No:</strong> {printData.item.rcptNo || printData.item.tokNo}</span>
              <span><strong>Date:</strong> {fmtDate(printData.item.date)}</span>
            </div>

            <div className="space-y-2 text-xs py-2">
              <div className="flex">
                <span className="w-1/3 font-bold uppercase tracking-wider text-stone-600">Name</span>
                <span className="w-2/3 font-semibold">{printData.item.name}</span>
              </div>
              <div className="flex">
                <span className="w-1/3 font-bold uppercase tracking-wider text-stone-600">Flat / Unit</span>
                <span className="w-2/3">{printData.item.flat}</span>
              </div>
              <div className="flex">
                <span className="w-1/3 font-bold uppercase tracking-wider text-stone-600">Type</span>
                <span className="w-2/3">
                  {printData.item.isSeva ? `Seva Booking (${printData.item.seva})` : 'Resident Contribution'}
                </span>
              </div>
              {printData.item.pay && (
                <div className="flex">
                  <span className="w-1/3 font-bold uppercase tracking-wider text-stone-600">Payment Mode</span>
                  <span className="w-2/3">{printData.item.pay} {printData.item.txn && `(Ref: ${printData.item.txn})`}</span>
                </div>
              )}
            </div>

            <div className="my-6 p-4 text-center bg-amber-50/50 border border-amber-200 rounded">
              <div className="text-[10px] font-bold uppercase tracking-widest text-stone-600">Amount Received</div>
              <div className="text-3xl font-mono font-bold text-[#991B1B] my-1">
                ₹ {fmt(printData.item.amt)}
              </div>
              <div className="text-xs italic text-stone-600">{numWords(printData.item.amt)}</div>
            </div>

            {settings.upi && (
              <div className="text-center my-4">
                <div ref={rcpQrRef} className="inline-block p-2 border border-stone-300 rounded" />
                <div className="text-[10px] text-stone-500 mt-1">Scan to pay via UPI</div>
              </div>
            )}

            <div className="text-[10px] text-stone-500 border-t border-stone-200 pt-3 mt-4 leading-relaxed">
              <strong>Disclaimer:</strong> Funds collected are held in a dedicated account solely for Ganeshotsava 2026 celebration expenses. All contributions are voluntary.
            </div>
            <div className="text-center text-xs text-stone-600 border-t border-stone-200 pt-3 mt-4">
              Thank you for your generous contribution and support 🙏<br />
              <strong>Ganapati Bappa Morya!</strong>
            </div>
          </div>
        )}

        {printData?.type === 'invoice' && (
          <div className="invoice max-w-2xl mx-auto p-8 bg-white border border-stone-300 font-sans">
            <div className="flex justify-between items-start border-b-2 border-[#991B1B] pb-4 mb-6">
              <div>
                <h2 className="text-2xl font-serif font-black text-[#991B1B]">
                  {settings.org || 'Brigade Eldorado'}
                </h2>
                <p className="text-xs text-stone-500">3rd Year Ganeshotsava (14th – 18th Sept 2026)</p>
                <p className="text-xs text-stone-500">{settings.location}</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-[#991B1B] uppercase tracking-wider">Sponsorship Invoice</div>
                <div className="text-xs mt-1"><strong>Invoice No:</strong> {printData.item.invNo}</div>
                <div className="text-xs text-stone-600"><strong>Date:</strong> {new Date().toLocaleDateString('en-IN')}</div>
              </div>
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded p-4 mb-6">
              <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                Sponsor Details
              </div>
              <div className="text-sm font-semibold whitespace-pre-line text-stone-900">
                {printData.item.det}
              </div>
            </div>

            <table className="w-full text-left border-collapse text-xs mb-4">
              <thead>
                <tr className="bg-[#991B1B] text-white uppercase text-[10px] tracking-wider">
                  <th className="p-2.5">#</th>
                  <th className="p-2.5">Description</th>
                  <th className="p-2.5 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-stone-200">
                  <td className="p-2.5">1</td>
                  <td className="p-2.5">Sponsorship Contribution — Ganeshotsava 2026</td>
                  <td className="p-2.5 text-right font-mono font-bold">₹ {fmt(printData.item.act)}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="font-bold border-t-2 border-[#991B1B] text-sm">
                  <td colSpan={2} className="p-2.5">Total Amount</td>
                  <td className="p-2.5 text-right font-mono text-[#991B1B]">₹ {fmt(printData.item.act)}</td>
                </tr>
              </tfoot>
            </table>

            <div className="text-right text-xs italic text-stone-500 mb-6">
              {numWords(printData.item.act)}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded p-4 text-xs text-stone-700 mb-8">
              <strong>Thank you for your generous partnership &amp; sponsorship! 🙏</strong><br />
              Your support makes this celebration vibrant for all resident families.<br />
              <em>Ganapati Bappa Morya!</em>
            </div>

            <div className="flex justify-between items-end border-t border-stone-200 pt-4 text-xs text-stone-600">
              <div>
                Brigade Eldorado Residents Association<br />
                Ganeshotsava Committee 2026
              </div>
              <div className="text-right">
                <div className="w-36 border-t border-stone-900 mb-1 ml-auto mt-6" />
                Authorized Signatory
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default App;
