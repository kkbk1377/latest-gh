import type { Express, NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { ASSET_IMAGES } from '../data/catalogData.ts';
import { calculatePackage } from '../lib/packageEngine.ts';
import type {
  AdminAuditLogEntry,
  CustomerEnquiry,
  DatabaseBackupInfo,
  PackageBrand,
  PackageCatalogData,
  PackageComponent,
  PackageConfig,
  PackageOrder,
  PackageQuotation,
  PackageVariant,
  StoreOrder,
} from '../types.ts';

export interface PackageDbState {
  settings: {
    businessName: string;
    domain: string;
    phone: string;
    whatsapp: string;
    email: string;
    address: string;
  };
  orders: StoreOrder[];
  enquiries: CustomerEnquiry[];
  packageConfig: PackageConfig;
  packageBrands: PackageBrand[];
  packageComponents: PackageComponent[];
  packageVariants: PackageVariant[];
  packageQuotations: PackageQuotation[];
  packageOrders: PackageOrder[];
  adminAuditLogs: AdminAuditLogEntry[];
}

export interface PackageRouteContext {
  getDb: () => PackageDbState;
  persistDb: () => void;
  appendAuditLog: (action: string, entity: string, summary: string) => void;
  createBackupSnapshot: (reason: string) => DatabaseBackupInfo;
  listBackups: () => DatabaseBackupInfo[];
  restoreFromBackupFile: (fileName: string) => { restoredFrom: string; safetyBackup: DatabaseBackupInfo };
  restoreFromJsonPayload: (payload: unknown) => { safetyBackup: DatabaseBackupInfo };
  exportFullDbSnapshot: () => unknown;
  requireAdmin: (req: Request, res: Response, next: NextFunction) => void;
  rateLimit: (maxPerMinute: number) => (req: Request, res: Response, next: NextFunction) => void;
  verifyTokenFromRequest: (req: Request) => boolean;
  normalizePhoneTail: (raw: string) => string;
}

const systemTypeEnum = z.enum(['HD', 'IP']);
const channelEnum = z.union([z.literal(4), z.literal(8), z.literal(16), z.literal(32)]);
const megapixelEnum = z.enum(['2MP', '3MP', '4MP', '5MP']);
const groupEnum = z.enum([
  'CAMERA_DOME',
  'CAMERA_BULLET',
  'RECORDER',
  'POWER_SMPS',
  'POE_SWITCH',
  'HDD',
  'RACK',
  'CABLE',
  'ACCESSORY',
]);

export const packageCalcInputSchema = z.object({
  systemType: systemTypeEnum,
  channel: channelEnum,
  megapixel: megapixelEnum,
  items: z
    .array(
      z.object({
        componentId: z.string().trim().min(1).max(120),
        brandId: z.string().trim().min(1).max(120),
        quantity: z.number().int().min(0).max(500),
      }),
    )
    .max(120),
  discountCode: z.string().trim().max(40).optional().default(''),
});

const packageQuotationCreateSchema = z.object({
  customerName: z.string().trim().min(2, 'Please enter your full name.').max(120),
  phone: z
    .string()
    .trim()
    .regex(/^[+\d\s()-]{8,20}$/, 'Please enter a valid phone number.'),
  email: z.string().trim().email('Please enter a valid email address.').or(z.literal('')).default(''),
  city: z.string().trim().min(2, 'Please enter your city or town.').max(80),
  state: z.enum(['Andhra Pradesh', 'Telangana', 'Other']).default('Telangana'),
  companyName: z.string().trim().max(160).optional().default(''),
  gstin: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[0-9A-Z]{15}$/, 'GSTIN must be a valid 15-character alphanumeric code.')
    .or(z.literal(''))
    .optional()
    .default(''),
  notes: z.string().trim().max(800).optional().default(''),
  packageInput: packageCalcInputSchema,
});

const packageOrderCreateSchema = z.object({
  quotationId: z.string().trim().max(60).optional().default(''),
  customerName: z.string().trim().min(2, 'Please enter your full name.').max(120),
  phone: z
    .string()
    .trim()
    .regex(/^[+\d\s()-]{8,20}$/, 'Please enter a valid phone number.'),
  email: z.string().trim().email('Please enter a valid email address.').or(z.literal('')).default(''),
  address: z.string().trim().min(6, 'Please enter your installation/delivery address.').max(320),
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
  paymentMethod: z
    .enum(['PAY_ON_INSTALLATION', 'UPI_ON_DELIVERY'])
    .default('PAY_ON_INSTALLATION'),
  notes: z.string().trim().max(800).optional().default(''),
  packageInput: packageCalcInputSchema,
});

const packageDiscountRuleSchema = z.object({
  id: z.string().trim().min(1).max(60),
  code: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .transform((v) => v.toUpperCase().replace(/[^A-Z0-9_-]/g, '')),
  title: z.string().trim().min(3).max(160),
  discountType: z.enum(['percent', 'flat']),
  discountValue: z.number().positive().max(100000),
  minSubtotalInr: z.number().nonnegative().max(10000000),
  systemTypes: z.array(systemTypeEnum).min(1),
  active: z.boolean(),
});

const packageConfigUpdateSchema = z.object({
  enabled: z.boolean(),
  hdEnabled: z.boolean(),
  ipEnabled: z.boolean(),
  availableChannels: z.array(channelEnum).min(1, 'At least one channel option must remain active.'),
  availableMegapixels: z.array(megapixelEnum).min(1, 'At least one megapixel option must remain active.'),
  hdInstallationPerCameraInr: z.number().nonnegative().max(50000),
  ipInstallationPerCameraInr: z.number().nonnegative().max(50000),
  taxEnabled: z.boolean(),
  taxLabel: z.string().trim().min(1).max(30).default('GST'),
  taxRatePercent: z.number().min(0).max(50),
  quotationValidityDays: z.number().int().min(1).max(180).default(15),
  quotationTerms: z.array(z.string().trim().min(3).max(400)).min(1).max(12),
  discountRules: z.array(packageDiscountRuleSchema).max(30),
});

const packageBrandUpsertSchema = z.object({
  name: z.string().trim().min(2).max(100),
  shortMark: z.string().trim().min(1).max(24),
  accentHex: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Accent hex must be 6-digit hex like #0B1B36'),
  logoUrl: z.string().trim().max(500).default(''),
  description: z.string().trim().max(300).default(''),
  active: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(999).default(50),
});

const packageComponentUpsertSchema = z.object({
  name: z.string().trim().min(2).max(160),
  group: groupEnum,
  systemTypes: z.array(systemTypeEnum).min(1),
  supportedChannels: z.array(channelEnum).optional(),
  supportedMegapixels: z.array(megapixelEnum).optional(),
  unitLabel: z.string().trim().min(1).max(40).default('Unit'),
  isCamera: z.boolean().default(false),
  storageTb: z.number().positive().max(200).optional(),
  portCount: z.number().int().positive().max(64).optional(),
  recommendedFor: z.string().trim().max(200).optional().default(''),
  description: z.string().trim().max(600).default(''),
  active: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(999).default(100),
});

const packageVariantUpsertSchema = z.object({
  componentId: z.string().trim().min(1).max(120),
  brandId: z.string().trim().min(1).max(120),
  modelCode: z.string().trim().min(1).max(120),
  specs: z.string().trim().max(300).default(''),
  warranty: z.string().trim().max(120).default('2 Years OEM Warranty'),
  purchasePriceInr: z.number().nonnegative().max(10000000),
  sellingPriceInr: z.number().nonnegative().max(10000000),
  stockQty: z.number().int().min(0).max(100000),
  lowStockThreshold: z.number().int().min(0).max(10000).default(5),
  imageUrl: z.string().trim().max(500).default(ASSET_IMAGES.bulletCamera),
  active: z.boolean().default(true),
});

export function buildPublicPackageCatalog(db: PackageDbState): PackageCatalogData {
  return {
    config: db.packageConfig,
    brands: db.packageBrands
      .filter((b) => b.active)
      .sort((a, b) => a.sortOrder - b.sortOrder),
    components: db.packageComponents
      .filter((c) => c.active)
      .sort((a, b) => a.sortOrder - b.sortOrder),
    variants: db.packageVariants
      .filter((v) => v.active)
      .map(({ purchasePriceInr: _hidden, ...publicVariant }) => publicVariant),
  };
}

export function buildFullPackageCatalog(db: PackageDbState): PackageCatalogData {
  return {
    config: db.packageConfig,
    brands: db.packageBrands,
    components: db.packageComponents,
    variants: db.packageVariants,
  };
}

export function registerPackageRoutes(app: Express, ctx: PackageRouteContext): void {
  // ===========================================================================
  // PUBLIC PACKAGE BUILDER ENDPOINTS
  // ===========================================================================

  app.get('/api/packages/catalog', (_req, res) => {
    const db = ctx.getDb();
    res.json(buildPublicPackageCatalog(db));
  });

  app.post('/api/packages/calculate', (req, res) => {
    const parsed = packageCalcInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Invalid package selection payload.',
      });
      return;
    }
    const db = ctx.getDb();
    const result = calculatePackage(parsed.data, buildPublicPackageCatalog(db));
    res.json({ calculation: result });
  });

  app.post('/api/packages/quotations', ctx.rateLimit(20), (req, res) => {
    const parsed = packageQuotationCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Please check your quotation form fields.',
      });
      return;
    }

    const db = ctx.getDb();
    const calculation = calculatePackage(
      parsed.data.packageInput,
      buildFullPackageCatalog(db),
      { includeCost: true },
    );

    if (!calculation.valid) {
      res.status(400).json({
        error: calculation.errors[0] || 'Please fix package validation errors before requesting a quotation.',
        errors: calculation.errors,
      });
      return;
    }

    const now = new Date().toISOString();
    const quotationId = `TRN-QT-${Date.now().toString(36).toUpperCase()}`;

    // Strip internal purchase cost before returning to public customer
    const publicCalculation = {
      ...calculation,
      estimatedCostInr: undefined,
      estimatedProfitInr: undefined,
      lines: calculation.lines.map(({ purchasePriceInr: _hidden, ...line }) => line),
    };

    const storedQuotation: PackageQuotation = {
      id: quotationId,
      customerName: parsed.data.customerName,
      phone: parsed.data.phone,
      email: parsed.data.email,
      city: parsed.data.city,
      state: parsed.data.state,
      companyName: parsed.data.companyName || undefined,
      gstin: parsed.data.gstin || undefined,
      notes: parsed.data.notes || '',
      systemType: calculation.systemType,
      channel: calculation.channel,
      megapixel: calculation.megapixel,
      calculation,
      status: 'new',
      createdAt: now,
      updatedAt: now,
    };

    db.packageQuotations.unshift(storedQuotation);

    // Mirror into Customer Enquiries so existing Enquiries CRM stays unified
    const enquiryRecord: CustomerEnquiry = {
      id: `ENQ-${Date.now().toString(36).toUpperCase()}`,
      type: 'package',
      name: parsed.data.customerName,
      phone: parsed.data.phone,
      email: parsed.data.email,
      city: parsed.data.city,
      state: parsed.data.state,
      subject: `${calculation.systemType} ${calculation.channel}CH ${calculation.megapixel} Package Quotation (${quotationId})`,
      productRef: quotationId,
      cameraCount: `${calculation.totalCameraCount} Cameras (${calculation.domeCameraCount} Dome, ${calculation.bulletCameraCount} Bullet)`,
      message: `Grand Total: ₹${calculation.grandTotalInr.toLocaleString('en-IN')} (Hardware ₹${calculation.productSubtotalInr.toLocaleString('en-IN')} + Install ₹${calculation.installationTotalInr.toLocaleString('en-IN')}). ${parsed.data.notes || 'Generated via Package Builder.'}`,
      status: 'new',
      createdAt: now,
    };
    db.enquiries.unshift(enquiryRecord);
    ctx.persistDb();

    res.status(201).json({
      message: `Quotation ${quotationId} generated and saved!`,
      quotation: {
        ...storedQuotation,
        calculation: publicCalculation,
      },
    });
  });

  app.get('/api/packages/quotations/:id', (req, res) => {
    const db = ctx.getDb();
    const id = req.params.id.trim().toUpperCase();
    const quotation = db.packageQuotations.find((q) => q.id.toUpperCase() === id);
    if (!quotation) {
      res.status(404).json({ error: 'Quotation not found.' });
      return;
    }

    const isAdmin = ctx.verifyTokenFromRequest(req);
    if (!isAdmin) {
      const phoneParam = typeof req.query.phone === 'string' ? req.query.phone : '';
      const tail = ctx.normalizePhoneTail(phoneParam);
      if (tail.length < 6 || !ctx.normalizePhoneTail(quotation.phone).endsWith(tail.slice(-6))) {
        res.status(401).json({ error: 'Phone verification or admin login is required to view this quotation.' });
        return;
      }
      const sanitized = {
        ...quotation,
        calculation: {
          ...quotation.calculation,
          estimatedCostInr: undefined,
          estimatedProfitInr: undefined,
          lines: quotation.calculation.lines.map(({ purchasePriceInr: _hidden, ...line }) => line),
        },
      };
      res.json({ quotation: sanitized });
      return;
    }

    res.json({ quotation });
  });

  app.post('/api/packages/orders', ctx.rateLimit(15), (req, res) => {
    const parsed = packageOrderCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Please check your package order details.',
      });
      return;
    }

    const db = ctx.getDb();
    const calculation = calculatePackage(
      parsed.data.packageInput,
      buildFullPackageCatalog(db),
      { includeCost: true, enforceStock: true },
    );

    if (!calculation.valid) {
      res.status(400).json({
        error: calculation.errors[0] || 'Package validation failed.',
        errors: calculation.errors,
      });
      return;
    }

    // Atomically deduct stock across ordered variants
    for (const line of calculation.lines) {
      const variant = db.packageVariants.find((v) => v.id === line.variantId);
      if (variant) {
        variant.stockQty = Math.max(0, variant.stockQty - line.quantity);
        variant.updatedAt = new Date().toISOString();
      }
    }

    const now = new Date().toISOString();
    const orderId = `TRN-PKO-${Date.now().toString(36).toUpperCase()}`;

    const storedOrder: PackageOrder = {
      id: orderId,
      quotationId: parsed.data.quotationId || undefined,
      customerName: parsed.data.customerName,
      phone: parsed.data.phone,
      email: parsed.data.email,
      address: parsed.data.address,
      city: parsed.data.city,
      state: parsed.data.state,
      pincode: parsed.data.pincode,
      gstCompanyName: parsed.data.gstCompanyName || undefined,
      gstin: parsed.data.gstin || undefined,
      paymentMethod: parsed.data.paymentMethod,
      notes: parsed.data.notes || '',
      systemType: calculation.systemType,
      channel: calculation.channel,
      megapixel: calculation.megapixel,
      calculation,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    db.packageOrders.unshift(storedOrder);

    if (parsed.data.quotationId) {
      const linkedQuote = db.packageQuotations.find((q) => q.id === parsed.data.quotationId);
      if (linkedQuote) {
        linkedQuote.status = 'converted';
        linkedQuote.updatedAt = now;
      }
    }

    ctx.persistDb();

    const publicOrder: PackageOrder = {
      ...storedOrder,
      calculation: {
        ...calculation,
        estimatedCostInr: undefined,
        estimatedProfitInr: undefined,
        lines: calculation.lines.map(({ purchasePriceInr: _hidden, ...line }) => line),
      },
    };

    res.status(201).json({
      message: `Custom CCTV Package Order ${orderId} confirmed!`,
      order: publicOrder,
    });
  });

  // ===========================================================================
  // AUTHENTICATED ADMIN PACKAGE CONTROL ENDPOINTS
  // ===========================================================================

  app.get('/api/admin/packages/overview', ctx.requireAdmin, (_req, res) => {
    const db = ctx.getDb();
    const lowStockVariants = db.packageVariants.filter(
      (v) => v.active && v.stockQty <= v.lowStockThreshold,
    );

    const activePackageOrders = db.packageOrders.filter((o) => o.status !== 'cancelled');
    const storePackageOrders = db.orders.filter(
      (o) => o.status !== 'cancelled' && Array.isArray(o.packageBundles) && o.packageBundles.length > 0,
    );

    const directPkgRevenueInr = activePackageOrders.reduce(
      (sum, o) => sum + o.calculation.grandTotalInr,
      0,
    );
    const storePkgRevenueInr = storePackageOrders.reduce(
      (sum, o) =>
        sum + (o.packageBundles ?? []).reduce((bSum, b) => bSum + b.bundleTotalInr, 0),
      0,
    );
    const estimatedProfitInr = activePackageOrders.reduce(
      (sum, o) => sum + (o.calculation.estimatedProfitInr ?? 0),
      0,
    );

    res.json({
      config: db.packageConfig,
      brands: [...db.packageBrands].sort((a, b) => a.sortOrder - b.sortOrder),
      components: [...db.packageComponents].sort((a, b) => a.sortOrder - b.sortOrder),
      variants: db.packageVariants,
      quotations: db.packageQuotations,
      packageOrders: db.packageOrders,
      lowStockVariants,
      summary: {
        totalBrands: db.packageBrands.length,
        activeBrands: db.packageBrands.filter((b) => b.active).length,
        totalComponents: db.packageComponents.length,
        totalVariants: db.packageVariants.length,
        lowStockCount: lowStockVariants.length,
        totalQuotations: db.packageQuotations.length,
        totalPackageOrders: db.packageOrders.length + storePackageOrders.length,
        totalPackageRevenueInr: directPkgRevenueInr + storePkgRevenueInr,
        estimatedProfitInr,
      },
      auditLogs: db.adminAuditLogs.slice(0, 150),
      backups: ctx.listBackups(),
    });
  });

  app.put('/api/admin/packages/config', ctx.requireAdmin, (req, res) => {
    const parsed = packageConfigUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Invalid package configuration.',
      });
      return;
    }
    const db = ctx.getDb();
    db.packageConfig = {
      ...parsed.data,
      availableChannels: Array.from(new Set(parsed.data.availableChannels)).sort((a, b) => a - b) as PackageConfig['availableChannels'],
      availableMegapixels: Array.from(new Set(parsed.data.availableMegapixels)) as PackageConfig['availableMegapixels'],
      updatedAt: new Date().toISOString(),
    };
    ctx.appendAuditLog(
      'UPDATE_CONFIG',
      'packageConfig',
      `Updated rates (HD ₹${db.packageConfig.hdInstallationPerCameraInr}/cam, IP ₹${db.packageConfig.ipInstallationPerCameraInr}/cam), Tax ${db.packageConfig.taxEnabled ? `${db.packageConfig.taxRatePercent}%` : 'OFF'}`,
    );
    ctx.persistDb();
    res.json({ config: db.packageConfig, message: 'Package builder settings saved live.' });
  });

  // --- Package Brands CRUD ---
  app.post('/api/admin/packages/brands', ctx.requireAdmin, (req, res) => {
    const parsed = packageBrandUpsertSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid brand data.' });
      return;
    }
    const db = ctx.getDb();
    if (
      db.packageBrands.some(
        (b) => b.name.toLowerCase() === parsed.data.name.toLowerCase(),
      )
    ) {
      res.status(400).json({ error: `Brand "${parsed.data.name}" already exists.` });
      return;
    }
    const brand: PackageBrand = {
      id: `brand-${parsed.data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Date.now().toString(36).slice(-3)}`,
      ...parsed.data,
    };
    db.packageBrands.push(brand);
    ctx.appendAuditLog('CREATE_BRAND', brand.id, `Added package brand ${brand.name}`);
    ctx.persistDb();
    res.status(201).json({ brand });
  });

  app.put('/api/admin/packages/brands/:id', ctx.requireAdmin, (req, res) => {
    const db = ctx.getDb();
    const idx = db.packageBrands.findIndex((b) => b.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Brand not found.' });
      return;
    }
    const parsed = packageBrandUpsertSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid brand data.' });
      return;
    }
    db.packageBrands[idx] = { ...db.packageBrands[idx], ...parsed.data };
    ctx.appendAuditLog('UPDATE_BRAND', db.packageBrands[idx].id, `Updated package brand ${db.packageBrands[idx].name}`);
    ctx.persistDb();
    res.json({ brand: db.packageBrands[idx] });
  });

  app.delete('/api/admin/packages/brands/:id', ctx.requireAdmin, (req, res) => {
    const db = ctx.getDb();
    const brand = db.packageBrands.find((b) => b.id === req.params.id);
    if (!brand) {
      res.status(404).json({ error: 'Brand not found.' });
      return;
    }
    const linkedCount = db.packageVariants.filter((v) => v.brandId === brand.id).length;
    const force = req.query.force === 'true';
    if (linkedCount > 0 && !force) {
      res.status(409).json({
        error: `Brand "${brand.name}" is mapped to ${linkedCount} product variants. Disable it instead or confirm force removal.`,
        linkedCount,
      });
      return;
    }
    db.packageBrands = db.packageBrands.filter((b) => b.id !== brand.id);
    if (force) {
      db.packageVariants = db.packageVariants.filter((v) => v.brandId !== brand.id);
    }
    ctx.appendAuditLog('DELETE_BRAND', brand.id, `Removed package brand ${brand.name} (${linkedCount} variants cleaned)`);
    ctx.persistDb();
    res.json({ deleted: true });
  });

  // --- Package Components CRUD ---
  app.post('/api/admin/packages/components', ctx.requireAdmin, (req, res) => {
    const parsed = packageComponentUpsertSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid component data.' });
      return;
    }
    const db = ctx.getDb();
    const isCamera =
      parsed.data.group === 'CAMERA_DOME' ||
      parsed.data.group === 'CAMERA_BULLET' ||
      parsed.data.isCamera;

    const component: PackageComponent = {
      id: `cmp-${Date.now().toString(36).toLowerCase()}`,
      ...parsed.data,
      isCamera,
    };
    db.packageComponents.push(component);
    ctx.appendAuditLog('CREATE_COMPONENT', component.id, `Added component "${component.name}" (${component.group})`);
    ctx.persistDb();
    res.status(201).json({ component });
  });

  app.put('/api/admin/packages/components/:id', ctx.requireAdmin, (req, res) => {
    const db = ctx.getDb();
    const idx = db.packageComponents.findIndex((c) => c.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Component not found.' });
      return;
    }
    const parsed = packageComponentUpsertSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid component data.' });
      return;
    }
    const isCamera =
      parsed.data.group === 'CAMERA_DOME' ||
      parsed.data.group === 'CAMERA_BULLET' ||
      parsed.data.isCamera;
    db.packageComponents[idx] = {
      ...db.packageComponents[idx],
      ...parsed.data,
      isCamera,
    };
    ctx.appendAuditLog('UPDATE_COMPONENT', db.packageComponents[idx].id, `Updated component "${db.packageComponents[idx].name}"`);
    ctx.persistDb();
    res.json({ component: db.packageComponents[idx] });
  });

  app.delete('/api/admin/packages/components/:id', ctx.requireAdmin, (req, res) => {
    const db = ctx.getDb();
    const comp = db.packageComponents.find((c) => c.id === req.params.id);
    if (!comp) {
      res.status(404).json({ error: 'Component not found.' });
      return;
    }
    const linkedCount = db.packageVariants.filter((v) => v.componentId === comp.id).length;
    const force = req.query.force === 'true';
    if (linkedCount > 0 && !force) {
      res.status(409).json({
        error: `Component "${comp.name}" has ${linkedCount} brand price variants. Disable it or confirm force delete.`,
        linkedCount,
      });
      return;
    }
    db.packageComponents = db.packageComponents.filter((c) => c.id !== comp.id);
    if (force) {
      db.packageVariants = db.packageVariants.filter((v) => v.componentId !== comp.id);
    }
    ctx.appendAuditLog('DELETE_COMPONENT', comp.id, `Deleted component "${comp.name}"`);
    ctx.persistDb();
    res.json({ deleted: true });
  });

  // --- Brand-Product Variants (Pricing, Compatibility & Stock) CRUD ---
  app.post('/api/admin/packages/variants', ctx.requireAdmin, (req, res) => {
    const parsed = packageVariantUpsertSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid variant data.' });
      return;
    }
    const db = ctx.getDb();
    const comp = db.packageComponents.find((c) => c.id === parsed.data.componentId);
    const brand = db.packageBrands.find((b) => b.id === parsed.data.brandId);
    if (!comp || !brand) {
      res.status(400).json({ error: 'Selected component or brand does not exist.' });
      return;
    }
    const duplicate = db.packageVariants.find(
      (v) => v.componentId === parsed.data.componentId && v.brandId === parsed.data.brandId,
    );
    if (duplicate) {
      res.status(409).json({
        error: `${brand.name} already has a variant for "${comp.name}". Edit the existing variant instead.`,
      });
      return;
    }
    const variant: PackageVariant = {
      id: `var-${Date.now().toString(36).toLowerCase()}`,
      ...parsed.data,
      updatedAt: new Date().toISOString(),
    };
    db.packageVariants.push(variant);
    ctx.appendAuditLog(
      'CREATE_VARIANT',
      variant.id,
      `Mapped ${brand.name} to ${comp.name} @ ₹${variant.sellingPriceInr} (Stock: ${variant.stockQty})`,
    );
    ctx.persistDb();
    res.status(201).json({ variant });
  });

  app.put('/api/admin/packages/variants/:id', ctx.requireAdmin, (req, res) => {
    const db = ctx.getDb();
    const idx = db.packageVariants.findIndex((v) => v.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Variant not found.' });
      return;
    }
    const parsed = packageVariantUpsertSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid variant data.' });
      return;
    }
    const duplicate = db.packageVariants.find(
      (v, i) =>
        i !== idx &&
        v.componentId === parsed.data.componentId &&
        v.brandId === parsed.data.brandId,
    );
    if (duplicate) {
      res.status(409).json({ error: 'Another variant already exists for that component & brand pair.' });
      return;
    }
    db.packageVariants[idx] = {
      ...db.packageVariants[idx],
      ...parsed.data,
      updatedAt: new Date().toISOString(),
    };
    ctx.appendAuditLog(
      'UPDATE_VARIANT',
      db.packageVariants[idx].id,
      `Updated ${db.packageVariants[idx].modelCode}: Sell ₹${db.packageVariants[idx].sellingPriceInr}, Buy ₹${db.packageVariants[idx].purchasePriceInr}, Stock ${db.packageVariants[idx].stockQty}`,
    );
    ctx.persistDb();
    res.json({ variant: db.packageVariants[idx] });
  });

  app.delete('/api/admin/packages/variants/:id', ctx.requireAdmin, (req, res) => {
    const db = ctx.getDb();
    const existing = db.packageVariants.find((v) => v.id === req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Variant not found.' });
      return;
    }
    db.packageVariants = db.packageVariants.filter((v) => v.id !== existing.id);
    ctx.appendAuditLog('DELETE_VARIANT', existing.id, `Removed variant ${existing.modelCode}`);
    ctx.persistDb();
    res.json({ deleted: true });
  });

  // --- Package Quotations & Package Orders Status Updates ---
  app.patch('/api/admin/packages/quotations/:id', ctx.requireAdmin, (req, res) => {
    const schema = z.object({
      status: z.enum(['new', 'sent', 'approved', 'converted', 'archived']),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid quotation status.' });
      return;
    }
    const db = ctx.getDb();
    const item = db.packageQuotations.find((q) => q.id === req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Quotation not found.' });
      return;
    }
    item.status = parsed.data.status;
    item.updatedAt = new Date().toISOString();
    ctx.appendAuditLog('UPDATE_QUOTATION', item.id, `Marked quotation ${item.id} as ${item.status}`);
    ctx.persistDb();
    res.json({ quotation: item });
  });

  app.patch('/api/admin/packages/orders/:id', ctx.requireAdmin, (req, res) => {
    const schema = z.object({
      status: z.enum(['pending', 'confirmed', 'dispatched', 'installed', 'completed', 'cancelled']),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid package order status.' });
      return;
    }
    const db = ctx.getDb();
    const item = db.packageOrders.find((o) => o.id === req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Package order not found.' });
      return;
    }

    const previousStatus = item.status;
    const nextStatus = parsed.data.status;

    // Restock if cancelling an active order
    if (previousStatus !== 'cancelled' && nextStatus === 'cancelled') {
      for (const line of item.calculation.lines) {
        const variant = db.packageVariants.find((v) => v.id === line.variantId);
        if (variant) {
          variant.stockQty += line.quantity;
          variant.updatedAt = new Date().toISOString();
        }
      }
    }

    item.status = nextStatus;
    item.updatedAt = new Date().toISOString();
    ctx.appendAuditLog('UPDATE_PACKAGE_ORDER', item.id, `Order ${item.id} changed ${previousStatus} → ${nextStatus}`);
    ctx.persistDb();
    res.json({ order: item });
  });

  // --- Package Analytics & Reports ---
  app.get('/api/admin/packages/reports', ctx.requireAdmin, (_req, res) => {
    const db = ctx.getDb();
    const validOrders = db.packageOrders.filter((o) => o.status !== 'cancelled');
    const hdOrders = validOrders.filter((o) => o.systemType === 'HD');
    const ipOrders = validOrders.filter((o) => o.systemType === 'IP');

    const brandSalesMap = new Map<string, { brandName: string; units: number; revenueInr: number }>();
    for (const order of validOrders) {
      for (const line of order.calculation.lines) {
        const current = brandSalesMap.get(line.brandId) ?? {
          brandName: line.brandName,
          units: 0,
          revenueInr: 0,
        };
        current.units += line.quantity;
        current.revenueInr += line.lineTotalInr;
        brandSalesMap.set(line.brandId, current);
      }
    }

    const lowStock = db.packageVariants
      .filter((v) => v.active && v.stockQty <= v.lowStockThreshold)
      .map((v) => {
        const comp = db.packageComponents.find((c) => c.id === v.componentId);
        const brand = db.packageBrands.find((b) => b.id === v.brandId);
        return {
          variantId: v.id,
          modelCode: v.modelCode,
          componentName: comp?.name || v.componentId,
          brandName: brand?.name || v.brandId,
          stockQty: v.stockQty,
          lowStockThreshold: v.lowStockThreshold,
          sellingPriceInr: v.sellingPriceInr,
        };
      });

    res.json({
      generatedAt: new Date().toISOString(),
      totals: {
        packageOrdersCount: validOrders.length,
        quotationsCount: db.packageQuotations.length,
        revenueInr: validOrders.reduce((s, o) => s + o.calculation.grandTotalInr, 0),
        installationRevenueInr: validOrders.reduce((s, o) => s + o.calculation.installationTotalInr, 0),
        estimatedProfitInr: validOrders.reduce((s, o) => s + (o.calculation.estimatedProfitInr ?? 0), 0),
        hdOrdersCount: hdOrders.length,
        ipOrdersCount: ipOrders.length,
      },
      topBrands: Array.from(brandSalesMap.values()).sort((a, b) => b.revenueInr - a.revenueInr),
      lowStock,
    });
  });

  // --- Audit Logs & Database Backup / Restore ---
  app.get('/api/admin/audit-logs', ctx.requireAdmin, (_req, res) => {
    const db = ctx.getDb();
    res.json({ auditLogs: db.adminAuditLogs.slice(0, 200) });
  });

  app.get('/api/admin/db/backups', ctx.requireAdmin, (_req, res) => {
    res.json({ backups: ctx.listBackups() });
  });

  app.post('/api/admin/db/backup', ctx.requireAdmin, (_req, res) => {
    const backup = ctx.createBackupSnapshot('manual-admin-backup');
    ctx.appendAuditLog('DB_BACKUP', backup.fileName, `Created database backup snapshot (${backup.fileName})`);
    ctx.persistDb();
    res.status(201).json({
      backup,
      snapshotData: ctx.exportFullDbSnapshot(),
      message: `Backup snapshot ${backup.fileName} created successfully.`,
    });
  });

  app.post('/api/admin/db/restore', ctx.requireAdmin, (req, res) => {
    const schema = z.object({
      fileName: z.string().trim().min(1).max(160).optional(),
      snapshotData: z.unknown().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success || (!parsed.data.fileName && !parsed.data.snapshotData)) {
      res.status(400).json({ error: 'Provide either a backup fileName or JSON snapshotData to restore.' });
      return;
    }

    try {
      if (parsed.data.fileName) {
        const result = ctx.restoreFromBackupFile(parsed.data.fileName);
        ctx.appendAuditLog(
          'DB_RESTORE',
          result.restoredFrom,
          `Restored DB from ${result.restoredFrom} (safety backup: ${result.safetyBackup.fileName})`,
        );
        ctx.persistDb();
        res.json({
          message: `Database restored from ${result.restoredFrom}. Pre-restore safety snapshot saved as ${result.safetyBackup.fileName}.`,
          safetyBackup: result.safetyBackup,
        });
        return;
      }

      const result = ctx.restoreFromJsonPayload(parsed.data.snapshotData);
      ctx.appendAuditLog(
        'DB_RESTORE',
        'uploaded-json',
        `Restored DB from uploaded JSON (safety backup: ${result.safetyBackup.fileName})`,
      );
      ctx.persistDb();
      res.json({
        message: `Database restored from uploaded snapshot. Pre-restore safety backup saved as ${result.safetyBackup.fileName}.`,
        safetyBackup: result.safetyBackup,
      });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : 'Unable to restore database backup.',
      });
    }
  });
}
