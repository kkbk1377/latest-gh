import { Lock, Menu, ShoppingBag, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useBusiness } from '../context/BusinessContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import { BrandLogo } from './BrandLogo.tsx';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/solutions', label: 'Solutions' },
  { to: '/store', label: 'Store' },
  { to: '/packages', label: 'Packages' },
  { to: '/services', label: 'Services' },
  { to: '/contact', label: 'Contact' },
] as const;

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { openQuoteModal } = useBusiness();
  const { totalCount, openDrawer } = useCart();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 lg:gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <Link
          to="/"
          onClick={() => setMobileOpen(false)}
          aria-label="TRINETRA CCTV SOLUTIONS Home"
          className="inline-flex items-center whitespace-nowrap shrink-0"
        >
          <BrandLogo variant="dark" />
        </Link>

        {/* Zone 2: 6 concise single-line text links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-5 lg:gap-6 text-sm font-medium text-slate-600"
        >
          {NAV_LINKS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `relative py-1 whitespace-nowrap shrink-0 transition-colors duration-150 ${
                  isActive
                    ? 'text-[#0B1B36] font-semibold after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-0.5 after:bg-[#C99B2E]'
                    : 'text-slate-600 hover:text-[#0B1B36]'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Zone 3: Shopping Cart, Admin Login & Primary CTA */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={openDrawer}
            aria-label={`Open shopping cart (${totalCount} items)`}
            className="relative inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[40px] rounded-lg border border-slate-200 text-[#0B1B36] hover:border-[#0B1B36] hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-[#9E7216]" aria-hidden="true" />
            <span className="text-xs font-mono font-semibold tabular-nums">
              {totalCount > 0 ? `Cart (${totalCount})` : 'Cart'}
            </span>
          </button>

          <NavLink
            to="/admin"
            onClick={() => setMobileOpen(false)}
            aria-label="Admin Panel Login"
            className={({ isActive }) =>
              `hidden sm:inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[40px] rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-[#0B1B36] text-white border-[#0B1B36]'
                  : 'border-slate-200 text-[#0B1B36] hover:border-[#C99B2E] hover:bg-amber-50/50'
              }`
            }
          >
            <Lock className="w-3.5 h-3.5 text-[#9E7216]" aria-hidden="true" />
            <span>Admin</span>
          </NavLink>

          <button
            type="button"
            onClick={() => openQuoteModal({ subject: 'CCTV Security Quotation Request' })}
            className="hidden lg:inline-flex items-center justify-center px-4 py-2.5 min-h-[40px] text-sm font-semibold text-white bg-[#0B1B36] hover:bg-[#13294E] border border-[#0B1B36] rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Get a Quote
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg text-[#0B1B36] hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <nav
          aria-label="Mobile Navigation"
          className="md:hidden bg-white border-t border-slate-200 px-4 py-4 space-y-1 shadow-sm"
        >
          {NAV_LINKS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-100 text-[#0B1B36] font-semibold'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-[#0B1B36]'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <NavLink
            to="/track"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-3 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Track Order / Enquiry
          </NavLink>
          <NavLink
            to="/admin"
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-3 rounded-lg text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-[#0B1B36] text-white'
                  : 'text-[#0B1B36] bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200/70'
              }`
            }
          >
            <Lock className="w-4 h-4 text-[#9E7216]" aria-hidden="true" />
            <span>Admin Login</span>
          </NavLink>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                openQuoteModal({ subject: 'CCTV Security Quotation Request' });
              }}
              className="w-full py-3 px-4 rounded-lg bg-[#0B1B36] text-white text-sm font-semibold hover:bg-[#13294E] transition-colors cursor-pointer"
            >
              Get a Quote
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}
