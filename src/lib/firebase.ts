import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  getDocs,
  DocumentData,
  Unsubscribe
} from 'firebase/firestore';
import {
  Expense,
  Contribution,
  Sponsor,
  SevaBooking,
  SevaCatalogueItem,
  AppSettings,
  AppState
} from '../types';
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

// Initialize Firestore with custom database ID if provisioned
export const db = getFirestore(
  app,
  firebaseConfigData.firestoreDatabaseId && firebaseConfigData.firestoreDatabaseId !== '(default)'
    ? firebaseConfigData.firestoreDatabaseId
    : undefined
);

export type SyncStatus = 'connecting' | 'connected' | 'offline' | 'synced' | 'saving' | 'error';

export interface FirestoreListeners {
  onExpenses?: (expenses: Expense[]) => void;
  onContributions?: (contributions: Contribution[]) => void;
  onSponsors?: (sponsors: Sponsor[]) => void;
  onSevas?: (sevas: SevaBooking[]) => void;
  onSevaCatalogue?: (catalogue: SevaCatalogueItem[]) => void;
  onSettings?: (settings: AppSettings) => void;
  onCounters?: (counters: { rc?: string | null; sp?: string | null; sv?: string | null }) => void;
  onStatusChange?: (status: SyncStatus, error?: string) => void;
}

let isSeeded = false;

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
        if (items.length > 0 || isSeeded) {
          listeners.onExpenses?.(items);
        }
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
        if (items.length > 0 || isSeeded) {
          listeners.onContributions?.(items);
        }
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
        if (items.length > 0 || isSeeded) {
          listeners.onSponsors?.(items);
        }
        listeners.onStatusChange?.('synced');
      },
      (err) => {
        console.warn('Sponsors listener warning:', err);
        listeners.onStatusChange?.('offline', err.message);
      }
    );
    unsubscribes.push(unsubSp);

    // 4. Seva Bookings Collection Listener
    const unsubSv = onSnapshot(
      collection(db, 'sevas'),
      (snap) => {
        const items: SevaBooking[] = [];
        snap.forEach((d) => items.push({ id: d.id, ...d.data() } as SevaBooking));
        if (items.length > 0 || isSeeded) {
          listeners.onSevas?.(items);
        }
        listeners.onStatusChange?.('synced');
      },
      (err) => {
        console.warn('Sevas listener warning:', err);
        listeners.onStatusChange?.('offline', err.message);
      }
    );
    unsubscribes.push(unsubSv);

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
          listeners.onCounters?.(snap.data() as { rc?: string; sp?: string; sv?: string });
        }
      },
      (err) => {
        console.warn('Counters listener warning:', err);
      }
    );
    unsubscribes.push(unsubCounters);

    // Auto-seed initial template data if cloud collections are currently empty
    if (initialState) {
      seedInitialDataIfEmpty(initialState);
    }
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

      initialState.sevas.forEach((sv) => {
        batch.set(doc(db, 'sevas', sv.id), sv);
      });

      initialState.sevaCatalogue.forEach((sc) => {
        batch.set(doc(db, 'sevaCatalogue', sc.id), sc);
      });

      batch.set(doc(db, 'settings', 'config'), initialState.settings);
      batch.set(doc(db, 'metadata', 'counters'), {
        rc: initialState.counters?.rc || '1',
        sp: initialState.counters?.sp || '0',
        sv: initialState.counters?.sv || '0',
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

export async function cloudSaveCounters(counters: { rc?: string | null; sp?: string | null; sv?: string | null }) {
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

export async function cloudClearAllData() {
  try {
    const collections = ['expenses', 'contributions', 'sponsors', 'sevas'];
    for (const colName of collections) {
      const snap = await getDocs(collection(db, colName));
      const batch = writeBatch(db);
      snap.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
    await setDoc(doc(db, 'metadata', 'counters'), { rc: '0', sp: '0', sv: '0' });
  } catch (err) {
    console.error('Error clearing Firestore data:', err);
    throw err;
  }
}
