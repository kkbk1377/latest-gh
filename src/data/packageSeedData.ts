import { ASSET_IMAGES } from './catalogData.ts';
import type {
  PackageBrand,
  PackageChannel,
  PackageComponent,
  PackageConfig,
  PackageMegapixel,
  PackageVariant,
} from '../types.ts';

export function buildDefaultPackageConfig(): PackageConfig {
  return {
    enabled: true,
    hdEnabled: true,
    ipEnabled: true,
    availableChannels: [4, 8, 16, 32],
    availableMegapixels: ['2MP', '3MP', '4MP', '5MP'],
    hdInstallationPerCameraInr: 500,
    ipInstallationPerCameraInr: 600,
    taxEnabled: false,
    taxLabel: 'GST',
    taxRatePercent: 18,
    quotationValidityDays: 15,
    quotationTerms: [
      'Genuine OEM sealed CCTV hardware supplied with manufacturer standard warranty.',
      'Installation charges cover camera mounting, connector termination, DVR/NVR setup, and mobile viewing app configuration.',
      'Extra cabling beyond included rolls, conduit piping, civil work, or tall scaffolding (above 15 ft) is billed on actuals.',
      'Prices are valid for 15 days from quotation date. Payment via Pay on Installation or UPI on Delivery.',
    ],
    discountRules: [
      {
        id: 'PKG-DISC-500',
        code: 'PKG500',
        title: 'Custom CCTV Package Launch Offer — Flat ₹500 Off',
        discountType: 'flat',
        discountValue: 500,
        minSubtotalInr: 10000,
        systemTypes: ['HD', 'IP'],
        active: true,
      },
      {
        id: 'PKG-DISC-IP5',
        code: 'IPPRO5',
        title: 'IP Surveillance Bulk Savings — 5% Off Above ₹25,000',
        discountType: 'percent',
        discountValue: 5,
        minSubtotalInr: 25000,
        systemTypes: ['IP'],
        active: true,
      },
    ],
    updatedAt: new Date().toISOString(),
  };
}

export function buildDefaultPackageBrands(): PackageBrand[] {
  return [
    {
      id: 'brand-cp-plus',
      name: 'CP Plus',
      shortMark: 'CP PLUS',
      accentHex: '#DC2626',
      logoUrl: '',
      description: 'India’s leading HD & IP CCTV cameras, DVR/NVR, SMPS, PoE switches & cabling.',
      active: true,
      sortOrder: 1,
    },
    {
      id: 'brand-hikvision',
      name: 'Hikvision',
      shortMark: 'HIKVISION',
      accentHex: '#E11D48',
      logoUrl: '',
      description: 'Global Turbo HD & AcuSense IP cameras, NVR/DVR, PoE switches & surveillance storage.',
      active: true,
      sortOrder: 2,
    },
    {
      id: 'brand-matrix',
      name: 'Matrix Comsec',
      shortMark: 'MATRIX',
      accentHex: '#B91C1C',
      logoUrl: '',
      description: 'Enterprise-grade Indian IP cameras, rugged NVRs & commercial PoE infrastructure.',
      active: true,
      sortOrder: 3,
    },
    {
      id: 'brand-prama',
      name: 'Prama',
      shortMark: 'PRAMA',
      accentHex: '#1D4ED8',
      logoUrl: '',
      description: 'Made-in-India HD & IP CCTV cameras, DVR/NVR systems & project networking gear.',
      active: true,
      sortOrder: 4,
    },
    {
      id: 'brand-sparsh',
      name: 'Sparsh',
      shortMark: 'SPARSH',
      accentHex: '#0F766E',
      logoUrl: '',
      description: 'STQC-certified Indian surveillance cameras, HD/IP recorders & commercial kits.',
      active: true,
      sortOrder: 5,
    },
    {
      id: 'brand-hi-focus',
      name: 'Hi-Focus',
      shortMark: 'HI-FOCUS',
      accentHex: '#0369A1',
      logoUrl: '',
      description: 'Value-engineered HD/IP cameras, DVR/NVR, PoE switches, SMPS & accessories.',
      active: true,
      sortOrder: 6,
    },
    {
      id: 'brand-power-cam',
      name: 'Power Cam',
      shortMark: 'POWER CAM',
      accentHex: '#B45309',
      logoUrl: '',
      description: 'Reliable SMPS power supplies, HD/IP cameras, connectors & installation hardware.',
      active: true,
      sortOrder: 7,
    },
    {
      id: 'brand-greatbox',
      name: 'Greatbox',
      shortMark: 'GREATBOX',
      accentHex: '#334155',
      logoUrl: '',
      description: 'Heavy-duty CCTV racks, PVC weatherproof boxes, SMPS, copper cables & connectors.',
      active: true,
      sortOrder: 8,
    },
  ];
}

export function buildDefaultPackageComponents(): PackageComponent[] {
  const mps: PackageMegapixel[] = ['2MP', '3MP', '4MP', '5MP'];
  const channels: PackageChannel[] = [4, 8, 16, 32];
  const components: PackageComponent[] = [];
  let order = 1;

  // 1. HD Dome & Bullet Cameras (2MP, 3MP, 4MP, 5MP)
  for (const mp of mps) {
    components.push({
      id: `cmp-hd-dome-${mp.toLowerCase()}`,
      name: `HD ${mp} Indoor Dome Camera`,
      group: 'CAMERA_DOME',
      systemTypes: ['HD'],
      supportedMegapixels: [mp],
      unitLabel: 'Camera',
      isCamera: true,
      recommendedFor: 'Shops, homes, offices, corridors & ceilings',
      description: `${mp} Full-HD coaxial dome camera with IR night vision, smart DNR, and wide-angle indoor lens.`,
      active: true,
      sortOrder: order++,
    });
    components.push({
      id: `cmp-hd-bullet-${mp.toLowerCase()}`,
      name: `HD ${mp} Outdoor Bullet Camera`,
      group: 'CAMERA_BULLET',
      systemTypes: ['HD'],
      supportedMegapixels: [mp],
      unitLabel: 'Camera',
      isCamera: true,
      recommendedFor: 'Gates, parking, perimeter walls & outdoor entrances',
      description: `${mp} IP66/IP67 weatherproof outdoor HD bullet camera with 20m–30m night vision IR.`,
      active: true,
      sortOrder: order++,
    });
  }

  // 2. IP Dome & Bullet Cameras (2MP, 3MP, 4MP, 5MP)
  for (const mp of mps) {
    components.push({
      id: `cmp-ip-dome-${mp.toLowerCase()}`,
      name: `IP ${mp} PoE Indoor Dome Camera`,
      group: 'CAMERA_DOME',
      systemTypes: ['IP'],
      supportedMegapixels: [mp],
      unitLabel: 'Camera',
      isCamera: true,
      recommendedFor: 'Offices, showrooms, hospitals & indoor halls',
      description: `${mp} ONVIF PoE IP dome camera with H.265+ compression, WDR, and built-in mic support.`,
      active: true,
      sortOrder: order++,
    });
    components.push({
      id: `cmp-ip-bullet-${mp.toLowerCase()}`,
      name: `IP ${mp} PoE Outdoor Bullet Camera`,
      group: 'CAMERA_BULLET',
      systemTypes: ['IP'],
      supportedMegapixels: [mp],
      unitLabel: 'Camera',
      isCamera: true,
      recommendedFor: 'Warehouses, factory gates, apartments & open yards',
      description: `${mp} IP67 weatherproof PoE IP bullet camera with 30m IR / ColorVu night vision and smart motion detection.`,
      active: true,
      sortOrder: order++,
    });
  }

  // 3. HD DVRs (4CH, 8CH, 16CH, 32CH)
  for (const ch of channels) {
    components.push({
      id: `cmp-dvr-${ch}ch`,
      name: `${ch}CH HD DVR (Digital Video Recorder)`,
      group: 'RECORDER',
      systemTypes: ['HD'],
      supportedChannels: [ch],
      unitLabel: 'Unit',
      isCamera: false,
      recommendedFor: `Up to ${ch} HD cameras with HDMI/VGA & mobile viewing`,
      description: `${ch}-Channel multi-format Turbo HD DVR supporting H.265+ compression and remote smartphone playback.`,
      active: true,
      sortOrder: order++,
    });
  }

  // 4. IP NVRs (4CH, 8CH, 16CH, 32CH)
  for (const ch of channels) {
    components.push({
      id: `cmp-nvr-${ch}ch`,
      name: `${ch}CH IP NVR (Network Video Recorder)`,
      group: 'RECORDER',
      systemTypes: ['IP'],
      supportedChannels: [ch],
      unitLabel: 'Unit',
      isCamera: false,
      recommendedFor: `Up to ${ch} IP cameras with 4K HDMI output & ONVIF`,
      description: `${ch}-Channel 4K Network Video Recorder supporting up to 5MP/8MP IP streams and remote cloud app.`,
      active: true,
      sortOrder: order++,
    });
  }

  // 5. HD SMPS (4CH, 8CH, 16CH, 32CH)
  for (const ch of channels) {
    components.push({
      id: `cmp-smps-${ch}ch`,
      name: `${ch}CH Regulated CCTV SMPS Power Supply`,
      group: 'POWER_SMPS',
      systemTypes: ['HD'],
      supportedChannels: [ch],
      unitLabel: 'Unit',
      isCamera: false,
      recommendedFor: `Powers up to ${ch} HD cameras with surge & short-circuit protection`,
      description: `12V DC ${ch}-Channel regulated CCTV SMPS with metal enclosure and individual LED channel indicators.`,
      active: true,
      sortOrder: order++,
    });
  }

  // 6. IP PoE Switches (4 Port, 8 Port, 16 Port)
  const poePorts: Array<{ ports: number; channels: PackageChannel[]; desc: string }> = [
    {
      ports: 4,
      channels: [4, 8, 16, 32],
      desc: '4-Port Gigabit/Fast Ethernet PoE+ Switch with 2 Uplink ports and 250m extended mode.',
    },
    {
      ports: 8,
      channels: [4, 8, 16, 32],
      desc: '8-Port PoE+ Surveillance Switch with 2 Gigabit Uplink ports and lightning protection.',
    },
    {
      ports: 16,
      channels: [8, 16, 32],
      desc: '16-Port Rackmount PoE+ Switch with 2 Gigabit SFP/RJ45 Uplinks for 16CH & 32CH IP systems.',
    },
  ];
  for (const poe of poePorts) {
    components.push({
      id: `cmp-poe-${poe.ports}p`,
      name: `${poe.ports}-Port PoE Switch (with Uplink)`,
      group: 'POE_SWITCH',
      systemTypes: ['IP'],
      supportedChannels: poe.channels,
      portCount: poe.ports,
      unitLabel: 'Switch',
      isCamera: false,
      recommendedFor: `Powers up to ${poe.ports} IP cameras over single CAT6 cable`,
      description: poe.desc,
      active: true,
      sortOrder: order++,
    });
  }

  // 7. Surveillance Hard Disks (500GB, 1TB, 2TB, 4TB, 8TB, 10TB) — Both HD & IP
  const hddSizes: Array<{ id: string; label: string; tb: number; note: string }> = [
    { id: '500gb', label: '500GB Surveillance Hard Disk', tb: 0.5, note: 'Entry retention for 2–4 camera setups' },
    { id: '1tb', label: '1TB Surveillance Hard Disk', tb: 1, note: 'Ideal for 4CH systems (~15–25 days)' },
    { id: '2tb', label: '2TB Surveillance Hard Disk', tb: 2, note: 'Ideal for 8CH systems (~15–25 days)' },
    { id: '4tb', label: '4TB Surveillance Hard Disk', tb: 4, note: 'Recommended for 8CH–16CH commercial recording' },
    { id: '8tb', label: '8TB Enterprise Surveillance Hard Disk', tb: 8, note: 'Long retention for 16CH–32CH sites' },
    { id: '10tb', label: '10TB Enterprise Surveillance Hard Disk', tb: 10, note: 'Maximum 24x7 retention for 16CH–32CH NVRs' },
  ];
  for (const hdd of hddSizes) {
    components.push({
      id: `cmp-hdd-${hdd.id}`,
      name: hdd.label,
      group: 'HDD',
      systemTypes: ['HD', 'IP'],
      storageTb: hdd.tb,
      unitLabel: 'Drive',
      isCamera: false,
      recommendedFor: hdd.note,
      description: `24×7 continuous-duty SATA surveillance hard drive engineered for zero-frame-drop DVR/NVR recording.`,
      active: true,
      sortOrder: order++,
    });
  }

  // 8. Racks (2U Mini, 2U, 4U Mini, 4U, 4U Big, 6U, 6U Big, Server Rack) — Both HD & IP
  const rackSpecs: Array<{ id: string; name: string; note: string }> = [
    { id: '2u-mini', name: '2U Mini Wall-Mount CCTV Rack', note: 'Compact 4CH DVR/NVR enclosure' },
    { id: '2u', name: '2U Standard Wall-Mount Rack', note: '4CH–8CH DVR/NVR + SMPS/PoE fit' },
    { id: '4u-mini', name: '4U Mini Network/CCTV Rack', note: 'Compact 8CH setup with lockable glass door' },
    { id: '4u', name: '4U Standard Wall-Mount Rack', note: 'Most popular for 8CH–16CH DVR/NVR + PoE + PDU' },
    { id: '4u-big', name: '4U Big Depth Wall-Mount Rack', note: 'Deep chassis for multi-bay NVR & cabling' },
    { id: '6u', name: '6U Standard Wall-Mount Rack', note: 'Commercial 16CH NVR + PoE switch + patch panel' },
    { id: '6u-big', name: '6U Big Depth Network Rack', note: 'Heavy-duty commercial 16CH–32CH control hub' },
    { id: 'server-rack', name: 'Floor-Standing Server Rack (12U–24U)', note: 'Enterprise 32CH NVR, UPS & multi-switch installations' },
  ];
  for (const rack of rackSpecs) {
    components.push({
      id: `cmp-rack-${rack.id}`,
      name: rack.name,
      group: 'RACK',
      systemTypes: ['HD', 'IP'],
      unitLabel: 'Rack',
      isCamera: false,
      recommendedFor: rack.note,
      description: `Powder-coated steel surveillance rack with lockable front glass door, ventilation & cable entry knockouts.`,
      active: true,
      sortOrder: order++,
    });
  }

  // 9. Cables (HD: 3+1 90m Roll; IP: CAT6 90m & 305m Roll)
  components.push({
    id: 'cmp-cable-3plus1-90m',
    name: '3+1 CCTV Pure Copper Cable – 90 Meter Roll',
    group: 'CABLE',
    systemTypes: ['HD'],
    unitLabel: 'Roll (90m)',
    isCamera: false,
    recommendedFor: '1 roll covers ~4 HD cameras (2 rolls for 8CH)',
    description: 'High-shielded 3+1 pure copper coaxial video + power CCTV cable roll (90 meters) for interference-free HD feeds.',
    active: true,
    sortOrder: order++,
  });

  components.push({
    id: 'cmp-cable-cat6-90m',
    name: 'CAT6 Pure Copper Network Cable – 90 Meter Roll',
    group: 'CABLE',
    systemTypes: ['IP'],
    unitLabel: 'Roll (90m)',
    isCamera: false,
    recommendedFor: 'Ideal for 4CH IP camera installations',
    description: '23AWG pure copper CAT6 UTP LAN cable (90m box) supporting Gigabit PoE IP camera data + power.',
    active: true,
    sortOrder: order++,
  });

  components.push({
    id: 'cmp-cable-cat6-305m',
    name: 'CAT6 Pure Copper Network Cable – 305 Meter Box',
    group: 'CABLE',
    systemTypes: ['IP'],
    unitLabel: 'Box (305m)',
    isCamera: false,
    recommendedFor: 'Best value for 8CH, 16CH & 32CH IP projects',
    description: 'Full 305-meter pure copper 23AWG CAT6 LAN cable drum engineered for long-run PoE IP surveillance.',
    active: true,
    sortOrder: order++,
  });

  // 10. Accessories (HD & IP specific)
  components.push({
    id: 'cmp-acc-pvc-box',
    name: 'Weatherproof PVC Junction Box (4×4)',
    group: 'ACCESSORY',
    systemTypes: ['HD', 'IP'],
    unitLabel: 'Box',
    isCamera: false,
    recommendedFor: '1 PVC box per camera to protect connectors',
    description: 'Heavy-duty fire-retardant 4×4 PVC camera junction box protecting BNC/DC or RJ45 terminations from dust & moisture.',
    active: true,
    sortOrder: order++,
  });

  components.push({
    id: 'cmp-acc-bnc',
    name: 'BNC Connectors / BNC Ready Lead Cables',
    group: 'ACCESSORY',
    systemTypes: ['HD'],
    unitLabel: 'Piece',
    isCamera: false,
    recommendedFor: '2 BNC connectors per HD camera (camera + DVR end)',
    description: 'Pure brass gold-pin BNC video connectors / molded leads ensuring low-loss HD video transmission.',
    active: true,
    sortOrder: order++,
  });

  components.push({
    id: 'cmp-acc-dc-pin',
    name: '12V DC Power Pins (Male Connector)',
    group: 'ACCESSORY',
    systemTypes: ['HD'],
    unitLabel: 'Piece',
    isCamera: false,
    recommendedFor: '1 DC pin per HD camera',
    description: 'Heavy-gauge 12V DC male power pin with secure screw/solder grip for stable HD camera power delivery.',
    active: true,
    sortOrder: order++,
  });

  components.push({
    id: 'cmp-acc-rj45',
    name: 'CAT6 RJ45 Gold-Plated Connectors (Jacks)',
    group: 'ACCESSORY',
    systemTypes: ['IP'],
    unitLabel: 'Piece',
    isCamera: false,
    recommendedFor: '2 RJ45 jacks per IP camera + uplink patch ends',
    description: 'High-contact 8P8C gold-plated RJ45 jacks for reliable PoE data and power crimping.',
    active: true,
    sortOrder: order++,
  });

  components.push({
    id: 'cmp-acc-poe-surge',
    name: 'IP Gigabit PoE Surge Protector / Weatherproof Coupler',
    group: 'ACCESSORY',
    systemTypes: ['IP'],
    unitLabel: 'Unit',
    isCamera: false,
    recommendedFor: 'Optional outdoor lightning & surge protection for IP poles',
    description: 'Inline RJ45 PoE surge arrestor & waterproof coupler for outdoor IP cameras mounted on metal poles.',
    active: true,
    sortOrder: order++,
  });

  return components;
}

/**
 * Generates realistic Indian market purchase prices, selling prices, stock, and
 * authentic brand-product compatibility matrix across all 8 TRINETRA partner brands.
 * Every price, brand compatibility, and stock count is 100% editable in Admin Panel.
 */
export function buildDefaultPackageVariants(): PackageVariant[] {
  const now = new Date().toISOString();
  const variants: PackageVariant[] = [];

  const add = (
    componentId: string,
    brandId: string,
    modelCode: string,
    specs: string,
    warranty: string,
    purchasePriceInr: number,
    sellingPriceInr: number,
    stockQty: number,
    imageUrl: string,
    lowStockThreshold = 5,
  ) => {
    variants.push({
      id: `var-${componentId.replace('cmp-', '')}-${brandId.replace('brand-', '')}`,
      componentId,
      brandId,
      modelCode,
      specs,
      warranty,
      purchasePriceInr,
      sellingPriceInr,
      stockQty,
      lowStockThreshold,
      imageUrl,
      active: true,
      updatedAt: now,
    });
  };

  // --- HD Cameras (7 surveillance brands; Matrix focuses on IP so realistically excluded from analog HD) ---
  const hdBrandMultiplier: Array<{
    brandId: string;
    prefix: string;
    mult: number;
    warranty: string;
  }> = [
    { brandId: 'brand-cp-plus', prefix: 'CP-UVC', mult: 1.0, warranty: '2 Years OEM Warranty' },
    { brandId: 'brand-hikvision', prefix: 'DS-2CE', mult: 1.08, warranty: '2 Years OEM Warranty' },
    { brandId: 'brand-prama', prefix: 'PT-HC', mult: 0.98, warranty: '2 Years OEM Warranty' },
    { brandId: 'brand-sparsh', prefix: 'SC-HD', mult: 1.02, warranty: '2 Years OEM Warranty' },
    { brandId: 'brand-hi-focus', prefix: 'HF-AHD', mult: 0.92, warranty: '2 Years OEM Warranty' },
    { brandId: 'brand-power-cam', prefix: 'PC-HD', mult: 0.88, warranty: '1 Year OEM Warranty' },
  ];

  const hdBaseDome: Record<PackageMegapixel, number> = {
    '2MP': 1050,
    '3MP': 1350,
    '4MP': 1650,
    '5MP': 1950,
  };
  const hdBaseBullet: Record<PackageMegapixel, number> = {
    '2MP': 1200,
    '3MP': 1500,
    '4MP': 1850,
    '5MP': 2150,
  };

  for (const mp of ['2MP', '3MP', '4MP', '5MP'] as PackageMegapixel[]) {
    for (const b of hdBrandMultiplier) {
      const domeSell = Math.round((hdBaseDome[mp] * b.mult) / 10) * 10;
      const domeBuy = Math.round((domeSell * 0.78) / 10) * 10;
      add(
        `cmp-hd-dome-${mp.toLowerCase()}`,
        b.brandId,
        `${b.prefix}-T${mp}D`,
        `${mp} Full-HD CMOS · 20m IR · 3.6mm Lens · DWDR`,
        b.warranty,
        domeBuy,
        domeSell,
        42,
        ASSET_IMAGES.domeCamera,
      );

      const bulletSell = Math.round((hdBaseBullet[mp] * b.mult) / 10) * 10;
      const bulletBuy = Math.round((bulletSell * 0.78) / 10) * 10;
      add(
        `cmp-hd-bullet-${mp.toLowerCase()}`,
        b.brandId,
        `${b.prefix}-B${mp}W`,
        `${mp} Outdoor IP67 · 25m Smart IR · Weatherproof`,
        b.warranty,
        bulletBuy,
        bulletSell,
        48,
        ASSET_IMAGES.bulletCamera,
      );
    }
  }

  // --- IP Cameras (7 surveillance brands including Matrix Comsec) ---
  const ipBrandMultiplier: Array<{
    brandId: string;
    prefix: string;
    mult: number;
    warranty: string;
  }> = [
    { brandId: 'brand-cp-plus', prefix: 'CP-UNC', mult: 1.0, warranty: '2 Years OEM Warranty' },
    { brandId: 'brand-hikvision', prefix: 'DS-2CD', mult: 1.12, warranty: '2 Years OEM Warranty' },
    { brandId: 'brand-matrix', prefix: 'SATATYA-CIB', mult: 1.24, warranty: '3 Years Enterprise Warranty' },
    { brandId: 'brand-prama', prefix: 'PT-NC', mult: 1.02, warranty: '2 Years OEM Warranty' },
    { brandId: 'brand-sparsh', prefix: 'SC-IP', mult: 1.05, warranty: '2 Years OEM Warranty' },
    { brandId: 'brand-hi-focus', prefix: 'HF-IP', mult: 0.94, warranty: '2 Years OEM Warranty' },
    { brandId: 'brand-power-cam', prefix: 'PC-IP', mult: 0.9, warranty: '1 Year OEM Warranty' },
  ];

  const ipBaseDome: Record<PackageMegapixel, number> = {
    '2MP': 2150,
    '3MP': 2550,
    '4MP': 3050,
    '5MP': 3650,
  };
  const ipBaseBullet: Record<PackageMegapixel, number> = {
    '2MP': 2350,
    '3MP': 2750,
    '4MP': 3300,
    '5MP': 3950,
  };

  for (const mp of ['2MP', '3MP', '4MP', '5MP'] as PackageMegapixel[]) {
    for (const b of ipBrandMultiplier) {
      const domeSell = Math.round((ipBaseDome[mp] * b.mult) / 10) * 10;
      const domeBuy = Math.round((domeSell * 0.79) / 10) * 10;
      add(
        `cmp-ip-dome-${mp.toLowerCase()}`,
        b.brandId,
        `${b.prefix}-${mp}D-POE`,
        `${mp} PoE IP Dome · H.265+ · True WDR · Built-in Mic`,
        b.warranty,
        domeBuy,
        domeSell,
        36,
        ASSET_IMAGES.domeCamera,
      );

      const bulletSell = Math.round((ipBaseBullet[mp] * b.mult) / 10) * 10;
      const bulletBuy = Math.round((bulletSell * 0.79) / 10) * 10;
      add(
        `cmp-ip-bullet-${mp.toLowerCase()}`,
        b.brandId,
        `${b.prefix}-${mp}B-POE`,
        `${mp} PoE IP Bullet · IP67 · 30m IR · ONVIF`,
        b.warranty,
        bulletBuy,
        bulletSell,
        40,
        ASSET_IMAGES.bulletCamera,
      );
    }
  }

  // --- HD DVRs (4CH, 8CH, 16CH, 32CH) ---
  const dvrBase: Record<PackageChannel, number> = {
    4: 3250,
    8: 4450,
    16: 8200,
    32: 16500,
  };
  for (const ch of [4, 8, 16, 32] as PackageChannel[]) {
    for (const b of hdBrandMultiplier) {
      const sell = Math.round((dvrBase[ch] * b.mult) / 50) * 50;
      const buy = Math.round((sell * 0.8) / 50) * 50;
      add(
        `cmp-dvr-${ch}ch`,
        b.brandId,
        `${b.prefix}-DVR${ch}`,
        `${ch}CH H.265+ Multi-Format DVR · Up to 5MP Lite · HDMI/VGA`,
        b.warranty,
        buy,
        sell,
        18,
        ASSET_IMAGES.nvrHardware,
        4,
      );
    }
  }

  // --- IP NVRs (4CH, 8CH, 16CH, 32CH) ---
  const nvrBase: Record<PackageChannel, number> = {
    4: 4300,
    8: 5900,
    16: 9600,
    32: 18500,
  };
  for (const ch of [4, 8, 16, 32] as PackageChannel[]) {
    for (const b of ipBrandMultiplier) {
      const sell = Math.round((nvrBase[ch] * b.mult) / 50) * 50;
      const buy = Math.round((sell * 0.8) / 50) * 50;
      add(
        `cmp-nvr-${ch}ch`,
        b.brandId,
        `${b.prefix}-NVR${ch}K`,
        `${ch}CH 4K H.265+ IP NVR · ${ch >= 16 ? 'Dual SATA' : 'Single SATA'} · Mobile Cloud`,
        b.warranty,
        buy,
        sell,
        16,
        ASSET_IMAGES.nvrHardware,
        4,
      );
    }
  }

  // --- SMPS (4CH, 8CH, 16CH, 32CH) ---
  const smpsBase: Record<PackageChannel, number> = {
    4: 580,
    8: 880,
    16: 1480,
    32: 2650,
  };
  const smpsBrands = [
    { brandId: 'brand-cp-plus', prefix: 'CP-DPS', mult: 1.05, warranty: '1 Year Warranty' },
    { brandId: 'brand-hikvision', prefix: 'DS-2FA', mult: 1.12, warranty: '1 Year Warranty' },
    { brandId: 'brand-power-cam', prefix: 'PC-SMPS', mult: 0.94, warranty: '1 Year Warranty' },
    { brandId: 'brand-greatbox', prefix: 'GB-SMPS', mult: 0.92, warranty: '1 Year Warranty' },
    { brandId: 'brand-hi-focus', prefix: 'HF-SMPS', mult: 0.98, warranty: '1 Year Warranty' },
  ];
  for (const ch of [4, 8, 16, 32] as PackageChannel[]) {
    for (const b of smpsBrands) {
      const sell = Math.round((smpsBase[ch] * b.mult) / 10) * 10;
      const buy = Math.round((sell * 0.72) / 10) * 10;
      add(
        `cmp-smps-${ch}ch`,
        b.brandId,
        `${b.prefix}-${ch}CH`,
        `12V DC ${ch}CH Regulated SMPS · Overload & Surge Protection`,
        b.warranty,
        buy,
        sell,
        30,
        ASSET_IMAGES.nvrHardware,
        5,
      );
    }
  }

  // --- PoE Switches (4 Port, 8 Port, 16 Port) ---
  const poeBase: Record<number, number> = {
    4: 1850,
    8: 3150,
    16: 7800,
  };
  const poeBrands = [
    { brandId: 'brand-cp-plus', prefix: 'CP-DNW', mult: 1.0, warranty: '2 Years Warranty' },
    { brandId: 'brand-hikvision', prefix: 'DS-3E', mult: 1.12, warranty: '2 Years Warranty' },
    { brandId: 'brand-matrix', prefix: 'MTX-POE', mult: 1.18, warranty: '2 Years Warranty' },
    { brandId: 'brand-hi-focus', prefix: 'HF-POE', mult: 0.94, warranty: '2 Years Warranty' },
    { brandId: 'brand-prama', prefix: 'PT-POE', mult: 1.02, warranty: '2 Years Warranty' },
    { brandId: 'brand-greatbox', prefix: 'GB-POE', mult: 0.92, warranty: '1 Year Warranty' },
  ];
  for (const ports of [4, 8, 16]) {
    for (const b of poeBrands) {
      const sell = Math.round((poeBase[ports] * b.mult) / 50) * 50;
      const buy = Math.round((sell * 0.78) / 50) * 50;
      add(
        `cmp-poe-${ports}p`,
        b.brandId,
        `${b.prefix}-${ports}P2U`,
        `${ports} PoE+ Ports + 2 Uplink · 250m Extend · 6KV Surge`,
        b.warranty,
        buy,
        sell,
        22,
        ASSET_IMAGES.nvrHardware,
        4,
      );
    }
  }

  // --- Hard Disks (500GB, 1TB, 2TB, 4TB, 8TB, 10TB) ---
  const hddBase: Record<string, number> = {
    '500gb': 2100,
    '1tb': 4250,
    '2tb': 5850,
    '4tb': 9200,
    '8tb': 17900,
    '10tb': 22900,
  };
  const hddBrands = [
    { brandId: 'brand-cp-plus', prefix: 'CP-HDD', mult: 1.0, note: 'Surveillance SATA III 24x7', warranty: '3 Years Warranty' },
    { brandId: 'brand-hikvision', prefix: 'HK-SURV', mult: 1.03, note: 'OEM Surveillance SATA III', warranty: '3 Years Warranty' },
    { brandId: 'brand-hi-focus', prefix: 'HF-HDD', mult: 0.98, note: 'Continuous-Duty Surveillance HDD', warranty: '2 Years Warranty' },
    { brandId: 'brand-prama', prefix: 'PT-HDD', mult: 1.01, note: '24x7 NVR/DVR Certified Drive', warranty: '3 Years Warranty' },
  ];
  for (const [sizeKey, basePrice] of Object.entries(hddBase)) {
    for (const b of hddBrands) {
      const sell = Math.round((basePrice * b.mult) / 50) * 50;
      const buy = Math.round((sell * 0.85) / 50) * 50;
      add(
        `cmp-hdd-${sizeKey}`,
        b.brandId,
        `${b.prefix}-${sizeKey.toUpperCase()}`,
        `${sizeKey.toUpperCase()} · ${b.note}`,
        b.warranty,
        buy,
        sell,
        24,
        ASSET_IMAGES.nvrHardware,
        4,
      );
    }
  }

  // --- Racks (all 8 sizes) ---
  const rackBase: Record<string, number> = {
    '2u-mini': 1150,
    '2u': 1450,
    '4u-mini': 1850,
    '4u': 2350,
    '4u-big': 2850,
    '6u': 3650,
    '6u-big': 4450,
    'server-rack': 12500,
  };
  const rackBrands = [
    { brandId: 'brand-greatbox', prefix: 'GB-RK', mult: 1.0, warranty: '1 Year Warranty' },
    { brandId: 'brand-cp-plus', prefix: 'CP-RK', mult: 1.1, warranty: '1 Year Warranty' },
    { brandId: 'brand-hi-focus', prefix: 'HF-RK', mult: 1.04, warranty: '1 Year Warranty' },
    { brandId: 'brand-power-cam', prefix: 'PC-RK', mult: 0.96, warranty: '1 Year Warranty' },
  ];
  for (const [rackKey, basePrice] of Object.entries(rackBase)) {
    for (const b of rackBrands) {
      const sell = Math.round((basePrice * b.mult) / 50) * 50;
      const buy = Math.round((sell * 0.75) / 50) * 50;
      add(
        `cmp-rack-${rackKey}`,
        b.brandId,
        `${b.prefix}-${rackKey.toUpperCase()}`,
        `CRCA Steel · Lockable Glass Front · Powder Coated`,
        b.warranty,
        buy,
        sell,
        15,
        ASSET_IMAGES.nvrHardware,
        3,
      );
    }
  }

  // --- Cables (3+1 90m, CAT6 90m, CAT6 305m) ---
  const cableBrands = [
    { brandId: 'brand-cp-plus', prefix: 'CP-CBL', mult: 1.04 },
    { brandId: 'brand-hikvision', prefix: 'DS-1LN', mult: 1.1 },
    { brandId: 'brand-greatbox', prefix: 'GB-CBL', mult: 0.94 },
    { brandId: 'brand-hi-focus', prefix: 'HF-CBL', mult: 0.98 },
    { brandId: 'brand-power-cam', prefix: 'PC-CBL', mult: 0.92 },
  ];
  for (const b of cableBrands) {
    const hd90 = Math.round((1350 * b.mult) / 10) * 10;
    add(
      'cmp-cable-3plus1-90m',
      b.brandId,
      `${b.prefix}-3P1-90M`,
      '90m Roll · Pure Bare Copper · Braided Shield',
      'Standard Manufacturing Warranty',
      Math.round((hd90 * 0.78) / 10) * 10,
      hd90,
      45,
      ASSET_IMAGES.installationTech,
      8,
    );

    const cat90 = Math.round((1950 * b.mult) / 10) * 10;
    add(
      'cmp-cable-cat6-90m',
      b.brandId,
      `${b.prefix}-CAT6-90M`,
      '90m Box · 23AWG Pure Copper · Gigabit PoE Ready',
      'Standard Manufacturing Warranty',
      Math.round((cat90 * 0.79) / 10) * 10,
      cat90,
      35,
      ASSET_IMAGES.installationTech,
      6,
    );

    const cat305 = Math.round((6200 * b.mult) / 50) * 50;
    add(
      'cmp-cable-cat6-305m',
      b.brandId,
      `${b.prefix}-CAT6-305M`,
      '305m Drum · 23AWG Pure Copper · Certified 550MHz',
      'Standard Manufacturing Warranty',
      Math.round((cat305 * 0.8) / 50) * 50,
      cat305,
      20,
      ASSET_IMAGES.installationTech,
      4,
    );
  }

  // --- Accessories (PVC Box, BNC, DC Pin, RJ45, PoE Surge) ---
  const accBrands = [
    { brandId: 'brand-greatbox', prefix: 'GB-ACC', mult: 1.0 },
    { brandId: 'brand-cp-plus', prefix: 'CP-ACC', mult: 1.15 },
    { brandId: 'brand-power-cam', prefix: 'PC-ACC', mult: 0.95 },
    { brandId: 'brand-hi-focus', prefix: 'HF-ACC', mult: 1.05 },
  ];

  for (const b of accBrands) {
    const pvcSell = Math.round(65 * b.mult);
    add(
      'cmp-acc-pvc-box',
      b.brandId,
      `${b.prefix}-PVC44`,
      '4×4 Weatherproof Heavy ABS/PVC Junction Box',
      'Replacement on Defect',
      Math.round(pvcSell * 0.65),
      pvcSell,
      250,
      ASSET_IMAGES.installationTech,
      25,
    );

    const bncSell = Math.round(35 * b.mult);
    add(
      'cmp-acc-bnc',
      b.brandId,
      `${b.prefix}-BNC`,
      'Pure Brass Gold-Pin BNC Video Connector / Lead',
      'Replacement on Defect',
      Math.round(bncSell * 0.6),
      bncSell,
      400,
      ASSET_IMAGES.installationTech,
      40,
    );

    const dcSell = Math.round(25 * b.mult);
    add(
      'cmp-acc-dc-pin',
      b.brandId,
      `${b.prefix}-DC12`,
      '12V Heavy-Gauge Male DC Power Connector',
      'Replacement on Defect',
      Math.round(dcSell * 0.6),
      dcSell,
      400,
      ASSET_IMAGES.installationTech,
      40,
    );

    const rjSell = Math.round(18 * b.mult);
    add(
      'cmp-acc-rj45',
      b.brandId,
      `${b.prefix}-RJ45`,
      'CAT6 Gold-Plated 8P8C PoE RJ45 Jack',
      'Replacement on Defect',
      Math.round(rjSell * 0.55),
      rjSell,
      500,
      ASSET_IMAGES.installationTech,
      50,
    );

    const surgeSell = Math.round((480 * b.mult) / 10) * 10;
    add(
      'cmp-acc-poe-surge',
      b.brandId,
      `${b.prefix}-SURGE`,
      'Inline Gigabit PoE Surge Protector + Weather Coupler',
      '1 Year Warranty',
      Math.round((surgeSell * 0.72) / 10) * 10,
      surgeSell,
      60,
      ASSET_IMAGES.installationTech,
      8,
    );
  }

  return variants;
}
