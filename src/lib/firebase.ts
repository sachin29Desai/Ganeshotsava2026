import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  memoryLocalCache,
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  getDocs,
  getDocsFromServer,
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
import { DEFAULT_SEVAS } from '../utils/helpers';
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

// Initialize Firestore with custom database ID and auto-detecting long polling fallback
const customDbId =
  firebaseConfigData.firestoreDatabaseId && firebaseConfigData.firestoreDatabaseId !== '(default)'
    ? firebaseConfigData.firestoreDatabaseId
    : undefined;

let firestoreInstance;
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

export const db = firestoreInstance;

export type SyncStatus = 'connecting' | 'connected' | 'offline' | 'synced' | 'saving' | 'error';

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

/**
 * Fetch fresh data directly from Firestore servers (bypassing any stale local client cache)
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
    expSnap,
    ctSnap,
    spSnap,
    csSnap,
    svSnap,
    scSnap,
    hundiSnap,
    aucSnap,
    settingsSnap,
    countersSnap
  ] = await Promise.all([
    getDocsFromServer(collection(db, 'expenses')).catch(() => getDocs(collection(db, 'expenses'))),
    getDocsFromServer(collection(db, 'contributions')).catch(() => getDocs(collection(db, 'contributions'))),
    getDocsFromServer(collection(db, 'sponsors')).catch(() => getDocs(collection(db, 'sponsors'))),
    getDocsFromServer(collection(db, 'commercialStalls')).catch(() => getDocs(collection(db, 'commercialStalls'))),
    getDocsFromServer(collection(db, 'sevas')).catch(() => getDocs(collection(db, 'sevas'))),
    getDocsFromServer(collection(db, 'sevaCatalogue')).catch(() => getDocs(collection(db, 'sevaCatalogue'))),
    getDocsFromServer(collection(db, 'hundi')).catch(() => getDocs(collection(db, 'hundi'))),
    getDocsFromServer(collection(db, 'auctions')).catch(() => getDocs(collection(db, 'auctions'))),
    getDocFromServer(doc(db, 'settings', 'config')).catch(() => null),
    getDocFromServer(doc(db, 'metadata', 'counters')).catch(() => null)
  ]);

  const expenses: Expense[] = [];
  expSnap.forEach((d) => expenses.push({ id: d.id, ...d.data() } as Expense));

  const contributions: Contribution[] = [];
  ctSnap.forEach((d) => contributions.push({ id: d.id, ...d.data() } as Contribution));

  const sponsors: Sponsor[] = [];
  spSnap.forEach((d) => sponsors.push({ id: d.id, ...d.data() } as Sponsor));

  const commercialStalls: CommercialStall[] = [];
  csSnap.forEach((d) => commercialStalls.push({ id: d.id, ...d.data() } as CommercialStall));

  const sevas: SevaBooking[] = [];
  svSnap.forEach((d) => sevas.push({ id: d.id, ...d.data() } as SevaBooking));

  const sevaCatalogue: SevaCatalogueItem[] = [];
  scSnap.forEach((d) => sevaCatalogue.push({ id: d.id, ...d.data() } as SevaCatalogueItem));

  const hundi: HundiCollection[] = [];
  hundiSnap.forEach((d) => hundi.push({ id: d.id, ...d.data() } as HundiCollection));

  const auctions: AuctionItem[] = [];
  aucSnap.forEach((d) => auctions.push({ id: d.id, ...d.data() } as AuctionItem));

  const settings = settingsSnap && settingsSnap.exists() ? (settingsSnap.data() as AppSettings) : undefined;
  const counters = countersSnap && countersSnap.exists() ? (countersSnap.data() as any) : undefined;

  return {
    expenses,
    contributions,
    sponsors,
    commercialStalls,
    sevas,
    sevaCatalogue: sevaCatalogue.length > 0 ? sevaCatalogue : DEFAULT_SEVAS,
    hundi,
    auctions,
    settings,
    counters
  };
}

/**
 * Subscribe to all Firestore collections with real-time listeners.
 */
export function initFirestoreSync(listeners: FirestoreListeners, initialState?: AppState): () => void {
  listeners.onStatusChange?.('connecting');
  const unsubscribes: Unsubscribe[] = [];

  try {
    // 1. Expenses Collection Listener
    const unsubExp = onSnapshot(
      collection(db, 'expenses'),
      (snap) => {
        const items: Expense[] = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() } as Expense));
        listeners.onExpenses?.(items);
        listeners.onStatusChange?.('synced');
      },
      (err) => {
        console.warn('Expenses listener warning:', err);
        listeners.onStatusChange?.('offline', err.message);
      }
    );
    unsubscribes.push(unsubExp);

    // 2. Contributions Collection Listener
    const unsubCt = onSnapshot(
      collection(db, 'contributions'),
      (snap) => {
        const items: Contribution[] = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() } as Contribution));
        listeners.onContributions?.(items);
        listeners.onStatusChange?.('synced');
      },
      (err) => {
        console.warn('Contributions listener warning:', err);
        listeners.onStatusChange?.('offline', err.message);
      }
    );
    unsubscribes.push(unsubCt);

    // 3. Sponsors Collection Listener
    const unsubSp = onSnapshot(
      collection(db, 'sponsors'),
      (snap) => {
        const items: Sponsor[] = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() } as Sponsor));
        listeners.onSponsors?.(items);
        listeners.onStatusChange?.('synced');
      },
      (err) => {
        console.warn('Sponsors listener warning:', err);
        listeners.onStatusChange?.('offline', err.message);
      }
    );
    unsubscribes.push(unsubSp);

    // 3b. Commercial Stalls Collection Listener
    const unsubStalls = onSnapshot(
      collection(db, 'commercialStalls'),
      (snap) => {
        const items: CommercialStall[] = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() } as CommercialStall));
        listeners.onCommercialStalls?.(items);
        listeners.onStatusChange?.('synced');
      },
      (err) => {
        console.warn('Commercial stalls listener warning:', err);
      }
    );
    unsubscribes.push(unsubStalls);

    // 4. Seva Bookings Collection Listener
    const unsubSv = onSnapshot(
      collection(db, 'sevas'),
      (snap) => {
        const items: SevaBooking[] = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() } as SevaBooking));
        listeners.onSevas?.(items);
        listeners.onStatusChange?.('synced');
      },
      (err) => {
        console.warn('Sevas listener warning:', err);
        listeners.onStatusChange?.('offline', err.message);
      }
    );
    unsubscribes.push(unsubSv);

    // 4b. Hundi Collection Listener
    const unsubHundi = onSnapshot(
      collection(db, 'hundi'),
      (snap) => {
        const items: HundiCollection[] = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() } as HundiCollection));
        listeners.onHundi?.(items);
        listeners.onStatusChange?.('synced');
      },
      (err) => {
        console.warn('Hundi listener warning:', err);
      }
    );
    unsubscribes.push(unsubHundi);

    // 4c. Auctions Collection Listener
    const unsubAuctions = onSnapshot(
      collection(db, 'auctions'),
      (snap) => {
        const items: AuctionItem[] = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() } as AuctionItem));
        listeners.onAuctions?.(items);
        listeners.onStatusChange?.('synced');
      },
      (err) => {
        console.warn('Auctions listener warning:', err);
      }
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
        }
        listeners.onStatusChange?.('synced');
      },
      (err) => {
        console.warn('Seva catalogue listener warning:', err);
      }
    );
    unsubscribes.push(unsubSc);

    // 6. Settings Document Listener
    const unsubSettings = onSnapshot(
      doc(db, 'settings', 'config'),
      (snap) => {
        if (snap.exists()) {
          listeners.onSettings?.(snap.data() as AppSettings);
        }
      },
      (err) => {
        console.warn('Settings listener warning:', err);
      }
    );
    unsubscribes.push(unsubSettings);

    // 7. Counters Document Listener
    const unsubCounters = onSnapshot(
      doc(db, 'metadata', 'counters'),
      (snap) => {
        if (snap.exists()) {
          listeners.onCounters?.(snap.data() as { rc?: string; sp?: string; cs?: string; sv?: string; auc?: string });
        }
      },
      (err) => {
        console.warn('Counters listener warning:', err);
      }
    );
    unsubscribes.push(unsubCounters);
  } catch (err: any) {
    console.warn('Firebase initialization error:', err);
    listeners.onStatusChange?.('offline', err?.message);
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
  } catch (err) {
    console.warn('Seed check completed or skipped:', err);
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
      const snap = await getDocs(collection(db, col.name));
      const currentIds = new Set(col.items.map((i) => i.id));
      const toDelete = snap.docs.filter((d) => !currentIds.has(d.id));

      let batch = writeBatch(db);
      let opCount = 0;

      for (const d of toDelete) {
        batch.delete(d.ref);
        opCount++;
        if (opCount >= 400) {
          await batch.commit();
          batch = writeBatch(db);
          opCount = 0;
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
  } catch (err) {
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
