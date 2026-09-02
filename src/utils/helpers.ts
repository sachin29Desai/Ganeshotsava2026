import { AppState, SevaCatalogueItem } from '../types';

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
    { id: '1788182059860', item: 'Ganesha Idol + Stone Work', est: 58000, adv: 0, bal: 0, act: 0 },
    { id: '1788182074852', item: 'Lightings and Decorations and Event Management', est: 125000, adv: 0, bal: 0, act: 0 },
    { id: '1788182092539', item: 'Pendal', est: 60000, adv: 0, bal: 0, act: 0 },
    { id: '1788182105355', item: 'Dhol', est: 75000, adv: 0, bal: 0, act: 0 },
    { id: '1788182119929', item: 'Pujari(Priest) + Pooja Items', est: 20000, adv: 0, bal: 0, act: 0 },
    { id: '1788182136085', item: 'Pooja Flowers', est: 15000, adv: 0, bal: 0, act: 0 },
    { id: '1788182156979', item: 'Banner(prints,etc)', est: 5000, adv: 0, bal: 0, act: 0 },
    { id: '1788182170675', item: 'Gratitude Gifts for our Sponsors', est: 10000, adv: 0, bal: 0, act: 0 },
    { id: '1788182183762', item: 'Laddoo + Sweets', est: 40000, adv: 0, bal: 0, act: 0 },
    { id: '1788182198126', item: 'Anna Prasadam', est: 400000, adv: 0, bal: 0, act: 0 },
    { id: '1788182216029', item: 'Transportations', est: 10000, adv: 0, bal: 0, act: 0 },
    { id: '1788182241424', item: 'Cleaning(staff, needs, etc)', est: 5000, adv: 0, bal: 0, act: 0 },
    { id: '1788182284933', item: 'Misc', est: 10000, adv: 0, bal: 0, act: 0 }
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
  sevas: [],
  sevaCatalogue: DEFAULT_SEVAS,
  settings: {
    org: 'Brigade Eldorado',
    location: 'Amphitheatre, Brigade Eldorado',
    upi: '',
    payee: 'Brigade Eldorado Ganeshotsava',
    logo: '',
    adminHash: '3cc551dd68cb8a0b7720b812b167715dd6f9c0405d26981eeb560f0b7dd8e616'
  },
  counters: {
    rc: '1',
    sp: null,
    sv: null
  }
};

export const fmt = (n: number | string): string => {
  return Number(n || 0).toLocaleString('en-IN');
};

export const fmtDate = (s: string): string => {
  if (!s) return '—';
  const d = new Date(s + 'T00:00:00');
  return isNaN(d.getTime())
    ? s
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
    if (x < 1000) return o[Math.floor(x / 100)] + ' Hundred' + (x % 100 ? ' ' + c(x % 100) : '');
    if (x < 100000) return c(Math.floor(x / 1000)) + ' Thousand' + (x % 1000 ? ' ' + c(x % 1000) : '');
    if (x < 10000000) return c(Math.floor(x / 100000)) + ' Lakh' + (x % 100000 ? ' ' + c(x % 100000) : '');
    return c(Math.floor(x / 10000000)) + ' Crore' + (x % 10000000 ? ' ' + c(x % 10000000) : '');
  }
  return c(n) + ' Rupees Only';
};

export async function sha256(str: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
