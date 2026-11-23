import {
  ArrowRight,
  Cable,
  Camera,
  Check,
  Compass,
  HardDrive,
  Handshake,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import { STORE_DEPARTMENTS } from '../data/catalogData.ts';
import type { ProductItem } from '../types.ts';

const DEPT_ICONS: Record<string, typeof Camera> = {
  surveillance: Camera,
  'access-safety': ShieldCheck,
  'networking-storage': HardDrive,
  'cables-accessories': Cable,
};

type SiteType = 'home' | 'shop' | 'office' | 'factory' | 'farm';
type PriorityGoal = 'complete-kit' | 'night-color' | 'access-safety' | 'wireless-solar';

interface DepartmentExplorerProps {
  products: ProductItem[];
}

export function DepartmentExplorer({ products }: DepartmentExplorerProps) {
  const { openQuoteModal } = useBusiness();
  const { addToCart, openDrawer } = useCart();

  // Interactive 2-step CCTV Security Recommender (deterministic, instant)
  const [siteType, setSiteType] = useState<SiteType>('home');
  const [priority, setPriority] = useState<PriorityGoal>('complete-kit');
  const [addedId, setAddedId] = useState<string | null>(null);

  const recommendedItems = useMemo(() => {
    if (products.length === 0) return [];
    const pickByIds = (ids: string[]) =>
      ids
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is ProductItem => Boolean(p));

    if (priority === 'access-safety') {
      return pickByIds([
        'cat-biometric-face-term',
        'cat-smart-door-lock',
        'cat-video-door-phone',
        'cat-smoke-fire-detector',
      ]).slice(0, 3);
    }
    if (priority === 'wireless-solar' || siteType === 'farm') {
      return pickByIds([
        'cat-solar-4g-ptz',
        'cat-wifi-360-pt',
        'cat-wifi-extender-ac',
        'cat-p2p-devices',
      ]).slice(0, 3);
    }
    if (priority === 'night-color') {
      return pickByIds([
        'cat-bullet-4mp-color',
        'cat-kit-8ch-ip-poe',
        'cat-hdd-2tb-surv',
      ]).slice(0, 3);
    }
    if (siteType === 'factory' || siteType === 'office') {
      return pickByIds([
        'cat-kit-8ch-ip-poe',
        'cat-biometric-face-term',
        'cat-poe-24port-smart',
      ]).slice(0, 3);
    }
    return pickByIds([
      'cat-kit-4ch-hd',
      'cat-bullet-4mp-color',
      'cat-video-door-phone',
    ]).slice(0, 3);
  }, [products, siteType, priority]);

  const handleQuickAdd = (product: ProductItem) => {
    addToCart(product, 1);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1600);
  };

  return (
    <section className="py-14 lg:py-18 bg-[#F8FAFC] border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* 1. Shop by Department & Sub-Category Mega-Cards (eTransit-inspired) */}
        <div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div className="max-w-2xl">
              <p className="text-xs font-medium text-[#9E7216] mb-1.5">
                4 Master Departments · 23 Sub-Categories
              </p>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#0B1B36] tracking-tight">
                Browse Security Hardware by Category &amp; Sub-Category
              </h2>
            </div>
            <Link
              to="/store"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#0B1B36] hover:text-[#9E7216] transition-colors whitespace-nowrap"
            >
              <span>Open Full Online Store</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {STORE_DEPARTMENTS.map((dept) => {
              const Icon = DEPT_ICONS[dept.id] ?? Camera;
              return (
                <div
                  key={dept.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between hover:border-[#C99B2E] transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <div className="w-9 h-9 rounded-lg bg-[#0B1B36] flex items-center justify-center shrink-0">
                        <Icon className="w-4.5 h-4.5 text-[#DFB85A]" aria-hidden="true" />
                      </div>
                      <h3 className="font-display font-bold text-base text-[#0B1B36] leading-snug">
                        {dept.name}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed mb-4">{dept.tagline}</p>

                    <ul className="space-y-1.5 border-t border-slate-100 pt-3 mb-4">
                      {dept.subcategories.map((sub) => (
                        <li key={sub}>
                          <Link
                            to={`/store?category=${encodeURIComponent(sub)}`}
                            className="flex items-center justify-between text-xs font-medium text-slate-700 hover:text-[#9E7216] py-0.5 transition-colors"
                          >
                            <span>{sub}</span>
                            <ArrowRight className="w-3 h-3 opacity-50" aria-hidden="true" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link
                    to={`/store?category=${encodeURIComponent(dept.subcategories[0])}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B1B36] hover:text-[#9E7216] pt-2 border-t border-slate-100"
                  >
                    <span>Shop {dept.name}</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Interactive Guided Product Finder ("Find Your Perfect Security Kit") */}
        <div className="rounded-xl bg-white border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 bg-[#0B1B36] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-[#DFB85A] mb-1">
                <Compass className="w-4 h-4" aria-hidden="true" />
                <span>Interactive Security Kit Finder</span>
              </div>
              <h3 className="font-display font-bold text-lg sm:text-xl text-white">
                Not Sure What to Buy? Pick Your Site &amp; Goal for Instant Recommendations
              </h3>
            </div>
            <Link
              to="/planner"
              className="text-xs font-semibold text-[#DFB85A] hover:underline whitespace-nowrap"
            >
              Need Exact HDD Storage Calc? →
            </Link>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
                  1. Select Property Type
                </p>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { id: 'home', label: 'Home / Villa' },
                      { id: 'shop', label: 'Shop / Showroom' },
                      { id: 'office', label: 'Office / Clinic' },
                      { id: 'factory', label: 'Factory / Warehouse' },
                      { id: 'farm', label: 'Farm / Open Plot' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSiteType(opt.id)}
                      className={`px-3.5 py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                        siteType === opt.id
                          ? 'bg-[#0B1B36] text-white border-[#0B1B36]'
                          : 'bg-[#F8FAFC] text-slate-700 border-slate-200 hover:border-[#C99B2E]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
                  2. Primary Security Priority
                </p>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { id: 'complete-kit', label: 'Complete CCTV Kit' },
                      { id: 'night-color', label: '4MP Full-Color Night Vision' },
                      { id: 'access-safety', label: 'Biometric, Smart Lock & Fire' },
                      { id: 'wireless-solar', label: 'Wi-Fi / 4G Solar Off-Grid' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPriority(opt.id)}
                      className={`px-3.5 py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                        priority === opt.id
                          ? 'bg-[#0B1B36] text-white border-[#0B1B36]'
                          : 'bg-[#F8FAFC] text-slate-700 border-slate-200 hover:border-[#C99B2E]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {recommendedItems.length > 0 && (
              <div className="pt-5 border-t border-slate-200">
                <p className="text-xs font-semibold text-[#9E7216] mb-3">
                  Recommended Ready-to-Order Equipment ({recommendedItems.length} Matches)
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {recommendedItems.map((item) => {
                    const isAdded = addedId === item.id;
                    const canBuy = item.priceInr !== null && item.availability !== 'Out of Stock';
                    return (
                      <div
                        key={item.id}
                        className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200 flex flex-col justify-between gap-3"
                      >
                        <div>
                          <p className="text-[11px] font-semibold text-slate-500">
                            {item.brand} · {item.category}
                          </p>
                          <h4 className="font-display font-bold text-sm text-[#0B1B36] mt-0.5 line-clamp-2">
                            {item.name}
                          </h4>
                          <p className="font-mono text-sm font-bold text-[#0B1B36] mt-2">
                            {item.priceInr !== null
                              ? `₹${item.priceInr.toLocaleString('en-IN')}`
                              : 'Price on Request'}
                          </p>
                        </div>
                        {canBuy ? (
                          <button
                            type="button"
                            onClick={() => (isAdded ? openDrawer() : handleQuickAdd(item))}
                            className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                              isAdded
                                ? 'bg-emerald-700 text-white'
                                : 'bg-[#0B1B36] text-white hover:bg-[#13294E]'
                            }`}
                          >
                            {isAdded ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Added — Open Cart</span>
                              </>
                            ) : (
                              <>
                                <ShoppingBag className="w-3.5 h-3.5 text-[#DFB85A]" />
                                <span>Add to Cart</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              openQuoteModal({
                                subject: `Recommendation Quote: ${item.name}`,
                                productRef: `${item.brand} — ${item.name}`,
                              })
                            }
                            className="w-full py-2 px-3 rounded-lg bg-[#0B1B36] text-white text-xs font-semibold cursor-pointer"
                          >
                            Request Quote
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. B2B System Integrator / Dealer Partner Banner */}
        <div className="p-6 sm:p-7 rounded-xl bg-[#0B1B36] text-white flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4 max-w-2xl">
            <div className="w-11 h-11 rounded-lg bg-white/10 border border-[#C99B2E]/50 flex items-center justify-center shrink-0 mt-0.5">
              <Handshake className="w-5 h-5 text-[#DFB85A]" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-medium text-[#DFB85A] mb-1">
                B2B Trade &amp; System Integrator Desk · Andhra Pradesh &amp; Telangana
              </p>
              <h3 className="font-display font-bold text-lg sm:text-xl text-white">
                Are You a CCTV Installer, System Integrator, Electrician, or Builder?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                Partner with TRINETRA for wholesale multi-brand pricing, GST billing, ready stock of
                racks, PoE switches, cables, and technical pre-sales support.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              openQuoteModal({
                subject: 'System Integrator / Dealer Wholesale Registration',
                serviceRef: 'B2B System Integrator Partner Inquiry',
              })
            }
            className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] rounded-lg bg-[#C99B2E] text-[#061022] text-sm font-semibold hover:bg-[#DFB85A] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Request Dealer Price List</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
