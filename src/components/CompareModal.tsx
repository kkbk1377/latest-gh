import { ShoppingBag, Trash2, X } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import type { ProductItem } from '../types.ts';
import { SafeImage } from './SafeImage.tsx';

interface CompareModalProps {
  products: ProductItem[];
  open: boolean;
  onClose: () => void;
  onRemove: (id: string) => void;
}

function formatInr(amount: number | null): string {
  if (amount === null || !Number.isFinite(amount)) return 'Price on Request';
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function CompareModal({ products, open, onClose, onRemove }: CompareModalProps) {
  const { openQuoteModal } = useBusiness();
  const { addToCart, openDrawer } = useCart();

  if (!open || products.length === 0) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#061022]/75 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full max-w-5xl rounded-xl border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 bg-[#0B1B36] text-white flex items-center justify-between gap-4 shrink-0">
          <div>
            <p className="text-xs text-[#DFB85A] font-medium">
              Side-by-Side Technical Comparison
            </p>
            <h2 id="compare-modal-title" className="font-display font-bold text-lg text-white">
              Compare CCTV Hardware ({products.length} Selected)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close comparison"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-300 hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-auto p-6">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-3 pr-4 w-40 text-xs font-semibold uppercase tracking-wider text-slate-500 align-top">
                  Specification
                </th>
                {products.map((p) => (
                  <th key={p.id} className="py-3 px-4 align-top">
                    <div className="space-y-2.5">
                      <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                        <SafeImage
                          src={p.imageUrl}
                          alt={p.name}
                          fallbackTitle={p.brand}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => onRemove(p.id)}
                          aria-label={`Remove ${p.name} from comparison`}
                          className="absolute top-2 right-2 w-7 h-7 rounded-md bg-white/95 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-rose-700 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="font-display font-bold text-sm text-[#0B1B36] leading-snug">
                        {p.name}
                      </p>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              <tr>
                <td className="py-3 pr-4 font-semibold text-slate-600">Brand</td>
                {products.map((p) => (
                  <td key={p.id} className="py-3 px-4 font-semibold text-[#0B1B36]">
                    {p.brand}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 pr-4 font-semibold text-slate-600">Category</td>
                {products.map((p) => (
                  <td key={p.id} className="py-3 px-4 text-slate-700">
                    {p.category}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 pr-4 font-semibold text-slate-600">Model / SKU</td>
                {products.map((p) => (
                  <td key={p.id} className="py-3 px-4 font-mono text-xs text-slate-700">
                    {p.model}
                  </td>
                ))}
              </tr>
              <tr className="bg-[#F8FAFC]">
                <td className="py-3 pr-4 font-semibold text-slate-600">Selling Price</td>
                {products.map((p) => (
                  <td key={p.id} className="py-3 px-4 font-mono font-bold text-base text-[#0B1B36]">
                    {formatInr(p.priceInr)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 pr-4 font-semibold text-slate-600">MRP &amp; Savings</td>
                {products.map((p) => {
                  const pct =
                    p.mrpInr && p.priceInr && p.mrpInr > p.priceInr
                      ? Math.round(((p.mrpInr - p.priceInr) / p.mrpInr) * 100)
                      : null;
                  return (
                    <td key={p.id} className="py-3 px-4 font-mono text-xs text-slate-600">
                      {p.mrpInr ? formatInr(p.mrpInr) : '—'}{' '}
                      {pct !== null && (
                        <span className="font-sans font-semibold text-emerald-700">
                          (Save {pct}%)
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="py-3 pr-4 font-semibold text-slate-600">Warranty</td>
                {products.map((p) => (
                  <td key={p.id} className="py-3 px-4 text-slate-700">
                    {p.warranty || 'Manufacturer Standard Warranty'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 pr-4 font-semibold text-slate-600">Availability</td>
                {products.map((p) => (
                  <td
                    key={p.id}
                    className={`py-3 px-4 font-semibold ${
                      p.availability === 'In Stock' ? 'text-emerald-700' : 'text-slate-600'
                    }`}
                  >
                    {p.availability}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-3 pr-4 font-semibold text-slate-600 align-top">Highlights</td>
                {products.map((p) => (
                  <td key={p.id} className="py-3 px-4 text-xs text-slate-600 leading-relaxed align-top">
                    {p.description}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-4 pr-4 font-semibold text-slate-600">Action</td>
                {products.map((p) => {
                  const canBuy = p.priceInr !== null && p.priceInr > 0 && p.availability !== 'Out of Stock';
                  return (
                    <td key={p.id} className="py-4 px-4">
                      {canBuy ? (
                        <button
                          type="button"
                          onClick={() => {
                            addToCart(p, 1);
                            onClose();
                            openDrawer();
                          }}
                          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-[#0B1B36] text-white text-xs font-semibold hover:bg-[#13294E] cursor-pointer"
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-[#DFB85A]" />
                          <span>Add to Cart</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            openQuoteModal({
                              subject: `Quotation for ${p.brand} ${p.name}`,
                              productRef: `${p.brand} — ${p.name} (${p.model})`,
                            });
                          }}
                          className="w-full px-3 py-2.5 rounded-lg bg-[#0B1B36] text-white text-xs font-semibold hover:bg-[#13294E] cursor-pointer"
                        >
                          Request Price
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
