import React from 'react';
import {
  Printer,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Expense, Contribution, Sponsor, CommercialStall, SevaBooking, HundiCollection, AuctionItem, AppSettings, UserRole } from '../types';
import { fmt, getExpenseActual } from '../utils/helpers';

interface StatementViewProps {
  expenses: Expense[];
  contributions: Contribution[];
  sponsors: Sponsor[];
  commercialStalls: CommercialStall[];
  sevas: SevaBooking[];
  hundi: HundiCollection[];
  auctions: AuctionItem[];
  settings: AppSettings;
  userRole?: UserRole;
  onShareWhatsApp: () => void;
  onExportExcel: () => void;
  onPrint: () => void;
}

export const StatementView: React.FC<StatementViewProps> = ({
  expenses,
  contributions,
  sponsors,
  commercialStalls,
  sevas,
  hundi,
  auctions,
  settings,
  userRole,
  onPrint
}) => {
  const isVolunteer = userRole === 'volunteer';
  // Income stream totals
  const ctTot = contributions.reduce((s, r) => s + Number(r.amt || 0), 0);
  const spAct = sponsors.reduce((s, r) => s + Number(r.act || 0), 0);
  const csAct = commercialStalls.reduce((s, r) => s + Number(r.act || 0), 0);
  const svTot = sevas.reduce((s, r) => s + Number(r.amt || 0), 0);
  const hundiTot = hundi.reduce((s, r) => s + Number(r.act || 0), 0);
  const aucTot = auctions.reduce((s, r) => s + Number(r.act || 0), 0);

  const totalIncome = ctTot + spAct + csAct + svTot + hundiTot + aucTot;
  const totalIncomeTransactions =
    contributions.length + sponsors.length + commercialStalls.length + sevas.length + hundi.length + auctions.length;

  // Expenditure totals
  const exAct = expenses.reduce((s, r) => s + getExpenseActual(r), 0);

  const netBalance = totalIncome - exAct;
  const isSurplus = netBalance >= 0;

  // Percentage calculations
  const getPercent = (amt: number) => (totalIncome > 0 ? ((amt / totalIncome) * 100).toFixed(1) : '0.0');

  return (
    <div id="statement-print-target" className="space-y-6 relative">
      {/* 1. TOP HEADER & PRINT ACTION */}
      <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#1A1A1A]">
            Income &amp; Expenditure Statement
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            {settings.org || 'Brigade Eldorado Residents Association'} • {settings.location || 'Bengaluru'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onPrint}
            className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded inline-flex items-center gap-1.5 transition-colors cursor-pointer border border-stone-200"
            title="Print Income & Expenditure Statement"
          >
            <Printer className="w-3.5 h-3.5 text-[#991B1B]" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* 2. EXECUTIVE FINANCIAL KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Receipts */}
        <div className="bg-white border border-emerald-200 rounded-lg p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-[0.16em]">
              Total Receipts (Income)
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-emerald-700 mt-1">
            ₹ {fmt(totalIncome)}
          </div>
          <div className="text-xs text-stone-500 mt-1.5 flex items-center gap-1.5">
            <span className="bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.5 rounded text-[10px]">
              6 Categories
            </span>
            <span>{totalIncomeTransactions} total items / transactions</span>
          </div>
        </div>

        {/* Total Payments */}
        <div className="bg-white border border-red-200 rounded-lg p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-red-800 uppercase tracking-[0.16em]">
              Total Payments (Expenditure)
            </span>
            <TrendingDown className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-bold text-red-600 mt-1">
            ₹ {fmt(exAct)}
          </div>
          <div className="text-xs text-stone-500 mt-1.5 flex items-center gap-1.5">
            <span className="bg-red-100 text-red-800 font-semibold px-1.5 py-0.5 rounded text-[10px]">
              {expenses.length} Expense Heads
            </span>
            <span>Total disbursed &amp; settled</span>
          </div>
        </div>

        {/* Net Surplus / Deficit */}
        <div
          className={`border rounded-lg p-4 shadow-xs relative overflow-hidden ${
            isSurplus ? 'bg-amber-50/60 border-amber-300' : 'bg-red-50/70 border-red-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-700">
              Net Surplus / (Deficit)
            </span>
            {isSurplus ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
          </div>
          <div
            className={`text-2xl sm:text-3xl font-mono font-bold mt-1 ${
              isSurplus ? 'text-[#991B1B]' : 'text-red-700'
            }`}
          >
            ₹ {fmt(Math.abs(netBalance))}
          </div>
          <div className="text-xs text-stone-600 mt-1.5 flex items-center gap-1.5">
            <span
              className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${
                isSurplus
                  ? 'bg-emerald-200 text-emerald-900 border border-emerald-300'
                  : 'bg-red-200 text-red-900 border border-red-300'
              }`}
            >
              {isSurplus ? '✓ Net Surplus' : '⚠ Net Deficit'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. REVENUE STREAMS MINI-TILES */}
      <div className={`grid grid-cols-2 sm:grid-cols-3 ${isVolunteer ? 'lg:grid-cols-4' : 'lg:grid-cols-6'} gap-2.5`}>
        <div className="bg-white border border-stone-200 rounded p-3 text-center shadow-2xs hover:border-emerald-300 transition-colors">
          <div className="text-[9px] font-bold text-stone-500 uppercase tracking-wider mb-0.5">
            Voluntary Contributions
          </div>
          <div className="text-base font-mono font-bold text-emerald-700">₹ {fmt(ctTot)}</div>
          <div className="text-[10px] text-stone-400 mt-0.5">
            {contributions.length} resident(s) • {getPercent(ctTot)}%
          </div>
        </div>

        {!isVolunteer && (
          <>
            <div className="bg-white border border-stone-200 rounded p-3 text-center shadow-2xs hover:border-emerald-300 transition-colors">
              <div className="text-[9px] font-bold text-stone-500 uppercase tracking-wider mb-0.5">
                Sponsorship
              </div>
              <div className="text-base font-mono font-bold text-emerald-700">₹ {fmt(spAct)}</div>
              <div className="text-[10px] text-stone-400 mt-0.5">
                {sponsors.length} partner(s) • {getPercent(spAct)}%
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded p-3 text-center shadow-2xs hover:border-emerald-300 transition-colors">
              <div className="text-[9px] font-bold text-stone-500 uppercase tracking-wider mb-0.5">
                Education Fest
              </div>
              <div className="text-base font-mono font-bold text-emerald-700">₹ {fmt(csAct)}</div>
              <div className="text-[10px] text-stone-400 mt-0.5">
                {commercialStalls.length} vendor(s) • {getPercent(csAct)}%
              </div>
            </div>
          </>
        )}

        <div className="bg-white border border-stone-200 rounded p-3 text-center shadow-2xs hover:border-emerald-300 transition-colors">
          <div className="text-[9px] font-bold text-stone-500 uppercase tracking-wider mb-0.5">
            Seva Bookings
          </div>
          <div className="text-base font-mono font-bold text-emerald-700">₹ {fmt(svTot)}</div>
          <div className="text-[10px] text-stone-400 mt-0.5">
            {sevas.length} booking(s) • {getPercent(svTot)}%
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded p-3 text-center shadow-2xs hover:border-emerald-300 transition-colors">
          <div className="text-[9px] font-bold text-stone-500 uppercase tracking-wider mb-0.5">
            Hundi Collections
          </div>
          <div className="text-base font-mono font-bold text-emerald-700">₹ {fmt(hundiTot)}</div>
          <div className="text-[10px] text-stone-400 mt-0.5">
            {hundi.length} count(s) • {getPercent(hundiTot)}%
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded p-3 text-center shadow-2xs hover:border-emerald-300 transition-colors">
          <div className="text-[9px] font-bold text-stone-500 uppercase tracking-wider mb-0.5">
            Auctions (Maha Laddu)
          </div>
          <div className="text-base font-mono font-bold text-emerald-700">₹ {fmt(aucTot)}</div>
          <div className="text-[10px] text-stone-400 mt-0.5">
            {auctions.length} item(s) • {getPercent(aucTot)}%
          </div>
        </div>
      </div>
    </div>
  );
};

