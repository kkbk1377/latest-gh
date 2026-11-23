import {
  AlertTriangle,
  Database,
  Download,
  FileText,
  History,
  Loader2,
  MessageCircle,
  Pencil,
  Plus,
  Printer,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useBusiness } from '../context/BusinessContext.tsx';
import { ASSET_IMAGES, formatWhatsAppUrl } from '../data/catalogData.ts';
import { api } from '../lib/api.ts';
import type {
  AdminAuditLogEntry,
  DatabaseBackupInfo,
  PackageBrand,
  PackageChannel,
  PackageComponent,
  PackageComponentGroup,
  PackageConfig,
  PackageDiscountRule,
  PackageMegapixel,
  PackageOrder,
  PackageOrderStatus,
  PackageQuotation,
  PackageQuotationStatus,
  PackageSystemType,
  PackageVariant,
} from '../types.ts';
import { PackageQuotationModal } from './PackageQuotationModal.tsx';

type SubTab =
  | 'overview'
  | 'settings'
  | 'brands'
  | 'catalog'
  | 'quotes-orders'
  | 'backups';

const ALL_CHANNELS: PackageChannel[] = [4, 8, 16, 32];
const ALL_MPS: PackageMegapixel[] = ['2MP', '3MP', '4MP', '5MP'];

const GROUP_LABELS: Record<PackageComponentGroup, string> = {
  CAMERA_DOME: 'Dome Cameras',
  CAMERA_BULLET: 'Bullet Cameras',
  RECORDER: 'DVR / NVR Recorders',
  POWER_SMPS: 'SMPS Power Supply',
  POE_SWITCH: 'PoE Switches',
  HDD: 'Hard Disks',
  RACK: 'Racks',
  CABLE: 'Cables',
  ACCESSORY: 'Accessories',
};

function inr(value: number): string {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

function downloadCsv(filename: string, headers: string[], rows: Array<Array<string | number>>) {
  const esc = (val: string | number) => `"${String(val ?? '').replace(/"/g, '""')}"`;
  const csv = [headers.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

interface AdminPackagesPanelProps {
  token: string;
  onNotify: (msg: string) => void;
}

export function AdminPackagesPanel({ token, onNotify }: AdminPackagesPanelProps) {
  const { settings } = useBusiness();
  const [subTab, setSubTab] = useState<SubTab>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [config, setConfig] = useState<PackageConfig | null>(null);
  const [brands, setBrands] = useState<PackageBrand[]>([]);
  const [components, setComponents] = useState<PackageComponent[]>([]);
  const [variants, setVariants] = useState<PackageVariant[]>([]);
  const [quotations, setQuotations] = useState<PackageQuotation[]>([]);
  const [packageOrders, setPackageOrders] = useState<PackageOrder[]>([]);
  const [lowStockVariants, setLowStockVariants] = useState<PackageVariant[]>([]);
  const [summary, setSummary] = useState<{
    totalBrands: number;
    activeBrands: number;
    totalComponents: number;
    totalVariants: number;
    lowStockCount: number;
    totalQuotations: number;
    totalPackageOrders: number;
    totalPackageRevenueInr: number;
    estimatedProfitInr: number;
  } | null>(null);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLogEntry[]>([]);
  const [backups, setBackups] = useState<DatabaseBackupInfo[]>([]);

  // Config draft state
  const [cfgDraft, setCfgDraft] = useState<Omit<PackageConfig, 'updatedAt'> | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);
  const [newRuleCode, setNewRuleCode] = useState('');
  const [newRuleTitle, setNewRuleTitle] = useState('');
  const [newRuleType, setNewRuleType] = useState<'flat' | 'percent'>('flat');
  const [newRuleVal, setNewRuleVal] = useState('500');
  const [newRuleMin, setNewRuleMin] = useState('10000');

  // Brand editor state
  const [editBrandId, setEditBrandId] = useState<string | null>(null);
  const [bName, setBName] = useState('');
  const [bShort, setBShort] = useState('');
  const [bColor, setBColor] = useState('#0B1B36');
  const [bDesc, setBDesc] = useState('');
  const [bOrder, setBOrder] = useState('10');
  const [bActive, setBActive] = useState(true);
  const [savingBrand, setSavingBrand] = useState(false);

  // Component filter & creator state
  const [groupFilter, setGroupFilter] = useState<string>('ALL');
  const [sysFilter, setSysFilter] = useState<'ALL' | 'HD' | 'IP'>('ALL');
  const [brandFilter, setBrandFilter] = useState<string>('ALL');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [showAddComponent, setShowAddComponent] = useState(false);
  const [cName, setCName] = useState('');
  const [cGroup, setCGroup] = useState<PackageComponentGroup>('ACCESSORY');
  const [cSystems, setCSystems] = useState<PackageSystemType[]>(['IP']);
  const [cUnit, setCUnit] = useState('Unit');
  const [cDesc, setCDesc] = useState('');
  const [cRec, setCRec] = useState('');
  const [savingComp, setSavingComp] = useState(false);

  // Variant editor modal / drawer state
  const [editVariantId, setEditVariantId] = useState<string | null>(null);
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [vCompId, setVCompId] = useState('');
  const [vBrandId, setVBrandId] = useState('');
  const [vModel, setVModel] = useState('');
  const [vSpecs, setVSpecs] = useState('');
  const [vWarranty, setVWarranty] = useState('2 Years OEM Warranty');
  const [vPurchase, setVPurchase] = useState('1000');
  const [vSelling, setVSelling] = useState('1350');
  const [vStock, setVStock] = useState('25');
  const [vLowStock, setVLowStock] = useState('5');
  const [vImage, setVImage] = useState<string>(ASSET_IMAGES.bulletCamera);
  const [vActive, setVActive] = useState(true);
  const [savingVariant, setSavingVariant] = useState(false);

  // Quotation print modal
  const [printQuotation, setPrintQuotation] = useState<PackageQuotation | null>(null);

  // Backup/Restore busy
  const [backupBusy, setBackupBusy] = useState(false);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAdminPackagesOverview(token);
      setConfig(data.config);
      const { updatedAt: _u, ...restCfg } = data.config;
      setCfgDraft(restCfg);
      setBrands(data.brands);
      setComponents(data.components);
      setVariants(data.variants);
      setQuotations(data.quotations);
      setPackageOrders(data.packageOrders);
      setLowStockVariants(data.lowStockVariants);
      setSummary(data.summary);
      setAuditLogs(data.auditLogs);
      setBackups(data.backups);
      if (data.components.length > 0 && !vCompId) {
        setVCompId(data.components[0].id);
      }
      if (data.brands.length > 0 && !vBrandId) {
        setVBrandId(data.brands[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load Package Admin data.');
    } finally {
      setLoading(false);
    }
  }, [token, vBrandId, vCompId]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const componentMap = useMemo(() => new Map(components.map((c) => [c.id, c])), [components]);
  const brandMap = useMemo(() => new Map(brands.map((b) => [b.id, b])), [brands]);

  const filteredVariants = useMemo(() => {
    const q = catalogSearch.trim().toLowerCase();
    return variants.filter((v) => {
      const comp = componentMap.get(v.componentId);
      const brand = brandMap.get(v.brandId);
      if (!comp || !brand) return false;
      if (groupFilter !== 'ALL' && comp.group !== groupFilter) return false;
      if (sysFilter !== 'ALL' && !comp.systemTypes.includes(sysFilter)) return false;
      if (brandFilter !== 'ALL' && v.brandId !== brandFilter) return false;
      if (q) {
        const hay = `${comp.name} ${brand.name} ${v.modelCode} ${v.specs}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [variants, componentMap, brandMap, groupFilter, sysFilter, brandFilter, catalogSearch]);

  // --- Save Config ---
  const handleSaveConfig = async (e: FormEvent) => {
    e.preventDefault();
    if (!cfgDraft) return;
    setSavingConfig(true);
    setError(null);
    try {
      const res = await api.updateAdminPackageConfig(token, cfgDraft);
      setConfig(res.config);
      onNotify(res.message);
      await loadOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save package configuration.');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleAddDiscountRule = () => {
    if (!cfgDraft || !newRuleCode.trim() || !newRuleTitle.trim()) return;
    const rule: PackageDiscountRule = {
      id: `PKG-DISC-${Date.now().toString(36).toUpperCase()}`,
      code: newRuleCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, ''),
      title: newRuleTitle.trim(),
      discountType: newRuleType,
      discountValue: Math.max(1, Number(newRuleVal) || 1),
      minSubtotalInr: Math.max(0, Number(newRuleMin) || 0),
      systemTypes: ['HD', 'IP'],
      active: true,
    };
    setCfgDraft({ ...cfgDraft, discountRules: [...cfgDraft.discountRules, rule] });
    setNewRuleCode('');
    setNewRuleTitle('');
  };

  // --- Brand CRUD ---
  const resetBrandForm = () => {
    setEditBrandId(null);
    setBName('');
    setBShort('');
    setBColor('#0B1B36');
    setBDesc('');
    setBOrder(String(brands.length + 1));
    setBActive(true);
  };

  const handleSaveBrand = async (e: FormEvent) => {
    e.preventDefault();
    setSavingBrand(true);
    setError(null);
    try {
      const payload = {
        name: bName,
        shortMark: bShort || bName.toUpperCase().slice(0, 12),
        accentHex: bColor,
        logoUrl: '',
        description: bDesc,
        active: bActive,
        sortOrder: Number(bOrder) || 50,
      };
      if (editBrandId) {
        await api.updateAdminPackageBrand(token, editBrandId, payload);
        onNotify(`Updated brand "${bName}".`);
      } else {
        await api.createAdminPackageBrand(token, payload);
        onNotify(`Added new brand "${bName}".`);
      }
      resetBrandForm();
      await loadOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save brand.');
    } finally {
      setSavingBrand(false);
    }
  };

  const handleDeleteBrand = async (brand: PackageBrand) => {
    setError(null);
    try {
      await api.deleteAdminPackageBrand(token, brand.id, false);
      onNotify(`Removed brand "${brand.name}".`);
      await loadOverview();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not delete brand.';
      if (msg.includes('mapped to')) {
        if (window.confirm(`${msg}\n\nProceed with force removal of brand and its variants?`)) {
          await api.deleteAdminPackageBrand(token, brand.id, true);
          onNotify(`Force removed brand "${brand.name}" and its mapped variants.`);
          await loadOverview();
        }
      } else {
        setError(msg);
      }
    }
  };

  // --- Component Creator ---
  const handleCreateComponent = async (e: FormEvent) => {
    e.preventDefault();
    setSavingComp(true);
    setError(null);
    try {
      await api.createAdminPackageComponent(token, {
        name: cName,
        group: cGroup,
        systemTypes: cSystems.length > 0 ? cSystems : ['IP'],
        unitLabel: cUnit || 'Unit',
        isCamera: cGroup === 'CAMERA_DOME' || cGroup === 'CAMERA_BULLET',
        recommendedFor: cRec,
        description: cDesc || cName,
        active: true,
        sortOrder: components.length + 1,
      });
      onNotify(`Added component "${cName}". Now map brand prices to it below.`);
      setCName('');
      setCDesc('');
      setCRec('');
      setShowAddComponent(false);
      await loadOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create component.');
    } finally {
      setSavingComp(false);
    }
  };

  // --- Variant CRUD ---
  const openEditVariant = (v: PackageVariant) => {
    setEditVariantId(v.id);
    setVCompId(v.componentId);
    setVBrandId(v.brandId);
    setVModel(v.modelCode);
    setVSpecs(v.specs);
    setVWarranty(v.warranty);
    setVPurchase(String(v.purchasePriceInr ?? 0));
    setVSelling(String(v.sellingPriceInr));
    setVStock(String(v.stockQty));
    setVLowStock(String(v.lowStockThreshold));
    setVImage(v.imageUrl || ASSET_IMAGES.bulletCamera);
    setVActive(v.active);
    setShowVariantForm(true);
  };

  const openNewVariant = () => {
    setEditVariantId(null);
    setVCompId(components[0]?.id || '');
    setVBrandId(brands[0]?.id || '');
    setVModel('');
    setVSpecs('');
    setVWarranty('2 Years OEM Warranty');
    setVPurchase('1000');
    setVSelling('1400');
    setVStock('25');
    setVLowStock('5');
    setVImage(ASSET_IMAGES.bulletCamera);
    setVActive(true);
    setShowVariantForm(true);
  };

  const handleSaveVariant = async (e: FormEvent) => {
    e.preventDefault();
    setSavingVariant(true);
    setError(null);
    try {
      const payload = {
        componentId: vCompId,
        brandId: vBrandId,
        modelCode: vModel,
        specs: vSpecs,
        warranty: vWarranty,
        purchasePriceInr: Math.max(0, Number(vPurchase) || 0),
        sellingPriceInr: Math.max(0, Number(vSelling) || 0),
        stockQty: Math.max(0, Math.floor(Number(vStock) || 0)),
        lowStockThreshold: Math.max(0, Math.floor(Number(vLowStock) || 0)),
        imageUrl: vImage || ASSET_IMAGES.bulletCamera,
        active: vActive,
      };
      if (editVariantId) {
        await api.updateAdminPackageVariant(token, editVariantId, payload);
        onNotify(`Updated pricing & stock for ${vModel}.`);
      } else {
        await api.createAdminPackageVariant(token, payload);
        onNotify(`Added brand variant ${vModel}.`);
      }
      setShowVariantForm(false);
      await loadOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save variant.');
    } finally {
      setSavingVariant(false);
    }
  };

  const handleQuickToggleVariant = async (v: PackageVariant) => {
    try {
      await api.updateAdminPackageVariant(token, v.id, {
        componentId: v.componentId,
        brandId: v.brandId,
        modelCode: v.modelCode,
        specs: v.specs,
        warranty: v.warranty,
        purchasePriceInr: v.purchasePriceInr ?? 0,
        sellingPriceInr: v.sellingPriceInr,
        stockQty: v.stockQty,
        lowStockThreshold: v.lowStockThreshold,
        imageUrl: v.imageUrl,
        active: !v.active,
      });
      onNotify(`${v.modelCode} ${!v.active ? 'enabled' : 'disabled'}.`);
      await loadOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not toggle variant.');
    }
  };

  const handleDeleteVariant = async (v: PackageVariant) => {
    if (!window.confirm(`Delete brand variant "${v.modelCode}"?`)) return;
    try {
      await api.deleteAdminPackageVariant(token, v.id);
      onNotify(`Deleted variant ${v.modelCode}.`);
      await loadOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete variant.');
    }
  };

  // --- Backup & Restore ---
  const handleCreateAndDownloadBackup = async () => {
    setBackupBusy(true);
    setError(null);
    try {
      const res = await api.createAdminDbBackup(token);
      const blob = new Blob([JSON.stringify(res.snapshotData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.backup.fileName;
      a.click();
      URL.revokeObjectURL(url);
      onNotify(res.message);
      await loadOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create backup.');
    } finally {
      setBackupBusy(false);
    }
  };

  const handleRestoreServerFile = async (fileName: string) => {
    if (
      !window.confirm(
        `Restore TRINETRA database from "${fileName}"?\n\nA pre-restore safety backup will be created automatically before restoring.`,
      )
    ) {
      return;
    }
    setBackupBusy(true);
    setError(null);
    try {
      const res = await api.restoreAdminDbBackup(token, { fileName });
      onNotify(res.message);
      await loadOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Restore failed.');
    } finally {
      setBackupBusy(false);
    }
  };

  const handleUploadRestoreJson = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBackupBusy(true);
    setError(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      if (
        !window.confirm(
          `Restore TRINETRA database from uploaded file "${file.name}"? A pre-restore safety snapshot will be saved first.`,
        )
      ) {
        return;
      }
      const res = await api.restoreAdminDbBackup(token, { snapshotData: parsed });
      onNotify(res.message);
      await loadOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid backup JSON file.');
    } finally {
      setBackupBusy(false);
      e.target.value = '';
    }
  };

  // --- CSV Exports ---
  const exportPricingCsv = () => {
    downloadCsv(
      `trinetra-package-pricing-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        'Component',
        'Group',
        'System',
        'Brand',
        'Model',
        'Purchase INR',
        'Selling INR',
        'Margin INR',
        'Stock',
        'Status',
      ],
      variants.map((v) => {
        const comp = componentMap.get(v.componentId);
        const brand = brandMap.get(v.brandId);
        const buy = v.purchasePriceInr ?? 0;
        return [
          comp?.name || v.componentId,
          comp?.group || '',
          comp?.systemTypes.join('/') || '',
          brand?.name || v.brandId,
          v.modelCode,
          buy,
          v.sellingPriceInr,
          v.sellingPriceInr - buy,
          v.stockQty,
          v.active ? 'Active' : 'Disabled',
        ];
      }),
    );
  };

  const exportQuotationsCsv = () => {
    downloadCsv(
      `trinetra-package-quotations-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        'Quotation ID',
        'Date',
        'Customer',
        'Phone',
        'City',
        'System',
        'Channel',
        'MP',
        'Cameras',
        'Hardware INR',
        'Install INR',
        'Grand Total INR',
        'Status',
      ],
      quotations.map((q) => [
        q.id,
        new Date(q.createdAt).toLocaleDateString('en-IN'),
        q.customerName,
        q.phone,
        q.city,
        q.systemType,
        `${q.channel}CH`,
        q.megapixel,
        q.calculation.totalCameraCount,
        q.calculation.productSubtotalInr,
        q.calculation.installationTotalInr,
        q.calculation.grandTotalInr,
        q.status,
      ]),
    );
  };

  if (loading && !config) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 flex items-center justify-center gap-3 text-slate-600">
        <Loader2 className="w-5 h-5 animate-spin text-[#0B1B36]" />
        <span className="text-sm">Loading Package Builder Admin Control Center...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between gap-3"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="font-bold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Sub-navigation bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1">
          {(
            [
              { id: 'overview', label: 'Overview & Reports' },
              { id: 'settings', label: 'Rates, Channels, MP, Discounts & Tax' },
              { id: 'brands', label: `Brands (${brands.length})` },
              { id: 'catalog', label: `Products, Prices & Stock (${variants.length})` },
              {
                id: 'quotes-orders',
                label: `Quotations (${quotations.length}) & Orders (${packageOrders.length})`,
              },
              { id: 'backups', label: 'Audit Logs & DB Backup' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                subTab === t.id
                  ? 'bg-[#0B1B36] text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-[#0B1B36]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => void loadOverview()}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* SUBTAB 1: OVERVIEW, REPORTS & LOW STOCK ALERTS */}
      {/* ===================================================================== */}
      {subTab === 'overview' && summary && config && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs text-slate-500">Package Revenue</p>
              <p className="font-mono tabular-nums text-2xl font-bold text-[#0B1B36] mt-1">
                {inr(summary.totalPackageRevenueInr)}
              </p>
              <p className="text-[11px] text-emerald-700 mt-1 font-mono">
                Est. Margin: {inr(summary.estimatedProfitInr)}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs text-slate-500">Quotations / Orders</p>
              <p className="font-mono tabular-nums text-2xl font-bold text-[#0B1B36] mt-1">
                {summary.totalQuotations} / {summary.totalPackageOrders}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Saved customer quotes &amp; builds</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs text-slate-500">Active Brands / Variants</p>
              <p className="font-mono tabular-nums text-2xl font-bold text-[#0B1B36] mt-1">
                {summary.activeBrands} / {summary.totalVariants}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                {summary.totalComponents} component SKUs
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs text-slate-500">Current Rates &amp; Tax</p>
              <p className="font-mono tabular-nums text-lg font-bold text-[#0B1B36] mt-1">
                HD {inr(config.hdInstallationPerCameraInr)} · IP{' '}
                {inr(config.ipInstallationPerCameraInr)}
              </p>
              <p className="text-[11px] text-[#9E7216] font-semibold mt-1">
                Tax / GST: {config.taxEnabled ? `ON (${config.taxRatePercent}%)` : 'OFF (Default)'}
              </p>
            </div>
          </div>

          {/* Export Reports Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-display font-bold text-sm text-[#0B1B36]">
                Export Package Reports &amp; Price Matrix (CSV)
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Download dealer purchase/selling price margins, stock counts, or saved customer
                quotations for Excel/Tally.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={exportPricingCsv}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0B1B36] text-white text-xs font-semibold hover:bg-[#13294E] cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#DFB85A]" />
                <span>Export Pricing &amp; Stock CSV</span>
              </button>
              <button
                type="button"
                onClick={exportQuotationsCsv}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 text-[#0B1B36] text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Quotations CSV</span>
              </button>
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-display font-bold text-sm text-[#0B1B36] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Low-Stock Alerts ({lowStockVariants.length})</span>
              </h3>
              <button
                type="button"
                onClick={() => setSubTab('catalog')}
                className="text-xs font-semibold text-[#9E7216] hover:underline cursor-pointer"
              >
                Manage Inventory →
              </button>
            </div>
            {lowStockVariants.length === 0 ? (
              <p className="p-6 text-xs text-emerald-700 font-medium">
                All active package variants are comfortably above their low-stock thresholds.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {lowStockVariants.map((v) => {
                  const comp = componentMap.get(v.componentId);
                  const brand = brandMap.get(v.brandId);
                  return (
                    <div
                      key={v.id}
                      className="px-5 py-3 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <p className="font-semibold text-[#0B1B36]">
                          {brand?.name} · {comp?.name} ({v.modelCode})
                        </p>
                        <p className="text-slate-500">
                          Alert threshold: {v.lowStockThreshold} · Selling: {inr(v.sellingPriceInr)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-rose-700">
                          Stock: {v.stockQty}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            openEditVariant(v);
                            setSubTab('catalog');
                          }}
                          className="px-2.5 py-1 rounded-md border border-slate-300 font-semibold text-[#0B1B36] hover:bg-slate-50 cursor-pointer"
                        >
                          Restock
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUBTAB 2: RATES, CHANNELS, MEGAPixels, DISCOUNTS & TAX SETTINGS */}
      {/* ===================================================================== */}
      {subTab === 'settings' && cfgDraft && (
        <form onSubmit={handleSaveConfig} className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div>
                <h3 className="font-display font-bold text-base text-[#0B1B36]">
                  Package Builder Master Controls
                </h3>
                <p className="text-xs text-slate-600">
                  Control HD/IP availability, channels, camera megapixels, per-camera installation
                  charges, and GST/Tax behavior live.
                </p>
              </div>
              <button
                type="submit"
                disabled={savingConfig}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0B1B36] text-white text-xs font-bold hover:bg-[#13294E] disabled:opacity-50 cursor-pointer"
              >
                {savingConfig ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 text-[#DFB85A]" />
                )}
                <span>Save All Package Settings</span>
              </button>
            </div>

            {/* Enable / Disable Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="p-4 rounded-lg border border-slate-200 bg-[#F8FAFC] flex items-center justify-between gap-3 cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-[#0B1B36]">PACKAGES Module</p>
                  <p className="text-[11px] text-slate-500">Master on/off toggle</p>
                </div>
                <input
                  type="checkbox"
                  checked={cfgDraft.enabled}
                  onChange={(e) => setCfgDraft({ ...cfgDraft, enabled: e.target.checked })}
                />
              </label>
              <label className="p-4 rounded-lg border border-slate-200 bg-[#F8FAFC] flex items-center justify-between gap-3 cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-[#0B1B36]">HD CCTV PACKAGES</p>
                  <p className="text-[11px] text-slate-500">Coaxial DVR + SMPS packages</p>
                </div>
                <input
                  type="checkbox"
                  checked={cfgDraft.hdEnabled}
                  onChange={(e) => setCfgDraft({ ...cfgDraft, hdEnabled: e.target.checked })}
                />
              </label>
              <label className="p-4 rounded-lg border border-slate-200 bg-[#F8FAFC] flex items-center justify-between gap-3 cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-[#0B1B36]">IP CCTV PACKAGES</p>
                  <p className="text-[11px] text-slate-500">Network NVR + PoE packages</p>
                </div>
                <input
                  type="checkbox"
                  checked={cfgDraft.ipEnabled}
                  onChange={(e) => setCfgDraft({ ...cfgDraft, ipEnabled: e.target.checked })}
                />
              </label>
            </div>

            {/* Installation Charges + Channels + Megapixels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
              <div className="space-y-4">
                <h4 className="font-display font-bold text-sm text-[#0B1B36]">
                  Per-Camera Installation Charges (Auto-Calculated)
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      HD Install / Camera (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={50000}
                      value={cfgDraft.hdInstallationPerCameraInr}
                      onChange={(e) =>
                        setCfgDraft({
                          ...cfgDraft,
                          hdInstallationPerCameraInr: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      IP Install / Camera (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={50000}
                      value={cfgDraft.ipInstallationPerCameraInr}
                      onChange={(e) =>
                        setCfgDraft({
                          ...cfgDraft,
                          ipInstallationPerCameraInr: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-sm"
                    />
                  </div>
                </div>

                {/* Channels */}
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-2">Enabled Channel Sizes</p>
                  <div className="flex flex-wrap gap-2">
                    {ALL_CHANNELS.map((ch) => {
                      const active = cfgDraft.availableChannels.includes(ch);
                      return (
                        <button
                          key={ch}
                          type="button"
                          onClick={() => {
                            const next = active
                              ? cfgDraft.availableChannels.filter((c) => c !== ch)
                              : [...cfgDraft.availableChannels, ch];
                            if (next.length > 0) {
                              setCfgDraft({ ...cfgDraft, availableChannels: next });
                            }
                          }}
                          className={`px-3.5 py-1.5 rounded-lg border font-mono text-xs font-bold cursor-pointer ${
                            active
                              ? 'bg-[#0B1B36] text-white border-[#0B1B36]'
                              : 'bg-white text-slate-500 border-slate-300'
                          }`}
                        >
                          {ch}CH
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Megapixels */}
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-2">
                    Enabled Camera Megapixels
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {ALL_MPS.map((mp) => {
                      const active = cfgDraft.availableMegapixels.includes(mp);
                      return (
                        <button
                          key={mp}
                          type="button"
                          onClick={() => {
                            const next = active
                              ? cfgDraft.availableMegapixels.filter((m) => m !== mp)
                              : [...cfgDraft.availableMegapixels, mp];
                            if (next.length > 0) {
                              setCfgDraft({ ...cfgDraft, availableMegapixels: next });
                            }
                          }}
                          className={`px-3.5 py-1.5 rounded-lg border font-mono text-xs font-bold cursor-pointer ${
                            active
                              ? 'bg-[#0B1B36] text-white border-[#0B1B36]'
                              : 'bg-white text-slate-500 border-slate-300'
                          }`}
                        >
                          {mp}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Tax / GST Settings */}
              <div className="space-y-4">
                <h4 className="font-display font-bold text-sm text-[#0B1B36]">
                  Tax / GST Configuration (Off by Default)
                </h4>
                <label className="p-4 rounded-lg border border-slate-200 bg-[#F8FAFC] flex items-center justify-between gap-3 cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-[#0B1B36]">
                      Apply Tax / GST on Package Quotations &amp; Checkout
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Turn ON to add GST automatically; keep OFF for tax-excluded estimates.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={cfgDraft.taxEnabled}
                    onChange={(e) => setCfgDraft({ ...cfgDraft, taxEnabled: e.target.checked })}
                  />
                </label>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tax Label
                    </label>
                    <input
                      type="text"
                      value={cfgDraft.taxLabel}
                      onChange={(e) => setCfgDraft({ ...cfgDraft, taxLabel: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      step="0.5"
                      value={cfgDraft.taxRatePercent}
                      onChange={(e) =>
                        setCfgDraft({ ...cfgDraft, taxRatePercent: Number(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Quote Valid (Days)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={180}
                      value={cfgDraft.quotationValidityDays}
                      onChange={(e) =>
                        setCfgDraft({
                          ...cfgDraft,
                          quotationValidityDays: Math.max(1, Number(e.target.value) || 15),
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Package Discount Rules */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <h4 className="font-display font-bold text-sm text-[#0B1B36]">
                Package Discount &amp; Promo Rules
              </h4>
              <div className="space-y-2">
                {cfgDraft.discountRules.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-lg border border-slate-200 bg-[#F8FAFC] flex flex-wrap items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-[#0B1B36]">{r.code}</span>
                      <span className="text-slate-600 ml-2">{r.title}</span>
                      <span className="text-slate-500 ml-2">
                        ({r.discountType === 'flat' ? inr(r.discountValue) : `${r.discountValue}%`}{' '}
                        off · min {inr(r.minSubtotalInr)} · {r.systemTypes.join('/')})
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="inline-flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={r.active}
                          onChange={(e) =>
                            setCfgDraft({
                              ...cfgDraft,
                              discountRules: cfgDraft.discountRules.map((x) =>
                                x.id === r.id ? { ...x, active: e.target.checked } : x,
                              ),
                            })
                          }
                        />
                        <span>Active</span>
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setCfgDraft({
                            ...cfgDraft,
                            discountRules: cfgDraft.discountRules.filter((x) => x.id !== r.id),
                          })
                        }
                        className="text-rose-700 hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-2 pt-1">
                <input
                  type="text"
                  value={newRuleCode}
                  onChange={(e) => setNewRuleCode(e.target.value.toUpperCase())}
                  placeholder="Code (e.g. FEST1000)"
                  className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono uppercase"
                />
                <input
                  type="text"
                  value={newRuleTitle}
                  onChange={(e) => setNewRuleTitle(e.target.value)}
                  placeholder="Offer title"
                  className="md:col-span-2 px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
                <select
                  value={newRuleType}
                  onChange={(e) => setNewRuleType(e.target.value as 'flat' | 'percent')}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-xs"
                >
                  <option value="flat">Flat ₹</option>
                  <option value="percent">Percent %</option>
                </select>
                <input
                  type="number"
                  value={newRuleVal}
                  onChange={(e) => setNewRuleVal(e.target.value)}
                  placeholder="Value"
                  className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={handleAddDiscountRule}
                  className="px-3 py-2 rounded-lg bg-[#0B1B36] text-white text-xs font-semibold hover:bg-[#13294E] cursor-pointer"
                >
                  + Add Rule
                </button>
              </div>
            </div>

            {/* Quotation Terms */}
            <div className="pt-4 border-t border-slate-200 space-y-2">
              <label className="block font-display font-bold text-sm text-[#0B1B36]">
                A4 Quotation Terms &amp; Conditions (one per line)
              </label>
              <textarea
                rows={4}
                value={cfgDraft.quotationTerms.join('\n')}
                onChange={(e) =>
                  setCfgDraft({
                    ...cfgDraft,
                    quotationTerms: e.target.value
                      .split('\n')
                      .map((l) => l.trim())
                      .filter(Boolean),
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
              />
            </div>
          </div>
        </form>
      )}

      {/* ===================================================================== */}
      {/* SUBTAB 3: BRANDS MANAGEMENT */}
      {/* ===================================================================== */}
      {subTab === 'brands' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleSaveBrand}
            className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 space-y-3.5"
          >
            <h3 className="font-display font-bold text-sm text-[#0B1B36]">
              {editBrandId ? 'Edit Package Brand' : 'Add New CCTV Brand'}
            </h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Brand Name *</label>
              <input
                type="text"
                required
                value={bName}
                onChange={(e) => setBName(e.target.value)}
                placeholder="e.g. Dahua, Uniview, HoneyWell"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Short Mark</label>
                <input
                  type="text"
                  value={bShort}
                  onChange={(e) => setBShort(e.target.value)}
                  placeholder="DAHUA"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sort Order</label>
                <input
                  type="number"
                  value={bOrder}
                  onChange={(e) => setBOrder(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                rows={2}
                value={bDesc}
                onChange={(e) => setBDesc(e.target.value)}
                placeholder="Cameras, NVR, PoE switches..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
              />
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold text-[#0B1B36] cursor-pointer">
              <input
                type="checkbox"
                checked={bActive}
                onChange={(e) => setBActive(e.target.checked)}
              />
              <span>Active (visible to customers)</span>
            </label>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={savingBrand}
                className="flex-1 py-2.5 px-4 rounded-lg bg-[#0B1B36] text-white text-xs font-bold hover:bg-[#13294E] cursor-pointer"
              >
                {savingBrand ? 'Saving...' : editBrandId ? 'Update Brand' : 'Add Brand'}
              </button>
              {editBrandId && (
                <button
                  type="button"
                  onClick={resetBrandForm}
                  className="px-3 py-2.5 rounded-lg border border-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <h3 className="font-display font-bold text-sm text-[#0B1B36]">
                Configured Package Brands ({brands.length})
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {brands.map((b) => {
                const count = variants.filter((v) => v.brandId === b.id).length;
                return (
                  <div
                    key={b.id}
                    className="px-5 py-3.5 flex items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <p className="font-display font-bold text-sm text-[#0B1B36]">
                        {b.name}{' '}
                        <span className="font-mono text-[11px] font-normal text-slate-500">
                          · {count} mapped variants · {b.active ? 'Active' : 'Disabled'}
                        </span>
                      </p>
                      <p className="text-slate-600 mt-0.5">{b.description}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditBrandId(b.id);
                          setBName(b.name);
                          setBShort(b.shortMark);
                          setBColor(b.accentHex);
                          setBDesc(b.description);
                          setBOrder(String(b.sortOrder));
                          setBActive(b.active);
                        }}
                        className="p-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
                        aria-label={`Edit ${b.name}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteBrand(b)}
                        className="p-1.5 rounded-md border border-slate-300 text-rose-700 hover:bg-rose-50 cursor-pointer"
                        aria-label={`Delete ${b.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUBTAB 4: COMPONENTS & BRAND-WISE PRICING / COMPATIBILITY / STOCK */}
      {/* ===================================================================== */}
      {subTab === 'catalog' && (
        <div className="space-y-5">
          {/* Toolbar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative min-w-[200px] flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Search model, product, brand..."
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>
              <select
                value={sysFilter}
                onChange={(e) => setSysFilter(e.target.value as 'ALL' | 'HD' | 'IP')}
                className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium"
              >
                <option value="ALL">All Systems (HD &amp; IP)</option>
                <option value="HD">HD Only</option>
                <option value="IP">IP Only</option>
              </select>
              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium"
              >
                <option value="ALL">All Categories</option>
                {(Object.keys(GROUP_LABELS) as PackageComponentGroup[]).map((g) => (
                  <option key={g} value={g}>
                    {GROUP_LABELS[g]}
                  </option>
                ))}
              </select>
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium"
              >
                <option value="ALL">All Brands</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowAddComponent((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#0B1B36] text-[#0B1B36] text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Component</span>
              </button>
              <button
                type="button"
                onClick={openNewVariant}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0B1B36] text-white text-xs font-semibold hover:bg-[#13294E] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#DFB85A]" />
                <span>Add Brand Price Variant</span>
              </button>
            </div>
          </div>

          {/* Add New Component Inline Form */}
          {showAddComponent && (
            <form
              onSubmit={handleCreateComponent}
              className="bg-white border border-[#C99B2E] rounded-xl p-5 space-y-3"
            >
              <h4 className="font-display font-bold text-sm text-[#0B1B36]">
                Add New Package Component (e.g. Custom IP Networking Accessory, Rack, Cable)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                  type="text"
                  required
                  value={cName}
                  onChange={(e) => setCName(e.target.value)}
                  placeholder="Component Name *"
                  className="md:col-span-2 px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
                <select
                  value={cGroup}
                  onChange={(e) => setCGroup(e.target.value as PackageComponentGroup)}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-xs"
                >
                  {(Object.keys(GROUP_LABELS) as PackageComponentGroup[]).map((g) => (
                    <option key={g} value={g}>
                      {GROUP_LABELS[g]}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={cUnit}
                  onChange={(e) => setCUnit(e.target.value)}
                  placeholder="Unit (Piece / Roll / Unit)"
                  className="px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                <div className="flex items-center gap-4 text-xs">
                  <span className="font-semibold text-slate-700">Compatible With:</span>
                  {(['HD', 'IP'] as PackageSystemType[]).map((sys) => (
                    <label key={sys} className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cSystems.includes(sys)}
                        onChange={(e) =>
                          setCSystems((prev) =>
                            e.target.checked ? [...prev, sys] : prev.filter((x) => x !== sys),
                          )
                        }
                      />
                      <span>{sys}</span>
                    </label>
                  ))}
                </div>
                <input
                  type="text"
                  value={cRec}
                  onChange={(e) => setCRec(e.target.value)}
                  placeholder="Recommended use note"
                  className="px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
                <input
                  type="text"
                  value={cDesc}
                  onChange={(e) => setCDesc(e.target.value)}
                  placeholder="Short description"
                  className="px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddComponent(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingComp}
                  className="px-4 py-1.5 rounded-lg bg-[#0B1B36] text-white text-xs font-bold cursor-pointer"
                >
                  {savingComp ? 'Saving...' : 'Create Component'}
                </button>
              </div>
            </form>
          )}

          {/* Add / Edit Brand Variant Form */}
          {showVariantForm && (
            <form
              onSubmit={handleSaveVariant}
              className="bg-white border border-[#0B1B36] rounded-xl p-5 space-y-4"
            >
              <h4 className="font-display font-bold text-sm text-[#0B1B36]">
                {editVariantId
                  ? 'Edit Brand Pricing, Margin & Stock'
                  : 'Map Brand to Component (Brand-Wise Price & Stock)'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Component *
                  </label>
                  <select
                    value={vCompId}
                    onChange={(e) => setVCompId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  >
                    {components.map((c) => (
                      <option key={c.id} value={c.id}>
                        [{c.systemTypes.join('/')}] {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Brand *</label>
                  <select
                    value={vBrandId}
                    onChange={(e) => setVBrandId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                  >
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Model Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={vModel}
                    onChange={(e) => setVModel(e.target.value)}
                    placeholder="e.g. DS-2CD1043G2-I"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Purchase Price (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={vPurchase}
                    onChange={(e) => setVPurchase(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Selling Price (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={vSelling}
                    onChange={(e) => setVSelling(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Stock Qty
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={vStock}
                    onChange={(e) => setVStock(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Low-Stock Alert
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={vLowStock}
                    onChange={(e) => setVLowStock(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#0B1B36] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={vActive}
                      onChange={(e) => setVActive(e.target.checked)}
                    />
                    <span>Active</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={vSpecs}
                  onChange={(e) => setVSpecs(e.target.value)}
                  placeholder="Specs (e.g. 4MP PoE · IP67 · 30m IR)"
                  className="px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
                <input
                  type="text"
                  value={vWarranty}
                  onChange={(e) => setVWarranty(e.target.value)}
                  placeholder="Warranty"
                  className="px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <p className="text-xs font-mono text-emerald-700 font-semibold">
                  Profit Margin:{' '}
                  {inr((Number(vSelling) || 0) - (Number(vPurchase) || 0))} (
                  {(Number(vSelling) || 0) > 0
                    ? Math.round(
                        (((Number(vSelling) || 0) - (Number(vPurchase) || 0)) /
                          (Number(vSelling) || 1)) *
                          100,
                      )
                    : 0}
                  %)
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowVariantForm(false)}
                    className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingVariant}
                    className="px-4 py-2 rounded-lg bg-[#0B1B36] text-white text-xs font-bold cursor-pointer"
                  >
                    {savingVariant ? 'Saving...' : 'Save Variant'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Brand-Product Variants Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200 bg-[#F8FAFC] flex items-center justify-between text-xs text-slate-600">
              <span>
                Showing <strong className="font-mono">{filteredVariants.length}</strong> of{' '}
                <strong className="font-mono">{variants.length}</strong> brand-product price rows
              </span>
              <span>Dealer purchase cost &amp; margins are visible to Admin only</span>
            </div>
            <div className="overflow-x-auto max-h-[540px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-white border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Component &amp; Model</th>
                    <th className="py-2.5 px-3 font-semibold">Brand</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Purchase</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Selling</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Margin</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Stock</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredVariants.map((v) => {
                    const comp = componentMap.get(v.componentId);
                    const brand = brandMap.get(v.brandId);
                    const buy = v.purchasePriceInr ?? 0;
                    const margin = v.sellingPriceInr - buy;
                    const lowStock = v.stockQty <= v.lowStockThreshold;
                    return (
                      <tr key={v.id} className={v.active ? 'hover:bg-slate-50' : 'opacity-55'}>
                        <td className="py-2.5 px-4">
                          <p className="font-semibold text-[#0B1B36]">{comp?.name}</p>
                          <p className="text-[11px] font-mono text-slate-500">
                            {v.modelCode} · {comp?.systemTypes.join('/')}
                          </p>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{brand?.name}</td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">
                          {inr(buy)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-[#0B1B36]">
                          {inr(v.sellingPriceInr)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-emerald-700 font-semibold">
                          {inr(margin)}
                        </td>
                        <td
                          className={`py-2.5 px-3 text-right font-mono tabular-nums font-bold ${
                            lowStock ? 'text-rose-700' : 'text-slate-700'
                          }`}
                        >
                          {v.stockQty}
                        </td>
                        <td className="py-2.5 px-4 text-right whitespace-nowrap space-x-1.5">
                          <button
                            type="button"
                            onClick={() => openEditVariant(v)}
                            className="px-2 py-1 rounded border border-slate-300 text-[11px] font-semibold text-[#0B1B36] hover:bg-slate-50 cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleQuickToggleVariant(v)}
                            className="px-2 py-1 rounded border border-slate-300 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                          >
                            {v.active ? 'Hide' : 'Enable'}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteVariant(v)}
                            className="p-1 text-slate-400 hover:text-rose-700 align-middle cursor-pointer"
                            aria-label={`Delete ${v.modelCode}`}
                          >
                            <Trash2 className="w-3.5 h-3.5 inline" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUBTAB 5: PACKAGE QUOTATIONS & PACKAGE ORDERS */}
      {/* ===================================================================== */}
      {subTab === 'quotes-orders' && (
        <div className="space-y-6">
          {/* Package Quotations */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-display font-bold text-sm text-[#0B1B36] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#9E7216]" />
                <span>Saved Customer Package Quotations ({quotations.length})</span>
              </h3>
              <button
                type="button"
                onClick={exportQuotationsCsv}
                className="text-xs font-semibold text-[#9E7216] hover:underline cursor-pointer"
              >
                Export CSV
              </button>
            </div>
            {quotations.length === 0 ? (
              <p className="p-8 text-center text-xs text-slate-500">
                No package quotations requested yet. Quotations generated on /packages appear here
                with 1-click A4 print and WhatsApp follow-up.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {quotations.map((q) => (
                  <div
                    key={q.id}
                    className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1">
                      <p className="font-mono font-bold text-[#0B1B36]">
                        {q.id} ·{' '}
                        <span className="text-[#9E7216]">
                          {q.systemType} {q.channel}CH {q.megapixel}
                        </span>{' '}
                        · {new Date(q.createdAt).toLocaleString('en-IN')}
                      </p>
                      <p className="font-display font-bold text-sm text-[#0B1B36]">
                        {q.customerName}
                        {q.companyName ? ` (${q.companyName})` : ''} —{' '}
                        <span className="font-mono tabular-nums">
                          {inr(q.calculation.grandTotalInr)}
                        </span>
                      </p>
                      <p className="text-slate-600">
                        <span className="font-mono">{q.phone}</span> · {q.city}, {q.state} ·{' '}
                        {q.calculation.totalCameraCount} Cameras (Install{' '}
                        {inr(q.calculation.installationTotalInr)})
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <select
                        value={q.status}
                        onChange={async (e) => {
                          await api.updateAdminPackageQuotationStatus(
                            token,
                            q.id,
                            e.target.value as PackageQuotationStatus,
                          );
                          onNotify(`Quotation ${q.id} updated.`);
                          await loadOverview();
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold"
                      >
                        <option value="new">New</option>
                        <option value="sent">Sent</option>
                        <option value="approved">Approved</option>
                        <option value="converted">Converted</option>
                        <option value="archived">Archived</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => setPrintQuotation(q)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0B1B36] text-white font-semibold hover:bg-[#13294E] cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-[#DFB85A]" />
                        <span>View / Print A4</span>
                      </button>
                      <a
                        href={formatWhatsAppUrl(
                          q.phone,
                          `Hello ${q.customerName}, sharing your ${settings.businessName} Quotation ${q.id} (${q.systemType} ${q.channel}CH ${q.megapixel}) totaling ${inr(q.calculation.grandTotalInr)}. Let us know when we can schedule installation.`,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-[#0B1B36] font-semibold hover:bg-slate-50"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-700" />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Direct Package Orders */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <h3 className="font-display font-bold text-sm text-[#0B1B36]">
                Direct Package Orders ({packageOrders.length})
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Note: Packages checked out via the Store Cart also appear under the Store Orders tab
                with full itemized bundles.
              </p>
            </div>
            {packageOrders.length === 0 ? (
              <p className="p-8 text-center text-xs text-slate-500">
                No direct API package orders yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {packageOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1">
                      <p className="font-mono font-bold text-[#0B1B36]">
                        {ord.id} · {ord.systemType} {ord.channel}CH {ord.megapixel} ·{' '}
                        {ord.paymentMethod.replace(/_/g, ' ')}
                      </p>
                      <p className="font-display font-bold text-sm text-[#0B1B36]">
                        {ord.customerName} —{' '}
                        <span className="font-mono tabular-nums">
                          {inr(ord.calculation.grandTotalInr)}
                        </span>
                      </p>
                      <p className="text-slate-600">
                        {ord.phone} · {ord.address}, {ord.city}, {ord.state} {ord.pincode}
                      </p>
                    </div>
                    <select
                      value={ord.status}
                      onChange={async (e) => {
                        await api.updateAdminPackageOrderStatus(
                          token,
                          ord.id,
                          e.target.value as PackageOrderStatus,
                        );
                        onNotify(`Package Order ${ord.id} updated.`);
                        await loadOverview();
                      }}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="dispatched">Dispatched</option>
                      <option value="installed">Installed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled (Restocks Inventory)</option>
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUBTAB 6: ADMIN AUDIT LOGS & DATABASE BACKUP / RESTORE */}
      {/* ===================================================================== */}
      {subTab === 'backups' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Backup & Restore */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#9E7216]" />
                <h3 className="font-display font-bold text-sm text-[#0B1B36]">
                  Database Backup &amp; Safe Restore
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={backupBusy}
                  onClick={() => void handleCreateAndDownloadBackup()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B1B36] text-white text-xs font-semibold hover:bg-[#13294E] disabled:opacity-50 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#DFB85A]" />
                  <span>Backup &amp; Download JSON</span>
                </button>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-[#0B1B36] text-xs font-semibold hover:bg-slate-50 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Restore JSON</span>
                  <input
                    type="file"
                    accept="application/json,.json"
                    onChange={handleUploadRestoreJson}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {backups.length === 0 ? (
                <p className="p-6 text-xs text-slate-500">
                  No server backup snapshots yet. Click “Backup &amp; Download JSON” to create one
                  now.
                </p>
              ) : (
                backups.map((b) => (
                  <div
                    key={b.fileName}
                    className="px-5 py-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-mono font-semibold text-[#0B1B36] truncate">{b.fileName}</p>
                      <p className="text-[11px] text-slate-500">
                        {new Date(b.createdAt).toLocaleString('en-IN')} ·{' '}
                        {(b.sizeBytes / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={backupBusy}
                      onClick={() => void handleRestoreServerFile(b.fileName)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-[#0B1B36] font-semibold hover:bg-slate-50 shrink-0 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Restore</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Audit Logs */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
              <History className="w-4 h-4 text-[#9E7216]" />
              <h3 className="font-display font-bold text-sm text-[#0B1B36]">
                Admin Audit Logs ({auditLogs.length})
              </h3>
            </div>
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {auditLogs.length === 0 ? (
                <p className="p-6 text-xs text-slate-500">
                  Admin package pricing, configuration, order, and backup actions will be recorded
                  here automatically.
                </p>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="px-5 py-3 text-xs space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-[#0B1B36]">{log.action}</span>
                      <span className="font-mono text-[10px] text-slate-500">
                        {new Date(log.timestamp).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <p className="text-slate-700">{log.summary}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* A4 Quotation Preview/Print Modal */}
      {config && (
        <PackageQuotationModal
          open={Boolean(printQuotation)}
          onClose={() => setPrintQuotation(null)}
          config={config}
          existingQuotation={printQuotation}
        />
      )}
    </div>
  );
}
