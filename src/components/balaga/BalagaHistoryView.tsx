import React, { useState } from 'react';
import {
  Flag,
  Calendar,
  Sparkles,
  CheckCircle2,
  Users,
  Award,
  Heart,
  Globe,
  ChevronRight,
  MapPin,
  Clock,
  Flame,
  FileCheck,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Landmark,
  Compass,
  Star
} from 'lucide-react';

interface BalagaHistoryViewProps {
  isDark?: boolean;
  lang?: 'kn' | 'en';
  onNavigateTab?: (tab: string) => void;
}

export interface HistoryEra {
  id: string;
  yearRange: string;
  titleEn: string;
  titleKn: string;
  subtitleEn: string;
  subtitleKn: string;
  badge: string;
  badgeKn: string;
  descriptionEn: string;
  descriptionKn: string;
  highlightsEn: string[];
  highlightsKn: string[];
  impactStats: { labelEn: string; labelKn: string; value: string }[];
  imageUrl: string;
  imageCaptionEn: string;
  imageCaptionKn: string;
  isVisionEra?: boolean;
}

export const HISTORICAL_ERAS: HistoryEra[] = [
  {
    id: 'era-2024',
    yearRange: '2024',
    titleEn: 'Foundational Roots & Resident Awakening',
    titleKn: 'ಸ್ಥಾಪನೆ ಮತ್ತು ಬೆಳೆದು ಬಂದ ಆರಂಭಿಕ ಹಾದಿ',
    subtitleEn: 'Uniting Kannada Families at Brigade El Dorado',
    subtitleKn: 'ಬ್ರಿಗೇಡ್ ಎಲ್ ಡೊರಾಡೊದಲ್ಲಿ ಕನ್ನಡಿಗರ ಒಕ್ಕೂಟ ಸ್ಥಾಪನೆ',
    badge: 'Foundational Era',
    badgeKn: 'ಆರಂಭಿಕ ಹಂತ',
    descriptionEn:
      'In early 2024, a small group of resident Kannada families residing in Brigade El Dorado, Aerospace Park, recognized the need for a voluntary non-profit forum. Driven by a passion to celebrate Karnataka statehood, literature, and festivals in our neighborhood, Eldorado Kannadigara Balaga was formally inaugurated.',
    descriptionKn:
      '೨೦೨೪ ರಲ್ಲಿ ಬ್ರಿಗೇಡ್ ಎಲ್ ಡೊರಾಡೊ ನಿವಾಸಿಗಳು ಕನ್ನಡ ಭಾಷೆ, ಸಂಸ್ಕೃತಿ ಮತ್ತು ನಮ್ಮ ಸಡಗರದ ಹಬ್ಬಗಳನ್ನು ಆಚರಿಸಲು ಕನ್ನಡಿಗರ ಬಳಗವನ್ನು ಲಾಭರಹಿತ ಸಾಂಸ್ಕೃತಿಕ ವೇದಿಕೆಯಾಗಿ ಸ್ಥಾಪಿಸಿದರು.',
    highlightsEn: [
      'Formed initial working committee across all resident towers (Jasper, Helios, Feldspar, Gallium).',
      'Hosted Inaugural Kannada Rajyotsava & Deepotsava celebration with 300+ resident attendees.',
      'Established transparent open-book finance principles and non-profit resident charter.'
    ],
    highlightsKn: [
      'ಎಲ್ಲಾ ಟವರ್‌ಗಳ ನಿವಾಸಿಗಳನ್ನು ಸೇರಿಸಿ ಕಾರ್ಯಕಾರಿಣಿ ಸಮಿತಿ ರಚನೆ.',
      'ಪ್ರಥಮ ಕನ್ನಡ ರಾಜ್ಯೋತ್ಸವ ಮತ್ತು ದೀಪೋತ್ಸವ – ೩೦೦ಕ್ಕೂ ಹೆಚ್ಚು ನಿವಾಸಿ ಭಾಗಿ.',
      '೧೦೦% ಪಾರದರ್ಶಕ ಹಣಕಾಸು ಲೆಕ್ಕಪತ್ರ ಸಾರ್ವಜನಿಕ ಪ್ರಕಟಣೆ.'
    ],
    impactStats: [
      { labelEn: 'Founding Members', labelKn: 'ಸಂಸ್ಥಾಪಕ ಸದಸ್ಯರು', value: '45+' },
      { labelEn: 'Initial Attendees', labelKn: 'ಪ್ರಥಮ ಸಮಾರಂಭ', value: '300+' },
      { labelEn: 'Volunteers Enrolled', labelKn: 'ಸೇವಾರ್ಥಿ ಸ್ವಯಂಸೇವಕರು', value: '25' }
    ],
    imageUrl: '/bhuvaneshwari_kannada_flag.jpg',
    imageCaptionEn: 'Inaugural Gathering of Eldorado Kannadigara Balaga in 2024',
    imageCaptionKn: '೨೦೨೪ ರ ಪ್ರಥಮ ಕನ್ನಡಿಗರ ಬಳಗ ಸಭೆ'
  },
  {
    id: 'era-2025',
    yearRange: '2025',
    titleEn: 'Grand Celebrations & Devotional Seva',
    titleKn: 'ಭವ್ಯ ಉತ್ಸವಗಳು ಮತ್ತು ಧಾರ್ಮಿಕ ಸೇವೆ',
    subtitleEn: '5-Day Sri Ganeshotsava & Community Welfare Expansion',
    subtitleKn: '೫ ದಿನಗಳ ಶ್ರೀ ಗಣೇಶೋತ್ಸವ ಮತ್ತು ಸಮಾಜ ಸೇವೆ',
    badge: 'Expansion Era',
    badgeKn: 'ವಿಸ್ತರಣಾ ಹಂತ',
    descriptionEn:
      '2025 marked a major milestone with our 1st 5-Day Sri Ganeshotsava Mahotsava. Over 1,200 devotees participated in traditional Vedic poojas, daily Anna Santharpane Mahaprasada, cultural evening performances, and community social drives including blood donation and government school supply distribution.',
    descriptionKn:
      '೨೦೨೫ ರಲ್ಲಿ ನಡೆದ ೫ ದಿನಗಳ ಭವ್ಯ ಶ್ರೀ ಗಣೇಶೋತ್ಸವದಲ್ಲಿ ೧,೨೦೦ಕ್ಕೂ ಹೆಚ್ಚು ಭಕ್ತಾದಿಗಳು ಮಹಾಪ್ರಸಾದ, ವೇದ ಪೂಜೆ ಹಾಗೂ ಸಾಂಸ್ಕೃತಿಕ ಕಾರ್ಯಕ್ರಮಗಳಲ್ಲಿ ಭಾಗವಹಿಸಿದರು.',
    highlightsEn: [
      'Organized 5-day Sri Ganeshotsava Mahotsava with Vedic Homam and daily Mahaprasada.',
      'Launched Kannada Sambhrama cultural talent stage for resident children and classical artists.',
      'Initiated blood donation camp and government school stationery distribution drive.',
      'Integrated real-time Cloud Ledger & receipt portal for 100% financial transparency.'
    ],
    highlightsKn: [
      '೫ ದಿನಗಳ ಶ್ರೀ ಗಣೇಶೋತ್ಸವ, ವೇದ ಹೋಮ ಮತ್ತು ದಿನನಿತ್ಯ ಅನ್ನ ಸಂತರ್ಪಣೆ ಮಹಾಪ್ರಸಾದ.',
      'ನಿವಾಸಿ ಮಕ್ಕಳ ಮತ್ತು ಕಲಾವಿದರ ಸಾಂಸ್ಕೃತಿಕ ರಂಗಸ್ಥಳ.',
      'ರಕ್ತದಾನ ಶಿಬಿರ ಹಾಗೂ ಸರ್ಕಾರಿ ಶಾಲೆ ಮಕ್ಕಳಿಗೆ ಉಚಿತ ಪುಸ್ತಕ ವಿತರಣೆ.',
      'ಡಿಜಿಟಲ್ ಲೆಕ್ಕಪತ್ರ ಮತ್ತು ರಶೀದಿ ಪೋರ್ಟಲ್ ಚಾಲನೆ.'
    ],
    impactStats: [
      { labelEn: 'Devotees Served', labelKn: 'ಮಹಾಪ್ರಸಾದ ಸ್ವೀಕರಿಸಿದವರು', value: '1,200+' },
      { labelEn: 'Cultural Acts', labelKn: 'ಸಾಂಸ್ಕೃತಿಕ ಪ್ರದರ್ಶನಗಳು', value: '35+' },
      { labelEn: 'Donations Raised', labelKn: 'ನಿಧಿ ಸಂಗ್ರಹ', value: '₹1.8L+' }
    ],
    imageUrl: '/bhuvaneshwari_kannada_flag.jpg',
    imageCaptionEn: 'Sri Ganesha Mahotsava Puja & Mahaprasada Distribution 2025',
    imageCaptionKn: '೨೦೨೫ ರ ಗಣೇಶೋತ್ಸವ ಮಹಾಪೂಜೆ ಮತ್ತು ಮಹಾಪ್ರಸಾದ'
  },
  {
    id: 'era-2026',
    yearRange: '2026',
    titleEn: 'Statehood Rajyotsava & Digital Platform',
    titleKn: 'ಕರ್ನಾಟಕ ರಾಜ್ಯೋತ್ಸವ ಮತ್ತು ಡಿಜಿಟಲ್ ಯುಗ',
    subtitleEn: 'Comprehensive Resident Portal & Cultural Heritage Revival',
    subtitleKn: 'ಪೂರ್ಣಪ್ರಮಾಣದ ನಿವಾಸಿ ಪೋರ್ಟಲ್ ಮತ್ತು ರಂಗೋತ್ಸವ',
    badge: 'Current Era',
    badgeKn: 'ಪ್ರಸ್ತುತ ಹಂತ',
    descriptionEn:
      'In 2026, Kannadigara Balaga expanded its digital footprint with a dedicated multi-user cloud portal, volunteer squad enrollment system, official membership program, and upcoming grand Karnataka Rajyotsava 2026 celebration featuring Dollu Kunitha and Yakshagana folk heritage.',
    descriptionKn:
      '೨೦೨೬ ರಲ್ಲಿ ನೂತನ ಡಿಜಿಟಲ್ ಪೋರ್ಟಲ್, ಸದಸ್ಯತ್ವ ವ್ಯವಸ್ಥೆ ಮತ್ತು ಕರ್ನಾಟಕ ರಾಜ್ಯೋತ್ಸವ ೨೦೨೬ ಆಚರಣೆಯೊಂದಿಗೆ ಡೊಳ್ಳು ಕುಣಿತ ಹಾಗೂ ಯಕ್ಷಗಾನ ಕಲಾ ತಂಡಗಳನ್ನು ಆಹ್ವಾನಿಸಲಾಗಿದೆ.',
    highlightsEn: [
      'Launched official online Membership Registration & Volunteer Squad Management.',
      'Scheduled 2-day Karnataka Rajyotsava 2026 featuring folk artists and literature symposium.',
      'Partnered with local health centers for free neighborhood wellness camps.'
    ],
    highlightsKn: [
      'ಅಧಿಕೃತ ಸದಸ್ಯತ್ವ ಹಾಗೂ ಸ್ವಯಂಸೇವಕರ ಡಿಜಿಟಲ್ ನೋಂದಣಿ ಪ್ರಾರಂಭ.',
      '೨ ದಿನಗಳ ವೈಭವೋಪೇತ ಕರ್ನಾಟಕ ರಾಜ್ಯೋತ್ಸವ ೨೦೨೬ ಸಾಂಸ್ಕೃತಿಕ ಉತ್ಸವ.',
      'ನಿವಾಸಿಗಳಿಗಾಗಿ ಉಚಿತ ಆರೋಗ್ಯ ತಪಾಸಣಾ ಶಿಬಿರ.'
    ],
    impactStats: [
      { labelEn: 'Active Members', labelKn: 'ಸಕ್ರಿಯ ಸದಸ್ಯರು', value: '250+' },
      { labelEn: 'Volunteer Squad', labelKn: 'ಸ್ವಯಂಸೇವಕರ ತಂಡ', value: '60+' },
      { labelEn: 'Annual Events', labelKn: 'ವಾರ್ಷಿಕ ಆಚರಣೆಗಳು', value: '6' }
    ],
    imageUrl: '/bhuvaneshwari_kannada_flag.jpg',
    imageCaptionEn: 'Karnataka Rajyotsava Flag Hoisting & Cultural Celebration 2026',
    imageCaptionKn: '೨೦೨೬ ರ ಕನ್ನಡ ರಾಜ್ಯೋತ್ಸವ ಧ್ವಜಾರೋಹಣ ಮತ್ತು ಸಂಭ್ರಮ'
  },
  {
    id: 'era-2027-2030',
    yearRange: '2027 – 2030',
    titleEn: 'Future Vision: Cultural Academy & Community Trust',
    titleKn: 'ಭವಿಷ್ಯದ ಮುನ್ನೋಟ: ಕನ್ನಡ ಅಕಾಡೆಮಿ ಮತ್ತು ಕಲ್ಯಾಣ ಟ್ರಸ್ಟ್',
    subtitleEn: 'Sustaining Kannada Heritage for Generations',
    subtitleKn: 'ಮುಂದಿನ ಪೀಳಿಗೆಗೆ ಸಿರಿಗನ್ನಡ ಪರಂಪರೆ',
    badge: 'Future Vision',
    badgeKn: 'ಭವಿಷ್ಯದ ಯೋಜನೆ',
    isVisionEra: true,
    descriptionEn:
      'Looking forward to 2027–2030, Eldorado Kannadigara Balaga envisions establishing a registered charitable community trust, weekend Kannada Kali learning classes for children, permanent sports tournaments, and a dedicated cultural library at Brigade El Dorado.',
    descriptionKn:
      '೨೦೨೭-೨೦೩೦ ಭವಿಷ್ಯದಲ್ಲಿ ಮಕ್ಕಳಿಗಾಗಿ ಕನ್ನಡ ಕಲಿ ತರಗತಿಗಳು, ಸಾಹಿತ್ಯ ಗ್ರಂಥಾಲಯ, ಸಮಾಜ ಕಲ್ಯಾಣ ಟ್ರಸ್ಟ್ ಹಾಗೂ ವಾರ್ಷಿಕ ಕ್ರೀಡೋತ್ಸವ ಸ್ಥಾಪನೆಯ ಗುರಿ.',
    highlightsEn: [
      'Establishment of Registered Eldorado Kannadigara Charitable Trust.',
      'Free weekend "Kannada Kali" classes for resident kids to learn reading & writing.',
      'Annual Kannada Sports Cup (Cricket, Badminton, Chess) for all age groups.',
      'Permanent community library & Kannada book archives in Aerospace Park.'
    ],
    highlightsKn: [
      'ನೊಂದಾಯಿತ ಕನ್ನಡಿಗರ ಸೇವಾ ಚಾರಿಟೇಬಲ್ ಟ್ರಸ್ಟ್ ಸ್ಥಾಪನೆ.',
      'ಮಕ್ಕಳಿಗಾಗಿ ಉಚಿತ ಶನಿವಾರ-ಭಾನುವಾರ "ಕನ್ನಡ ಕಲಿ" ಭಾಷಾ ತರಗತಿ.',
      'ವಾರ್ಷಿಕ ಕನ್ನಡಿಗರ ಕ್ರೀಡೋತ್ಸವ (ಕ್ರಿಕೆಟ್, ಬ್ಯಾಡ್ಮಿಂಟನ್, ಚೆಸ್).',
      'ನಿವಾಸಿಗಳಿಗಾಗಿ ಕನ್ನಡ ಪುಸ್ತಕ ಗ್ರಂಥಾಲಯ.'
    ],
    impactStats: [
      { labelEn: 'Target Families', labelKn: 'ಗುರಿ ಕುಟುಂಬಗಳು', value: '1,000+' },
      { labelEn: 'Kannada Kali Kids', labelKn: 'ಕನ್ನಡ ಕಲಿ ಮಕ್ಕಳು', value: '200+' },
      { labelEn: 'Charitable Trust', labelKn: 'ಕಲ್ಯಾಣ ನಿಧಿ', value: '100% Seva' }
    ],
    imageUrl: '/bhuvaneshwari_kannada_flag.jpg',
    imageCaptionEn: 'Vision 2030: Youth Learning & Cultural Excellence',
    imageCaptionKn: 'ಮುನ್ನೋಟ ೨೦೩೦: ಯುವ ಪೀಳಿಗೆಗೆ ಸಂಸ್ಕೃತಿ ತರಬೇತಿ'
  }
];

export const BalagaHistoryView: React.FC<BalagaHistoryViewProps> = ({
  isDark = false,
  lang = 'kn',
  onNavigateTab
}) => {
  const [selectedEraId, setSelectedEraId] = useState<string>('era-2024');
  const isKn = lang === 'kn';

  return (
    <div className="space-y-12 py-8 sm:py-12">
      {/* 1. HERO HEADER SECTION */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div
          className={`relative rounded-3xl p-6 sm:p-12 border-2 shadow-sm overflow-hidden text-center sm:text-left transition-all ${
            isDark
              ? 'bg-gradient-to-br from-stone-900 via-stone-900 to-red-950/40 border-stone-800'
              : 'bg-gradient-to-br from-white via-[#FFFDF7] to-amber-50/60 border-stone-200'
          }`}
        >
          <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none select-none flex items-center justify-end pr-6">
            <img
              src="/bhuvaneshwari_kannada_flag.jpg"
              alt="Kannada Heritage"
              className="h-96 w-auto object-contain rounded-2xl opacity-25"
            />
          </div>

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 bg-red-600 text-yellow-300 text-[11px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-xs border border-yellow-400">
              <Landmark className="w-3.5 h-3.5" />
              <span>{isKn ? 'ನಮ್ಮ ಇತಿಹಾಸ ಮತ್ತು ಬೆಳೆದು ಬಂದ ಹಾದಿ' : 'Our History & Heritage Journey'}</span>
            </div>

            <div>
              <h1
                className={`text-3xl sm:text-5xl lg:text-6xl font-serif font-black tracking-tight leading-tight ${
                  isDark ? 'text-stone-100' : 'text-stone-950'
                }`}
              >
                {isKn
                  ? 'ಕನ್ನಡಿಗರ ಬಳಗ: ನಮ್ಮ ಯಶೋಗಾಥೆ (೨೦೨೪ - ೨೦೩೦)'
                  : 'Eldorado Kannadigara Balaga: Our Journey (2024 – 2030)'}
              </h1>
              <span className="text-base sm:text-xl font-serif font-bold text-red-700 dark:text-red-400 block mt-2">
                {isKn
                  ? 'ಸ್ಥಾಪನೆಯಿಂದ ಇಂದಿನ ಭವ್ಯ ಆಚರಣೆಗಳವರೆಗೆ ಹಾಗೂ ಭವಿಷ್ಯದ ಮುನ್ನೋಟ'
                  : 'From Foundational Roots to Grand Celebrations & Vision 2030'}
              </span>
            </div>

            <p className={`text-sm sm:text-base leading-relaxed font-medium ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
              {isKn
                ? 'ಬ್ರಿಗೇಡ್ ಎಲ್ ಡೊರಾಡೊ ನಿವಾಸಿಗಳ ಒಕ್ಕೂಟವಾಗಿ ಪ್ರಾರಂಭವಾದ ಕನ್ನಡಿಗರ ಬಳಗವು ಇಂದು ಕನ್ನಡ ಭಾಷೆ, ಧಾರ್ಮಿಕ ಪೂಜೆಗಳು ಮತ್ತು ಸಮಾಜ ಸೇವೆಯಲ್ಲಿ ಮುಂಚೂಣಿಯಲ್ಲಿರುವ ಸಾಂಸ್ಕೃತಿಕ ಸಂಸ್ಥೆಯಾಗಿ ಬೆಳೆದಿದೆ.'
                : 'Founded by passionate resident families at Brigade El Dorado, Eldorado Kannadigara Balaga has grown from a humble neighborhood gathering into a pillar of cultural heritage, devotional seva, and social welfare.'}
            </p>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-stone-200 dark:border-stone-800">
              <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-center">
                <span className="text-2xl font-serif font-black text-red-700 dark:text-yellow-300">2024</span>
                <span className="text-[10px] font-bold text-stone-500 block uppercase mt-0.5">
                  {isKn ? 'ಸ್ಥಾಪಿತ ವರ್ಷ' : 'Established'}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-stone-800 border border-amber-200 dark:border-stone-700 text-center">
                <span className="text-2xl font-serif font-black text-red-700 dark:text-yellow-300">1,200+</span>
                <span className="text-[10px] font-bold text-stone-500 block uppercase mt-0.5">
                  {isKn ? 'ಸೇವಾರ್ಥಿ ಭಕ್ತರು' : 'Devotees Served'}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-center">
                <span className="text-2xl font-serif font-black text-red-700 dark:text-yellow-300">100%</span>
                <span className="text-[10px] font-bold text-stone-500 block uppercase mt-0.5">
                  {isKn ? 'ಪಾರದರ್ಶಕ ಲೆಕ್ಕ' : 'Transparent Audits'}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-stone-800 border border-amber-200 dark:border-stone-700 text-center">
                <span className="text-2xl font-serif font-black text-red-700 dark:text-yellow-300">2030</span>
                <span className="text-[10px] font-bold text-stone-500 block uppercase mt-0.5">
                  {isKn ? 'ಟ್ರಸ್ಟ್ ಮುನ್ನೋಟ' : 'Vision Goal'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. ERA QUICK JUMP NAV BAR (Modeled directly on Pact World's era navigation) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 sticky top-16 z-30">
        <div
          className={`p-2 sm:p-3 rounded-2xl border-2 shadow-md backdrop-blur-md transition-colors ${
            isDark ? 'bg-stone-900/95 border-stone-800' : 'bg-white/95 border-stone-200'
          }`}
        >
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
            {HISTORICAL_ERAS.map((era) => {
              const isActive = selectedEraId === era.id;
              return (
                <button
                  key={era.id}
                  onClick={() => {
                    setSelectedEraId(era.id);
                    const elem = document.getElementById(era.id);
                    if (elem) {
                      elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                    isActive
                      ? 'bg-red-600 text-yellow-300 shadow-md border border-yellow-400'
                      : isDark
                      ? 'bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-yellow-300'
                      : 'bg-stone-100 text-stone-800 hover:bg-amber-50 hover:text-red-700'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{era.yearRange}</span>
                  <span className="opacity-75 hidden sm:inline">• {isKn ? era.badgeKn : era.badge}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. HISTORICAL TIMELINE ERAS (Decade-by-Decade Flow) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
        <div className="relative border-l-4 border-red-600 dark:border-red-700 ml-4 sm:ml-8 pl-6 sm:pl-10 space-y-16">
          {HISTORICAL_ERAS.map((era) => {
            return (
              <div
                key={era.id}
                id={era.id}
                className="relative scroll-mt-36 group"
              >
                {/* Timeline Era Dot Node */}
                <div className="absolute -left-[35px] sm:-left-[51px] top-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-600 text-yellow-300 border-4 border-white dark:border-stone-950 flex items-center justify-center font-bold shadow-md group-hover:scale-110 transition-transform">
                  {era.isVisionEra ? <Star className="w-4 h-4 fill-yellow-300" /> : <Clock className="w-4 h-4" />}
                </div>

                {/* Main Era Card Container */}
                <div
                  className={`p-6 sm:p-10 rounded-3xl border-2 space-y-8 shadow-sm transition-all ${
                    isDark
                      ? 'bg-stone-900 border-stone-800 hover:border-stone-700'
                      : 'bg-white border-stone-200 hover:border-amber-300'
                  }`}
                >
                  {/* Era Header Banner */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-wider bg-red-600 text-yellow-300 px-3 py-1 rounded-full border border-yellow-400">
                          {era.yearRange}
                        </span>
                        <span className="text-xs font-bold bg-amber-400/20 text-amber-800 dark:text-yellow-400 px-3 py-1 rounded-full border border-amber-400/40">
                          {isKn ? era.badgeKn : era.badge}
                        </span>
                      </div>

                      <h2 className="text-2xl sm:text-3xl font-serif font-black text-stone-900 dark:text-stone-100 pt-1">
                        {isKn ? era.titleKn : era.titleEn}
                      </h2>
                      <span className="text-xs sm:text-sm font-serif font-bold text-amber-700 dark:text-yellow-400 block">
                        {isKn ? era.subtitleKn : era.subtitleEn}
                      </span>
                    </div>

                    {/* Impact Quick Callout */}
                    <div className="flex items-center gap-2 shrink-0 overflow-x-auto">
                      {era.impactStats.map((st, sIdx) => (
                        <div
                          key={sIdx}
                          className="px-3.5 py-2 rounded-2xl bg-amber-50 dark:bg-stone-800 border border-amber-200 dark:border-stone-700 text-center"
                        >
                          <span className="text-base font-serif font-black text-red-700 dark:text-yellow-300 block">
                            {st.value}
                          </span>
                          <span className="text-[10px] font-bold text-stone-500 uppercase block whitespace-nowrap">
                            {isKn ? st.labelKn : st.labelEn}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Two-Column Grid: Narrative Story & Image Frame */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    {/* Left Narrative Block */}
                    <div className="lg:col-span-7 space-y-6">
                      <p className={`text-sm sm:text-base leading-relaxed font-medium ${isDark ? 'text-stone-200' : 'text-stone-800'}`}>
                        {isKn ? era.descriptionKn : era.descriptionEn}
                      </p>

                      {/* Key Milestones List */}
                      <div className="space-y-3 pt-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-yellow-400 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{isKn ? 'ಪ್ರಮುಖ ಮೈಲಿಗಲ್ಲುಗಳು & ಸಾಧನೆಗಳು' : 'Key Historical Milestones'}</span>
                        </h4>

                        <ul className="space-y-2.5">
                          {(isKn ? era.highlightsKn : era.highlightsEn).map((item, hIdx) => (
                            <li key={hIdx} className="flex items-start gap-3 text-xs sm:text-sm font-semibold">
                              <span className="w-2 h-2 rounded-full bg-red-600 shrink-0 mt-1.5" />
                              <span className={isDark ? 'text-stone-200' : 'text-stone-700'}>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Right Archival Photo Frame */}
                    <div className="lg:col-span-5 space-y-2">
                      <div className="rounded-2xl border-2 border-amber-400/50 overflow-hidden shadow-md aspect-[4/3] bg-stone-900 group-hover:shadow-xl transition-shadow">
                        <img
                          src={era.imageUrl}
                          alt={era.titleEn}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <span className="text-[11px] font-medium text-stone-500 italic block text-center">
                        📸 {isKn ? era.imageCaptionKn : era.imageCaptionEn}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. SOCIO-CULTURAL INITIATIVES & IMPACT (Adapted from aarohansocio.com) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div
          className={`p-8 sm:p-12 rounded-3xl border-2 space-y-8 shadow-sm ${
            isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
          }`}
        >
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-2 bg-red-600 text-yellow-300 text-[11px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full border border-yellow-400">
              <Heart className="w-3.5 h-3.5" />
              <span>{isKn ? 'ಸಾಮಾಜಿಕ ಕಾರ್ಯಗಳು & ಸೇವೆ' : 'Socio-Cultural Initiatives & Service'}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-serif font-black text-stone-900 dark:text-stone-100">
              {isKn ? 'ನಮ್ಮ ಸಾಮಾಜಿಕ ಹೊಣೆಗಾರಿಕೆಗಳು' : 'Serving Our Neighborhood & Society'}
            </h2>
            <p className="text-xs sm:text-sm text-stone-500">
              {isKn
                ? 'ಉತ್ಸವಗಳ ಜೊತೆಗೆ ರಕ್ತದಾನ, ಸಸಿ ನೆಡುವಿಕೆ ಹಾಗೂ ಸರ್ಕಾರಿ ಶಾಲೆಗಳಿಗೆ ನೆರವು ನೀಡುವ ನಿರಂತರ ಕಾರ್ಯಕ್ರಮಗಳು.'
                : 'Inspired by premier socio-cultural forums, Eldorado Kannadigara Balaga organizes year-round community welfare initiatives.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Flame,
                titleEn: 'Anna Santharpane & Prasadam',
                titleKn: 'ಅನ್ನ ಸಂತರ್ಪಣೆ ಮಹಾಪ್ರಸಾದ',
                descEn: 'Serving hot, hygienic traditional Karnataka prasadam meals to 1,200+ devotees during Ganeshotsava & Rajyotsava.',
                descKn: 'ಗಣೇಶೋತ್ಸವ ಮತ್ತು ರಾಜ್ಯೋತ್ಸವದ ಸಂದರ್ಭದಲ್ಲಿ ನಿವಾಸಿಗಳಿಗೆ ಹಾಗೂ ಸಾರ್ವಜನಿಕರಿಗೆ ಶುಚಿ-ರುಚಿಯಾದ ಮಹಾಪ್ರಸಾದ.'
              },
              {
                icon: Heart,
                titleEn: 'Blood Donation & Health Camps',
                titleKn: 'ರಕ್ತದಾನ ಶಿಬಿರ ಹಾಗೂ ಆರೋಗ್ಯ ಸೇವೆ',
                descEn: 'Partnering with Rashtrotthana Blood Centre and local hospitals for annual voluntary donation drives.',
                descKn: 'ರಾಷ್ಟ್ರೋತ್ಥಾನ ರಕ್ತನಿಧಿ ಕೇಂದ್ರದ ಸಹಯೋಗದೊಂದಿಗೆ ರಕ್ತದಾನ ಶಿಬಿರ ಮತ್ತು ನಿವಾಸಿಗಳ ಆರೋಗ್ಯ ಪರಿಶೀಲನೆ.'
              },
              {
                icon: Award,
                titleEn: 'Government School Support',
                titleKn: 'ಸರ್ಕಾರಿ ಶಾಲೆ ಮಕ್ಕಳಿಗೆ ನೆರವು',
                descEn: 'Distributing notebooks, stationery kits, and sports equipment to neighboring government primary schools.',
                descKn: 'ಏರೋಸ್ಪೇಸ್ ಪಾರ್ಕ್ ಸರಹದ್ದಿನ ಸರ್ಕಾರಿ ಪ್ರಾಥಮಿಕ ಶಾಲೆಯ ಮಕ್ಕಳಿಗೆ ಉಚಿತ ಪುಸ್ತಕ ಮತ್ತು ಕ್ರೀಡಾ ಸಾಮಗ್ರಿ ವಿತರಣೆ.'
              }
            ].map((card, cIdx) => (
              <div
                key={cIdx}
                className={`p-6 rounded-2xl border-2 space-y-3 ${
                  isDark ? 'bg-stone-850 border-stone-800' : 'bg-amber-50/50 border-amber-200/80'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-red-600 text-yellow-300 flex items-center justify-center border border-yellow-400">
                  <card.icon className="w-5 h-5" />
                </div>
                <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">
                  {isKn ? card.titleKn : card.titleEn}
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  {isKn ? card.descKn : card.descEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. CALL TO JOIN & REGISTER */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-red-600 via-red-600 to-amber-600 text-yellow-300 border-2 border-yellow-400 shadow-xl space-y-6">
          <div className="space-y-2 max-w-2xl mx-auto">
            <h3 className="text-2xl sm:text-4xl font-serif font-black text-white">
              {isKn ? 'ನಮ್ಮ ಬಳಗದ ಭಾಗವಾಗಿ – ಇತಿಹಾಸ ನಿರ್ಮಿಸಿ!' : 'Become Part of Our Living History'}
            </h3>
            <p className="text-xs sm:text-sm text-yellow-100 font-medium">
              {isKn
                ? 'ಬ್ರಿಗೇಡ್ ಎಲ್ ಡೊರಾಡೊ ಪ್ರತಿಯೊಂದು ಕನ್ನಡ ಕುಟುಂಬಕ್ಕೂ ಮುಕ್ತ ಆಹ್ವಾನ. ಇಂದೇ ಸದಸ್ಯರಾಗಿ ನೋಂದಾಯಿಸಿ.'
                : 'Join Eldorado Kannadigara Balaga today to contribute your ideas, volunteer for upcoming festivals, and strengthen our neighborhood unity.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => onNavigateTab && onNavigateTab('membership')}
              className="px-6 py-3.5 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-stone-950 font-black text-xs sm:text-sm shadow-md transition-transform hover:scale-105 cursor-pointer inline-flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              <span>{isKn ? 'ಸದಸ್ಯತ್ವ ಪಡೆಯಿರಿ 📌' : 'Register for Membership 📌'}</span>
            </button>

            <button
              onClick={() => onNavigateTab && onNavigateTab('contact')}
              className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/40 font-bold text-xs sm:text-sm transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <Globe className="w-4 h-4" />
              <span>{isKn ? 'ಸಂಪರ್ಕಿಸಿ' : 'Contact Committee'}</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
