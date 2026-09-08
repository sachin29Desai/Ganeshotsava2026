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
  amt: number;
  date: string;
  notes?: string;
}

export interface SevaCatalogueItem {
  id: string;
  name: string;
  amt: number;
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
  org: string;
  location: string;
  upi: string;
  payee: string;
  logo: string;
  adminHash: string;
  sponsorHash?: string;
  volunteerHash?: string;
  customReceiptPortalUrl?: string;
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
