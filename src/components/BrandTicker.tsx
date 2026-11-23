import { Link } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext.tsx';
import type { BrandPartnerItem } from '../types.ts';

function BrandWordmarkCard({ brand }: { brand: BrandPartnerItem }) {
  return (
    <Link
      to={`/store?brand=${encodeURIComponent(brand.name)}`}
      className="group flex items-center gap-3.5 px-6 py-4 mx-2.5 bg-white border border-slate-200/90 rounded-lg hover:border-[#C99B2E] transition-colors duration-150 shrink-0 min-w-[235px]"
      title={`Explore ${brand.name} products`}
    >
      {brand.logoUrl ? (
        <img
          src={brand.logoUrl}
          alt={brand.name}
          className="w-9 h-9 rounded-md object-contain bg-slate-50 border border-slate-100 p-1 shrink-0"
        />
      ) : (
        <span
          className="w-9 h-9 rounded-md flex items-center justify-center text-xs font-display font-extrabold tracking-tight text-white shrink-0 transition-transform duration-150 group-hover:scale-105"
          style={{ backgroundColor: brand.accentHex }}
          aria-hidden="true"
        >
          {brand.shortMark.slice(0, 2)}
        </span>
      )}
      <span className="min-w-0">
        <span className="block font-display font-bold text-sm text-[#0B1B36] tracking-tight whitespace-nowrap">
          {brand.name}
        </span>
        <span className="block text-xs text-slate-500 whitespace-nowrap">
          {brand.categoryNote}
        </span>
      </span>
    </Link>
  );
}

export function BrandTicker() {
  const { brands } = useBusiness();
  const activeBrands = brands.filter((b) => b.active);
  if (activeBrands.length === 0) return null;

  return (
    <section
      aria-label="Surveillance Brands Supplied and Serviced"
      className="bg-white border-y border-slate-200 py-10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-[#9E7216] mb-1">
            Multi-Brand Hardware Ecosystem
          </p>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-[#0B1B36] tracking-tight">
            Surveillance Brands We Supply &amp; Service
          </h2>
        </div>
        <p className="text-xs text-slate-500">
          Hover or tap any brand to pause · Click to shop brand
        </p>
      </div>

      <div className="brand-marquee-viewport relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-10 sm:w-20 bg-gradient-to-r from-white to-transparent z-10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-10 sm:w-20 bg-gradient-to-l from-white to-transparent z-10"
        />

        <div className="brand-marquee-track py-1">
          <div className="flex items-center shrink-0">
            {activeBrands.map((brand) => (
              <BrandWordmarkCard key={`a-${brand.id}`} brand={brand} />
            ))}
          </div>
          <div className="flex items-center shrink-0" aria-hidden="true">
            {activeBrands.map((brand) => (
              <BrandWordmarkCard key={`b-${brand.id}`} brand={brand} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
