export interface SolutionSector {
  id: string;
  shortLabel: string;
  title: string;
  subtitle: string;
  idealFor: string;
  capabilities: string[];
  recommendedHardware: string[];
  privacyNote: string;
}

export interface IntegratedSystemItem {
  id: string;
  code: string;
  title: string;
  summary: string;
  useCases: string;
}

export interface DeploymentStep {
  step: string;
  title: string;
  description: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const SOLUTION_SECTORS: SolutionSector[] = [
  {
    id: 'smart-ai',
    shortLabel: 'Smart AI Upgrade',
    title: 'Smart AI Detection & Existing CCTV Upgrade',
    subtitle:
      'Turn your existing IP or HD cameras into an intelligent security network with human & vehicle filtering, perimeter line-crossing alerts, and instant mobile notifications — without ripping out working cabling.',
    idealFor: 'Existing CCTV owners upgrading to smart alerts & higher clarity',
    capabilities: [
      'Works with existing IP, HD, and coax cabling via hybrid XVR or smart NVR upgrades',
      'Human & vehicle classification to reduce false motion alerts from rain, shadows, or pets',
      'Virtual perimeter line-crossing and intrusion-zone notifications directly on mobile',
      '100% on-premise local recording — full data privacy with zero mandatory cloud subscription fees',
    ],
    recommendedHardware: [
      'AI-Ready 8/16/32Ch NVR or Hybrid XVR',
      'ColorVu / Full-Color Night Vision IP Cameras',
      'Surveillance-Grade 24/7 HDD (2TB – 8TB)',
      'Managed PoE Switch & Surge Protection',
    ],
    privacyNote: 'All footage & detection run locally on your on-site recorder — never locked in a third-party cloud.',
  },
  {
    id: 'industrial',
    shortLabel: 'Factories & Warehouses',
    title: 'Industrial, Manufacturing & Warehouse Surveillance',
    subtitle:
      'Heavy-duty perimeter monitoring, gate vehicle logging, loading-dock oversight, and shop-floor safety monitoring engineered for dusty, high-heat, and large-span facilities across AP & Telangana.',
    idealFor: 'Factories, rice mills, pharma plants, cold storages, and logistics hubs',
    capabilities: [
      'Long-range 50m–80m IR & full-color bullet cameras for wide yard & boundary coverage',
      'Main-gate vehicle entry tracking with ANPR-ready IP cameras and boom barrier integration',
      'Loading bay, dispatch counter, and assembly-floor blind-spot elimination',
      'Safety-zone monitoring, restricted-area intrusion alerts, and fire/smoke alarm integration',
    ],
    recommendedHardware: [
      '4MP–8MP IP67 Weatherproof Metal Bullet & PTZ Cameras',
      '16/32Ch Multi-Bay Enterprise NVR with RAID/Dual HDD',
      'Industrial Gigabit PoE Switches & Fiber Uplinks',
      'IP65 Pole-Mount PoE Enclosures & Wall Server Racks',
    ],
    privacyNote: 'Central control-room viewing wall + authorized management mobile access over secure P2P/VPN.',
  },
  {
    id: 'commercial',
    shortLabel: 'Offices & Retail',
    title: 'Corporate Offices, Showrooms & Retail Security',
    subtitle:
      'Protect cash counters, inventory rooms, lobbies, and multi-branch storefronts with audio-enabled indoor domes, biometric staff access control, and unified remote viewing from one mobile app.',
    idealFor: 'Jewellery stores, supermarkets, offices, banks, clinics, and franchise chains',
    capabilities: [
      'Built-in mic indoor dome cameras for crystal-clear billing & cash-counter accountability',
      'Multi-branch remote viewing so owners monitor all shops from a single smartphone or PC',
      'Biometric fingerprint, face-recognition & RFID door access with attendance reports',
      'Concealed PVC conduit wiring that keeps modern showroom and office interiors spotless',
    ],
    recommendedHardware: [
      '2MP–5MP Audio-Enabled Indoor Dome IP Cameras',
      'Biometric / Face Recognition Attendance & Door Controller',
      '4/8/16Ch PoE NVR + Dedicated Monitor Display',
      'Pure Copper Cat6 Cabling & 4U/6U Wall Rack',
    ],
    privacyNote: 'Role-based viewing permissions keep manager live feeds and playback audit-ready.',
  },
  {
    id: 'residential',
    shortLabel: 'Apartments & Villas',
    title: 'Gated Communities, Apartments & Independent Homes',
    subtitle:
      'Complete perimeter, lift, parking, and main-gate protection combining crisp night-vision cameras, video door intercoms, and automated gate barriers for total family peace of mind.',
    idealFor: 'Independent villas, apartment associations (RWAs), and gated layouts',
    capabilities: [
      'Main-gate entry/exit camera coverage with low-light plate clarity for visitor verification',
      'Vandal-resistant corridor, basement parking, and lift dome camera installations',
      'Multi-apartment video door phone & intercom systems linked to security cabin',
      'Automatic boom barriers and RFID vehicle access for resident-only parking control',
    ],
    recommendedHardware: [
      'Color Night-Vision Bullet & Vandal-Proof Dome Cameras',
      'Video Door Phone / IP Intercom Console',
      'Automatic Boom Barrier & Gate Sensor Kit',
      'Weather-Sealed PVC Junction Boxes & Regulated SMPS',
    ],
    privacyNote: 'Zero blind spots across stilt parking, stairwells, terrace doors, and perimeter walls.',
  },
  {
    id: 'campus-solar',
    shortLabel: 'Campuses & Solar Sites',
    title: 'Schools, Hospitals, Farms & Off-Grid Solar CCTV',
    subtitle:
      'Reliable surveillance for wide campuses, healthcare facilities, open agricultural plots, and construction sites — including 4G SIM solar cameras and wireless P2P links where power or fiber cannot reach.',
    idealFor: 'Schools, colleges, hospitals, agricultural farms, layouts, and active construction sites',
    capabilities: [
      '4G SIM + Solar-powered off-grid cameras for farmland, real-estate plots, and remote gates',
      '5GHz outdoor Point-to-Point (P2P) wireless bridges linking distant blocks up to several kilometers',
      'Campus corridor, playground, bus-bay, and reception surveillance with 30–90 day retention',
      'Scheduled preventive maintenance (AMC) keeping every camera online through monsoon & summer',
    ],
    recommendedHardware: [
      '4G Solar PTZ / Bullet Off-Grid Camera Systems',
      'Outdoor 5GHz Point-to-Point (P2P) Wireless Bridge Pair',
      'High-Capacity 4TB–8TB Surveillance Hard Drives',
      'IP65 Weatherproof Surge & Battery Enclosures',
    ],
    privacyNote: 'Engineered for Andhra Pradesh & Telangana summer heat and heavy monsoon durability.',
  },
];

export const INTEGRATED_SECURITY_SYSTEMS: IntegratedSystemItem[] = [
  {
    id: 'ai-analytics',
    code: '01',
    title: 'Smart AI Surveillance & Perimeter Alerts',
    summary:
      'Upgrade existing or new CCTV systems with on-premise human/vehicle detection, intrusion zones, and real-time mobile push alerts without monthly cloud lock-in.',
    useCases: 'Homes, Warehouses, Factories, Showrooms',
  },
  {
    id: 'biometric-access',
    code: '02',
    title: 'Biometric, Face & RFID Access Control',
    summary:
      'Install fingerprint, face-recognition, and RFID card door locks paired with automated employee time-attendance tracking and electromagnetic locks.',
    useCases: 'Offices, Hospitals, Server Rooms, Plants',
  },
  {
    id: 'video-intercom',
    code: '03',
    title: 'Video Door Phones & Apartment Intercoms',
    summary:
      'Screen visitors with clear two-way audio/video indoor monitors, remote door-release switches, and multi-flat EPABX intercom cabling.',
    useCases: 'Independent Villas, Apartments, Clinics',
  },
  {
    id: 'boom-barriers',
    code: '04',
    title: 'Automatic Boom Barriers & Gate Automation',
    summary:
      'Control vehicle entry cleanly with heavy-duty electromechanical boom barriers, RFID windshield tags, loop detectors, and sliding gate motors.',
    useCases: 'Gated Communities, Industrial Gates, Parking',
  },
  {
    id: 'fire-alarm',
    code: '05',
    title: 'Fire Alarm Panels & Smoke / Heat Detection',
    summary:
      'Conventional and addressable fire alarm control panels with smoke detectors, heat sensors, manual call points, and high-decibel emergency hooters.',
    useCases: 'Commercial Buildings, Schools, Warehouses',
  },
  {
    id: 'solar-p2p',
    code: '06',
    title: '4G Solar Off-Grid & Long-Range P2P CCTV',
    summary:
      'Monitor remote layouts, farms, and distant security gates using standalone 4G solar cameras and weatherproof 5GHz wireless point-to-point links.',
    useCases: 'Farms, Open Layouts, Construction Sites',
  },
];

export const DEPLOYMENT_STEPS: DeploymentStep[] = [
  {
    step: '01',
    title: 'Site Survey & Blind-Spot Audit',
    description:
      'Our technician evaluates entrances, lighting, mounting heights, cable routes, and power points to map zero-blind-spot camera coverage.',
  },
  {
    step: '02',
    title: 'System Design & Clear BoQ',
    description:
      'Receive an itemized Bill of Quantities specifying camera models, NVR/DVR channels, surveillance HDD days, PoE switches, and cabling.',
  },
  {
    step: '03',
    title: 'Clean Installation & Sealing',
    description:
      'Structured concealed cabling, weather-sealed PVC/IP65 junction boxes, rack dressing, and surge-protected power commissioning.',
  },
  {
    step: '04',
    title: 'Mobile Handover & AMC Care',
    description:
      'Live smartphone & desktop viewing configured on your devices, playback training completed, plus optional Annual Maintenance support.',
  },
];

export const SURVEILLANCE_FAQS: FaqItem[] = [
  {
    id: 'faq-existing',
    question: 'Can TRINETRA upgrade my existing CCTV system without replacing all cables?',
    answer:
      'Yes. In most homes, shops, and factories, we test your existing coaxial or Cat6 cabling first and upgrade only the faulty cameras, recorder (Hybrid XVR / Smart NVR), power supply, or hard disk — saving significant cost and downtime.',
  },
  {
    id: 'faq-privacy',
    question: 'Is my CCTV footage stored privately on-site or forced onto a paid cloud?',
    answer:
      'All video is recorded privately on-premise on your own surveillance hard disk inside your DVR or NVR. You get live remote smartphone viewing and instant motion alerts with zero mandatory monthly cloud storage fees.',
  },
  {
    id: 'faq-storage',
    question: 'How many days of recording do I get with a 1TB, 2TB, or 4TB surveillance hard disk?',
    answer:
      'Retention depends on camera count, resolution (2MP–8MP), H.265 compression, and continuous vs. motion recording. Use our free CCTV System Planner & Storage Calculator on this website to compute exact TB capacity in seconds.',
  },
  {
    id: 'faq-integrated',
    question: 'Do you also install Biometric Access Control, Video Intercoms, Boom Barriers, and Fire Alarms?',
    answer:
      'Yes. Beyond CCTV cameras and DVR/NVR setups, TRINETRA CCTV SOLUTIONS supplies and installs biometric attendance/door controllers, video door phones, apartment intercoms, automatic boom barriers, fire alarm systems, and 4G solar cameras.',
  },
  {
    id: 'faq-coverage',
    question: 'Which cities and districts do you cover for installation and service?',
    answer:
      'We serve homes, businesses, and industrial sites across both Telangana (Hyderabad, Secunderabad, Warangal, Karimnagar, Nizamabad, Khammam) and Andhra Pradesh (Vijayawada, Visakhapatnam, Guntur, Tirupati, Rajahmundry, Kurnool, Nellore, and surrounding districts).',
  },
  {
    id: 'faq-warranty',
    question: 'What warranty and after-sales maintenance support do you provide?',
    answer:
      'All supplied cameras, recorders, and surveillance hard disks carry genuine manufacturer warranties (typically 1 to 3 years depending on hardware). We also provide on-call repairs, hard-disk replacement, and structured Annual Maintenance Contracts (AMC).',
  },
];
