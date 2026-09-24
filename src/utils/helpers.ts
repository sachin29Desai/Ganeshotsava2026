import { AppState, CommercialStall, Expense, ExpenseBill, SevaCatalogueItem } from '../types';

export const DEFAULT_COMMERCIAL_STALLS: CommercialStall[] = [
  {
    id: 'cs_Y65247537',
    invNo: 'Y65247537',
    particular: 'CANOPY - EDUCATION FEST',
    vendor: 'KESAR INTERNATIONAL SCHOOL',
    det: 'CANOPY - EDUCATION FEST — KESAR INTERNATIONAL SCHOOL',
    est: 20000,
    act: 20000,
    date: '2026-09-01',
    notes: 'UPI'
  },
  {
    id: 'cs_65247538',
    invNo: 'GNS-CS-65247538',
    particular: 'CANOPY - EDUCATION FEST',
    vendor: 'KIDZEE',
    det: 'CANOPY - EDUCATION FEST — KIDZEE',
    est: 12500,
    act: 12500,
    date: '2026-09-07',
    notes: 'CASH 6000+ UPI 6500'
  },
  {
    id: 'cs_65247539',
    invNo: 'GNS-CS-65247539',
    particular: 'CANOPY - EDUCATION FEST',
    vendor: 'BM ENGLISH SCHOOL',
    det: 'CANOPY - EDUCATION FEST — BM ENGLISH SCHOOL',
    est: 15000,
    act: 15000,
    date: '2026-09-07',
    notes: 'NEFT'
  },
  {
    id: 'cs_65247541',
    invNo: 'GNS-CS-65247541',
    particular: 'CANOPY - EDUCATION FEST',
    vendor: 'DEEKSHA\nMILLION DREAMS EVENT',
    det: 'CANOPY - EDUCATION FEST — DEEKSHA\nMILLION DREAMS EVENT',
    est: 20000,
    act: 20000,
    date: '2026-09-07',
    notes: 'NEFT'
  },
  {
    id: 'cs_65247542',
    invNo: 'GNS-CS-65247542',
    particular: 'CANOPY - EDUCATION FEST',
    vendor: 'UNITED INTERNATIONAL SCHOOL',
    det: 'CANOPY - EDUCATION FEST — UNITED INTERNATIONAL SCHOOL',
    est: 30000,
    act: 30000,
    date: '2026-09-07',
    notes: 'UPI'
  }
];

export const DEFAULT_SEVAS: SevaCatalogueItem[] = [
  { id: 'ds1', name: 'Rice (Anna Prasadam)', amt: 0, unit: 'kg', totalRequired: 200, desc: 'Sona Masoori / Basmati rice for grand Mahaprasadam' },
  { id: 'ds2', name: 'Pure Cow Ghee', amt: 0, unit: 'kg', totalRequired: 25, desc: 'Ghee for Deeparadhana, Homa and Modaka preparation' },
  { id: 'ds3', name: 'Flower Garland Seva', amt: 15000, unit: 'Baskets', totalRequired: 5, desc: 'Daily fresh floral decoration for Ganesha' },
  { id: 'ds4', name: 'Cooking Oil', amt: 0, unit: 'Tins (15L)', totalRequired: 8, desc: 'Refined oil for prasadam cooking' },
  { id: 'ds5', name: 'Maha Pooja & Sankalpa Archana', amt: 1001, unit: 'Family Slots', totalRequired: 30, desc: 'Personalized sankalpa pooja with divine prasadam' },
  { id: 'ds6', name: 'Modaka Naivedya (108 Modakas)', amt: 2500, unit: 'Sets', totalRequired: 10, desc: '108 holy modakas offered at evening Maha Mangalarathi' },
  { id: 'ds7', name: 'One Day Maha Prasadam Sponsor', amt: 25000, unit: 'Day Sponsorship', totalRequired: 3, desc: 'Full-day community lunch sponsorship' }
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
  commercialStalls: DEFAULT_COMMERCIAL_STALLS,
  sevas: [],
  sevaCatalogue: DEFAULT_SEVAS,
  hundi: [],
  auctions: [],
  settings: {
    org: 'Eldorado',
    location: 'Amphitheatre, Brigade Eldorado',
    upi: '',
    payee: 'Eldorado Ganeshotsava',
    logo: '',
    adminHash: '3cc551dd68cb8a0b7720b812b167715dd6f9c0405d26981eeb560f0b7dd8e616',
    sponsorHash: 'a0c7176691b16f74d4449e8163db3bf87eee545d3881e24987e4b0effea0042c',
    volunteerHash: '1916dd5824e8d6a9a0d3904631bf922f9c2c87f25b6bb0a43e177adcc560831b'
  },
  counters: {
    rc: '1',
    sp: null,
    cs: '65247543',
    sv: null,
    auc: null
  }
};

/**
 * Ensures "Brigade" is not prefixed to Eldorado in receipts, invoices, vouchers, and headers.
 * Uses Eldorado in all places until it is an address.
 */
export const cleanOrgName = (name?: string | null, fallback = 'Eldorado Residents Association'): string => {
  if (!name || !name.trim()) return fallback;
  const cleaned = name
    .replace(/\bBrigade\s+El\s*Dorado\b/gi, 'Eldorado')
    .replace(/\bBrigade\s+Eldorado\b/gi, 'Eldorado')
    .replace(/\bBrigade\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || fallback;
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
 * Formats bytes into human-readable KB or MB.
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Calculates approximate serialized document size in bytes.
 */
export function getExpenseDocumentSize(expense: Expense): number {
  try {
    return new Blob([JSON.stringify(expense)]).size;
  } catch {
    return JSON.stringify(expense).length;
  }
}

/**
 * Downscales and compresses a base64 image data URL using an HTML5 Canvas.
 * Target size is around 60–100 KB per image.
 */
export async function compressImageDataUrl(
  dataUrl: string,
  maxDimension = 950,
  quality = 0.72
): Promise<string> {
  // If not a data:image or already very lightweight (< 90 KB), keep as is
  if (!dataUrl || !dataUrl.startsWith('data:image/') || dataUrl.length < 95000) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width <= 0 || height <= 0) {
        resolve(dataUrl);
        return;
      }
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
        resolve(dataUrl);
        return;
      }

      // Fill white background for transparent images converted to JPEG
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      let compressed = canvas.toDataURL('image/jpeg', quality);

      // If still relatively large (> 140 KB), apply a second pass at lower quality
      if (compressed.length > 150000) {
        compressed = canvas.toDataURL('image/jpeg', 0.58);
      }

      // If compressed is actually smaller than original, use it
      resolve(compressed.length < dataUrl.length ? compressed : dataUrl);
    };

    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Compresses an image or handles a PDF file for bill receipts.
 * - For images: Compresses to max 950px JPEG with quality 0.72 (~60-90 KB).
 * - For PDFs: Rejects if raw file size > 380 KB to prevent breaking Firestore's 1 MB document limit.
 */
export function compressImageFile(
  file: File,
  maxDimension = 950,
  quality = 0.72
): Promise<{ dataUrl: string; name: string; type: string; sizeBytes: number }> {
  return new Promise((resolve, reject) => {
    if (file.type === 'application/pdf') {
      // 380 KB raw binary becomes ~510 KB in Base64
      const MAX_PDF_BYTES = 380 * 1024;
      if (file.size > MAX_PDF_BYTES) {
        reject(
          new Error(
            `PDF "${file.name}" is ${formatBytes(file.size)}, which exceeds the safe ${formatBytes(MAX_PDF_BYTES)} limit for database storage. Please compress the PDF or upload a photo / screenshot of the bill.`
          )
        );
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        resolve({
          dataUrl,
          name: file.name,
          type: 'application/pdf',
          sizeBytes: dataUrl.length
        });
      };
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
          const rawUrl = e.target?.result as string;
          resolve({
            dataUrl: rawUrl,
            name: file.name,
            type: file.type,
            sizeBytes: rawUrl.length
          });
          return;
        }

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        if (dataUrl.length > 150000) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.58);
        }

        resolve({
          dataUrl,
          name: file.name.replace(/\.[^/.]+$/, '') + '.jpg',
          type: 'image/jpeg',
          sizeBytes: dataUrl.length
        });
      };
      img.onerror = () => {
        const rawUrl = e.target?.result as string;
        resolve({
          dataUrl: rawUrl,
          name: file.name,
          type: file.type,
          sizeBytes: rawUrl.length
        });
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Prepares an Expense object for Firestore cloud persistence:
 * 1. Eliminates duplicate base64 string between receiptUrl and bills[0].url (which doubled document size).
 * 2. Auto-compresses any heavy image data URLs across attached bills to fit under 750 KB.
 * 3. Guarantees the expense document stays well below Firestore's 1,048,576 byte hard limit.
 */
export async function prepareExpenseForStorage(expense: Expense): Promise<Expense> {
  const bills = expense.bills || [];
  const hasBills = Array.isArray(bills) && bills.length > 0;

  // 1. Deduplicate: If expense has bills[], DO NOT store the same base64 dataUrl again in receiptUrl!
  // Keeping primary receipt metadata (name, type, date) is enough for backward compatibility.
  let cleanedReceiptUrl: string | undefined = undefined;
  if (!hasBills && expense.receiptUrl) {
    cleanedReceiptUrl = expense.receiptUrl;
  }

  // If no bills and small document, return quickly
  if (!hasBills && (!cleanedReceiptUrl || cleanedReceiptUrl.length < 150000)) {
    return {
      ...expense,
      receiptUrl: cleanedReceiptUrl
    };
  }

  // 2. Compress any large image data URLs in bills
  let processedBills: ExpenseBill[] = bills;
  if (hasBills) {
    processedBills = await Promise.all(
      bills.map(async (bill) => {
        if (bill.url && bill.url.startsWith('data:image/')) {
          const compressed = await compressImageDataUrl(bill.url, 950, 0.72);
          return { ...bill, url: compressed };
        }
        return bill;
      })
    );
  } else if (cleanedReceiptUrl && cleanedReceiptUrl.startsWith('data:image/')) {
    cleanedReceiptUrl = await compressImageDataUrl(cleanedReceiptUrl, 950, 0.72);
  }

  let finalExpense: Expense = {
    ...expense,
    bills: processedBills,
    receiptUrl: cleanedReceiptUrl
  };

  // 3. Size check: Firestore limit is 1,048,576 bytes (~1 MB). Target safe limit is 800 KB.
  let docSize = getExpenseDocumentSize(finalExpense);
  if (docSize > 850000 && processedBills.length > 0) {
    // Second aggressive pass if user attached multiple large files
    processedBills = await Promise.all(
      processedBills.map(async (bill) => {
        if (bill.url && bill.url.startsWith('data:image/')) {
          const ultraCompressed = await compressImageDataUrl(bill.url, 750, 0.50);
          return { ...bill, url: ultraCompressed };
        }
        return bill;
      })
    );
    finalExpense = {
      ...finalExpense,
      bills: processedBills
    };
  }

  return finalExpense;
}
