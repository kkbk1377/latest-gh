export type ProductCategory =
  | 'CCTV Combo Kits'
  | 'Bullet Cameras'
  | 'Dome Cameras'
  | 'IP Cameras'
  | 'Wi-Fi Cameras'
  | 'DVR'
  | 'NVR'
  | 'Biometric & Access Control'
  | 'Smart Door Locks'
  | 'Video Door Phones'
  | 'Fire & Intrusion Alarms'
  | 'Surveillance Hard Disks'
  | 'PoE Switches'
  | 'P2P Devices'
  | 'Wi-Fi Routers & Extenders'
  | 'Racks'
  | 'CCTV Cables'
  | 'BNC Cables'
  | 'DC Pins'
  | 'RJ45 Connectors'
  | 'PoE Boxes'
  | 'PVC Boxes'
  | 'Other CCTV Accessories';

export type AvailabilityStatus =
  | 'In Stock'
  | 'Confirm via Enquiry'
  | 'Made to Order'
  | 'Out of Stock';

export interface ProductItem {
  id: string;
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
  isReferenceEntry: boolean;
  updatedAt: string;
}

export interface BrandPartnerItem {
  id: string;
  name: string;
  shortMark: string;
  accentHex: string;
  categoryNote: string;
  logoUrl: string;
  active: boolean;
}

export interface PromoOffer {
  id: string;
  title: string;
  code: string;
  description: string;
  discountType: 'percent' | 'flat';
  discountValue: number;
  minOrderInr: number;
  active: boolean;
  showInBanner: boolean;
  validUntil: string;
  updatedAt: string;
}

export interface BusinessSettings {
  businessName: string;
  domain: string;
  tagline: string;
  logoUrl: string;
  heroBadgeText: string;
  heroHeadline: string;
  heroSubtitle: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  businessHours: string;
  serviceAreas: string[];
  officeLocationName: string;
  officeLat: number;
  officeLng: number;
  freeDeliveryThresholdInr: number;
  installationBaseFeeInr: number;
  upiId: string;
  updatedAt: string;
}

export type EnquiryType = 'quote' | 'contact' | 'service' | 'product' | 'planner' | 'package';
export type EnquiryStatus = 'new' | 'contacted' | 'quoted' | 'closed';

export interface CustomerEnquiry {
  id: string;
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
  status: EnquiryStatus;
  createdAt: string;
}

export interface OrderLineItem {
  productId: string;
  name: string;
  brand: string;
  model: string;
  unitPriceInr: number;
  quantity: number;
  lineTotalInr: number;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'dispatched'
  | 'installed'
  | 'delivered'
  | 'cancelled';

export type PaymentMethod = 'PAY_ON_INSTALLATION' | 'UPI_ON_DELIVERY';

export interface StoreOrderPackageSummary {
  bundleId: string;
  label: string;
  systemType: PackageSystemType;
  channel: PackageChannel;
  megapixel: PackageMegapixel;
  cameraCount: number;
  productSubtotalInr: number;
  installationTotalInr: number;
  discountInr: number;
  taxInr: number;
  bundleTotalInr: number;
  items: PackageCalculatedLine[];
}

export interface StoreOrder {
  id: string;
  items: OrderLineItem[];
  packageBundles?: StoreOrderPackageSummary[];
  includeInstallation: boolean;
  subtotalInr: number;
  installationFeeInr: number;
  deliveryFeeInr: number;
  discountInr: number;
  taxInr?: number;
  couponCode: string;
  totalInr: number;
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
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ClientTestimonial {
  id: string;
  clientName: string;
  organization: string;
  city: string;
  state: 'Andhra Pradesh' | 'Telangana';
  serviceUsed: string;
  feedback: string;
  status: 'pending' | 'approved';
  createdAt: string;
}

export interface ServiceItem {
  id: string;
  number: string;
  title: string;
  shortDescription: string;
  details: string;
  deliverables: string[];
  idealFor: string;
}

export interface CoverageHub {
  id: string;
  city: string;
  state: 'Andhra Pradesh' | 'Telangana';
  regionLabel: string;
  lat: number;
  lng: number;
  districtsCovered: string[];
}

export interface AdminAnalytics {
  totalProducts: number;
  pricedProducts: number;
  activeOffers: number;
  totalOrders: number;
  pendingOrders: number;
  confirmedRevenueInr: number;
  totalEnquiries: number;
  newEnquiries: number;
  pendingReviews: number;
  totalPackageOrders?: number;
  totalPackageQuotations?: number;
  lowStockPackageVariants?: number;
}

// =============================================================================
// HD & IP CCTV PACKAGE BUILDER TYPES
// =============================================================================

export type PackageSystemType = 'HD' | 'IP';
export type PackageChannel = 4 | 8 | 16 | 32;
export type PackageMegapixel = '2MP' | '3MP' | '4MP' | '5MP';

export type PackageComponentGroup =
  | 'CAMERA_DOME'
  | 'CAMERA_BULLET'
  | 'RECORDER'
  | 'POWER_SMPS'
  | 'POE_SWITCH'
  | 'HDD'
  | 'RACK'
  | 'CABLE'
  | 'ACCESSORY';

export interface PackageDiscountRule {
  id: string;
  code: string;
  title: string;
  discountType: 'percent' | 'flat';
  discountValue: number;
  minSubtotalInr: number;
  systemTypes: PackageSystemType[];
  active: boolean;
}

export interface PackageConfig {
  enabled: boolean;
  hdEnabled: boolean;
  ipEnabled: boolean;
  availableChannels: PackageChannel[];
  availableMegapixels: PackageMegapixel[];
  hdInstallationPerCameraInr: number;
  ipInstallationPerCameraInr: number;
  taxEnabled: boolean;
  taxLabel: string;
  taxRatePercent: number;
  quotationValidityDays: number;
  quotationTerms: string[];
  discountRules: PackageDiscountRule[];
  updatedAt: string;
}

export interface PackageBrand {
  id: string;
  name: string;
  shortMark: string;
  accentHex: string;
  logoUrl: string;
  description: string;
  active: boolean;
  sortOrder: number;
}

export interface PackageComponent {
  id: string;
  name: string;
  group: PackageComponentGroup;
  systemTypes: PackageSystemType[];
  supportedChannels?: PackageChannel[];
  supportedMegapixels?: PackageMegapixel[];
  unitLabel: string;
  isCamera: boolean;
  storageTb?: number;
  portCount?: number;
  recommendedFor?: string;
  description: string;
  active: boolean;
  sortOrder: number;
}

export interface PackageVariant {
  id: string;
  componentId: string;
  brandId: string;
  modelCode: string;
  specs: string;
  warranty: string;
  purchasePriceInr?: number; // Omitted in public catalog responses
  sellingPriceInr: number;
  stockQty: number;
  lowStockThreshold: number;
  imageUrl: string;
  active: boolean;
  updatedAt: string;
}

export interface PackageCatalogData {
  config: PackageConfig;
  brands: PackageBrand[];
  components: PackageComponent[];
  variants: PackageVariant[];
}

export interface PackageSelectionItem {
  componentId: string;
  brandId: string;
  quantity: number;
}

export interface PackageCalculationInput {
  systemType: PackageSystemType;
  channel: PackageChannel;
  megapixel: PackageMegapixel;
  items: PackageSelectionItem[];
  discountCode?: string;
}

export interface PackageCalculatedLine {
  componentId: string;
  componentName: string;
  group: PackageComponentGroup;
  isCamera: boolean;
  unitLabel: string;
  brandId: string;
  brandName: string;
  variantId: string;
  modelCode: string;
  specs: string;
  warranty: string;
  quantity: number;
  unitPriceInr: number;
  lineTotalInr: number;
  purchasePriceInr?: number;
  stockQty: number;
}

export interface PackageCalculationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  systemType: PackageSystemType;
  channel: PackageChannel;
  megapixel: PackageMegapixel;
  lines: PackageCalculatedLine[];
  totalCameraCount: number;
  domeCameraCount: number;
  bulletCameraCount: number;
  remainingCameraSlots: number;
  productSubtotalInr: number;
  installationRatePerCameraInr: number;
  installationTotalInr: number;
  discountCode: string;
  discountTitle: string;
  discountInr: number;
  taxEnabled: boolean;
  taxLabel: string;
  taxRatePercent: number;
  taxInr: number;
  grandTotalInr: number;
  estimatedRecordingDays: number | null;
  totalStorageTb: number;
  estimatedCostInr?: number;
  estimatedProfitInr?: number;
}

export type PackageQuotationStatus = 'new' | 'sent' | 'approved' | 'converted' | 'archived';

export interface PackageQuotation {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  city: string;
  state: 'Andhra Pradesh' | 'Telangana' | 'Other';
  companyName?: string;
  gstin?: string;
  notes: string;
  systemType: PackageSystemType;
  channel: PackageChannel;
  megapixel: PackageMegapixel;
  calculation: PackageCalculationResult;
  status: PackageQuotationStatus;
  createdAt: string;
  updatedAt: string;
}

export type PackageOrderStatus =
  | 'pending'
  | 'confirmed'
  | 'dispatched'
  | 'installed'
  | 'completed'
  | 'cancelled';

export interface PackageOrder {
  id: string;
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
  notes: string;
  systemType: PackageSystemType;
  channel: PackageChannel;
  megapixel: PackageMegapixel;
  calculation: PackageCalculationResult;
  status: PackageOrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CartPackageBundle {
  id: string;
  label: string;
  input: PackageCalculationInput;
  preview: PackageCalculationResult;
  addedAt: string;
}

export interface SavedPackageConfig {
  id: string;
  name: string;
  input: PackageCalculationInput;
  summaryTotalInr: number;
  cameraCount: number;
  savedAt: string;
}

export interface AdminAuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  entity: string;
  summary: string;
}

export interface DatabaseBackupInfo {
  fileName: string;
  createdAt: string;
  sizeBytes: number;
  reason: string;
}

