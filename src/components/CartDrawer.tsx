import {
  CheckCircle2,
  Loader2,
  MessageCircle,
  Minus,
  Plus,
  Printer,
  ShoppingBag,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import { formatWhatsAppUrl } from '../data/catalogData.ts';
import { api } from '../lib/api.ts';
import type { PaymentMethod, StoreOrder } from '../types.ts';

function inr(value: number): string {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

export function CartDrawer() {
  const { settings, offers } = useBusiness();
  const {
    items,
    packageBundles,
    drawerOpen,
    storeSubtotalInr,
    packageInstallTotalInr,
    packageDiscountTotalInr,
    packageTaxTotalInr,
    subtotalInr,
    closeDrawer,
    updateQuantity,
    removeFromCart,
    removePackageFromCart,
    clearCart,
  } = useCart();

  const [step, setStep] = useState<'cart' | 'checkout' | 'confirmed'>('cart');
  const [includeInstallation, setIncludeInstallation] = useState(true);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountInr: number;
    message: string;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Checkout customer fields
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState<'Andhra Pradesh' | 'Telangana' | 'Other'>('Telangana');
  const [pincode, setPincode] = useState('');
  const [needGstInvoice, setNeedGstInvoice] = useState(false);
  const [gstCompanyName, setGstCompanyName] = useState('');
  const [gstin, setGstin] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PAY_ON_INSTALLATION');
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<StoreOrder | null>(null);

  if (!drawerOpen) return null;

  const hasCartEntries = items.length > 0 || packageBundles.length > 0;
  const storeInstallFee =
    items.length > 0 && includeInstallation ? settings.installationBaseFeeInr : 0;
  const installationFee = storeInstallFee + packageInstallTotalInr;
  const deliveryFee =
    subtotalInr === 0 || subtotalInr >= settings.freeDeliveryThresholdInr ? 0 : 250;
  const storeCouponDiscount =
    appliedCoupon && storeSubtotalInr > 0
      ? Math.min(appliedCoupon.discountInr, storeSubtotalInr)
      : 0;
  const discount = storeCouponDiscount + packageDiscountTotalInr;
  const grandTotal = Math.max(
    0,
    subtotalInr + installationFee + deliveryFee + packageTaxTotalInr - discount,
  );

  const handleApplyCoupon = async (codeOverride?: string) => {
    const code = (codeOverride ?? couponInput).trim().toUpperCase();
    if (!code) return;
    setCouponInput(code);
    setCouponError(null);
    setValidatingCoupon(true);
    try {
      const res = await api.validateCoupon(code, storeSubtotalInr);
      if (!res.valid) {
        setAppliedCoupon(null);
        setCouponError(res.message || 'Offer code is not valid for this cart.');
      } else {
        setAppliedCoupon({
          code: res.offer?.code || code,
          discountInr: res.discountInr,
          message: res.message,
        });
      }
    } catch (err) {
      setCouponError(err instanceof Error ? err.message : 'Unable to verify code.');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handlePlaceOrder = async (e: FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);
    setPlacing(true);
    try {
      const res = await api.placeOrder({
        items: items.map((entry) => ({
          productId: entry.product.id,
          quantity: entry.quantity,
        })),
        packageBundles: packageBundles.map((b) => ({
          label: b.label,
          input: b.input,
        })),
        includeInstallation: items.length > 0 ? includeInstallation : false,
        couponCode: appliedCoupon?.code || '',
        paymentMethod,
        customerName,
        phone,
        email,
        address,
        city,
        state,
        pincode,
        gstCompanyName: needGstInvoice ? gstCompanyName : '',
        gstin: needGstInvoice ? gstin.trim().toUpperCase() : '',
        notes,
      });
      setConfirmedOrder(res.order);
      clearCart();
      setAppliedCoupon(null);
      setCouponInput('');
      setStep('confirmed');
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Could not complete order.');
    } finally {
      setPlacing(false);
    }
  };

  const handleClose = () => {
    if (step === 'confirmed') {
      setStep('cart');
      setConfirmedOrder(null);
    }
    closeDrawer();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Cart and Checkout"
      className="fixed inset-0 z-50 flex justify-end bg-[#061022]/65 backdrop-blur-xs"
    >
      <div className="bg-white w-full max-w-lg h-full flex flex-col shadow-2xl border-l border-slate-200">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#9E7216]" aria-hidden="true" />
            <h2 className="font-display font-bold text-lg text-[#0B1B36]">
              {step === 'cart'
                ? 'Your Store Cart'
                : step === 'checkout'
                  ? 'Delivery & Order Confirmation'
                  : 'Order Confirmed'}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close cart drawer"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-[#0B1B36] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'confirmed' && confirmedOrder ? (
            <div className="space-y-5">
              <div className="text-center py-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-700 mx-auto mb-3" />
                <h3 className="font-display font-bold text-xl text-[#0B1B36]">
                  Order #{confirmedOrder.id} Confirmed
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  Thank you, {confirmedOrder.customerName}. Our team will confirm dispatch and
                  installation timing on <span className="font-mono">{confirmedOrder.phone}</span>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200 space-y-2.5 text-sm">
                <p className="font-display font-semibold text-[#0B1B36]">Order Summary</p>
                {confirmedOrder.items.map((li) => (
                  <div key={li.productId} className="flex justify-between gap-2 text-xs text-slate-700">
                    <span>
                      {li.name} × {li.quantity}
                    </span>
                    <span className="font-mono tabular-nums font-semibold">
                      {inr(li.lineTotalInr)}
                    </span>
                  </div>
                ))}
                {(confirmedOrder.packageBundles ?? []).map((bundle) => (
                  <div key={bundle.bundleId} className="pt-1.5 border-t border-slate-200/70 space-y-1">
                    <div className="flex justify-between gap-2 text-xs font-semibold text-[#0B1B36]">
                      <span>{bundle.label}</span>
                      <span className="font-mono tabular-nums">{inr(bundle.productSubtotalInr)}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {bundle.items.length} components · {bundle.cameraCount} cameras (install {inr(bundle.installationTotalInr)})
                    </p>
                  </div>
                ))}
                <div className="pt-2.5 border-t border-slate-200 space-y-1 text-xs">
                  {confirmedOrder.installationFeeInr > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Professional Installation</span>
                      <span className="font-mono">{inr(confirmedOrder.installationFeeInr)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>Delivery</span>
                    <span className="font-mono">
                      {confirmedOrder.deliveryFeeInr === 0 ? 'FREE' : inr(confirmedOrder.deliveryFeeInr)}
                    </span>
                  </div>
                  {(confirmedOrder.taxInr ?? 0) > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Applicable Tax / GST</span>
                      <span className="font-mono">{inr(confirmedOrder.taxInr ?? 0)}</span>
                    </div>
                  )}
                  {confirmedOrder.discountInr > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Discount{confirmedOrder.couponCode ? ` (${confirmedOrder.couponCode})` : ''}</span>
                      <span className="font-mono">-{inr(confirmedOrder.discountInr)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-[#0B1B36] pt-2 border-t border-slate-200">
                    <span>Total Payable ({confirmedOrder.paymentMethod.replace(/_/g, ' ')})</span>
                    <span className="font-mono tabular-nums">{inr(confirmedOrder.totalInr)}</span>
                  </div>
                  {confirmedOrder.gstin && (
                    <div className="flex justify-between text-xs text-slate-600 pt-1">
                      <span>B2B GST Tax Invoice</span>
                      <span className="font-mono font-semibold text-[#0B1B36]">
                        {confirmedOrder.gstin}
                        {confirmedOrder.gstCompanyName ? ` · ${confirmedOrder.gstCompanyName}` : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <a
                  href={formatWhatsAppUrl(
                    settings.whatsapp,
                    `Hello ${settings.businessName}, I just placed Store Order ${confirmedOrder.id} (Total: ${inr(
                      confirmedOrder.totalInr,
                    )}) for ${confirmedOrder.city}, ${confirmedOrder.state}. Please confirm delivery/installation.`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0B1B36] text-white text-xs font-semibold hover:bg-[#13294E]"
                >
                  <MessageCircle className="w-4 h-4 text-[#DFB85A]" />
                  <span>Send Order on WhatsApp</span>
                </a>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 text-[#0B1B36] text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>
              </div>

              <div className="text-center pt-2">
                <Link
                  to={`/track?id=${encodeURIComponent(confirmedOrder.id)}`}
                  onClick={handleClose}
                  className="text-xs font-semibold text-[#9E7216] hover:underline"
                >
                  Track this Order Status Live →
                </Link>
              </div>
            </div>
          ) : !hasCartEntries ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <ShoppingBag className="w-10 h-10 text-slate-300 mb-3" />
              <h3 className="font-display font-bold text-base text-[#0B1B36] mb-1">
                Your store cart is empty
              </h3>
              <p className="text-sm text-slate-600 max-w-xs mb-5">
                Build a custom HD or IP CCTV package or add individual cameras, recorders, and
                accessories from the TRINETRA Store.
              </p>
              <div className="flex flex-wrap justify-center gap-2.5">
                <Link
                  to="/packages"
                  onClick={closeDrawer}
                  className="px-4 py-2.5 rounded-lg bg-[#0B1B36] text-white text-xs font-semibold hover:bg-[#13294E]"
                >
                  Build CCTV Package
                </Link>
                <Link
                  to="/store"
                  onClick={closeDrawer}
                  className="px-4 py-2.5 rounded-lg border border-slate-300 text-[#0B1B36] text-xs font-semibold hover:bg-slate-50"
                >
                  Browse Store
                </Link>
              </div>
            </div>
          ) : step === 'cart' ? (
            <div className="space-y-5">
              {/* Free delivery note */}
              <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-slate-200 text-xs text-slate-700">
                {subtotalInr >= settings.freeDeliveryThresholdInr ? (
                  <span className="font-semibold text-emerald-700">
                    Your order qualifies for FREE delivery across AP &amp; Telangana.
                  </span>
                ) : (
                  <span>
                    Add{' '}
                    <strong className="font-mono text-[#0B1B36]">
                      {inr(settings.freeDeliveryThresholdInr - subtotalInr)}
                    </strong>{' '}
                    more for free delivery (standard delivery ₹250).
                  </span>
                )}
              </div>

              {/* Custom CCTV Package Bundles */}
              {packageBundles.length > 0 && (
                <div className="space-y-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9E7216]">
                    Custom CCTV Packages ({packageBundles.length})
                  </p>
                  {packageBundles.map((bundle) => (
                    <div
                      key={bundle.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {bundle.preview.systemType} CCTV · {bundle.preview.channel}CH ·{' '}
                            {bundle.preview.megapixel}
                          </p>
                          <h4 className="font-display font-bold text-sm text-[#0B1B36]">
                            {bundle.label}
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => removePackageFromCart(bundle.id)}
                          aria-label={`Remove ${bundle.label}`}
                          className="text-slate-400 hover:text-rose-700 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <ul className="space-y-0.5 text-[11px] text-slate-600">
                        {bundle.preview.lines.slice(0, 5).map((l) => (
                          <li key={l.variantId} className="flex justify-between gap-2">
                            <span className="truncate">
                              {l.quantity}× {l.brandName} {l.componentName}
                            </span>
                            <span className="font-mono tabular-nums shrink-0">
                              {inr(l.lineTotalInr)}
                            </span>
                          </li>
                        ))}
                        {bundle.preview.lines.length > 5 && (
                          <li className="text-slate-500">
                            + {bundle.preview.lines.length - 5} more component line(s)
                          </li>
                        )}
                      </ul>
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-600">
                          Install ({bundle.preview.totalCameraCount} cams ×{' '}
                          {inr(bundle.preview.installationRatePerCameraInr)}):{' '}
                          <strong className="font-mono text-[#0B1B36]">
                            {inr(bundle.preview.installationTotalInr)}
                          </strong>
                        </span>
                        <span className="font-mono tabular-nums font-bold text-[#0B1B36]">
                          {inr(bundle.preview.grandTotalInr)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Standard Store Items */}
              {items.length > 0 && (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {items.map(({ product, quantity }) => (
                    <div key={product.id} className="p-4 flex gap-3.5 bg-white">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-16 h-16 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-slate-500">
                          {product.brand} · {product.category}
                        </p>
                        <h4 className="font-display font-semibold text-sm text-[#0B1B36] truncate">
                          {product.name}
                        </h4>
                        <p className="font-mono tabular-nums text-xs font-bold text-[#0B1B36] mt-0.5">
                          {inr((product.priceInr ?? 0) * quantity)}
                        </p>

                        <div className="mt-2.5 flex items-center justify-between">
                          <div className="inline-flex items-center border border-slate-300 rounded-md">
                            <button
                              type="button"
                              onClick={() => updateQuantity(product.id, quantity - 1)}
                              aria-label="Decrease quantity"
                              className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-2.5 text-xs font-mono tabular-nums font-semibold">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(product.id, quantity + 1)}
                              aria-label="Increase quantity"
                              className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFromCart(product.id)}
                            aria-label={`Remove ${product.name}`}
                            className="text-slate-400 hover:text-rose-700 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Optional On-Site Installation Toggle (only for standalone Store products; packages already include per-camera install) */}
              {items.length > 0 && (
                <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-[#F8FAFC] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeInstallation}
                    onChange={(e) => setIncludeInstallation(e.target.checked)}
                    className="mt-1"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-[#0B1B36] block">
                      Include On-Site Professional Installation for Store Products (+
                      {inr(settings.installationBaseFeeInr)})
                    </span>
                    <span className="text-slate-500">
                      TRINETRA technician mounts hardware, configures DVR/NVR, and sets up mobile
                      viewing.
                    </span>
                  </div>
                </label>
              )}

              {/* Coupon / Promo Offer Input (for standalone Store items) */}
              {items.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Apply Store Promo / Offer Code
                  </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Enter code (e.g. TRINETRA500)"
                    className="flex-1 px-3 py-2 text-xs font-mono uppercase rounded-lg border border-slate-300"
                  />
                  <button
                    type="button"
                    disabled={validatingCoupon || !couponInput.trim()}
                    onClick={() => void handleApplyCoupon()}
                    className="px-4 py-2 rounded-lg bg-[#0B1B36] text-white text-xs font-semibold hover:bg-[#13294E] disabled:opacity-50 cursor-pointer"
                  >
                    {validatingCoupon ? '...' : 'Apply'}
                  </button>
                </div>

                {appliedCoupon && (
                  <div className="flex items-center justify-between text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                    <span>{appliedCoupon.message}</span>
                    <button
                      type="button"
                      onClick={() => setAppliedCoupon(null)}
                      className="underline font-semibold cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                )}
                {couponError && <p className="text-xs text-rose-700">{couponError}</p>}

                {/* Click-to-apply active offers */}
                {offers.length > 0 && !appliedCoupon && (
                  <div className="pt-1 space-y-1.5">
                    {offers.slice(0, 2).map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => void handleApplyCoupon(o.code)}
                        className="w-full text-left px-3 py-2 rounded-lg border border-dashed border-slate-300 hover:border-[#C99B2E] text-xs flex items-center justify-between gap-2 cursor-pointer"
                      >
                        <span className="inline-flex items-center gap-1.5 text-slate-700 truncate">
                          <Tag className="w-3.5 h-3.5 text-[#9E7216] shrink-0" />
                          <span className="font-mono font-semibold text-[#0B1B36]">{o.code}</span>
                          <span className="truncate">
                            — {o.discountType === 'flat' ? inr(o.discountValue) : `${o.discountValue}%`} off (min {inr(o.minOrderInr)})
                          </span>
                        </span>
                        <span className="font-semibold text-[#9E7216] shrink-0">Apply</span>
                      </button>
                    ))}
                  </div>
                )}
                </div>
              )}
            </div>
          ) : (
            /* CHECKOUT FORM */
            <form id="store-checkout-form" onSubmit={handlePlaceOrder} className="space-y-4">
              {checkoutError && (
                <div
                  role="alert"
                  className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800"
                >
                  {checkoutError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Customer full name"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9XXXXXXXXX"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Delivery &amp; Installation Address *
                </label>
                <textarea
                  rows={2}
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House/Shop No, Street, Landmark"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State *</label>
                  <select
                    value={state}
                    onChange={(e) =>
                      setState(e.target.value as 'Andhra Pradesh' | 'Telangana' | 'Other')
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                  >
                    <option value="Telangana">Telangana</option>
                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    required
                    pattern="\d{6}"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/[^\d]/g, ''))}
                    placeholder="500001"
                    className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Payment Preference *
                </label>
                <div className="space-y-2">
                  {(
                    [
                      {
                        value: 'PAY_ON_INSTALLATION',
                        label: 'Pay on Installation (Recommended for AP & Telangana)',
                      },
                      {
                        value: 'UPI_ON_DELIVERY',
                        label: `UPI Payment on Delivery${settings.upiId ? ` (${settings.upiId})` : ''}`,
                      },
                    ] as const
                  ).map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-2.5 p-3 rounded-lg border text-xs cursor-pointer ${
                        paymentMethod === opt.value
                          ? 'border-[#0B1B36] bg-slate-50 font-semibold text-[#0B1B36]'
                          : 'border-slate-200 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === opt.value}
                        onChange={() => setPaymentMethod(opt.value)}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 bg-[#F8FAFC] space-y-3">
                <label className="flex items-center gap-2.5 text-xs font-semibold text-[#0B1B36] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={needGstInvoice}
                    onChange={(e) => setNeedGstInvoice(e.target.checked)}
                  />
                  <span>Need B2B GST Tax Invoice? (For Company / Business)</span>
                </label>
                {needGstInvoice && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <input
                      type="text"
                      value={gstCompanyName}
                      onChange={(e) => setGstCompanyName(e.target.value)}
                      placeholder="Registered Company Name"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                    />
                    <input
                      type="text"
                      maxLength={15}
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value.toUpperCase())}
                      placeholder="15-Digit GSTIN (e.g. 36ABCDE1234F1Z5)"
                      className="w-full px-3 py-2 text-xs font-mono uppercase rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Delivery / Site Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Preferred installation day or special instructions"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                />
              </div>
            </form>
          )}
        </div>

        {/* Drawer Footer Totals & Action */}
        {step !== 'confirmed' && hasCartEntries && (
          <div className="p-6 border-t border-slate-200 bg-[#F8FAFC] space-y-3">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Hardware Subtotal</span>
                <span className="font-mono tabular-nums">{inr(subtotalInr)}</span>
              </div>
              {installationFee > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>On-Site Installation</span>
                  <span className="font-mono tabular-nums">{inr(installationFee)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Delivery</span>
                <span className="font-mono tabular-nums">
                  {deliveryFee === 0 ? 'FREE' : inr(deliveryFee)}
                </span>
              </div>
              {packageTaxTotalInr > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Tax / GST (Packages)</span>
                  <span className="font-mono tabular-nums">{inr(packageTaxTotalInr)}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Discount{appliedCoupon ? ` (${appliedCoupon.code})` : ''}</span>
                  <span className="font-mono tabular-nums">-{inr(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-[#0B1B36] pt-2 border-t border-slate-200">
                <span>Estimated Total</span>
                <span className="font-mono tabular-nums">{inr(grandTotal)}</span>
              </div>
            </div>

            {step === 'cart' ? (
              <button
                type="button"
                onClick={() => setStep('checkout')}
                className="w-full py-3 px-4 rounded-lg bg-[#0B1B36] text-white text-sm font-semibold hover:bg-[#13294E] transition-colors cursor-pointer"
              >
                Proceed to Checkout
              </button>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setStep('cart')}
                  className="py-3 px-3 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-[#0B1B36] hover:bg-slate-50 cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  form="store-checkout-form"
                  disabled={placing}
                  className="col-span-2 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-[#0B1B36] text-white text-sm font-semibold hover:bg-[#13294E] disabled:opacity-60 cursor-pointer"
                >
                  {placing && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{placing ? 'Placing Order...' : `Confirm Order · ${inr(grandTotal)}`}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
