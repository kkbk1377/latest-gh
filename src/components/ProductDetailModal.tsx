import {
  Check,
  CheckCircle2,
  FileText,
  MapPin,
  MessageCircle,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Truck,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useBusiness } from '../context/BusinessContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import { formatWhatsAppUrl } from '../data/catalogData.ts';
import type { ProductItem } from '../types.ts';
import { SafeImage } from './SafeImage.tsx';

interface ProductDetailModalProps {
  product: ProductItem | null;
  onClose: () => void;
}

function formatInr(amount: number | null): string {
  if (amount === null || !Number.isFinite(amount)) {
    return 'Price on Request';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function evaluatePincode(pin: string): {
  status: 'serviceable' | 'other' | 'invalid';
  title: string;
  detail: string;
} {
  const cleaned = pin.replace(/[^\d]/g, '');
  if (cleaned.length !== 6) {
    return {
      status: 'invalid',
      title: 'Enter a valid 6-digit Indian PIN code',
      detail: 'Example: 500033 (Hyderabad) or 520001 (Vijayawada).',
    };
  }
  const prefix2 = Number(cleaned.slice(0, 2));
  if (prefix2 === 50) {
    return {
      status: 'serviceable',
      title: `Telangana Express Serviceability (${cleaned})`,
      detail:
        'Eligible for fast dispatch, Pay-on-Installation, and on-site TRINETRA technician installation across Telangana.',
    };
  }
  if (prefix2 >= 51 && prefix2 <= 53) {
    return {
      status: 'serviceable',
      title: `Andhra Pradesh Express Serviceability (${cleaned})`,
      detail:
        'Eligible for fast dispatch, Pay-on-Installation, and on-site TRINETRA technician installation across Andhra Pradesh.',
    };
  }
  return {
    status: 'other',
    title: `Outstation Delivery Check (${cleaned})`,
    detail:
      'Hardware dispatch available via courier. Contact our desk on WhatsApp to confirm technician installation availability outside AP & Telangana.',
  };
}

export function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
  const { settings, openQuoteModal } = useBusiness();
  const { addToCart, openDrawer } = useCart();

  const [qty, setQty] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinResult, setPinResult] = useState<ReturnType<typeof evaluatePincode> | null>(null);

  if (!product) return null;

  const canBuyOnline =
    product.priceInr !== null &&
    product.priceInr > 0 &&
    product.availability !== 'Out of Stock';

  const savingsInr =
    product.mrpInr && product.priceInr && product.mrpInr > product.priceInr
      ? product.mrpInr - product.priceInr
      : null;

  const savingsPct =
    savingsInr && product.mrpInr ? Math.round((savingsInr / product.mrpInr) * 100) : null;

  const waUrl = formatWhatsAppUrl(
    settings.whatsapp,
    `Hello ${settings.businessName}, I am interested in:\nProduct: ${product.name}\nBrand: ${product.brand}\nModel: ${product.model}\nQuantity: ${qty}${
      product.priceInr ? `\nUnit Price: ₹${product.priceInr.toLocaleString('en-IN')}` : ''
    }`,
  );

  const handleAdd = () => {
    addToCart(product, qty);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1800);
  };

  const handleBuyNow = () => {
    addToCart(product, qty);
    onClose();
    openDrawer();
  };

  const handleCheckPin = () => {
    setPinResult(evaluatePincode(pinInput));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#061022]/75 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full max-w-4xl rounded-xl border border-slate-200 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Top Modal Header */}
        <div className="px-6 py-4 bg-[#0B1B36] text-white flex items-center justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <p className="text-xs text-[#DFB85A] font-medium truncate">
              {product.brand} · {product.category}
            </p>
            <h2
              id="product-detail-title"
              className="font-display font-bold text-base sm:text-lg text-white truncate"
            >
              {product.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close product preview"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-300 hover:bg-white/10 hover:text-white transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-7">
          {/* Left: Product Visual & Spec Highlights */}
          <div className="lg:col-span-5 space-y-4">
            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
              <SafeImage
                src={product.imageUrl}
                alt={`${product.brand} ${product.name}`}
                fallbackTitle={`${product.brand} · ${product.category}`}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200 space-y-2.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">Brand</span>
                <span className="font-semibold text-[#0B1B36]">{product.brand}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">Model / SKU</span>
                <span className="font-mono font-semibold text-[#0B1B36]">{product.model}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">Category</span>
                <span className="font-medium text-slate-800">{product.category}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">Warranty</span>
                <span className="font-medium text-slate-800">
                  {product.warranty || 'Manufacturer Standard Warranty'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">Availability</span>
                <span
                  className={`font-semibold ${
                    product.availability === 'In Stock'
                      ? 'text-emerald-700'
                      : product.availability === 'Out of Stock'
                        ? 'text-rose-700'
                        : 'text-slate-700'
                  }`}
                >
                  {product.availability}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#9E7216] shrink-0" aria-hidden="true" />
                <span className="font-medium text-[#0B1B36]">GST Invoice Available</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#9E7216] shrink-0" aria-hidden="true" />
                <span className="font-medium text-[#0B1B36]">100% Genuine Hardware</span>
              </div>
            </div>
          </div>

          {/* Right: Pricing, Quantity Tiers, Pincode Check & Actions */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              {/* Price Block */}
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="font-mono tabular-nums text-2xl sm:text-3xl font-bold text-[#0B1B36]">
                    {formatInr(product.priceInr)}
                  </span>
                  {product.mrpInr && product.priceInr && product.mrpInr > product.priceInr && (
                    <span className="font-mono tabular-nums text-sm text-slate-400 line-through">
                      MRP {formatInr(product.mrpInr)}
                    </span>
                  )}
                  {savingsPct !== null && savingsInr !== null && (
                    <span className="text-xs font-semibold text-emerald-700">
                      Save ₹{savingsInr.toLocaleString('en-IN')} ({savingsPct}% OFF)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  B2B GST Tax Invoice supported at checkout · Free delivery above ₹
                  {settings.freeDeliveryThresholdInr.toLocaleString('en-IN')}
                </p>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed">{product.description}</p>

              {/* B2B Bulk Quantity Tier Indicator */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <p className="text-xs font-semibold text-[#0B1B36]">
                    Quantity &amp; Bulk / Dealer Pricing Guide
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      openQuoteModal({
                        subject: `Bulk GST Quotation: ${product.brand} ${product.name} (Qty: ${Math.max(5, qty)})`,
                        productRef: `${product.brand} — ${product.name} (${product.model})`,
                      });
                    }}
                    className="text-xs font-semibold text-[#9E7216] hover:underline cursor-pointer"
                  >
                    Request Bulk Price →
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="font-mono font-semibold text-[#0B1B36]">1 – 4 Units</p>
                    <p className="text-slate-600 mt-0.5">Standard Store Price</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-amber-50/70 border border-[#DFB85A]/60">
                    <p className="font-mono font-semibold text-[#0B1B36]">5 – 19 Units</p>
                    <p className="text-[#9E7216] font-medium mt-0.5">Dealer / Project Rate</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="font-mono font-semibold text-[#0B1B36]">20+ Units</p>
                    <p className="text-slate-600 mt-0.5">Custom Turnkey BoQ</p>
                  </div>
                </div>
              </div>

              {/* AP & Telangana Pincode Serviceability Checker */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0B1B36]">
                  <MapPin className="w-3.5 h-3.5 text-[#9E7216]" aria-hidden="true" />
                  <span>Check Delivery &amp; On-Site Installation Serviceability</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/[^\d]/g, ''))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCheckPin();
                      }
                    }}
                    placeholder="Enter 6-digit PIN (e.g. 500033 / 520001)"
                    className="flex-1 px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleCheckPin}
                    className="px-4 py-2 rounded-lg bg-[#0B1B36] text-white text-xs font-semibold hover:bg-[#13294E] cursor-pointer whitespace-nowrap"
                  >
                    Check PIN
                  </button>
                </div>
                {pinResult && (
                  <div
                    className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                      pinResult.status === 'serviceable'
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                        : pinResult.status === 'other'
                          ? 'bg-amber-50 border border-amber-200 text-amber-900'
                          : 'bg-rose-50 border border-rose-200 text-rose-800'
                    }`}
                  >
                    {pinResult.status === 'serviceable' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    ) : (
                      <Truck className="w-4 h-4 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-semibold">{pinResult.title}</p>
                      <p className="mt-0.5 opacity-90">{pinResult.detail}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              {canBuyOnline ? (
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center border border-slate-300 rounded-lg bg-white">
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      aria-label="Decrease quantity"
                      className="w-9 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center font-mono text-sm font-semibold text-[#0B1B36] tabular-nums">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.min(200, q + 1))}
                      aria-label="Increase quantity"
                      className="w-9 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleAdd}
                    className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                      addedFeedback
                        ? 'bg-emerald-700 text-white'
                        : 'bg-[#0B1B36] text-white hover:bg-[#13294E]'
                    }`}
                  >
                    {addedFeedback ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Added to Cart</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4 text-[#DFB85A]" />
                        <span>Add to Cart</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleBuyNow}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg bg-[#C99B2E] text-[#061022] text-sm font-semibold hover:bg-[#DFB85A] transition-colors cursor-pointer"
                  >
                    <span>Buy Now</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    openQuoteModal({
                      subject: `Quotation for ${product.brand} ${product.name}`,
                      productRef: `${product.brand} — ${product.name} (${product.model})`,
                    });
                  }}
                  className="w-full py-3 px-5 rounded-lg bg-[#0B1B36] text-white text-sm font-semibold hover:bg-[#13294E] cursor-pointer"
                >
                  Request Instant Best Price Quote
                </button>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-[#0B1B36] text-xs font-semibold hover:border-[#0B1B36]"
                >
                  <MessageCircle className="w-4 h-4 text-[#9E7216]" />
                  <span>WhatsApp Enquiry</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    openQuoteModal({
                      subject: `Bulk / GST Quote: ${product.brand} ${product.name}`,
                      productRef: `${product.brand} — ${product.name} (${product.model})`,
                    });
                  }}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-[#0B1B36] text-xs font-semibold hover:border-[#0B1B36] cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-[#9E7216]" />
                  <span>Bulk / GST RFQ</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
