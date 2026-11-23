import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  PackageSearch,
  Phone,
  Send,
  ShoppingBag,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { BrandTicker } from '../components/BrandTicker.tsx';
import { DepartmentExplorer } from '../components/DepartmentExplorer.tsx';
import { ProductCard } from '../components/ProductCard.tsx';
import { ProductDetailModal } from '../components/ProductDetailModal.tsx';
import { SafeImage } from '../components/SafeImage.tsx';
import { ServiceCoverageMap } from '../components/ServiceCoverageMap.tsx';
import { FaqAccordion, SolutionsShowcase } from '../components/SolutionsShowcase.tsx';
import { useBusiness } from '../context/BusinessContext.tsx';
import {
  ASSET_IMAGES,
  CORE_SERVICES,
  COVERAGE_HUBS,
  PRODUCT_CATEGORIES,
  formatTelUrl,
  formatWhatsAppUrl,
} from '../data/catalogData.ts';
import { SECURITY_GUIDES } from '../data/guidesData.ts';
import { DEPLOYMENT_STEPS } from '../data/solutionsData.ts';
import { api } from '../lib/api.ts';
import type { ClientTestimonial, ProductItem } from '../types.ts';

const WHY_CHOOSE_POINTS = [
  {
    index: '01',
    title: 'Single-Point Accountability from Online Store to AMC',
    body: 'Instead of coordinating separate vendors for cameras, cables, PoE switches, and technicians, TRINETRA handles online hardware ordering, site installation, recorder setup, and ongoing maintenance under one roof.',
  },
  {
    index: '02',
    title: 'Clean Structured Cabling & Weather-Sealed Terminations',
    body: 'Every outdoor joint is enclosed in heavy-duty PVC or IP65 PoE boxes with properly crimped copper BNC, DC, and RJ45 terminations to minimize monsoon corrosion and signal loss.',
  },
  {
    index: '03',
    title: 'Precision Storage & Camera Engineering',
    body: 'Use our built-in CCTV System Planner to verify exact surveillance hard disk capacity, recorder channels, and bandwidth before you buy — zero guesswork or undersized hardware.',
  },
  {
    index: '04',
    title: 'Responsive Field Support & Live Order Tracking',
    body: 'From fresh commercial installations and hard disk replacement to P2P mobile-view troubleshooting, track every order and service request live across Andhra Pradesh & Telangana.',
  },
];

export function HomePage() {
  const { settings, brands, openQuoteModal } = useBusiness();

  const [allProducts, setAllProducts] = useState<ProductItem[]>([]);
  const [productShelfTab, setProductShelfTab] = useState<'featured' | 'latest'>('featured');
  const [quickViewProduct, setQuickViewProduct] = useState<ProductItem | null>(null);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  const [testimonials, setTestimonials] = useState<ClientTestimonial[]>([]);
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [reviewName, setReviewName] = useState('');
  const [reviewOrg, setReviewOrg] = useState('');
  const [reviewCity, setReviewCity] = useState('');
  const [reviewState, setReviewState] = useState<'Andhra Pradesh' | 'Telangana'>('Telangana');
  const [reviewService, setReviewService] = useState(CORE_SERVICES[0].title);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewNotice, setReviewNotice] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const [cName, setCName] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cCity, setCCity] = useState('');
  const [cState, setCState] = useState<'Andhra Pradesh' | 'Telangana' | 'Other'>('Telangana');
  const [cMessage, setCMessage] = useState('');
  const [cSubmitting, setCSubmitting] = useState(false);
  const [cError, setCError] = useState<string | null>(null);
  const [cConfirmedId, setCConfirmedId] = useState<string | null>(null);

  const [selectedHubId, setSelectedHubId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api
      .getProducts()
      .then((res) => {
        if (active) setAllProducts(res.products);
      })
      .catch(() => {
        if (active) setProductsError('Unable to load store items right now.');
      })
      .finally(() => {
        if (active) setProductsLoading(false);
      });

    api
      .getApprovedTestimonials()
      .then((res) => {
        if (active) setTestimonials(res.testimonials);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const displayedHomeProducts =
    productShelfTab === 'featured'
      ? allProducts.filter((p) => p.featured).slice(0, 6)
      : [...allProducts].reverse().slice(0, 6);

  const handleReviewSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setReviewError(null);
    setReviewNotice(null);
    setReviewSubmitting(true);
    try {
      const res = await api.submitTestimonial({
        clientName: reviewName,
        organization: reviewOrg,
        city: reviewCity,
        state: reviewState,
        serviceUsed: reviewService,
        feedback: reviewText,
      });
      setReviewNotice(res.message);
      setReviewName('');
      setReviewOrg('');
      setReviewCity('');
      setReviewText('');
      setReviewFormOpen(false);
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Unable to submit feedback.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleContactSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setCError(null);
    setCConfirmedId(null);
    setCSubmitting(true);
    try {
      const res = await api.submitEnquiry({
        type: 'contact',
        name: cName,
        phone: cPhone,
        email: cEmail,
        city: cCity,
        state: cState,
        subject: 'Homepage Security Enquiry',
        message: cMessage,
      });
      setCConfirmedId(res.enquiry.id);
      setCName('');
      setCPhone('');
      setCEmail('');
      setCCity('');
      setCMessage('');
    } catch (err) {
      setCError(err instanceof Error ? err.message : 'Unable to send enquiry.');
    } finally {
      setCSubmitting(false);
    }
  };

  const telHref = formatTelUrl(settings.phone);
  const waHref = formatWhatsAppUrl(
    settings.whatsapp,
    `Hello ${settings.businessName}, I would like a quote for CCTV sales, installation, or service.`,
  );

  const telanganaHubs = COVERAGE_HUBS.filter((h) => h.state === 'Telangana');
  const andhraHubs = COVERAGE_HUBS.filter((h) => h.state === 'Andhra Pradesh');

  return (
    <div>
      {/* 1. HERO SECTION (Live Editable via Admin Panel) */}
      <section className="bg-[#0B1B36] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 flex flex-col justify-center"
            >
              <p className="text-xs sm:text-sm font-medium text-[#DFB85A] tracking-wide mb-4">
                {settings.heroBadgeText}
              </p>

              <h1
                className="font-display font-bold text-white tracking-tight leading-[1.1] mb-5"
                style={{ fontSize: 'clamp(2.2rem, 3.8vw, 3.5rem)' }}
              >
                {settings.heroHeadline}
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl mb-8">
                {settings.heroSubtitle}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to="/packages"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 min-h-[46px] rounded-lg bg-[#C99B2E] text-[#061022] font-semibold text-sm hover:bg-[#DFB85A] transition-colors duration-150 whitespace-nowrap"
                >
                  <Calculator className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Build CCTV Package</span>
                </Link>

                <Link
                  to="/store"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 min-h-[46px] rounded-lg border border-white/25 bg-white/5 text-white font-semibold text-sm hover:bg-white/10 hover:border-white/40 transition-colors duration-150 whitespace-nowrap"
                >
                  <ShoppingBag className="w-4 h-4 text-[#DFB85A] shrink-0" aria-hidden="true" />
                  <span>Shop CCTV Store</span>
                </Link>

                <button
                  type="button"
                  onClick={() => openQuoteModal({ subject: 'New CCTV Installation & Sales Quote' })}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3.5 min-h-[46px] rounded-lg border border-white/20 text-white font-semibold text-sm hover:bg-white/10 transition-colors duration-150 whitespace-nowrap cursor-pointer"
                >
                  <span>Get a Quote</span>
                </button>

                <a
                  href={telHref}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3.5 min-h-[46px] rounded-lg border border-white/20 text-white font-semibold text-sm hover:bg-white/10 transition-colors duration-150 whitespace-nowrap"
                >
                  <Phone className="w-4 h-4 text-[#DFB85A] shrink-0" aria-hidden="true" />
                  <span>Call</span>
                </a>

                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-3.5 min-h-[46px] rounded-lg border border-white/20 text-white font-semibold text-sm hover:bg-white/10 transition-colors duration-150 whitespace-nowrap"
                >
                  <MessageCircle className="w-4 h-4 text-[#DFB85A] shrink-0" aria-hidden="true" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6"
            >
              <div className="relative rounded-xl overflow-hidden border border-white/15 h-72 sm:h-96 lg:h-full min-h-[340px] bg-[#061022]">
                <SafeImage
                  src={ASSET_IMAGES.hero}
                  alt="Commercial building entrance secured with a weatherproof IP bullet CCTV camera installed by TRINETRA"
                  fallbackTitle="TRINETRA Commercial CCTV Surveillance"
                  className="w-full h-full object-cover"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-[#061022]/85 via-[#061022]/20 to-transparent"
                />
                <div className="absolute bottom-0 inset-x-0 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-[#DFB85A]">
                      Commercial &amp; Residential Surveillance
                    </p>
                    <p className="text-sm text-white font-medium">
                      Online Store · Pay on Installation · AP &amp; Telangana Support
                    </p>
                  </div>
                  <span className="font-mono text-xs text-slate-300 whitespace-nowrap">
                    {settings.domain.replace(/^https?:\/\//, '')}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/12 grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="font-mono tabular-nums text-2xl font-bold text-[#DFB85A]">
                {PRODUCT_CATEGORIES.length}
              </p>
              <p className="text-sm font-medium text-white mt-0.5">Store Categories</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Cameras, recorders, racks, cables &amp; spares
              </p>
            </div>
            <div>
              <p className="font-mono tabular-nums text-2xl font-bold text-[#DFB85A]">
                {brands.length}
              </p>
              <p className="text-sm font-medium text-white mt-0.5">Supported CCTV Brands</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-brand supply, installation &amp; service
              </p>
            </div>
            <div>
              <p className="font-mono tabular-nums text-2xl font-bold text-[#DFB85A]">
                {CORE_SERVICES.length}
              </p>
              <p className="text-sm font-medium text-white mt-0.5">Specialized Services</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Installation, PoE networking, repair &amp; AMC
              </p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-[#DFB85A]">AP &amp; TS</p>
              <p className="text-sm font-medium text-white mt-0.5">Two-State Coverage</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Service hubs across Andhra Pradesh &amp; Telangana
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. BRAND PARTNERS TICKER */}
      <BrandTicker />

      {/* 2A. 4 MASTER DEPARTMENTS, GUIDED KIT FINDER & SYSTEM INTEGRATOR DESK */}
      <DepartmentExplorer products={allProducts} />

      {/* 2B. SMART SURVEILLANCE & INDUSTRY SOLUTIONS SHOWCASE */}
      <SolutionsShowcase compact />

      {/* 3. FEATURED & LATEST STORE PRODUCTS */}
      <section className="py-16 lg:py-20 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div className="max-w-2xl">
              <p className="text-xs font-medium text-[#9E7216] mb-1.5">Online Store</p>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#0B1B36] tracking-tight">
                Featured &amp; Latest Security Equipment
              </h2>
              <p className="text-sm sm:text-base text-slate-600 mt-2">
                Add cameras, combo kits, biometric terminals, and recorders straight to your cart
                with optional on-site installation and B2B GST invoicing.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5">
                <button
                  type="button"
                  onClick={() => setProductShelfTab('featured')}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    productShelfTab === 'featured'
                      ? 'bg-[#0B1B36] text-white'
                      : 'text-slate-600 hover:text-[#0B1B36]'
                  }`}
                >
                  Featured Bestsellers
                </button>
                <button
                  type="button"
                  onClick={() => setProductShelfTab('latest')}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    productShelfTab === 'latest'
                      ? 'bg-[#0B1B36] text-white'
                      : 'text-slate-600 hover:text-[#0B1B36]'
                  }`}
                >
                  Latest Arrivals
                </button>
              </div>
              <Link
                to="/store"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0B1B36] hover:text-[#9E7216] transition-colors whitespace-nowrap"
              >
                <span>All {allProducts.length || 30} Products</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden animate-pulse"
                >
                  <div className="aspect-[4/3] bg-slate-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 w-28 bg-slate-200 rounded" />
                    <div className="h-5 w-3/4 bg-slate-200 rounded" />
                    <div className="h-10 w-full bg-slate-100 rounded-lg mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : productsError ? (
            <div className="p-6 rounded-xl bg-white border border-slate-200 text-sm text-slate-700">
              {productsError}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedHomeProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickView={setQuickViewProduct}
                />
              ))}
            </div>
          )}

          {/* Standout Interactive Engineering Tools Strip */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 sm:p-7 rounded-xl bg-[#0B1B36] text-white flex flex-col justify-between gap-5">
              <div>
                <div className="flex items-center gap-2 text-xs font-medium text-[#DFB85A] mb-2">
                  <Calculator className="w-4 h-4" aria-hidden="true" />
                  <span>PACKAGES · Interactive Multi-Brand Builder</span>
                </div>
                <h3 className="font-display font-bold text-xl mb-2">
                  HD &amp; IP CCTV Package Builder (4CH – 32CH)
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Customize Dome &amp; Bullet cameras (2MP–5MP), DVR/NVR, SMPS or PoE Switch, HDD
                  (500GB–10TB), Racks &amp; Cables across 8 top brands with live installation pricing
                  and instant A4 quotation.
                </p>
              </div>
              <Link
                to="/packages"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#DFB85A] hover:underline self-start"
              >
                <span>Open HD &amp; IP Package Builder</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="p-6 sm:p-7 rounded-xl bg-white border border-slate-200 flex flex-col justify-between gap-5">
              <div>
                <div className="flex items-center gap-2 text-xs font-medium text-[#9E7216] mb-2">
                  <PackageSearch className="w-4 h-4" aria-hidden="true" />
                  <span>Real-Time Customer Portal</span>
                </div>
                <h3 className="font-display font-bold text-xl text-[#0B1B36] mb-2">
                  Live Order &amp; Installation Ticket Tracker
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Already placed a store order or booked a CCTV repair or AMC visit? Enter your
                  Order ID or Enquiry ID anytime to verify dispatch and installation progress live.
                </p>
              </div>
              <Link
                to="/track"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#0B1B36] hover:text-[#9E7216] self-start"
              >
                <span>Track Your Order or Service</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. OUR SERVICES */}
      <section className="py-16 lg:py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start mb-12">
            <div className="lg:col-span-6">
              <p className="text-xs font-medium text-[#9E7216] mb-1.5">Technical Services</p>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#0B1B36] tracking-tight mb-4">
                Installation, Repair &amp; Maintenance Executed to Spec
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6">
                From fresh multi-camera site installations and rack-mounted NVR deployments to
                hard-disk replacements and annual maintenance contracts, every job is completed
                with clean cable routing, tested connectivity, and mobile-viewing handover.
              </p>
              <Link
                to="/services"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0B1B36] text-white text-sm font-semibold hover:bg-[#13294E] transition-colors"
              >
                <span>View Full Service Scope</span>
                <ArrowRight className="w-4 h-4 text-[#DFB85A]" aria-hidden="true" />
              </Link>
            </div>
            <div className="lg:col-span-6">
              <div className="aspect-[16/9] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                <SafeImage
                  src={ASSET_IMAGES.installationTech}
                  alt="Security technician calibrating an IP dome CCTV camera in a modern commercial corridor"
                  fallbackTitle="On-Site CCTV Installation & Calibration"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CORE_SERVICES.map((service, idx) => (
              <div
                key={service.id}
                className={`p-6 rounded-xl border border-slate-200 bg-[#F8FAFC] flex flex-col justify-between transition-colors hover:border-slate-300 ${
                  idx === 6 ? 'md:col-span-2 lg:col-span-3' : ''
                }`}
              >
                <div>
                  <p className="font-mono text-xs font-semibold text-[#9E7216] mb-2">
                    {service.number}.
                  </p>
                  <h3 className="font-display font-bold text-lg text-[#0B1B36] mb-2">
                    {service.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">
                    {service.shortDescription}
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-200/80 flex items-center justify-between gap-4">
                  <span className="text-xs text-slate-500 truncate">{service.idealFor}</span>
                  <button
                    type="button"
                    onClick={() =>
                      openQuoteModal({
                        subject: `Service Request: ${service.title}`,
                        serviceRef: service.title,
                      })
                    }
                    className="text-xs font-semibold text-[#0B1B36] hover:text-[#9E7216] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Book Service →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. WHY CHOOSE US */}
      <section className="py-16 lg:py-20 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <p className="text-xs font-medium text-[#9E7216] mb-1.5">Operational Standards</p>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#0B1B36] tracking-tight">
              Why Businesses &amp; Homeowners Choose TRINETRA
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {WHY_CHOOSE_POINTS.map((point) => (
              <div
                key={point.index}
                className="p-6 sm:p-7 bg-white border border-slate-200 rounded-xl"
              >
                <p className="font-mono text-xs font-semibold text-[#9E7216] mb-2">
                  {point.index}.
                </p>
                <h3 className="font-display font-bold text-lg text-[#0B1B36] mb-2">
                  {point.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">{point.body}</p>
              </div>
            ))}
          </div>

          {/* 4-Step Turnkey Deployment Process */}
          <div className="mt-12 pt-12 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
              <div>
                <p className="text-xs font-medium text-[#9E7216] mb-1">Execution Workflow</p>
                <h3 className="font-display font-bold text-xl sm:text-2xl text-[#0B1B36] tracking-tight">
                  How TRINETRA Deploys Your Security System
                </h3>
              </div>
              <Link
                to="/solutions"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0B1B36] hover:text-[#9E7216] transition-colors whitespace-nowrap"
              >
                <span>View Biometric, Fire Alarm &amp; Boom Barrier Solutions</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {DEPLOYMENT_STEPS.map((item) => (
                <div
                  key={item.step}
                  className="p-5 rounded-xl bg-white border border-slate-200"
                >
                  <span className="inline-block font-mono text-xs font-bold text-[#9E7216] mb-2">
                    STEP {item.step}
                  </span>
                  <h4 className="font-display font-bold text-sm sm:text-base text-[#0B1B36] mb-1.5">
                    {item.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. SERVICE COVERAGE ACROSS AP & TELANGANA */}
      <section className="py-16 lg:py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div className="max-w-2xl">
              <p className="text-xs font-medium text-[#9E7216] mb-1.5">Regional Operations</p>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#0B1B36] tracking-tight">
                Service Coverage Across Andhra Pradesh &amp; Telangana
              </h2>
              <p className="text-sm sm:text-base text-slate-600 mt-2">
                Select any hub below to inspect regional coverage on the interactive Google Map.
              </p>
            </div>
            <Link
              to="/coverage"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#0B1B36] hover:text-[#9E7216] transition-colors whitespace-nowrap shrink-0"
            >
              <span>Full District Directory</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 space-y-6">
              <div className="p-5 rounded-xl bg-[#F8FAFC] border border-slate-200">
                <h3 className="font-display font-bold text-base text-[#0B1B36] mb-3">
                  Telangana Service Hubs
                </h3>
                <div className="space-y-2">
                  {telanganaHubs.map((hub) => (
                    <button
                      key={hub.id}
                      type="button"
                      onClick={() => setSelectedHubId(hub.id)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-lg border transition-colors cursor-pointer ${
                        selectedHubId === hub.id
                          ? 'bg-[#0B1B36] text-white border-[#0B1B36]'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-[#C99B2E]'
                      }`}
                    >
                      <span className="block font-display font-semibold text-sm">{hub.city}</span>
                      <span
                        className={`block text-xs mt-0.5 ${
                          selectedHubId === hub.id ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        {hub.districtsCovered.join(' · ')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-5 rounded-xl bg-[#F8FAFC] border border-slate-200">
                <h3 className="font-display font-bold text-base text-[#0B1B36] mb-3">
                  Andhra Pradesh Service Hubs
                </h3>
                <div className="space-y-2">
                  {andhraHubs.map((hub) => (
                    <button
                      key={hub.id}
                      type="button"
                      onClick={() => setSelectedHubId(hub.id)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-lg border transition-colors cursor-pointer ${
                        selectedHubId === hub.id
                          ? 'bg-[#0B1B36] text-white border-[#0B1B36]'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-[#C99B2E]'
                      }`}
                    >
                      <span className="block font-display font-semibold text-sm">{hub.city}</span>
                      <span
                        className={`block text-xs mt-0.5 ${
                          selectedHubId === hub.id ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        {hub.districtsCovered.join(' · ')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <ServiceCoverageMap
                mode="coverage"
                selectedHubId={selectedHubId}
                onSelectHub={setSelectedHubId}
                heightClass="h-[460px] lg:h-[580px]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 7. VERIFIED CLIENT FEEDBACK */}
      <section className="py-16 lg:py-20 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div className="max-w-2xl">
              <p className="text-xs font-medium text-[#9E7216] mb-1.5">Verified Client Feedback</p>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#0B1B36] tracking-tight">
                Customer Testimonials
              </h2>
              <p className="text-sm text-slate-600 mt-1.5">
                Only genuine, admin-verified feedback from TRINETRA customers across Andhra Pradesh
                and Telangana is published here.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setReviewFormOpen((v) => !v)}
              className="px-4 py-2.5 min-h-[40px] rounded-lg border border-slate-300 bg-white text-sm font-semibold text-[#0B1B36] hover:border-[#0B1B36] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {reviewFormOpen ? 'Close Feedback Form' : 'Submit Client Feedback'}
            </button>
          </div>

          {reviewNotice && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-900 flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
              <span>{reviewNotice}</span>
            </div>
          )}

          {reviewFormOpen && (
            <form
              onSubmit={handleReviewSubmit}
              className="mb-8 p-6 bg-white border border-slate-200 rounded-xl space-y-4"
            >
              <h3 className="font-display font-bold text-base text-[#0B1B36]">
                Share Your Installation or Store Experience
              </h3>
              {reviewError && (
                <p role="alert" className="text-sm text-rose-700">
                  {reviewError}
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <input
                  type="text"
                  required
                  value={reviewName}
                  onChange={(e) => setReviewName(e.target.value)}
                  placeholder="Your Full Name *"
                  className="px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white"
                />
                <input
                  type="text"
                  value={reviewOrg}
                  onChange={(e) => setReviewOrg(e.target.value)}
                  placeholder="Business / Apartment (Optional)"
                  className="px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white"
                />
                <input
                  type="text"
                  required
                  value={reviewCity}
                  onChange={(e) => setReviewCity(e.target.value)}
                  placeholder="City *"
                  className="px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white"
                />
                <select
                  value={reviewState}
                  onChange={(e) =>
                    setReviewState(e.target.value as 'Andhra Pradesh' | 'Telangana')
                  }
                  className="px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white"
                >
                  <option value="Telangana">Telangana</option>
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <select
                  value={reviewService}
                  onChange={(e) => setReviewService(e.target.value)}
                  className="px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white"
                >
                  {CORE_SERVICES.map((s) => (
                    <option key={s.id} value={s.title}>
                      {s.title}
                    </option>
                  ))}
                  <option value="Online CCTV Store Order">Online CCTV Store Order</option>
                </select>
                <input
                  type="text"
                  required
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Describe the installation, hardware quality, or service outcome *"
                  className="sm:col-span-2 px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0B1B36] text-white text-sm font-semibold hover:bg-[#13294E] disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {reviewSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Submit for Verification</span>
                </button>
              </div>
            </form>
          )}

          {testimonials.length === 0 ? (
            <div className="p-8 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="max-w-2xl">
                <h3 className="font-display font-semibold text-base text-[#0B1B36] mb-1">
                  Verified Client Reviews Queue Active
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  TRINETRA never publishes fabricated reviews. Genuine customer submissions appear
                  here immediately after owner verification in the Admin Panel.
                </p>
              </div>
              <Link
                to="/admin"
                className="text-xs font-semibold text-[#9E7216] hover:underline whitespace-nowrap shrink-0"
              >
                Approve Reviews in Admin →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <article
                  key={t.id}
                  className="p-6 bg-white border border-slate-200 rounded-xl flex flex-col justify-between"
                >
                  <p className="text-sm text-slate-700 leading-relaxed mb-5">“{t.feedback}”</p>
                  <div className="pt-4 border-t border-slate-100">
                    <p className="font-display font-semibold text-sm text-[#0B1B36]">
                      {t.clientName}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {[t.organization, `${t.city}, ${t.state}`, t.serviceUsed]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 7A. SECURITY BUYER GUIDES & KNOWLEDGE CENTER */}
      <section className="py-16 lg:py-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div className="max-w-2xl">
              <p className="text-xs font-medium text-[#9E7216] mb-1.5">
                Security Knowledge Center
              </p>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#0B1B36] tracking-tight">
                CCTV &amp; Electronic Security Buyer Guides
              </h2>
              <p className="text-sm sm:text-base text-slate-600 mt-1.5">
                Practical engineering advice on camera budgets, IP vs HD clarity, storage retention,
                and layered biometric &amp; fire safety.
              </p>
            </div>
            <Link
              to="/guides"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#0B1B36] hover:text-[#9E7216] transition-colors whitespace-nowrap shrink-0"
            >
              <span>Read All Guides &amp; Policies</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {SECURITY_GUIDES.map((guide) => (
              <Link
                key={guide.id}
                to="/guides"
                className="group p-5 rounded-xl bg-[#F8FAFC] border border-slate-200 hover:border-[#C99B2E] transition-colors flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold mb-2">
                    <span className="text-[#9E7216]">{guide.category}</span>
                    <span className="text-slate-400">{guide.readTime}</span>
                  </div>
                  <h3 className="font-display font-bold text-sm sm:text-base text-[#0B1B36] leading-snug group-hover:text-[#9E7216] transition-colors mb-2">
                    {guide.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {guide.excerpt}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B1B36] group-hover:text-[#9E7216]">
                  <span>Read Guide</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 7B. INTERACTIVE FAQ */}
      <FaqAccordion />

      {/* 8. CONTACT & QUICK ENQUIRY */}
      <section className="py-16 lg:py-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5 space-y-6">
              <div>
                <p className="text-xs font-medium text-[#9E7216] mb-1.5">Direct Desk</p>
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#0B1B36] tracking-tight mb-3">
                  Discuss Your Site Security Requirements
                </h2>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  Reach our sales and installation desk directly by phone, WhatsApp, or email for
                  product pricing, site surveys, repair bookings, or AMC proposals.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <a
                  href={telHref}
                  className="flex items-center gap-3.5 p-4 rounded-xl border border-slate-200 bg-[#F8FAFC] hover:border-[#0B1B36] transition-colors"
                >
                  <Phone className="w-5 h-5 text-[#9E7216] shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500">Click to Call</p>
                    <p className="font-mono tabular-nums text-sm font-semibold text-[#0B1B36]">
                      {settings.phone}
                    </p>
                  </div>
                </a>

                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3.5 p-4 rounded-xl border border-slate-200 bg-[#F8FAFC] hover:border-[#0B1B36] transition-colors"
                >
                  <MessageCircle className="w-5 h-5 text-[#9E7216] shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500">WhatsApp Sales &amp; Support</p>
                    <p className="font-mono tabular-nums text-sm font-semibold text-[#0B1B36]">
                      {settings.whatsapp}
                    </p>
                  </div>
                </a>

                <a
                  href={`mailto:${settings.email}`}
                  className="flex items-center gap-3.5 p-4 rounded-xl border border-slate-200 bg-[#F8FAFC] hover:border-[#0B1B36] transition-colors"
                >
                  <Mail className="w-5 h-5 text-[#9E7216] shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500">Business Email</p>
                    <p className="text-sm font-semibold text-[#0B1B36] break-all">
                      {settings.email}
                    </p>
                  </div>
                </a>

                <div className="flex items-start gap-3.5 p-4 rounded-xl border border-slate-200 bg-[#F8FAFC]">
                  <MapPin className="w-5 h-5 text-[#9E7216] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">Office &amp; Hours</p>
                    <p className="text-sm font-medium text-[#0B1B36]">{settings.address}</p>
                    <p className="text-xs text-slate-500 mt-1">{settings.businessHours}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 p-6 sm:p-8 rounded-xl border border-slate-200 bg-[#F8FAFC]">
              <h3 className="font-display font-bold text-xl text-[#0B1B36] mb-1">
                Send an Enquiry
              </h3>
              <p className="text-sm text-slate-600 mb-6">
                Every enquiry gets a live Reference ID trackable at any time.
              </p>

              {cConfirmedId && (
                <div className="mb-5 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-900 flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                  <span>
                    Enquiry received (Ref: <strong className="font-mono">{cConfirmedId}</strong>).
                    You can track status anytime under Order Tracker.
                  </span>
                </div>
              )}

              {cError && (
                <div
                  role="alert"
                  className="mb-5 p-4 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-800"
                >
                  {cError}
                </div>
              )}

              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="hc-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Full Name *
                    </label>
                    <input
                      id="hc-name"
                      type="text"
                      required
                      value={cName}
                      onChange={(e) => setCName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="hc-phone" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Phone Number *
                    </label>
                    <input
                      id="hc-phone"
                      type="tel"
                      required
                      value={cPhone}
                      onChange={(e) => setCPhone(e.target.value)}
                      placeholder="+91 9XXXXXXXXX"
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="hc-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Email (Optional)
                    </label>
                    <input
                      id="hc-email"
                      type="email"
                      value={cEmail}
                      onChange={(e) => setCEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="hc-city" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      City / Town *
                    </label>
                    <input
                      id="hc-city"
                      type="text"
                      required
                      value={cCity}
                      onChange={(e) => setCCity(e.target.value)}
                      placeholder="City name"
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="hc-state" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      State *
                    </label>
                    <select
                      id="hc-state"
                      value={cState}
                      onChange={(e) =>
                        setCState(e.target.value as 'Andhra Pradesh' | 'Telangana' | 'Other')
                      }
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="Telangana">Telangana</option>
                      <option value="Andhra Pradesh">Andhra Pradesh</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="hc-msg" className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Message / Requirement *
                  </label>
                  <textarea
                    id="hc-msg"
                    rows={4}
                    required
                    value={cMessage}
                    onChange={(e) => setCMessage(e.target.value)}
                    placeholder="Tell us about your CCTV camera requirement, repair issue, or annual maintenance need..."
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={cSubmitting}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] rounded-lg bg-[#0B1B36] text-white text-sm font-semibold hover:bg-[#13294E] disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {cSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 text-[#DFB85A]" />
                  )}
                  <span>{cSubmitting ? 'Sending...' : 'Send Enquiry'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
      <ProductDetailModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
}
