import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache,
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  getDocs,
  getDocsFromCache,
  getDocsFromServer,
  getDoc,
  getDocFromCache,
  getDocFromServer,
  DocumentData,
  Unsubscribe
} from 'firebase/firestore';
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
  AppState
} from '../types';
import { DEFAULT_SEVAS, INITIAL_STATE } from '../utils/helpers';
import firebaseConfigData from '../../firebase-applet-config.json';

const firebaseConfig = {
  projectId: firebaseConfigData.projectId,
  appId: firebaseConfigData.appId,
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
};

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with custom database ID, multi-tab persistent cache, and auto-detecting long polling fallback
const customDbId =
  firebaseConfigData.firestoreDatabaseId && firebaseConfigData.firestoreDatabaseId !== '(default)'
    ? firebaseConfigData.firestoreDatabaseId
    : undefined;

let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(
    app,
    {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      }),
      experimentalAutoDetectLongPolling: true,
      ignoreUndefinedProperties: true
    },
    customDbId
  );
} catch {
  try {
    firestoreInstance = initializeFirestore(
      app,
      {
        localCache: persistentLocalCache(),
        experimentalAutoDetectLongPolling: true,
        ignoreUndefinedProperties: true
      },
      customDbId
    );
  } catch {
    try {
      firestoreInstance = initializeFirestore(
        app,
        {
          localCache: memoryLocalCache(),
          experimentalAutoDetectLongPolling: true,
          ignoreUndefinedProperties: true
        },
        customDbId
      );
    } catch {
      firestoreInstance = getFirestore(app, customDbId);
    }
  }
}

export const db = firestoreInstance;

export type SyncStatus = 'connecting' | 'connected' | 'offline' | 'synced' | 'saving' | 'error' | 'quota-limited';

export interface FirestoreListeners {
  onExpenses?: (expenses: Expense[]) => void;
  onContributions?: (contributions: Contribution[]) => void;
  onSponsors?: (sponsors: Sponsor[]) => void;
  onCommercialStalls?: (stalls: CommercialStall[]) => void;
  onSevas?: (sevas: SevaBooking[]) => void;
  onSevaCatalogue?: (catalogue: SevaCatalogueItem[]) => void;
  onHundi?: (hundi: HundiCollection[]) => void;
  onAuctions?: (auctions: AuctionItem[]) => void;
  onSettings?: (settings: AppSettings) => void;
  onCounters?: (counters: { rc?: string | null; sp?: string | null; cs?: string | null; sv?: string | null; auc?: string | null }) => void;
  onStatusChange?: (status: SyncStatus, error?: string) => void;
}

let isSeeded = false;

const SNAPSHOT_CACHE_KEY = 'eg_ganeshotsava_ledger_cache_v1';

/**
 * Checks if an error is due to Firestore Free Tier daily read/write quota exhaustion
 */
export function isQuotaExceededError(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || (typeof err === 'string' ? err : JSON.stringify(err))).toLowerCase();
  const code = (err.code || '').toLowerCase();
  return (
    code === 'resource-exhausted' ||
    code.includes('resource-exhausted') ||
    code.includes('quota') ||
    msg.includes('quota') ||
    msg.includes('quota limit exceeded') ||
    msg.includes('read units') ||
    msg.includes('free tier database')
  );
}

/**
 * Stores a resilient ledger snapshot in local storage so all features remain instant
 * and fully functional even when daily cloud quotas are exhausted or offline.
 */
export function saveLocalSnapshotBackup(data: Partial<AppState | ServerDataResult>): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const existingStr = window.localStorage.getItem(SNAPSHOT_CACHE_KEY);
    const existing = existingStr ? JSON.parse(existingStr) : {};
    const merged = {
      ...existing,
      ...data,
      lastCachedAt: new Date().toISOString()
    };
    window.localStorage.setItem(SNAPSHOT_CACHE_KEY, JSON.stringify(merged));
  } catch (e) {
    console.warn('Unable to write local ledger snapshot backup:', e);
  }
}

/**
 * Retrieves the cached ledger snapshot from local storage.
 */
export function loadLocalSnapshotBackup(): AppState | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const str = window.localStorage.getItem(SNAPSHOT_CACHE_KEY);
    if (!str) return null;
    const parsed = JSON.parse(str);
    if (parsed && (parsed.expenses || parsed.contributions || parsed.settings)) {
      return parsed as AppState;
    }
  } catch (e) {
    console.warn('Unable to read local ledger snapshot backup:', e);
  }
  return null;
}

/**
 * Safely fetches a collection from Firestore with transparent fallback to
 * local IndexedDB cache, local snapshot backup, and default initial records.
 * Never throws unhandled quota exceptions.
 */
async function fetchCollectionSafely<T>(colName: string, defaultItems: T[] = []): Promise<T[]> {
  // 1. Try standard getDocs (uses server or local IndexedDB cache seamlessly)
  try {
    const snap = await getDocs(collection(db, colName));
    const items: T[] = [];
    snap.forEach((d) => items.push({ id: d.id, ...d.data() } as T));
    if (items.length > 0) return items;
  } catch (err: any) {
    if (isQuotaExceededError(err)) {
      console.warn(`Firestore free daily read quota reached for '${colName}'. Falling back to offline cache.`);
    } else {
      console.warn(`Error querying Firestore collection '${colName}':`, err?.message || err);
    }
  }

  // 2. Fallback: Try reading from local Firestore IndexedDB cache explicitly
  try {
    const cacheSnap = await getDocsFromCache(collection(db, colName));
    const items: T[] = [];
    cacheSnap.forEach((d) => items.push({ id: d.id, ...d.data() } as T));
    if (items.length > 0) return items;
  } catch {
    // Cache may be empty or not yet warmed
  }

  // 3. Fallback: Try reading from localStorage snapshot backup
  const localBackup = loadLocalSnapshotBackup();
  if (localBackup && Array.isArray((localBackup as any)[colName]) && (localBackup as any)[colName].length > 0) {
    return (localBackup as any)[colName];
  }

  // 4. Fallback: Use initial default data
  return defaultItems;
}

/**
 * Safely fetches a document from Firestore with fallback to local cache
 */
async function fetchDocSafely<T>(colName: string, docId: string, defaultDoc: T | null = null): Promise<T | null> {
  try {
    const snap = await getDoc(doc(db, colName, docId));
    if (snap.exists()) return snap.data() as T;
  } catch (err: any) {
    if (isQuotaExceededError(err)) {
      console.warn(`Firestore free daily read quota reached for '${colName}/${docId}'. Falling back to offline cache.`);
    }
  }

  try {
    const cacheSnap = await getDocFromCache(doc(db, colName, docId));
    if (cacheSnap.exists()) return cacheSnap.data() as T;
  } catch {
    // ignore
  }

  const localBackup = loadLocalSnapshotBackup();
  if (localBackup) {
    if (colName === 'settings' && docId === 'config' && localBackup.settings) return localBackup.settings as T;
    if (colName === 'metadata' && docId === 'counters' && localBackup.counters) return localBackup.counters as T;
  }

  return defaultDoc;
}

/**
 * Fetch fresh data directly from Firestore or local persistent cache without throwing quota errors
 */
export interface ServerDataResult {
  expenses: Expense[];
  contributions: Contribution[];
  sponsors: Sponsor[];
  commercialStalls: CommercialStall[];
  sevas: SevaBooking[];
  sevaCatalogue: SevaCatalogueItem[];
  hundi: HundiCollection[];
  auctions: AuctionItem[];
  settings?: AppSettings;
  counters?: { rc?: string | null; sp?: string | null; cs?: string | null; sv?: string | null; auc?: string | null };
}

export async function fetchFreshDataFromServer(): Promise<ServerDataResult> {
  const [
    expenses,
    contributions,
    sponsors,
    commercialStalls,
    sevas,
    sevaCatalogue,
    hundi,
    auctions,
    settings,
    counters
  ] = await Promise.all([
    fetchCollectionSafely<Expense>('expenses', INITIAL_STATE.expenses),
    fetchCollectionSafely<Contribution>('contributions', INITIAL_STATE.contributions),
    fetchCollectionSafely<Sponsor>('sponsors', INITIAL_STATE.sponsors || []),
    fetchCollectionSafely<CommercialStall>('commercialStalls', INITIAL_STATE.commercialStalls || []),
    fetchCollectionSafely<SevaBooking>('sevas', INITIAL_STATE.sevas || []),
    fetchCollectionSafely<SevaCatalogueItem>('sevaCatalogue', DEFAULT_SEVAS),
    fetchCollectionSafely<HundiCollection>('hundi', []),
    fetchCollectionSafely<AuctionItem>('auctions', []),
    fetchDocSafely<AppSettings>('settings', 'config', INITIAL_STATE.settings),
    fetchDocSafely<{ rc?: string | null; sp?: string | null; cs?: string | null; sv?: string | null; auc?: string | null }>(
      'metadata',
      'counters',
      INITIAL_STATE.counters
    )
  ]);

  const result: ServerDataResult = {
    expenses,
    contributions,
    sponsors,
    commercialStalls,
    sevas,
    sevaCatalogue: sevaCatalogue.length > 0 ? sevaCatalogue : DEFAULT_SEVAS,
    hundi,
    auctions,
    settings: settings || INITIAL_STATE.settings,
    counters: counters || INITIAL_STATE.counters
  };

  // Keep local snapshot backup up to date
  saveLocalSnapshotBackup(result);

  return result;
}

/**
 * Subscribe to all Firestore collections with real-time listeners.
 */
export function initFirestoreSync(listeners: FirestoreListeners, initialState?: AppState): () => void {
  listeners.onStatusChange?.('connecting');
  const unsubscribes: Unsubscribe[] = [];

  const handleSnapshotError = (colName: string, err: any) => {
    if (isQuotaExceededError(err)) {
      console.warn(`Firestore read quota reached on '${colName}'. Falling back to local offline cache.`);
      listeners.onStatusChange?.('quota-limited', 'Daily free cloud read quota reached. Running in offline cache mode.');
    } else {
      console.warn(`${colName} listener warning:`, err?.message || err);
      listeners.onStatusChange?.('offline', err?.message);
    }
  };

  try {
    // 1. Expenses Collection Listener
    const unsubExp = onSnapshot(
      collection(db, 'expenses'),
      (snap) => {
        const items: Expense[] = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() } as Expense));
        listeners.onExpenses?.(items);
        saveLocalSnapshotBackup({ expenses: items });
        listeners.onStatusChange?.('synced');
      },
      (err) => handleSnapshotError('expenses', err)
    );
    unsubscribes.push(unsubExp);

    // 2. Contributions Collection Listener
    const unsubCt = onSnapshot(
      collection(db, 'contributions'),
      (snap) => {
        const items: Contribution[] = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() } as Contribution));
        listeners.onContributions?.(items);
        saveLocalSnapshotBackup({ contributions: items });
        listeners.onStatusChange?.('synced');
      },
      (err) => handleSnapshotError('contributions', err)
    );
    unsubscribes.push(unsubCt);

    // 3. Sponsors Collection Listener
    const unsubSp = onSnapshot(
      collection(db, 'sponsors'),
      (snap) => {
        const items: Sponsor[] = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() } as Sponsor));
        listeners.onSponsors?.(items);
        saveLocalSnapshotBackup({ sponsors: items });
        listeners.onStatusChange?.('synced');
      },
      (err) => handleSnapshotError('sponsors', err)
    );
    unsubscribes.push(unsubSp);

    // 3b. Commercial Stalls Collection Listener
    const unsubStalls = onSnapshot(
      collection(db, 'commercialStalls'),
      (snap) => {
        const items: CommercialStall[] = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() } as CommercialStall));
        listeners.onCommercialStalls?.(items);
        saveLocalSnapshotBackup({ commercialStalls: items });
        listeners.onStatusChange?.('synced');
      },
      (err) => handleSnapshotError('commercialStalls', err)
    );
    unsubscribes.push(unsubStalls);

    // 4. Seva Bookings Collection Listener
    const unsubSv = onSnapshot(
      collection(db, 'sevas'),
      (snap) => {
        const items: SevaBooking[] = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() } as SevaBooking));
        listeners.onSevas?.(items);
        saveLocalSnapshotBackup({ sevas: items });
        listeners.onStatusChange?.('synced');
      },
      (err) => handleSnapshotError('sevas', err)
    );
    unsubscribes.push(unsubSv);

    // 4b. Hundi Collection Listener
    const unsubHundi = onSnapshot(
      collection(db, 'hundi'),
      (snap) => {
        const items: HundiCollection[] = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() } as HundiCollection));
        listeners.onHundi?.(items);
        saveLocalSnapshotBackup({ hundi: items });
        listeners.onStatusChange?.('synced');
      },
      (err) => handleSnapshotError('hundi', err)
    );
    unsubscribes.push(unsubHundi);

    // 4c. Auctions Collection Listener
    const unsubAuctions = onSnapshot(
      collection(db, 'auctions'),
      (snap) => {
        const items: AuctionItem[] = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() } as AuctionItem));
        listeners.onAuctions?.(items);
        saveLocalSnapshotBackup({ auctions: items });
        listeners.onStatusChange?.('synced');
      },
      (err) => handleSnapshotError('auctions', err)
    );
    unsubscribes.push(unsubAuctions);

    // 5. Seva Catalogue Collection Listener
    const unsubSc = onSnapshot(
      collection(db, 'sevaCatalogue'),
      (snap) => {
        const items: SevaCatalogueItem[] = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() } as SevaCatalogueItem));
        if (items.length > 0) {
          listeners.onSevaCatalogue?.(items);
          saveLocalSnapshotBackup({ sevaCatalogue: items });
        }
        listeners.onStatusChange?.('synced');
      },
      (err) => handleSnapshotError('sevaCatalogue', err)
    );
    unsubscribes.push(unsubSc);

    // 6. Settings Document Listener
    const unsubSettings = onSnapshot(
      doc(db, 'settings', 'config'),
      (snap) => {
        if (snap.exists()) {
          const s = snap.data() as AppSettings;
          listeners.onSettings?.(s);
          saveLocalSnapshotBackup({ settings: s });
        }
      },
      (err) => handleSnapshotError('settings', err)
    );
    unsubscribes.push(unsubSettings);

    // 7. Counters Document Listener
    const unsubCounters = onSnapshot(
      doc(db, 'metadata', 'counters'),
      (snap) => {
        if (snap.exists()) {
          const c = snap.data() as { rc?: string; sp?: string; cs?: string; sv?: string; auc?: string };
          listeners.onCounters?.(c);
          saveLocalSnapshotBackup({ counters: c });
        }
      },
      (err) => handleSnapshotError('counters', err)
    );
    unsubscribes.push(unsubCounters);
  } catch (err: any) {
    if (isQuotaExceededError(err)) {
      console.warn('Firebase real-time sync reached quota limits. Operating on local cache.');
      listeners.onStatusChange?.('quota-limited', 'Daily cloud read quota reached. Running in offline cache mode.');
    } else {
      console.warn('Firebase initialization error:', err);
      listeners.onStatusChange?.('offline', err?.message);
    }
  }

  return () => {
    unsubscribes.forEach((unsub) => unsub());
  };
}

/**
 * Seeds initial state if database has no records yet
 */
export async function seedInitialDataIfEmpty(initialState: AppState) {
  try {
    const expSnap = await getDocs(collection(db, 'expenses'));
    if (expSnap.empty && initialState.expenses.length > 0) {
      isSeeded = true;
      const batch = writeBatch(db);

      initialState.expenses.forEach((e) => {
        batch.set(doc(db, 'expenses', e.id), e);
      });

      initialState.contributions.forEach((c) => {
        batch.set(doc(db, 'contributions', c.id), c);
      });

      initialState.sponsors.forEach((s) => {
        batch.set(doc(db, 'sponsors', s.id), s);
      });

      if (initialState.commercialStalls) {
        initialState.commercialStalls.forEach((cs) => {
          batch.set(doc(db, 'commercialStalls', cs.id), cs);
        });
      }

      initialState.sevas.forEach((sv) => {
        batch.set(doc(db, 'sevas', sv.id), sv);
      });

      if (initialState.hundi) {
        initialState.hundi.forEach((h) => {
          batch.set(doc(db, 'hundi', h.id), h);
        });
      }

      if (initialState.auctions) {
        initialState.auctions.forEach((a) => {
          batch.set(doc(db, 'auctions', a.id), a);
        });
      }

      initialState.sevaCatalogue.forEach((sc) => {
        batch.set(doc(db, 'sevaCatalogue', sc.id), sc);
      });

      batch.set(doc(db, 'settings', 'config'), initialState.settings);
      batch.set(doc(db, 'metadata', 'counters'), {
        rc: initialState.counters?.rc || '1',
        sp: initialState.counters?.sp || '0',
        cs: initialState.counters?.cs || '0',
        sv: initialState.counters?.sv || '0',
        auc: initialState.counters?.auc || '0',
      });

      await batch.commit();
      console.log('✅ Initial state synced to Firestore');
    }
  } catch (err: any) {
    if (isQuotaExceededError(err)) {
      console.warn('Seed check bypassed because Firestore daily free quota was reached.');
    } else {
      console.warn('Seed check completed or skipped:', err?.message || err);
    }
  }
}

// --- Cloud Mutation Helpers ---

export async function cloudSaveExpense(expense: Expense) {
  try {
    await setDoc(doc(db, 'expenses', expense.id), { ...expense, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Error saving expense to Firestore:', err);
    throw err;
  }
}

export async function cloudDeleteExpense(id: string) {
  try {
    await deleteDoc(doc(db, 'expenses', id));
  } catch (err) {
    console.error('Error deleting expense from Firestore:', err);
    throw err;
  }
}

export async function cloudSaveContribution(contribution: Contribution) {
  try {
    await setDoc(doc(db, 'contributions', contribution.id), { ...contribution, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Error saving contribution to Firestore:', err);
    throw err;
  }
}

export async function cloudDeleteContribution(id: string) {
  try {
    await deleteDoc(doc(db, 'contributions', id));
  } catch (err) {
    console.error('Error deleting contribution from Firestore:', err);
    throw err;
  }
}

export async function cloudSaveSponsor(sponsor: Sponsor) {
  try {
    await setDoc(doc(db, 'sponsors', sponsor.id), { ...sponsor, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Error saving sponsor to Firestore:', err);
    throw err;
  }
}

export async function cloudDeleteSponsor(id: string) {
  try {
    await deleteDoc(doc(db, 'sponsors', id));
  } catch (err) {
    console.error('Error deleting sponsor from Firestore:', err);
    throw err;
  }
}

export async function cloudSaveCommercialStall(stall: CommercialStall) {
  try {
    await setDoc(doc(db, 'commercialStalls', stall.id), { ...stall, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Error saving commercial stall to Firestore:', err);
    throw err;
  }
}

export async function cloudDeleteCommercialStall(id: string) {
  try {
    await deleteDoc(doc(db, 'commercialStalls', id));
  } catch (err) {
    console.error('Error deleting commercial stall from Firestore:', err);
    throw err;
  }
}

export async function cloudSaveHundi(hundi: HundiCollection) {
  try {
    await setDoc(doc(db, 'hundi', hundi.id), { ...hundi, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Error saving hundi record to Firestore:', err);
    throw err;
  }
}

export async function cloudDeleteHundi(id: string) {
  try {
    await deleteDoc(doc(db, 'hundi', id));
  } catch (err) {
    console.error('Error deleting hundi record from Firestore:', err);
    throw err;
  }
}

export async function cloudSaveAuction(auction: AuctionItem) {
  try {
    await setDoc(doc(db, 'auctions', auction.id), { ...auction, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Error saving auction record to Firestore:', err);
    throw err;
  }
}

export async function cloudDeleteAuction(id: string) {
  try {
    await deleteDoc(doc(db, 'auctions', id));
  } catch (err) {
    console.error('Error deleting auction record from Firestore:', err);
    throw err;
  }
}

export async function cloudSaveSeva(seva: SevaBooking) {
  try {
    await setDoc(doc(db, 'sevas', seva.id), { ...seva, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Error saving seva booking to Firestore:', err);
    throw err;
  }
}

export async function cloudDeleteSeva(id: string) {
  try {
    await deleteDoc(doc(db, 'sevas', id));
  } catch (err) {
    console.error('Error deleting seva booking from Firestore:', err);
    throw err;
  }
}

export async function cloudSaveSevaCatalogueItem(item: SevaCatalogueItem) {
  try {
    await setDoc(doc(db, 'sevaCatalogue', item.id), item);
  } catch (err) {
    console.error('Error saving seva catalogue item to Firestore:', err);
    throw err;
  }
}

export async function cloudDeleteSevaCatalogueItem(id: string) {
  try {
    await deleteDoc(doc(db, 'sevaCatalogue', id));
  } catch (err) {
    console.error('Error deleting seva catalogue item from Firestore:', err);
    throw err;
  }
}

export async function cloudSaveSettings(settings: AppSettings) {
  try {
    await setDoc(doc(db, 'settings', 'config'), settings);
  } catch (err) {
    console.error('Error saving settings to Firestore:', err);
    throw err;
  }
}

export async function cloudSaveCounters(counters: { rc?: string | null; sp?: string | null; cs?: string | null; sv?: string | null; auc?: string | null }) {
  try {
    await setDoc(doc(db, 'metadata', 'counters'), counters);
  } catch (err) {
    console.error('Error saving counters to Firestore:', err);
  }
}

export async function cloudBulkImportContributions(contributions: Contribution[]) {
  try {
    const batch = writeBatch(db);
    contributions.forEach((c) => {
      batch.set(doc(db, 'contributions', c.id), { ...c, updatedAt: new Date().toISOString() });
    });
    await batch.commit();
  } catch (err) {
    console.error('Error bulk importing contributions to Firestore:', err);
    throw err;
  }
}

/**
 * Saves and syncs all application data across all tabs to Firebase Firestore.
 */
export async function cloudSyncAllData(state: AppState) {
  // Always update local snapshot backup first so user changes are never lost
  saveLocalSnapshotBackup(state);

  try {
    const collectionsToSync: Array<{ name: string; items: Array<{ id: string; [key: string]: any }> }> = [
      { name: 'expenses', items: state.expenses || [] },
      { name: 'contributions', items: state.contributions || [] },
      { name: 'sponsors', items: state.sponsors || [] },
      { name: 'commercialStalls', items: state.commercialStalls || [] },
      { name: 'sevas', items: state.sevas || [] },
      { name: 'hundi', items: state.hundi || [] },
      { name: 'auctions', items: state.auctions || [] },
      { name: 'sevaCatalogue', items: state.sevaCatalogue || [] },
    ];

    for (const col of collectionsToSync) {
      let snap;
      try {
        snap = await getDocs(collection(db, col.name));
      } catch (err: any) {
        if (isQuotaExceededError(err)) {
          console.warn(`Read quota exceeded during sync of '${col.name}'. Skipping delete detection and applying direct write.`);
        }
      }

      let batch = writeBatch(db);
      let opCount = 0;

      if (snap) {
        const currentIds = new Set(col.items.map((i) => i.id));
        const toDelete = snap.docs.filter((d) => !currentIds.has(d.id));

        for (const d of toDelete) {
          batch.delete(d.ref);
          opCount++;
          if (opCount >= 400) {
            await batch.commit();
            batch = writeBatch(db);
            opCount = 0;
          }
        }
      }

      for (const item of col.items) {
        batch.set(doc(db, col.name, item.id), { ...item, updatedAt: new Date().toISOString() });
        opCount++;
        if (opCount >= 400) {
          await batch.commit();
          batch = writeBatch(db);
          opCount = 0;
        }
      }

      if (opCount > 0) {
        await batch.commit();
      }
    }

    if (state.settings) {
      await setDoc(doc(db, 'settings', 'config'), state.settings);
    }

    if (state.counters) {
      await setDoc(doc(db, 'metadata', 'counters'), state.counters);
    }
  } catch (err: any) {
    if (isQuotaExceededError(err)) {
      console.warn('Cloud write quota reached. Data safely secured in local offline ledger.');
      throw new Error('Firestore free daily quota reached for today. Your changes have been securely saved to the local offline ledger.');
    }
    console.error('Error syncing all data to Firestore:', err);
    throw err;
  }
}

export async function cloudClearAllData() {
  try {
    const collections = ['expenses', 'contributions', 'sponsors', 'commercialStalls', 'sevas', 'hundi', 'auctions'];
    for (const colName of collections) {
      const snap = await getDocs(collection(db, colName));
      const batch = writeBatch(db);
      snap.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
    await setDoc(doc(db, 'metadata', 'counters'), { rc: '0', sp: '0', cs: '0', sv: '0', auc: '0' });
  } catch (err) {
    console.error('Error clearing Firestore data:', err);
    throw err;
  }
}
