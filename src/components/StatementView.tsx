import React, { useState } from 'react';
import {
  Printer,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  ExternalLink,
  Plus,
  PieChart,
  BarChart3,
  ArrowUpDown
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
  // Graph visual representation states
  const [chartType, setChartType] = useState<'donut' | 'bars' | 'vs'>('donut');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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

  // Chart setup: Compile categories
  const chartCategories = [
    { label: 'Contributions', value: ctTot, color: '#10B981', borderClass: 'border-emerald-500', bgClass: 'bg-emerald-500', textClass: 'text-emerald-700', percentage: getPercent(ctTot) },
    { label: 'Sponsorship', value: spAct, color: '#3B82F6', borderClass: 'border-blue-500', bgClass: 'bg-blue-500', textClass: 'text-blue-700', percentage: getPercent(spAct) },
    { label: 'Education Fest', value: csAct, color: '#EF4444', borderClass: 'border-red-500', bgClass: 'bg-red-500', textClass: 'text-red-700', percentage: getPercent(csAct) },
    { label: 'Seva Bookings', value: svTot, color: '#F59E0B', borderClass: 'border-amber-500', bgClass: 'bg-amber-500', textClass: 'text-amber-700', percentage: getPercent(svTot) },
    { label: 'Hundi Collections', value: hundiTot, color: '#8B5CF6', borderClass: 'border-violet-500', bgClass: 'bg-violet-500', textClass: 'text-violet-700', percentage: getPercent(hundiTot) },
    { label: 'Auctions (Laddu)', value: aucTot, color: '#EC4899', borderClass: 'border-pink-500', bgClass: 'bg-pink-500', textClass: 'text-pink-700', percentage: getPercent(aucTot) }
  ].filter(c => c.value > 0);

  // Donut values: Circle circumference is 2 * PI * R
  const donutRadius = 65;
  const donutCircumference = 2 * Math.PI * donutRadius; // ~408.41
  
  // Prep segment data for Donut rendering
  let cumulativePercent = 0;
  const donutSegments = chartCategories.map((cat) => {
    const fraction = totalIncome > 0 ? cat.value / totalIncome : 0;
    const strokeDashOffset = donutCircumference - (fraction * donutCircumference);
    const strokeDashArray = `${donutCircumference} ${donutCircumference}`;
    const rotationAngle = (cumulativePercent * 360) - 90; // Align starting segment top-center
    cumulativePercent += fraction;

    return {
      ...cat,
      fraction,
      strokeDashOffset,
      strokeDashArray,
      rotationAngle
    };
  });

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

      {/* 2.5. GRAPHICAL FINANCIAL ANALYTICS PANEL */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 shadow-sm space-y-4 no-print">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
              <span>Visual Financial Analytics</span>
            </h3>
            <p className="text-[11px] text-stone-500">
              Interactive graphical charts of Ganeshotsava 2026 ledger
            </p>
          </div>

          {/* Toggle buttons to switch graph types */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg border border-stone-200 text-xs">
            <button
              type="button"
              onClick={() => setChartType('donut')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                chartType === 'donut'
                  ? 'bg-white text-stone-900 shadow-3xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
              <span>Income Share</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType('bars')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                chartType === 'bars'
                  ? 'bg-white text-stone-900 shadow-3xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Categories Comparison</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType('vs')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                chartType === 'vs'
                  ? 'bg-white text-stone-900 shadow-3xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Receipts vs Payments</span>
            </button>
          </div>
        </div>

        {/* Unified Proportional Distribution Bar */}
        {totalIncome > 0 && (
          <div className="space-y-1.5 bg-stone-50/60 p-3.5 rounded-xl border border-stone-200/60 transition-all">
            <div className="flex items-center justify-between text-[11px] font-bold text-stone-600 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>Unified Revenue Distribution Stream</span>
              </span>
              <span className="font-mono text-stone-400">100% Proportional Share</span>
            </div>
            <div className="h-4.5 w-full bg-stone-100 rounded-full overflow-hidden flex shadow-inner border border-stone-200/60">
              {donutSegments.map((cat, idx) => (
                <div
                  key={cat.label}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={`h-full transition-all duration-300 hover:brightness-95 cursor-pointer`}
                  style={{
                    width: `${cat.percentage}%`,
                    backgroundColor: cat.color
                  }}
                  title={`${cat.label}: ${cat.percentage}% (₹${fmt(cat.value)})`}
                />
              ))}
            </div>
          </div>
        )}

        {/* 1. DONUT/PIE CHART VIEW */}
        {chartType === 'donut' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* SVG Interactive Donut */}
            <div className="md:col-span-5 flex justify-center py-2 relative">
              <div className="relative w-44 h-44 sm:w-48 sm:h-44">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                  <circle
                    cx="80"
                    cy="80"
                    r={donutRadius}
                    fill="transparent"
                    stroke="#F5F5F4"
                    strokeWidth="15"
                  />
                  {donutSegments.map((seg, idx) => (
                    <circle
                      key={seg.label}
                      cx="80"
                      cy="80"
                      r={donutRadius}
                      fill="transparent"
                      stroke={seg.color}
                      strokeWidth={hoveredIndex === idx ? '18' : '15'}
                      strokeDasharray={seg.strokeDashArray}
                      strokeDashoffset={seg.strokeDashOffset}
                      strokeLinecap="round"
                      className="transition-all duration-300 origin-center cursor-pointer"
                      style={{
                        transform: `rotate(${seg.rotationAngle}deg)`
                      }}
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    />
                  ))}
                </svg>

                {/* Centered Total Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-4">
                  <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                    Total Income
                  </span>
                  <span className="text-sm sm:text-base font-mono font-black text-stone-900">
                    ₹{fmt(totalIncome)}
                  </span>
                </div>
              </div>
            </div>

            {/* Categorized legend and values */}
            <div className="md:col-span-7 space-y-2">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                Income Stream Distribution
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {donutSegments.map((cat, idx) => {
                  const isHovered = hoveredIndex === idx;
                  return (
                    <div
                      key={cat.label}
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      className={`p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                        isHovered
                          ? 'border-stone-300 bg-stone-50/70 shadow-3xs translate-x-0.5'
                          : 'border-stone-100 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`w-3 h-3 rounded-full shrink-0 ${cat.bgClass}`} />
                        <div className="min-w-0">
                          <span className="font-bold text-stone-800 text-xs block truncate">
                            {cat.label}
                          </span>
                          <span className="text-[10px] text-stone-400 block font-mono">
                            {cat.percentage}% share
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-xs text-stone-900 block">
                          ₹{fmt(cat.value)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 2. CATEGORIES COLUMN CHART */}
        {chartType === 'bars' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-stone-500">
              <span>Category</span>
              <span>Revenue (₹)</span>
            </div>

            <div className="space-y-3.5">
              {chartCategories.map((cat, idx) => {
                const maxVal = Math.max(...chartCategories.map(c => c.value), 1);
                const barWidth = ((cat.value / maxVal) * 100).toFixed(1);
                const isHovered = hoveredIndex === idx;

                return (
                  <div
                    key={cat.label}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className="space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-stone-800">{cat.label}</span>
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="font-bold text-stone-900">₹{fmt(cat.value)}</span>
                        <span className="text-stone-400 text-[10px]">({cat.percentage}%)</span>
                      </div>
                    </div>
                    {/* Horizontal Bar */}
                    <div className="h-3 w-full bg-stone-100 rounded-full overflow-hidden border border-stone-200/50 relative">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${cat.bgClass} ${
                          isHovered ? 'brightness-95 shadow-2xs' : ''
                        }`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. RECEIPTS VS PAYMENTS SIDE-BY-SIDE CHART */}
        {chartType === 'vs' && (
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
            {/* Visual comparative columns */}
            <div className="sm:col-span-5 flex items-end justify-center gap-8 h-48 border-b border-stone-200 pb-2 relative">
              {/* Max value to scale heights */}
              {(() => {
                const maxVal = Math.max(totalIncome, exAct, 1);
                const incomeHeight = ((totalIncome / maxVal) * 100).toFixed(0);
                const expenseHeight = ((exAct / maxVal) * 100).toFixed(0);

                return (
                  <>
                    {/* Income Bar */}
                    <div className="flex flex-col items-center gap-2 w-16">
                      <div className="text-[10px] font-mono font-bold text-emerald-700">
                        {incomeHeight}%
                      </div>
                      <div
                        className="w-full bg-emerald-500 hover:bg-emerald-600 rounded-t-lg transition-all duration-500 shadow-xs cursor-pointer"
                        style={{ height: `${Math.max(Number(incomeHeight), 10)}px` }}
                        title={`Total Receipts: ₹${fmt(totalIncome)}`}
                      />
                      <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                        Receipts
                      </span>
                    </div>

                    {/* Expense Bar */}
                    <div className="flex flex-col items-center gap-2 w-16">
                      <div className="text-[10px] font-mono font-bold text-red-600">
                        {expenseHeight}%
                      </div>
                      <div
                        className="w-full bg-red-500 hover:bg-red-600 rounded-t-lg transition-all duration-500 shadow-xs cursor-pointer"
                        style={{ height: `${Math.max(Number(expenseHeight), 10)}px` }}
                        title={`Total Payments: ₹${fmt(exAct)}`}
                      />
                      <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                        Payments
                      </span>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Explanatory text & metrics */}
            <div className="sm:col-span-7 space-y-3.5">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-stone-500 border-b border-stone-100 pb-1">
                Financial Status Summary
              </h4>

              <div className="space-y-2">
                {/* Receipts Metric */}
                <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-emerald-50/50 border border-emerald-100">
                  <span className="font-bold text-stone-700">Total Income Receipts</span>
                  <span className="font-mono font-bold text-emerald-800">₹{fmt(totalIncome)}</span>
                </div>

                {/* Payments Metric */}
                <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-red-50/50 border border-red-100">
                  <span className="font-bold text-stone-700">Total Expenditure Payments</span>
                  <span className="font-mono font-bold text-red-800">₹{fmt(exAct)}</span>
                </div>

                {/* Net Position Metric */}
                <div className={`flex items-center justify-between text-xs p-2 rounded-xl border ${
                  isSurplus 
                    ? 'bg-amber-50/60 border-amber-200 text-amber-950'
                    : 'bg-red-50 border-red-200 text-red-950'
                }`}>
                  <span className="font-bold">Net Financial Position</span>
                  <span className="font-mono font-black">
                    {isSurplus ? 'Surplus:' : 'Deficit:'} ₹{fmt(Math.abs(netBalance))}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-stone-500 leading-relaxed">
                The community represents a **{isSurplus ? 'healthy surplus financial position' : 'financial deficit'}** of **₹{fmt(Math.abs(netBalance))}**. 
                Total income successfully covers {((exAct / (totalIncome || 1)) * 100).toFixed(1)}% of our total festive expenditures.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. REVENUE STREAMS MINI-TILES */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
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
          <div className="text-base font-mono font-bold text-[#059669]">₹ {fmt(spAct)}</div>
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
          <div className="text-base font-mono font-bold text-[#059669]">₹ {fmt(csAct)}</div>
          <div className="text-[10px] text-stone-500 mt-0.5 font-medium">
            {commercialStalls.length} vendor(s) • {getPercent(csAct)}%
          </div>
        </div>

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

    </div>
  );
};

