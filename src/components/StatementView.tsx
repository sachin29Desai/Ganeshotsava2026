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
  ArrowUpDown,
  Sparkles,
  Lightbulb,
  CreditCard,
  ArrowRight,
  Info,
  FileText
} from 'lucide-react';
import { Expense, Contribution, Sponsor, CommercialStall, SevaBooking, HundiCollection, AppSettings, UserRole } from '../types';
import { fmt, getExpenseActual, getExpenseBalance, cleanOrgName, fmtDate, getLightingAndDecorationExpense } from '../utils/helpers';
import { getStallFields } from './CommercialStallsView';

interface StatementViewProps {
  expenses: Expense[];
  contributions: Contribution[];
  sponsors: Sponsor[];
  commercialStalls: CommercialStall[];
  sevas: SevaBooking[];
  hundi: HundiCollection[];
  settings: AppSettings;
  userRole?: UserRole;
  isAdmin?: boolean;
  isMember?: boolean;
  onNavigateToTab?: (tab: 'donations' | 'sponsorship' | 'stalls' | 'sevas' | 'hundi' | 'expenditure') => void;
  onNavigateToExpenditure?: () => void;
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
  settings,
  userRole,
  isAdmin = false,
  isMember = false,
  onNavigateToTab,
  onNavigateToExpenditure,
  onPrintInvoice,
  onAddStall,
  onPrint
}) => {
  // Graph visual representation states
  const [chartType, setChartType] = useState<'donut' | 'bars' | 'vs'>('donut');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Lighting & Decoration Vendor Payable Calculation
  const lightingData = getLightingAndDecorationExpense(expenses);

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

  const totalIncome = ctTot + spAct + csAct + svTot + hundiTot;
  const totalIncomeTransactions =
    contributions.length + sponsors.length + commercialStalls.length + sevas.length + hundi.length;

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
    { label: 'Hundi Collections', value: hundiTot, color: '#8B5CF6', borderClass: 'border-violet-500', bgClass: 'bg-violet-500', textClass: 'text-violet-700', percentage: getPercent(hundiTot) }
  ].filter(c => c.value > 0);

  // Calculations for outstanding sponsor funds and pending payments
  const totalSponsorshipOutstanding = sponsors.reduce((s, r) => s + Math.max(0, Number(r.est || 0) - Number(r.act || 0)), 0);
  const pendingExpenses = expenses.map(e => ({
    name: e.item || 'General Expense',
    outstanding: Math.max(0, Number(e.est || 0) - Number(e.adv || 0)),
    total: Number(e.est || 0),
    advance: Number(e.adv || 0)
  })).filter(e => e.outstanding > 0);

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

  // Prep expenditure categories and segments for Donut rendering
  const expColors = [
    '#EF4444', // Red
    '#F59E0B', // Amber
    '#3B82F6', // Blue
    '#10B981', // Emerald
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#14B8A6', // Teal
    '#6366F1'  // Indigo
  ];

  const expCategories = expenses.map((exp, idx) => {
    const val = getExpenseActual(exp);
    return {
      label: exp.item || `Expense Head ${idx + 1}`,
      value: val,
      color: expColors[idx % expColors.length],
      percentage: exAct > 0 ? ((val / exAct) * 100).toFixed(1) : '0.0'
    };
  }).filter(c => c.value > 0);

  let expCumulativePercent = 0;
  const expDonutSegments = expCategories.map((cat) => {
    const fraction = exAct > 0 ? cat.value / exAct : 0;
    const strokeDashOffset = donutCircumference - (fraction * donutCircumference);
    const strokeDashArray = `${donutCircumference} ${donutCircumference}`;
    const rotationAngle = (expCumulativePercent * 360) - 90;
    expCumulativePercent += fraction;

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

        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={onPrint}
              className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded inline-flex items-center gap-1.5 transition-colors cursor-pointer border border-stone-200"
              title="Print Income & Expenditure Statement (Admin Only)"
            >
              <Printer className="w-3.5 h-3.5 text-[#991B1B]" />
              <span>Print Statement</span>
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

      {/* 2.2. KEY OUTSTANDING FINANCIAL SUMMARY & STRATEGIC POLICIES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Card: Financial Obligations & Pledges */}
        <div className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-2">
            <span className="p-1 rounded bg-amber-50 text-[#991B1B] border border-amber-200">
              <CreditCard className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-stone-800">
              Outstanding Obligations &amp; Pledges
            </span>
          </div>

          <div className="space-y-3">
            {/* Sponsors amount to be received */}
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-3">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                Sponsorship Contributions Outstanding
              </span>
              <span className="text-sm font-medium text-stone-700 block mt-0.5 leading-relaxed">
                Total outstanding sponsorship amount to be received (pledged commitments pending collection):
              </span>
              <span className="text-base font-mono font-black text-emerald-700 mt-1 block">
                ₹ {fmt(totalSponsorshipOutstanding)}
              </span>
              <span className="text-[10px] text-stone-400 block mt-0.5 italic">
                * Individual sponsor names and corporate details are withheld to protect donor privacy.
              </span>
            </div>

            {/* Expenditure to be paid bullet points - Only shown if there are pending expenditures to be settled */}
            {pendingExpenses.length > 0 && (
              <div className="bg-stone-50/80 border border-stone-200/60 rounded-lg p-3">
                <span className="text-[10px] font-bold text-stone-700 uppercase tracking-wider block mb-1.5">
                  Pending Expenditures to be Settled
                </span>
                <ul className="space-y-1.5 list-disc pl-4 text-xs text-stone-600">
                  {pendingExpenses.map((exp, idx) => (
                    <li key={idx} className="leading-relaxed">
                      <strong>{exp.name}</strong>: <span className="font-mono font-bold text-red-600">₹ {fmt(exp.outstanding)}</span> pending to be paid (Estimated: ₹{fmt(exp.total)}, Paid: ₹{fmt(exp.advance)})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Right Card: Strategic Notes & Governance Policies */}
        <div className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-stone-100 pb-2">
              <span className="p-1 rounded bg-amber-50 text-[#991B1B] border border-amber-200">
                <FileText className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-stone-800">
                Strategic Notifications &amp; Policies
              </span>
            </div>

            <div className="space-y-3 mt-3.5">
              {/* Audit Status Note */}
              <div className="flex gap-2.5 items-start">
                <span className="text-base shrink-0">📌</span>
                <div>
                  <span className="text-xs font-bold text-stone-800 block">
                    Account Audit Under Process
                  </span>
                  <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
                    Please note that Ganeshotsava 2026 financial accounts are currently undergoing a professional audit process. Once the audit is completed, the verified final statement details will be officially shared.
                  </p>
                </div>
              </div>

              {/* Reserve surplus Fixed Deposit Note */}
              <div className="flex gap-2.5 items-start border-t border-stone-100 pt-3">
                <span className="text-base shrink-0">💰</span>
                <div>
                  <span className="text-xs font-bold text-stone-800 block">
                    Net Surplus Reserve Policy (FD)
                  </span>
                  <p className="text-xs text-stone-600 mt-0.5 leading-relaxed font-normal">
                    The Ganeshotsava Committee has resolved that the final Net Surplus of <strong className="font-mono text-stone-900">₹ {fmt(netBalance)}</strong> will be deposited as a <strong>Fixed Deposit (FD)</strong> in the bank. This amount is securely reserved to serve as the initial fund for the next year's <strong>Sri Ganeshotsava 2027</strong> celebrations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2.5. GRAPHICAL FINANCIAL ANALYTICS PANEL */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
              <span>Visual Financial Analytics</span>
            </h3>
            <p className="text-[11px] text-stone-500 font-medium">
              Interactive graphical charts of Ganeshotsava 2026 ledger
            </p>
          </div>

          {/* Toggle buttons to switch graph types */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg border border-stone-200 text-xs no-print">
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
              <span>Income &amp; Expenditure Share</span>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
            {/* Left Column: Receipts Chart */}
            <div className="border border-stone-200/70 rounded-2xl p-4 bg-stone-50/25 shadow-3xs space-y-4">
              <div className="flex justify-center py-2 relative">
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

                  {/* Centered Total Overlay with Ganesha image */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-4">
                    <img src="/lord_ganesha.svg" alt="Lord Ganesha" className="w-10 h-10 opacity-35 object-contain mb-0.5" />
                    <span className="text-[8px] uppercase font-bold text-stone-500 tracking-wider leading-none">
                      Total Receipts
                    </span>
                    <span className="text-xs font-mono font-black text-stone-900 mt-0.5">
                      ₹{fmt(totalIncome)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Categorized legend and values */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1 text-center">
                  Income Streams
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
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                          <div className="min-w-0">
                            <span className="font-bold text-stone-800 text-[11px] block truncate">
                              {cat.label}
                            </span>
                            <span className="text-[9px] text-stone-400 block font-mono">
                              {cat.percentage}% share
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono font-bold text-[11px] text-stone-900 block">
                            ₹{fmt(cat.value)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Payments Chart */}
            <div className="border border-stone-200/70 rounded-2xl p-4 bg-stone-50/25 shadow-3xs space-y-4">
              <div className="flex justify-center py-2 relative">
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
                    {expDonutSegments.map((seg, idx) => (
                      <circle
                        key={seg.label}
                        cx="80"
                        cy="80"
                        r={donutRadius}
                        fill="transparent"
                        stroke={seg.color}
                        strokeWidth={hoveredIndex === idx + 100 ? '18' : '15'}
                        strokeDasharray={seg.strokeDashArray}
                        strokeDashoffset={seg.strokeDashOffset}
                        strokeLinecap="round"
                        className="transition-all duration-300 origin-center cursor-pointer"
                        style={{
                          transform: `rotate(${seg.rotationAngle}deg)`
                        }}
                        onMouseEnter={() => setHoveredIndex(idx + 100)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      />
                    ))}
                  </svg>

                  {/* Centered Total Overlay with Ganesha image */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-4">
                    <img src="/lord_ganesha.svg" alt="Lord Ganesha" className="w-10 h-10 opacity-35 object-contain mb-0.5" />
                    <span className="text-[8px] uppercase font-bold text-stone-500 tracking-wider leading-none">
                      Total Payments
                    </span>
                    <span className="text-xs font-mono font-black text-stone-900 mt-0.5">
                      ₹{fmt(exAct)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Categorized legend and values */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1 text-center">
                  Expenditure Heads
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {expDonutSegments.map((cat, idx) => {
                    const isHovered = hoveredIndex === idx + 100;
                    return (
                      <div
                        key={cat.label}
                        onMouseEnter={() => setHoveredIndex(idx + 100)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        className={`p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                          isHovered
                            ? 'border-stone-300 bg-stone-50/70 shadow-3xs translate-x-0.5'
                            : 'border-stone-100 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                          <div className="min-w-0">
                            <span className="font-bold text-stone-800 text-[11px] block truncate">
                              {cat.label}
                            </span>
                            <span className="text-[9px] text-stone-400 block font-mono">
                              {cat.percentage}% share
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono font-bold text-[11px] text-stone-900 block">
                            ₹{fmt(cat.value)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
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
      </div>

    </div>
  );
};

