import type {
  AdminAnalytics,
  AdminAuditLogEntry,
  AvailabilityStatus,
  BrandPartnerItem,
  BusinessSettings,
  ClientTestimonial,
  CustomerEnquiry,
  DatabaseBackupInfo,
  EnquiryStatus,
  EnquiryType,
  OrderStatus,
  PackageBrand,
  PackageCalculationInput,
  PackageCalculationResult,
  PackageCatalogData,
  PackageComponent,
  PackageConfig,
  PackageOrder,
  PackageOrderStatus,
  PackageQuotation,
  PackageQuotationStatus,
  PackageVariant,
  PaymentMethod,
  ProductCategory,
  ProductItem,
  PromoOffer,
  StoreOrder,
} from '../types.ts';

async function requestJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof data?.error === 'string'
        ? data.error
        : `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  return data as T;
}

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

export const api = {
  // Public routes
  getSettings: () => requestJson<BusinessSettings>('/api/settings'),
  getBrands: () => requestJson<{ brands: BrandPartnerItem[] }>('/api/brands'),
  getOffers: () => requestJson<{ offers: PromoOffer[] }>('/api/offers'),

  validateCoupon: (code: string, subtotalInr: number) =>
    requestJson<{
      valid: boolean;
      discountInr: number;
      offer: PromoOffer | null;
      message: string;
    }>('/api/offers/validate', {
      method: 'POST',
      body: JSON.stringify({ code, subtotalInr }),
    }),

  getProducts: (params?: {
    category?: string;
    brand?: string;
    search?: string;
    featured?: boolean;
    inStock?: boolean;
  }) => {
    const qs = new URLSearchParams();
    if (params?.category && params.category !== 'All') qs.set('category', params.category);
    if (params?.brand && params.brand !== 'All') qs.set('brand', params.brand);
    if (params?.search) qs.set('search', params.search);
    if (params?.featured) qs.set('featured', 'true');
    if (params?.inStock) qs.set('inStock', 'true');
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return requestJson<{ products: ProductItem[]; total: number }>(`/api/products${suffix}`);
  },

  placeOrder: (payload: {
    items: Array<{ productId: string; quantity: number }>;
    packageBundles?: Array<{ label?: string; input: PackageCalculationInput }>;
    includeInstallation: boolean;
    couponCode: string;
    paymentMethod: PaymentMethod;
    customerName: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: 'Andhra Pradesh' | 'Telangana' | 'Other';
    pincode: string;
    gstCompanyName?: string;
    gstin?: string;
    notes: string;
  }) =>
    requestJson<{ message: string; order: StoreOrder }>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  trackReference: (id: string, phone: string) =>
    requestJson<
      | { kind: 'order'; record: StoreOrder }
      | { kind: 'enquiry'; record: CustomerEnquiry }
    >(`/api/track?id=${encodeURIComponent(id)}&phone=${encodeURIComponent(phone)}`),

  submitEnquiry: (payload: {
    type: EnquiryType;
    name: string;
    phone: string;
    email: string;
    city: string;
    state: 'Andhra Pradesh' | 'Telangana' | 'Other';
    subject: string;
    productRef?: string;
    serviceRef?: string;
    cameraCount?: string;
    message: string;
  }) =>
    requestJson<{ message: string; enquiry: CustomerEnquiry }>('/api/enquiries', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getApprovedTestimonials: () =>
    requestJson<{ testimonials: ClientTestimonial[] }>('/api/testimonials'),

  submitTestimonial: (payload: {
    clientName: string;
    organization: string;
    city: string;
    state: 'Andhra Pradesh' | 'Telangana';
    serviceUsed: string;
    feedback: string;
  }) =>
    requestJson<{ message: string; testimonial: ClientTestimonial }>('/api/testimonials', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Admin endpoints
  getAdminStatus: (token?: string) =>
    requestJson<{ configured: boolean; authenticated: boolean }>('/api/admin/status', {
      headers: token ? authHeaders(token) : undefined,
    }),

  loginAdmin: (passcode: string) =>
    requestJson<{ token: string }>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ passcode }),
    }),

  changeAdminPassword: (token: string, currentPasscode: string, newPasscode: string) =>
    requestJson<{ message: string; token: string }>('/api/admin/change-password', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ currentPasscode, newPasscode }),
    }),

  getAdminAnalytics: (token: string) =>
    requestJson<AdminAnalytics>('/api/admin/analytics', {
      headers: authHeaders(token),
    }),

  uploadImage: (token: string, dataUrl: string, prefix: 'logo' | 'product' | 'brand') =>
    requestJson<{ url: string }>('/api/admin/upload', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ dataUrl, prefix }),
    }),

  updateSettings: (token: string, settings: Omit<BusinessSettings, 'updatedAt'>) =>
    requestJson<{ settings: BusinessSettings; message: string }>('/api/admin/settings', {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify(settings),
    }),

  // Admin Brands
  getAdminBrands: (token: string) =>
    requestJson<{ brands: BrandPartnerItem[] }>('/api/admin/brands', {
      headers: authHeaders(token),
    }),

  createBrand: (token: string, payload: Omit<BrandPartnerItem, 'id'>) =>
    requestJson<{ brand: BrandPartnerItem }>('/api/admin/brands', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    }),

  updateBrand: (token: string, id: string, payload: Omit<BrandPartnerItem, 'id'>) =>
    requestJson<{ brand: BrandPartnerItem }>(`/api/admin/brands/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    }),

  deleteBrand: (token: string, id: string) =>
    requestJson<{ deleted: boolean }>(`/api/admin/brands/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    }),

  // Admin Offers
  getAdminOffers: (token: string) =>
    requestJson<{ offers: PromoOffer[] }>('/api/admin/offers', {
      headers: authHeaders(token),
    }),

  createOffer: (token: string, payload: Omit<PromoOffer, 'id' | 'updatedAt'>) =>
    requestJson<{ offer: PromoOffer }>('/api/admin/offers', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    }),

  updateOffer: (token: string, id: string, payload: Omit<PromoOffer, 'id' | 'updatedAt'>) =>
    requestJson<{ offer: PromoOffer }>(`/api/admin/offers/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    }),

  deleteOffer: (token: string, id: string) =>
    requestJson<{ deleted: boolean }>(`/api/admin/offers/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    }),

  // Admin Products
  createProduct: (
    token: string,
    payload: {
      name: string;
      category: ProductCategory;
      brand: string;
      model: string;
      description: string;
      mrpInr: number | null;
      priceInr: number | null;
      warranty: string;
      availability: AvailabilityStatus;
      imageUrl: string;
      featured: boolean;
      isReferenceEntry?: boolean;
    },
  ) =>
    requestJson<{ product: ProductItem }>('/api/admin/products', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    }),

  updateProduct: (
    token: string,
    id: string,
    payload: {
      name: string;
      category: ProductCategory;
      brand: string;
      model: string;
      description: string;
      mrpInr: number | null;
      priceInr: number | null;
      warranty: string;
      availability: AvailabilityStatus;
      imageUrl: string;
      featured: boolean;
      isReferenceEntry?: boolean;
    },
  ) =>
    requestJson<{ product: ProductItem }>(`/api/admin/products/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    }),

  deleteProduct: (token: string, id: string) =>
    requestJson<{ deleted: boolean }>(`/api/admin/products/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    }),

  // Admin Orders
  getAdminOrders: (token: string) =>
    requestJson<{ orders: StoreOrder[] }>('/api/admin/orders', {
      headers: authHeaders(token),
    }),

  updateOrderStatus: (token: string, id: string, status: OrderStatus) =>
    requestJson<{ order: StoreOrder }>(`/api/admin/orders/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify({ status }),
    }),

  // Admin Enquiries & Testimonials
  getAdminEnquiries: (token: string) =>
    requestJson<{ enquiries: CustomerEnquiry[] }>('/api/admin/enquiries', {
      headers: authHeaders(token),
    }),

  updateEnquiryStatus: (token: string, id: string, status: EnquiryStatus) =>
    requestJson<{ enquiry: CustomerEnquiry }>(`/api/admin/enquiries/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify({ status }),
    }),

  getAdminTestimonials: (token: string) =>
    requestJson<{ testimonials: ClientTestimonial[] }>('/api/admin/testimonials', {
      headers: authHeaders(token),
    }),

  updateTestimonialStatus: (token: string, id: string, status: 'pending' | 'approved') =>
    requestJson<{ testimonial: ClientTestimonial }>(
      `/api/admin/testimonials/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        headers: authHeaders(token),
        body: JSON.stringify({ status }),
      },
    ),

  deleteTestimonial: (token: string, id: string) =>
    requestJson<{ deleted: boolean }>(`/api/admin/testimonials/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    }),

  // ===========================================================================
  // PUBLIC HD & IP CCTV PACKAGE BUILDER API
  // ===========================================================================
  getPackageCatalog: () => requestJson<PackageCatalogData>('/api/packages/catalog'),

  calculatePackageServer: (input: PackageCalculationInput) =>
    requestJson<{ calculation: PackageCalculationResult }>('/api/packages/calculate', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  createPackageQuotation: (payload: {
    customerName: string;
    phone: string;
    email: string;
    city: string;
    state: 'Andhra Pradesh' | 'Telangana' | 'Other';
    companyName?: string;
    gstin?: string;
    notes?: string;
    packageInput: PackageCalculationInput;
  }) =>
    requestJson<{ message: string; quotation: PackageQuotation }>('/api/packages/quotations', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  createPackageOrder: (payload: {
    quotationId?: string;
    customerName: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    state: 'Andhra Pradesh' | 'Telangana' | 'Other';
    pincode: string;
    gstCompanyName?: string;
    gstin?: string;
    paymentMethod: PaymentMethod;
    notes?: string;
    packageInput: PackageCalculationInput;
  }) =>
    requestJson<{ message: string; order: PackageOrder }>('/api/packages/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // ===========================================================================
  // ADMIN HD & IP CCTV PACKAGE CONTROL API
  // ===========================================================================
  getAdminPackagesOverview: (token: string) =>
    requestJson<{
      config: PackageConfig;
      brands: PackageBrand[];
      components: PackageComponent[];
      variants: PackageVariant[];
      quotations: PackageQuotation[];
      packageOrders: PackageOrder[];
      lowStockVariants: PackageVariant[];
      summary: {
        totalBrands: number;
        activeBrands: number;
        totalComponents: number;
        totalVariants: number;
        lowStockCount: number;
        totalQuotations: number;
        totalPackageOrders: number;
        totalPackageRevenueInr: number;
        estimatedProfitInr: number;
      };
      auditLogs: AdminAuditLogEntry[];
      backups: DatabaseBackupInfo[];
    }>('/api/admin/packages/overview', {
      headers: authHeaders(token),
    }),

  updateAdminPackageConfig: (token: string, config: Omit<PackageConfig, 'updatedAt'>) =>
    requestJson<{ config: PackageConfig; message: string }>('/api/admin/packages/config', {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify(config),
    }),

  createAdminPackageBrand: (token: string, payload: Omit<PackageBrand, 'id'>) =>
    requestJson<{ brand: PackageBrand }>('/api/admin/packages/brands', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    }),

  updateAdminPackageBrand: (token: string, id: string, payload: Omit<PackageBrand, 'id'>) =>
    requestJson<{ brand: PackageBrand }>(`/api/admin/packages/brands/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    }),

  deleteAdminPackageBrand: (token: string, id: string, force = false) =>
    requestJson<{ deleted: boolean }>(
      `/api/admin/packages/brands/${encodeURIComponent(id)}${force ? '?force=true' : ''}`,
      {
        method: 'DELETE',
        headers: authHeaders(token),
      },
    ),

  createAdminPackageComponent: (token: string, payload: Omit<PackageComponent, 'id'>) =>
    requestJson<{ component: PackageComponent }>('/api/admin/packages/components', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    }),

  updateAdminPackageComponent: (
    token: string,
    id: string,
    payload: Omit<PackageComponent, 'id'>,
  ) =>
    requestJson<{ component: PackageComponent }>(
      `/api/admin/packages/components/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify(payload),
      },
    ),

  deleteAdminPackageComponent: (token: string, id: string, force = false) =>
    requestJson<{ deleted: boolean }>(
      `/api/admin/packages/components/${encodeURIComponent(id)}${force ? '?force=true' : ''}`,
      {
        method: 'DELETE',
        headers: authHeaders(token),
      },
    ),

  createAdminPackageVariant: (
    token: string,
    payload: Omit<PackageVariant, 'id' | 'updatedAt'> & { purchasePriceInr: number },
  ) =>
    requestJson<{ variant: PackageVariant }>('/api/admin/packages/variants', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    }),

  updateAdminPackageVariant: (
    token: string,
    id: string,
    payload: Omit<PackageVariant, 'id' | 'updatedAt'> & { purchasePriceInr: number },
  ) =>
    requestJson<{ variant: PackageVariant }>(
      `/api/admin/packages/variants/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify(payload),
      },
    ),

  deleteAdminPackageVariant: (token: string, id: string) =>
    requestJson<{ deleted: boolean }>(`/api/admin/packages/variants/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    }),

  updateAdminPackageQuotationStatus: (
    token: string,
    id: string,
    status: PackageQuotationStatus,
  ) =>
    requestJson<{ quotation: PackageQuotation }>(
      `/api/admin/packages/quotations/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        headers: authHeaders(token),
        body: JSON.stringify({ status }),
      },
    ),

  updateAdminPackageOrderStatus: (token: string, id: string, status: PackageOrderStatus) =>
    requestJson<{ order: PackageOrder }>(
      `/api/admin/packages/orders/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        headers: authHeaders(token),
        body: JSON.stringify({ status }),
      },
    ),

  getAdminPackageReports: (token: string) =>
    requestJson<{
      generatedAt: string;
      totals: {
        packageOrdersCount: number;
        quotationsCount: number;
        revenueInr: number;
        installationRevenueInr: number;
        estimatedProfitInr: number;
        hdOrdersCount: number;
        ipOrdersCount: number;
      };
      topBrands: Array<{ brandName: string; units: number; revenueInr: number }>;
      lowStock: Array<{
        variantId: string;
        modelCode: string;
        componentName: string;
        brandName: string;
        stockQty: number;
        lowStockThreshold: number;
        sellingPriceInr: number;
      }>;
    }>('/api/admin/packages/reports', {
      headers: authHeaders(token),
    }),

  createAdminDbBackup: (token: string) =>
    requestJson<{ backup: DatabaseBackupInfo; snapshotData: unknown; message: string }>(
      '/api/admin/db/backup',
      {
        method: 'POST',
        headers: authHeaders(token),
      },
    ),

  restoreAdminDbBackup: (
    token: string,
    payload: { fileName?: string; snapshotData?: unknown },
  ) =>
    requestJson<{ message: string; safetyBackup: DatabaseBackupInfo }>('/api/admin/db/restore', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(payload),
    }),
};
