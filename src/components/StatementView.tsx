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
  FileText,
  QrCode,
  HeartHandshake,
  ShieldCheck,
  MessageCircle,
  Copy,
  Check,
  Share2,
  Download
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
  onDownloadPdf?: () => void | Promise<any>;
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
  onShareWhatsApp,
  onExportExcel,
  onPrint,
  onDownloadPdf
}) => {
  // Graph visual representation states
  const [chartType, setChartType] = useState<'donut' | 'bars' | 'vs'>('donut');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const whatsappGroupUrl = 'https://chat.whatsapp.com/EAkzlpnwF0G9Xc8nenA8JY?mode=gi_t';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(whatsappGroupUrl)}`;

  const handleCopyWhatsAppLink = () => {
    navigator.clipboard.writeText(whatsappGroupUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // Ganesha photo from festive video / showcase first photo
  const ganeshaPhotoUrl = (settings?.adminPhotos && settings.adminPhotos.length > 0 && settings.adminPhotos[0])
    ? settings.adminPhotos[0]
    : '/Gemini_Generated_Image_jforcsjforcsjfor.png';

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
      {/* 1. AUSPICIOUS INVOCATION & GRAND FESTIVE HEADER */}
      <div className="bg-white border-2 border-amber-300 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 relative overflow-hidden print-avoid-break">
        {/* Festive Top Bar with Sacred Inscription */}
        <div className="bg-gradient-to-r from-amber-700 via-[#991B1B] to-amber-700 text-amber-100 px-4 py-2 rounded-xl text-center shadow-xs">
          <p className="text-xs sm:text-sm font-serif font-black tracking-widest uppercase">
            ॥ ಶ್ರೀ ಗಣೇಶಾಯ ನಮಃ ॥
          </p>
          <p className="text-[10px] sm:text-xs text-amber-200/90 font-serif italic mt-0.5">
            ॥ ವಕ್ರತುಂಡ ಮಹಾಕಾಯ ಸೂರ್ಯಕೋಟಿ ಸಮಪ್ರಭ । ನಿರ್ವಿಘ್ನಂ ಕುರು ಮೇ ದೇವ ಸರ್ವಕಾರ್ಯೇಷು ಸರ್ವದಾ ॥
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-1">
          {/* Left: Divine Lord Ganesha Full Picture / Medallion */}
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-400 via-amber-200 to-amber-400 p-0.5 shadow-md shrink-0 border-2 border-amber-500 overflow-hidden">
              <img
                src={ganeshaPhotoUrl}
                alt="Lord Sri Ganesha"
                className="w-full h-full object-cover rounded-full filter drop-shadow-sm"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-[#991B1B] text-[10px] font-bold uppercase tracking-wider mb-1 border border-amber-200">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>ಶ್ರೀ ಗಣೇಶೋತ್ಸವ ಸಮಿತಿ 2026</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-black text-stone-900 tracking-tight">
                ಶ್ರೀ ಗಣೇಶೋತ್ಸವ ೨೦೨೬
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-[#991B1B]">
                Income &amp; Expenditure Statement and Financial position statement(Balance sheet)
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-stone-500 font-medium">
                <span>Eldorado</span>
                <span>•</span>
                <span className="text-amber-800 font-semibold">Unaudited Financial Statements 2026</span>
              </div>
            </div>
          </div>

          {/* Print/PDF Header Right Side Block */}
          <div className="hidden print:flex flex-col items-end text-right shrink-0 print-only-header py-1">
            <span className="text-xs font-serif font-black text-amber-950 uppercase tracking-wider">
              Financial Year 2026-27
            </span>
            <span className="text-[11px] font-mono font-bold text-[#991B1B]">
              Income &amp; Expenditure Statement and Financial position statement(Balance sheet)
            </span>
            <span className="text-[10px] text-stone-500 font-medium">
              Unaudited Financial Statements 2026 • Eldorado
            </span>
          </div>

          {/* Right: Quick Action Controls (Print, Excel, WhatsApp) */}
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 no-print shrink-0">
            <button
              type="button"
              onClick={async () => {
                if (onDownloadPdf) {
                  setIsDownloadingPdf(true);
                  try {
                    await onDownloadPdf();
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setIsDownloadingPdf(false);
                  }
                } else {
                  onPrint();
                }
              }}
              disabled={isDownloadingPdf}
              className="bg-[#991B1B] hover:bg-[#7F1D1D] text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-md inline-flex items-center gap-2 transition-all cursor-pointer hover:shadow-lg active:scale-95 disabled:opacity-75"
              title="Download Full Multi-Page PDF With All Pages Included"
            >
              {isDownloadingPdf ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-amber-300" />
                  <span>Save PDF (All Pages)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onPrint}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold uppercase tracking-wider px-3.5 py-2.5 rounded-xl shadow-xs inline-flex items-center gap-1.5 transition-all cursor-pointer hover:shadow-md active:scale-95"
              title="Print via System Print Dialog"
            >
              <Printer className="w-3.5 h-3.5 text-amber-100" />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={onShareWhatsApp}
              className="bg-[#25D366] hover:bg-[#20BA5A] text-white text-xs font-bold uppercase tracking-wider px-3.5 py-2.5 rounded-xl shadow-xs inline-flex items-center gap-1.5 transition-all cursor-pointer"
              title="Share Summary on WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>

            <button
              type="button"
              onClick={onExportExcel}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider px-3.5 py-2.5 rounded-xl shadow-xs inline-flex items-center gap-1.5 transition-all cursor-pointer"
              title="Download Full Excel Ledger"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>
          </div>
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
                    Net Surplus Reserve &amp; Fixed Deposit (FD) Policy
                  </span>
                  <p className="text-xs text-stone-600 mt-0.5 leading-relaxed font-normal">
                    The Ganeshotsava Committee has accounted that the current Net Surplus of <strong className="font-mono text-stone-900">₹ {fmt(Math.abs(netBalance))}</strong> along with all pending pledged sponsorship amounts to be collected (<strong className="font-mono text-emerald-700">₹ {fmt(totalSponsorshipOutstanding)}</strong>) will be transferred as the opening fund for next year's <strong>Sri Ganeshotsava 2027</strong>. Any upcoming compliance or professional account auditing fees will be disbursed directly from this account Net Surplus, and the entire remaining net balance will be deposited into a bank <strong>Fixed Deposit (FD)</strong>.
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

      {/* 4. GOVERNANCE RESOLUTION — SURPLUS & FUND DEPLOYMENT POLICY */}
      <div className="bg-gradient-to-br from-amber-50/70 via-white to-amber-50/50 border-2 border-amber-300/90 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4 print-avoid-break">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-amber-200/80 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500 text-white shadow-xs">
              <ShieldCheck className="w-5 h-5 text-white" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-serif font-black text-amber-950 uppercase tracking-wide">
                Governance Policy — Surplus &amp; Fund Deployment Policy
              </h3>
              <p className="text-[11px] text-amber-800 font-medium">
                Framework for Net Surplus, pending sponsorship collections, audit fees &amp; 2027 Fixed Deposit
              </p>
            </div>
          </div>
          <div className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold uppercase tracking-wider shrink-0">
            ✓ Accounted by Ganeshotsava Samithi 2026
          </div>
        </div>

        {/* Financial Policy Metric Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="bg-white/90 border border-amber-200 rounded-xl p-3 shadow-2xs">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
              1. Current Net Surplus
            </span>
            <span className="text-xl font-mono font-black text-[#991B1B] mt-0.5 block">
              ₹ {fmt(Math.abs(netBalance))}
            </span>
            <span className="text-[10px] text-stone-500 block mt-0.5">
              Available liquid funds in festival ledger
            </span>
          </div>

          <div className="bg-white/90 border border-amber-200 rounded-xl p-3 shadow-2xs">
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
              2. Pledged Sponsorship Outstanding
            </span>
            <span className="text-xl font-mono font-black text-emerald-700 mt-0.5 block">
              ₹ {fmt(totalSponsorshipOutstanding)}
            </span>
            <span className="text-[10px] text-stone-500 block mt-0.5">
              Pledged partner dues pending collection
            </span>
          </div>

          <div className="bg-gradient-to-tr from-amber-100 to-amber-50 border border-amber-300 rounded-xl p-3 shadow-2xs">
            <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
              3. Total Projected Reserve Corpus
            </span>
            <span className="text-xl font-mono font-black text-stone-900 mt-0.5 block">
              ₹ {fmt(Math.abs(netBalance) + totalSponsorshipOutstanding)}
            </span>
            <span className="text-[10px] text-amber-800 font-semibold block mt-0.5">
              Earmarked as Seed Fund for Ganeshotsava 2027
            </span>
          </div>
        </div>

        {/* Detailed 3-Pillar Governance Stipulations */}
        <div className="space-y-3 pt-1 text-xs text-stone-700">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-stone-200/80">
            <span className="w-6 h-6 rounded-full bg-amber-400 text-[#991B1B] font-bold flex items-center justify-center shrink-0 text-xs shadow-xs mt-0.5">
              1
            </span>
            <div className="space-y-0.5">
              <strong className="text-stone-900 text-xs block">
                Transfer of Surplus &amp; Sponsorships to Next Year (Sri Ganeshotsava 2027):
              </strong>
              <p className="leading-relaxed text-stone-600">
                The entire current Net Surplus of <strong className="font-mono text-stone-900">₹ {fmt(Math.abs(netBalance))}</strong> along with all outstanding pledged sponsorship contributions upon realization (<strong className="font-mono text-stone-900">₹ {fmt(totalSponsorshipOutstanding)}</strong>) is officially protected and reserved to serve as the initial seed foundation fund for the upcoming <strong>Sri Ganeshotsava 2027</strong> celebrations.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-stone-200/80">
            <span className="w-6 h-6 rounded-full bg-amber-400 text-[#991B1B] font-bold flex items-center justify-center shrink-0 text-xs shadow-xs mt-0.5">
              2
            </span>
            <div className="space-y-0.5">
              <strong className="text-stone-900 text-xs block">
                Disbursement of Professional Auditing Fees &amp; Statutory Charges:
              </strong>
              <p className="leading-relaxed text-stone-600">
                To guarantee complete institutional transparency and regulatory compliance, any mandatory professional accounting charges — including <strong>official Chartered Accountant (CA) auditing fees, regulatory filing charges, and incidental banking service charges</strong> — will be disbursed directly from this account Net Surplus prior to final fund locking.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-stone-200/80">
            <span className="w-6 h-6 rounded-full bg-amber-400 text-[#991B1B] font-bold flex items-center justify-center shrink-0 text-xs shadow-xs mt-0.5">
              3
            </span>
            <div className="space-y-0.5">
              <strong className="text-stone-900 text-xs block">
                Security via Bank Fixed Deposit (FD):
              </strong>
              <p className="leading-relaxed text-stone-600">
                Upon final settlement of all accounts and the formal signing of the audit report, the entire remaining net balance will be securely converted into a <strong>Bank Fixed Deposit (FD)</strong> under the association’s official bank account. This deposit will earn risk-free interest and remain strictly untouched until deployed for <strong>Sri Ganeshotsava 2027</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. COMMUNITY INQUIRIES & WHATSAPP GROUP */}
      <div className="bg-white border-2 border-emerald-400/80 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4 print-avoid-break">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-emerald-100 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#25D366] text-white shadow-xs">
              <QrCode className="w-5 h-5 text-white" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-serif font-black text-stone-900 uppercase tracking-wide">
                Community Inquiries, Bill Inspection &amp; WhatsApp Group
              </h3>
              <p className="text-[11px] text-stone-500 font-medium">
                Scan QR code or click the WhatsApp link to connect with Ganeshotsava Samithi 2026
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Community Ledger</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center pt-1">
          {/* Left Column: WhatsApp QR Code Card */}
          <div className="md:col-span-4 flex flex-col items-center justify-center p-4 bg-emerald-50/40 border-2 border-dashed border-emerald-300 rounded-2xl text-center space-y-2.5">
            <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-widest flex items-center gap-1">
              <span>Scan via Mobile Camera</span>
            </span>

            <a
              href={whatsappGroupUrl}
              target="_blank"
              rel="noreferrer"
              className="block p-2 bg-white rounded-xl shadow-xs border border-emerald-200 hover:scale-105 transition-transform cursor-pointer"
              title="Click or Scan to Join WhatsApp Devotee Group"
            >
              <img
                src={qrCodeUrl}
                alt="WhatsApp Group QR Code"
                className="w-36 h-36 sm:w-40 sm:h-40 object-contain mx-auto"
                loading="eager"
              />
            </a>

            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-stone-800 block">
                Devotee WhatsApp Group
              </span>
              <span className="text-[9px] text-stone-500 block">
                Instant updates, bill verifications &amp; announcements
              </span>
            </div>
          </div>

          {/* Right Column: Direct Link & Transparent Verification Guidelines */}
          <div className="md:col-span-8 space-y-3.5 text-xs text-stone-700">
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600 block">
                WhatsApp Group Link (Click to Open / Copy):
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={whatsappGroupUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[11px] sm:text-xs font-bold text-emerald-700 hover:text-emerald-800 underline break-all flex items-center gap-1"
                >
                  <span>{whatsappGroupUrl}</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>

                <button
                  type="button"
                  onClick={handleCopyWhatsAppLink}
                  className="no-print px-2.5 py-1 rounded-lg border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-800 font-bold text-[10px] uppercase tracking-wider inline-flex items-center gap-1 cursor-pointer transition-colors shadow-3xs"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-emerald-700" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2 leading-relaxed">
              <p className="text-stone-600">
                <strong>Resident &amp; Devotee Notice:</strong> Every voluntary donation, seva offering, and vendor disbursement is maintained with meticulous accounting records. Any resident who desires to inspect <strong>itemized vendor receipts, quotations, bank statements and audit files</strong> is warmly encouraged to reach out to Ganeshotsava Samithi 2026 via the WhatsApp group.
              </p>

              <div className="pt-1 font-medium text-[11px]">
                <div className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-200/60 flex items-center justify-between">
                  <div>
                    <span className="text-stone-500 block text-[9px] uppercase font-bold">Coordination &amp; Accounts Body</span>
                    <span className="font-semibold text-stone-900">Ganeshotsava Samithi 2026 • Eldorado</span>
                  </div>
                  <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-200">
                    Ganeshotsava Samithi 2026
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. A HUMBLE NOTE OF GRATITUDE & DEVOTIONAL ACKNOWLEDGMENT FROM THE GANESHOTSAVA TEAM (WITH FULL PICTURE OF LORD SRI GANESHA) */}
      <div className="bg-gradient-to-br from-[#FFFDF9] via-amber-50/30 to-[#FFFDF9] border-2 border-amber-400 rounded-2xl p-5 sm:p-7 shadow-sm space-y-5 print-avoid-break relative overflow-hidden">
        {/* Decorative Top Heading */}
        <div className="text-center space-y-1 border-b-2 border-amber-200 pb-3">
          <span className="text-xs font-serif font-black tracking-widest text-[#991B1B] uppercase block">
            ॥ ಓಂ ಗಂ ಗಣಪತಯೇ ನಮಃ ॥
          </span>
          <h3 className="text-lg sm:text-2xl font-serif font-black text-stone-900 tracking-tight">
            A Humble Note of Gratitude &amp; Devotional Acknowledgment
          </h3>
          <p className="text-xs text-amber-800 font-serif italic">
            Celebrating the Divine Success, Community Unity &amp; Splendour of Sri Ganeshotsava 2026
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left Column: Full Picture of Lord Sri Ganesha */}
          <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-4 bg-gradient-to-b from-amber-100/60 via-white to-amber-100/40 rounded-2xl border-2 border-amber-300 shadow-2xs">
            <div className="w-48 h-56 sm:w-52 sm:h-60 rounded-2xl overflow-hidden p-1 bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 shadow-md border-2 border-amber-400 mb-3 flex items-center justify-center">
              <img
                src={ganeshaPhotoUrl}
                alt="Lord Sri Vighnaharta Ganesha"
                className="w-full h-full object-cover rounded-xl filter drop-shadow-md"
              />
            </div>
            <div className="space-y-0.5">
              <h4 className="font-serif font-black text-xs text-[#991B1B] uppercase tracking-wider">
                Lord Sri Vighnaharta Ganesha
              </h4>
              <p className="text-[10px] text-amber-900 font-serif italic leading-tight">
                Sri Ganeshotsava 2026 • Festival Darshan
              </p>
              <p className="text-[9px] text-stone-500 font-medium pt-1">
                Eldorado
              </p>
            </div>
          </div>

          {/* Right Column: Heartfelt Humble Letter */}
          <div className="md:col-span-8 space-y-3 text-xs sm:text-[13px] text-stone-800 leading-relaxed font-normal">
            <p className="font-serif italic text-amber-950 font-semibold text-sm">
              ಎಲ್ಲಾ ಗೌರವಾನ್ವಿತ ನಿವಾಸಿಗಳು, ಭಕ್ತರು ಮತ್ತು ಕುಟುಂಬಗಳಿಗೆ ನಮಸ್ಕಾರಗಳು (Namaskara &amp; Festive Greetings to All Residents, Devotees &amp; Families),
            </p>

            <p>
              With the supreme blessings of <strong>Lord Sri Vighnaharta Ganesha</strong>, the <strong>Sri Ganeshotsava 2026</strong> celebrations at Eldorado were concluded with boundless spiritual devotion, grand cultural splendour, and profound community harmony. We bow our heads in humble adoration and gratitude to the Lord for filling our homes with divine energy, joy, and peace.
            </p>

            <p>
              On behalf of the entire Ganeshotsava organizing team, we offer our deepest, heartfelt gratitude to <strong>each and every resident, family, and devotee</strong> who contributed voluntary donations, booked sacred seva offerings, and actively participated throughout all days of pooja, aartis, cultural performances, and mahaprasada distribution. Your unstinted support and enthusiastic presence formed the very heartbeat of this grand celebration.
            </p>

            <p>
              Our most sincere and humble salutations go out to our <strong>extraordinary resident volunteers, youth teams, decoration committee, puja &amp; stage coordinators, prasadam seva volunteers, and security &amp; housekeeping staff</strong>. Working day and night behind the scenes with untiring zeal and pure selfless dedication, you ensured every devotee experienced a safe, divine, and seamless festival.
            </p>

            <p>
              We also express our sincere appreciation to our esteemed <strong>corporate sponsors and commercial stall partners</strong> for their valued collaboration in enriching our festival grounds.
            </p>

            <div className="p-3.5 rounded-xl bg-amber-100/70 border border-amber-300 text-amber-950 space-y-1 font-serif">
              <p className="font-bold text-center text-xs sm:text-sm text-[#991B1B]">
                ॥ ಗಣಪತಿ ಬಪ್ಪ ಮೋರಿಯಾ, ಮುಂದಿನ ವರ್ಷ ಬೇಗ ಬನ್ನಿ ॥
              </p>
              <p className="text-center text-[11px] sm:text-xs text-stone-700 italic">
                “ಶ್ರೀ ಗಣೇಶನು ನಮ್ಮೆಲ್ಲರ ಕುಟುಂಬಗಳಿಗೆ ಆಯುರಾರೋಗ್ಯ, ಸುಖ, ಸಮೃದ್ಧಿ ಮತ್ತು ಶಾಂತಿಯನ್ನು ಕರುಣಿಸಲಿ. May Lord Sri Ganesha bestow good health, boundless happiness, prosperity, and peace upon all our families. We look forward to celebrating Sri Ganeshotsava 2027 together!”
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-amber-200/80 gap-2 text-stone-600">
              <div>
                <span className="block font-bold text-stone-900 text-xs">
                  ಶ್ರೀ ಗಣೇಶೋತ್ಸವ ಸಮಿತಿ 2026 (Ganeshotsava Samithi 2026)
                </span>
                <span className="block text-[11px] text-stone-500">
                  ಎಲ್ಡೊರಾಡೊ • Eldorado
                </span>
              </div>
              <div className="text-left sm:text-right font-serif text-[11px] text-[#991B1B] font-bold">
                ಗಣಪತಿ ಬಪ್ಪ ಮೋರಿಯಾ! (Ganapati Bappa Morya!) 🙏
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 7. PRINT ATTESTATION FOOTER */}
      <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-center text-[10px] text-stone-500 space-y-1.5 print-avoid-break">
        <p className="font-semibold text-stone-800 text-xs">
          ಹಣಕಾಸು ದಾಖಲೆ • ಶ್ರೀ ಗಣೇಶೋತ್ಸವ ೨೦೨೬ • ಎಲ್ಡೊರಾಡೊ
        </p>
        <p className="text-[11px] font-medium text-stone-600">
          Financial Document • Sri Ganeshotsava 2026 • Eldorado
        </p>
        <p className="leading-relaxed text-stone-700 text-xs">
          ಈ ಲೆಕ್ಕಪತ್ರವು ೨೦೨೬ರ ಲೆಕ್ಕಪರಿಶೋಧನೆಗೊಳಪಡದ ಹಣಕಾಸು ಹೇಳಿಕೆಯನ್ನು (Unaudited Financial Statements 2026) ಒಳಗೊಂಡಿದೆ. ಸಂಪೂರ್ಣ ಪಾರದರ್ಶಕತೆಗಾಗಿ, ಎಲ್ಲಾ ಭೌತಿಕ ಬಿಲ್‌ಗಳು, ಪಾವತಿ ರಶೀದಿಗಳು ಮತ್ತು ಬ್ಯಾಂಕ್ ವಹಿವಾಟಿನ ದಾಖಲೆಗಳನ್ನು ಸಮಿತಿಯ ವಶದಲ್ಲಿ ಸಂರಕ್ಷಿಸಲಾಗಿದ್ದು ಭಕ್ತರ ಪರಿಶೀಲನೆಗೆ ಲಭ್ಯವಿರುತ್ತದೆ.
        </p>
        <p className="leading-tight text-[10px] text-stone-500 italic">
          This statement reflects accounted records as recorded in the Unaudited Financial Statements 2026. For complete transparency, all physical bills, payment receipts, and bank transaction proofs are preserved under committee custody and available upon request.
        </p>
      </div>

    </div>
  );
};

