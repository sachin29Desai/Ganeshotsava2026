import { AppState, Expense, SevaCatalogueItem } from '../types';

export const DEFAULT_SEVAS: SevaCatalogueItem[] = [
  { id: 'ds1', name: 'Flower Seva', amt: 15000 },
  { id: 'ds2', name: 'One Day Prasadam', amt: 20000 },
  { id: 'ds3', name: 'Priest Fee', amt: 10000 },
  { id: 'ds4', name: 'Pooja Items', amt: 15000 },
  { id: 'ds5', name: 'Event Contributions', amt: 10000 },
  { id: 'ds6', name: 'Transports', amt: 10000 },
  { id: 'ds7', name: 'Dhol', amt: 75000 }
];

export const INITIAL_STATE: AppState = {
  expenses: [
    { id: '1788182059860', item: 'Ganesha Idol + Stone Work', est: 58000, adv: 0, bal: 58000, act: 58000 },
    { id: '1788182074852', item: 'Lightings and Decorations and Event Management', est: 125000, adv: 0, bal: 125000, act: 125000 },
    { id: '1788182092539', item: 'Pendal', est: 60000, adv: 0, bal: 60000, act: 60000 },
    { id: '1788182105355', item: 'Dhol', est: 75000, adv: 0, bal: 75000, act: 75000 },
    { id: '1788182119929', item: 'Pujari(Priest) + Pooja Items', est: 20000, adv: 0, bal: 20000, act: 20000 },
    { id: '1788182136085', item: 'Pooja Flowers', est: 15000, adv: 0, bal: 15000, act: 15000 },
    { id: '1788182156979', item: 'Banner(prints,etc)', est: 5000, adv: 0, bal: 5000, act: 5000 },
    { id: '1788182170675', item: 'Gratitude Gifts for our Sponsors', est: 10000, adv: 0, bal: 10000, act: 10000 },
    { id: '1788182183762', item: 'Laddoo + Sweets', est: 40000, adv: 0, bal: 40000, act: 40000 },
    { id: '1788182198126', item: 'Anna Prasadam', est: 400000, adv: 0, bal: 400000, act: 400000 },
    { id: '1788182216029', item: 'Transportations', est: 10000, adv: 0, bal: 10000, act: 10000 },
    { id: '1788182241424', item: 'Cleaning(staff, needs, etc)', est: 5000, adv: 0, bal: 5000, act: 5000 },
    { id: '1788182284933', item: 'Misc', est: 10000, adv: 0, bal: 10000, act: 10000 }
  ],
  contributions: [
    {
      id: '1788183261795',
      rcptNo: 'GE-2026-0001',
      name: 'Abhishek',
      flat: 'B-1254',
      amt: 1000,
      date: '2026-08-29',
      pay: 'UPI',
      txn: '6607281455',
      notes: ''
    }
  ],
  sponsors: [],
  commercialStalls: [],
  sevas: [],
  sevaCatalogue: DEFAULT_SEVAS,
  hundi: [],
  auctions: [],
  settings: {
    org: 'Brigade Eldorado',
    location: 'Amphitheatre, Brigade Eldorado',
    upi: '',
    payee: 'Brigade Eldorado Ganeshotsava',
    logo: '',
    adminHash: '3cc551dd68cb8a0b7720b812b167715dd6f9c0405d26981eeb560f0b7dd8e616',
    sponsorHash: 'a0c7176691b16f74d4449e8163db3bf87eee545d3881e24987e4b0effea0042c',
    volunteerHash: '1916dd5824e8d6a9a0d3904631bf922f9c2c87f25b6bb0a43e177adcc560831b'
  },
  counters: {
    rc: '1',
    sp: null,
    cs: null,
    sv: null,
    auc: null
  }
};

export const fmt = (n: number | string): string => {
  return Number(n || 0).toLocaleString('en-IN');
};

export const fmtDate = (s: string | number | null | undefined): string => {
  if (!s) return '—';
  const str = String(s).trim();
  // If DD-MM-YYYY or DD/MM/YYYY
  const dmMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmMatch) {
    return `${dmMatch[1].padStart(2, '0')}/${dmMatch[2].padStart(2, '0')}/${dmMatch[3]}`;
  }
  // If YYYY-MM-DD
  const ymdMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (ymdMatch) {
    return `${ymdMatch[3].padStart(2, '0')}/${ymdMatch[2].padStart(2, '0')}/${ymdMatch[1]}`;
  }
  const d = new Date(str.includes('T') ? str : str + 'T00:00:00');
  return isNaN(d.getTime())
    ? str
    : `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

export const today = (): string => new Date().toISOString().split('T')[0];

export const numWords = (n: number): string => {
  n = Math.floor(n);
  if (!n) return 'Zero Rupees Only';
  const o = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const t = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  function c(x: number): string {
    if (x < 20) return o[x];
    if (x < 100) return t[Math.floor(x / 10)] + (x % 10 ? ' ' + o[x % 10] : '');
    if (x < 1000) {
      const h = Math.floor(x / 100);
      const rem = x % 100;
      return o[h] + ' Hundred' + (rem ? ' and ' + c(rem) : '');
    }
    if (x < 100000) {
      const th = Math.floor(x / 1000);
      const rem = x % 1000;
      if (!rem) return c(th) + ' Thousand';
      if (rem < 100) return c(th) + ' Thousand and ' + c(rem);
      return c(th) + ' Thousand ' + c(rem);
    }
    if (x < 10000000) {
      const lk = Math.floor(x / 100000);
      const rem = x % 100000;
      if (!rem) return c(lk) + ' Lakh';
      if (rem < 100) return c(lk) + ' Lakh and ' + c(rem);
      return c(lk) + ' Lakh ' + c(rem);
    }
    const cr = Math.floor(x / 10000000);
    const rem = x % 10000000;
    if (!rem) return c(cr) + ' Crore';
    if (rem < 100) return c(cr) + ' Crore and ' + c(rem);
    return c(cr) + ' Crore ' + c(rem);
  }
  return c(n) + ' Rupees Only';
};

export async function sha256(str: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Calculates pending balance for an expense.
 * Dynamically computes Expected (Estimated) - Advance Paid.
 */
export const getExpenseBalance = (e: Partial<Expense>): number => {
  const est = Number(e.est || 0);
  const adv = Number(e.adv || 0);
  return Math.max(0, est - adv);
};

/**
 * Calculates total actual cost for an expense.
 * If estimated and balance are the same, actual is 0.
 * If different, show the actual value (act if entered, or advance/spent amount).
 */
export const getExpenseActual = (e: Partial<Expense>): number => {
  const est = Number(e.est || 0);
  const bal = getExpenseBalance(e);

  // If estimated and balance are the same, actual should be 0
  if (est === bal) {
    return 0;
  }

  // If different, show the actual value
  const act = Number(e.act || 0);
  if (act > 0) {
    return act;
  }
  const adv = Number(e.adv || 0);
  if (adv > 0) {
    return adv;
  }
  return Math.max(0, est - bal);
};

/**
 * Compresses an image or handles a PDF file for bill receipts.
 * Compresses image to max 1400px JPEG to keep Firestore documents lightweight.
 */
export function compressImageFile(
  file: File,
  maxDimension = 1400,
  quality = 0.82
): Promise<{ dataUrl: string; name: string; type: string }> {
  return new Promise((resolve, reject) => {
    if (file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = () => resolve({ dataUrl: reader.result as string, name: file.name, type: 'application/pdf' });
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ dataUrl: e.target?.result as string, name: file.name, type: file.type });
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve({
          dataUrl,
          name: file.name.replace(/\.[^/.]+$/, '') + '.jpg',
          type: 'image/jpeg'
        });
      };
      img.onerror = () => resolve({ dataUrl: e.target?.result as string, name: file.name, type: file.type });
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
