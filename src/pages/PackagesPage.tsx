import {
  AlertTriangle,
  Bookmark,
  Cable,
  Camera,
  Check,
  Cpu,
  FileText,
  HardDrive,
  Layers,
  Loader2,
  MessageCircle,
  Minus,
  Network,
  Plus,
  RotateCcw,
  Scale,
  Search,
  Server,
  ShoppingBag,
  Sparkles,
  Tag,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PackageCompareModal } from '../components/PackageCompareModal.tsx';
import { PackageQuotationModal } from '../components/PackageQuotationModal.tsx';
import { useBusiness } from '../context/BusinessContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import { formatWhatsAppUrl } from '../data/catalogData.ts';
import { api } from '../lib/api.ts';
import {
  buildRecommendedPackage,
  calculatePackage,
  getCompatibleVariantsForComponent,
  isComponentCompatible,
} from '../lib/packageEngine.ts';
import type {
  PackageCalculationInput,
  PackageCatalogData,
  PackageChannel,
  PackageComponent,
  PackageComponentGroup,
  PackageMegapixel,
  PackageSelectionItem,
  PackageSystemType,
  SavedPackageConfig,
} from '../types.ts';

const SAVED_PACKAGES_KEY = 'trinetra_saved_cctv_packages_v1';

function inr(value: number): string {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

interface SectionMeta {
  key: string;
  title: string;
  subtitle: string;
  groups: PackageComponentGroup[];
}

const SECTIONS: SectionMeta[] = [
  {
    key: 'cameras',
    title: '1. Select CCTV Cameras (Dome & Bullet)',
    subtitle: 'Mix indoor dome and outdoor bullet cameras across compatible brands up to your channel limit.',
    groups: ['CAMERA_DOME', 'CAMERA_BULLET'],
  },
  {
    key: 'recorder',
    title: '2. Video Recorder (DVR / NVR)',
    subtitle: 'Matched to your selected channel count for continuous recording & smartphone viewing.',
    groups: ['RECORDER'],
  },
  {
    key: 'power',
    title: '3. Power Supply / PoE Switch',
    subtitle: 'Regulated SMPS for HD systems or Gigabit/Fast PoE+ Switches for IP systems.',
    groups: ['POWER_SMPS', 'POE_SWITCH'],
  },
  {
    key: 'storage',
    title: '4. Surveillance Hard Disk (500GB – 10TB)',
    subtitle: '24×7 continuous-duty SATA drives — recording days update automatically below.',
    groups: ['HDD'],
  },
  {
    key: 'racks',
    title: '5. CCTV Wall & Server Racks',
    subtitle: 'Lockable powder-coated enclosures from 2U Mini to full Server Racks.',
    groups: ['RACK'],
  },
  {
    key: 'cables',
    title: '6. Cables & Installation Accessories',
    subtitle: 'Pure copper cabling, PVC boxes, and connectors tailored strictly to HD or IP.',
    groups: ['CABLE', 'ACCESSORY'],
  },
];

function groupIcon(group: PackageComponentGroup) {
  switch (group) {
    case 'CAMERA_DOME':
    case 'CAMERA_BULLET':
      return <Camera className="w-4 h-4 text-[#9E7216]" />;
    case 'RECORDER':
      return <Cpu className="w-4 h-4 text-[#9E7216]" />;
    case 'POWER_SMPS':
      return <Layers className="w-4 h-4 text-[#9E7216]" />;
    case 'POE_SWITCH':
      return <Network className="w-4 h-4 text-[#9E7216]" />;
    case 'HDD':
      return <HardDrive className="w-4 h-4 text-[#9E7216]" />;
    case 'RACK':
      return <Server className="w-4 h-4 text-[#9E7216]" />;
    case 'CABLE':
      return <Cable className="w-4 h-4 text-[#9E7216]" />;
    default:
      return <Wrench className="w-4 h-4 text-[#9E7216]" />;
  }
}

export function PackagesPage() {
  const { settings } = useBusiness();
  const { addPackageToCart, openDrawer } = useCart();

  const [catalog, setCatalog] = useState<PackageCatalogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [systemType, setSystemType] = useState<PackageSystemType>('HD');
  const [channel, setChannel] = useState<PackageChannel>(4);
  const [megapixel, setMegapixel] = useState<PackageMegapixel>('2MP');
  const [preferredBrandId, setPreferredBrandId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [discountInput, setDiscountInput] = useState('');
  const [appliedDiscountCode, setAppliedDiscountCode] = useState('');

  // State per componentId: { brandId, quantity }
  const [selections, setSelections] = useState<
    Record<string, { brandId: string; quantity: number }>
  >({});

  // Saved packages (localStorage)
  const [savedPackages, setSavedPackages] = useState<SavedPackageConfig[]>(() => {
    try {
      const raw = localStorage.getItem(SAVED_PACKAGES_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as SavedPackageConfig[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [showSavedPanel, setShowSavedPanel] = useState(false);
  const [saveName, setSaveName] = useState('');

  // Modals & UI feedback
  const [quotationOpen, setQuotationOpen] = useState(false);
  const [compareModal, setCompareModal] = useState<{
    open: boolean;
    tab: 'hd-vs-ip' | 'brands';
  }>({ open: false, tab: 'hd-vs-ip' });
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const applySelectionItems = useCallback(
    (items: PackageSelectionItem[], cat: PackageCatalogData) => {
      const next: Record<string, { brandId: string; quantity: number }> = {};
      for (const item of items) {
        if (item.quantity > 0) {
          next[item.componentId] = { brandId: item.brandId, quantity: item.quantity };
        }
      }
      // Ensure every component remembers a sensible default brand even at qty 0
      for (const comp of cat.components) {
        if (!next[comp.id]) {
          const compat = getCompatibleVariantsForComponent(comp.id, cat);
          if (compat.length > 0) {
            next[comp.id] = { brandId: compat[0].brand.id, quantity: 0 };
          }
        }
      }
      setSelections(next);
    },
    [],
  );

  // Load live catalog from Express backend
  useEffect(() => {
    let active = true;
    api
      .getPackageCatalog()
      .then((data) => {
        if (!active) return;
        setCatalog(data);
        const initialSystem: PackageSystemType = data.config.hdEnabled
          ? 'HD'
          : data.config.ipEnabled
            ? 'IP'
            : 'HD';
        const initialChannel = data.config.availableChannels[0] ?? 4;
        const initialMp = data.config.availableMegapixels[0] ?? '2MP';
        setSystemType(initialSystem);
        setChannel(initialChannel);
        setMegapixel(initialMp);
        const recommended = buildRecommendedPackage(
          initialSystem,
          initialChannel,
          initialMp,
          undefined,
          data,
        );
        applySelectionItems(recommended, data);
      })
      .catch((err) => {
        if (!active) return;
        setLoadError(err instanceof Error ? err.message : 'Unable to load CCTV Package Catalog.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [applySelectionItems]);

  useEffect(() => {
    try {
      localStorage.setItem(SAVED_PACKAGES_KEY, JSON.stringify(savedPackages));
    } catch {
      // ignore
    }
  }, [savedPackages]);

  // Compatible components for current systemType, channel, megapixel
  const compatibleComponents = useMemo(() => {
    if (!catalog) return [];
    return catalog.components
      .filter((c) => isComponentCompatible(c, systemType, channel, megapixel))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [catalog, systemType, channel, megapixel]);

  const activeItemsList: PackageSelectionItem[] = useMemo(() => {
    const compatSet = new Set(compatibleComponents.map((c) => c.id));
    const list: PackageSelectionItem[] = [];
    for (const [componentId, sel] of Object.entries(selections)) {
      if (compatSet.has(componentId) && sel.quantity > 0 && sel.brandId) {
        list.push({ componentId, brandId: sel.brandId, quantity: sel.quantity });
      }
    }
    return list;
  }, [compatibleComponents, selections]);

  const calcInput: PackageCalculationInput = useMemo(
    () => ({
      systemType,
      channel,
      megapixel,
      items: activeItemsList,
      discountCode: appliedDiscountCode,
    }),
    [systemType, channel, megapixel, activeItemsList, appliedDiscountCode],
  );

  const calculation = useMemo(() => {
    if (!catalog) return null;
    return calculatePackage(calcInput, catalog);
  }, [calcInput, catalog]);

  // Handlers for switching System Type / Channel / Megapixel cleanly
  const handleSystemChange = (nextSystem: PackageSystemType) => {
    if (!catalog || nextSystem === systemType) return;
    setSystemType(nextSystem);
    setAppliedDiscountCode('');
    setDiscountInput('');
    const rec = buildRecommendedPackage(
      nextSystem,
      channel,
      megapixel,
      preferredBrandId || undefined,
      catalog,
    );
    applySelectionItems(rec, catalog);
    showToast(`Switched to ${nextSystem} CCTV Package (${channel}CH · ${megapixel})`);
  };

  const handleChannelChange = (nextCh: PackageChannel) => {
    if (!catalog || nextCh === channel) return;
    setChannel(nextCh);
    const rec = buildRecommendedPackage(
      systemType,
      nextCh,
      megapixel,
      preferredBrandId || undefined,
      catalog,
    );
    applySelectionItems(rec, catalog);
  };

  const handleMegapixelChange = (nextMp: PackageMegapixel) => {
    if (!catalog || nextMp === megapixel) return;
    setMegapixel(nextMp);
    // Preserve camera counts & non-camera items when swapping megapixel!
    const oldDome = compatibleComponents.find((c) => c.group === 'CAMERA_DOME');
    const oldBullet = compatibleComponents.find((c) => c.group === 'CAMERA_BULLET');
    const domeQty = oldDome ? (selections[oldDome.id]?.quantity ?? 0) : 0;
    const domeBrand = oldDome ? selections[oldDome.id]?.brandId : undefined;
    const bulletQty = oldBullet ? (selections[oldBullet.id]?.quantity ?? 0) : 0;
    const bulletBrand = oldBullet ? selections[oldBullet.id]?.brandId : undefined;

    const newDomeId = `cmp-${systemType.toLowerCase()}-dome-${nextMp.toLowerCase()}`;
    const newBulletId = `cmp-${systemType.toLowerCase()}-bullet-${nextMp.toLowerCase()}`;

    setSelections((prev) => {
      const updated = { ...prev };
      if (oldDome) updated[oldDome.id] = { ...updated[oldDome.id], quantity: 0 };
      if (oldBullet) updated[oldBullet.id] = { ...updated[oldBullet.id], quantity: 0 };

      const domeCompat = getCompatibleVariantsForComponent(newDomeId, catalog);
      if (domeCompat.length > 0) {
        const chosenBrand =
          domeCompat.find((v) => v.brand.id === domeBrand)?.brand.id ?? domeCompat[0].brand.id;
        updated[newDomeId] = { brandId: chosenBrand, quantity: domeQty };
      }

      const bulletCompat = getCompatibleVariantsForComponent(newBulletId, catalog);
      if (bulletCompat.length > 0) {
        const chosenBrand =
          bulletCompat.find((v) => v.brand.id === bulletBrand)?.brand.id ??
          bulletCompat[0].brand.id;
        updated[newBulletId] = { brandId: chosenBrand, quantity: bulletQty };
      }
      return updated;
    });
  };

  const handleApplyPreferredBrand = (brandId: string) => {
    setPreferredBrandId(brandId);
    if (!catalog || !brandId) return;
    const brandObj = catalog.brands.find((b) => b.id === brandId);
    let swapped = 0;
    setSelections((prev) => {
      const next = { ...prev };
      for (const comp of compatibleComponents) {
        const hasBrand = catalog.variants.some(
          (v) => v.active && v.componentId === comp.id && v.brandId === brandId,
        );
        if (hasBrand && next[comp.id]) {
          next[comp.id] = { ...next[comp.id], brandId };
          if (next[comp.id].quantity > 0) swapped += 1;
        }
      }
      return next;
    });
    if (brandObj) {
      showToast(`Applied ${brandObj.name} to ${swapped} compatible active component(s).`);
    }
  };

  const handleQuantityChange = (comp: PackageComponent, nextQtyRaw: number) => {
    if (!catalog || !calculation) return;
    const currentQty = selections[comp.id]?.quantity ?? 0;
    let nextQty = Math.max(0, Math.min(200, Math.floor(nextQtyRaw) || 0));

    // Enforce channel camera capacity strictly on increase
    if (comp.isCamera && nextQty > currentQty) {
      const otherCameras = calculation.totalCameraCount - currentQty;
      const maxForThis = Math.max(0, channel - otherCameras);
      if (nextQty > maxForThis) {
        nextQty = maxForThis;
        showToast(
          `Channel limit reached: ${channel}CH ${systemType === 'HD' ? 'DVR' : 'NVR'} supports maximum ${channel} cameras.`,
        );
      }
    }

    const compat = getCompatibleVariantsForComponent(comp.id, catalog);
    const defaultBrandId = compat[0]?.brand.id ?? '';
    setSelections((prev) => ({
      ...prev,
      [comp.id]: {
        brandId: prev[comp.id]?.brandId || defaultBrandId,
        quantity: nextQty,
      },
    }));
  };

  const handleBrandChange = (comp: PackageComponent, brandId: string) => {
    setSelections((prev) => ({
      ...prev,
      [comp.id]: {
        brandId,
        quantity: prev[comp.id]?.quantity ?? 0,
      },
    }));
  };

  const handleAutoFill = () => {
    if (!catalog) return;
    const rec = buildRecommendedPackage(
      systemType,
      channel,
      megapixel,
      preferredBrandId || undefined,
      catalog,
    );
    applySelectionItems(rec, catalog);
    showToast(`Auto-filled recommended ${systemType} ${channel}CH ${megapixel} complete kit.`);
  };

  const handleClearAll = () => {
    if (!catalog) return;
    applySelectionItems([], catalog);
    setAppliedDiscountCode('');
    setDiscountInput('');
    showToast('Cleared package selections. Installation reset to ₹0.');
  };

  const handleAddToCart = () => {
    if (!calculation || !calculation.valid) return;
    addPackageToCart({
      label: `${systemType} ${channel}CH ${megapixel} Custom CCTV Package (${calculation.totalCameraCount} Cams)`,
      input: calcInput,
      preview: calculation,
    });
    showToast('Custom CCTV Package added to your Cart!');
    openDrawer();
  };

  const handleSaveConfig = () => {
    if (!calculation || !calculation.valid) return;
    const label =
      saveName.trim() ||
      `${systemType} ${channel}CH ${megapixel} (${calculation.totalCameraCount} Cams)`;
    const entry: SavedPackageConfig = {
      id: `SAV-${Date.now().toString(36).toUpperCase()}`,
      name: label,
      input: calcInput,
      summaryTotalInr: calculation.grandTotalInr,
      cameraCount: calculation.totalCameraCount,
      savedAt: new Date().toISOString(),
    };
    setSavedPackages((prev) => [entry, ...prev].slice(0, 15));
    setSaveName('');
    showToast(`Saved "${label}" for quick reorder.`);
  };

  const handleLoadSaved = (saved: SavedPackageConfig) => {
    if (!catalog) return;
    setSystemType(saved.input.systemType);
    setChannel(saved.input.channel);
    setMegapixel(saved.input.megapixel);
    setAppliedDiscountCode(saved.input.discountCode || '');
    setDiscountInput(saved.input.discountCode || '');
    applySelectionItems(saved.input.items, catalog);
    setShowSavedPanel(false);
    showToast(`Loaded saved configuration "${saved.name}".`);
  };

  const handleDeleteSaved = (id: string) => {
    setSavedPackages((prev) => prev.filter((s) => s.id !== id));
  };

  const handleApplyPromoCode = (codeRaw?: string) => {
    const code = (codeRaw ?? discountInput).trim().toUpperCase();
    setDiscountInput(code);
    setAppliedDiscountCode(code);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-600">
        <Loader2 className="w-7 h-7 animate-spin text-[#0B1B36]" />
        <p className="text-sm font-medium">Loading TRINETRA HD &amp; IP CCTV Package Builder...</p>
      </div>
    );
  }

  if (loadError || !catalog || !calculation) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-amber-600 mx-auto" />
        <h1 className="font-display font-bold text-xl text-[#0B1B36]">
          Package Builder Temporarily Unavailable
        </h1>
        <p className="text-sm text-slate-600">{loadError || 'Unable to load catalog.'}</p>
      </div>
    );
  }

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredComponents = normalizedSearch
    ? compatibleComponents.filter((c) => {
        const variants = getCompatibleVariantsForComponent(c.id, catalog);
        const brandMatch = variants.some(
          (v) =>
            v.brand.name.toLowerCase().includes(normalizedSearch) ||
            v.variant.modelCode.toLowerCase().includes(normalizedSearch),
        );
        return (
          c.name.toLowerCase().includes(normalizedSearch) ||
          c.description.toLowerCase().includes(normalizedSearch) ||
          (c.recommendedFor || '').toLowerCase().includes(normalizedSearch) ||
          brandMatch
        );
      })
    : compatibleComponents;

  const cameraCapacityPercent = Math.min(
    100,
    Math.round((calculation.totalCameraCount / channel) * 100),
  );

  const whatsAppText = `Hello ${settings.businessName},\nI built a custom CCTV Package on ${settings.domain.replace(/^https?:\/\//, '')}:\n\nType: ${systemType} CCTV · ${channel}CH · ${megapixel}\nCameras: ${calculation.totalCameraCount} (${calculation.domeCameraCount} Dome, ${calculation.bulletCameraCount} Bullet)\n\nSelected Components:\n${calculation.lines
    .map((l) => `• ${l.quantity}× ${l.brandName} ${l.componentName} (${inr(l.lineTotalInr)})`)
    .join('\n')}\n\nProducts Subtotal: ${inr(calculation.productSubtotalInr)}\n${systemType} Installation (${calculation.totalCameraCount} × ${inr(calculation.installationRatePerCameraInr)}): ${inr(calculation.installationTotalInr)}${calculation.discountInr > 0 ? `\nDiscount (${calculation.discountCode}): -${inr(calculation.discountInr)}` : ''}${calculation.taxEnabled && calculation.taxInr > 0 ? `\n${calculation.taxLabel} (${calculation.taxRatePercent}%): ${inr(calculation.taxInr)}` : ''}\nGrand Total: ${inr(calculation.grandTotalInr)}\n\nPlease confirm availability and installation schedule.`;

  const activePackageOffers = catalog.config.discountRules.filter(
    (r) => r.active && r.systemTypes.includes(systemType),
  );

  return (
    <div className="bg-[#F8FAFC] pb-24 lg:pb-14">
      {/* Compact Toast */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-20 lg:bottom-6 right-4 z-40 max-w-md px-4 py-3 rounded-lg bg-[#0B1B36] text-white text-xs font-medium shadow-xl border border-[#C99B2E]/50 flex items-center gap-2"
        >
          <Check className="w-4 h-4 text-[#DFB85A] shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Hero Header Band */}
      <section className="bg-[#0B1B36] text-white border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-2xl space-y-2">
              <p className="text-xs font-semibold tracking-widest uppercase text-[#DFB85A]">
                PACKAGES · Interactive Multi-Brand Configurator
              </p>
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl lg:text-4xl tracking-tight text-white">
                HD &amp; IP CCTV Package Builder
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                Select your system type, channel size, camera megapixels, and preferred brand for
                every component. Transparent per-camera installation ({inr(catalog.config.hdInstallationPerCameraInr)}/cam HD ·{' '}
                {inr(catalog.config.ipInstallationPerCameraInr)}/cam IP) calculates live with instant A4 quotation.
              </p>
            </div>

            {/* Quick Utility Actions */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleAutoFill}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-[#C99B2E] text-[#061022] text-xs font-bold hover:bg-[#DFB85A] transition-colors whitespace-nowrap cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto-Fill Recommended Kit</span>
              </button>
              <button
                type="button"
                onClick={() => setCompareModal({ open: true, tab: 'hd-vs-ip' })}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-white/25 bg-white/5 text-white text-xs font-semibold hover:bg-white/10 transition-colors whitespace-nowrap cursor-pointer"
              >
                <Scale className="w-3.5 h-3.5 text-[#DFB85A]" />
                <span>Compare HD vs IP</span>
              </button>
              <button
                type="button"
                onClick={() => setCompareModal({ open: true, tab: 'brands' })}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-white/25 bg-white/5 text-white text-xs font-semibold hover:bg-white/10 transition-colors whitespace-nowrap cursor-pointer"
              >
                <span>Compare Brands</span>
              </button>
              <button
                type="button"
                onClick={() => setShowSavedPanel((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-white/25 bg-white/5 text-white text-xs font-semibold hover:bg-white/10 transition-colors whitespace-nowrap cursor-pointer"
              >
                <Bookmark className="w-3.5 h-3.5 text-[#DFB85A]" />
                <span>Saved ({savedPackages.length})</span>
              </button>
            </div>
          </div>

          {/* Primary System Type Tabs: HD CCTV PACKAGES vs IP CCTV PACKAGES */}
          <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
            <button
              type="button"
              disabled={!catalog.config.hdEnabled}
              onClick={() => handleSystemChange('HD')}
              className={`text-left px-5 py-4 rounded-xl border transition-all cursor-pointer disabled:opacity-40 ${
                systemType === 'HD'
                  ? 'bg-white text-[#0B1B36] border-[#C99B2E] shadow-sm'
                  : 'bg-[#13294E]/70 text-white border-white/15 hover:border-white/35'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-display font-bold text-base">HD CCTV PACKAGES</span>
                <span
                  className={`font-mono text-xs font-bold ${
                    systemType === 'HD' ? 'text-[#9E7216]' : 'text-[#DFB85A]'
                  }`}
                >
                  {inr(catalog.config.hdInstallationPerCameraInr)} / cam install
                </span>
              </div>
              <p
                className={`text-xs mt-1 ${
                  systemType === 'HD' ? 'text-slate-600' : 'text-slate-300'
                }`}
              >
                DVR · SMPS · 3+1 Copper Cable · BNC &amp; DC Pins · Value Surveillance
              </p>
            </button>

            <button
              type="button"
              disabled={!catalog.config.ipEnabled}
              onClick={() => handleSystemChange('IP')}
              className={`text-left px-5 py-4 rounded-xl border transition-all cursor-pointer disabled:opacity-40 ${
                systemType === 'IP'
                  ? 'bg-white text-[#0B1B36] border-[#C99B2E] shadow-sm'
                  : 'bg-[#13294E]/70 text-white border-white/15 hover:border-white/35'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-display font-bold text-base">IP CCTV PACKAGES</span>
                <span
                  className={`font-mono text-xs font-bold ${
                    systemType === 'IP' ? 'text-[#9E7216]' : 'text-[#DFB85A]'
                  }`}
                >
                  {inr(catalog.config.ipInstallationPerCameraInr)} / cam install
                </span>
              </div>
              <p
                className={`text-xs mt-1 ${
                  systemType === 'IP' ? 'text-slate-600' : 'text-slate-300'
                }`}
              >
                4K NVR · PoE Switch · CAT6 Copper Cable · RJ45 Jacks · High Clarity
              </p>
            </button>
          </div>
        </div>
      </section>

      {/* Saved Packages Collapsible Bar */}
      {showSavedPanel && (
        <section className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-sm text-[#0B1B36]">
                Saved Package Configurations (Quick Reorder)
              </h2>
              <button
                type="button"
                onClick={() => setShowSavedPanel(false)}
                className="text-slate-500 hover:text-[#0B1B36] p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {savedPackages.length === 0 ? (
              <p className="text-xs text-slate-600">
                No saved packages yet. Use “Save Package” in the right summary panel to bookmark any
                custom build for instant reordering.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {savedPackages.map((s) => (
                  <div
                    key={s.id}
                    className="p-3.5 rounded-lg border border-slate-200 bg-[#F8FAFC] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-display font-bold text-xs text-[#0B1B36] truncate">
                        {s.name}
                      </p>
                      <p className="text-[11px] text-slate-600 font-mono tabular-nums mt-0.5">
                        {s.input.systemType} · {s.input.channel}CH · {s.input.megapixel} ·{' '}
                        {inr(s.summaryTotalInr)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleLoadSaved(s)}
                        className="px-2.5 py-1.5 rounded-md bg-[#0B1B36] text-white text-[11px] font-semibold hover:bg-[#13294E] cursor-pointer"
                      >
                        Load
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSaved(s.id)}
                        aria-label="Delete saved package"
                        className="p-1.5 text-slate-400 hover:text-rose-700 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Main 2-Column Configurator Workspace */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Controls & Components (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Configuration Control Bar: Channels, Megapixels, Preferred Brand */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-5">
              {/* Channel Cards */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Channel Size ({systemType === 'HD' ? 'DVR' : 'NVR'} Capacity)
                  </label>
                  <span className="text-xs text-slate-500">
                    Fewer cameras allowed · Never exceeds channel limit
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {catalog.config.availableChannels.map((ch) => {
                    const active = channel === ch;
                    return (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => handleChannelChange(ch)}
                        className={`px-3.5 py-3 rounded-lg border text-left transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#0B1B36] text-white border-[#0B1B36]'
                            : 'bg-white text-[#0B1B36] border-slate-200 hover:border-[#0B1B36]'
                        }`}
                      >
                        <p className="font-mono font-bold text-base tabular-nums">{ch}CH</p>
                        <p
                          className={`text-[11px] mt-0.5 ${
                            active ? 'text-[#DFB85A]' : 'text-slate-500'
                          }`}
                        >
                          Up to {ch} Cameras
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Megapixel & Quick Brand Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Camera Resolution (Megapixels)
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {catalog.config.availableMegapixels.map((mp) => {
                      const active = megapixel === mp;
                      return (
                        <button
                          key={mp}
                          type="button"
                          onClick={() => handleMegapixelChange(mp)}
                          className={`py-2.5 px-2 rounded-lg border font-mono text-xs font-bold transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#0B1B36] text-white border-[#0B1B36]'
                              : 'bg-white text-[#0B1B36] border-slate-200 hover:border-[#0B1B36]'
                          }`}
                        >
                          {mp}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="preferred-brand-select"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2"
                  >
                    Quick Brand Switch (All Compatible Items)
                  </label>
                  <select
                    id="preferred-brand-select"
                    value={preferredBrandId}
                    onChange={(e) => handleApplyPreferredBrand(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-xs font-semibold text-[#0B1B36] bg-white"
                  >
                    <option value="">Mix &amp; Match Individually (All 8+ Brands)</option>
                    {catalog.brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        Prefer {b.name} wherever compatible
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Camera Capacity Meter & Search */}
              <div className="pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-7 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#0B1B36]">
                      Camera Slots:{' '}
                      <span className="font-mono tabular-nums">
                        {calculation.totalCameraCount} / {channel}
                      </span>{' '}
                      <span className="text-slate-500 font-normal">
                        ({calculation.domeCameraCount} Dome · {calculation.bulletCameraCount} Bullet)
                      </span>
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-[#9E7216]">
                      {calculation.remainingCameraSlots} left
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-200 ${
                        calculation.totalCameraCount > channel
                          ? 'bg-rose-600'
                          : 'bg-[#0B1B36]'
                      }`}
                      style={{ width: `${cameraCapacityPercent}%` }}
                    />
                  </div>
                </div>

                <div className="md:col-span-5 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter components or brands..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Validation Errors Banner */}
            {calculation.errors.length > 0 && (
              <div
                role="alert"
                className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1"
              >
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
                  <span>Please resolve before checkout or quotation:</span>
                </p>
                <ul className="list-disc pl-5 space-y-0.5">
                  {calculation.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Component Selection Sections */}
            {SECTIONS.map((section) => {
              const sectionComponents = filteredComponents.filter((c) =>
                section.groups.includes(c.group),
              );
              if (sectionComponents.length === 0) return null;

              return (
                <section
                  key={section.key}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden"
                >
                  <div className="px-5 py-4 border-b border-slate-200 bg-[#F8FAFC] flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="font-display font-bold text-sm sm:text-base text-[#0B1B36]">
                        {section.title}
                      </h2>
                      <p className="text-xs text-slate-600 mt-0.5">{section.subtitle}</p>
                    </div>
                    {section.key === 'storage' && calculation.estimatedRecordingDays && (
                      <span className="font-mono text-xs font-semibold text-[#0B1B36]">
                        Est. ~{calculation.estimatedRecordingDays} days 24×7 recording
                      </span>
                    )}
                  </div>

                  <div className="divide-y divide-slate-100">
                    {sectionComponents.map((comp) => {
                      const compatVariants = getCompatibleVariantsForComponent(comp.id, catalog);
                      if (compatVariants.length === 0) return null;

                      const currentSel = selections[comp.id] ?? {
                        brandId: compatVariants[0].brand.id,
                        quantity: 0,
                      };
                      const activePair =
                        compatVariants.find((v) => v.brand.id === currentSel.brandId) ??
                        compatVariants[0];
                      const activeQty = currentSel.quantity;
                      const lineTotal = activeQty * activePair.variant.sellingPriceInr;
                      const cameraLimitReached =
                        comp.isCamera && calculation.totalCameraCount >= channel;

                      return (
                        <div
                          key={comp.id}
                          className={`p-4 sm:px-5 transition-colors ${
                            activeQty > 0 ? 'bg-amber-50/25' : 'bg-white'
                          }`}
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            {/* Left: Component Info */}
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className="w-9 h-9 rounded-lg bg-[#F8FAFC] border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                                {groupIcon(comp.group)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-baseline gap-x-2">
                                  <h3 className="font-display font-bold text-sm text-[#0B1B36]">
                                    {comp.name}
                                  </h3>
                                  <span className="text-[11px] font-mono text-slate-500">
                                    {activePair.variant.modelCode}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                                  {activePair.variant.specs || comp.description}
                                </p>
                                <p className="text-[11px] text-slate-500 mt-1">
                                  {comp.recommendedFor ? `${comp.recommendedFor} · ` : ''}
                                  {activePair.variant.warranty} ·{' '}
                                  <span
                                    className={
                                      activePair.variant.stockQty > 0
                                        ? 'text-emerald-700 font-medium'
                                        : 'text-rose-700 font-medium'
                                    }
                                  >
                                    {activePair.variant.stockQty > 0
                                      ? `In Stock (${activePair.variant.stockQty})`
                                      : 'Out of Stock'}
                                  </span>
                                </p>
                              </div>
                            </div>

                            {/* Right: Brand Selector, Unit Price & Quantity Controls */}
                            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
                              <div className="w-full sm:w-44">
                                <label className="sr-only" htmlFor={`brand-${comp.id}`}>
                                  Brand for {comp.name}
                                </label>
                                <select
                                  id={`brand-${comp.id}`}
                                  value={activePair.brand.id}
                                  onChange={(e) => handleBrandChange(comp, e.target.value)}
                                  className="w-full px-2.5 py-2 rounded-lg border border-slate-300 text-xs font-medium text-[#0B1B36] bg-white"
                                >
                                  {compatVariants.map(({ brand, variant }) => (
                                    <option key={variant.id} value={brand.id}>
                                      {brand.name} — {inr(variant.sellingPriceInr)}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="w-20 text-right">
                                <p className="font-mono tabular-nums text-xs font-bold text-[#0B1B36]">
                                  {inr(activePair.variant.sellingPriceInr)}
                                </p>
                                <p className="text-[10px] text-slate-500">per {comp.unitLabel}</p>
                              </div>

                              <div className="inline-flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden">
                                <button
                                  type="button"
                                  disabled={activeQty <= 0}
                                  onClick={() => handleQuantityChange(comp, activeQty - 1)}
                                  aria-label={`Decrease quantity of ${comp.name}`}
                                  className="w-8 h-8 flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-35 cursor-pointer"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <input
                                  type="number"
                                  min={0}
                                  max={comp.isCamera ? channel : 200}
                                  value={activeQty}
                                  onChange={(e) =>
                                    handleQuantityChange(comp, Number(e.target.value))
                                  }
                                  aria-label={`Quantity for ${comp.name}`}
                                  className="w-11 text-center text-xs font-mono tabular-nums font-bold text-[#0B1B36] focus:outline-none"
                                />
                                <button
                                  type="button"
                                  disabled={cameraLimitReached}
                                  onClick={() => handleQuantityChange(comp, activeQty + 1)}
                                  aria-label={`Increase quantity of ${comp.name}`}
                                  className="w-8 h-8 flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-35 cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="w-20 text-right hidden sm:block">
                                <p className="font-mono tabular-nums text-xs font-bold text-[#0B1B36]">
                                  {activeQty > 0 ? inr(lineTotal) : '—'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>

          {/* RIGHT COLUMN: Sticky Live Price Breakdown & Actions (4 cols) */}
          <aside className="lg:col-span-4 lg:sticky lg:top-20 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="px-5 py-4 bg-[#0B1B36] text-white flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-[#DFB85A] font-semibold">
                    Live Package Summary
                  </p>
                  <p className="font-display font-bold text-base">
                    {systemType} CCTV · {channel}CH · {megapixel}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClearAll}
                  title="Clear all selections"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-white/20 text-[11px] text-slate-200 hover:bg-white/10 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Itemized Lines */}
                {calculation.lines.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500 space-y-2">
                    <p>No components selected yet.</p>
                    <button
                      type="button"
                      onClick={handleAutoFill}
                      className="text-[#9E7216] font-semibold underline cursor-pointer"
                    >
                      Auto-Fill Recommended {channel}CH Kit
                    </button>
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 pr-1">
                    {calculation.lines.map((line) => (
                      <div
                        key={line.variantId}
                        className="py-2 flex items-start justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-[#0B1B36] truncate">
                            {line.componentName}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {line.brandName} · {line.quantity} × {inr(line.unitPriceInr)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="font-mono tabular-nums font-semibold text-[#0B1B36]">
                            {inr(line.lineTotalInr)}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const comp = catalog.components.find(
                                (c) => c.id === line.componentId,
                              );
                              if (comp) handleQuantityChange(comp, 0);
                            }}
                            aria-label={`Remove ${line.componentName}`}
                            className="text-slate-400 hover:text-rose-700 p-0.5 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Package Discount Code */}
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={discountInput}
                      onChange={(e) => setDiscountInput(e.target.value.toUpperCase())}
                      placeholder="Package promo code"
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono uppercase"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyPromoCode()}
                      className="px-3 py-1.5 rounded-lg bg-[#0B1B36] text-white text-xs font-semibold hover:bg-[#13294E] cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                  {activePackageOffers.length > 0 && !calculation.discountCode && (
                    <div className="space-y-1">
                      {activePackageOffers.slice(0, 2).map((rule) => (
                        <button
                          key={rule.id}
                          type="button"
                          onClick={() => handleApplyPromoCode(rule.code)}
                          className="w-full text-left px-2.5 py-1.5 rounded-md border border-dashed border-slate-300 hover:border-[#C99B2E] text-[11px] flex items-center justify-between gap-2 cursor-pointer"
                        >
                          <span className="inline-flex items-center gap-1 truncate text-slate-700">
                            <Tag className="w-3 h-3 text-[#9E7216] shrink-0" />
                            <strong className="font-mono text-[#0B1B36]">{rule.code}</strong>
                            <span className="truncate">
                              —{' '}
                              {rule.discountType === 'flat'
                                ? inr(rule.discountValue)
                                : `${rule.discountValue}%`}{' '}
                              off
                            </span>
                          </span>
                          <span className="text-[#9E7216] font-semibold shrink-0">Use</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Live Totals Breakdown */}
                <div className="pt-3 border-t border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-700">
                    <span>Products Subtotal</span>
                    <span className="font-mono tabular-nums font-semibold">
                      {inr(calculation.productSubtotalInr)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>
                      {systemType} Installation ({calculation.totalCameraCount} cams ×{' '}
                      {inr(calculation.installationRatePerCameraInr)})
                    </span>
                    <span className="font-mono tabular-nums font-semibold">
                      {inr(calculation.installationTotalInr)}
                    </span>
                  </div>
                  {calculation.discountInr > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Discount ({calculation.discountCode})</span>
                      <span className="font-mono tabular-nums">
                        -{inr(calculation.discountInr)}
                      </span>
                    </div>
                  )}
                  {calculation.taxEnabled && (
                    <div className="flex justify-between text-slate-700">
                      <span>
                        {calculation.taxLabel} ({calculation.taxRatePercent}%)
                      </span>
                      <span className="font-mono tabular-nums">{inr(calculation.taxInr)}</span>
                    </div>
                  )}
                  <div className="pt-2.5 border-t border-slate-300 flex justify-between items-baseline">
                    <span className="font-display font-bold text-sm text-[#0B1B36]">
                      Grand Total
                    </span>
                    <span className="font-mono tabular-nums text-xl font-extrabold text-[#0B1B36]">
                      {inr(calculation.grandTotalInr)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {calculation.taxEnabled
                      ? `Includes ${calculation.taxLabel} (${calculation.taxRatePercent}%).`
                      : 'Tax / GST currently off · Pay on Installation or UPI on Delivery.'}
                  </p>
                </div>

                {/* Warnings */}
                {calculation.warnings.length > 0 && calculation.lines.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 space-y-0.5">
                    {calculation.warnings.map((w, i) => (
                      <p key={i}>• {w}</p>
                    ))}
                  </div>
                )}

                {/* Primary Customer CTAs */}
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    disabled={!calculation.valid}
                    onClick={handleAddToCart}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-[#0B1B36] text-white text-sm font-semibold hover:bg-[#13294E] disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4 text-[#DFB85A]" />
                    <span>Add Package to Cart</span>
                  </button>

                  <button
                    type="button"
                    disabled={!calculation.valid}
                    onClick={() => setQuotationOpen(true)}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-[#0B1B36] bg-white text-[#0B1B36] text-xs font-bold hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-[#9E7216]" />
                    <span>Request &amp; Print A4 Quotation</span>
                  </button>

                  <a
                    href={formatWhatsAppUrl(settings.whatsapp, whatsAppText)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-slate-300 bg-[#F8FAFC] text-[#0B1B36] text-xs font-semibold hover:bg-slate-100 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-700" />
                    <span>Send Package on WhatsApp</span>
                  </a>
                </div>

                {/* Save Configuration for Reorder */}
                <div className="pt-3 border-t border-slate-200 flex gap-2">
                  <input
                    type="text"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="Label (e.g. Shop Front 8CH)"
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                  <button
                    type="button"
                    disabled={!calculation.valid}
                    onClick={handleSaveConfig}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-[#0B1B36] hover:bg-slate-50 disabled:opacity-40 whitespace-nowrap cursor-pointer"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-[#9E7216]" />
                    <span>Save</span>
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Compact Mobile Bottom Summary Bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 px-4 py-3 shadow-lg flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] text-slate-600">
            {systemType} {channel}CH · {calculation.totalCameraCount} Cams (Install{' '}
            {inr(calculation.installationTotalInr)})
          </p>
          <p className="font-mono tabular-nums text-base font-extrabold text-[#0B1B36]">
            {inr(calculation.grandTotalInr)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={!calculation.valid}
            onClick={() => setQuotationOpen(true)}
            className="px-3 py-2 rounded-lg border border-[#0B1B36] text-[#0B1B36] text-xs font-bold disabled:opacity-50"
          >
            Quote
          </button>
          <button
            type="button"
            disabled={!calculation.valid}
            onClick={handleAddToCart}
            className="px-4 py-2 rounded-lg bg-[#0B1B36] text-white text-xs font-bold disabled:opacity-50"
          >
            Add to Cart
          </button>
        </div>
      </div>

      {/* Quotation Modal */}
      <PackageQuotationModal
        open={quotationOpen}
        onClose={() => setQuotationOpen(false)}
        config={catalog.config}
        packageInput={calcInput}
        previewCalculation={calculation}
      />

      {/* Comparison Modal */}
      <PackageCompareModal
        open={compareModal.open}
        initialTab={compareModal.tab}
        onClose={() => setCompareModal((prev) => ({ ...prev, open: false }))}
        catalog={catalog}
        currentInput={calcInput}
        onSwitchSystemType={handleSystemChange}
        onApplyBrandItems={(switched, brandName) => {
          applySelectionItems(switched, catalog);
          showToast(`Switched compatible items to ${brandName}.`);
        }}
      />
    </div>
  );
}
