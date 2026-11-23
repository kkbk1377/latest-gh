import {
  Check,
  Copy,
  FileText,
  Filter,
  LayoutGrid,
  List,
  RotateCcw,
  Scale,
  Search,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Truck,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CompareModal } from '../components/CompareModal.tsx';
import { ProductCard } from '../components/ProductCard.tsx';
import { ProductDetailModal } from '../components/ProductDetailModal.tsx';
import { useBusiness } from '../context/BusinessContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import { PRODUCT_CATEGORIES, STORE_DEPARTMENTS } from '../data/catalogData.ts';
import { api } from '../lib/api.ts';
import type { ProductItem } from '../types.ts';

type SortMode = 'featured' | 'price-asc' | 'price-desc' | 'discount-desc';
type PriceBand = 'all' | 'under-1500' | '1500-4000' | '4000-10000' | 'above-10000';

const PRICE_BANDS: Array<{ id: PriceBand; label: string; min: number; max: number }> = [
  { id: 'all', label: 'All Prices', min: 0, max: Number.MAX_SAFE_INTEGER },
  { id: 'under-1500', label: 'Under ₹1,500', min: 0, max: 1499 },
  { id: '1500-4000', label: '₹1,500 – ₹4,000', min: 1500, max: 4000 },
  { id: '4000-10000', label: '₹4,000 – ₹10,000', min: 4001, max: 10000 },
  { id: 'above-10000', label: 'Above ₹10,000', min: 10001, max: Number.MAX_SAFE_INTEGER },
];

const QUICK_STRIP_CATEGORIES = [
  'All',
  'CCTV Combo Kits',
  'Bullet Cameras',
  'Dome Cameras',
  'IP Cameras',
  'Wi-Fi Cameras',
  'Biometric & Access Control',
  'Smart Door Locks',
  'Video Door Phones',
  'Fire & Intrusion Alarms',
  'DVR',
  'NVR',
  'Surveillance Hard Disks',
  'PoE Switches',
] as const;

function getDiscountPct(p: ProductItem): number {
  if (!p.mrpInr || !p.priceInr || p.mrpInr <= p.priceInr) return 0;
  return Math.round(((p.mrpInr - p.priceInr) / p.mrpInr) * 100);
}

export function ProductsPage() {
  const { brands, offers, openQuoteModal } = useBusiness();
  const { totalCount, openDrawer } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();

  // Full store inventory loaded once for instant faceted filtering & live counts
  const [allProducts, setAllProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Faceted filter state
  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams.get('category') || 'All',
  );
  const [selectedBrands, setSelectedBrands] = useState<string[]>(() => {
    const b = searchParams.get('brand');
    return b && b !== 'All' ? [b] : [];
  });
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('search') || '');
  const [priceBand, setPriceBand] = useState<PriceBand>('all');
  const [minDiscount, setMinDiscount] = useState<number>(0);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sortMode, setSortMode] = useState<SortMode>('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mobileFilterOpen, setMobileFilterOpen] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Quick View & Compare
  const [quickViewProduct, setQuickViewProduct] = useState<ProductItem | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState<boolean>(false);

  useEffect(() => {
    const paramBrand = searchParams.get('brand');
    const paramCat = searchParams.get('category') || 'All';
    const paramSearch = searchParams.get('search');
    setSelectedCategory(paramCat);
    setSelectedBrands(paramBrand && paramBrand !== 'All' ? [paramBrand] : []);
    if (paramSearch !== null) setSearchQuery(paramSearch);
  }, [searchParams]);

  const fetchCatalogue = () => {
    setLoading(true);
    setError(null);
    api
      .getProducts()
      .then((res) => setAllProducts(res.products))
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Unable to load store items.'),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCatalogue();
  }, []);

  // Category & Brand facet counts
  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of allProducts) {
      map[p.category] = (map[p.category] || 0) + 1;
    }
    return map;
  }, [allProducts]);

  const brandCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of allProducts) {
      map[p.brand] = (map[p.brand] || 0) + 1;
    }
    return map;
  }, [allProducts]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const band = PRICE_BANDS.find((b) => b.id === priceBand) ?? PRICE_BANDS[0];

    const list = allProducts.filter((p) => {
      if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
      if (selectedBrands.length > 0 && !selectedBrands.includes(p.brand)) return false;
      if (inStockOnly && p.availability !== 'In Stock') return false;
      if (priceBand !== 'all') {
        if (p.priceInr === null) return false;
        if (p.priceInr < band.min || p.priceInr > band.max) return false;
      }
      if (minDiscount > 0 && getDiscountPct(p) < minDiscount) return false;
      if (q) {
        const hay = `${p.name} ${p.brand} ${p.model} ${p.category} ${p.description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (sortMode === 'price-asc') {
      list.sort(
        (a, b) =>
          (a.priceInr ?? Number.MAX_SAFE_INTEGER) - (b.priceInr ?? Number.MAX_SAFE_INTEGER),
      );
    } else if (sortMode === 'price-desc') {
      list.sort((a, b) => (b.priceInr ?? -1) - (a.priceInr ?? -1));
    } else if (sortMode === 'discount-desc') {
      list.sort((a, b) => getDiscountPct(b) - getDiscountPct(a));
    } else {
      list.sort((a, b) => Number(b.featured) - Number(a.featured));
    }
    return list;
  }, [
    allProducts,
    selectedCategory,
    selectedBrands,
    inStockOnly,
    priceBand,
    minDiscount,
    searchQuery,
    sortMode,
  ]);

  const comparedProducts = useMemo(
    () =>
      compareIds
        .map((id) => allProducts.find((p) => p.id === id))
        .filter((p): p is ProductItem => Boolean(p)),
    [compareIds, allProducts],
  );

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    const next = new URLSearchParams(searchParams);
    if (cat === 'All') next.delete('category');
    else next.set('category', cat);
    setSearchParams(next, { replace: true });
  };

  const toggleBrand = (brandName: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brandName)
        ? prev.filter((b) => b !== brandName)
        : [...prev, brandName],
    );
  };

  const toggleCompare = (product: ProductItem) => {
    setCompareIds((prev) => {
      if (prev.includes(product.id)) return prev.filter((id) => id !== product.id);
      if (prev.length >= 3) return [...prev.slice(1), product.id];
      return [...prev, product.id];
    });
  };

  const activeFilterCount =
    (selectedCategory !== 'All' ? 1 : 0) +
    selectedBrands.length +
    (priceBand !== 'all' ? 1 : 0) +
    (minDiscount > 0 ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  const resetFilters = () => {
    setSelectedCategory('All');
    setSelectedBrands([]);
    setSearchQuery('');
    setPriceBand('all');
    setMinDiscount(0);
    setInStockOnly(false);
    setSortMode('featured');
    setSearchParams({}, { replace: true });
  };

  const handleCopyCode = (code: string) => {
    void navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Reusable Sidebar Filter Content (used in Desktop sticky sidebar & Mobile drawer)
  const renderFilterControls = () => (
    <div className="space-y-6">
      {/* 4-Department Grouped Sub-Category Tree */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="font-display font-bold text-xs uppercase tracking-wider text-[#0B1B36]">
            Departments ({PRODUCT_CATEGORIES.length})
          </h3>
          {selectedCategory !== 'All' && (
            <button
              type="button"
              onClick={() => handleCategoryChange('All')}
              className="text-[11px] font-semibold text-[#9E7216] hover:underline cursor-pointer"
            >
              All
            </button>
          )}
        </div>
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          <Link
            to="/packages"
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-bold bg-[#FBF7EC] border border-[#C99B2E]/50 text-[#0B1B36] hover:bg-amber-50 transition-colors"
          >
            <span>PACKAGES · HD &amp; IP Builder</span>
            <span className="font-mono text-[10px] text-[#9E7216]">4–32CH</span>
          </Link>
          <button
            type="button"
            onClick={() => handleCategoryChange('All')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
              selectedCategory === 'All'
                ? 'bg-[#0B1B36] text-white font-semibold'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span>All Store Products</span>
            <span className="font-mono text-[11px] opacity-80">{allProducts.length}</span>
          </button>

          {STORE_DEPARTMENTS.map((dept) => (
            <div key={dept.id} className="space-y-0.5">
              <p className="px-2 pt-1 text-[10px] font-bold uppercase tracking-wider text-[#9E7216]">
                {dept.name}
              </p>
              {dept.subcategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategoryChange(cat)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#0B1B36] text-white font-semibold'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="truncate text-left">{cat}</span>
                  <span className="font-mono text-[11px] opacity-75 shrink-0 ml-2">
                    {categoryCounts[cat] || 0}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="pt-5 border-t border-slate-200">
        <h3 className="font-display font-bold text-xs uppercase tracking-wider text-[#0B1B36] mb-2.5">
          Price Range
        </h3>
        <div className="space-y-1.5">
          {PRICE_BANDS.map((band) => (
            <label
              key={band.id}
              className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer py-0.5"
            >
              <input
                type="radio"
                name="priceBand"
                checked={priceBand === band.id}
                onChange={() => setPriceBand(band.id)}
              />
              <span className={priceBand === band.id ? 'font-semibold text-[#0B1B36]' : ''}>
                {band.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Multi-Select Brands */}
      <div className="pt-5 border-t border-slate-200">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="font-display font-bold text-xs uppercase tracking-wider text-[#0B1B36]">
            Brands
          </h3>
          {selectedBrands.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedBrands([])}
              className="text-[11px] font-semibold text-[#9E7216] hover:underline cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {brands.map((b) => {
            const count = brandCounts[b.name] || 0;
            const checked = selectedBrands.includes(b.name);
            return (
              <label
                key={b.id}
                className="flex items-center justify-between gap-2 text-xs text-slate-700 cursor-pointer py-0.5"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleBrand(b.name)}
                  />
                  <span className={`truncate ${checked ? 'font-semibold text-[#0B1B36]' : ''}`}>
                    {b.name}
                  </span>
                </span>
                <span className="font-mono text-[11px] text-slate-400 shrink-0">{count}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Discount Filter */}
      <div className="pt-5 border-t border-slate-200">
        <h3 className="font-display font-bold text-xs uppercase tracking-wider text-[#0B1B36] mb-2.5">
          Discount
        </h3>
        <div className="space-y-1.5">
          {[
            { value: 0, label: 'Any Discount' },
            { value: 15, label: '15% Off or More' },
            { value: 25, label: '25% Off or More' },
          ].map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer py-0.5"
            >
              <input
                type="radio"
                name="minDiscount"
                checked={minDiscount === opt.value}
                onChange={() => setMinDiscount(opt.value)}
              />
              <span className={minDiscount === opt.value ? 'font-semibold text-[#0B1B36]' : ''}>
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div className="pt-5 border-t border-slate-200">
        <label className="flex items-center gap-2 text-xs font-semibold text-[#0B1B36] cursor-pointer">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
          />
          <span>In Stock Only (Ready Dispatch)</span>
        </label>
      </div>

      {/* B2B Bulk RFQ Card inside Sidebar */}
      <div className="p-4 rounded-xl bg-[#0B1B36] text-white space-y-2.5">
        <p className="text-xs font-semibold text-[#DFB85A]">B2B &amp; Dealer Bulk Desk</p>
        <p className="text-xs text-slate-300 leading-relaxed">
          Ordering 5+ cameras, cables, or complete project kits? Get special GST dealer pricing.
        </p>
        <button
          type="button"
          onClick={() => openQuoteModal({ subject: 'B2B Bulk & GST Dealer Quotation' })}
          className="w-full py-2 px-3 rounded-lg bg-[#C99B2E] text-[#061022] text-xs font-semibold hover:bg-[#DFB85A] transition-colors cursor-pointer"
        >
          Request Bulk GST Quote
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-[#F8FAFC] min-h-[75vh] pb-16">
      {/* Store Header */}
      <section className="bg-[#0B1B36] text-white py-10 lg:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-medium text-[#DFB85A] mb-2">
            TRINETRA Online CCTV Store · B2B &amp; Retail · AP &amp; Telangana Delivery
          </p>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <h1 className="font-display font-bold text-3xl sm:text-4xl tracking-tight mb-3">
                Shop CCTV Cameras, Combo Kits, Recorders &amp; Accessories
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Order cameras, ready CCTV kits, DVR/NVR recorders, surveillance hard disks, PoE
                switches, racks, and cables with Pay-on-Installation, UPI Payment on Delivery, GST
                Tax Invoices, and bulk project pricing.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={openDrawer}
                className="inline-flex items-center gap-2 px-5 py-3 min-h-[44px] rounded-lg bg-[#C99B2E] text-[#061022] text-sm font-semibold hover:bg-[#DFB85A] transition-colors whitespace-nowrap cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>View Cart ({totalCount})</span>
              </button>
              <Link
                to="/packages"
                className="inline-flex items-center px-5 py-3 min-h-[44px] rounded-lg border border-white/25 text-sm font-semibold text-white hover:bg-white/10 transition-colors whitespace-nowrap"
              >
                HD &amp; IP Package Builder
              </Link>
            </div>
          </div>

          {/* Industrial E-Commerce Trust Bar */}
          <div className="mt-8 pt-6 border-t border-white/15 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-200">
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-[#DFB85A] shrink-0" aria-hidden="true" />
              <span>B2B GST Tax Invoice Available at Checkout</span>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#DFB85A] shrink-0" aria-hidden="true" />
              <span>100% Genuine Brand-Warranty Surveillance Hardware</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Truck className="w-4 h-4 text-[#DFB85A] shrink-0" aria-hidden="true" />
              <span>Express Dispatch &amp; On-Site Technician Installation (AP &amp; TS)</span>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Live Admin-Managed Offers Strip */}
        {offers.length > 0 && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="p-4 rounded-xl bg-white border border-[#DFB85A]/60 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#9E7216] mb-0.5">
                    <Tag className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>
                      {offer.discountType === 'flat'
                        ? `Flat ₹${offer.discountValue.toLocaleString('en-IN')} Off`
                        : `${offer.discountValue}% Off`}{' '}
                      · Min ₹{offer.minOrderInr.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="font-display font-semibold text-sm text-[#0B1B36] truncate">
                    {offer.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{offer.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyCode(offer.code)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0B1B36] text-white font-mono text-xs font-semibold hover:bg-[#13294E] shrink-0 cursor-pointer"
                >
                  <span>{offer.code}</span>
                  {copiedCode === offer.code ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-[#DFB85A]" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Quick Category Jump Bar */}
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2">
          {QUICK_STRIP_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategoryChange(cat)}
              className={`px-3.5 py-2 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#0B1B36] text-white border-[#0B1B36]'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-[#C99B2E] hover:text-[#0B1B36]'
              }`}
            >
              {cat === 'All' ? 'All Products' : cat}
            </button>
          ))}
        </div>

        {/* Main 2-Column Storefront Layout: Left Faceted Sidebar + Right Product Grid/List */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          {/* Desktop Sticky Left Filter Sidebar */}
          <aside className="hidden lg:block lg:col-span-3 bg-white border border-slate-200 rounded-xl p-5 sticky top-20">
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#9E7216]" aria-hidden="true" />
                <h2 className="font-display font-bold text-sm text-[#0B1B36]">Filters</h2>
              </div>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#9E7216] hover:underline cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset ({activeFilterCount})</span>
                </button>
              )}
            </div>
            {renderFilterControls()}
          </aside>

          {/* Right Product Area */}
          <div className="lg:col-span-9 space-y-5">
            {/* Search, Mobile Filter Trigger, Sort & Grid/List Toolbar */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex-1 relative">
                <Search
                  className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by camera, kit, model SKU, brand, HDD, PoE..."
                  aria-label="Search store products"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:border-[#0B1B36]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(true)}
                  className="lg:hidden inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-[#0B1B36] cursor-pointer"
                >
                  <Filter className="w-3.5 h-3.5 text-[#9E7216]" />
                  <span>Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}</span>
                </button>

                <select
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value as SortMode)}
                  aria-label="Sort products"
                  className="px-3 py-2.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-900"
                >
                  <option value="featured">Sort: Featured</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="discount-desc">Discount: High to Low</option>
                </select>

                <div
                  role="group"
                  aria-label="Layout view mode"
                  className="inline-flex rounded-lg border border-slate-300 overflow-hidden bg-white"
                >
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    aria-label="Grid view"
                    className={`p-2.5 transition-colors cursor-pointer ${
                      viewMode === 'grid'
                        ? 'bg-[#0B1B36] text-white'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    aria-label="List view"
                    className={`p-2.5 transition-colors cursor-pointer ${
                      viewMode === 'list'
                        ? 'bg-[#0B1B36] text-white'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Results Meta & Active Removable Filter Chips */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-mono tabular-nums">
                  Showing <strong className="text-[#0B1B36]">{filteredProducts.length}</strong> of{' '}
                  {allProducts.length} items
                </p>
                {selectedCategory !== 'All' && (
                  <button
                    type="button"
                    onClick={() => handleCategoryChange('All')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-300 text-[#0B1B36] font-medium hover:border-[#0B1B36] cursor-pointer"
                  >
                    <span>{selectedCategory}</span>
                    <X className="w-3 h-3" />
                  </button>
                )}
                {selectedBrands.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => toggleBrand(b)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-300 text-[#0B1B36] font-medium hover:border-[#0B1B36] cursor-pointer"
                  >
                    <span>{b}</span>
                    <X className="w-3 h-3" />
                  </button>
                ))}
                {priceBand !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setPriceBand('all')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-300 text-[#0B1B36] font-medium hover:border-[#0B1B36] cursor-pointer"
                  >
                    <span>{PRICE_BANDS.find((b) => b.id === priceBand)?.label}</span>
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => openQuoteModal({ subject: 'Bulk Hardware Quotation Request' })}
                className="font-semibold text-[#0B1B36] underline hover:text-[#9E7216] cursor-pointer"
              >
                Need Bulk Dealer / GST Quote?
              </button>
            </div>

            {/* Product Grid or List */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-slate-200 rounded-xl overflow-hidden animate-pulse"
                  >
                    <div className="aspect-[4/3] bg-slate-200" />
                    <div className="p-5 space-y-3">
                      <div className="h-3 w-24 bg-slate-200 rounded" />
                      <div className="h-5 w-3/4 bg-slate-200 rounded" />
                      <div className="h-3 w-full bg-slate-100 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-8 bg-white border border-rose-200 rounded-xl text-center">
                <p className="text-sm text-rose-800 mb-3">{error}</p>
                <button
                  type="button"
                  onClick={fetchCatalogue}
                  className="px-4 py-2 rounded-lg bg-[#0B1B36] text-white text-xs font-semibold cursor-pointer"
                >
                  Retry
                </button>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-10 bg-white border border-slate-200 rounded-xl text-center">
                <h2 className="font-display font-bold text-lg text-[#0B1B36] mb-1">
                  No Matching Store Products
                </h2>
                <p className="text-sm text-slate-600 max-w-md mx-auto mb-5">
                  Try clearing one or more filters, or request an immediate quote for any model from
                  our supported brands.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-[#0B1B36] hover:bg-slate-50 cursor-pointer"
                  >
                    Clear All Filters
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      openQuoteModal({
                        subject: `Model Enquiry: ${selectedCategory !== 'All' ? selectedCategory : 'CCTV Hardware'}`,
                      })
                    }
                    className="px-5 py-2.5 rounded-lg bg-[#0B1B36] text-white text-sm font-semibold hover:bg-[#13294E] cursor-pointer"
                  >
                    Request Model Pricing
                  </button>
                </div>
              </div>
            ) : viewMode === 'list' ? (
              <div className="space-y-4">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    layout="list"
                    onQuickView={setQuickViewProduct}
                    isCompared={compareIds.includes(product.id)}
                    onToggleCompare={toggleCompare}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    layout="grid"
                    onQuickView={setQuickViewProduct}
                    isCompared={compareIds.includes(product.id)}
                    onToggleCompare={toggleCompare}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Mobile Filter Drawer */}
      {mobileFilterOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Store Filters"
          className="fixed inset-0 z-50 flex lg:hidden bg-[#061022]/70 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMobileFilterOpen(false);
          }}
        >
          <div className="bg-white w-full max-w-xs h-full overflow-y-auto p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
              <h2 className="font-display font-bold text-base text-[#0B1B36]">Store Filters</h2>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                aria-label="Close filters"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {renderFilterControls()}
            <div className="mt-6 pt-4 border-t border-slate-200 flex gap-2">
              <button
                type="button"
                onClick={resetFilters}
                className="flex-1 py-2.5 rounded-lg border border-slate-300 text-xs font-semibold text-[#0B1B36] cursor-pointer"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 py-2.5 rounded-lg bg-[#0B1B36] text-white text-xs font-semibold cursor-pointer"
              >
                Show {filteredProducts.length} Items
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Compare Bar */}
      {comparedProducts.length > 0 && (
        <div className="fixed bottom-4 inset-x-4 z-40 max-w-4xl mx-auto bg-[#0B1B36] text-white border border-[#C99B2E]/60 rounded-xl shadow-2xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Scale className="w-4 h-4 text-[#DFB85A] shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white">
                Compare Selected ({comparedProducts.length}/3)
              </p>
              <p className="text-[11px] text-slate-300 truncate">
                {comparedProducts.map((p) => p.name).join(' · ')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setCompareIds([])}
              className="px-3 py-2 rounded-lg border border-white/20 text-xs font-medium text-slate-200 hover:bg-white/10 cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setCompareOpen(true)}
              className="px-4 py-2 rounded-lg bg-[#C99B2E] text-[#061022] text-xs font-semibold hover:bg-[#DFB85A] cursor-pointer"
            >
              Compare Side-by-Side
            </button>
          </div>
        </div>
      )}

      {/* Product Quick-View Modal */}
      <ProductDetailModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />

      {/* Side-by-Side Comparison Modal */}
      <CompareModal
        products={comparedProducts}
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        onRemove={(id) => setCompareIds((prev) => prev.filter((item) => item !== id))}
      />
    </div>
  );
}
