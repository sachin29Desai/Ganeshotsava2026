export interface Expense {
  id: string;
  item: string;
  est: number;
  adv: number;
  bal: number;
  act: number;
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
}

export interface SevaBooking {
  id: string;
  tokNo: string;
  seva: string;
  name: string;
  flat: string;
  amt: number;
  date: string;
}

export interface SevaCatalogueItem {
  id: string;
  name: string;
  amt: number;
}

export interface AppSettings {
  org: string;
  location: string;
  upi: string;
  payee: string;
  logo: string;
  adminHash: string;
}

export interface AppState {
  expenses: Expense[];
  contributions: Contribution[];
  sponsors: Sponsor[];
  sevas: SevaBooking[];
  sevaCatalogue: SevaCatalogueItem[];
  settings: AppSettings;
  counters: {
    rc: string | null;
    sp: string | null;
    sv: string | null;
  };
}
