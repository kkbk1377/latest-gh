import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import {
  ASSET_IMAGES,
  BRAND_PARTNERS,
  PRODUCT_CATEGORIES,
} from './src/data/catalogData.ts';
import {
  buildDefaultPackageBrands,
  buildDefaultPackageComponents,
  buildDefaultPackageConfig,
  buildDefaultPackageVariants,
} from './src/data/packageSeedData.ts';
import { calculatePackage } from './src/lib/packageEngine.ts';
import {
  buildFullPackageCatalog,
  packageCalcInputSchema,
  registerPackageRoutes,
} from './src/server/packageRoutes.ts';
import type {
  AdminAnalytics,
  AdminAuditLogEntry,
  BrandPartnerItem,
  BusinessSettings,
  ClientTestimonial,
  CustomerEnquiry,
  DatabaseBackupInfo,
  OrderLineItem,
  PackageBrand,
  PackageComponent,
  PackageConfig,
  PackageOrder,
  PackageQuotation,
  PackageVariant,
  ProductCategory,
  ProductItem,
  PromoOffer,
  StoreOrder,
  StoreOrderPackageSummary,
} from './src/types.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(__dirname, 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
const DB_FILE = path.join(DATA_DIR, 'trinetra-db.json');

interface AdminAuthRecord {
  salt: string;
  hash: string;
  configuredAt: string;
}

interface DatabaseSchema {
  settings: BusinessSettings;
  brands: BrandPartnerItem[];
  offers: PromoOffer[];
  products: ProductItem[];
  orders: StoreOrder[];
  enquiries: CustomerEnquiry[];
  testimonials: ClientTestimonial[];
  adminAuth: AdminAuthRecord;
  packageConfig: PackageConfig;
  packageBrands: PackageBrand[];
  packageComponents: PackageComponent[];
  packageVariants: PackageVariant[];
  packageQuotations: PackageQuotation[];
  packageOrders: PackageOrder[];
  adminAuditLogs: AdminAuditLogEntry[];
}

function hashPasscode(passcode: string, salt: string): string {
  return crypto.scryptSync(passcode, salt, 64).toString('hex');
}

function buildInitialAdminAuth(): AdminAuthRecord {
  // Initializes with the owner-requested passcode hashed with salted scrypt
  // (never stored in plaintext). Owner can change it anytime in Admin > Security.
  const initialPass = 'Bharath@1234';
  const salt = crypto.randomBytes(16).toString('hex');
  return {
    salt,
    hash: hashPasscode(initialPass, salt),
    configuredAt: new Date().toISOString(),
  };
}

function buildDefaultSettings(): BusinessSettings {
  return {
    businessName: 'TRINETRA CCTV SOLUTIONS',
    domain: 'https://trinetrasolutions.online',
    tagline: 'Complete CCTV Security Solutions Under One Roof',
    logoUrl: '',
    heroBadgeText: 'TRINETRA CCTV SOLUTIONS · Andhra Pradesh & Telangana',
    heroHeadline: 'Complete CCTV Security Solutions Under One Roof',
    heroSubtitle:
      'End-to-end CCTV camera sales, structured IP and HD installation, DVR/NVR setup, hard disk replacement, PoE networking, and dependable repair services for homes, businesses, and industrial sites across Andhra Pradesh and Telangana.',
    phone: '+91 90000 00000',
    whatsapp: '+91 90000 00000',
    email: 'contact@trinetrasolutions.online',
    address:
      'Service Operations Office, Hyderabad & Vijayawada, Telangana & Andhra Pradesh, India',
    businessHours: 'Monday – Saturday, 9:00 AM – 7:30 PM IST',
    serviceAreas: ['Andhra Pradesh', 'Telangana'],
    officeLocationName: 'TRINETRA CCTV SOLUTIONS — Regional Hub',
    officeLat: 17.385,
    officeLng: 78.4867,
    freeDeliveryThresholdInr: 10000,
    installationBaseFeeInr: 1500,
    upiId: 'trinetrasolutions@upi',
    updatedAt: new Date().toISOString(),
  };
}

function buildDefaultBrands(): BrandPartnerItem[] {
  return BRAND_PARTNERS.map((b) => ({
    ...b,
    logoUrl: '',
    active: true,
  }));
}

function buildDefaultOffers(): PromoOffer[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'OFF-WELCOME',
      title: 'AP & Telangana Store Launch Offer — Flat ₹500 Off on Orders Above ₹8,000',
      code: 'TRINETRA500',
      description:
        'Applicable on CCTV cameras, DVR/NVR kits, surveillance hard disks, and store accessories. Editable anytime in Admin Panel.',
      discountType: 'flat',
      discountValue: 500,
      minOrderInr: 8000,
      active: true,
      showInBanner: true,
      validUntil: '2026-12-31',
      updatedAt: now,
    },
    {
      id: 'OFF-COMBO10',
      title: 'Commercial Bulk & AMC Partner Discount — 5% Off Above ₹25,000',
      code: 'SECURE5',
      description:
        'Save 5% on bulk NVR, PoE switch, and multi-camera project orders across Andhra Pradesh and Telangana.',
      discountType: 'percent',
      discountValue: 5,
      minOrderInr: 25000,
      active: true,
      showInBanner: false,
      validUntil: '2026-12-31',
      updatedAt: now,
    },
  ];
}

function buildInitialCatalogue(): ProductItem[] {
  const now = new Date().toISOString();
  const entries: Array<{
    id: string;
    name: string;
    category: ProductCategory;
    brand: string;
    model: string;
    description: string;
    mrpInr: number | null;
    priceInr: number | null;
    warranty: string;
    availability: ProductItem['availability'];
    imageUrl: string;
    featured: boolean;
    isReferenceEntry: boolean;
  }> = [
    {
      id: 'cat-bullet-hd-ip',
      name: 'Weatherproof 2MP / 4MP Outdoor Bullet Camera',
      category: 'Bullet Cameras',
      brand: 'Hikvision',
      model: '2MP / 4MP IR Bullet Series',
      description:
        'IP67 weatherproof housing with long-range infrared night vision for perimeter gates, compound walls, and outdoor parking zones. Update exact model & price in Admin.',
      mrpInr: 2450,
      priceInr: 1850,
      warranty: '2 Years Manufacturer Warranty',
      availability: 'In Stock',
      imageUrl: ASSET_IMAGES.bulletCamera,
      featured: true,
      isReferenceEntry: true,
    },
    {
      id: 'cat-dome-indoor',
      name: 'Full-HD Indoor & Corridor Dome Camera',
      category: 'Dome Cameras',
      brand: 'CP Plus',
      model: '2MP / 4MP Full-HD Dome Series',
      description:
        'Compact ceiling-mount dome camera engineered for shops, reception areas, classrooms, corridors, and residential interiors.',
      mrpInr: 2150,
      priceInr: 1650,
      warranty: '2 Years Manufacturer Warranty',
      availability: 'In Stock',
      imageUrl: ASSET_IMAGES.domeCamera,
      featured: true,
      isReferenceEntry: true,
    },
    {
      id: 'cat-ip-network',
      name: '4MP PoE Network IP Security Camera',
      category: 'IP Cameras',
      brand: 'Matrix Comsec',
      model: '4MP PoE IP Bullet / Dome Series',
      description:
        'High-definition network IP camera supporting Power over Ethernet (PoE), H.265+ compression, wide dynamic range (WDR), and ONVIF integration.',
      mrpInr: 4200,
      priceInr: 3450,
      warranty: '2 Years Manufacturer Warranty',
      availability: 'In Stock',
      imageUrl: ASSET_IMAGES.bulletCamera,
      featured: true,
      isReferenceEntry: true,
    },
    {
      id: 'cat-wifi-smart',
      name: 'Smart Wi-Fi 360° Pan-Tilt Camera with Two-Way Audio',
      category: 'Wi-Fi Cameras',
      brand: 'CP Plus',
      model: 'Smart Wi-Fi Indoor / Outdoor Series',
      description:
        'Quick-deploy wireless camera with two-way audio, microSD local storage, motion alerts, and mobile remote viewing for apartments and offices.',
      mrpInr: 3200,
      priceInr: 2390,
      warranty: '1 Year Manufacturer Warranty',
      availability: 'In Stock',
      imageUrl: ASSET_IMAGES.domeCamera,
      featured: true,
      isReferenceEntry: true,
    },
    {
      id: 'cat-dvr-recorder',
      name: '8-Channel Turbo HD Digital Video Recorder (DVR)',
      category: 'DVR',
      brand: 'Hikvision India',
      model: '8Ch Full-HD H.265+ DVR',
      description:
        'Multi-format HD DVR supporting TVI, AHD, CVI, and CVBS cameras with HDMI/VGA display output, H.265+ encoding, and mobile playback.',
      mrpInr: 5800,
      priceInr: 4650,
      warranty: '2 Years Manufacturer Warranty',
      availability: 'In Stock',
      imageUrl: ASSET_IMAGES.nvrHardware,
      featured: true,
      isReferenceEntry: true,
    },
    {
      id: 'cat-nvr-recorder',
      name: '16-Channel 4K Network Video Recorder (NVR)',
      category: 'NVR',
      brand: 'Prama',
      model: '16Ch 4K Dual-SATA NVR Series',
      description:
        'Dedicated IP video recorder supporting multi-megapixel streams, dual SATA surveillance drive bays, and centralized remote monitoring.',
      mrpInr: 9800,
      priceInr: 8250,
      warranty: '2 Years Manufacturer Warranty',
      availability: 'In Stock',
      imageUrl: ASSET_IMAGES.nvrHardware,
      featured: true,
      isReferenceEntry: true,
    },
    {
      id: 'cat-hdd-surveillance',
      name: '2TB 24/7 Surveillance-Grade SATA Hard Disk',
      category: 'Surveillance Hard Disks',
      brand: 'Hi-Focus Electronics India Pvt. Ltd.',
      model: '2TB Continuous-Duty Surveillance HDD',
      description:
        'Continuous-duty surveillance hard drive engineered for 24x7 multi-stream DVR and NVR recording workloads. 1TB to 8TB capacities available.',
      mrpInr: 6800,
      priceInr: 5650,
      warranty: '3 Years Manufacturer Warranty',
      availability: 'In Stock',
      imageUrl: ASSET_IMAGES.nvrHardware,
      featured: false,
      isReferenceEntry: true,
    },
    {
      id: 'cat-cctv-cables',
      name: '90m Pure Copper 3+1 Coaxial CCTV Cable Roll',
      category: 'CCTV Cables',
      brand: 'Power Cam',
      model: '90m Copper 3+1 & Cat6 UTP Roll',
      description:
        'Pure copper shielded 3+1 CCTV cable for HD analog installations and Cat6 UTP/armoured cable for long-run PoE IP camera deployments.',
      mrpInr: 2200,
      priceInr: 1750,
      warranty: 'Standard Quality Warranty',
      availability: 'In Stock',
      imageUrl: ASSET_IMAGES.nvrHardware,
      featured: false,
      isReferenceEntry: true,
    },
    {
      id: 'cat-poe-switch',
      name: '8-Port Gigabit PoE Switch with 2 Uplink Ports',
      category: 'PoE Switches',
      brand: 'Sparsh CCTV',
      model: 'IEEE 802.3af/at 8+2 PoE Switch',
      description:
        'Dedicated CCTV PoE switch with extended-distance mode (up to 250m), surge protection, and dedicated uplink ports for NVR connectivity.',
      mrpInr: 4500,
      priceInr: 3650,
      warranty: '1 Year Replacement Warranty',
      availability: 'In Stock',
      imageUrl: ASSET_IMAGES.nvrHardware,
      featured: false,
      isReferenceEntry: true,
    },
    {
      id: 'cat-racks',
      name: '4U Lockable Metal DVR / NVR Wall-Mount Rack',
      category: 'Racks',
      brand: 'Greatbox',
      model: '4U Steel Lockable Wall Rack',
      description:
        'Powder-coated lockable steel enclosure with cooling fan slots, cable entry knockouts, and PDU mounting support to protect recorders.',
      mrpInr: 2600,
      priceInr: 1950,
      warranty: 'Standard Build Warranty',
      availability: 'In Stock',
      imageUrl: ASSET_IMAGES.nvrHardware,
      featured: false,
      isReferenceEntry: true,
    },
    {
      id: 'cat-bnc-cables',
      name: 'Heavy-Duty Copper BNC Video Connectors (Pack of 10)',
      category: 'BNC Cables',
      brand: 'Power Cam',
      model: 'Copper Core BNC Wire & Crimp Set',
      description:
        'Low-loss copper BNC leads and compression connectors designed to eliminate video interference and loose-contact flicker.',
      mrpInr: 650,
      priceInr: 450,
      warranty: 'Standard Accessory Warranty',
      availability: 'In Stock',
      imageUrl: ASSET_IMAGES.nvrHardware,
      featured: false,
      isReferenceEntry: true,
    },
    {
      id: 'cat-p2p-devices',
      name: 'Outdoor 5GHz Wireless Point-to-Point (P2P) Bridge Pair',
      category: 'P2P Devices',
      brand: 'Hi-Focus Electronics India Pvt. Ltd.',
      model: '5GHz Long-Range CPE / P2P Pair',
      description:
        'Weather-resistant point-to-point wireless transmission units for linking remote gates, warehouses, and farms where trenching cables is impractical.',
      mrpInr: null,
      priceInr: null,
      warranty: '1 Year Manufacturer Warranty',
      availability: 'Confirm via Enquiry',
      imageUrl: ASSET_IMAGES.bulletCamera,
      featured: false,
      isReferenceEntry: true,
    },
    {
      id: 'cat-dc-pins',
      name: '12V Copper DC Power Pins (Pack of 10)',
      category: 'DC Pins',
      brand: 'Greatbox',
      model: 'Male / Female 12V DC Pins',
      description:
        'Snug-fit 12V DC power connectors with strain relief for reliable camera power delivery from SMPS power distribution units.',
      mrpInr: 350,
      priceInr: 240,
      warranty: 'Standard Accessory Warranty',
      availability: 'In Stock',
      imageUrl: ASSET_IMAGES.nvrHardware,
      featured: false,
      isReferenceEntry: true,
    },
    {
      id: 'cat-rj45-connectors',
      name: 'Gold-Plated Cat6 RJ45 Modular Plugs (Pack of 50)',
      category: 'RJ45 Connectors',
      brand: 'Greatbox',
      model: 'Cat6 RJ45 Pass-Through Connectors',
      description:
        'Precision gold-plated RJ45 crimp connectors for dependable PoE and Gigabit IP camera terminations.',
      mrpInr: 650,
      priceInr: 480,
      warranty: 'Standard Accessory Warranty',
      availability: 'In Stock',
      imageUrl: ASSET_IMAGES.nvrHardware,
      featured: false,
      isReferenceEntry: true,
    },
    {
      id: 'cat-poe-boxes',
      name: 'IP65 Outdoor Weatherproof PoE Switch & Surge Box',
      category: 'PoE Boxes',
      brand: 'Greatbox',
      model: 'IP65 Pole/Wall PoE Enclosure',
      description:
        'Pole- and wall-mountable outdoor enclosure housing PoE switches, fiber media converters, and surge protectors safely against monsoon weather.',
      mrpInr: 1450,
      priceInr: 1150,
      warranty: 'Standard Build Warranty',
      availability: 'In Stock',
      imageUrl: ASSET_IMAGES.nvrHardware,
      featured: false,
      isReferenceEntry: true,
    },
    {
      id: 'cat-pvc-boxes',
      name: '4x4 Heavy-Duty Weather-Sealed PVC Junction Box (Pack of 4)',
      category: 'PVC Boxes',
      brand: 'Greatbox',
      model: '4x4 UV-Stabilized PVC Box Set',
      description:
        'UV-stabilized PVC junction boxes to protect BNC, DC, and RJ45 joints cleanly behind every mounted bullet or dome camera.',
      mrpInr: 480,
      priceInr: 340,
      warranty: 'Standard Accessory Warranty',
      availability: 'In Stock',
      imageUrl: ASSET_IMAGES.domeCamera,
      featured: false,
      isReferenceEntry: true,
    },
    {
      id: 'cat-other-accessories',
      name: '8-Channel Regulated 12V SMPS CCTV Power Supply',
      category: 'Other CCTV Accessories',
      brand: 'Power Cam',
      model: '8Ch 12V 10A Metal SMPS Power Box',
      description:
        'Regulated surge-protected SMPS power box with individual channel LED indicators for stable multi-camera operation.',
      mrpInr: 1250,
      priceInr: 920,
      warranty: '1 Year Manufacturer Warranty',
      availability: 'In Stock',
      imageUrl: ASSET_IMAGES.nvrHardware,
      featured: false,
      isReferenceEntry: true,
    },
    {
      id: 'cat-kit-4ch-hd',
      name: 'Complete 4-Camera Full HD 2MP CCTV Combo Kit (2 Bullet + 2 Dome + 4Ch DVR + 1TB HDD)',
      category: 'CCTV Combo Kits',
      brand: 'CP Plus',
      model: 'TRINETRA-KIT-4CH-2MP',
      description:
        'Ready-to-install 4-camera security bundle with 4Ch Full HD DVR, 1TB surveillance hard drive, 4Ch SMPS power supply, 90m copper 3+1 cable, and BNC/DC connectors.',
      mrpInr: 16500,
      priceInr: 12499,
      warranty: '2 Years Manufacturer Warranty',
      availability: 'In Stock',
      imageUrl: ASSET_IMAGES.nvrHardware,
      featured: true,
      isReferenceEntry: true,
    },
    {
      id: 'cat-kit-8ch-ip-poe',
      name: 'Complete 8-Camera 4MP IP PoE Commercial Security Kit (NVR + 8Ch PoE Switch + 2TB HDD)',
      category: 'CCTV Combo Kits',
      brand: 'Hikvision',
      model: 'TRINETRA-KIT-8CH-4MP-IP',
      description:
        'Commercial-grade 8-camera IP PoE bundle engineered for offices, showrooms, apartments, and warehouses with 8Ch 4K NVR, Gigabit PoE switch, and 2TB surveillance storage.',
      mrpInr: 39500,
      priceInr: 31900,
      warranty: '2 Years Manufacturer Warranty',
      availability: 'In Stock',
      imageUrl: ASSET_IMAGES.hero,
      featured: true,
      isReferenceEntry: true,
    },
    {
      id: 'cat-bullet-4mp-color',
      name: '4MP Full-Color Night Vision IP67 Metal Bullet Camera (Built-in Mic)',
      category: 'Bullet Cameras',
      brand: 'Hikvision',
      model: 'DS-2CD1047G2-LUF Series',
      description:
        '24/7 full-color low-light imaging with built-in microphone, human/vehicle smart detection, and IP67 metal weatherproofing for gates and commercial perimeters.',
      mrpInr: 5200,
      priceInr: 3850,
      warranty: '2 Years Manufacturer Warranty',
      availability: 'In Stock',
      imageUrl: ASSET_IMAGES.bulletCamera,
      featured: true,
      isReferenceEntry: true,
    },
    {
      id: 'cat-wifi-360-pt',
      name: '3MP Smart 360° Pan-Tilt Wi-Fi Camera with Two-Way Audio & Auto Tracking',
      category: 'Wi-Fi Cameras',
      brand: 'CP Plus',
      model: 'EzyKam 360° 3MP Smart PT',
      description:
        '360-degree motorized indoor Wi-Fi camera with two-way talk, motion auto-tracking, privacy mode, and microSD + mobile app alerts for homes and shops.',
      mrpInr: 3499,
      priceInr: 2290,
      warranty: '1 Year Manufacturer Warranty',
      availability: 'In Stock',
      imageUrl: ASSET_IMAGES.domeCamera,
      featured: false,
      isReferenceEntry: true,
    },
    {
      id: 'cat-solar-4g-ptz',
      name: '4MP 4G SIM Solar Off-Grid PTZ Security Camera with Battery Panel',
      category: 'IP Cameras',
      brand: 'Hi-Focus Electronics India Pvt. Ltd.',
      model: '4G-SOLAR-PTZ-4MP',
      description:
        'Wire-free 4G LTE + solar-panel powered outdoor PTZ camera designed for agricultural farms, open layouts, remote gates, and construction sites without broadband or power.',
      mrpInr: 12900,
      priceInr: 9450,
      warranty: '1 Year Manufacturer Warranty',
      availability: 'In Stock',
      imageUrl: ASSET_IMAGES.bulletCamera,
      featured: false,
      isReferenceEntry: true,
    },
    {
      id: 'cat-hdd-2tb-surv',
      name: '2TB 24/7 Surveillance Hard Disk Drive (AllFrame / ImagePerfect)',
      category: 'Surveillance Hard Disks',
      brand: 'Greatbox',
      model: '2TB Surveillance SATA 3.5" HDD',
      description:
        'Continuous-duty 2TB SATA surveillance drive built for 4–8 camera HD/IP DVR and NVR workloads with low frame drop and thermal endurance.',
      mrpInr: 6800,
      priceInr: 5450,
      warranty: '3 Years Manufacturer Warranty',
      availability: 'In Stock',
      imageUrl: ASSET_IMAGES.nvrHardware,
      featured: false,
      isReferenceEntry: true,
    },
    {
      id: 'cat-biometric-face-term',
      name: 'AI Face Recognition, Fingerprint & RFID Time-Attendance & Door Access Terminal',
      category: 'Biometric & Access Control',
      brand: 'Hikvision',
      model: 'DS-K1T342EFWX-E1 Series',
      description:
        'Touchscreen face recognition and biometric attendance terminal with dual wide-angle lenses, RFID card support, Wi-Fi/TCP-IP networking, and EM door-lock relay output.',
      mrpInr: 14500,
      priceInr: 10950,
      warranty: '2 Years Manufacturer Warranty',
      availability: 'In Stock',
      imageUrl: ASSET_IMAGES.nvrHardware,
      featured: true,
      isReferenceEntry: true,
    },
    {
      id: 'cat-smart-door-lock',
      name: '5-in-1 Smart Digital Door Lock (Fingerprint, PIN, RFID Card, Mobile App & Key)',
      category: 'Smart Door Locks',
      brand: 'CP Plus',
      model: 'TRINETRA-SMART-DL04',
      description:
        'Heavy-duty mortise smart door lock for wooden and metal main doors featuring anti-peep passcode, semiconductor fingerprint sensor, emergency USB power, and auto-lock.',
      mrpInr: 13900,
      priceInr: 9850,
      warranty: '2 Years Manufacturer Warranty',
      availability: 'In Stock',
      imageUrl: ASSET_IMAGES.domeCamera,
      featured: false,
      isReferenceEntry: true,
    },
    {
      id: 'cat-video-door-phone',
      name: '7-Inch HD Hands-Free Video Door Phone Kit with Weatherproof Outdoor Camera',
      category: 'Video Door Phones',
      brand: 'Hikvision India',
      model: '7" Color VDP + Outdoor IR Station',
      description:
        'Verify visitors clearly before unlocking with a 7-inch indoor LCD monitor, night-vision metal outdoor bell station, two-way intercom audio, and electric lock release.',
      mrpInr: 9200,
      priceInr: 6890,
      warranty: '2 Years Manufacturer Warranty',
      availability: 'In Stock',
      imageUrl: ASSET_IMAGES.domeCamera,
      featured: false,
      isReferenceEntry: true,
    },
    {
      id: 'cat-smoke-fire-detector',
      name: 'Wireless Photoelectric Smoke & Fire Alarm Detector with 85dB Siren',
      category: 'Fire & Intrusion Alarms',
      brand: 'Matrix Comsec',
      model: 'SMK-WB-85D Photoelectric',
      description:
        'Early-warning optical smoke chamber sensor with built-in high-decibel alarm hooter and low-battery alert for homes, shops, server rooms, and warehouses.',
      mrpInr: 2950,
      priceInr: 2150,
      warranty: '1 Year Manufacturer Warranty',
      availability: 'In Stock',
      imageUrl: ASSET_IMAGES.domeCamera,
      featured: false,
      isReferenceEntry: true,
    },
    {
      id: 'cat-wifi-extender-ac',
      name: 'Dual-Band AC1750 High-Gain Wi-Fi Range Extender & Access Point',
      category: 'Wi-Fi Routers & Extenders',
      brand: 'Hi-Focus Electronics India Pvt. Ltd.',
      model: 'AC1750 Dual-Band Mesh/AP',
      description:
        'Eliminate Wi-Fi dead zones for wireless CCTV cameras, smart locks, and video doorbells across multi-floor homes, offices, and showrooms.',
      mrpInr: 4200,
      priceInr: 2990,
      warranty: '2 Years Manufacturer Warranty',
      availability: 'In Stock',
      imageUrl: ASSET_IMAGES.nvrHardware,
      featured: false,
      isReferenceEntry: true,
    },
    {
      id: 'cat-poe-24port-smart',
      name: '24-Port Managed Smart PoE Switch with 2 Gigabit SFP Uplinks (250m Extend)',
      category: 'PoE Switches',
      brand: 'Hikvision',
      model: '24P-POE-2G-SFP Commercial',
      description:
        'Enterprise 24-port PoE switch with 370W power budget, 250m extended CCTV mode, 6KV surge protection, and dual Gigabit combo uplinks for apartments and factories.',
      mrpInr: 18900,
      priceInr: 14800,
      warranty: '2 Years Manufacturer Warranty',
      availability: 'In Stock',
      imageUrl: ASSET_IMAGES.nvrHardware,
      featured: false,
      isReferenceEntry: true,
    },
    {
      id: 'cat-rack-4u-metal',
      name: '4U Powder-Coated Wall-Mount CCTV & Networking Rack with Glass Door & Fan',
      category: 'Racks',
      brand: 'Greatbox',
      model: '4U-WALL-GLASS-LOCK',
      description:
        'Lockable steel 4U enclosure for DVR/NVR, 8–16 port PoE switch, and power distribution strip with toughened glass front door and cooling exhaust provision.',
      mrpInr: 4100,
      priceInr: 3150,
      warranty: '1 Year Structural Warranty',
      availability: 'In Stock',
      imageUrl: ASSET_IMAGES.nvrHardware,
      featured: false,
      isReferenceEntry: true,
    },
  ];

  return entries.map((item) => ({
    ...item,
    updatedAt: now,
  }));
}

function ensureDirectories(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }
}

function writeDbAtomically(data: DatabaseSchema): void {
  ensureDirectories();
  const tmpFile = `${DB_FILE}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmpFile, DB_FILE);
}

function buildFreshDatabase(): DatabaseSchema {
  return {
    settings: buildDefaultSettings(),
    brands: buildDefaultBrands(),
    offers: buildDefaultOffers(),
    products: buildInitialCatalogue(),
    orders: [],
    enquiries: [],
    testimonials: [],
    adminAuth: buildInitialAdminAuth(),
    packageConfig: buildDefaultPackageConfig(),
    packageBrands: buildDefaultPackageBrands(),
    packageComponents: buildDefaultPackageComponents(),
    packageVariants: buildDefaultPackageVariants(),
    packageQuotations: [],
    packageOrders: [],
    adminAuditLogs: [],
  };
}

function ensureDb(): DatabaseSchema {
  ensureDirectories();
  const defaultsSettings = buildDefaultSettings();

  if (!fs.existsSync(DB_FILE)) {
    const initial = buildFreshDatabase();
    writeDbAtomically(initial);
    return initial;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<DatabaseSchema>;

    // Automatic pre-migration safety backup before first Package Builder upgrade
    if (!parsed.packageConfig || !Array.isArray(parsed.packageComponents)) {
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const preMigFile = path.join(BACKUPS_DIR, `pre-package-migration_${stamp}.json`);
      fs.writeFileSync(preMigFile, raw, 'utf-8');
    }

    const defaultCatalogue = buildInitialCatalogue();
    const defaultMap: Record<string, ProductItem> = {};
    for (const p of defaultCatalogue) {
      defaultMap[p.id] = p;
    }

    // Seamlessly upgrade older product records while preserving owner edits
    const existingProducts: ProductItem[] = Array.isArray(parsed.products)
      ? parsed.products.map((p) => {
          const ref = defaultMap[p.id];
          const wasOldUnpricedRef =
            p.isReferenceEntry === true && p.priceInr === null && ref && ref.priceInr !== null;
          return {
            ...p,
            mrpInr:
              typeof p.mrpInr === 'number'
                ? p.mrpInr
                : wasOldUnpricedRef
                  ? ref.mrpInr
                  : null,
            priceInr:
              typeof p.priceInr === 'number'
                ? p.priceInr
                : wasOldUnpricedRef
                  ? ref.priceInr
                  : null,
            availability: wasOldUnpricedRef ? ref.availability : p.availability,
            warranty: p.warranty || ref?.warranty || 'Manufacturer Standard Warranty',
          };
        })
      : defaultCatalogue;

    // Non-destructively append newly added starter kits/SKUs if not already present
    const upgradedExisting = existingProducts.map((p) =>
      p.isReferenceEntry && (p.id === 'cat-kit-4ch-hd' || p.id === 'cat-kit-8ch-ip-poe')
        ? { ...p, category: 'CCTV Combo Kits' as ProductCategory }
        : p,
    );
    const existingIds = new Set(upgradedExisting.map((p) => p.id));
    const newlySeeded = defaultCatalogue.filter((p) => !existingIds.has(p.id));
    const migratedProducts: ProductItem[] = [...upgradedExisting, ...newlySeeded];

    const defaultPkgConfig = buildDefaultPackageConfig();

    const merged: DatabaseSchema = {
      settings: {
        ...defaultsSettings,
        ...(parsed.settings ?? {}),
      },
      brands:
        Array.isArray(parsed.brands) && parsed.brands.length > 0
          ? parsed.brands
          : buildDefaultBrands(),
      offers: Array.isArray(parsed.offers) ? parsed.offers : buildDefaultOffers(),
      products: migratedProducts,
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      enquiries: Array.isArray(parsed.enquiries) ? parsed.enquiries : [],
      testimonials: Array.isArray(parsed.testimonials) ? parsed.testimonials : [],
      adminAuth: parsed.adminAuth ?? buildInitialAdminAuth(),
      packageConfig: parsed.packageConfig
        ? { ...defaultPkgConfig, ...parsed.packageConfig }
        : defaultPkgConfig,
      packageBrands:
        Array.isArray(parsed.packageBrands) && parsed.packageBrands.length > 0
          ? parsed.packageBrands
          : buildDefaultPackageBrands(),
      packageComponents:
        Array.isArray(parsed.packageComponents) && parsed.packageComponents.length > 0
          ? parsed.packageComponents
          : buildDefaultPackageComponents(),
      packageVariants:
        Array.isArray(parsed.packageVariants) && parsed.packageVariants.length > 0
          ? parsed.packageVariants
          : buildDefaultPackageVariants(),
      packageQuotations: Array.isArray(parsed.packageQuotations) ? parsed.packageQuotations : [],
      packageOrders: Array.isArray(parsed.packageOrders) ? parsed.packageOrders : [],
      adminAuditLogs: Array.isArray(parsed.adminAuditLogs) ? parsed.adminAuditLogs : [],
    };

    writeDbAtomically(merged);
    return merged;
  } catch {
    const fallback = buildFreshDatabase();
    writeDbAtomically(fallback);
    return fallback;
  }
}

let db: DatabaseSchema = ensureDb();

function persistDb(): void {
  writeDbAtomically(db);
}

function appendAuditLog(action: string, entity: string, summary: string): void {
  const entry: AdminAuditLogEntry = {
    id: `AUD-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex')}`,
    timestamp: new Date().toISOString(),
    action,
    entity,
    summary,
  };
  db.adminAuditLogs.unshift(entry);
  if (db.adminAuditLogs.length > 500) {
    db.adminAuditLogs = db.adminAuditLogs.slice(0, 500);
  }
}

function createBackupSnapshot(reason: string): DatabaseBackupInfo {
  ensureDirectories();
  const safeReason = reason.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 40) || 'backup';
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `${safeReason}_${stamp}.json`;
  const fullPath = path.join(BACKUPS_DIR, fileName);
  const content = JSON.stringify(db, null, 2);
  fs.writeFileSync(fullPath, content, 'utf-8');
  return {
    fileName,
    createdAt: new Date().toISOString(),
    sizeBytes: Buffer.byteLength(content, 'utf-8'),
    reason: safeReason,
  };
}

function listBackups(): DatabaseBackupInfo[] {
  ensureDirectories();
  const files = fs
    .readdirSync(BACKUPS_DIR)
    .filter((f) => f.endsWith('.json') && /^[a-zA-Z0-9_.-]+$/.test(f));

  return files
    .map((fileName) => {
      const stat = fs.statSync(path.join(BACKUPS_DIR, fileName));
      const reason = fileName.split('_')[0] || 'backup';
      return {
        fileName,
        createdAt: stat.mtime.toISOString(),
        sizeBytes: stat.size,
        reason,
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 30);
}

function validateAndNormalizeRestoredDb(raw: unknown): DatabaseSchema {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Backup payload must be a valid JSON object.');
  }
  const obj = raw as Partial<DatabaseSchema>;
  if (!obj.settings || !Array.isArray(obj.products)) {
    throw new Error('Backup snapshot is missing required settings or products records.');
  }
  const defaults = buildFreshDatabase();
  return {
    settings: { ...defaults.settings, ...obj.settings },
    brands: Array.isArray(obj.brands) ? obj.brands : defaults.brands,
    offers: Array.isArray(obj.offers) ? obj.offers : defaults.offers,
    products: obj.products,
    orders: Array.isArray(obj.orders) ? obj.orders : [],
    enquiries: Array.isArray(obj.enquiries) ? obj.enquiries : [],
    testimonials: Array.isArray(obj.testimonials) ? obj.testimonials : [],
    // Always preserve current adminAuth unless backup explicitly carries a valid salted hash
    adminAuth:
      obj.adminAuth && typeof obj.adminAuth.salt === 'string' && typeof obj.adminAuth.hash === 'string'
        ? obj.adminAuth
        : db.adminAuth,
    packageConfig: obj.packageConfig
      ? { ...defaults.packageConfig, ...obj.packageConfig }
      : defaults.packageConfig,
    packageBrands:
      Array.isArray(obj.packageBrands) && obj.packageBrands.length > 0
        ? obj.packageBrands
        : defaults.packageBrands,
    packageComponents:
      Array.isArray(obj.packageComponents) && obj.packageComponents.length > 0
        ? obj.packageComponents
        : defaults.packageComponents,
    packageVariants:
      Array.isArray(obj.packageVariants) && obj.packageVariants.length > 0
        ? obj.packageVariants
        : defaults.packageVariants,
    packageQuotations: Array.isArray(obj.packageQuotations) ? obj.packageQuotations : [],
    packageOrders: Array.isArray(obj.packageOrders) ? obj.packageOrders : [],
    adminAuditLogs: Array.isArray(obj.adminAuditLogs) ? obj.adminAuditLogs : db.adminAuditLogs,
  };
}

function restoreFromBackupFile(fileName: string): {
  restoredFrom: string;
  safetyBackup: DatabaseBackupInfo;
} {
  const safeBase = path.basename(fileName);
  if (safeBase !== fileName || !/^[a-zA-Z0-9_.-]+\.json$/.test(safeBase)) {
    throw new Error('Invalid backup filename.');
  }
  const targetPath = path.join(BACKUPS_DIR, safeBase);
  if (!fs.existsSync(targetPath)) {
    throw new Error('Selected backup file does not exist.');
  }
  const parsed = JSON.parse(fs.readFileSync(targetPath, 'utf-8')) as unknown;
  const restored = validateAndNormalizeRestoredDb(parsed);
  const safetyBackup = createBackupSnapshot('pre-restore');
  db = restored;
  persistDb();
  return { restoredFrom: safeBase, safetyBackup };
}

function restoreFromJsonPayload(payload: unknown): { safetyBackup: DatabaseBackupInfo } {
  const restored = validateAndNormalizeRestoredDb(payload);
  const safetyBackup = createBackupSnapshot('pre-restore');
  db = restored;
  persistDb();
  return { safetyBackup };
}

const SESSION_SECRET =
  process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16
    ? process.env.SESSION_SECRET
    : crypto.randomBytes(32).toString('hex');

function verifyPasscode(passcode: string): boolean {
  if (!db.adminAuth) return false;
  const computed = hashPasscode(passcode, db.adminAuth.salt);
  const a = Buffer.from(computed, 'hex');
  const b = Buffer.from(db.adminAuth.hash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function createSessionToken(): string {
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24; // 24 hours
  const nonce = crypto.randomBytes(12).toString('hex');
  const payload = `${expiresAt}.${nonce}`;
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [expiresStr, nonce, sig] = parts;
  const expiresAt = Number(expiresStr);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;
  const expected = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(`${expiresStr}.${nonce}`)
    .digest('hex');
  const a = Buffer.from(sig, 'hex');
  const b = Buffer.from(expected, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;
  if (!verifySessionToken(token)) {
    res.status(401).json({ error: 'Unauthorized. Please sign in to TRINETRA Admin.' });
    return;
  }
  next();
}

function normalizePhoneTail(raw: string): string {
  const digits = raw.replace(/[^\d]/g, '');
  return digits.slice(-10);
}

function evaluateCoupon(codeRaw: string | undefined, subtotalInr: number): {
  valid: boolean;
  discountInr: number;
  offer: PromoOffer | null;
  message: string;
} {
  const code = (codeRaw || '').trim().toUpperCase();
  if (!code) {
    return { valid: false, discountInr: 0, offer: null, message: '' };
  }
  const offer = db.offers.find((o) => o.active && o.code.toUpperCase() === code) || null;
  if (!offer) {
    return { valid: false, discountInr: 0, offer: null, message: 'Invalid or expired offer code.' };
  }
  if (offer.validUntil) {
    const expiry = new Date(`${offer.validUntil}T23:59:59Z`);
    if (Number.isFinite(expiry.getTime()) && Date.now() > expiry.getTime()) {
      return { valid: false, discountInr: 0, offer: null, message: 'This offer has expired.' };
    }
  }
  if (subtotalInr < offer.minOrderInr) {
    return {
      valid: false,
      discountInr: 0,
      offer: null,
      message: `Minimum order of ₹${offer.minOrderInr.toLocaleString('en-IN')} required for ${offer.code}.`,
    };
  }
  const discountInr =
    offer.discountType === 'percent'
      ? Math.round((subtotalInr * Math.min(offer.discountValue, 90)) / 100)
      : Math.min(offer.discountValue, subtotalInr);

  return {
    valid: true,
    discountInr,
    offer,
    message: `Applied ${offer.code} — You save ₹${discountInr.toLocaleString('en-IN')}`,
  };
}

// --- Zod Validation Schemas ---
const categoryEnum = z.enum(PRODUCT_CATEGORIES as [ProductCategory, ...ProductCategory[]]);
const availabilityEnum = z.enum([
  'In Stock',
  'Confirm via Enquiry',
  'Made to Order',
  'Out of Stock',
]);

const enquirySchema = z.object({
  type: z.enum(['quote', 'contact', 'service', 'product', 'planner', 'package']).default('contact'),
  name: z.string().trim().min(2, 'Please enter your full name.').max(120),
  phone: z
    .string()
    .trim()
    .regex(/^[+\d\s()-]{8,20}$/, 'Please enter a valid phone number.'),
  email: z.string().trim().email('Invalid email address.').or(z.literal('')).default(''),
  city: z.string().trim().min(2, 'Please enter your city or town.').max(80),
  state: z.enum(['Andhra Pradesh', 'Telangana', 'Other']).default('Telangana'),
  subject: z.string().trim().min(2).max(180),
  productRef: z.string().trim().max(200).optional(),
  serviceRef: z.string().trim().max(200).optional(),
  cameraCount: z.string().trim().max(60).optional(),
  message: z.string().trim().min(5, 'Please provide brief details of your requirement.').max(2500),
});

const orderCreateSchema = z
  .object({
    items: z
      .array(
        z.object({
          productId: z.string().min(1),
          quantity: z.number().int().min(1).max(200),
        }),
      )
      .default([]),
    packageBundles: z
      .array(
        z.object({
          label: z.string().trim().max(140).optional(),
          input: packageCalcInputSchema,
        }),
      )
      .max(10)
      .optional()
      .default([]),
    includeInstallation: z.boolean().default(false),
    couponCode: z.string().trim().max(40).default(''),
    paymentMethod: z
      .enum(['PAY_ON_INSTALLATION', 'UPI_ON_DELIVERY'])
      .default('PAY_ON_INSTALLATION'),
  customerName: z.string().trim().min(2, 'Please enter your full name.').max(120),
  phone: z
    .string()
    .trim()
    .regex(/^[+\d\s()-]{8,20}$/, 'Please enter a valid phone number.'),
  email: z.string().trim().email('Please enter a valid email.').or(z.literal('')).default(''),
  address: z.string().trim().min(6, 'Please enter your delivery address.').max(320),
  city: z.string().trim().min(2, 'Please enter your city.').max(80),
  state: z.enum(['Andhra Pradesh', 'Telangana', 'Other']).default('Telangana'),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Please enter a valid 6-digit Indian PIN code.'),
  gstCompanyName: z.string().trim().max(160).optional().default(''),
  gstin: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[0-9A-Z]{15}$/, 'GSTIN must be a valid 15-character alphanumeric code.')
    .or(z.literal(''))
    .optional()
    .default(''),
  notes: z.string().trim().max(600).default(''),
  })
  .refine((d) => d.items.length > 0 || (d.packageBundles && d.packageBundles.length > 0), {
    message: 'Your cart is empty.',
  });

const testimonialSchema = z.object({
  clientName: z.string().trim().min(2).max(100),
  organization: z.string().trim().max(120).default(''),
  city: z.string().trim().min(2).max(80),
  state: z.enum(['Andhra Pradesh', 'Telangana']),
  serviceUsed: z.string().trim().min(2).max(120),
  feedback: z.string().trim().min(15, 'Please share at least 15 characters of feedback.').max(800),
});

const settingsSchema = z.object({
  businessName: z.string().trim().min(2).max(120),
  domain: z.string().trim().url('Domain must start with https://'),
  tagline: z.string().trim().min(4).max(180),
  logoUrl: z.string().trim().max(500).default(''),
  heroBadgeText: z.string().trim().min(2).max(140),
  heroHeadline: z.string().trim().min(5).max(160),
  heroSubtitle: z.string().trim().min(10).max(500),
  phone: z.string().trim().min(8).max(25),
  whatsapp: z.string().trim().min(8).max(25),
  email: z.string().trim().email('Please enter a valid business email.'),
  address: z.string().trim().min(5).max(320),
  businessHours: z.string().trim().min(4).max(140),
  serviceAreas: z.array(z.string().trim().min(2).max(60)).min(1),
  officeLocationName: z.string().trim().min(2).max(140),
  officeLat: z.number().min(6).max(37),
  officeLng: z.number().min(68).max(97),
  freeDeliveryThresholdInr: z.number().nonnegative().max(1000000),
  installationBaseFeeInr: z.number().nonnegative().max(250000),
  upiId: z.string().trim().max(120).default(''),
});

const productUpsertSchema = z.object({
  name: z.string().trim().min(2, 'Product name is required.').max(160),
  category: categoryEnum,
  brand: z.string().trim().min(2, 'Brand is required.').max(90),
  model: z.string().trim().min(1, 'Model is required.').max(120),
  description: z.string().trim().min(10, 'Description must be at least 10 characters.').max(1000),
  mrpInr: z.number().nonnegative().max(10000000).nullable().default(null),
  priceInr: z.number().nonnegative().max(10000000).nullable(),
  warranty: z.string().trim().max(120).default('Manufacturer Standard Warranty'),
  availability: availabilityEnum,
  imageUrl: z.string().trim().max(500).default(ASSET_IMAGES.bulletCamera),
  featured: z.boolean().default(false),
  isReferenceEntry: z.boolean().default(false),
});

const brandUpsertSchema = z.object({
  name: z.string().trim().min(2).max(100),
  shortMark: z.string().trim().min(1).max(20),
  accentHex: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Accent color must be a 6-digit hex code like #0B1B36'),
  categoryNote: z.string().trim().min(2).max(100),
  logoUrl: z.string().trim().max(500).default(''),
  active: z.boolean().default(true),
});

const offerUpsertSchema = z.object({
  title: z.string().trim().min(4).max(180),
  code: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .transform((v) => v.toUpperCase().replace(/[^A-Z0-9_-]/g, '')),
  description: z.string().trim().min(5).max(400),
  discountType: z.enum(['percent', 'flat']),
  discountValue: z.number().positive().max(100000),
  minOrderInr: z.number().nonnegative().max(10000000),
  active: z.boolean().default(true),
  showInBanner: z.boolean().default(false),
  validUntil: z.string().trim().max(20).default('2026-12-31'),
});

// Rate limiter for public writes
const rateBuckets: Record<string, { count: number; resetAt: number }> = {};
function rateLimit(maxPerMinute: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = `${req.ip || 'unknown'}:${req.path}`;
    const now = Date.now();
    const entry = rateBuckets[key];
    if (!entry || now > entry.resetAt) {
      rateBuckets[key] = { count: 1, resetAt: now + 60_000 };
      next();
      return;
    }
    entry.count += 1;
    if (entry.count > maxPerMinute) {
      res.status(429).json({ error: 'Too many requests. Please wait a minute and try again.' });
      return;
    }
    next();
  };
}

async function startServer(): Promise<void> {
  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(express.json({ limit: '4mb' }));

  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // SEO robots.txt & sitemap.xml for https://trinetrasolutions.online
  app.get('/robots.txt', (_req, res) => {
    const baseUrl = (db.settings.domain || 'https://trinetrasolutions.online').replace(/\/+$/, '');
    res.type('text/plain').send(
      `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${baseUrl}/sitemap.xml\n`,
    );
  });

  app.get('/sitemap.xml', (_req, res) => {
    const baseUrl = (db.settings.domain || 'https://trinetrasolutions.online').replace(/\/+$/, '');
    const routes = [
      { path: '/', priority: '1.0', freq: 'daily' },
      { path: '/packages', priority: '0.95', freq: 'daily' },
      { path: '/store', priority: '0.95', freq: 'daily' },
      { path: '/solutions', priority: '0.9', freq: 'weekly' },
      { path: '/services', priority: '0.9', freq: 'weekly' },
      { path: '/planner', priority: '0.85', freq: 'monthly' },
      { path: '/guides', priority: '0.85', freq: 'weekly' },
      { path: '/coverage', priority: '0.8', freq: 'monthly' },
      { path: '/track', priority: '0.7', freq: 'monthly' },
      { path: '/contact', priority: '0.85', freq: 'monthly' },
    ];
    const lastmod = new Date().toISOString().split('T')[0];
    const urls = routes
      .map(
        (r) =>
          `  <url><loc>${baseUrl}${r.path}</loc><lastmod>${lastmod}</lastmod><changefreq>${r.freq}</changefreq><priority>${r.priority}</priority></url>`,
      )
      .join('\n');
    res
      .type('application/xml')
      .send(
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
      );
  });

  // Serve admin-uploaded logos and product photos
  ensureDirectories();
  app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '7d' }));

  // --- Public API Routes ---
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: db.settings.businessName });
  });

  app.get('/api/settings', (_req, res) => {
    res.json(db.settings);
  });

  app.get('/api/brands', (_req, res) => {
    res.json({ brands: db.brands.filter((b) => b.active) });
  });

  app.get('/api/offers', (_req, res) => {
    const activeOffers = db.offers.filter((o) => {
      if (!o.active) return false;
      if (!o.validUntil) return true;
      const exp = new Date(`${o.validUntil}T23:59:59Z`);
      return !Number.isFinite(exp.getTime()) || Date.now() <= exp.getTime();
    });
    res.json({ offers: activeOffers });
  });

  app.post('/api/offers/validate', (req, res) => {
    const schema = z.object({
      code: z.string().trim().min(1),
      subtotalInr: z.number().nonnegative(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ valid: false, discountInr: 0, message: 'Enter a valid offer code.' });
      return;
    }
    const result = evaluateCoupon(parsed.data.code, parsed.data.subtotalInr);
    res.json(result);
  });

  app.get('/api/products', (req, res) => {
    const category = typeof req.query.category === 'string' ? req.query.category : '';
    const brand = typeof req.query.brand === 'string' ? req.query.brand : '';
    const search =
      typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
    const featured = req.query.featured === 'true';
    const inStockOnly = req.query.inStock === 'true';

    let items = db.products;
    if (category && category !== 'All') {
      items = items.filter((p) => p.category === category);
    }
    if (brand && brand !== 'All') {
      items = items.filter((p) => p.brand.toLowerCase() === brand.toLowerCase());
    }
    if (featured) {
      items = items.filter((p) => p.featured);
    }
    if (inStockOnly) {
      items = items.filter((p) => p.availability === 'In Stock');
    }
    if (search) {
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.brand.toLowerCase().includes(search) ||
          p.model.toLowerCase().includes(search) ||
          p.category.toLowerCase().includes(search) ||
          p.description.toLowerCase().includes(search),
      );
    }

    res.json({ products: items, total: items.length });
  });

  // --- E-Commerce Store Order Checkout ---
  app.post('/api/orders', rateLimit(15), (req, res) => {
    const parsed = orderCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Please check your order details.',
      });
      return;
    }

    const lineItems: OrderLineItem[] = [];
    for (const reqItem of parsed.data.items) {
      const product = db.products.find((p) => p.id === reqItem.productId);
      if (!product) {
        res.status(400).json({ error: 'One or more products in your cart are no longer available.' });
        return;
      }
      if (product.priceInr === null || product.priceInr <= 0) {
        res.status(400).json({
          error: `"${product.name}" is Price on Request — please request a quote for this item.`,
        });
        return;
      }
      if (product.availability === 'Out of Stock') {
        res.status(400).json({ error: `"${product.name}" is currently out of stock.` });
        return;
      }
      lineItems.push({
        productId: product.id,
        name: product.name,
        brand: product.brand,
        model: product.model,
        unitPriceInr: product.priceInr,
        quantity: reqItem.quantity,
        lineTotalInr: product.priceInr * reqItem.quantity,
      });
    }

    const storeSubtotalInr = lineItems.reduce((sum, li) => sum + li.lineTotalInr, 0);

    // Server-validated custom CCTV package bundles from Cart
    const calculatedBundles: StoreOrderPackageSummary[] = [];
    const variantDeductions = new Map<string, number>();

    for (const bundleReq of parsed.data.packageBundles ?? []) {
      const calc = calculatePackage(
        bundleReq.input,
        buildFullPackageCatalog(db),
        { includeCost: true, enforceStock: true },
      );
      if (!calc.valid) {
        res.status(400).json({
          error: calc.errors[0] || 'One of the custom CCTV packages in your cart is invalid.',
        });
        return;
      }
      for (const line of calc.lines) {
        const currentNeed = (variantDeductions.get(line.variantId) ?? 0) + line.quantity;
        const variant = db.packageVariants.find((v) => v.id === line.variantId);
        if (!variant || currentNeed > variant.stockQty) {
          res.status(400).json({
            error: `Insufficient stock for ${line.brandName} ${line.componentName}.`,
          });
          return;
        }
        variantDeductions.set(line.variantId, currentNeed);
      }
      calculatedBundles.push({
        bundleId: `PKG-${Date.now().toString(36).toUpperCase()}-${calculatedBundles.length + 1}`,
        label:
          bundleReq.label ||
          `${calc.systemType} ${calc.channel}CH ${calc.megapixel} Custom CCTV Package`,
        systemType: calc.systemType,
        channel: calc.channel,
        megapixel: calc.megapixel,
        cameraCount: calc.totalCameraCount,
        productSubtotalInr: calc.productSubtotalInr,
        installationTotalInr: calc.installationTotalInr,
        discountInr: calc.discountInr,
        taxInr: calc.taxInr,
        bundleTotalInr: calc.grandTotalInr,
        items: calc.lines.map(({ purchasePriceInr: _hidden, ...pub }) => pub),
      });
    }

    const packageProductSubtotalInr = calculatedBundles.reduce(
      (sum, b) => sum + b.productSubtotalInr,
      0,
    );
    const packageInstallFeeInr = calculatedBundles.reduce(
      (sum, b) => sum + b.installationTotalInr,
      0,
    );
    const packageDiscountInr = calculatedBundles.reduce((sum, b) => sum + b.discountInr, 0);
    const packageTaxInr = calculatedBundles.reduce((sum, b) => sum + b.taxInr, 0);

    const subtotalInr = storeSubtotalInr + packageProductSubtotalInr;
    // Charge store base installation fee ONLY for standalone store products (never duplicate package camera install)
    const storeInstallFeeInr =
      lineItems.length > 0 && parsed.data.includeInstallation
        ? db.settings.installationBaseFeeInr
        : 0;
    const installationFeeInr = storeInstallFeeInr + packageInstallFeeInr;
    const deliveryFeeInr =
      subtotalInr >= db.settings.freeDeliveryThresholdInr ? 0 : 250;

    let storeCouponDiscountInr = 0;
    let appliedCode = '';
    if (parsed.data.couponCode && storeSubtotalInr > 0) {
      const coupon = evaluateCoupon(parsed.data.couponCode, storeSubtotalInr);
      if (!coupon.valid) {
        res.status(400).json({ error: coupon.message || 'Invalid coupon code.' });
        return;
      }
      storeCouponDiscountInr = coupon.discountInr;
      appliedCode = coupon.offer?.code ?? '';
    }

    const discountInr = storeCouponDiscountInr + packageDiscountInr;
    const totalInr = Math.max(
      0,
      subtotalInr + installationFeeInr + deliveryFeeInr + packageTaxInr - discountInr,
    );
    const now = new Date().toISOString();

    // Deduct stock atomically for all package bundle variants
    for (const [variantId, qty] of variantDeductions.entries()) {
      const variant = db.packageVariants.find((v) => v.id === variantId);
      if (variant) {
        variant.stockQty = Math.max(0, variant.stockQty - qty);
        variant.updatedAt = now;
      }
    }

    const order: StoreOrder = {
      id: `ORD-${Date.now().toString(36).toUpperCase()}`,
      items: lineItems,
      packageBundles: calculatedBundles.length > 0 ? calculatedBundles : undefined,
      includeInstallation: parsed.data.includeInstallation || packageInstallFeeInr > 0,
      subtotalInr,
      installationFeeInr,
      deliveryFeeInr,
      discountInr,
      taxInr: packageTaxInr > 0 ? packageTaxInr : undefined,
      couponCode: appliedCode,
      totalInr,
      paymentMethod: parsed.data.paymentMethod,
      customerName: parsed.data.customerName,
      phone: parsed.data.phone,
      email: parsed.data.email,
      address: parsed.data.address,
      city: parsed.data.city,
      state: parsed.data.state,
      pincode: parsed.data.pincode,
      gstCompanyName: parsed.data.gstCompanyName || undefined,
      gstin: parsed.data.gstin || undefined,
      notes: parsed.data.notes,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    db.orders.unshift(order);
    persistDb();

    res.status(201).json({
      message: 'Order placed successfully!',
      order,
    });
  });

  // --- Public Order, Package & Service Enquiry Live Tracker ---
  app.get('/api/track', rateLimit(30), (req, res) => {
    const refId = typeof req.query.id === 'string' ? req.query.id.trim().toUpperCase() : '';
    const phone = typeof req.query.phone === 'string' ? req.query.phone.trim() : '';

    if (!refId || !phone) {
      res.status(400).json({ error: 'Enter both your Reference ID and Phone Number.' });
      return;
    }
    const tail = normalizePhoneTail(phone);
    if (tail.length < 6) {
      res.status(400).json({ error: 'Please enter a valid phone number.' });
      return;
    }

    if (refId.startsWith('ORD-')) {
      const order = db.orders.find(
        (o) => o.id.toUpperCase() === refId && normalizePhoneTail(o.phone).endsWith(tail.slice(-6)),
      );
      if (!order) {
        res.status(404).json({ error: 'No matching order found for that Order ID and phone number.' });
        return;
      }
      res.json({ kind: 'order', record: order });
      return;
    }

    if (refId.startsWith('TRN-PKO-')) {
      const pkgOrder = db.packageOrders.find(
        (o) => o.id.toUpperCase() === refId && normalizePhoneTail(o.phone).endsWith(tail.slice(-6)),
      );
      if (!pkgOrder) {
        res.status(404).json({ error: 'No matching package order found for that ID and phone number.' });
        return;
      }
      res.json({
        kind: 'order',
        record: {
          id: pkgOrder.id,
          items: pkgOrder.calculation.lines.map((l) => ({
            productId: l.variantId,
            name: `${l.brandName} ${l.componentName}`,
            brand: l.brandName,
            model: l.modelCode,
            unitPriceInr: l.unitPriceInr,
            quantity: l.quantity,
            lineTotalInr: l.lineTotalInr,
          })),
          includeInstallation: pkgOrder.calculation.installationTotalInr > 0,
          subtotalInr: pkgOrder.calculation.productSubtotalInr,
          installationFeeInr: pkgOrder.calculation.installationTotalInr,
          deliveryFeeInr: 0,
          discountInr: pkgOrder.calculation.discountInr,
          taxInr: pkgOrder.calculation.taxInr,
          couponCode: pkgOrder.calculation.discountCode,
          totalInr: pkgOrder.calculation.grandTotalInr,
          paymentMethod: pkgOrder.paymentMethod,
          customerName: pkgOrder.customerName,
          phone: pkgOrder.phone,
          email: pkgOrder.email,
          address: pkgOrder.address,
          city: pkgOrder.city,
          state: pkgOrder.state,
          pincode: pkgOrder.pincode,
          gstCompanyName: pkgOrder.gstCompanyName,
          gstin: pkgOrder.gstin,
          notes: pkgOrder.notes,
          status: pkgOrder.status === 'completed' ? 'delivered' : pkgOrder.status,
          createdAt: pkgOrder.createdAt,
          updatedAt: pkgOrder.updatedAt,
        } satisfies StoreOrder,
      });
      return;
    }

    if (refId.startsWith('TRN-QT-')) {
      const quote = db.packageQuotations.find(
        (q) => q.id.toUpperCase() === refId && normalizePhoneTail(q.phone).endsWith(tail.slice(-6)),
      );
      if (!quote) {
        res.status(404).json({ error: 'No matching package quotation found for that ID and phone number.' });
        return;
      }
      res.json({
        kind: 'enquiry',
        record: {
          id: quote.id,
          type: 'package',
          name: quote.customerName,
          phone: quote.phone,
          email: quote.email,
          city: quote.city,
          state: quote.state,
          subject: `${quote.systemType} ${quote.channel}CH ${quote.megapixel} Package Quotation — ₹${quote.calculation.grandTotalInr.toLocaleString('en-IN')}`,
          cameraCount: `${quote.calculation.totalCameraCount} Cameras`,
          message: quote.notes || 'Custom CCTV Package Quotation',
          status:
            quote.status === 'new'
              ? 'new'
              : quote.status === 'sent'
                ? 'quoted'
                : quote.status === 'approved' || quote.status === 'converted'
                  ? 'closed'
                  : 'contacted',
          createdAt: quote.createdAt,
        } satisfies CustomerEnquiry,
      });
      return;
    }

    const enquiry = db.enquiries.find(
      (e) => e.id.toUpperCase() === refId && normalizePhoneTail(e.phone).endsWith(tail.slice(-6)),
    );
    if (!enquiry) {
      res.status(404).json({
        error: 'No matching order, quotation, or enquiry found. Verify your ID (ORD-..., TRN-PKO-..., TRN-QT-..., or ENQ-...) and phone number.',
      });
      return;
    }
    res.json({ kind: 'enquiry', record: enquiry });
  });

  app.post('/api/enquiries', rateLimit(15), (req, res) => {
    const parsed = enquirySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Invalid enquiry details.',
      });
      return;
    }

    const record: CustomerEnquiry = {
      id: `ENQ-${Date.now().toString(36).toUpperCase()}`,
      ...parsed.data,
      status: 'new',
      createdAt: new Date().toISOString(),
    };

    db.enquiries.unshift(record);
    persistDb();

    res.status(201).json({
      message: 'Your enquiry has been received. Our team will respond shortly.',
      enquiry: record,
    });
  });

  app.get('/api/testimonials', (_req, res) => {
    const approved = db.testimonials.filter((t) => t.status === 'approved');
    res.json({ testimonials: approved });
  });

  app.post('/api/testimonials', rateLimit(8), (req, res) => {
    const parsed = testimonialSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Please check your feedback details.',
      });
      return;
    }

    const item: ClientTestimonial = {
      id: `REV-${Date.now().toString(36).toUpperCase()}`,
      ...parsed.data,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    db.testimonials.unshift(item);
    persistDb();

    res.status(201).json({
      message: 'Thank you. Your feedback has been submitted for verification before publishing.',
      testimonial: item,
    });
  });

  // --- Admin Auth & Full Control Routes ---
  app.get('/api/admin/status', (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;
    res.json({
      configured: true,
      authenticated: verifySessionToken(token),
    });
  });

  app.post('/api/admin/login', rateLimit(20), (req, res) => {
    const schema = z.object({ passcode: z.string().min(1).max(64) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success || !verifyPasscode(parsed.data.passcode)) {
      res.status(401).json({ error: 'Invalid admin password. Please try again.' });
      return;
    }
    res.json({ token: createSessionToken() });
  });

  app.post('/api/admin/change-password', requireAdmin, (req, res) => {
    const schema = z.object({
      currentPasscode: z.string().min(1).max(64),
      newPasscode: z.string().min(6, 'New password must be at least 6 characters.').max(64),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid password input.' });
      return;
    }
    if (!verifyPasscode(parsed.data.currentPasscode)) {
      res.status(401).json({ error: 'Current password is incorrect.' });
      return;
    }
    const salt = crypto.randomBytes(16).toString('hex');
    db.adminAuth = {
      salt,
      hash: hashPasscode(parsed.data.newPasscode, salt),
      configuredAt: new Date().toISOString(),
    };
    persistDb();
    res.json({ message: 'Admin password updated successfully.', token: createSessionToken() });
  });

  app.get('/api/admin/analytics', requireAdmin, (_req, res) => {
    const confirmedStoreRevenue = db.orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.totalInr, 0);
    const confirmedPkgRevenue = db.packageOrders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.calculation.grandTotalInr, 0);

    const analytics: AdminAnalytics = {
      totalProducts: db.products.length,
      pricedProducts: db.products.filter((p) => p.priceInr !== null).length,
      activeOffers: db.offers.filter((o) => o.active).length,
      totalOrders: db.orders.length,
      pendingOrders: db.orders.filter((o) => o.status === 'pending').length,
      confirmedRevenueInr: confirmedStoreRevenue + confirmedPkgRevenue,
      totalEnquiries: db.enquiries.length,
      newEnquiries: db.enquiries.filter((e) => e.status === 'new').length,
      pendingReviews: db.testimonials.filter((t) => t.status === 'pending').length,
      totalPackageOrders: db.packageOrders.length,
      totalPackageQuotations: db.packageQuotations.length,
      lowStockPackageVariants: db.packageVariants.filter(
        (v) => v.active && v.stockQty <= v.lowStockThreshold,
      ).length,
    };
    res.json(analytics);
  });

  // Safe image upload for Logos, Product Photos, Brand Partner Logos
  app.post('/api/admin/upload', requireAdmin, (req, res) => {
    const schema = z.object({
      dataUrl: z.string().min(20),
      prefix: z.enum(['logo', 'product', 'brand']).default('product'),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid upload payload.' });
      return;
    }
    const match = /^data:(image\/(?:png|jpeg|jpg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(
      parsed.data.dataUrl,
    );
    if (!match) {
      res.status(400).json({ error: 'Only PNG, JPEG, or WebP images are supported.' });
      return;
    }
    const mime = match[1];
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length > 2.5 * 1024 * 1024) {
      res.status(400).json({ error: 'Image must be smaller than 2.5 MB.' });
      return;
    }
    const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
    const fileName = `${parsed.data.prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`;
    ensureDirectories();
    fs.writeFileSync(path.join(UPLOADS_DIR, fileName), buffer);
    res.status(201).json({ url: `/uploads/${fileName}` });
  });

  app.put('/api/admin/settings', requireAdmin, (req, res) => {
    const parsed = settingsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Invalid business settings.',
      });
      return;
    }
    db.settings = {
      ...parsed.data,
      updatedAt: new Date().toISOString(),
    };
    persistDb();
    res.json({ settings: db.settings, message: 'All website settings saved live.' });
  });

  // Brands CRUD
  app.get('/api/admin/brands', requireAdmin, (_req, res) => {
    res.json({ brands: db.brands });
  });

  app.post('/api/admin/brands', requireAdmin, (req, res) => {
    const parsed = brandUpsertSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid brand details.' });
      return;
    }
    const brand: BrandPartnerItem = {
      id: `BRD-${Date.now().toString(36).toUpperCase()}`,
      ...parsed.data,
    };
    db.brands.push(brand);
    persistDb();
    res.status(201).json({ brand });
  });

  app.put('/api/admin/brands/:id', requireAdmin, (req, res) => {
    const idx = db.brands.findIndex((b) => b.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Brand not found.' });
      return;
    }
    const parsed = brandUpsertSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid brand details.' });
      return;
    }
    db.brands[idx] = { ...db.brands[idx], ...parsed.data };
    persistDb();
    res.json({ brand: db.brands[idx] });
  });

  app.delete('/api/admin/brands/:id', requireAdmin, (req, res) => {
    const before = db.brands.length;
    db.brands = db.brands.filter((b) => b.id !== req.params.id);
    if (db.brands.length === before) {
      res.status(404).json({ error: 'Brand not found.' });
      return;
    }
    persistDb();
    res.json({ deleted: true });
  });

  // Offers & Coupons CRUD
  app.get('/api/admin/offers', requireAdmin, (_req, res) => {
    res.json({ offers: db.offers });
  });

  app.post('/api/admin/offers', requireAdmin, (req, res) => {
    const parsed = offerUpsertSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid offer details.' });
      return;
    }
    if (db.offers.some((o) => o.code.toUpperCase() === parsed.data.code)) {
      res.status(400).json({ error: `Coupon code "${parsed.data.code}" already exists.` });
      return;
    }
    const offer: PromoOffer = {
      id: `OFF-${Date.now().toString(36).toUpperCase()}`,
      ...parsed.data,
      updatedAt: new Date().toISOString(),
    };
    if (offer.showInBanner) {
      db.offers = db.offers.map((o) => ({ ...o, showInBanner: false }));
    }
    db.offers.unshift(offer);
    persistDb();
    res.status(201).json({ offer });
  });

  app.put('/api/admin/offers/:id', requireAdmin, (req, res) => {
    const idx = db.offers.findIndex((o) => o.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Offer not found.' });
      return;
    }
    const parsed = offerUpsertSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid offer details.' });
      return;
    }
    if (parsed.data.showInBanner) {
      db.offers = db.offers.map((o) => ({ ...o, showInBanner: false }));
    }
    db.offers[idx] = {
      ...db.offers[idx],
      ...parsed.data,
      updatedAt: new Date().toISOString(),
    };
    persistDb();
    res.json({ offer: db.offers[idx] });
  });

  app.delete('/api/admin/offers/:id', requireAdmin, (req, res) => {
    const before = db.offers.length;
    db.offers = db.offers.filter((o) => o.id !== req.params.id);
    if (db.offers.length === before) {
      res.status(404).json({ error: 'Offer not found.' });
      return;
    }
    persistDb();
    res.json({ deleted: true });
  });

  // Products CRUD
  app.post('/api/admin/products', requireAdmin, (req, res) => {
    const parsed = productUpsertSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Invalid product details.',
      });
      return;
    }
    const item: ProductItem = {
      id: `PRD-${Date.now().toString(36).toUpperCase()}`,
      ...parsed.data,
      isReferenceEntry: false,
      updatedAt: new Date().toISOString(),
    };
    db.products.unshift(item);
    persistDb();
    res.status(201).json({ product: item });
  });

  app.put('/api/admin/products/:id', requireAdmin, (req, res) => {
    const index = db.products.findIndex((p) => p.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    const parsed = productUpsertSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Invalid product details.',
      });
      return;
    }
    db.products[index] = {
      ...db.products[index],
      ...parsed.data,
      updatedAt: new Date().toISOString(),
    };
    persistDb();
    res.json({ product: db.products[index] });
  });

  app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
    const before = db.products.length;
    db.products = db.products.filter((p) => p.id !== req.params.id);
    if (db.products.length === before) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    persistDb();
    res.json({ deleted: true });
  });

  // Orders Management
  app.get('/api/admin/orders', requireAdmin, (_req, res) => {
    res.json({ orders: db.orders });
  });

  app.patch('/api/admin/orders/:id', requireAdmin, (req, res) => {
    const schema = z.object({
      status: z.enum(['pending', 'confirmed', 'dispatched', 'installed', 'delivered', 'cancelled']),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid order status.' });
      return;
    }
    const item = db.orders.find((o) => o.id === req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }
    item.status = parsed.data.status;
    item.updatedAt = new Date().toISOString();
    persistDb();
    res.json({ order: item });
  });

  // Enquiries & Testimonials Management
  app.get('/api/admin/enquiries', requireAdmin, (_req, res) => {
    res.json({ enquiries: db.enquiries });
  });

  app.patch('/api/admin/enquiries/:id', requireAdmin, (req, res) => {
    const schema = z.object({ status: z.enum(['new', 'contacted', 'quoted', 'closed']) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid status value.' });
      return;
    }
    const item = db.enquiries.find((e) => e.id === req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Enquiry not found.' });
      return;
    }
    item.status = parsed.data.status;
    persistDb();
    res.json({ enquiry: item });
  });

  app.get('/api/admin/testimonials', requireAdmin, (_req, res) => {
    res.json({ testimonials: db.testimonials });
  });

  app.patch('/api/admin/testimonials/:id', requireAdmin, (req, res) => {
    const schema = z.object({ status: z.enum(['pending', 'approved']) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid testimonial status.' });
      return;
    }
    const item = db.testimonials.find((t) => t.id === req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Review not found.' });
      return;
    }
    item.status = parsed.data.status;
    persistDb();
    res.json({ testimonial: item });
  });

  app.delete('/api/admin/testimonials/:id', requireAdmin, (req, res) => {
    const before = db.testimonials.length;
    db.testimonials = db.testimonials.filter((t) => t.id !== req.params.id);
    if (db.testimonials.length === before) {
      res.status(404).json({ error: 'Review not found.' });
      return;
    }
    persistDb();
    res.json({ deleted: true });
  });

  // --- HD & IP CCTV Package Builder, Multi-Brand Matrix, Audit Logs & Backup/Restore Routes ---
  registerPackageRoutes(app, {
    getDb: () => db,
    persistDb,
    appendAuditLog,
    createBackupSnapshot,
    listBackups,
    restoreFromBackupFile,
    restoreFromJsonPayload,
    exportFullDbSnapshot: () => {
      const { adminAuth: _hiddenAuth, ...safeSnapshot } = db;
      return safeSnapshot;
    },
    requireAdmin,
    rateLimit,
    verifyTokenFromRequest: (req) => {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;
      return verifySessionToken(token);
    },
    normalizePhoneTail,
  });

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  const distDir = path.resolve(__dirname, 'dist');
  const hasBuiltDist = fs.existsSync(path.join(distDir, 'index.html'));
  const isProd =
    process.env.NODE_ENV === 'production' ||
    (process.env.npm_lifecycle_event !== 'dev' && hasBuiltDist);

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(
      '/assets',
      express.static(path.join(distDir, 'assets'), { maxAge: '30d', immutable: true }),
    );
    app.use(express.static(distDir, { index: false }));
    app.get('*', (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `TRINETRA CCTV SOLUTIONS (${isProd ? 'production' : 'development'}) listening on http://0.0.0.0:${PORT}`,
    );
  });
}

startServer().catch((err) => {
  console.error('Failed to start TRINETRA server:', err);
  process.exit(1);
});
