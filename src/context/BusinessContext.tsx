import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { BRAND_PARTNERS } from '../data/catalogData.ts';
import { api } from '../lib/api.ts';
import type { BrandPartnerItem, BusinessSettings, PromoOffer } from '../types.ts';

export interface QuotePrefill {
  subject?: string;
  productRef?: string;
  serviceRef?: string;
  message?: string;
  cameraCount?: string;
}

const FALLBACK_SETTINGS: BusinessSettings = {
  businessName: 'TRINETRA CCTV SOLUTIONS',
  domain: 'https://trinetrasolutions.online',
  tagline: 'Complete CCTV Security Solutions Under One Roof',
  logoUrl: '',
  heroBadgeText: 'TRINETRA CCTV SOLUTIONS · Andhra Pradesh & Telangana',
  heroHeadline: 'Complete CCTV Security Solutions Under One Roof',
  heroSubtitle:
    'End-to-end CCTV camera sales, structured IP and HD installation, DVR/NVR setup, hard disk replacement, PoE networking, and dependable repair services for homes, businesses, and industrial sites across Andhra Pradesh and Telangana.',
  phone: '+91 90000 00000',
  whatsapp: '+91 90000 00000',
  email: 'contact@trinetrasolutions.online',
  address: 'Service Operations Office, Hyderabad & Vijayawada, Telangana & Andhra Pradesh, India',
  businessHours: 'Monday – Saturday, 9:00 AM – 7:30 PM IST',
  serviceAreas: ['Andhra Pradesh', 'Telangana'],
  officeLocationName: 'TRINETRA CCTV SOLUTIONS — Regional Hub',
  officeLat: 17.385,
  officeLng: 78.4867,
  freeDeliveryThresholdInr: 10000,
  installationBaseFeeInr: 1500,
  upiId: 'trinetrasolutions@upi',
  updatedAt: '',
};

const FALLBACK_BRANDS: BrandPartnerItem[] = BRAND_PARTNERS.map((b) => ({
  ...b,
  logoUrl: '',
  active: true,
}));

interface BusinessContextValue {
  settings: BusinessSettings;
  brands: BrandPartnerItem[];
  offers: PromoOffer[];
  loading: boolean;
  refreshSettings: () => Promise<void>;
  quoteOpen: boolean;
  quotePrefill: QuotePrefill;
  openQuoteModal: (prefill?: QuotePrefill) => void;
  closeQuoteModal: () => void;
}

const BusinessContext = createContext<BusinessContextValue | null>(null);

export function BusinessProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<BusinessSettings>(FALLBACK_SETTINGS);
  const [brands, setBrands] = useState<BrandPartnerItem[]>(FALLBACK_BRANDS);
  const [offers, setOffers] = useState<PromoOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quotePrefill, setQuotePrefill] = useState<QuotePrefill>({});

  const refreshSettings = useCallback(async () => {
    try {
      const [settingsRes, brandsRes, offersRes] = await Promise.all([
        api.getSettings(),
        api.getBrands(),
        api.getOffers(),
      ]);
      setSettings(settingsRes);
      if (brandsRes.brands.length > 0) setBrands(brandsRes.brands);
      setOffers(offersRes.offers);
    } catch {
      // Retain fallbacks on transient failure
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSettings();
  }, [refreshSettings]);

  // Keep Schema.org LocalBusiness JSON-LD synchronized with live editable settings
  useEffect(() => {
    const scriptEl = document.querySelector<HTMLScriptElement>(
      'script[type="application/ld+json"]',
    );
    if (!scriptEl) return;
    const ld = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: settings.businessName,
      url: settings.domain,
      telephone: settings.phone,
      email: settings.email,
      description: settings.heroSubtitle,
      areaServed: settings.serviceAreas.map((stateName) => ({
        '@type': 'State',
        name: stateName,
      })),
      address: {
        '@type': 'PostalAddress',
        streetAddress: settings.address,
        addressCountry: 'IN',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: settings.officeLat,
        longitude: settings.officeLng,
      },
    };
    scriptEl.textContent = JSON.stringify(ld);
  }, [settings]);

  const openQuoteModal = useCallback((prefill?: QuotePrefill) => {
    setQuotePrefill(prefill ?? {});
    setQuoteOpen(true);
  }, []);

  const closeQuoteModal = useCallback(() => {
    setQuoteOpen(false);
  }, []);

  return (
    <BusinessContext.Provider
      value={{
        settings,
        brands,
        offers,
        loading,
        refreshSettings,
        quoteOpen,
        quotePrefill,
        openQuoteModal,
        closeQuoteModal,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness(): BusinessContextValue {
  const ctx = useContext(BusinessContext);
  if (!ctx) {
    throw new Error('useBusiness must be used inside BusinessProvider');
  }
  return ctx;
}
