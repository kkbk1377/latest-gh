import { Check, Eye, MessageCircle, Scale, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { useBusiness } from '../context/BusinessContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import { formatWhatsAppUrl } from '../data/catalogData.ts';
import type { ProductItem } from '../types.ts';
import { SafeImage } from './SafeImage.tsx';

interface ProductCardProps {
  product: ProductItem;
  layout?: 'grid' | 'list';
  onQuickView?: (product: ProductItem) => void;
  isCompared?: boolean;
  onToggleCompare?: (product: ProductItem) => void;
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

export function ProductCard({
  product,
  layout = 'grid',
  onQuickView,
  isCompared = false,
  onToggleCompare,
}: ProductCardProps) {
  const { settings, openQuoteModal } = useBusiness();
  const { addToCart, openDrawer } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const canBuyOnline =
    product.priceInr !== null &&
    product.priceInr > 0 &&
    product.availability !== 'Out of Stock';

  const savingsPct =
    product.mrpInr && product.priceInr && product.mrpInr > product.priceInr
      ? Math.round(((product.mrpInr - product.priceInr) / product.mrpInr) * 100)
      : null;

  const whatsappText = `Hello ${settings.businessName}, I would like to enquire about:\nProduct: ${product.name}\nBrand: ${product.brand}\nCategory: ${product.category}\nModel: ${product.model}${
    product.priceInr ? `\nListed Price: ₹${product.priceInr.toLocaleString('en-IN')}` : ''
  }`;
  const whatsappUrl = formatWhatsAppUrl(settings.whatsapp, whatsappText);

  const availabilityTextClass =
    product.availability === 'In Stock'
      ? 'text-emerald-700'
      : product.availability === 'Out of Stock'
        ? 'text-rose-700'
        : 'text-slate-600';

  const handleAdd = () => {
    addToCart(product, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  };

  if (layout === 'list') {
    return (
      <article className="group bg-white border border-slate-200 rounded-xl overflow-hidden grid grid-cols-1 sm:grid-cols-12 transition-all duration-200 hover:border-slate-300 hover:shadow-md">
        <div
          onClick={() => onQuickView?.(product)}
          className={`sm:col-span-4 aspect-[4/3] sm:aspect-auto bg-slate-100 overflow-hidden border-b sm:border-b-0 sm:border-r border-slate-100 ${
            onQuickView ? 'cursor-pointer' : ''
          }`}
        >
          <SafeImage
            src={product.imageUrl}
            alt={`${product.brand} ${product.name}`}
            fallbackTitle={`${product.brand} · ${product.category}`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </div>

        <div className="sm:col-span-8 p-5 flex flex-col justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                <span className="font-semibold text-[#0B1B36]">{product.brand}</span>
                <span aria-hidden="true">·</span>
                <span>{product.category}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">{product.model}</span>
              </div>
              <span className={`text-xs font-medium ${availabilityTextClass}`}>
                {product.availability}
              </span>
            </div>

            <h3
              onClick={() => onQuickView?.(product)}
              className={`font-display font-semibold text-base sm:text-lg text-[#0B1B36] leading-snug mb-1.5 ${
                onQuickView ? 'cursor-pointer hover:text-[#9E7216] transition-colors' : ''
              }`}
            >
              {product.name}
            </h3>

            <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 mb-2">
              {product.description}
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
              {product.warranty && <span>{product.warranty}</span>}
              <span>GST Invoice Available</span>
            </div>
          </div>

          <div className="pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-baseline gap-2.5 flex-wrap">
              <span className="font-mono tabular-nums text-lg font-bold text-[#0B1B36]">
                {formatInr(product.priceInr)}
              </span>
              {product.mrpInr && product.priceInr && product.mrpInr > product.priceInr && (
                <span className="font-mono tabular-nums text-xs text-slate-400 line-through">
                  {formatInr(product.mrpInr)}
                </span>
              )}
              {savingsPct !== null && (
                <span className="text-xs font-semibold text-emerald-700">Save {savingsPct}%</span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {onToggleCompare && (
                <button
                  type="button"
                  onClick={() => onToggleCompare(product)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                    isCompared
                      ? 'bg-amber-50 border-[#C99B2E] text-[#0B1B36]'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-[#0B1B36] hover:text-[#0B1B36]'
                  }`}
                >
                  <Scale className="w-3.5 h-3.5 text-[#9E7216]" />
                  <span>{isCompared ? 'Comparing' : 'Compare'}</span>
                </button>
              )}
              {onQuickView && (
                <button
                  type="button"
                  onClick={() => onQuickView(product)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-[#0B1B36] hover:border-[#0B1B36] cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-[#9E7216]" />
                  <span>Details</span>
                </button>
              )}
              {canBuyOnline ? (
                <button
                  type="button"
                  onClick={justAdded ? openDrawer : handleAdd}
                  className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    justAdded
                      ? 'bg-emerald-700 text-white'
                      : 'bg-[#0B1B36] text-white hover:bg-[#13294E]'
                  }`}
                >
                  {justAdded ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>View Cart</span>
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
                      subject: `Quotation for ${product.brand} ${product.name}`,
                      productRef: `${product.brand} — ${product.name} (${product.model})`,
                    })
                  }
                  className="px-4 py-2 rounded-lg bg-[#0B1B36] text-white text-xs font-semibold hover:bg-[#13294E] cursor-pointer"
                >
                  Request Price
                </button>
              )}
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      {/* Uniform 4:3 Product Image */}
      <div
        onClick={() => onQuickView?.(product)}
        className={`relative aspect-[4/3] bg-slate-100 overflow-hidden border-b border-slate-100 ${
          onQuickView ? 'cursor-pointer' : ''
        }`}
      >
        <SafeImage
          src={product.imageUrl}
          alt={`${product.brand} ${product.name}`}
          fallbackTitle={`${product.brand} · ${product.category}`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>

      {/* Details */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 mb-1.5">
          <div className="flex items-center gap-x-1.5 min-w-0">
            <span className="font-semibold text-[#0B1B36] truncate">{product.brand}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{product.category}</span>
          </div>
          {onToggleCompare && (
            <button
              type="button"
              onClick={() => onToggleCompare(product)}
              className={`inline-flex items-center gap-1 text-[11px] font-semibold transition-colors cursor-pointer shrink-0 ${
                isCompared ? 'text-[#9E7216]' : 'text-slate-500 hover:text-[#0B1B36]'
              }`}
            >
              <Scale className="w-3 h-3" aria-hidden="true" />
              <span>{isCompared ? 'Selected' : 'Compare'}</span>
            </button>
          )}
        </div>

        <h3
          onClick={() => onQuickView?.(product)}
          className={`font-display font-semibold text-base text-[#0B1B36] leading-snug mb-1 ${
            onQuickView ? 'cursor-pointer hover:text-[#9E7216] transition-colors' : ''
          }`}
        >
          {product.name}
        </h3>

        <p className="font-mono text-xs text-slate-500 mb-2.5 truncate" title={product.model}>
          Model: {product.model}
        </p>

        <p className="text-sm text-slate-600 leading-relaxed mb-3 flex-1 line-clamp-3">
          {product.description}
        </p>

        <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-3">
          <span className="truncate">{product.warranty || 'Manufacturer Warranty'}</span>
          {onQuickView && (
            <button
              type="button"
              onClick={() => onQuickView(product)}
              className="inline-flex items-center gap-1 font-semibold text-[#0B1B36] hover:text-[#9E7216] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Quick View</span>
            </button>
          )}
        </div>

        {/* Pricing + Availability */}
        <div className="pt-3.5 border-t border-slate-100 mb-4 flex items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-mono tabular-nums text-base font-bold text-[#0B1B36]">
              {formatInr(product.priceInr)}
            </span>
            {product.mrpInr && product.priceInr && product.mrpInr > product.priceInr && (
              <span className="font-mono tabular-nums text-xs text-slate-400 line-through">
                {formatInr(product.mrpInr)}
              </span>
            )}
            {savingsPct !== null && (
              <span className="text-xs font-semibold text-emerald-700">Save {savingsPct}%</span>
            )}
          </div>
          <span className={`text-xs font-medium whitespace-nowrap ${availabilityTextClass}`}>
            {product.availability}
          </span>
        </div>

        {/* Store Actions */}
        <div className="space-y-2">
          {canBuyOnline ? (
            <button
              type="button"
              onClick={justAdded ? openDrawer : handleAdd}
              className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[42px] rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                justAdded
                  ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                  : 'bg-[#0B1B36] text-white hover:bg-[#13294E]'
              }`}
            >
              {justAdded ? (
                <>
                  <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Added — View Cart</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4 text-[#DFB85A] shrink-0" aria-hidden="true" />
                  <span>Add to Cart</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                openQuoteModal({
                  subject: `Quotation for ${product.brand} ${product.name}`,
                  productRef: `${product.brand} — ${product.name} (${product.model})`,
                })
              }
              className="w-full inline-flex items-center justify-center px-4 py-2.5 min-h-[42px] rounded-lg bg-[#0B1B36] text-white text-xs font-semibold hover:bg-[#13294E] transition-colors whitespace-nowrap cursor-pointer"
            >
              Request Best Price
            </button>
          )}

          <div className="grid grid-cols-2 gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[38px] rounded-lg border border-slate-300 bg-white text-[#0B1B36] text-xs font-semibold hover:border-[#0B1B36] hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#9E7216] shrink-0" aria-hidden="true" />
              <span>WhatsApp</span>
            </a>
            <button
              type="button"
              onClick={() =>
                openQuoteModal({
                  subject: `Bulk GST Quote: ${product.brand} ${product.name}`,
                  productRef: `${product.brand} — ${product.name} (${product.model})`,
                })
              }
              className="inline-flex items-center justify-center px-3 py-2 min-h-[38px] rounded-lg border border-slate-300 bg-white text-[#0B1B36] text-xs font-semibold hover:border-[#0B1B36] hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer"
            >
              Bulk Quote
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
