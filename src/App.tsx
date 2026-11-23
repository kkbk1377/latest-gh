import { useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { CartDrawer } from './components/CartDrawer.tsx';
import { Footer } from './components/Footer.tsx';
import { Navbar } from './components/Navbar.tsx';
import { PromoBanner } from './components/PromoBanner.tsx';
import { QuoteModal } from './components/QuoteModal.tsx';
import { SeoManager } from './components/SeoManager.tsx';
import { BusinessProvider } from './context/BusinessContext.tsx';
import { CartProvider } from './context/CartContext.tsx';
import { AdminPage } from './pages/AdminPage.tsx';
import { ContactPage } from './pages/ContactPage.tsx';
import { CoveragePage } from './pages/CoveragePage.tsx';
import { GuidesPage } from './pages/GuidesPage.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { PackagesPage } from './pages/PackagesPage.tsx';
import { ProductsPage } from './pages/ProductsPage.tsx';
import { ServicesPage } from './pages/ServicesPage.tsx';
import { SolutionsPage } from './pages/SolutionsPage.tsx';
import { TrackOrderPage } from './pages/TrackOrderPage.tsx';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
}

export default function App() {
  const [mapsQuotaExceeded, setMapsQuotaExceeded] = useState(false);

  useEffect(() => {
    const onQuotaExceeded = () => setMapsQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuotaExceeded);
  }, []);

  return (
    <BusinessProvider>
      <CartProvider>
        <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
          {mapsQuotaExceeded && (
            <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
              <span>
                Google Maps Platform quota reached. If you are the app owner, visit{' '}
                <a
                  href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-semibold text-amber-950 hover:text-amber-800"
                >
                  maps developer site
                </a>{' '}
                for instructions to update your account.
              </span>
            </div>
          )}

          <ScrollToTop />
          <SeoManager />
          <PromoBanner />
          <Navbar />

          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/solutions" element={<SolutionsPage />} />
              <Route path="/store" element={<ProductsPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/packages" element={<PackagesPage />} />
              <Route path="/planner" element={<PackagesPage />} />
              <Route path="/guides" element={<GuidesPage />} />
              <Route path="/coverage" element={<CoveragePage />} />
              <Route path="/track" element={<TrackOrderPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="*" element={<HomePage />} />
            </Routes>
          </main>

          <Footer />
          <CartDrawer />
          <QuoteModal />
        </div>
      </CartProvider>
    </BusinessProvider>
  );
}
