import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { CartPackageBundle, ProductItem } from '../types.ts';

export interface CartEntry {
  product: ProductItem;
  quantity: number;
}

const CART_STORAGE_KEY = 'trinetra_store_cart_v1';
const PKG_CART_STORAGE_KEY = 'trinetra_package_cart_v1';

interface CartContextValue {
  items: CartEntry[];
  packageBundles: CartPackageBundle[];
  drawerOpen: boolean;
  totalCount: number;
  storeSubtotalInr: number;
  packageHardwareSubtotalInr: number;
  packageInstallTotalInr: number;
  packageDiscountTotalInr: number;
  packageTaxTotalInr: number;
  subtotalInr: number;
  lastAddedName: string | null;
  openDrawer: () => void;
  closeDrawer: () => void;
  addToCart: (product: ProductItem, quantity?: number) => void;
  addPackageToCart: (bundle: Omit<CartPackageBundle, 'id' | 'addedAt'>) => void;
  removePackageFromCart: (bundleId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartEntry[]>(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as CartEntry[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [packageBundles, setPackageBundles] = useState<CartPackageBundle[]>(() => {
    try {
      const raw = localStorage.getItem(PKG_CART_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as CartPackageBundle[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [lastAddedName, setLastAddedName] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage quota errors
    }
  }, [items]);

  useEffect(() => {
    try {
      localStorage.setItem(PKG_CART_STORAGE_KEY, JSON.stringify(packageBundles));
    } catch {
      // Ignore storage quota errors
    }
  }, [packageBundles]);

  const addToCart = useCallback((product: ProductItem, quantity = 1) => {
    if (product.priceInr === null || product.availability === 'Out of Stock') return;
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { product, quantity: Math.min(200, i.quantity + quantity) }
            : i,
        );
      }
      return [...prev, { product, quantity: Math.max(1, quantity) }];
    });
    setLastAddedName(product.name);
    setTimeout(() => setLastAddedName(null), 2600);
  }, []);

  const addPackageToCart = useCallback(
    (bundle: Omit<CartPackageBundle, 'id' | 'addedAt'>) => {
      const entry: CartPackageBundle = {
        ...bundle,
        id: `PKGB-${Date.now().toString(36).toUpperCase()}`,
        addedAt: new Date().toISOString(),
      };
      setPackageBundles((prev) => [entry, ...prev].slice(0, 10));
      setLastAddedName(bundle.label);
      setTimeout(() => setLastAddedName(null), 2600);
    },
    [],
  );

  const removePackageFromCart = useCallback((bundleId: string) => {
    setPackageBundles((prev) => prev.filter((b) => b.id !== bundleId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.product.id !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.product.id === productId ? { ...i, quantity: Math.min(200, quantity) } : i,
      ),
    );
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setPackageBundles([]);
  }, []);

  const totalCount =
    items.reduce((sum, i) => sum + i.quantity, 0) + packageBundles.length;
  const storeSubtotalInr = items.reduce(
    (sum, i) => sum + (i.product.priceInr ?? 0) * i.quantity,
    0,
  );
  const packageHardwareSubtotalInr = packageBundles.reduce(
    (sum, b) => sum + b.preview.productSubtotalInr,
    0,
  );
  const packageInstallTotalInr = packageBundles.reduce(
    (sum, b) => sum + b.preview.installationTotalInr,
    0,
  );
  const packageDiscountTotalInr = packageBundles.reduce(
    (sum, b) => sum + b.preview.discountInr,
    0,
  );
  const packageTaxTotalInr = packageBundles.reduce(
    (sum, b) => sum + b.preview.taxInr,
    0,
  );
  const subtotalInr = storeSubtotalInr + packageHardwareSubtotalInr;

  return (
    <CartContext.Provider
      value={{
        items,
        packageBundles,
        drawerOpen,
        totalCount,
        storeSubtotalInr,
        packageHardwareSubtotalInr,
        packageInstallTotalInr,
        packageDiscountTotalInr,
        packageTaxTotalInr,
        subtotalInr,
        lastAddedName,
        openDrawer: () => setDrawerOpen(true),
        closeDrawer: () => setDrawerOpen(false),
        addToCart,
        addPackageToCart,
        removePackageFromCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used inside CartProvider');
  }
  return ctx;
}
