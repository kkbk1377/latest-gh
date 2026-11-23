import type { CoverageHub, ProductCategory, ServiceItem } from '../types.ts';

export const ASSET_IMAGES = {
  hero: '/src/assets/images/hero_cctv_command_1795171532012.jpg',
  bulletCamera: '/src/assets/images/product_bullet_camera_1795171535255.jpg',
  domeCamera: '/src/assets/images/product_dome_camera_1795171531647.jpg',
  nvrHardware: '/src/assets/images/product_nvr_recorder_1795171531889.jpg',
  installationTech: '/src/assets/images/service_installation_tech_1795171580817.jpg',
} as const;

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  'CCTV Combo Kits',
  'Bullet Cameras',
  'Dome Cameras',
  'IP Cameras',
  'Wi-Fi Cameras',
  'DVR',
  'NVR',
  'Biometric & Access Control',
  'Smart Door Locks',
  'Video Door Phones',
  'Fire & Intrusion Alarms',
  'Surveillance Hard Disks',
  'PoE Switches',
  'P2P Devices',
  'Wi-Fi Routers & Extenders',
  'Racks',
  'CCTV Cables',
  'BNC Cables',
  'DC Pins',
  'RJ45 Connectors',
  'PoE Boxes',
  'PVC Boxes',
  'Other CCTV Accessories',
];

export interface StoreDepartment {
  id: string;
  name: string;
  tagline: string;
  subcategories: ProductCategory[];
}

export const STORE_DEPARTMENTS: StoreDepartment[] = [
  {
    id: 'surveillance',
    name: 'Surveillance Systems',
    tagline: 'Bullet, Dome, IP, Wi-Fi cameras, DVR/NVR recorders & ready combo kits',
    subcategories: [
      'CCTV Combo Kits',
      'Bullet Cameras',
      'Dome Cameras',
      'IP Cameras',
      'Wi-Fi Cameras',
      'DVR',
      'NVR',
    ],
  },
  {
    id: 'access-safety',
    name: 'Access Control & Smart Safety',
    tagline: 'Face & biometric attendance, smart door locks, video door phones & fire alarms',
    subcategories: [
      'Biometric & Access Control',
      'Smart Door Locks',
      'Video Door Phones',
      'Fire & Intrusion Alarms',
    ],
  },
  {
    id: 'networking-storage',
    name: 'Networking & Storage',
    tagline: '24/7 surveillance hard disks, PoE switches, P2P wireless, Wi-Fi extenders & racks',
    subcategories: [
      'Surveillance Hard Disks',
      'PoE Switches',
      'P2P Devices',
      'Wi-Fi Routers & Extenders',
      'Racks',
    ],
  },
  {
    id: 'cables-accessories',
    name: 'Cables, Power & Accessories',
    tagline: 'Pure copper CCTV & Cat6 cables, BNC/DC/RJ45 connectors, PoE & PVC boxes, SMPS',
    subcategories: [
      'CCTV Cables',
      'BNC Cables',
      'DC Pins',
      'RJ45 Connectors',
      'PoE Boxes',
      'PVC Boxes',
      'Other CCTV Accessories',
    ],
  },
];

export interface BrandPartner {
  id: string;
  name: string;
  shortMark: string;
  accentHex: string;
  categoryNote: string;
}

export const BRAND_PARTNERS: BrandPartner[] = [
  {
    id: 'matrix-comsec',
    name: 'Matrix Comsec',
    shortMark: 'MATRIX',
    accentHex: '#B91C1C',
    categoryNote: 'Enterprise IP Video & Access',
  },
  {
    id: 'cp-plus',
    name: 'CP Plus',
    shortMark: 'CP PLUS',
    accentHex: '#DC2626',
    categoryNote: 'HD & IP Surveillance Systems',
  },
  {
    id: 'hikvision',
    name: 'Hikvision',
    shortMark: 'HIKVISION',
    accentHex: '#C8102E',
    categoryNote: 'Video Security & Recorders',
  },
  {
    id: 'power-cam',
    name: 'Power Cam',
    shortMark: 'POWER CAM',
    accentHex: '#1D4ED8',
    categoryNote: 'Surveillance Cameras & Kits',
  },
  {
    id: 'greatbox',
    name: 'Greatbox',
    shortMark: 'GREATBOX',
    accentHex: '#0F766E',
    categoryNote: 'Racks, Enclosures & Power',
  },
  {
    id: 'prama',
    name: 'Prama',
    shortMark: 'PRAMA',
    accentHex: '#1E3A8A',
    categoryNote: 'Made-in-India Video Security',
  },
  {
    id: 'hikvision-india',
    name: 'Hikvision India',
    shortMark: 'HIKVISION INDIA',
    accentHex: '#991B1B',
    categoryNote: 'Authorized Indian Distribution',
  },
  {
    id: 'sparsh-cctv',
    name: 'Sparsh CCTV',
    shortMark: 'SPARSH',
    accentHex: '#0369A1',
    categoryNote: 'Indigenous CCTV Manufacturing',
  },
  {
    id: 'hi-focus',
    name: 'Hi-Focus Electronics India Pvt. Ltd.',
    shortMark: 'HI-FOCUS',
    accentHex: '#B45309',
    categoryNote: 'IP, HD & Security Electronics',
  },
];

export const CORE_SERVICES: ServiceItem[] = [
  {
    id: 'cctv-camera-installation',
    number: '01',
    title: 'CCTV Camera Installation',
    shortDescription:
      'Site survey, blind-spot planning, concealed conduit cabling, and precision mounting for indoor dome and weatherproof outdoor bullet or IP cameras.',
    details:
      'Every installation begins with a physical or layout assessment to eliminate dead angles, optimize night-vision IR placement, and route cabling through weather-sealed PVC boxes and conduits.',
    deliverables: [
      'Site coverage layout and lens angle planning',
      'Weatherproof mounting with sealed junction boxes',
      'Clean cable dressing, labelling, and power protection',
      'Mobile and desktop live-view application onboarding',
    ],
    idealFor: 'Independent homes, apartments, retail showrooms, offices, and industrial gates',
  },
  {
    id: 'dvr-nvr-installation',
    number: '02',
    title: 'DVR and NVR Installation',
    shortDescription:
      'End-to-end setup of 4, 8, 16, 32, and 64-channel Digital and Network Video Recorders with rack mounting and retention scheduling.',
    details:
      'We configure H.265+ storage optimization, motion-triggered recording schedules, user access roles, HDMI monitoring displays, and encrypted P2P cloud viewing.',
    deliverables: [
      'DVR/NVR rack mounting and surge-protected power integration',
      'Surveillance HDD initialization and retention calculation',
      'Secure administrator credentials and mobile viewing setup',
      'Playback and footage export walkthrough for site staff',
    ],
    idealFor: 'Commercial complexes, warehouses, schools, hospitals, and residential societies',
  },
  {
    id: 'cctv-repair-maintenance',
    number: '03',
    title: 'CCTV Repair and Maintenance',
    shortDescription:
      'Component-level fault inspection, connector re-termination, SMPS power supply replacement, and lens cleaning for existing camera setups.',
    details:
      'We service both systems installed by TRINETRA and third-party multi-brand surveillance installations experiencing flicker, blank channels, or weather damage.',
    deliverables: [
      'BNC, DC pin, and RJ45 connector diagnostics and replacement',
      'Camera SMPS and PoE adapter voltage verification',
      'Lens realignment, infrared check, and enclosure resealing',
      'Firmware health check and recorder stability testing',
    ],
    idealFor: 'Existing home, shop, and commercial setups needing reliable restoration',
  },
  {
    id: 'hard-disk-replacement',
    number: '04',
    title: 'Hard Disk Replacement',
    shortDescription:
      'Supply and installation of continuous-duty surveillance-grade hard drives (1TB to 10TB+) with drive health verification and retention tuning.',
    details:
      'Standard desktop hard disks fail rapidly under 24/7 CCTV write loads. We replace failing drives with purpose-built surveillance HDDs and verify overwrite cycles.',
    deliverables: [
      'SMART health diagnostics of existing failing drives',
      'Installation of genuine surveillance-rated SATA hard disks',
      'Formatting, partition validation, and recording verification',
      'Bitrate tuning to achieve target 15, 30, or 60-day retention',
    ],
    idealFor: 'Sites with beeping recorders, missing playback history, or storage upgrades',
  },
  {
    id: 'network-poe-configuration',
    number: '05',
    title: 'Network and PoE Configuration',
    shortDescription:
      'Structured Cat6 cabling, managed and unmanaged PoE switch deployment, VLAN segmentation, and long-distance wireless P2P links.',
    details:
      'Reliable IP surveillance depends on disciplined networking. We engineer PoE power budgets, rack patch panels, static IP allocation, and outdoor point-to-point bridges.',
    deliverables: [
      'PoE switch wattage budgeting and surge-protected installation',
      'Structured Cat6 termination, RJ45 crimping, and cable testing',
      'Static IP assignment and NVR channel mapping',
      'Outdoor P2P wireless bridge links between buildings or gates',
    ],
    idealFor: 'Multi-building campuses, factories, godowns, and gated communities',
  },
  {
    id: 'cctv-troubleshooting',
    number: '06',
    title: 'CCTV Troubleshooting',
    shortDescription:
      'Rapid root-cause resolution for no-video errors, offline mobile viewing, night-vision glare, cable breaks, and intermittent camera drops.',
    details:
      'Our technicians isolate signal loss, ground-loop interference, IP address conflicts, and router port or P2P disconnection issues methodically on-site.',
    deliverables: [
      'Signal continuity and voltage drop testing across runs',
      'Mobile app offline and P2P cloud reconnection fixes',
      'Night-vision IR reflection and low-light calibration',
      'Recorder beep alerts, time-sync, and password recovery support',
    ],
    idealFor: 'Urgent downtime affecting active business premises or residential security',
  },
  {
    id: 'annual-maintenance-services',
    number: '07',
    title: 'Annual Maintenance Services',
    shortDescription:
      'Scheduled preventive maintenance contracts (AMC) with periodic lens servicing, hard-disk health audits, and priority on-site support.',
    details:
      'Prevent silent recording failures before an incident happens. Our structured AMC visits verify every camera feed, recording archive, rack ventilation, and backup power.',
    deliverables: [
      'Scheduled preventive camera cleaning and focus inspections',
      'Monthly or quarterly HDD health and playback verification',
      'Priority breakdown response across Andhra Pradesh & Telangana',
      'Clear service visit logs and spare replacement estimates',
    ],
    idealFor: 'Offices, apartments, schools, retail chains, clinics, and warehouses',
  },
];

export const COVERAGE_HUBS: CoverageHub[] = [
  {
    id: 'hyderabad',
    city: 'Hyderabad',
    state: 'Telangana',
    regionLabel: 'Telangana Primary Operations Hub',
    lat: 17.385,
    lng: 78.4867,
    districtsCovered: ['Hyderabad', 'Rangareddy', 'Medchal-Malkajgiri', 'Sangareddy'],
  },
  {
    id: 'warangal',
    city: 'Warangal',
    state: 'Telangana',
    regionLabel: 'North-Central Telangana Zone',
    lat: 17.9689,
    lng: 79.5941,
    districtsCovered: ['Warangal', 'Hanumakonda', 'Jangaon', 'Mahabubabad'],
  },
  {
    id: 'karimnagar',
    city: 'Karimnagar',
    state: 'Telangana',
    regionLabel: 'Northern Telangana Zone',
    lat: 18.4386,
    lng: 79.1288,
    districtsCovered: ['Karimnagar', 'Nizamabad', 'Siddipet', 'Peddapalli'],
  },
  {
    id: 'khammam',
    city: 'Khammam',
    state: 'Telangana',
    regionLabel: 'Eastern Telangana Corridor',
    lat: 17.2473,
    lng: 80.1514,
    districtsCovered: ['Khammam', 'Nalgonda', 'Suryapet', 'Bhadradri Kothagudem'],
  },
  {
    id: 'vijayawada',
    city: 'Vijayawada',
    state: 'Andhra Pradesh',
    regionLabel: 'Capital Region & Coastal AP Hub',
    lat: 16.5062,
    lng: 80.648,
    districtsCovered: ['NTR (Vijayawada)', 'Guntur', 'Krishna', 'Eluru'],
  },
  {
    id: 'visakhapatnam',
    city: 'Visakhapatnam',
    state: 'Andhra Pradesh',
    regionLabel: 'North Coastal Andhra Hub',
    lat: 17.6868,
    lng: 83.2185,
    districtsCovered: ['Visakhapatnam', 'Vizianagaram', 'Anakapalli', 'Srikakulam'],
  },
  {
    id: 'rajahmundry',
    city: 'Rajahmundry & Kakinada',
    state: 'Andhra Pradesh',
    regionLabel: 'Godavari Delta Zone',
    lat: 17.0005,
    lng: 81.804,
    districtsCovered: ['East Godavari', 'Kakinada', 'West Godavari', 'Konaseema'],
  },
  {
    id: 'tirupati',
    city: 'Tirupati & Nellore',
    state: 'Andhra Pradesh',
    regionLabel: 'Southern Andhra Zone',
    lat: 13.6288,
    lng: 79.4192,
    districtsCovered: ['Tirupati', 'Chittoor', 'SPSR Nellore', 'Prakasam'],
  },
  {
    id: 'kurnool',
    city: 'Kurnool & Anantapur',
    state: 'Andhra Pradesh',
    regionLabel: 'Rayalaseema Zone',
    lat: 15.8281,
    lng: 78.0373,
    districtsCovered: ['Kurnool', 'Nandyal', 'Anantapur', 'YSR Kadapa'],
  },
];

export function formatWhatsAppUrl(phoneRaw: string, message: string): string {
  const digits = phoneRaw.replace(/[^\d]/g, '');
  const normalized = digits.length === 10 ? `91${digits}` : digits || '919000000000';
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export function formatTelUrl(phoneRaw: string): string {
  const cleaned = phoneRaw.replace(/[^\d+]/g, '');
  return `tel:${cleaned || '+919000000000'}`;
}
