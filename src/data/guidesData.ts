export interface SecurityGuide {
  id: string;
  slug: string;
  category: string;
  readTime: string;
  publishedDate: string;
  title: string;
  excerpt: string;
  keyTakeaways: string[];
  sections: Array<{
    heading: string;
    body: string;
  }>;
  relatedStoreCategory: string;
}

export const SECURITY_GUIDES: SecurityGuide[] = [
  {
    id: 'guide-choose-cctv-2026',
    slug: 'choose-right-cctv-system-home-shop-office',
    category: 'Buyer Guide',
    readTime: '4 min read',
    publishedDate: '2026',
    title: 'How to Choose the Right CCTV System for Your Home, Shop, or Office in 2026',
    excerpt:
      'A clear, practical checklist covering camera resolution, color night vision, audio recording, cabling quality, and on-premise storage sizing before you invest.',
    keyTakeaways: [
      'Use IP67 weatherproof metal bullet cameras for main gates and outdoor perimeters.',
      'Choose built-in mic indoor dome cameras for billing counters, offices, and reception desks.',
      'Always pair recorders with 24/7 surveillance-rated hard disks rather than desktop drives.',
    ],
    sections: [
      {
        heading: '1. Map Entry Points & Blind Spots First',
        body: 'Before selecting camera count, walk your perimeter at night. Prioritize main gates, parking ramps, cash counters, staircase landings, and rear service doors. A well-placed 4-camera or 8-camera layout outperforms an unplanned 12-camera setup.',
      },
      {
        heading: '2. Resolution & Full-Color Night Vision',
        body: 'Standard 2MP Full HD works well for small rooms and corridors, while 4MP–5MP IP cameras provide sharper number-plate and face detail across wider compounds. Full-color night-vision cameras preserve clothing and vehicle colors in low light.',
      },
      {
        heading: '3. Prioritize Pure Copper Cabling & Sealed Junction Boxes',
        body: 'Over 60% of early CCTV failures in Andhra Pradesh and Telangana happen due to low-grade CCA cables or exposed outdoor connectors during monsoon rains. Always insist on pure copper 3+1 or Cat6 cables housed inside sealed PVC or IP65 PoE boxes.',
      },
    ],
    relatedStoreCategory: 'CCTV Combo Kits',
  },
  {
    id: 'guide-ip-vs-hd',
    slug: 'ip-vs-hd-analog-cctv-comparison',
    category: 'Technical Comparison',
    readTime: '5 min read',
    publishedDate: '2026',
    title: 'IP PoE vs HD Analog CCTV Cameras: Cost, Clarity & Scalability Explained',
    excerpt:
      'Understand when a budget-friendly HD DVR system is ideal versus when PoE IP cameras with smart human/vehicle alerts deliver better long-term ROI.',
    keyTakeaways: [
      'HD Analog (DVR) is ideal for cost-effective 2–8 camera upgrades over existing coaxial wiring.',
      'IP PoE (NVR) carries power, 4K video, audio, and AI alerts over a single Cat6 cable.',
      'IP systems scale effortlessly across multi-floor buildings, apartments, and factories via PoE switches.',
    ],
    sections: [
      {
        heading: 'HD Analog (DVR + 3+1 Cable)',
        body: 'Modern 2MP and 5MP HD coaxial cameras offer reliable clarity at a lower upfront cost. If your building already has working coaxial cables, a Hybrid XVR upgrade saves rewiring expense.',
      },
      {
        heading: 'IP Network Cameras (NVR + PoE Cat6)',
        body: 'IP cameras digitize video right inside the camera, delivering superior zoom clarity, built-in audio, human/vehicle line-crossing alerts, and clean single-cable PoE power distribution up to 100 meters per switch hop.',
      },
      {
        heading: 'Which Should You Pick?',
        body: 'For small homes or shops under a tight budget, a 4-Channel HD Kit is fast and dependable. For commercial showrooms, offices, apartments, and factories requiring sharp digital zoom and long-term expandability, IP PoE is the clear winner.',
      },
    ],
    relatedStoreCategory: 'IP Cameras',
  },
  {
    id: 'guide-hdd-storage',
    slug: 'surveillance-hard-disk-storage-guide',
    category: 'Engineering',
    readTime: '3 min read',
    publishedDate: '2026',
    title: 'Surveillance Hard Disk Guide: How Many Days Do 1TB, 2TB & 4TB Actually Store?',
    excerpt:
      'Stop guessing recording retention. Learn how H.265 compression, frame rate, and motion recording dramatically extend your 24/7 storage days.',
    keyTakeaways: [
      'H.265+ compression reduces hard-disk consumption by nearly 40–50% compared to legacy H.264.',
      '4 cameras at 2MP H.265 typically retain 20–30 days on a 1TB surveillance drive.',
      'Never use standard desktop hard drives in DVR/NVR units — they fail rapidly under 24/7 writes.',
    ],
    sections: [
      {
        heading: 'Why Surveillance-Grade Drives Matter',
        body: 'Unlike PC hard disks that read/write intermittently, CCTV recorders write continuous multi-stream video 24 hours a day. Surveillance drives are firmware-tuned to prevent frame drops and withstand enclosed rack heat.',
      },
      {
        heading: 'Verify Exact TB Capacity Instantly',
        body: 'Use TRINETRA’s free CCTV System Planner & HDD Storage Calculator to plug in your exact camera count, resolution, and required retention days (7 to 90 days) before ordering.',
      },
    ],
    relatedStoreCategory: 'Surveillance Hard Disks',
  },
  {
    id: 'guide-access-fire-safety',
    slug: 'biometric-access-control-video-door-phone-fire-safety',
    category: 'Smart Safety',
    readTime: '4 min read',
    publishedDate: '2026',
    title: 'Why CCTV Alone Is Not Enough: Pairing Cameras with Biometric Access & Fire Safety',
    excerpt:
      'Discover how offices, apartments, and warehouses combine CCTV monitoring with biometric door locks, video door phones, and smoke detectors for proactive protection.',
    keyTakeaways: [
      'CCTV records incidents; biometric access control and smart locks actively prevent unauthorized entry.',
      'Video door phones let families verify visitors safely before unlocking main doors.',
      'Photoelectric smoke detectors provide early fire warning minutes before flames spread.',
    ],
    sections: [
      {
        heading: 'Layered Security for Modern Properties',
        body: 'Cameras give visibility, but pairing them with face/fingerprint door controllers, smart digital deadbolts, and automated boom barriers stops unauthorized access in real time.',
      },
      {
        heading: 'Life Safety & Early Fire Detection',
        body: 'Electrical short circuits in shops, server racks, and kitchens start silently. Installing wireless photoelectric smoke detectors and fire alarm panels protects both people and valuable inventory around the clock.',
      },
    ],
    relatedStoreCategory: 'Biometric & Access Control',
  },
];

export interface StorePolicyItem {
  id: 'shipping' | 'warranty' | 'privacy' | 'terms';
  title: string;
  points: string[];
}

export const STORE_POLICIES: StorePolicyItem[] = [
  {
    id: 'shipping',
    title: 'Shipping, Dispatch & Installation Policy',
    points: [
      'Orders across Hyderabad, Vijayawada, Visakhapatnam, Warangal, Tirupati, Guntur, and major AP & Telangana towns are typically dispatched within 24–48 business hours.',
      'Free hardware delivery applies automatically above the store threshold configured in TRINETRA Admin Settings.',
      'When On-Site Installation is selected at checkout, our regional technician coordinates your preferred date and time by phone or WhatsApp.',
    ],
  },
  {
    id: 'warranty',
    title: 'Warranty, Replacement & Returns Policy',
    points: [
      'All CCTV cameras, DVR/NVR recorders, PoE switches, surveillance hard disks, and biometric terminals carry genuine manufacturer warranties (1 to 3 years depending on SKU).',
      'Transit-damaged or dead-on-arrival (DOA) items reported within 48 hours of delivery are eligible for immediate replacement verification.',
      'Physical damage, lightning surge without protection, or unauthorized tampering is excluded from manufacturer warranty; TRINETRA offers affordable out-of-warranty repair support.',
    ],
  },
  {
    id: 'privacy',
    title: 'Data Privacy & On-Premise Video Policy',
    points: [
      'All CCTV systems installed by TRINETRA record privately on your on-premise DVR/NVR hard disk — we never access or store customer video footage.',
      'Customer phone numbers, delivery addresses, and optional GSTIN details collected during orders or enquiries are used strictly for fulfillment, invoicing, and warranty support.',
    ],
  },
  {
    id: 'terms',
    title: 'Terms of Sale & Service',
    points: [
      'Store prices are subject to manufacturer revisions; confirmed orders lock in the checkout price shown on your Order Confirmation Receipt.',
      'Installation base fees cover standard camera mounting and configuration; additional conduit piping, trenching, or long cable runs beyond kit allowances are transparently quoted on-site before work begins.',
    ],
  },
];
