import {
  CheckCircle2,
  ImagePlus,
  KeyRound,
  Loader2,
  LogOut,
  MessageCircle,
  Plus,
  Save,
  Shield,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { AdminPackagesPanel } from '../components/AdminPackagesPanel.tsx';
import { useBusiness } from '../context/BusinessContext.tsx';
import {
  ASSET_IMAGES,
  PRODUCT_CATEGORIES,
  formatWhatsAppUrl,
} from '../data/catalogData.ts';
import { api } from '../lib/api.ts';
import type {
  AdminAnalytics,
  AvailabilityStatus,
  BrandPartnerItem,
  ClientTestimonial,
  CustomerEnquiry,
  EnquiryStatus,
  OrderStatus,
  ProductCategory,
  ProductItem,
  PromoOffer,
  StoreOrder,
} from '../types.ts';

const TOKEN_STORAGE_KEY = 'trinetra_admin_session';

type AdminTab =
  | 'packages'
  | 'orders'
  | 'products'
  | 'offers'
  | 'branding'
  | 'contact'
  | 'enquiries'
  | 'reviews';

const IMAGE_PRESETS = [
  { label: 'Bullet Camera Photo', url: ASSET_IMAGES.bulletCamera },
  { label: 'Dome Camera Photo', url: ASSET_IMAGES.domeCamera },
  { label: 'NVR / PoE / HDD Hardware Photo', url: ASSET_IMAGES.nvrHardware },
];

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read selected file.'));
    reader.readAsDataURL(file);
  });
}

export function AdminPage() {
  const { settings, refreshSettings } = useBusiness();

  const [token, setToken] = useState<string>(
    () => sessionStorage.getItem(TOKEN_STORAGE_KEY) || '',
  );
  const [statusLoading, setStatusLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  const [passcodeInput, setPasscodeInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const [activeTab, setActiveTab] = useState<AdminTab>('orders');
  const [toast, setToast] = useState<string | null>(null);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // Analytics & Admin Collections
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [offers, setOffers] = useState<PromoOffer[]>([]);
  const [brands, setBrands] = useState<BrandPartnerItem[]>([]);
  const [enquiries, setEnquiries] = useState<CustomerEnquiry[]>([]);
  const [reviews, setReviews] = useState<ClientTestimonial[]>([]);

  // Settings / Contact / Branding state
  const [sBusinessName, setSBusinessName] = useState(settings.businessName);
  const [sDomain, setSDomain] = useState(settings.domain);
  const [sTagline, setSTagline] = useState(settings.tagline);
  const [sLogoUrl, setSLogoUrl] = useState(settings.logoUrl);
  const [sHeroBadge, setSHeroBadge] = useState(settings.heroBadgeText);
  const [sHeroHeadline, setSHeroHeadline] = useState(settings.heroHeadline);
  const [sHeroSubtitle, setSHeroSubtitle] = useState(settings.heroSubtitle);
  const [sPhone, setSPhone] = useState(settings.phone);
  const [sWhatsapp, setSWhatsapp] = useState(settings.whatsapp);
  const [sEmail, setSEmail] = useState(settings.email);
  const [sAddress, setSAddress] = useState(settings.address);
  const [sHours, setSHours] = useState(settings.businessHours);
  const [sOfficeName, setSOfficeName] = useState(settings.officeLocationName);
  const [sLat, setSLat] = useState(String(settings.officeLat));
  const [sLng, setSLng] = useState(String(settings.officeLng));
  const [sFreeDelivery, setSFreeDelivery] = useState(String(settings.freeDeliveryThresholdInr));
  const [sInstallFee, setSInstallFee] = useState(String(settings.installationBaseFeeInr));
  const [sUpiId, setSUpiId] = useState(settings.upiId);
  const [savingSettings, setSavingSettings] = useState(false);

  // Product editor state
  const [editingProdId, setEditingProdId] = useState<string | null>(null);
  const [pName, setPName] = useState('');
  const [pCategory, setPCategory] = useState<ProductCategory>('Bullet Cameras');
  const [pBrand, setPBrand] = useState('Hikvision');
  const [pModel, setPModel] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pMrp, setPMrp] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pWarranty, setPWarranty] = useState('2 Years Manufacturer Warranty');
  const [pAvailability, setPAvailability] = useState<AvailabilityStatus>('In Stock');
  const [pImageUrl, setPImageUrl] = useState<string>(ASSET_IMAGES.bulletCamera);
  const [pFeatured, setPFeatured] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);

  // Offer editor state
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [oTitle, setOTitle] = useState('');
  const [oCode, setOCode] = useState('');
  const [oDesc, setODesc] = useState('');
  const [oType, setOType] = useState<'percent' | 'flat'>('flat');
  const [oValue, setOValue] = useState('500');
  const [oMinOrder, setOMinOrder] = useState('5000');
  const [oValidUntil, setOValidUntil] = useState('2026-12-31');
  const [oActive, setOActive] = useState(true);
  const [oBanner, setOBanner] = useState(false);
  const [savingOffer, setSavingOffer] = useState(false);

  // Brand partner editor state
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);
  const [bName, setBName] = useState('');
  const [bShort, setBShort] = useState('');
  const [bColor, setBColor] = useState('#0B1B36');
  const [bNote, setBNote] = useState('');
  const [bLogoUrl, setBLogoUrl] = useState('');
  const [bActive, setBActive] = useState(true);
  const [savingBrand, setSavingBrand] = useState(false);

  // Change password state
  const [currPass, setCurrPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [changingPass, setChangingPass] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    setSBusinessName(settings.businessName);
    setSDomain(settings.domain);
    setSTagline(settings.tagline);
    setSLogoUrl(settings.logoUrl);
    setSHeroBadge(settings.heroBadgeText);
    setSHeroHeadline(settings.heroHeadline);
    setSHeroSubtitle(settings.heroSubtitle);
    setSPhone(settings.phone);
    setSWhatsapp(settings.whatsapp);
    setSEmail(settings.email);
    setSAddress(settings.address);
    setSHours(settings.businessHours);
    setSOfficeName(settings.officeLocationName);
    setSLat(String(settings.officeLat));
    setSLng(String(settings.officeLng));
    setSFreeDelivery(String(settings.freeDeliveryThresholdInr));
    setSInstallFee(String(settings.installationBaseFeeInr));
    setSUpiId(settings.upiId);
  }, [settings]);

  const loadAdminData = useCallback(async (activeToken: string) => {
    const [analyticsRes, ordersRes, prodRes, offersRes, brandsRes, enqRes, revRes] =
      await Promise.all([
        api.getAdminAnalytics(activeToken),
        api.getAdminOrders(activeToken),
        api.getProducts(),
        api.getAdminOffers(activeToken),
        api.getAdminBrands(activeToken),
        api.getAdminEnquiries(activeToken),
        api.getAdminTestimonials(activeToken),
      ]);
    setAnalytics(analyticsRes);
    setOrders(ordersRes.orders);
    setProducts(prodRes.products);
    setOffers(offersRes.offers);
    setBrands(brandsRes.brands);
    setEnquiries(enqRes.enquiries);
    setReviews(revRes.testimonials);
  }, []);

  useEffect(() => {
    let active = true;
    api
      .getAdminStatus(token || undefined)
      .then(async (res) => {
        if (!active) return;
        setAuthenticated(res.authenticated);
        if (res.authenticated && token) {
          await loadAdminData(token);
        } else if (token) {
          sessionStorage.removeItem(TOKEN_STORAGE_KEY);
          setToken('');
        }
      })
      .catch(() => {
        if (active) setAuthError('Unable to reach server.');
      })
      .finally(() => {
        if (active) setStatusLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token, loadAdminData]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSubmitting(true);
    try {
      const res = await api.loginAdmin(passcodeInput);
      sessionStorage.setItem(TOKEN_STORAGE_KEY, res.token);
      setToken(res.token);
      setAuthenticated(true);
      setPasscodeInput('');
      await loadAdminData(res.token);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken('');
    setAuthenticated(false);
  };

  const handleUploadFile = async (
    e: ChangeEvent<HTMLInputElement>,
    prefix: 'logo' | 'product' | 'brand',
    onUrl: (url: string) => void,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAuthError(null);
    setUploadingField(prefix);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const res = await api.uploadImage(token, dataUrl, prefix);
      onUrl(res.url);
      showToast('Image uploaded successfully.');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Image upload failed.');
    } finally {
      setUploadingField(null);
      e.target.value = '';
    }
  };

  const saveAllSettings = async (e: FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setAuthError(null);
    try {
      const latNum = Number(sLat);
      const lngNum = Number(sLng);
      const freeDel = Number(sFreeDelivery);
      const instFee = Number(sInstallFee);
      if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
        throw new Error('Latitude and Longitude must be valid decimal coordinates.');
      }
      await api.updateSettings(token, {
        businessName: sBusinessName,
        domain: sDomain,
        tagline: sTagline,
        logoUrl: sLogoUrl,
        heroBadgeText: sHeroBadge,
        heroHeadline: sHeroHeadline,
        heroSubtitle: sHeroSubtitle,
        phone: sPhone,
        whatsapp: sWhatsapp,
        email: sEmail,
        address: sAddress,
        businessHours: sHours,
        serviceAreas: ['Andhra Pradesh', 'Telangana'],
        officeLocationName: sOfficeName,
        officeLat: latNum,
        officeLng: lngNum,
        freeDeliveryThresholdInr: Number.isFinite(freeDel) ? freeDel : 10000,
        installationBaseFeeInr: Number.isFinite(instFee) ? instFee : 1500,
        upiId: sUpiId,
      });
      await refreshSettings();
      showToast('Website branding, contact & store settings saved live!');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to save settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  // Product handlers
  const resetProductForm = () => {
    setEditingProdId(null);
    setPName('');
    setPCategory('Bullet Cameras');
    setPBrand(brands[0]?.name || 'Hikvision');
    setPModel('');
    setPDesc('');
    setPMrp('');
    setPPrice('');
    setPWarranty('2 Years Manufacturer Warranty');
    setPAvailability('In Stock');
    setPImageUrl(ASSET_IMAGES.bulletCamera);
    setPFeatured(false);
  };

  const startEditProduct = (item: ProductItem) => {
    setEditingProdId(item.id);
    setPName(item.name);
    setPCategory(item.category);
    setPBrand(item.brand);
    setPModel(item.model);
    setPDesc(item.description);
    setPMrp(item.mrpInr !== null ? String(item.mrpInr) : '');
    setPPrice(item.priceInr !== null ? String(item.priceInr) : '');
    setPWarranty(item.warranty || '');
    setPAvailability(item.availability);
    setPImageUrl(item.imageUrl);
    setPFeatured(item.featured);
  };

  const handleSaveProduct = async (e: FormEvent) => {
    e.preventDefault();
    setSavingProduct(true);
    setAuthError(null);
    try {
      const parsedMrp = pMrp.trim() === '' ? null : Number(pMrp);
      const parsedPrice = pPrice.trim() === '' ? null : Number(pPrice);
      const payload = {
        name: pName,
        category: pCategory,
        brand: pBrand,
        model: pModel,
        description: pDesc,
        mrpInr: parsedMrp,
        priceInr: parsedPrice,
        warranty: pWarranty,
        availability: pAvailability,
        imageUrl: pImageUrl,
        featured: pFeatured,
        isReferenceEntry: false,
      };
      if (editingProdId) {
        await api.updateProduct(token, editingProdId, payload);
        showToast('Product updated live in Store.');
      } else {
        await api.createProduct(token, payload);
        showToast('New product added live to Store.');
      }
      resetProductForm();
      await loadAdminData(token);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to save product.');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await api.deleteProduct(token, id);
      await loadAdminData(token);
      showToast('Product deleted.');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Delete failed.');
    }
  };

  // Offer handlers
  const resetOfferForm = () => {
    setEditingOfferId(null);
    setOTitle('');
    setOCode('');
    setODesc('');
    setOType('flat');
    setOValue('500');
    setOMinOrder('5000');
    setOValidUntil('2026-12-31');
    setOActive(true);
    setOBanner(false);
  };

  const startEditOffer = (offer: PromoOffer) => {
    setEditingOfferId(offer.id);
    setOTitle(offer.title);
    setOCode(offer.code);
    setODesc(offer.description);
    setOType(offer.discountType);
    setOValue(String(offer.discountValue));
    setOMinOrder(String(offer.minOrderInr));
    setOValidUntil(offer.validUntil);
    setOActive(offer.active);
    setOBanner(offer.showInBanner);
  };

  const handleSaveOffer = async (e: FormEvent) => {
    e.preventDefault();
    setSavingOffer(true);
    setAuthError(null);
    try {
      const payload = {
        title: oTitle,
        code: oCode.trim().toUpperCase(),
        description: oDesc,
        discountType: oType,
        discountValue: Number(oValue),
        minOrderInr: Number(oMinOrder),
        validUntil: oValidUntil,
        active: oActive,
        showInBanner: oBanner,
      };
      if (editingOfferId) {
        await api.updateOffer(token, editingOfferId, payload);
        showToast('Offer updated live.');
      } else {
        await api.createOffer(token, payload);
        showToast('New offer published live.');
      }
      resetOfferForm();
      await Promise.all([loadAdminData(token), refreshSettings()]);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Failed to save offer.');
    } finally {
      setSavingOffer(false);
    }
  };

  const handleDeleteOffer = async (id: string) => {
    try {
      await api.deleteOffer(token, id);
      await Promise.all([loadAdminData(token), refreshSettings()]);
      showToast('Offer deleted.');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Delete failed.');
    }
  };

  // Brand partner handlers
  const resetBrandForm = () => {
    setEditingBrandId(null);
    setBName('');
    setBShort('');
    setBColor('#0B1B36');
    setBNote('');
    setBLogoUrl('');
    setBActive(true);
  };

  const startEditBrand = (b: BrandPartnerItem) => {
    setEditingBrandId(b.id);
    setBName(b.name);
    setBShort(b.shortMark);
    setBColor(b.accentHex);
    setBNote(b.categoryNote);
    setBLogoUrl(b.logoUrl);
    setBActive(b.active);
  };

  const handleSaveBrand = async (e: FormEvent) => {
    e.preventDefault();
    setSavingBrand(true);
    setAuthError(null);
    try {
      const payload = {
        name: bName,
        shortMark: bShort || bName.slice(0, 8).toUpperCase(),
        accentHex: bColor,
        categoryNote: bNote,
        logoUrl: bLogoUrl,
        active: bActive,
      };
      if (editingBrandId) {
        await api.updateBrand(token, editingBrandId, payload);
        showToast('Brand partner updated.');
      } else {
        await api.createBrand(token, payload);
        showToast('New brand partner added to marquee.');
      }
      resetBrandForm();
      await Promise.all([loadAdminData(token), refreshSettings()]);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Failed to save brand.');
    } finally {
      setSavingBrand(false);
    }
  };

  const handleDeleteBrand = async (id: string) => {
    try {
      await api.deleteBrand(token, id);
      await Promise.all([loadAdminData(token), refreshSettings()]);
      showToast('Brand removed.');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Delete failed.');
    }
  };

  // Order, Enquiry, Review & Password handlers
  const handleOrderStatus = async (id: string, status: OrderStatus) => {
    try {
      const res = await api.updateOrderStatus(token, id, status);
      setOrders((prev) => prev.map((o) => (o.id === id ? res.order : o)));
      const a = await api.getAdminAnalytics(token);
      setAnalytics(a);
      showToast(`Order ${id} updated to ${status.toUpperCase()}.`);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Failed to update order.');
    }
  };

  const handleEnquiryStatus = async (id: string, status: EnquiryStatus) => {
    try {
      const res = await api.updateEnquiryStatus(token, id, status);
      setEnquiries((prev) => prev.map((e) => (e.id === id ? res.enquiry : e)));
      showToast(`Enquiry ${id} marked as ${status}.`);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Failed to update enquiry.');
    }
  };

  const handleReviewStatus = async (id: string, status: 'pending' | 'approved') => {
    try {
      const res = await api.updateTestimonialStatus(token, id, status);
      setReviews((prev) => prev.map((r) => (r.id === id ? res.testimonial : r)));
      showToast(status === 'approved' ? 'Review published live.' : 'Review unpublished.');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Failed to update review.');
    }
  };

  const handleDeleteReview = async (id: string) => {
    try {
      await api.deleteTestimonial(token, id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      showToast('Review deleted.');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Failed to delete review.');
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setChangingPass(true);
    setAuthError(null);
    try {
      const res = await api.changeAdminPassword(token, currPass, newPass);
      sessionStorage.setItem(TOKEN_STORAGE_KEY, res.token);
      setToken(res.token);
      setCurrPass('');
      setNewPass('');
      showToast(res.message);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Could not change password.');
    } finally {
      setChangingPass(false);
    }
  };

  if (statusLoading) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-6 h-6 animate-spin text-[#0B1B36]" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-[75vh] bg-[#F8FAFC] flex items-center justify-center px-4 py-14">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-7 sm:p-8 shadow-xs">
          <div className="w-11 h-11 rounded-lg bg-[#0B1B36] flex items-center justify-center mb-4">
            <Shield className="w-5 h-5 text-[#DFB85A]" />
          </div>
          <h1 className="font-display font-bold text-2xl text-[#0B1B36] mb-1.5">
            TRINETRA Admin Panel
          </h1>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            Sign in to control products, prices, store orders, promo offers, logos, brand partners,
            contact details, enquiries, and reviews.
          </p>

          {authError && (
            <div
              role="alert"
              className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-800"
            >
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="admin-pass" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Admin Password
              </label>
              <input
                id="admin-pass"
                type="password"
                required
                value={passcodeInput}
                onChange={(e) => setPasscodeInput(e.target.value)}
                placeholder="Enter admin password"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white"
              />
            </div>
            <button
              type="submit"
              disabled={authSubmitting}
              className="w-full py-3 px-4 rounded-lg bg-[#0B1B36] text-white text-sm font-semibold hover:bg-[#13294E] disabled:opacity-60 transition-colors cursor-pointer"
            >
              {authSubmitting ? 'Verifying...' : 'Sign In to Control Center'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F8FAFC] min-h-[85vh]">
      <section className="bg-[#0B1B36] text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[#DFB85A] mb-1">
              Full Website &amp; E-Commerce Control Center
            </p>
            <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-tight">
              TRINETRA Admin Dashboard
            </h1>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/25 text-xs font-semibold text-white hover:bg-white/10 self-start sm:self-auto cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-[#DFB85A]" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Live Executive Summary Strip */}
        {analytics && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pt-6 border-t border-white/12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <p className="text-xs text-slate-300">Store Orders</p>
              <p className="font-mono tabular-nums text-xl font-bold text-white">
                {analytics.totalOrders}
              </p>
              <p className="text-[11px] text-[#DFB85A]">{analytics.pendingOrders} pending</p>
            </div>
            <div>
              <p className="text-xs text-slate-300">Order Value</p>
              <p className="font-mono tabular-nums text-xl font-bold text-[#DFB85A]">
                ₹{analytics.confirmedRevenueInr.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-slate-400">Active orders</p>
            </div>
            <div>
              <p className="text-xs text-slate-300">Products</p>
              <p className="font-mono tabular-nums text-xl font-bold text-white">
                {analytics.totalProducts}
              </p>
              <p className="text-[11px] text-slate-400">{analytics.pricedProducts} online priced</p>
            </div>
            <div>
              <p className="text-xs text-slate-300">Active Offers</p>
              <p className="font-mono tabular-nums text-xl font-bold text-white">
                {analytics.activeOffers}
              </p>
              <p className="text-[11px] text-slate-400">Live coupons</p>
            </div>
            <div>
              <p className="text-xs text-slate-300">Enquiries</p>
              <p className="font-mono tabular-nums text-xl font-bold text-white">
                {analytics.totalEnquiries}
              </p>
              <p className="text-[11px] text-[#DFB85A]">{analytics.newEnquiries} new</p>
            </div>
            <div>
              <p className="text-xs text-slate-300">Client Reviews</p>
              <p className="font-mono tabular-nums text-xl font-bold text-white">
                {reviews.length}
              </p>
              <p className="text-[11px] text-slate-400">{analytics.pendingReviews} awaiting</p>
            </div>
          </div>
        )}
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {toast && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{toast}</span>
          </div>
        )}
        {authError && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-800"
          >
            {authError}
          </div>
        )}

        {/* Admin Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg mb-8 w-fit">
          {(
            [
              {
                id: 'packages',
                label: `HD & IP Packages${
                  analytics?.totalPackageQuotations
                    ? ` (${analytics.totalPackageQuotations} Quotes)`
                    : ''
                }`,
              },
              { id: 'orders', label: `Store Orders (${orders.length})` },
              { id: 'products', label: `Products & Prices (${products.length})` },
              { id: 'offers', label: `Offers & Coupons (${offers.length})` },
              { id: 'branding', label: 'Logos & Brands' },
              { id: 'contact', label: 'Contact & Store Settings' },
              { id: 'enquiries', label: `Enquiries (${enquiries.length})` },
              { id: 'reviews', label: 'Reviews & Security' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === t.id
                  ? 'bg-white text-[#0B1B36] shadow-xs'
                  : 'text-slate-600 hover:text-[#0B1B36]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB 0: HD & IP PACKAGES CONTROL HUB */}
        {activeTab === 'packages' && (
          <AdminPackagesPanel token={token} onNotify={showToast} />
        )}

        {/* TAB 1: STORE ORDERS */}
        {activeTab === 'orders' && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-display font-bold text-base text-[#0B1B36]">
                Incoming E-Commerce Store Orders
              </h2>
              <span className="text-xs text-slate-500">
                Status updates reflect immediately on customer Order Tracker
              </span>
            </div>
            {orders.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-600">
                No store orders placed yet. Orders completed from the Cart Drawer appear here with
                itemized pricing, delivery address, and payment method.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-5 flex flex-col lg:flex-row lg:items-start justify-between gap-5"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono font-bold text-[#0B1B36]">{ord.id}</span>
                        <span>·</span>
                        <span>{new Date(ord.createdAt).toLocaleString('en-IN')}</span>
                        <span>·</span>
                        <span className="font-semibold text-[#9E7216]">
                          {ord.paymentMethod.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-base text-[#0B1B36]">
                        {ord.customerName} —{' '}
                        <span className="font-mono tabular-nums">
                          ₹{ord.totalInr.toLocaleString('en-IN')}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-600">
                        <span className="font-mono">{ord.phone}</span> · {ord.address}, {ord.city},{' '}
                        {ord.state} — {ord.pincode}
                      </p>
                      {(ord.gstin || ord.gstCompanyName) && (
                        <p className="text-xs font-medium text-[#0B1B36]">
                          GST Invoice Requested:{' '}
                          <span className="font-mono font-semibold">{ord.gstin || '—'}</span>
                          {ord.gstCompanyName ? ` · ${ord.gstCompanyName}` : ''}
                        </p>
                      )}
                      <ul className="pt-2 space-y-1 text-xs text-slate-700">
                        {ord.items.map((li) => (
                          <li key={li.productId}>
                            • {li.brand} {li.name} × {li.quantity} (₹
                            {li.lineTotalInr.toLocaleString('en-IN')})
                          </li>
                        ))}
                        {(ord.packageBundles ?? []).map((pkg) => (
                          <li key={pkg.bundleId} className="pt-1 font-medium text-[#0B1B36]">
                            • [CUSTOM PACKAGE] {pkg.label} — Hardware ₹
                            {pkg.productSubtotalInr.toLocaleString('en-IN')} + Install ₹
                            {pkg.installationTotalInr.toLocaleString('en-IN')} ({pkg.items.length}{' '}
                            components)
                          </li>
                        ))}
                        {ord.includeInstallation && (
                          <li className="text-[#9E7216] font-medium">
                            + Includes On-Site Installation (₹
                            {ord.installationFeeInr.toLocaleString('en-IN')})
                          </li>
                        )}
                        {ord.couponCode && (
                          <li className="text-emerald-700 font-medium">
                            Offer Applied: {ord.couponCode} (-₹
                            {ord.discountInr.toLocaleString('en-IN')})
                          </li>
                        )}
                      </ul>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <a
                        href={formatWhatsAppUrl(
                          ord.phone,
                          `Hello ${ord.customerName}, this is ${settings.businessName} regarding your Order ${ord.id} (Status: ${ord.status.toUpperCase()}).`,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-[#0B1B36] hover:bg-slate-50"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-[#9E7216]" />
                        <span>WhatsApp</span>
                      </a>
                      <select
                        value={ord.status}
                        onChange={(e) => handleOrderStatus(ord.id, e.target.value as OrderStatus)}
                        aria-label={`Order status for ${ord.id}`}
                        className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-[#0B1B36]"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="dispatched">Dispatched</option>
                        <option value="installed">Installed</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PRODUCTS & PRICES */}
        {activeTab === 'products' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <form
              onSubmit={handleSaveProduct}
              className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-lg text-[#0B1B36]">
                  {editingProdId ? 'Edit Product & Price' : 'Add New Product'}
                </h2>
                {editingProdId && (
                  <button
                    type="button"
                    onClick={resetProductForm}
                    className="text-xs font-semibold text-slate-500 hover:text-[#0B1B36] cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  placeholder="e.g. Hikvision 4MP ColorVu Bullet Camera"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={pCategory}
                    onChange={(e) => setPCategory(e.target.value as ProductCategory)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                  >
                    {PRODUCT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Brand *</label>
                  <select
                    value={pBrand}
                    onChange={(e) => setPBrand(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                  >
                    {brands.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Model *</label>
                  <input
                    type="text"
                    required
                    value={pModel}
                    onChange={(e) => setPModel(e.target.value)}
                    placeholder="e.g. DS-2CE10DF3T"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Availability
                  </label>
                  <select
                    value={pAvailability}
                    onChange={(e) => setPAvailability(e.target.value as AvailabilityStatus)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                  >
                    <option value="In Stock">In Stock</option>
                    <option value="Confirm via Enquiry">Confirm via Enquiry</option>
                    <option value="Made to Order">Made to Order</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    MRP (₹) (Optional)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={pMrp}
                    onChange={(e) => setPMrp(e.target.value)}
                    placeholder="Strikethrough MRP"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Selling Price (₹) (blank = On Request)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={pPrice}
                    onChange={(e) => setPPrice(e.target.value)}
                    placeholder="Store Price"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Warranty</label>
                <input
                  type="text"
                  value={pWarranty}
                  onChange={(e) => setPWarranty(e.target.value)}
                  placeholder="e.g. 2 Years Manufacturer Warranty"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                />
              </div>

              {/* Product Photo Upload or Preset */}
              <div className="space-y-2 p-3.5 rounded-lg bg-[#F8FAFC] border border-slate-200">
                <label className="block text-xs font-semibold text-slate-700">
                  Product Image (Upload Photo or Choose Preset)
                </label>
                <div className="flex items-center gap-3">
                  <img
                    src={pImageUrl}
                    alt="Product preview"
                    className="w-14 h-12 rounded object-cover border border-slate-200 bg-white shrink-0"
                  />
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-[#0B1B36] hover:border-[#0B1B36] cursor-pointer">
                    <ImagePlus className="w-3.5 h-3.5 text-[#9E7216]" />
                    <span>
                      {uploadingField === 'product' ? 'Uploading...' : 'Upload Photo'}
                    </span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => void handleUploadFile(e, 'product', setPImageUrl)}
                    />
                  </label>
                </div>
                <select
                  value={IMAGE_PRESETS.some((x) => x.url === pImageUrl) ? pImageUrl : ''}
                  onChange={(e) => {
                    if (e.target.value) setPImageUrl(e.target.value);
                  }}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                >
                  <option value="">Or select built-in studio preset...</option>
                  {IMAGE_PRESETS.map((preset) => (
                    <option key={preset.url} value={preset.url}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description *
                </label>
                <textarea
                  rows={3}
                  required
                  value={pDesc}
                  onChange={(e) => setPDesc(e.target.value)}
                  placeholder="Resolution, night vision range, weather rating, specs..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pFeatured}
                  onChange={(e) => setPFeatured(e.target.checked)}
                />
                <span>Show in Featured Products on Homepage</span>
              </label>

              <button
                type="submit"
                disabled={savingProduct}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#0B1B36] text-white text-sm font-semibold hover:bg-[#13294E] disabled:opacity-60 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#DFB85A]" />
                <span>{editingProdId ? 'Update Product Live' : 'Add Product to Store'}</span>
              </button>
            </form>

            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                <h2 className="font-display font-bold text-base text-[#0B1B36]">
                  All Store Products ({products.length})
                </h2>
                <span className="text-xs text-slate-500">Instant live price &amp; stock control</span>
              </div>
              <div className="divide-y divide-slate-100 max-h-[720px] overflow-y-auto">
                {products.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-14 h-12 rounded-md object-cover bg-slate-100 border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500 truncate">
                          <strong className="text-[#0B1B36]">{item.brand}</strong> · {item.category}{' '}
                          · <span className="font-mono">{item.model}</span>
                        </p>
                        <p className="font-display font-semibold text-sm text-[#0B1B36] truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-slate-600 font-mono tabular-nums mt-0.5">
                          {item.priceInr !== null
                            ? `₹${item.priceInr.toLocaleString('en-IN')}`
                            : 'Price on Request'}
                          {item.mrpInr ? ` (MRP ₹${item.mrpInr.toLocaleString('en-IN')})` : ''} ·{' '}
                          {item.availability}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEditProduct(item)}
                        className="px-3 py-1.5 rounded-md border border-slate-300 text-xs font-semibold text-[#0B1B36] hover:bg-slate-100 cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(item.id)}
                        aria-label={`Delete ${item.name}`}
                        className="p-1.5 rounded-md text-slate-400 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: OFFERS & COUPONS */}
        {activeTab === 'offers' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <form
              onSubmit={handleSaveOffer}
              className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-lg text-[#0B1B36]">
                  {editingOfferId ? 'Edit Offer / Coupon' : 'Create Store Offer & Coupon'}
                </h2>
                {editingOfferId && (
                  <button
                    type="button"
                    onClick={resetOfferForm}
                    className="text-xs font-semibold text-slate-500 cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Offer Headline *
                </label>
                <input
                  type="text"
                  required
                  value={oTitle}
                  onChange={(e) => setOTitle(e.target.value)}
                  placeholder="e.g. Sankranti Special — Flat ₹1,000 Off"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={oCode}
                    onChange={(e) => setOCode(e.target.value.toUpperCase())}
                    placeholder="e.g. FEST1000"
                    className="w-full px-3 py-2 text-sm font-mono uppercase rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Valid Until
                  </label>
                  <input
                    type="date"
                    value={oValidUntil}
                    onChange={(e) => setOValidUntil(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
                  <select
                    value={oType}
                    onChange={(e) => setOType(e.target.value as 'percent' | 'flat')}
                    className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-300"
                  >
                    <option value="flat">Flat ₹</option>
                    <option value="percent">Percent %</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Discount *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={oValue}
                    onChange={(e) => setOValue(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Min Order ₹
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={oMinOrder}
                    onChange={(e) => setOMinOrder(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Offer Description *
                </label>
                <textarea
                  rows={2}
                  required
                  value={oDesc}
                  onChange={(e) => setODesc(e.target.value)}
                  placeholder="Short terms shown on Store page"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={oActive}
                    onChange={(e) => setOActive(e.target.checked)}
                  />
                  <span>Active (Usable in Store Cart Checkout)</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={oBanner}
                    onChange={(e) => setOBanner(e.target.checked)}
                  />
                  <span>Show in Top Announcement Banner across Website</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={savingOffer}
                className="w-full py-2.5 px-4 rounded-lg bg-[#0B1B36] text-white text-sm font-semibold hover:bg-[#13294E] disabled:opacity-60 cursor-pointer"
              >
                {editingOfferId ? 'Update Offer' : 'Publish Offer'}
              </button>
            </form>

            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200">
                <h2 className="font-display font-bold text-base text-[#0B1B36]">
                  All Promotional Offers ({offers.length})
                </h2>
              </div>
              <div className="divide-y divide-slate-100">
                {offers.map((o) => (
                  <div
                    key={o.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-xs text-slate-500">
                        <strong className="font-mono text-[#0B1B36]">{o.code}</strong> ·{' '}
                        {o.discountType === 'flat' ? `₹${o.discountValue} Off` : `${o.discountValue}% Off`}{' '}
                        · Min ₹{o.minOrderInr.toLocaleString('en-IN')} ·{' '}
                        <span className={o.active ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
                          {o.active ? 'Active' : 'Paused'}
                        </span>
                        {o.showInBanner ? ' · Top Banner' : ''}
                      </p>
                      <p className="font-display font-semibold text-sm text-[#0B1B36] mt-0.5">
                        {o.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEditOffer(o)}
                        className="px-3 py-1.5 rounded-md border border-slate-300 text-xs font-semibold text-[#0B1B36] cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteOffer(o.id)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-rose-700 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: LOGOS, HERO TEXT & BRAND PARTNERS */}
        {activeTab === 'branding' && (
          <div className="space-y-8">
            {/* Website Logo & Hero Text */}
            <form
              onSubmit={saveAllSettings}
              className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 space-y-5"
            >
              <div>
                <h2 className="font-display font-bold text-lg text-[#0B1B36]">
                  Website Logo &amp; Homepage Hero Identity
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Upload your custom company logo image or edit your main hero headline anytime.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-[#F8FAFC] border border-slate-200">
                {sLogoUrl ? (
                  <img
                    src={sLogoUrl}
                    alt="Current website logo"
                    className="h-12 w-auto max-w-[160px] object-contain bg-white p-1.5 rounded border border-slate-200"
                  />
                ) : (
                  <div className="h-12 px-4 rounded bg-[#0B1B36] text-[#DFB85A] flex items-center text-xs font-display font-bold">
                    Default TRINETRA Geometric Emblem
                  </div>
                )}

                <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0B1B36] text-white text-xs font-semibold hover:bg-[#13294E] cursor-pointer">
                  <ImagePlus className="w-4 h-4 text-[#DFB85A]" />
                  <span>
                    {uploadingField === 'logo' ? 'Uploading Logo...' : 'Upload Custom Logo'}
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => void handleUploadFile(e, 'logo', setSLogoUrl)}
                  />
                </label>

                {sLogoUrl && (
                  <button
                    type="button"
                    onClick={() => setSLogoUrl('')}
                    className="px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    Revert to Default Emblem
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hero Top Kicker Text
                  </label>
                  <input
                    type="text"
                    required
                    value={sHeroBadge}
                    onChange={(e) => setSHeroBadge(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hero Main Headline
                  </label>
                  <input
                    type="text"
                    required
                    value={sHeroHeadline}
                    onChange={(e) => setSHeroHeadline(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hero Subtitle Description
                </label>
                <textarea
                  rows={2}
                  required
                  value={sHeroSubtitle}
                  onChange={(e) => setSHeroSubtitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300"
                />
              </div>

              <button
                type="submit"
                disabled={savingSettings}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#0B1B36] text-white text-sm font-semibold hover:bg-[#13294E] cursor-pointer"
              >
                <Save className="w-4 h-4 text-[#DFB85A]" />
                <span>{savingSettings ? 'Saving...' : 'Save Logo & Hero Changes'}</span>
              </button>
            </form>

            {/* Brand Partners Marquee Manager */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <form
                onSubmit={handleSaveBrand}
                className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-base text-[#0B1B36]">
                    {editingBrandId ? 'Edit Brand Partner' : 'Add Brand Partner Logo'}
                  </h3>
                  {editingBrandId && (
                    <button
                      type="button"
                      onClick={resetBrandForm}
                      className="text-xs text-slate-500 cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={bName}
                    onChange={(e) => setBName(e.target.value)}
                    placeholder="e.g. Hikvision, Dahua, CP Plus"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Short Monogram
                    </label>
                    <input
                      type="text"
                      value={bShort}
                      onChange={(e) => setBShort(e.target.value.toUpperCase())}
                      placeholder="e.g. HK"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Accent Color
                    </label>
                    <input
                      type="color"
                      value={bColor}
                      onChange={(e) => setBColor(e.target.value)}
                      className="w-full h-10 rounded-lg border border-slate-300 p-1 cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Specialty Line *
                  </label>
                  <input
                    type="text"
                    required
                    value={bNote}
                    onChange={(e) => setBNote(e.target.value)}
                    placeholder="e.g. IP Cameras & Recorders"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                  />
                </div>

                <div className="flex items-center gap-3">
                  {bLogoUrl && (
                    <img
                      src={bLogoUrl}
                      alt="Brand logo preview"
                      className="w-10 h-10 object-contain rounded border border-slate-200 p-1"
                    />
                  )}
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-[#0B1B36] cursor-pointer">
                    <ImagePlus className="w-3.5 h-3.5 text-[#9E7216]" />
                    <span>
                      {uploadingField === 'brand' ? 'Uploading...' : 'Upload Brand Logo (Optional)'}
                    </span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => void handleUploadFile(e, 'brand', setBLogoUrl)}
                    />
                  </label>
                  {bLogoUrl && (
                    <button
                      type="button"
                      onClick={() => setBLogoUrl('')}
                      className="text-xs text-rose-700 underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bActive}
                    onChange={(e) => setBActive(e.target.checked)}
                  />
                  <span>Display in Scrolling Brand Ticker</span>
                </label>

                <button
                  type="submit"
                  disabled={savingBrand}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#0B1B36] text-white text-sm font-semibold hover:bg-[#13294E] cursor-pointer"
                >
                  {editingBrandId ? 'Update Brand Partner' : 'Add Brand Partner'}
                </button>
              </form>

              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200">
                  <h3 className="font-display font-bold text-base text-[#0B1B36]">
                    Brand Partners in Ticker ({brands.length})
                  </h3>
                </div>
                <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                  {brands.map((b) => (
                    <div
                      key={b.id}
                      className="p-4 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {b.logoUrl ? (
                          <img
                            src={b.logoUrl}
                            alt={b.name}
                            className="w-9 h-9 rounded object-contain border border-slate-200 p-1 shrink-0"
                          />
                        ) : (
                          <span
                            className="w-9 h-9 rounded flex items-center justify-center text-xs font-bold text-white shrink-0"
                            style={{ backgroundColor: b.accentHex }}
                          >
                            {b.shortMark.slice(0, 2)}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="font-display font-semibold text-sm text-[#0B1B36] truncate">
                            {b.name}
                          </p>
                          <p className="text-xs text-slate-500 truncate">{b.categoryNote}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => startEditBrand(b)}
                          className="px-3 py-1.5 rounded-md border border-slate-300 text-xs font-semibold text-[#0B1B36] cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBrand(b.id)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-rose-700 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: CONTACT, STORE & MAP SETTINGS */}
        {activeTab === 'contact' && (
          <form
            onSubmit={saveAllSettings}
            className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 max-w-3xl space-y-5"
          >
            <div>
              <h2 className="font-display font-bold text-lg text-[#0B1B36]">
                Business Contact, Store Fees &amp; Google Map Coordinates
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Every field saved here immediately updates Call Now, WhatsApp links, Footer,
                Checkout totals, Google Maps pin, and LocalBusiness SEO schema.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Business Name
                </label>
                <input
                  type="text"
                  required
                  value={sBusinessName}
                  onChange={(e) => setSBusinessName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Official Domain URL
                </label>
                <input
                  type="url"
                  required
                  value={sDomain}
                  onChange={(e) => setSDomain(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Primary Phone
                </label>
                <input
                  type="text"
                  required
                  value={sPhone}
                  onChange={(e) => setSPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  WhatsApp Number
                </label>
                <input
                  type="text"
                  required
                  value={sWhatsapp}
                  onChange={(e) => setSWhatsapp(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Business Email
                </label>
                <input
                  type="email"
                  required
                  value={sEmail}
                  onChange={(e) => setSEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Registered Office Address
              </label>
              <input
                type="text"
                required
                value={sAddress}
                onChange={(e) => setSAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Free Delivery Above (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={sFreeDelivery}
                  onChange={(e) => setSFreeDelivery(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm font-mono rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Store Installation Add-On (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={sInstallFee}
                  onChange={(e) => setSInstallFee(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm font-mono rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Business UPI ID
                </label>
                <input
                  type="text"
                  value={sUpiId}
                  onChange={(e) => setSUpiId(e.target.value)}
                  placeholder="yourname@upi"
                  className="w-full px-3.5 py-2.5 text-sm font-mono rounded-lg border border-slate-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Business Hours
                </label>
                <input
                  type="text"
                  required
                  value={sHours}
                  onChange={(e) => setSHours(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Google Map Pin Name
                </label>
                <input
                  type="text"
                  required
                  value={sOfficeName}
                  onChange={(e) => setSOfficeName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Office Latitude
                </label>
                <input
                  type="text"
                  required
                  value={sLat}
                  onChange={(e) => setSLat(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Office Longitude
                </label>
                <input
                  type="text"
                  required
                  value={sLng}
                  onChange={(e) => setSLng(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#0B1B36] text-white text-sm font-semibold hover:bg-[#13294E] disabled:opacity-60 cursor-pointer"
            >
              {savingSettings ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4 text-[#DFB85A]" />
              )}
              <span>{savingSettings ? 'Saving...' : 'Save All Settings'}</span>
            </button>
          </form>
        )}

        {/* TAB 6: CUSTOMER ENQUIRIES */}
        {activeTab === 'enquiries' && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="font-display font-bold text-base text-[#0B1B36]">
                Incoming Quotation, Service &amp; CCTV Planner Enquiries
              </h2>
            </div>
            {enquiries.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-600">
                No enquiries submitted yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {enquiries.map((enq) => (
                  <div
                    key={enq.id}
                    className="p-5 flex flex-col lg:flex-row lg:items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono font-semibold text-[#0B1B36]">{enq.id}</span>
                        <span>·</span>
                        <span>{new Date(enq.createdAt).toLocaleString('en-IN')}</span>
                        <span>·</span>
                        <span>
                          {enq.city}, {enq.state}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-base text-[#0B1B36]">
                        {enq.name} — {enq.subject}
                      </h3>
                      <p className="text-xs font-mono text-slate-700">
                        {enq.phone} {enq.email ? `· ${enq.email}` : ''}{' '}
                        {enq.cameraCount ? `· ${enq.cameraCount}` : ''}
                      </p>
                      <p className="text-sm text-slate-600 pt-1 whitespace-pre-line">
                        {enq.message}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={enq.status}
                        onChange={(e) =>
                          handleEnquiryStatus(enq.id, e.target.value as EnquiryStatus)
                        }
                        aria-label={`Status for ${enq.id}`}
                        className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-[#0B1B36]"
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="quoted">Quoted</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 7: REVIEWS MODERATION & ADMIN PASSWORD SECURITY */}
        {activeTab === 'reviews' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="font-display font-bold text-base text-[#0B1B36]">
                  Client Reviews Verification Queue ({reviews.length})
                </h2>
              </div>
              {reviews.length === 0 ? (
                <div className="p-10 text-center text-sm text-slate-600">
                  No client feedback submitted yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                    >
                      <div>
                        <p className="text-xs text-slate-500">
                          <strong className="text-[#0B1B36]">{rev.clientName}</strong>
                          {rev.organization ? ` · ${rev.organization}` : ''} · {rev.city},{' '}
                          {rev.state}
                        </p>
                        <p className="text-sm text-slate-700 mt-1.5">“{rev.feedback}”</p>
                        <p className="text-xs font-medium mt-2 text-slate-500">
                          Status:{' '}
                          <span
                            className={
                              rev.status === 'approved'
                                ? 'text-emerald-700 font-semibold'
                                : 'text-amber-700 font-semibold'
                            }
                          >
                            {rev.status === 'approved' ? 'Published Live' : 'Pending Verification'}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            handleReviewStatus(
                              rev.id,
                              rev.status === 'approved' ? 'pending' : 'approved',
                            )
                          }
                          className="px-3.5 py-2 rounded-lg bg-[#0B1B36] text-white text-xs font-semibold hover:bg-[#13294E] cursor-pointer"
                        >
                          {rev.status === 'approved' ? 'Unpublish' : 'Approve'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteReview(rev.id)}
                          aria-label="Delete review"
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-700 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form
              onSubmit={handleChangePassword}
              className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4"
            >
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#9E7216]" />
                <h2 className="font-display font-bold text-base text-[#0B1B36]">
                  Change Admin Login Password
                </h2>
              </div>
              <p className="text-xs text-slate-600">
                Your password is stored as a salted scrypt cryptographic hash on the server.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Password *
                </label>
                <input
                  type="password"
                  required
                  value={currPass}
                  onChange={(e) => setCurrPass(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Password (min 6 characters) *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                />
              </div>

              <button
                type="submit"
                disabled={changingPass}
                className="w-full py-2.5 px-4 rounded-lg bg-[#0B1B36] text-white text-sm font-semibold hover:bg-[#13294E] disabled:opacity-60 cursor-pointer"
              >
                {changingPass ? 'Updating...' : 'Update Admin Password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
