import React, { useState, useEffect } from 'react';
import {
  Flag,
  Calendar,
  Sparkles,
  CheckCircle2,
  Users,
  Award,
  Heart,
  Globe,
  ChevronUp,
  MapPin,
  Clock,
  Flame,
  FileCheck,
  ShieldCheck,
  ArrowRight,
  Landmark,
  GraduationCap,
  Leaf,
  Scale,
  HeartHandshake,
  BookOpen,
  Building2,
  ChevronRight
} from 'lucide-react';

interface BalagaAboutUsViewProps {
  isDark?: boolean;
  lang?: 'kn' | 'en';
  onNavigateTab?: (tab: string, sectionId?: string) => void;
}

export const BalagaAboutUsView: React.FC<BalagaAboutUsViewProps> = ({
  isDark = false,
  lang = 'kn',
  onNavigateTab
}) => {
  const isKn = lang === 'kn';
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeTimelineYear, setActiveTimelineYear] = useState<'2024' | '2025' | '2026'>('2026');

  // Track window scroll for Back-to-Top button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-12 py-6 sm:py-10 font-sans selection:bg-[#800000] selection:text-white">
      {/* 1. HERO BANNER WITH ORGANISATION NAME & CULTURAL MOTIF BORDER */}
      <section id="top" className="max-w-6xl mx-auto px-4 sm:px-6">
        <div
          className={`relative rounded-3xl p-6 sm:p-12 border-2 shadow-lg overflow-hidden text-center sm:text-left transition-all ${
            isDark
              ? 'bg-gradient-to-br from-[#3D0000] via-stone-900 to-[#2A0000] border-[#800000]'
              : 'bg-gradient-to-br from-[#FFFDF7] via-[#FFFDF7] to-[#FDF4E3] border-[#D4AF37]/50'
          }`}
        >
          {/* Subtle Kannada Cultural Motif Background Accent */}
          <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none select-none flex items-center justify-end pr-4 sm:pr-8">
            <img
              src="/bhuvaneshwari_kannada_flag.jpg"
              alt="Goddess Bhuvaneshwari & Karnataka Flag"
              className="h-80 sm:h-96 w-auto object-contain rounded-2xl opacity-20"
            />
          </div>

          {/* Decorative Bicolor Bar Accent */}
          <div className="flex items-center gap-1.5 mb-6 justify-center sm:justify-start">
            <div className="h-2 w-12 bg-[#800000] rounded-full" />
            <div className="h-2 w-12 bg-[#FBBF24] rounded-full" />
            <div className="h-2 w-4 bg-[#800000] rounded-full" />
          </div>

          <div className="relative z-10 max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-2 bg-[#800000] text-[#FBBF24] text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full shadow-md border border-[#FBBF24]/60">
              <Landmark className="w-4 h-4 text-[#FBBF24]" />
              <span>
                {isKn ? 'ನಮ್ಮ ಪರಿಚಯ ಮತ್ತು ಸಾಂಸ್ಕೃತಿಕ ಆಶಯ' : 'About Our Cultural & Social Organisation'}
              </span>
            </div>

            <div>
              <h1
                className={`text-3xl sm:text-5xl lg:text-6xl font-serif font-black tracking-tight leading-tight ${
                  isDark ? 'text-amber-100' : 'text-[#660000]'
                }`}
              >
                {isKn ? 'ಎಲ್ ಡೊರಾಡೊ ಕನ್ನಡಿಗರ ಬಳಗ' : 'EL DORADO KANNADIGARA BALAGA'}
              </h1>
              <span className="text-base sm:text-xl font-serif font-bold text-[#800000] dark:text-[#FBBF24] block mt-2">
                {isKn
                  ? 'ಬ್ರಿಗೇಡ್ ಎಲ್ ಡೊರಾಡೊ • ನೋಂದಾಯಿತ ಸಾಂಸ್ಕೃತಿಕ ಮತ್ತು ಸಾಮಾಜಿಕ ಸಂಸ್ಥೆ (1960)'
                  : 'Brigade El Dorado • Registered Cultural & Social Organisation (Act 1960)'}
              </span>
            </div>

            <p className={`text-sm sm:text-base leading-relaxed font-medium ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
              {isKn
                ? 'ಕನ್ನಡ ಭಾಷೆಯ ಅಭಿಮಾನ, ಕರ್ನಾಟಕದ ಶ್ರೀಮಂತ ಸಾಂಸ್ಕೃತಿಕ ಪರಂಪರೆ ಹಾಗೂ ನಮ್ಮ ಸಮುದಾಯದಲ್ಲಿ ಸೌಹಾರ್ದ ಮತ್ತು ಸಹಬಾಳ್ವೆಯನ್ನು ಬಲಪಡಿಸುವ ಉದಾತ್ತ ಧ್ಯೇಯ.'
                : 'Nurturing pride in the Kannada language, preserving Karnataka’s rich cultural heritage, and strengthening harmony, coexistence, and social bonds among all residents.'}
            </p>

            {/* In-Page Quick Anchors */}
            <div className="pt-3 flex flex-wrap items-center gap-2 justify-center sm:justify-start">
              <button
                onClick={() => scrollToSection('about')}
                className="px-4 py-2 rounded-xl bg-[#800000] hover:bg-[#660000] text-[#FBBF24] font-bold text-xs shadow-md transition-all cursor-pointer border border-[#FBBF24]/50 flex items-center gap-1.5"
              >
                <span>{isKn ? 'ನಮ್ಮ ಬಗ್ಗೆ' : 'About Us'}</span>
              </button>
              <button
                onClick={() => scrollToSection('journey')}
                className="px-4 py-2 rounded-xl bg-[#FBBF24] hover:bg-yellow-300 text-stone-950 font-bold text-xs shadow-xs transition-all cursor-pointer border border-amber-500 flex items-center gap-1.5"
              >
                <span>{isKn ? 'ನಮ್ಮ ಪಯಣ' : 'Our Journey'}</span>
              </button>
              <button
                onClick={() => scrollToSection('vision')}
                className="px-4 py-2 rounded-xl bg-white dark:bg-stone-800 text-[#800000] dark:text-amber-300 border border-[#800000]/40 font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>{isKn ? 'ನಮ್ಮ ದೃಷ್ಟಿ' : 'Our Vision'}</span>
              </button>
              <button
                onClick={() => scrollToSection('mission')}
                className="px-4 py-2 rounded-xl bg-white dark:bg-stone-800 text-[#800000] dark:text-amber-300 border border-[#800000]/40 font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>{isKn ? 'ನಮ್ಮ ಧ್ಯೇಯ' : 'Our Mission'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 1: ನಮ್ಮ ಬಗ್ಗೆ | About Us */}
      <section id="about" className="max-w-6xl mx-auto px-4 sm:px-6 scroll-mt-24">
        <div
          className={`p-6 sm:p-12 rounded-3xl border-2 shadow-sm space-y-8 ${
            isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-[#D4AF37]/40'
          }`}
        >
          <div className="flex items-center gap-3 border-b border-stone-200 dark:border-stone-800 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#800000] text-[#FBBF24] flex items-center justify-center border-2 border-[#FBBF24] shrink-0 shadow-md">
              <Flag className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-4xl font-serif font-black text-stone-900 dark:text-stone-100">
                {isKn ? 'ನಮ್ಮ ಬಗ್ಗೆ' : 'About Us'}
              </h2>
            </div>
          </div>

          {/* Render approved text verbatim */}
          <div className="space-y-6 text-sm sm:text-base leading-relaxed font-medium">
            {isKn ? (
              <>
                <div className="p-5 sm:p-6 rounded-2xl bg-[#FFFDF7] dark:bg-stone-850 border-l-4 border-[#800000] dark:border-[#FBBF24] shadow-xs">
                  <p className="text-stone-800 dark:text-stone-200">
                    ಎಲ್ ಡೊರಾಡೊ ಕನ್ನಡಿಗರ ಬಳಗವು ಬ್ರಿಗೇಡ್ ಎಲ್ ಡೊರಾಡೊ ಅಪಾರ್ಟ್ಮೆಂಟ್ ಸಮುದಾಯದಲ್ಲಿ ನೆಲೆಸಿರುವ ಕನ್ನಡ ಭಾಷೆ, ಕರ್ನಾಟಕದ ಸಂಸ್ಕೃತಿ ಮತ್ತು ಪರಂಪರೆಯನ್ನು ಪ್ರೀತಿಸುವ ನಿವಾಸಿಗಳನ್ನು ಒಂದೇ ವೇದಿಕೆಯಡಿ ಒಗ್ಗೂಡಿಸುವ ಮಹತ್ತರ ಆಶಯದಿಂದ ಸ್ಥಾಪಿತವಾದ ಸಾಂಸ್ಕೃತಿಕ ಮತ್ತು ಸಾಮಾಜಿಕ ಸಂಸ್ಥೆಯಾಗಿದೆ.
                  </p>
                </div>

                <div className="p-5 sm:p-6 rounded-2xl bg-[#FFFDF7] dark:bg-stone-850 border-l-4 border-[#FBBF24] shadow-xs">
                  <p className="text-stone-800 dark:text-stone-200">
                    ಕನ್ನಡ ಭಾಷೆಯ ಅಭಿಮಾನವನ್ನು ಬೆಳೆಸುವುದು, ಕರ್ನಾಟಕದ ಶ್ರೀಮಂತ ಸಾಂಸ್ಕೃತಿಕ ಪರಂಪರೆಯನ್ನು ಉಳಿಸಿ ಮುಂದಿನ ಪೀಳಿಗೆಗೆ ತಲುಪಿಸುವುದು ಹಾಗೂ ಸಮುದಾಯದ ನಿವಾಸಿಗಳ ನಡುವೆ ಸೌಹಾರ್ದ, ಸಹಬಾಳ್ವೆ ಮತ್ತು ಸಾಮಾಜಿಕ ಬಾಂಧವ್ಯವನ್ನು ಬಲಪಡಿಸುವುದು ನಮ್ಮ ಸಂಸ್ಥೆಯ ಮೂಲ ಆಶಯವಾಗಿದೆ.
                  </p>
                </div>

                <div className="p-5 sm:p-6 rounded-2xl bg-[#FFFDF7] dark:bg-stone-850 border-l-4 border-[#800000] dark:border-[#FBBF24] shadow-xs">
                  <p className="text-stone-800 dark:text-stone-200">
                    ಕನ್ನಡಿಗರ ಸಾಂಸ್ಕೃತಿಕ ಅಭಿವ್ಯಕ್ತಿಗೆ ವೇದಿಕೆಯಾಗುವುದರ ಜೊತೆಗೆ, ಕನ್ನಡೇತರ ನಿವಾಸಿಗಳಿಗೂ ಕನ್ನಡ ನಾಡು, ನುಡಿ, ಸಂಸ್ಕೃತಿ ಮತ್ತು ಪರಂಪರೆಯನ್ನು ಪರಿಚಯಿಸುವ ಮೂಲಕ ವೈವಿಧ್ಯತೆಯಲ್ಲಿ ಏಕತೆಯನ್ನು ಸಾರುವ ಸಮುದಾಯವನ್ನು ನಿರ್ಮಿಸುವುದು ನಮ್ಮ ಬದ್ಧತೆಯಾಗಿದೆ.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="p-5 sm:p-6 rounded-2xl bg-[#FFFDF7] dark:bg-stone-850 border-l-4 border-[#800000] dark:border-[#FBBF24] shadow-xs">
                  <p className="text-stone-800 dark:text-stone-200">
                    El Dorado Kannadigara Balaga is a cultural and social organisation established with the vision of bringing together residents of Brigade El Dorado who share a love for the Kannada language, Karnataka's culture and its rich heritage under a common platform.
                  </p>
                </div>

                <div className="p-5 sm:p-6 rounded-2xl bg-[#FFFDF7] dark:bg-stone-850 border-l-4 border-[#FBBF24] shadow-xs">
                  <p className="text-stone-800 dark:text-stone-200">
                    Our core objective is to nurture pride in the Kannada language, preserve Karnataka's rich cultural heritage and pass it on to future generations, while strengthening harmony, coexistence and social bonds among the residents of the community.
                  </p>
                </div>

                <div className="p-5 sm:p-6 rounded-2xl bg-[#FFFDF7] dark:bg-stone-850 border-l-4 border-[#800000] dark:border-[#FBBF24] shadow-xs">
                  <p className="text-stone-800 dark:text-stone-200">
                    Along with providing a platform for Kannadigas to express and celebrate their cultural identity, we are equally committed to introducing residents from all cultural backgrounds to Karnataka's land, language, culture and traditions, thereby building a community that celebrates unity in diversity.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 2: ನಮ್ಮ ಪಯಣ | Our Journey (Horizontal Timeline on Desktop, Vertical on Mobile) */}
      <section id="journey" className="max-w-6xl mx-auto px-4 sm:px-6 scroll-mt-24">
        <div
          className={`p-6 sm:p-12 rounded-3xl border-2 shadow-sm space-y-8 ${
            isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-[#D4AF37]/40'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#800000] text-[#FBBF24] flex items-center justify-center border-2 border-[#FBBF24] shrink-0 shadow-md">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-4xl font-serif font-black text-stone-900 dark:text-stone-100">
                  {isKn ? 'ನಮ್ಮ ಪಯಣ' : 'Our Journey'}
                </h2>
              </div>
            </div>

            {/* Year Selector Tabs */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto bg-stone-100 dark:bg-stone-800 p-1.5 rounded-2xl border border-stone-200 dark:border-stone-700">
              {(['2024', '2025', '2026'] as const).map((yr) => (
                <button
                  key={yr}
                  onClick={() => setActiveTimelineYear(yr)}
                  className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                    activeTimelineYear === yr
                      ? 'bg-[#800000] text-[#FBBF24] shadow-md border border-[#FBBF24]/50'
                      : 'text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>
          </div>

          {/* DESKTOP: ATTRACTIVE HORIZONTAL TIMELINE GRID */}
          <div className="hidden md:grid md:grid-cols-3 gap-6 relative pt-4">
            {/* Horizontal Connecting Bar */}
            <div className="absolute top-12 left-12 right-12 h-1.5 bg-gradient-to-r from-[#800000] via-[#FBBF24] to-[#800000] rounded-full z-0 opacity-40" />

            {/* 2024 Item */}
            <div
              onClick={() => setActiveTimelineYear('2024')}
              className={`relative z-10 p-6 rounded-3xl border-2 space-y-4 shadow-md transition-all cursor-pointer ${
                activeTimelineYear === '2024'
                  ? 'bg-gradient-to-b from-[#FFFDF7] to-amber-50/50 dark:from-stone-850 dark:to-stone-900 border-[#800000] scale-[1.02]'
                  : isDark
                  ? 'bg-stone-900 border-stone-800 opacity-80 hover:opacity-100'
                  : 'bg-white border-stone-200 opacity-80 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xl font-serif font-black text-[#800000] dark:text-[#FBBF24] bg-[#800000]/10 px-3 py-1 rounded-full border border-[#800000]/20">
                  2024
                </span>
                <span className="text-xs font-bold text-[#800000] dark:text-[#FBBF24]">
                  {isKn ? 'ಆರಂಭದ ಹೆಜ್ಜೆ' : 'The First Steps'}
                </span>
              </div>

              <div className="space-y-3 pt-2">
                <p className="text-xs sm:text-sm leading-relaxed text-stone-800 dark:text-stone-200">
                  {isKn
                    ? 'ಬ್ರಿಗೇಡ್ ಎಲ್ ಡೊರಾಡೊ ಅಪಾರ್ಟ್ಮೆಂಟ್ ಯೋಜನೆಯಲ್ಲಿ 2024ರಲ್ಲಿ ಫ್ಲ್ಯಾಟ್ಗಳ ಹಸ್ತಾಂತರ ಪ್ರಕ್ರಿಯೆ ಆರಂಭವಾಯಿತು. ಹೊಸ ಸಮುದಾಯದ ರೂಪುಗೊಳ್ಳುವಿಕೆಯೊಂದಿಗೆ, ಗಣೇಶೋತ್ಸವದಂತಹ ಸಾಂಪ್ರದಾಯಿಕ ಹಬ್ಬಗಳನ್ನು ಆಚರಿಸುತ್ತಿದ್ದ ಕನ್ನಡಿಗ ಕುಟುಂಬಗಳು ಒಗ್ಗೂಡಿ ಸಾಂಸ್ಕೃತಿಕ ಚಟುವಟಿಕೆಗಳಿಗೆ ನಾಂದಿ ಹಾಡಿದವು. ಈ ಸಣ್ಣ ಆರಂಭವೇ ಮುಂದಿನ ದಿನಗಳಲ್ಲಿ ಒಂದು ವಿಶಾಲ ಕನ್ನಡ ಸಾಂಸ್ಕೃತಿಕ ವೇದಿಕೆಯಾಗಿ ಬೆಳೆಯುವ ಬುನಾದಿಯಾಯಿತು.'
                    : 'The handover of apartments at Brigade El Dorado commenced in 2024. As the new residential community began to take shape, resident families who came together to celebrate traditional festivals such as Ganeshotsava initiated various cultural activities. This modest beginning laid the foundation for what would eventually grow into a broader platform for Kannada culture and community engagement.'}
                </p>
              </div>
            </div>

            {/* 2025 Item */}
            <div
              onClick={() => setActiveTimelineYear('2025')}
              className={`relative z-10 p-6 rounded-3xl border-2 space-y-4 shadow-md transition-all cursor-pointer ${
                activeTimelineYear === '2025'
                  ? 'bg-gradient-to-b from-[#FFFDF7] to-amber-50/50 dark:from-stone-850 dark:to-stone-900 border-[#800000] scale-[1.02]'
                  : isDark
                  ? 'bg-stone-900 border-stone-800 opacity-80 hover:opacity-100'
                  : 'bg-white border-stone-200 opacity-80 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xl font-serif font-black text-[#800000] dark:text-[#FBBF24] bg-[#800000]/10 px-3 py-1 rounded-full border border-[#800000]/20">
                  2025
                </span>
                <span className="text-xs font-bold text-[#800000] dark:text-[#FBBF24]">
                  {isKn ? 'ಒಗ್ಗಟ್ಟಿನ ವಿಸ್ತರಣೆ' : 'Growing Together'}
                </span>
              </div>

              <div className="space-y-3 pt-2">
                <p className="text-xs sm:text-sm leading-relaxed text-stone-800 dark:text-stone-200">
                  {isKn
                    ? '2025ರಲ್ಲಿ ಕನ್ನಡಿಗ ಕುಟುಂಬಗಳ ಒಗ್ಗಟ್ಟಿಗೆ ಮತ್ತಷ್ಟು ಬಲ ತುಂಬುವ ಪ್ರಯತ್ನಗಳು ನಡೆದವು. ಕನ್ನಡೇತರ ನಿವಾಸಿಗಳನ್ನೂ ಒಳಗೊಂಡು ಕರ್ನಾಟಕ ರಾಜ್ಯೋತ್ಸವವನ್ನು ಸಂಭ್ರಮದಿಂದ ಮತ್ತು ವಿಜೃಂಭಣೆಯಿಂದ ಆಚರಿಸಲಾಯಿತು. ಈ ಆಚರಣೆಯು ಕನ್ನಡದ ಅಭಿಮಾನವನ್ನು ಹಂಚಿಕೊಳ್ಳುವ, ಸಾಂಸ್ಕೃತಿಕ ವೈವಿಧ್ಯತೆಯನ್ನು ಗೌರವಿಸುವ ಮತ್ತು ಸಮುದಾಯದ ಎಲ್ಲ ನಿವಾಸಿಗಳನ್ನು ಒಂದೇ ವೇದಿಕೆಗೆ ತರುವ ಮಹತ್ವದ ಹೆಜ್ಜೆಯಾಯಿತು.'
                    : 'In 2025, further efforts were made to strengthen community unity among resident families. Karnataka Rajyotsava was celebrated with great enthusiasm and grandeur, bringing together residents from all cultural backgrounds. This celebration marked an important step towards sharing pride in the Kannada language, respecting cultural diversity and bringing all residents of the community together on a common platform.'}
                </p>
              </div>
            </div>

            {/* 2026 Item */}
            <div
              onClick={() => setActiveTimelineYear('2026')}
              className={`relative z-10 p-6 rounded-3xl border-2 space-y-4 shadow-md transition-all cursor-pointer ${
                activeTimelineYear === '2026'
                  ? 'bg-gradient-to-b from-[#FFFDF7] to-amber-50/50 dark:from-stone-850 dark:to-stone-900 border-[#800000] scale-[1.02]'
                  : isDark
                  ? 'bg-stone-900 border-stone-800 opacity-80 hover:opacity-100'
                  : 'bg-white border-stone-200 opacity-80 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xl font-serif font-black text-[#800000] dark:text-[#FBBF24] bg-[#800000]/10 px-3 py-1 rounded-full border border-[#800000]/20">
                  2026
                </span>
                <span className="text-xs font-bold text-[#800000] dark:text-[#FBBF24]">
                  {isKn ? 'ಸಂಘಟಿತ ಸಂಸ್ಥೆಯ ಉದಯ' : 'Registered Organisation'}
                </span>
              </div>

              <div className="space-y-3 pt-2">
                <p className="text-xs sm:text-sm leading-relaxed text-stone-800 dark:text-stone-200">
                  {isKn
                    ? 'ಸಾಂಸ್ಕೃತಿಕ ಚಟುವಟಿಕೆಗಳಿಗೆ ಒಂದು ಶಾಶ್ವತ ಹಾಗೂ ಸಂಘಟಿತ ರೂಪ ನೀಡುವ ಉದ್ದೇಶದಿಂದ 2026ರಲ್ಲಿ ಅಧಿಕೃತ ಸಂಘವನ್ನು ಸ್ಥಾಪಿಸಲು ನಿರ್ಧರಿಸಲಾಯಿತು.\n\nಈ ಸಂಕಲ್ಪದ ಫಲವಾಗಿ, 1ನೇ ಸೆಪ್ಟೆಂಬರ್ 2026ರಂದು ಎಲ್ ಡೊರಾಡೊ ಕನ್ನಡಿಗರ ಬಳಗವು ಕರ್ನಾಟಕ ಸೊಸೈಟಿಗಳ ನೋಂದಣಿ ಕಾಯ್ದೆ, 1960ರ ಅಡಿಯಲ್ಲಿ ಬೆಂಗಳೂರಿನಲ್ಲಿ ಅಧಿಕೃತವಾಗಿ ನೋಂದಾಯಿಸಲ್ಪಟ್ಟಿತು.\n\nಈ ನೋಂದಣಿಯು ನಮ್ಮ ಪಯಣದಲ್ಲಿ ಒಂದು ಮಹತ್ವದ ಮೈಲಿಗಲ್ಲಾಗಿದ್ದು, ಕನ್ನಡ ಭಾಷೆ, ಸಂಸ್ಕೃತಿ ಮತ್ತು ಸಮಾಜಸೇವೆಯ ಕ್ಷೇತ್ರಗಳಲ್ಲಿ ಸಂಘಟಿತವಾಗಿ ಕಾರ್ಯನಿರ್ವಹಿಸುವ ನಮ್ಮ ಬದ್ಧತೆಗೆ ಅಧಿಕೃತ ರೂಪ ನೀಡಿದೆ.'
                    : 'With the intention of giving cultural activities a permanent and organised structure, a decision was made in 2026 to establish a formally registered association.\n\nAs a result of this initiative, El Dorado Kannadigara Balaga was officially registered in Bengaluru on 1 September 2026, under the Karnataka Societies Registration Act, 1960.\n\nThis registration marks a significant milestone in our journey, giving formal recognition to our commitment to working collectively towards the promotion of the Kannada language, culture and social service.'}
                </p>
              </div>
            </div>
          </div>

          {/* MOBILE: VERTICAL TIMELINE CARDS */}
          <div className="md:hidden space-y-6 relative border-l-4 border-[#800000] dark:border-[#FBBF24] ml-3 pl-6">
            {/* 2024 */}
            <div className="relative space-y-2">
              <div className="absolute -left-[33px] top-1 w-5 h-5 rounded-full bg-[#800000] border-2 border-white dark:border-stone-900" />
              <div className="flex items-center gap-2">
                <span className="text-sm font-serif font-black text-[#800000] dark:text-[#FBBF24] bg-[#800000]/10 px-2.5 py-0.5 rounded-full">
                  2024
                </span>
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                  {isKn ? 'ಆರಂಭದ ಹೆಜ್ಜೆ' : 'The First Steps'}
                </span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-stone-800 dark:text-stone-200 p-4 rounded-2xl bg-[#FFFDF7] dark:bg-stone-850 border border-stone-200 dark:border-stone-800">
                {isKn
                  ? 'ಬ್ರಿಗೇಡ್ ಎಲ್ ಡೊರಾಡೊ ಅಪಾರ್ಟ್ಮೆಂಟ್ ಯೋಜನೆಯಲ್ಲಿ 2024ರಲ್ಲಿ ಫ್ಲ್ಯಾಟ್ಗಳ ಹಸ್ತಾಂತರ ಪ್ರಕ್ರಿಯೆ ಆರಂಭವಾಯಿತು. ಹೊಸ ಸಮುದಾಯದ ರೂಪುಗೊಳ್ಳುವಿಕೆಯೊಂದಿಗೆ, ಗಣೇಶೋತ್ಸವದಂತಹ ಸಾಂಪ್ರದಾಯಿಕ ಹಬ್ಬಗಳನ್ನು ಆಚರಿಸುತ್ತಿದ್ದ ಕನ್ನಡಿಗ ಕುಟುಂಬಗಳು ಒಗ್ಗೂಡಿ ಸಾಂಸ್ಕೃತಿಕ ಚಟುವಟಿಕೆಗಳಿಗೆ ನಾಂದಿ ಹಾಡಿದವು. ಈ ಸಣ್ಣ ಆರಂಭವೇ ಮುಂದಿನ ದಿನಗಳಲ್ಲಿ ಒಂದು ವಿಶಾಲ ಕನ್ನಡ ಸಾಂಸ್ಕೃತಿಕ ವೇದಿಕೆಯಾಗಿ ಬೆಳೆಯುವ ಬುನಾದಿಯಾಯಿತು.'
                  : 'The handover of apartments at Brigade El Dorado commenced in 2024. As the new residential community began to take shape, resident families who came together to celebrate traditional festivals such as Ganeshotsava initiated various cultural activities. This modest beginning laid the foundation for what would eventually grow into a broader platform for Kannada culture and community engagement.'}
              </p>
            </div>

            {/* 2025 */}
            <div className="relative space-y-2">
              <div className="absolute -left-[33px] top-1 w-5 h-5 rounded-full bg-[#800000] border-2 border-white dark:border-stone-900" />
              <div className="flex items-center gap-2">
                <span className="text-sm font-serif font-black text-[#800000] dark:text-[#FBBF24] bg-[#800000]/10 px-2.5 py-0.5 rounded-full">
                  2025
                </span>
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                  {isKn ? 'ಒಗ್ಗಟ್ಟಿನ ವಿಸ್ತರಣೆ' : 'Growing Together'}
                </span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-stone-800 dark:text-stone-200 p-4 rounded-2xl bg-[#FFFDF7] dark:bg-stone-850 border border-stone-200 dark:border-stone-800">
                {isKn
                  ? '2025ರಲ್ಲಿ ಕನ್ನಡಿಗ ಕುಟುಂಬಗಳ ಒಗ್ಗಟ್ಟಿಗೆ ಮತ್ತಷ್ಟು ಬಲ ತುಂಬುವ ಪ್ರಯತ್ನಗಳು ನಡೆದವು. ಕನ್ನಡೇತರ ನಿವಾಸಿಗಳನ್ನೂ ಒಳಗೊಂಡು ಕರ್ನಾಟಕ ರಾಜ್ಯೋತ್ಸವವನ್ನು ಸಂಭ್ರಮದಿಂದ ಮತ್ತು ವಿಜೃಂಭಣೆಯಿಂದ ಆಚರಿಸಲಾಯಿತು. ಈ ಆಚರಣೆಯು ಕನ್ನಡದ ಅಭಿಮಾನವನ್ನು ಹಂಚಿಕೊಳ್ಳುವ, ಸಾಂಸ್ಕೃತಿಕ ವೈವಿಧ್ಯತೆಯನ್ನು ಗೌರವಿಸುವ ಮತ್ತು ಸಮುದಾಯದ ಎಲ್ಲ ನಿವಾಸಿಗಳನ್ನು ಒಂದೇ ವೇದಿಕೆಗೆ ತರುವ ಮಹತ್ವದ ಹೆಜ್ಜೆಯಾಯಿತು.'
                  : 'In 2025, further efforts were made to strengthen community unity among resident families. Karnataka Rajyotsava was celebrated with great enthusiasm and grandeur, bringing together residents from all cultural backgrounds. This celebration marked an important step towards sharing pride in the Kannada language, respecting cultural diversity and bringing all residents of the community together on a common platform.'}
              </p>
            </div>

            {/* 2026 */}
            <div className="relative space-y-2">
              <div className="absolute -left-[33px] top-1 w-5 h-5 rounded-full bg-[#800000] border-2 border-white dark:border-stone-900" />
              <div className="flex items-center gap-2">
                <span className="text-sm font-serif font-black text-[#800000] dark:text-[#FBBF24] bg-[#800000]/10 px-2.5 py-0.5 rounded-full">
                  2026
                </span>
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                  {isKn ? 'ಸಂಘಟಿತ ಸಂಸ್ಥೆಯ ಉದಯ' : 'Registered Organisation'}
                </span>
              </div>
              <div className="space-y-3 p-4 rounded-2xl bg-[#FFFDF7] dark:bg-stone-850 border border-stone-200 dark:border-stone-800 text-xs sm:text-sm leading-relaxed text-stone-800 dark:text-stone-200">
                <p>
                  {isKn
                    ? 'ಸಾಂಸ್ಕೃತಿಕ ಚಟುವಟಿಕೆಗಳಿಗೆ ಒಂದು ಶಾಶ್ವತ ಹಾಗೂ ಸಂಘಟಿತ ರೂಪ ನೀಡುವ ಉದ್ದೇಶದಿಂದ 2026ರಲ್ಲಿ ಅಧಿಕೃತ ಸಂಘವನ್ನು ಸ್ಥಾಪಿಸಲು ನಿರ್ಧರಿಸಲಾಯಿತು.'
                    : 'With the intention of giving cultural activities a permanent and organised structure, a decision was made in 2026 to establish a formally registered association.'}
                </p>
                <p className="p-3 rounded-xl bg-[#800000]/10 dark:bg-[#800000]/30 border border-[#800000]/30 font-semibold text-[#800000] dark:text-amber-300">
                  📜 {isKn
                    ? '1ನೇ ಸೆಪ್ಟೆಂಬರ್ 2026ರಂದು ಎಲ್ ಡೊರಾಡೊ ಕನ್ನಡಿಗರ ಬಳಗವು ಕರ್ನಾಟಕ ಸೊಸೈಟಿಗಳ ನೋಂದಣಿ ಕಾಯ್ದೆ, 1960ರ ಅಡಿಯಲ್ಲಿ ಬೆಂಗಳೂರಿನಲ್ಲಿ ಅಧಿಕೃತವಾಗಿ ನೋಂದಾಯಿಸಲ್ಪಟ್ಟಿತು.'
                    : 'Registered in Bengaluru on 1 September 2026, under the Karnataka Societies Registration Act, 1960.'}
                </p>
                <p>
                  {isKn
                    ? 'ಈ ನೋಂದಣಿಯು ನಮ್ಮ ಪಯಣದಲ್ಲಿ ಒಂದು ಮಹತ್ವದ ಮೈಲಿಗಲ್ಲಾಗಿದ್ದು, ಕನ್ನಡ ಭಾಷೆ, ಸಂಸ್ಕೃತಿ ಮತ್ತು ಸಮಾಜಸೇವೆಯ ಕ್ಷೇತ್ರಗಳಲ್ಲಿ ಸಂಘಟಿತವಾಗಿ ಕಾರ್ಯನಿರ್ವಹಿಸುವ ನಮ್ಮ ಬದ್ಧತೆಗೆ ಅಧಿಕೃತ ರೂಪ ನೀಡಿದೆ.'
                    : 'This registration marks a significant milestone in our journey, giving formal recognition to our commitment to working collectively towards the promotion of the Kannada language, culture and social service.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: ನಮ್ಮ ದೃಷ್ಟಿ | Our Vision */}
      <section id="vision" className="max-w-6xl mx-auto px-4 sm:px-6 scroll-mt-24">
        <div
          className={`p-6 sm:p-12 rounded-3xl border-2 shadow-sm space-y-6 ${
            isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-[#D4AF37]/40'
          }`}
        >
          <div className="flex items-center gap-3 border-b border-stone-200 dark:border-stone-800 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#800000] text-[#FBBF24] flex items-center justify-center border-2 border-[#FBBF24] shrink-0 shadow-md">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-4xl font-serif font-black text-stone-900 dark:text-stone-100">
                {isKn ? 'ನಮ್ಮ ದೃಷ್ಟಿ' : 'Our Vision'}
              </h2>
            </div>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#800000] to-[#550000] text-[#FFFDF7] shadow-xl border-2 border-[#FBBF24]/60 space-y-4">
            <div className="flex items-center gap-2 text-[#FBBF24] text-xs font-bold uppercase tracking-wider">
              <BookOpen className="w-4 h-4" />
              <span>{isKn ? 'ದೃಷ್ಟಿವಾಕ್ಯ' : 'Vision Statement'}</span>
            </div>

            <p className="text-sm sm:text-lg leading-relaxed font-serif font-medium">
              {isKn
                ? 'ಪ್ರತಿಯೊಂದು ಅಪಾರ್ಟ್ಮೆಂಟ್ ಸಮುದಾಯದಲ್ಲಿಯೂ ಕನ್ನಡ ಭಾಷೆ, ಸಂಸ್ಕೃತಿ, ಸಂಪ್ರದಾಯ, ಕಲೆ ಮತ್ತು ಪರಂಪರೆ ಜೀವಂತವಾಗಿ ಉಳಿದು ಬೆಳೆಯುವಂತೆ ಮಾಡುವುದು; ಕನ್ನಡಿಗರ ಅಸ್ಮಿತೆಯನ್ನು ಮುಂದಿನ ಪೀಳಿಗೆಗಳವರೆಗೆ ಅಚಲವಾಗಿ ಉಳಿಸುವುದರೊಂದಿಗೆ, ಕರ್ನಾಟಕದ ಭಾಷಾ-ಸಾಂಸ್ಕೃತಿಕ ಬೇರುಗಳಾದ ಸರ್ಕಾರಿ ಕನ್ನಡ ಶಾಲೆಗಳು ಸದೃಢವಾಗಿ ಬೆಳೆದು, ಕನ್ನಡದ ಬೆಳಕು ಪೀಳಿಗೆಯಿಂದ ಪೀಳಿಗೆಗೆ ಹರಡುವ ಭವಿಷ್ಯವನ್ನು ನಿರ್ಮಿಸುವುದು.'
                : 'To ensure that the Kannada language, culture, traditions, arts and heritage remain vibrant and continue to flourish within every apartment community. To preserve the identity and pride of Kannadigas for generations to come, while strengthening the roots of Karnataka\'s linguistic and cultural heritage through the growth and empowerment of government Kannada-medium schools.\n\nWe envision a future where government Kannada schools flourish and the light of the Kannada language continues to shine from one generation to the next.'}
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 4: ನಮ್ಮ ಧ್ಯೇಯ | Our Mission (6 Responsive Cards) */}
      <section id="mission" className="max-w-6xl mx-auto px-4 sm:px-6 scroll-mt-24">
        <div
          className={`p-6 sm:p-12 rounded-3xl border-2 shadow-sm space-y-8 ${
            isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-[#D4AF37]/40'
          }`}
        >
          <div className="flex items-center gap-3 border-b border-stone-200 dark:border-stone-800 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#800000] text-[#FBBF24] flex items-center justify-center border-2 border-[#FBBF24] shrink-0 shadow-md">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-4xl font-serif font-black text-stone-900 dark:text-stone-100">
                {isKn ? 'ನಮ್ಮ ಧ್ಯೇಯ' : 'Our Mission'}
              </h2>
            </div>
          </div>

          <p className="text-sm sm:text-base leading-relaxed font-medium text-stone-800 dark:text-stone-200">
            {isKn
              ? 'ಎಲ್ ಡೊರಾಡೊ ಕನ್ನಡಿಗರ ಬಳಗವು ಕನ್ನಡ ಭಾಷೆ, ಕರ್ನಾಟಕದ ಸಂಸ್ಕೃತಿ ಮತ್ತು ಸಾಮಾಜಿಕ ಸಾಮರಸ್ಯವನ್ನು ಉತ್ತೇಜಿಸುವ ಮೂಲಕ ಸಕ್ರಿಯ, ಸಹೃದಯ ಮತ್ತು ಎಲ್ಲರನ್ನೂ ಒಳಗೊಳ್ಳುವ ಸಮುದಾಯವನ್ನು ನಿರ್ಮಿಸುವ ಉದ್ದೇಶ ಹೊಂದಿದೆ.\n\nನಮ್ಮ ಪ್ರಮುಖ ಧ್ಯೇಯಗಳು:'
              : 'El Dorado Kannadigara Balaga aims to build an active, compassionate and inclusive community by promoting the Kannada language, Karnataka\'s culture and social harmony.\n\nOur key objectives are:'}
          </p>

          {/* 6 Responsive Objective Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                num: '1',
                titleKn: '1. ಕನ್ನಡಿಗರ ಒಗ್ಗಟ್ಟು ಮತ್ತು ಸಾಮಾಜಿಕ ಬಾಂಧವ್ಯ',
                titleEn: '1. Unity Among Kannadigas & Social Bonds',
                icon: Users,
                textKn:
                  'ಬ್ರಿಗೇಡ್ ಎಲ್ ಡೊರಾಡೊದ ಕನ್ನಡ ಮತ್ತು ಕರ್ನಾಟಕ ಪ್ರೇಮಿ ನಿವಾಸಿಗಳನ್ನು ಒಂದೇ ವೇದಿಕೆಯಡಿ ಒಗ್ಗೂಡಿಸಿ, ಕನ್ನಡಾಭಿಮಾನವನ್ನು ಬೆಳೆಸುವುದು ಹಾಗೂ ಸಮುದಾಯದ ನಿವಾಸಿಗಳ ನಡುವೆ ಸೌಹಾರ್ದ, ಸಹಕಾರ ಮತ್ತು ಸಾಮಾಜಿಕ ಬಾಂಧವ್ಯವನ್ನು ಬಲಪಡಿಸುವುದು.',
                textEn:
                  'To bring together residents of Brigade El Dorado who share a love for Kannada and Karnataka under a common platform, nurture pride in the Kannada language and strengthen harmony, cooperation and social bonds among community members.'
              },
              {
                num: '2',
                titleKn: '2. ಕನ್ನಡ ಭಾಷೆ ಮತ್ತು ಸಂಸ್ಕೃತಿಯ ಪ್ರಸಾರ',
                titleEn: '2. Promotion of Language & Culture',
                icon: BookOpen,
                textKn:
                  'ಎಲ್ಲ ನಿವಾಸಿಗಳಿಗೆ, ವಿಶೇಷವಾಗಿ ಕನ್ನಡೇತರರಿಗೆ, ಕನ್ನಡ ಭಾಷೆ, ಕರ್ನಾಟಕದ ಸಂಸ್ಕೃತಿ, ಸಂಪ್ರದಾಯ, ಕಲೆ ಮತ್ತು ಪರಂಪರೆಯನ್ನು ಪರಿಚಯಿಸುವುದು. ಕನ್ನಡ ಭಾಷೆಯ ಕಲಿಕೆ, ಬಳಕೆ ಮತ್ತು ಅಭಿವ್ಯಕ್ತಿಗೆ ಪ್ರೋತ್ಸಾಹ ನೀಡುವುದು.',
                textEn:
                  'To introduce all residents, particularly families from diverse backgrounds, to the Kannada language, Karnataka\'s culture, traditions, arts and heritage. To encourage the learning, use and expression of the Kannada language.'
              },
              {
                num: '3',
                titleKn: '3. ಮಕ್ಕಳಲ್ಲಿ ಸಾಂಸ್ಕೃತಿಕ ಮೌಲ್ಯಗಳ ಬೆಳವಣಿಗೆ',
                titleEn: '3. Nurturing Pride Among Children',
                icon: HeartHandshake,
                textKn:
                  'ಮಕ್ಕಳಲ್ಲಿ ಬಾಲ್ಯದಿಂದಲೇ ಕನ್ನಡ ಭಾಷೆಯ ಮೇಲಿನ ಪ್ರೀತಿ, ಕರ್ನಾಟಕದ ಬಗ್ಗೆ ಗೌರವ ಮತ್ತು ನಮ್ಮ ಶ್ರೀಮಂತ ಸಾಂಸ್ಕೃತಿಕ ಪರಂಪರೆಯ ಬಗ್ಗೆ ಅಭಿಮಾನವನ್ನು ಬೆಳೆಸುವುದು. ಮುಂದಿನ ಪೀಳಿಗೆಯಲ್ಲಿ ಕನ್ನಡದ ಅರಿವು ಮತ್ತು ಸಾಂಸ್ಕೃತಿಕ ಪ್ರಜ್ಞೆಯನ್ನು ಗಟ್ಟಿಗೊಳಿಸುವುದು.',
                textEn:
                  'To instil in children, from an early age, a love for the Kannada language, respect for Karnataka and pride in our rich cultural heritage. To strengthen Kannada language awareness and cultural consciousness among the next generation.'
              },
              {
                num: '4',
                titleKn: '4. ಶಿಕ್ಷಣ ಮತ್ತು ಯುವಜನರ ಸಬಲೀಕರಣ',
                titleEn: '4. Education & Youth Empowerment',
                icon: GraduationCap,
                textKn:
                  'ಸರ್ಕಾರಿ ಕನ್ನಡ ಶಾಲೆಗಳ ಮಕ್ಕಳಿಗೆ ಅಗತ್ಯವಾದ ಕೌಶಲಾಭಿವೃದ್ಧಿ ತರಬೇತಿ, ವೃತ್ತಿ ಮಾರ್ಗದರ್ಶನ ಮತ್ತು ಶೈಕ್ಷಣಿಕ ಬೆಂಬಲವನ್ನು ಒದಗಿಸುವ ಮೂಲಕ ಅವರ ಸಾಮರ್ಥ್ಯವನ್ನು ವೃದ್ಧಿಸಿ, ಉತ್ತಮ ಭವಿಷ್ಯ ರೂಪಿಸಿಕೊಳ್ಳಲು ನೆರವಾಗುವುದು.',
                textEn:
                  'To empower children studying in government Kannada-medium schools by providing essential skill development training, career guidance and educational support, helping them realise their potential and build a better future.'
              },
              {
                num: '5',
                titleKn: '5. ಪರಿಸರ ಸಂರಕ್ಷಣೆ ಮತ್ತು ಸಮಾಜ ಕಲ್ಯಾಣ',
                titleEn: '5. Environment & Social Welfare',
                icon: Leaf,
                textKn:
                  'ಪರಿಸರ ಸಂರಕ್ಷಣೆ, ಸುಸ್ಥಿರ ಜೀವನಶೈಲಿ, ಸಮುದಾಯದ ಮೂಲಸೌಕರ್ಯ ಅಭಿವೃದ್ಧಿ, ಆರೋಗ್ಯ ಜಾಗೃತಿ ಮತ್ತು ಇತರ ಸಮಾಜ ಕಲ್ಯಾಣ ಚಟುವಟಿಕೆಗಳಲ್ಲಿ ಸಕ್ರಿಯವಾಗಿ ತೊಡಗಿಸಿಕೊಳ್ಳುವುದು.',
                textEn:
                  'To actively participate in environmental conservation, sustainable living initiatives, community infrastructure development, health awareness programmes and other social welfare activities.'
              },
              {
                num: '6',
                titleKn: '6. ಸಮಾನತೆ, ಸಹಬಾಳ್ವೆ ಮತ್ತು ಒಳಗೊಳ್ಳುವಿಕೆ',
                titleEn: '6. Equality, Coexistence & Inclusion',
                icon: Scale,
                textKn:
                  'ಕರ್ನಾಟಕದ ನೆಲ, ನುಡಿ ಮತ್ತು ಸಂಸ್ಕೃತಿಯ ಮೌಲ್ಯಗಳನ್ನು ಗೌರವಿಸುವುದರೊಂದಿಗೆ, ಭಾಷೆ ಮತ್ತು ಸಾಂಸ್ಕೃತಿಕ ವೈವಿಧ್ಯತೆಯನ್ನು ಮಾನ್ಯಗೊಳಿಸುವ ಸಮುದಾಯವನ್ನು ನಿರ್ಮಿಸುವುದು. ಎಲ್ಲ ನಿವಾಸಿಗಳಿಗೂ ಸಮಾನ ಅವಕಾಶ, ಪರಸ್ಪರ ಗೌರವ ಮತ್ತು ಸಹಬಾಳ್ವೆಯ ವಾತಾವರಣವನ್ನು ಕಲ್ಪಿಸುವುದು.',
                textEn:
                  'To build a community that upholds the values of Karnataka\'s land, language and culture while respecting linguistic and cultural diversity. To ensure equal opportunities, mutual respect and an environment of peaceful coexistence for all residents.'
              }
            ].map((obj) => (
              <div
                key={obj.num}
                className={`p-6 rounded-3xl border-2 space-y-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                  isDark
                    ? 'bg-stone-850 border-stone-800 hover:border-[#800000]'
                    : 'bg-[#FFFDF7] border-[#D4AF37]/50 hover:border-[#800000]'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[#800000] text-[#FBBF24] flex items-center justify-center border border-[#FBBF24] shrink-0 font-bold shadow-xs">
                      <obj.icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-serif font-black text-[#800000] dark:text-[#FBBF24] bg-[#800000]/10 px-2.5 py-0.5 rounded-full">
                      #{obj.num}
                    </span>
                  </div>

                  <h3 className="font-serif font-black text-base text-stone-900 dark:text-stone-100">
                    {isKn ? obj.titleKn : obj.titleEn}
                  </h3>

                  <p className="text-xs sm:text-sm leading-relaxed text-stone-700 dark:text-stone-300 font-medium">
                    {isKn ? obj.textKn : obj.textEn}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5: ನಮ್ಮ ಸಂಕಲ್ಪ | Our Commitment (Highlight Maroon & Gold Banner) */}
      <section id="commitment" className="max-w-6xl mx-auto px-4 sm:px-6 scroll-mt-24">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-[#660000] via-[#800000] to-[#990000] text-[#FFFDF7] border-2 border-[#FBBF24] shadow-2xl space-y-6 relative overflow-hidden">
          {/* Subtle Corner Motif */}
          <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
            <div className="w-48 h-48 rounded-full border-8 border-[#FBBF24]" />
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FBBF24] text-[#660000] flex items-center justify-center font-bold shrink-0 shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-4xl font-serif font-black text-white">
                {isKn ? 'ನಮ್ಮ ಸಂಕಲ್ಪ' : 'Our Commitment'}
              </h2>
            </div>
          </div>

          {/* Three-part Commitment Highlight Text */}
          <div className="space-y-4 pt-2">
            <div className="p-5 rounded-2xl bg-[#550000]/60 border border-[#FBBF24]/50 shadow-inner">
              <p className="text-base sm:text-xl font-serif font-black text-[#FBBF24] tracking-wide text-center">
                {isKn
                  ? 'ಕನ್ನಡದ ಅಭಿಮಾನ ನಮ್ಮ ಒಗ್ಗಟ್ಟಿನ ಶಕ್ತಿ. ಕರ್ನಾಟಕದ ಸಂಸ್ಕೃತಿ ನಮ್ಮ ಹೆಮ್ಮೆ. ಸಮಾಜಸೇವೆ ನಮ್ಮ ಬದ್ಧತೆ.'
                  : 'Pride in Kannada is the strength of our unity. Karnataka\'s culture is our pride. Social service is our commitment.'}
              </p>
            </div>

            <p className="text-sm sm:text-base leading-relaxed text-amber-100 font-medium text-center max-w-4xl mx-auto">
              {isKn
                ? 'ಈ ಮೌಲ್ಯಗಳನ್ನು ಆಧಾರವಾಗಿಸಿಕೊಂಡು, ಎಲ್ ಡೊರಾಡೊ ಕನ್ನಡಿಗರ ಬಳಗವು ಕನ್ನಡ ಭಾಷೆ ಮತ್ತು ಸಂಸ್ಕೃತಿಯ ಬೆಳವಣಿಗೆಗೆ ಕೊಡುಗೆ ನೀಡುತ್ತಾ, ಸಮುದಾಯದ ಎಲ್ಲ ನಿವಾಸಿಗಳೊಂದಿಗೆ ಕೈಜೋಡಿಸಿ ಸೌಹಾರ್ದಯುತ, ಸಾಂಸ್ಕೃತಿಕವಾಗಿ ಶ್ರೀಮಂತ ಮತ್ತು ಸಾಮಾಜಿಕವಾಗಿ ಜವಾಬ್ದಾರಿಯುತ ಸಮುದಾಯವನ್ನು ನಿರ್ಮಿಸುವತ್ತ ನಿರಂತರವಾಗಿ ಶ್ರಮಿಸಲಿದೆ.'
                : 'Guided by these values, El Dorado Kannadigara Balaga will continuously strive to contribute to the growth and promotion of the Kannada language and culture, while working hand in hand with all residents of the community to build a harmonious, culturally enriched and socially responsible community.'}
            </p>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onNavigateTab && onNavigateTab('membership')}
              className="px-6 py-3.5 rounded-2xl bg-[#FBBF24] hover:bg-yellow-300 text-stone-950 font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              <Users className="w-4 h-4 text-stone-950" />
              <span>{isKn ? 'ಸದಸ್ಯತ್ವ ನೋಂದಣಿ 📌' : 'Apply for Membership 📌'}</span>
            </button>

            <button
              onClick={() => onNavigateTab && onNavigateTab('our-team')}
              className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/40 font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2"
            >
              <Building2 className="w-4 h-4 text-white" />
              <span>{isKn ? 'ಪದಾಧಿಕಾರಿಗಳ ವಿವರಗಳು' : 'Office Bearers & Members'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* FLOATING BACK-TO-TOP BUTTON */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 p-3.5 rounded-2xl bg-[#800000] hover:bg-[#660000] text-[#FBBF24] border-2 border-[#FBBF24] shadow-2xl transition-all cursor-pointer animate-in fade-in"
          title={isKn ? 'ಮೇಲಕ್ಕೆ ಹೋಗಿ' : 'Back to top'}
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};
