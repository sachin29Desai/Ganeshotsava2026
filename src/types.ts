export interface ExpenseBill {
  id: string;
  url: string;
  name: string;
  type?: string;
  date?: string;
  comments?: string;
  amount?: number;
}

export interface Expense {
  id: string;
  item: string;
  est: number;
  adv: number;
  bal: number;
  act: number;
  receiptUrl?: string;
  receiptName?: string;
  receiptType?: string;
  receiptDate?: string;
  notes?: string;
  bills?: ExpenseBill[];
}

export interface Contribution {
  id: string;
  rcptNo: string;
  name: string;
  flat: string;
  amt: number;
  date: string;
  pay: string;
  txn: string;
  notes: string;
}

export interface Sponsor {
  id: string;
  invNo: string;
  det: string;
  est: number;
  act: number;
  payMode?: 'UPI' | 'CASH' | 'NEFT' | string;
  notes?: string;
  date?: string;
}

export interface CommercialStall {
  id: string;
  invNo: string;
  det: string;
  est: number;
  act: number;
  date?: string;
  notes?: string;
  particular?: string;
  vendor?: string;
}

export interface SevaBooking {
  id: string;
  tokNo: string;
  seva: string;
  name: string;
  flat: string;
  amt?: number; // Non-mandatory voluntary amount (0 or omitted if in-kind donation like Rice/Ghee)
  qty?: number; // Quantity or units booked by sponsor (e.g. 10 kg, 2 bags, 1 slot. Defaults to 1)
  unit?: string; // Unit of measurement (e.g. "kg", "Bags", "Liters", "Tins", etc.)
  date: string;
  notes?: string;
  status?: 'Booked' | 'Confirmed';
  phone?: string;
  gothra?: string;
  nakshatra?: string;
  createdBy?: 'admin' | 'public' | string;
  confirmedBy?: string;
  confirmedAt?: string;
}

export interface SevaCatalogueItem {
  id: string;
  name: string; // e.g. "Rice", "Flower Seva", "Pure Ghee", "Maha Pooja"
  amt?: number; // Non-mandatory suggested contribution amount (can be 0 or omitted)
  unit?: string; // Unit / measure: e.g. "kg", "Bags", "Liters", "Tins", "Packets", "Slots"
  totalRequired?: number; // Total required quantity/units (e.g. 50 kg, 10 tins, etc.)
  desc?: string; // Notes / description of the offering
}

export interface HundiCollection {
  id: string;
  det: string;
  act: number;
  date: string;
  countedBy?: string;
  notes?: string;
}

export interface AuctionItem {
  id: string;
  invNo: string;
  det: string;
  act: number;
  by: string;
  date: string;
  notes?: string;
}

export type UserRole = 'admin' | 'sponsor' | 'volunteer';

export interface AppSettings {
  festival?: string;
  dates?: string;
  org: string;
  location: string;
  upi: string;
  payee: string;
  logo: string;
  adminHash: string;
  sponsorHash?: string;
  volunteerHash?: string;
  customReceiptPortalUrl?: string;
  customSevaPortalUrl?: string;
}

export interface AppState {
  expenses: Expense[];
  contributions: Contribution[];
  sponsors: Sponsor[];
  commercialStalls: CommercialStall[];
  sevas: SevaBooking[];
  sevaCatalogue: SevaCatalogueItem[];
  hundi: HundiCollection[];
  auctions: AuctionItem[];
  settings: AppSettings;
  counters: {
    rc: string | null;
    sp: string | null;
    cs: string | null;
    sv: string | null;
    auc: string | null;
  };
}
