import React from 'react';
import {
  Printer,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  ExternalLink,
  Plus
} from 'lucide-react';
import { Expense, Contribution, Sponsor, CommercialStall, SevaBooking, HundiCollection, AuctionItem, AppSettings, UserRole } from '../types';
import { fmt, getExpenseActual, cleanOrgName, fmtDate } from '../utils/helpers';
import { getStallFields } from './CommercialStallsView';

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
  isAdmin?: boolean;
  isMember?: boolean;
  onNavigateToTab?: (tab: 'donations' | 'sponsorship' | 'stalls' | 'sevas' | 'hundi' | 'auctions') => void;
  onPrintInvoice?: (stall: CommercialStall) => void;
  onAddStall?: () => void;
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
  isAdmin = false,
  isMember = false,
  onNavigateToTab,
  onPrintInvoice,
  onAddStall,
  onPrint
}) => {
  // Determine if user has admin or member privileges to view detailed data breakdowns
  const canViewDetails = isAdmin || isMember || userRole === 'admin' || userRole === 'member' || userRole === 'read_only';
  const isVolunteer = userRole === 'volunteer';

  // Income stream totals
  const ctTot = contributions.reduce((s, r) => s + Number(r.amt || 0), 0);
  const spAct = sponsors.reduce((s, r) => s + Number(r.act || 0), 0);
  const csEst = commercialStalls.reduce((s, r) => s + Number(r.est || 0), 0);
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
            {cleanOrgName(settings.org, 'Eldorado Residents Association')} • {settings.location || 'Bengaluru'}
          </p>
        </div>

        {canViewDetails && (
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
        )}
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
        {/* Voluntary Contributions */}
        <div
          onClick={() => onNavigateToTab?.('donations')}
          className={`bg-white border border-stone-200 rounded p-3 text-center shadow-2xs hover:border-emerald-300 transition-colors ${
            onNavigateToTab ? 'cursor-pointer hover:bg-emerald-50/20' : ''
          }`}
        >
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
            {/* Sponsorship */}
            <div
              onClick={() => onNavigateToTab?.('sponsorship')}
              className={`bg-white border border-stone-200 rounded p-3 text-center shadow-2xs hover:border-emerald-300 transition-colors ${
                onNavigateToTab ? 'cursor-pointer hover:bg-emerald-50/20' : ''
              }`}
            >
              <div className="text-[9px] font-bold text-stone-500 uppercase tracking-wider mb-0.5">
                Sponsorship
              </div>
              <div className="text-base font-mono font-bold text-emerald-700">₹ {fmt(spAct)}</div>
              <div className="text-[10px] text-stone-400 mt-0.5">
                {sponsors.length} partner(s) • {getPercent(spAct)}%
              </div>
            </div>

            {/* Education Fest */}
            <div
              onClick={() => onNavigateToTab?.('stalls')}
              className={`bg-white border-2 border-amber-300/80 rounded p-3 text-center shadow-xs hover:border-[#991B1B] hover:shadow-md transition-all ${
                onNavigateToTab ? 'cursor-pointer bg-amber-50/30 hover:bg-amber-50/60' : ''
              }`}
            >
              <div className="text-[9px] font-bold text-[#991B1B] uppercase tracking-wider mb-0.5 flex items-center justify-center gap-1">
                <GraduationCap className="w-3 h-3 text-[#991B1B]" />
                <span>Education Fest</span>
              </div>
              <div className="text-base font-mono font-bold text-emerald-700">₹ {fmt(csAct)}</div>
              <div className="text-[10px] text-stone-500 mt-0.5 font-medium">
                {commercialStalls.length} vendor(s) • {getPercent(csAct)}%
              </div>
            </div>
          </>
        )}

        {/* Seva Bookings */}
        <div
          onClick={() => onNavigateToTab?.('sevas')}
          className={`bg-white border border-stone-200 rounded p-3 text-center shadow-2xs hover:border-emerald-300 transition-colors ${
            onNavigateToTab ? 'cursor-pointer hover:bg-emerald-50/20' : ''
          }`}
        >
          <div className="text-[9px] font-bold text-stone-500 uppercase tracking-wider mb-0.5">
            Seva Bookings
          </div>
          <div className="text-base font-mono font-bold text-emerald-700">₹ {fmt(svTot)}</div>
          <div className="text-[10px] text-stone-400 mt-0.5">
            {sevas.length} booking(s) • {getPercent(svTot)}%
          </div>
        </div>

        {/* Hundi Collections */}
        <div
          onClick={() => onNavigateToTab?.('hundi')}
          className={`bg-white border border-stone-200 rounded p-3 text-center shadow-2xs hover:border-emerald-300 transition-colors ${
            onNavigateToTab ? 'cursor-pointer hover:bg-emerald-50/20' : ''
          }`}
        >
          <div className="text-[9px] font-bold text-stone-500 uppercase tracking-wider mb-0.5">
            Hundi Collections
          </div>
          <div className="text-base font-mono font-bold text-emerald-700">₹ {fmt(hundiTot)}</div>
          <div className="text-[10px] text-stone-400 mt-0.5">
            {hundi.length} count(s) • {getPercent(hundiTot)}%
          </div>
        </div>

        {/* Auctions */}
        <div
          onClick={() => onNavigateToTab?.('auctions')}
          className={`bg-white border border-stone-200 rounded p-3 text-center shadow-2xs hover:border-emerald-300 transition-colors ${
            onNavigateToTab ? 'cursor-pointer hover:bg-emerald-50/20' : ''
          }`}
        >
          <div className="text-[9px] font-bold text-stone-500 uppercase tracking-wider mb-0.5">
            Auctions (Maha Laddu)
          </div>
          <div className="text-base font-mono font-bold text-emerald-700">₹ {fmt(aucTot)}</div>
          <div className="text-[10px] text-stone-400 mt-0.5">
            {auctions.length} item(s) • {getPercent(aucTot)}%
          </div>
        </div>
      </div>

      {/* 4. DETAILED EDUCATION FEST DATA BREAKDOWN (Visible to Admin & Members) */}
      {canViewDetails && (
        <div className="bg-white border border-amber-200/90 rounded-lg shadow-sm overflow-hidden mt-6">
          <div className="px-5 py-3.5 bg-gradient-to-r from-amber-50/70 via-white to-amber-50/40 border-b border-amber-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-amber-400 text-[#991B1B] flex items-center justify-center shadow-xs">
                <GraduationCap className="w-4 h-4 text-[#991B1B]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-serif font-bold text-[#1A1A1A]">
                    Education Fest — Stalls &amp; Exhibitions Breakdown
                  </h3>
                  <span className="bg-[#991B1B] text-white text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                    {commercialStalls.length} Stalls
                  </span>
                </div>
                <p className="text-xs text-stone-500">
                  Detailed ledger of educational booths, science workshops, literature counters &amp; campus partners. Total Actual: <strong className="text-emerald-700 font-mono">₹ {fmt(csAct)}</strong> (Est: ₹ {fmt(csEst)})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isAdmin && onAddStall && (
                <button
                  onClick={onAddStall}
                  className="bg-[#991B1B] hover:bg-[#7F1D1D] text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Stall</span>
                </button>
              )}
              {onNavigateToTab && (
                <button
                  onClick={() => onNavigateToTab('stalls')}
                  className="bg-white hover:bg-stone-50 text-stone-700 hover:text-stone-900 border border-stone-300 text-xs font-medium px-3 py-1.5 rounded inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <span>Open Full Portal</span>
                  <ExternalLink className="w-3 h-3 text-[#991B1B]" />
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#FDF8F3] border-b border-stone-200 text-[10px] font-bold text-stone-500 uppercase tracking-[0.14em]">
                  <th className="py-2.5 px-4 font-semibold">Invoice No</th>
                  <th className="py-2.5 px-4 font-semibold">Stall Particular / Activity</th>
                  <th className="py-2.5 px-4 font-semibold">Vendor / Organization</th>
                  <th className="py-2.5 px-4 text-right font-semibold">Estimated (₹)</th>
                  <th className="py-2.5 px-4 text-right font-semibold">Actual (₹)</th>
                  <th className="py-2.5 px-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {commercialStalls.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-stone-400">
                      No Education Fest stalls recorded yet. {isAdmin && 'Click "Add Stall" above to record education fest counters.'}
                    </td>
                  </tr>
                ) : (
                  commercialStalls.map(s => {
                    const { particular, vendor } = getStallFields(s);
                    return (
                      <tr key={s.id} className="hover:bg-amber-50/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-stone-900 whitespace-nowrap">
                          {s.invNo}
                        </td>
                        <td className="py-3 px-4 text-stone-900">
                          <div className="font-semibold">{particular || s.det}</div>
                          {s.notes && (
                            <div className="text-[11px] text-stone-500 italic mt-0.5">{s.notes}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-stone-800 font-medium">
                          {vendor || <span className="text-stone-400 italic">—</span>}
                          {s.date && (
                            <div className="text-[10px] text-stone-400 font-mono mt-0.5">Date: {fmtDate(s.date)}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-right text-stone-600">
                          ₹ {fmt(s.est)}
                        </td>
                        <td className="py-3 px-4 font-mono text-right font-bold text-emerald-700">
                          ₹ {fmt(s.act)}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {onPrintInvoice && (
                            <button
                              onClick={() => onPrintInvoice(s)}
                              className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium px-2.5 py-1 rounded inline-flex items-center gap-1 transition-colors cursor-pointer"
                              title="Print Invoice"
                            >
                              <Printer className="w-3 h-3 text-[#991B1B]" />
                              <span>Invoice</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {commercialStalls.length > 0 && (
                <tfoot>
                  <tr className="bg-amber-50/50 border-t-2 border-amber-300 font-bold text-xs text-stone-900">
                    <td colSpan={3} className="py-3 px-4 uppercase tracking-wider text-[#991B1B]">
                      Total Education Fest
                    </td>
                    <td className="py-3 px-4 font-mono text-right text-stone-700">
                      ₹ {fmt(csEst)}
                    </td>
                    <td className="py-3 px-4 font-mono text-right text-sm font-bold text-emerald-700">
                      ₹ {fmt(csAct)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

