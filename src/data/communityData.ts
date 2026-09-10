export interface CommunityEvent {
  id: string;
  slug: string;
  title: string;
  kannadaTitle: string;
  festival: 'Ganesha Chaturthi' | 'Karnataka Rajyotsava' | 'Deepavali' | 'Makara Sankranti' | 'Ugadi';
  theme: string;
  startDate: string;
  endDate: string;
  dateDisplay: string;
  venue: string;
  status: 'upcoming' | 'ongoing' | 'archived';
  volunteersCount: number;
  actsCount: number;
  description: string;
  detailsOverview: string;
  posterImage?: string;
  year: number;
}

export interface CommitteeMember {
  name: string;
  role: string;
  initials: string;
  category: 'core' | 'support';
}

export interface AnnouncementItem {
  id: string;
  title: string;
  kannadaTitle?: string;
  date: string;
  category: 'event' | 'finance' | 'volunteer' | 'cultural';
  summary: string;
  content: string;
  closingSignature?: string;
  important?: boolean;
}

export interface GalleryPhoto {
  id: string;
  title: string;
  celebration: string;
  year: number;
  tag: string;
  imageUrl: string;
  caption?: string;
  performanceType?: string;
}

export interface ArchiveRecord {
  year: number;
  title?: string;
  milestoneTag?: string;
  celebrationsCount: number;
  celebrations: {
    name: string;
    kannadaName?: string;
    festival: string;
    dates: string;
    venue: string;
    description: string;
    volunteersCount: number;
    contributorsCount: number;
    amountAccounted?: string;
  }[];
}

export interface FAQItem {
  question: string;
  answer: string;
}

export const COMMUNITY_EVENTS: CommunityEvent[] = [
  {
    id: 'ganesh-chaturthi-2026',
    slug: 'ganesha-chaturthi-2026',
    title: 'Ganesha Chaturthi 2026',
    kannadaTitle: 'ಶ್ರೀ ವಿನಾಯಕ ಚತುರ್ಥಿ ಮಹೋತ್ಸವ ೨೦೨೬',
    festival: 'Ganesha Chaturthi',
    theme: 'ಭಕ್ತಿ, ಸಮೃದ್ಧಿ ಮತ್ತು ಕನ್ನಡಿಗರ ಒಗ್ಗಟ್ಟು — Devotion, Prosperity & Balaga Unity',
    startDate: '2026-09-13',
    endDate: '2026-09-18',
    dateDisplay: '13th to 18th of this month',
    venue: 'Clubhouse Grand Arena, Brigade El Dorado',
    status: 'ongoing',
    volunteersCount: 45,
    actsCount: 12,
    year: 2026,
    posterImage: 'https://images.unsplash.com/photo-1567591370504-20a2e7c4f4a3?auto=format&fit=crop&w=1200&q=80',
    description:
      'Grand 5-day Sri Ganesha Chaturthi celebration by Eldorado Kannadigara Balaga with Vedic poojas, daily devotee sevas, cultural evenings, community Mahaprasada, and eco-friendly Visarjana.',
    detailsOverview:
      'Running from the 13th to the 18th of this month at the Clubhouse Grand Arena, bringing together all residents of Brigade El Dorado with 45 active volunteers and 12 registered cultural performances, daily Anna Santharpane, and sacred rituals.'
  },
  {
    id: 'rajyotsava-2026',
    slug: 'rajyotsava-2026',
    title: 'Karnataka Rajyotsava 2026',
    kannadaTitle: 'ಕನ್ನಡ ರಾಜ್ಯೋತ್ಸವ ೨೦೨೬',
    festival: 'Karnataka Rajyotsava',
    theme: 'ಸಿರಿಗನ್ನಡಂ ಗೆಲ್ಗೆ, ಸಿರಿಗನ್ನಡಂ ಬಾಳ್ಗೆ — Kannada Siri Sampada & Cultural Pride',
    startDate: '2026-11-01',
    endDate: '2026-11-01',
    dateDisplay: 'November 1, 2026',
    venue: 'Central Amphitheatre, Brigade El Dorado',
    status: 'upcoming',
    volunteersCount: 38,
    actsCount: 18,
    year: 2026,
    posterImage: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&w=1200&q=80',
    description:
      'Celebration of Karnataka statehood day with red-and-yellow Karnataka flag hoisting, Naadageethe "Jaya Bharatha Jananiya Tanujathe", Dollu Kunitha folk arts, Kannada poetry recitations, and traditional festive delights.',
    detailsOverview:
      'Join us in honoring Karnataka’s glorious cultural tapestry, Kannada language, literature, and folklore. Features an all-ages cultural lineup, authentic Karnataka cuisine stalls, and honoring local achievers.'
  },
  {
    id: 'rajyotsava-2025',
    slug: 'rajyotsava-2025',
    title: 'Karnataka Rajyotsava 2025',
    kannadaTitle: 'ಕನ್ನಡ ರಾಜ್ಯೋತ್ಸವ ೨೦೨೫',
    festival: 'Karnataka Rajyotsava',
    theme: 'ಕನ್ನಡ ಡಿಂಡಿಮ — Unity, Language & Folk Heritage',
    startDate: '2025-11-01',
    endDate: '2025-11-01',
    dateDisplay: '01 Nov 2025',
    venue: 'Central Amphitheatre, Brigade El Dorado',
    status: 'archived',
    volunteersCount: 32,
    actsCount: 16,
    year: 2025,
    posterImage: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&w=1200&q=80',
    description:
      'Celebrated with grand Karnataka flag hoisting, Naadageethe, 16 cultural performances by children and families, and Mysore Pak distribution.',
    detailsOverview:
      'Over 500 residents gathered in traditional red-and-yellow attire to honor Kannada pride and statehood.'
  },
  {
    id: 'ganeshotsava-2025',
    slug: 'ganeshotsava-2025',
    title: 'Ganesha Chaturthi 2025',
    kannadaTitle: 'ಶ್ರೀ ವಿನಾಯಕ ಚತುರ್ಥಿ ಮಹೋತ್ಸವ ೨೦೨೫',
    festival: 'Ganesha Chaturthi',
    theme: 'ವಿನಾಯಕನ ಕೃಪೆ — 5 Days of Devotion & Cultural Splendor',
    startDate: '2025-08-27',
    endDate: '2025-08-31',
    dateDisplay: '27 Aug 2025 – 31 Aug 2025',
    venue: 'Party Hall-1, Clubhouse',
    status: 'archived',
    volunteersCount: 45,
    actsCount: 22,
    year: 2025,
    posterImage: 'https://images.unsplash.com/photo-1567591370504-20a2e7c4f4a3?auto=format&fit=crop&w=1200&q=80',
    description:
      '5-day grand festival with clay idol, daily Atharvashirsha chantings, cultural dance and vocal performances, and community Mahaprasada for 1,200+ residents.',
    detailsOverview:
      'A deeply memorable festival that set the standard for transparent community coordination and festive devotion.'
  },
  {
    id: 'rajyotsava-2024',
    slug: 'rajyotsava-2024',
    title: 'Karnataka Rajyotsava 2024',
    kannadaTitle: 'ಕನ್ನಡ ರಾಜ್ಯೋತ್ಸವ ೨೦೨೪',
    festival: 'Karnataka Rajyotsava',
    theme: 'ಹೊಸ ಚಿಗುರು — Inaugural Balaga Gathering',
    startDate: '2024-11-01',
    endDate: '2024-11-01',
    dateDisplay: '01 Nov 2024',
    venue: 'Clubhouse Lawn, Brigade El Dorado',
    status: 'archived',
    volunteersCount: 24,
    actsCount: 12,
    year: 2024,
    posterImage: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&w=1200&q=80',
    description:
      'Inaugural Karnataka Rajyotsava celebration of Eldorado Kannadigara Balaga with flag hoisting, folk songs, Kannada quiz, and cultural evening.',
    detailsOverview:
      'The foundational gathering where our community formed the core Balaga brotherhood.'
  },
  {
    id: 'ganeshotsava-2024',
    slug: 'ganeshotsava-2024',
    title: 'Ganesha Chaturthi 2024',
    kannadaTitle: 'ಶ್ರೀ ವಿನಾಯಕ ಚತುರ್ಥಿ ಮಹೋತ್ಸವ ೨೦೨೪',
    festival: 'Ganesha Chaturthi',
    theme: 'ಮೊದಲ ಹೆಜ್ಜೆ — Inaugural Ganeshotsava at Eldorado',
    startDate: '2024-09-07',
    endDate: '2024-09-11',
    dateDisplay: '07 Sep 2024 – 11 Sep 2024',
    venue: 'Party Hall-1, Brigade El Dorado',
    status: 'archived',
    volunteersCount: 38,
    actsCount: 15,
    year: 2024,
    posterImage: 'https://images.unsplash.com/photo-1567591370504-20a2e7c4f4a3?auto=format&fit=crop&w=1200&q=80',
    description:
      'First historic 5-day Sri Ganesha Chaturthi celebration by Eldorado Kannadigara Balaga residents, creating an annual tradition of devotional unity.',
    detailsOverview:
      'A vibrant start that welcomed hundreds of families to participate and volunteer together.'
  }
];

export const COMMITTEE_MEMBERS: CommitteeMember[] = [
  { name: 'Sachin Desai', role: 'President & Balaga Coordinator', initials: 'SD', category: 'core' },
  { name: 'Ravi Shekhar', role: 'Vice President & Advisory', initials: 'RS', category: 'core' },
  { name: 'Vinay Pathak', role: 'General Secretary', initials: 'VP', category: 'core' },
  { name: 'Rahul Raj', role: 'Treasurer & Accounts', initials: 'RR', category: 'core' },
  { name: 'Aman Gupta', role: 'Cultural Programs Head', initials: 'AG', category: 'core' },
  { name: 'Kunal Singh', role: 'Joint Secretary', initials: 'KS', category: 'core' },
  { name: 'Surbhi Saini', role: 'Volunteers & Hospitality Lead', initials: 'SS', category: 'core' },
  { name: 'Ajay Rathore', role: 'Pooja & Prasadam Coordination', initials: 'AR', category: 'core' },
  { name: 'K K Dey', role: 'Stage & Logistics Member', initials: 'KK', category: 'core' },
  { name: 'Pankaj Kumar Roy', role: 'Auditing & Operations Member', initials: 'PK', category: 'core' }
];

export const ANNOUNCEMENTS: AnnouncementItem[] = [
  {
    id: 'ann-eco-prasad',
    title: 'Ganesha Chaturthi Prasada Distribution & Eco-Friendly Idol Guidelines',
    kannadaTitle: 'ಗಣೇಶ ಚತುರ್ಥಿ ಪ್ರಸಾದ ವಿನಿಯೋಗ ಮತ್ತು ಮಣ್ಣಿನ ಗಣಪತಿಯ ಪರಿಸರ ಮಾರ್ಗಸೂಚಿಗಳು',
    date: '10 Sep 2026',
    category: 'event',
    important: true,
    summary: 'Detailed schedule for daily Anna Santharpane / Mahaprasada and strict adherence to 100% clay and natural-colored Ganesha idols.',
    content: `🌺🐘 ಶ್ರೀ ವಿನಾಯಕ ಪ್ರಸನ್ನ 🐘🌺

Dear Residents & Devotees,
As we celebrate Ganesha Chaturthi 2026 (13th to 18th of this month), Kannadigara Balaga is delighted to share the operational updates:

1. 🍲 Mahaprasada (Anna Santharpane):
Daily sacred noon and evening prasadam will be served on banana leaves in the Clubhouse Dining Hall. All resident families and guests are warmly invited.

2. 🌿 100% Eco-Friendly Clay Idol:
In keeping with our commitment to Mother Earth and Karnataka's sustainable traditions, our community idol is handcrafted from pure natural clay with organic turmeric and vegetable dyes. Devotees carrying individual idols for visarjana are requested to avoid plaster of Paris (PoP).

3. ⏰ Daily Pooja Times:
• Morning Ganahoma & Alankara: 08:30 AM
• Morning Mangalarathi & Teertha: 12:30 PM
• Evening Bhajans & Cultural Acts: 06:30 PM
• Evening Mahamangalarathi: 08:45 PM`,
    closingSignature: '— Kannadigara Balaga Committee'
  },
  {
    id: 'ann-visarjana-planning',
    title: 'Grand Ganesha Visarjana & Cultural Night Planning',
    kannadaTitle: 'ಭವ್ಯ ಗಣೇಶ ವಿಸರ್ಜನೆ ಹಾಗೂ ಸಾಂಸ್ಕೃತಿಕ ಸಂಜೆ ಸಿದ್ಧತೆಗಳು',
    date: '09 Sep 2026',
    category: 'cultural',
    important: true,
    summary: 'Complete itinerary for the grand immersion procession with traditional Nashik Dhol, folk troupes, and evening stage show.',
    content: `🚩 ಸಿರಿಗನ್ನಡಂ ಗೆಲ್ಗೆ!
The countdown has begun for the concluding grand Visarjana!
• Visarjana Procession starts from Clubhouse Grand Arena at 04:30 PM.
• Traditional Nashik Dhol & Dollu Kunitha folk artists will lead the devotion.
• Eco-friendly immersion in specially prepared clean water tanks on campus.
• Followed by the grand finale Cultural Night featuring resident music, comedy skit, and prizes distribution.`,
    closingSignature: '— Kannadigara Balaga Committee'
  },
  {
    id: 'ann-rajyotsava-nominations',
    title: 'Karnataka Rajyotsava 2026 – Cultural Act Nominations & Volunteer Signups Open',
    kannadaTitle: 'ಕನ್ನಡ ರಾಜ್ಯೋತ್ಸವ ೨೦೨೬ – ಸಾಂಸ್ಕೃತಿಕ ಪ್ರದರ್ಶನ ಮತ್ತು ಸ್ವಯಂಸೇವಕರ ನೋಂದಣಿ',
    date: '08 Sep 2026',
    category: 'cultural',
    important: false,
    summary: 'Calling all children and adult residents for Kannada folk dance, classical music, and theatre on 01 Nov 2026.',
    content: `ಸಿರಿಗನ್ನಡಂ ಗೆಲ್ಗೆ! ಸಿರಿಗನ್ನಡಂ ಬಾಳ್ಗೆ! 🚩💛
On November 1, 2026, Kannadigara Balaga will host our grand annual Karnataka Rajyotsava at the Central Amphitheatre.
We invite children, youth, and adults to perform Kannada songs, Bhavageethe, Yakshagana, Dollu Kunitha, and folk dances.
Please sign in with your Gmail to submit your nomination and volunteer preferences.`,
    closingSignature: '— Kannadigara Balaga Committee'
  },
  {
    id: 'ann-volunteer-portal',
    title: 'Volunteer Portal Active – Gmail Login Required to Join Teams',
    kannadaTitle: 'ಸ್ವಯಂಸೇವಕರ ಪೋರ್ಟಲ್ ಸಕ್ರಿಯ – ಜಿಮೇಲ್ ಲಾಗಿನ್ ಮೂಲಕ ನೋಂದಾಯಿಸಿ',
    date: '05 Sep 2026',
    category: 'volunteer',
    important: false,
    summary: 'Sign in with your Gmail account to enroll in Pooja, Stage, Cultural, Prasadam, or Hospitality volunteer teams.',
    content: `Every celebration is driven by the heart and energy of resident volunteers!
To ensure smooth coordination and verify resident identity under our community rules, please Sign in with your Gmail account to choose your volunteer team and join the official WhatsApp coordination group.`,
    closingSignature: '— Kannadigara Balaga Committee'
  },
  {
    id: 'ann-finance-transparency',
    title: 'Transparent Devotee Receipts & Audited Accounts',
    kannadaTitle: 'ಪಾರದರ್ಶಕ ಭಕ್ತರ ರಸೀದಿಗಳು ಮತ್ತು ಲೆಕ್ಕಪತ್ರಗಳು',
    date: '02 Sep 2026',
    category: 'finance',
    important: false,
    summary: 'Every rupee collected and spent is documented. Devotees can search and download their receipts at /receipts.',
    content: `In line with our core Balaga pledge: all voluntary devotee contributions and expense vouchers are digitally recorded. Devotees can instantly search and download their official digital receipts using their Flat number or Contributor name at any time from the Devotee Receipts portal.`,
    closingSignature: '— Kannadigara Balaga Committee'
  }
];

export const GALLERY_PHOTOS: GalleryPhoto[] = [
  {
    id: 'g1',
    title: 'Sri Ganesha Maha Pooja & Floral Alankara',
    celebration: 'Ganesha Chaturthi 2025',
    year: 2025,
    tag: 'Ganesha Chaturthi',
    performanceType: 'Vedic Ritual & Alankara',
    imageUrl: 'https://images.unsplash.com/photo-1567591370504-20a2e7c4f4a3?auto=format&fit=crop&w=800&q=80',
    caption: 'Divine floral decorations and sacred clay idol during morning Atharvashirsha chanting at Party Hall-1.'
  },
  {
    id: 'g2',
    title: 'Karnataka Flag Hoisting & Naadageethe',
    celebration: 'Karnataka Rajyotsava 2025',
    year: 2025,
    tag: 'Karnataka Rajyotsava',
    performanceType: 'Flag Hoisting & Anthem',
    imageUrl: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&w=800&q=80',
    caption: 'Residents waving red-and-yellow Karnataka flags singing "Jaya Bharatha Jananiya Tanujathe" at Central Amphitheatre.'
  },
  {
    id: 'g3',
    title: 'Children Folk Dance in Traditional Attire',
    celebration: 'Karnataka Rajyotsava 2025',
    year: 2025,
    tag: 'Karnataka Rajyotsava',
    performanceType: 'Janapada Folk Dance',
    imageUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80',
    caption: 'Children presenting an energetic Janapada folk dance in vibrant traditional Karnataka costumes.'
  },
  {
    id: 'g4',
    title: 'Community Mahaprasada Seva by Volunteers',
    celebration: 'Ganesha Chaturthi 2025',
    year: 2025,
    tag: 'Ganesha Chaturthi',
    performanceType: 'Anna Santharpane Seva',
    imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',
    caption: 'Dedicated volunteers serving hot sweet modakas, puliyogare, and payasa to over 1,200 residents.'
  },
  {
    id: 'g5',
    title: 'Ganesha Visarjana Procession with Dhol',
    celebration: 'Ganesha Chaturthi 2024',
    year: 2024,
    tag: 'Ganesha Chaturthi',
    performanceType: 'Procession & Dhol',
    imageUrl: 'https://images.unsplash.com/photo-1576097449798-7c7f90e1248a?auto=format&fit=crop&w=800&q=80',
    caption: 'Joyful immersion procession accompanied by festive music and chants of "Ganapati Bappa Morya".'
  },
  {
    id: 'g6',
    title: 'Kannada Literature & Poetry Evening',
    celebration: 'Karnataka Rajyotsava 2024',
    year: 2024,
    tag: 'Karnataka Rajyotsava',
    performanceType: 'Kavya Sandhya & Recitation',
    imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
    caption: 'Eldorado resident poets sharing original Kannada vachanas, poems, and cultural experiences.'
  },
  {
    id: 'g7',
    title: 'Deepavali 1,000 Diya Lighting Walkway',
    celebration: 'Deepavali Deepotsava 2025',
    year: 2025,
    tag: 'Deepavali',
    performanceType: 'Deepotsava Ritual',
    imageUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80',
    caption: 'Dazzling clay lamps illuminating the lakeview walkway with families celebrating together.'
  },
  {
    id: 'g8',
    title: 'Foundational Balaga Meeting at Eldorado',
    celebration: 'Ganesha Chaturthi 2024',
    year: 2024,
    tag: 'Ganesha Chaturthi',
    performanceType: 'Balaga Working Group',
    imageUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80',
    caption: 'The founding resident committee planning the inaugural 2024 celebration.'
  },
  {
    id: 'g9',
    title: 'Grand Stage Alankara 2026 Preparations',
    celebration: 'Ganesha Chaturthi 2026',
    year: 2026,
    tag: 'Ganesha Chaturthi',
    performanceType: 'Arena Alankara',
    imageUrl: 'https://images.unsplash.com/photo-1567591370504-20a2e7c4f4a3?auto=format&fit=crop&w=800&q=80',
    caption: 'Clubhouse Grand Arena decorated with traditional banana stems and festive brass lamps for 2026.'
  }
];

export const ARCHIVE_RECORDS: ArchiveRecord[] = [
  {
    year: 2026,
    title: 'Ongoing 3rd Year',
    milestoneTag: 'Ongoing 3rd Year • Celebrating Since 2024',
    celebrationsCount: 2,
    celebrations: [
      {
        name: 'Ganesha Chaturthi 2026',
        kannadaName: 'ಶ್ರೀ ವಿನಾಯಕ ಚತುರ್ಥಿ ಮಹೋತ್ಸವ ೨೦೨೬',
        festival: 'Ganesha Chaturthi',
        dates: '13th to 18th of this month',
        venue: 'Clubhouse Grand Arena, Brigade El Dorado',
        description:
          'Flagship 5-day Ganesha celebration with daily Anna Santharpane, Atharvashirsha parayana, evening cultural programs, and eco-friendly clay idol.',
        volunteersCount: 45,
        contributorsCount: 350,
        amountAccounted: 'Live in Ledger'
      },
      {
        name: 'Karnataka Rajyotsava 2026',
        kannadaName: 'ಕನ್ನಡ ರಾಜ್ಯೋತ್ಸವ ೨೦೨೬',
        festival: 'Karnataka Rajyotsava',
        dates: '01 Nov 2026',
        venue: 'Central Amphitheatre, Brigade El Dorado',
        description:
          'Upcoming grand statehood celebration with Karnataka flag hoisting, Naadageethe, Dollu Kunitha folk dance, and cultural stage acts.',
        volunteersCount: 38,
        contributorsCount: 280,
        amountAccounted: 'Budget Planned'
      }
    ]
  },
  {
    year: 2025,
    title: '2 Celebrations Successfully Hosted',
    milestoneTag: '2 Celebrations Successfully Hosted',
    celebrationsCount: 2,
    celebrations: [
      {
        name: 'Karnataka Rajyotsava 2025',
        kannadaName: 'ಕನ್ನಡ ರಾಜ್ಯೋತ್ಸವ ೨೦೨೫',
        festival: 'Karnataka Rajyotsava',
        dates: '01 Nov 2025',
        venue: 'Central Amphitheatre, Brigade El Dorado',
        description:
          'Grand statehood day celebration with red-and-yellow Karnataka flag hoisting, singing of Naadageethe, 16 cultural stage acts by children and families, and Mysore Pak distribution.',
        volunteersCount: 32,
        contributorsCount: 220,
        amountAccounted: '₹1,65,000'
      },
      {
        name: 'Ganesha Chaturthi 2025',
        kannadaName: 'ಶ್ರೀ ವಿನಾಯಕ ಚತುರ್ಥಿ ಮಹೋತ್ಸವ ೨೦೨೫',
        festival: 'Ganesha Chaturthi',
        dates: '27 Aug 2025 – 31 Aug 2025',
        venue: 'Party Hall-1, Clubhouse',
        description:
          '5-day grand festival with clay idol, daily Atharvashirsha chantings, cultural dance and vocal performances, and community Mahaprasada for 1,200+ residents.',
        volunteersCount: 45,
        contributorsCount: 310,
        amountAccounted: '₹4,25,000'
      }
    ]
  },
  {
    year: 2024,
    title: 'Inaugural Year',
    milestoneTag: 'Inaugural Year • Formation of Balaga',
    celebrationsCount: 2,
    celebrations: [
      {
        name: 'Karnataka Rajyotsava 2024',
        kannadaName: 'ಕನ್ನಡ ರಾಜ್ಯೋತ್ಸವ ೨೦೨೪',
        festival: 'Karnataka Rajyotsava',
        dates: '01 Nov 2024',
        venue: 'Clubhouse Lawn, Brigade El Dorado',
        description:
          'Inaugural Karnataka Rajyotsava celebration of Eldorado Kannadigara Balaga with flag hoisting, folk songs, Kannada quiz, and cultural evening.',
        volunteersCount: 24,
        contributorsCount: 150,
        amountAccounted: '₹95,000'
      },
      {
        name: 'Ganesha Chaturthi 2024',
        kannadaName: 'ಶ್ರೀ ವಿನಾಯಕ ಚತುರ್ಥಿ ಮಹೋತ್ಸವ ೨೦೨೪',
        festival: 'Ganesha Chaturthi',
        dates: '07 Sep 2024 – 11 Sep 2024',
        venue: 'Party Hall-1, Brigade El Dorado',
        description:
          'First historic 5-day Sri Ganesha Chaturthi celebration by Eldorado Kannadigara Balaga residents, creating an annual tradition of devotional unity.',
        volunteersCount: 38,
        contributorsCount: 240,
        amountAccounted: '₹3,60,000'
      }
    ]
  }
];

export const GANESHA_FAQS: FAQItem[] = [
  {
    question: 'What are the daily Pooja and Anna Santharpane timings?',
    answer:
      'Morning Ganahoma and Sankalpa begins at 08:30 AM, followed by Morning Mahamangalarathi and Anna Santharpane (Mahaprasada) from 12:30 PM to 02:30 PM. Evening Bhajans & cultural events run from 06:30 PM to 08:30 PM, concluding with Evening Mahamangalarathi and prasadam distribution at 08:45 PM.'
  },
  {
    question: 'How do our eco-friendly clay idol principles work?',
    answer:
      'We follow 100% eco-friendly clay principles. Our sacred idol is crafted from unbaked natural clay and natural mineral pigments that dissolve naturally without harming soil or water. Chemical paints, plaster of Paris (PoP), and plastic decorations are strictly prohibited across all ritual spaces.'
  },
  {
    question: 'What is the schedule for evening cultural stage performances?',
    answer:
      'Every evening from 06:30 PM to 08:30 PM at the Clubhouse Grand Arena, resident children and families showcase classical dances (Bharatanatyam, Kathak), devotional vocal recitals, Kannada drama skits, sloka chanting, and instrumental music.'
  },
  {
    question: 'What are the volunteering clusters and how can residents join?',
    answer:
      'Volunteering clusters include: 1) Pooja & Rituals, 2) Stage & Technical Setup, 3) Cultural Coordination, 4) Anna Santharpane (Prasadam serving), 5) Resident Hospitality & Crowd Guidance, and 6) Media & Photography. Residents can sign in with Gmail and choose their team under the Volunteer tab.'
  },
  {
    question: 'How is voluntary contribution processing managed with transparency?',
    answer:
      'Every single donation or contribution is 100% voluntary. All collections generate an instant digital receipt with token number, and every single rupee spent is mapped to audited vendor bills. Devotees can view and download their verified receipts at any time.'
  }
];
