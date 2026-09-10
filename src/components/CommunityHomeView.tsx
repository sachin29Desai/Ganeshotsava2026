import React, { useState } from 'react';
import {
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  ArrowRight,
  FileText,
  ShieldCheck,
  HeartHandshake,
  Sparkles,
  Lock,
  Receipt,
  Flag,
  Flame,
  Wheat,
  X,
  Send,
  ChevronDown
} from 'lucide-react';
import { AppSettings, Contribution } from '../types';
import { fmt } from '../utils/helpers';

interface CommunityHomeViewProps {
  settings: AppSettings;
  contributions: Contribution[];
  onNavigateToGaneshotsava: () => void;
  onNavigateToReceipts: () => void;
}

export const CommunityHomeView: React.FC<CommunityHomeViewProps> = ({
  settings,
  contributions,
  onNavigateToGaneshotsava,
  onNavigateToReceipts
}) => {
  const totalDevotees = contributions.length;
  const totalDevoteeAmt = contributions.reduce((s, c) => s + (Number(c.amt) || 0), 0);

  // Modal state for upcoming event participation / volunteer interest
  const [interestModalOpen, setInterestModalOpen] = useState(false);
  const [selectedEventForInterest, setSelectedEventForInterest] = useState<string>('Karnataka Rajyotsava 2026');
  const [interestName, setInterestName] = useState('');
  const [interestFlat, setInterestFlat] = useState('');
  const [interestCategory, setInterestCategory] = useState('Cultural Dance / Drama');
  const [interestSubmitted, setInterestSubmitted] = useState(false);

  const handleOpenInterestModal = (eventName: string) => {
    setSelectedEventForInterest(eventName);
    setInterestSubmitted(false);
    setInterestModalOpen(true);
  };

  const handleInterestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!interestName.trim() || !interestFlat.trim()) return;
    setInterestSubmitted(true);
    setTimeout(() => {
      setInterestModalOpen(false);
      setInterestSubmitted(false);
      setInterestName('');
      setInterestFlat('');
    }, 2500);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A] flex flex-col font-sans selection:bg-[#991B1B] selection:text-white">
      {/* 0. DEVELOPMENT ROUTE ISOLATION NOTICE */}
      <aside aria-label="Development Route Notice" className="bg-amber-500 text-stone-950 px-4 py-2 text-xs font-semibold shadow-xs border-b border-amber-600 no-print">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-stone-950 text-amber-300 text-[10px] uppercase font-black px-2 py-0.5 rounded-sm tracking-wider">
              Route: /homepageindevelop
            </span>
            <span className="bg-red-800 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm tracking-wider">
              Admin Only
            </span>
            <span className="hidden sm:inline">
              Eldorado Kannadigara Balaga Celebrations Page (Under Active Development)
            </span>
            <span className="sm:hidden">Balaga Page (In Dev)</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-stone-900 hidden md:inline">
              Isolated preview — zero impact on the live Ganeshotsava 2026 app
            </span>
            <button
              onClick={onNavigateToGaneshotsava}
              className="bg-stone-950 hover:bg-stone-800 text-amber-300 hover:text-amber-200 text-xs font-bold px-3 py-1 rounded-md transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <span>← Go to Ganeshotsava 2026</span>
            </button>
          </div>
        </div>
      </aside>

      {/* 1. TOP COMMUNITY NAVIGATION HEADER */}
      <header className="bg-gradient-to-r from-[#7F1D1D] via-[#991B1B] to-[#7F1D1D] text-white shadow-md border-b-2 border-amber-400 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-400/20 border-2 border-amber-300 flex items-center justify-center shadow-inner shrink-0 p-0.5 overflow-hidden">
              <img
                src="/lord_ganesha.svg"
                alt="Lord Sri Ganesha"
                className="w-full h-full object-contain rounded-full"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-serif font-black tracking-wide text-amber-200">
                  ಎಲ್ ಡೊರಾಡೊ ಕನ್ನಡಿಗರ ಬಳಗ
                </h1>
                <span className="text-[10px] bg-amber-400 text-stone-950 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider hidden sm:inline-block">
                  Brigade El Dorado
                </span>
              </div>
              <p className="text-xs text-amber-100/90 font-medium">
                Eldorado Kannadigara Balaga • Our Cultures, Our Community
              </p>
            </div>
          </div>

          {/* Direct Navigation Links */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              onClick={() => scrollToSection('current-event')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer border border-white/20 hidden md:inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Current Event</span>
            </button>

            <button
              onClick={() => scrollToSection('upcoming-events')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer border border-white/20 hidden md:inline-flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-amber-300" />
              <span>Upcoming Events</span>
            </button>

            <button
              onClick={onNavigateToReceipts}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5 bg-amber-400 text-stone-950 hover:bg-amber-300 shadow-sm cursor-pointer"
              title="Download Devotee Receipts"
            >
              <FileText className="w-3.5 h-3.5 text-[#991B1B]" />
              <span>Devotee Receipts</span>
            </button>

            <button
              onClick={onNavigateToGaneshotsava}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5 bg-white text-[#991B1B] hover:bg-stone-100 shadow-sm cursor-pointer"
              title="Open Ganeshotsava 2026 Festival Portal"
            >
              <Lock className="w-3.5 h-3.5 text-[#991B1B]" />
              <span>Ganeshotsava Portal</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. IN-PAGE QUICK JUMP BAR */}
      <nav aria-label="In-page Jump Links" className="bg-[#FAF3E8] border-b border-amber-200/80 px-4 sm:px-6 py-2 sticky top-[65px] z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 overflow-x-auto no-scrollbar py-0.5 text-xs">
          <div className="flex items-center gap-2 sm:gap-4 shrink-0 font-medium">
            <span className="text-stone-500 font-bold uppercase tracking-wider text-[10px] hidden sm:inline">
              Quick Jump:
            </span>
            <button
              onClick={() => scrollToSection('current-event')}
              className="px-3 py-1 rounded-full bg-amber-200 text-[#7F1D1D] font-bold inline-flex items-center gap-1.5 hover:bg-amber-300 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-[#991B1B]" />
              <span>Current Event (Ganeshotsava 2026)</span>
            </button>
            <button
              onClick={() => scrollToSection('upcoming-events')}
              className="px-3 py-1 rounded-full bg-stone-200/70 text-stone-800 font-semibold inline-flex items-center gap-1.5 hover:bg-stone-300/80 transition-colors cursor-pointer"
            >
              <Flag className="w-3 h-3 text-red-600" />
              <span>Upcoming: Rajyotsava 2026</span>
            </button>
            <button
              onClick={() => scrollToSection('upcoming-events')}
              className="px-3 py-1 rounded-full bg-stone-200/70 text-stone-800 font-semibold inline-flex items-center gap-1.5 hover:bg-stone-300/80 transition-colors cursor-pointer hidden md:inline-flex"
            >
              <Flame className="w-3 h-3 text-amber-600" />
              <span>Upcoming: Deepavali Deepotsava</span>
            </button>
            <button
              onClick={() => scrollToSection('balaga-principles')}
              className="px-3 py-1 rounded-full bg-stone-200/70 text-stone-800 font-semibold inline-flex items-center gap-1.5 hover:bg-stone-300/80 transition-colors cursor-pointer hidden lg:inline-flex"
            >
              <ShieldCheck className="w-3 h-3 text-emerald-700" />
              <span>Balaga Principles</span>
            </button>
          </div>

          <div className="shrink-0">
            <button
              onClick={onNavigateToGaneshotsava}
              className="text-[#991B1B] hover:text-[#7F1D1D] font-bold inline-flex items-center gap-1 text-xs cursor-pointer"
            >
              <span>Live Portal</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </nav>

      {/* 3. HERO BANNER */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#991B1B] via-[#831616] to-[#7F1D1D] text-white py-12 sm:py-18 px-4 sm:px-6">
        <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
          <div className="w-[600px] h-[600px] rounded-full border-[30px] border-amber-300 transform rotate-45"></div>
        </div>

        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Cultural & Welfare Community • Brigade El Dorado</span>
          </div>

          <h2 className="text-3xl sm:text-5xl md:text-6xl font-serif font-black tracking-tight text-white leading-tight">
            Our Cultures, <br className="hidden sm:inline" />
            <span className="text-amber-300">Our Community</span>
          </h2>

          <p className="text-base sm:text-xl text-amber-100/95 font-serif max-w-3xl mx-auto leading-relaxed">
            Honouring our rich traditions and shared devotional heritage to unite every resident of Brigade El Dorado.
          </p>

          {/* Quick Action Navigation CTAs */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm">
            <button
              onClick={() => scrollToSection('current-event')}
              className="px-5 py-2.5 rounded-xl bg-amber-400 text-stone-950 font-bold hover:bg-amber-300 transition-colors shadow-md inline-flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#7F1D1D]" />
              <span>Current Event: Ganeshotsava 2026</span>
            </button>

            <button
              onClick={() => scrollToSection('upcoming-events')}
              className="px-5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold transition-colors border border-white/30 backdrop-blur-xs inline-flex items-center gap-2 cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-amber-300" />
              <span>Explore Upcoming Events</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onNavigateToReceipts}
              className="px-4 py-2.5 rounded-xl bg-black/30 hover:bg-black/40 text-amber-200 font-semibold transition-colors border border-amber-400/30 inline-flex items-center gap-2 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Devotee Receipts Portal</span>
            </button>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-3 text-xs">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/20 text-stone-100">
              <MapPin className="w-3.5 h-3.5 text-amber-300" />
              <span>Brigade El Dorado, Aerospace Park, Bengaluru</span>
            </div>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/20 text-stone-100">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
              <span>100% Transparent Community Accounting</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. MAIN CONTENT CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 flex-1 w-full space-y-16">
        
        {/* SECTION: CURRENT EVENT (ACTIVE NOW) */}
        <section id="current-event" className="scroll-mt-28 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-amber-200/80 pb-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#991B1B] bg-red-100/80 px-3 py-1 rounded-full border border-red-200 inline-flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#991B1B]" />
                <span>Current Active Event</span>
              </span>
              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-2">
                Sri Ganeshotsava 2026 (ಶ್ರೀ ಗಣೇಶೋತ್ಸವ)
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onNavigateToGaneshotsava}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#991B1B] text-white hover:bg-[#7F1D1D] transition-colors inline-flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <span>Enter Ganeshotsava Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* CURRENT EVENT DETAILED CARD */}
          <div className="bg-white rounded-2xl border-2 border-amber-400 shadow-md overflow-hidden flex flex-col justify-between relative group hover:shadow-lg transition-shadow">
            <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-stone-950 px-5 py-2.5 text-xs font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-stone-900" />
                <span>★ GRAND 3RD YEAR CELEBRATION — LIVE APPLICATION PORTAL</span>
              </span>
              <span className="bg-stone-950 text-amber-300 px-2.5 py-0.5 rounded text-[10px] uppercase font-black tracking-wider">
                Live Now
              </span>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 p-0.5 shadow-md shrink-0 border border-amber-300 overflow-hidden flex items-center justify-center">
                    <img
                      src="/lord_ganesha.svg"
                      alt="Lord Sri Ganesha"
                      className="w-full h-full object-contain rounded-full"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <h4 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
                      {settings.festival || 'Sri Ganeshotsava 2026'}
                    </h4>
                    <p className="text-xs sm:text-sm font-semibold text-[#991B1B]">
                      {settings.org || 'Eldorado Kannadigara Balaga'}
                    </p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 bg-stone-100 px-3 py-1.5 rounded-lg shrink-0 self-start">
                  <Calendar className="w-3.5 h-3.5 text-[#991B1B]" />
                  <span>{settings.dates || 'September 2026'}</span>
                </div>
              </div>

              <p className="text-stone-600 text-sm leading-relaxed">
                The grand community celebration bringing Lord Ganesha's divine blessings to Brigade El Dorado. Featuring traditional rituals, daily morning and evening aartis, devotional sevas, cultural programs, and grand mahaprasada for every resident family across all towers.
              </p>

              {/* Key Features Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/60 border border-amber-200/70 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-stone-800">Voluntary Devotee Receipts</span>
                    <p className="text-stone-600 text-[11px]">Instant online receipt search and official PDF download by flat number or name.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/60 border border-amber-200/70 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-stone-800">Devotional Sevas & Offerings</span>
                    <p className="text-stone-600 text-[11px]">Sankalpa pooja, modaka naivedya, flower alankara & prasada bookings.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/60 border border-amber-200/70 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-stone-800">100% Transparent Financial Audit</span>
                    <p className="text-stone-600 text-[11px]">Itemized income, vouchers, bills and audited statement of accounts.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/60 border border-amber-200/70 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-stone-800">Commercial Stalls & Sponsors</span>
                    <p className="text-stone-600 text-[11px]">Fair food and retail stalls booking with formal invoice generation.</p>
                  </div>
                </div>
              </div>

              {/* Devotee stats counter */}
              {totalDevotees > 0 && (
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-stone-700">
                    <Receipt className="w-4 h-4 text-[#991B1B]" />
                    <span><strong>{totalDevotees}</strong> voluntary devotee receipts issued to date</span>
                  </div>
                  <div className="text-emerald-700 font-bold">
                    ₹{fmt(totalDevoteeAmt)} total voluntary contributions registered
                  </div>
                </div>
              )}
            </div>

            {/* Action Footer */}
            <div className="p-6 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-stone-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#991B1B]" />
                <span>Central Amphitheatre & Grounds, Brigade El Dorado</span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={onNavigateToReceipts}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-100 hover:bg-amber-200 text-stone-900 transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer border border-amber-300/80"
                >
                  <FileText className="w-3.5 h-3.5 text-[#991B1B]" />
                  <span>Get Devotee Receipt</span>
                </button>

                <button
                  onClick={onNavigateToGaneshotsava}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-bold bg-[#991B1B] text-white hover:bg-[#7F1D1D] transition-colors inline-flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <span>Enter Ganeshotsava Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: UPCOMING EVENTS */}
        <section id="upcoming-events" className="scroll-mt-28 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-stone-200 pb-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 inline-flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-amber-600" />
                <span>Upcoming Celebrations & Habba</span>
              </span>
              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-2">
                Upcoming Community Events
              </h3>
              <p className="text-stone-600 text-xs sm:text-sm mt-1">
                Exciting future cultural celebrations organized by Eldorado Kannadigara Balaga for Brigade El Dorado residents.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* UPCOMING 1: KARNATAKA RAJYOTSAVA 2026 */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between">
              <div>
                <div className="bg-gradient-to-r from-red-600 via-red-500 to-yellow-500 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Flag className="w-3.5 h-3.5 text-yellow-200" />
                    <span>ಕನ್ನಡ ರಾಜ್ಯೋತ್ಸವ ೨೦೨೬</span>
                  </div>
                  <span className="bg-black/40 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold">
                    November 2026
                  </span>
                </div>

                <div className="p-6 space-y-4">
                  <div className="space-y-1">
                    <h4 className="text-xl font-serif font-bold text-stone-900 flex items-center gap-2">
                      <span className="text-2xl" role="img" aria-label="Karnataka Flag">🚩</span>
                      <span>Karnataka Rajyotsava 2026</span>
                    </h4>
                    <p className="text-xs text-[#991B1B] font-semibold">
                      Eldorado Kannadigara Balaga
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-1.5 text-xs text-stone-600 bg-stone-100 px-3 py-1 rounded-lg">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    <span>November 2026 • Central Amphitheatre</span>
                  </div>

                  <p className="text-stone-600 text-xs leading-relaxed">
                    Celebrating the grand state formation of Karnataka with Kannada flag hoisting, Naadageethe, cultural dances by society children, traditional Karnataka delicacy stalls, and Kannada heritage quiz.
                  </p>

                  <div className="space-y-2 pt-2 text-xs text-stone-600 border-t border-stone-100">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Traditional Flag Hoisting & Naadageethe</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Resident Children Dance & Drama Programs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Karunada Samshodhisi Quiz & Kannada Games</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Traditional Delicacy & Food Festival Stalls</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-stone-50 border-t border-stone-100 space-y-2">
                <button
                  onClick={() => handleOpenInterestModal('Karnataka Rajyotsava 2026')}
                  className="w-full py-2 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Cultural / Volunteer Interest</span>
                </button>
                <div className="text-center text-[10px] text-stone-500 italic">
                  Society registration opens October 2026
                </div>
              </div>
            </div>

            {/* UPCOMING 2: DEEPAVALI & KANNADA DEEPOTSAVA 2026 */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between">
              <div>
                <div className="bg-gradient-to-r from-amber-600 via-orange-500 to-amber-500 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-yellow-200" />
                    <span>ದೀಪಾವಳಿ & ದೀಪೋತ್ಸವ</span>
                  </div>
                  <span className="bg-black/40 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold">
                    Oct / Nov 2026
                  </span>
                </div>

                <div className="p-6 space-y-4">
                  <div className="space-y-1">
                    <h4 className="text-xl font-serif font-bold text-stone-900 flex items-center gap-2">
                      <span className="text-2xl" role="img" aria-label="Diya">🪔</span>
                      <span>Deepavali Deepotsava 2026</span>
                    </h4>
                    <p className="text-xs text-amber-700 font-semibold">
                      Festival of Lights & Warmth
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-1.5 text-xs text-stone-600 bg-stone-100 px-3 py-1 rounded-lg">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    <span>Kartika Maasa • Society Boulevard</span>
                  </div>

                  <p className="text-stone-600 text-xs leading-relaxed">
                    A celestial community celebration lighting over 1,000 clay earthen diyas across the central plaza, vibrant traditional flower rangolis by resident families, and eco-friendly joyous celebrations.
                  </p>

                  <div className="space-y-2 pt-2 text-xs text-stone-600 border-t border-stone-100">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>1,000+ Clay Earthen Diyas Lighting</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Inter-Tower Rangoli Competition</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Eco-Friendly Community Gathering</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-stone-50 border-t border-stone-100 space-y-2">
                <button
                  onClick={() => handleOpenInterestModal('Deepavali Deepotsava 2026')}
                  className="w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Rangoli / Diya Volunteer Form</span>
                </button>
                <div className="text-center text-[10px] text-stone-500 italic">
                  Diyas provided by Balaga for common area
                </div>
              </div>
            </div>

            {/* UPCOMING 3: MAKARA SANKRANTI & SUGGI HABBA 2027 */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between">
              <div>
                <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Wheat className="w-3.5 h-3.5 text-yellow-200" />
                    <span>ಮಕರ ಸಂಕ್ರಾಂತಿ & ಸುಗ್ಗಿ</span>
                  </div>
                  <span className="bg-black/40 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold">
                    January 2027
                  </span>
                </div>

                <div className="p-6 space-y-4">
                  <div className="space-y-1">
                    <h4 className="text-xl font-serif font-bold text-stone-900 flex items-center gap-2">
                      <span className="text-2xl" role="img" aria-label="Kite">🪁</span>
                      <span>Makara Sankranti 2027</span>
                    </h4>
                    <p className="text-emerald-800 font-semibold text-xs">
                      Suggi Habba & Harvest Blessings
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-1.5 text-xs text-stone-600 bg-stone-100 px-3 py-1 rounded-lg">
                    <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                    <span>January 2027 • Society Open Ground</span>
                  </div>

                  <p className="text-stone-600 text-xs leading-relaxed">
                    Celebrating the harvest festival with traditional Ellu-Bella & Sakkare Acchu sharing among neighbour families, sugarcane distribution, and an exhilarating kite flying festival for children.
                  </p>

                  <div className="space-y-2 pt-2 text-xs text-stone-600 border-t border-stone-100">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>Ellu-Bella & Sakkare Acchu Exchange</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>Kids Kite Flying Gala on Open Field</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>Traditional Harvest Blessings Ceremony</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-stone-50 border-t border-stone-100 space-y-2">
                <button
                  onClick={() => handleOpenInterestModal('Makara Sankranti 2027')}
                  className="w-full py-2 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Kite Flying & Volunteer Signup</span>
                </button>
                <div className="text-center text-[10px] text-stone-500 italic">
                  Sugarcane & Ellu-Bella packing volunteers
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* SECTION: BALAGA PRINCIPLES & TRANSPARENCY */}
        <section id="balaga-principles" className="scroll-mt-28 bg-white rounded-2xl border border-stone-200 p-6 sm:p-10 shadow-sm space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-[#991B1B] bg-red-50 px-3 py-1 rounded-full border border-red-200">
              Balaga Core Values
            </span>
            <h3 className="text-2xl font-serif font-bold text-stone-900">
              Our Principles & Community Commitment
            </h3>
            <p className="text-stone-600 text-xs sm:text-sm">
              How Eldorado Kannadigara Balaga builds an inclusive, transparent, and bonded society.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-[#FDFBF7] border border-stone-200 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xl">
                <ShieldCheck className="w-6 h-6 text-[#991B1B]" />
              </div>
              <h5 className="font-serif font-bold text-base text-stone-900">
                100% Financial Transparency
              </h5>
              <p className="text-xs text-stone-600 leading-relaxed">
                Every voluntary contribution and society expenditure is digitally recorded, backed by vendor bills, vouchers, and published for resident audit.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#FDFBF7] border border-stone-200 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xl">
                <HeartHandshake className="w-6 h-6 text-[#991B1B]" />
              </div>
              <h5 className="font-serif font-bold text-base text-stone-900">
                Volunteer & Community Driven
              </h5>
              <p className="text-xs text-stone-600 leading-relaxed">
                Organized entirely by resident volunteers across all towers of Brigade El Dorado who dedicate their time, passion, and skills for common joy.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#FDFBF7] border border-stone-200 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xl">
                <Users className="w-6 h-6 text-[#991B1B]" />
              </div>
              <h5 className="font-serif font-bold text-base text-stone-900">
                Inclusive & Welcoming To All
              </h5>
              <p className="text-xs text-stone-600 leading-relaxed">
                Voluntary contributions are strictly non-mandatory. Every resident, child, and elder in Brigade El Dorado is warmly invited to participate and enjoy.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION: ABOUT BALAGA & ACTION BANNER */}
        <section className="bg-gradient-to-br from-stone-900 to-stone-800 text-white rounded-2xl p-6 sm:p-10 shadow-lg flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-300">
              About The Balaga
            </span>
            <h4 className="text-2xl font-serif font-bold text-white">
              Eldorado Kannadigara Balaga (ಎಲ್ ಡೊರಾಡೊ ಕನ್ನಡಿಗರ ಬಳಗ)
            </h4>
            <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
              Formed by the residents of Brigade El Dorado (Astra, Gallium, Helium, Feldspar, Jasper, Krypton, etc.) to foster regional cultural harmony, celebrate festivals, and support one another as one harmonious extended family.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-stone-400">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                KIADB Aerospace Park, Bagalur, Bengaluru - 562149
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full md:w-auto shrink-0">
            <button
              onClick={onNavigateToGaneshotsava}
              className="px-6 py-3 rounded-xl bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-wider hover:bg-amber-300 transition-colors shadow-md text-center cursor-pointer inline-flex items-center justify-center gap-2"
            >
              <span>Visit Ganeshotsava 2026 Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onNavigateToReceipts}
              className="px-6 py-2.5 rounded-xl bg-white/10 text-white border border-white/20 font-bold text-xs hover:bg-white/20 transition-colors text-center cursor-pointer inline-flex items-center justify-center gap-2"
            >
              <FileText className="w-3.5 h-3.5 text-amber-300" />
              <span>Search & Download Receipts</span>
            </button>
          </div>
        </section>
      </main>

      {/* 5. VOLUNTEER / PARTICIPATION INTEREST MODAL (LOCAL TEST STATE) */}
      {interestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setInterestModalOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#991B1B] bg-red-50 px-2 py-0.5 rounded border border-red-200">
                  Resident Participation Interest
                </span>
                <h4 className="text-lg font-serif font-bold text-stone-900 mt-1">
                  {selectedEventForInterest}
                </h4>
                <p className="text-xs text-stone-500">
                  Express your participation or volunteer interest for Eldorado Kannadigara Balaga festivities.
                </p>
              </div>

              {interestSubmitted ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <h5 className="font-bold text-sm text-emerald-900">Interest Recorded!</h5>
                  <p className="text-xs text-emerald-700">
                    Thank you {interestName}! The Balaga coordinating team will reach out as planning commences.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleInterestSubmit} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-stone-700 font-semibold mb-1">
                      Resident / Participant Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Suresh Gowda / Ananya"
                      value={interestName}
                      onChange={(e) => setInterestName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#991B1B] focus:border-transparent text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-700 font-semibold mb-1">
                      Tower & Flat Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Astra-1402 / Helium-804"
                      value={interestFlat}
                      onChange={(e) => setInterestFlat(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#991B1B] focus:border-transparent text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-700 font-semibold mb-1">
                      Interest Category
                    </label>
                    <select
                      value={interestCategory}
                      onChange={(e) => setInterestCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#991B1B] focus:border-transparent text-xs bg-white"
                    >
                      <option value="Cultural Dance / Drama">Cultural Dance / Drama (Children & Family)</option>
                      <option value="Kannada Singing & Naadageethe">Kannada Singing & Naadageethe</option>
                      <option value="Event Planning & Stage Management">Event Planning & Stage Management</option>
                      <option value="Food & Prasada Coordination">Food & Prasada Coordination</option>
                      <option value="Crowd Management & Volunteer">Crowd Management & Volunteer</option>
                    </select>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setInterestModalOpen(false)}
                      className="px-4 py-2 rounded-lg text-stone-600 hover:bg-stone-100 font-semibold cursor-pointer text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-[#991B1B] hover:bg-[#7F1D1D] text-white font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs text-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Interest</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. COMMUNITY FOOTER */}
      <footer className="bg-stone-900 text-stone-400 text-xs py-8 border-t border-stone-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-center sm:text-left">
            <img
              src="/lord_ganesha.svg"
              alt="Lord Sri Ganesha"
              className="w-6 h-6 object-contain shrink-0"
              referrerPolicy="no-referrer"
            />
            <span>© 2026 Eldorado Kannadigara Balaga • Brigade El Dorado</span>
          </div>
          <div className="flex items-center gap-4 flex-wrap justify-center text-[11px]">
            <button onClick={onNavigateToGaneshotsava} className="hover:text-amber-300 transition-colors cursor-pointer">
              Ganeshotsava 2026 Portal
            </button>
            <span>•</span>
            <button onClick={onNavigateToReceipts} className="hover:text-amber-300 transition-colors cursor-pointer">
              Devotee Receipts
            </button>
            <span>•</span>
            <span className="text-amber-400 font-medium">Our Cultures, Our Community</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
