import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Product } from '../api/marketplace';

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  priceTzs: number;
  unit: string;
  imageUrl: string | null;
  sellerId: string;
  sellerName: string;
  quantity: number;
  available: number;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotalTzs: number;
  add: (product: Product, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const STORAGE_KEY = 'sokolink.cart.v1';
const CartContext = createContext<CartContextValue | null>(null);

function load(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        item &&
        typeof item.productId === 'string' &&
        typeof item.quantity === 'number' &&
        item.quantity > 0,
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const add = useCallback((product: Product, quantity = 1) => {
    setItems((current) => {
      const available = product.stock?.available ?? 0;
      if (available <= 0) return current;
      const existing = current.find((item) => item.productId === product.id);
      const nextQuantity = Math.min((existing?.quantity ?? 0) + quantity, available);
      const entry: CartItem = {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        priceTzs: product.priceTzs,
        unit: product.unit,
        imageUrl: product.images[0]?.url ?? null,
        sellerId: product.seller.id,
        sellerName: product.seller.name,
        quantity: nextQuantity,
        available,
      };
      if (existing) {
        return current.map((item) => (item.productId === product.id ? entry : item));
      }
      return [...current, entry];
    });
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setItems((current) =>
      quantity <= 0
        ? current.filter((item) => item.productId !== productId)
        : current.map((item) =>
            item.productId === productId
              ? { ...item, quantity: Math.min(quantity, item.available) }
              : item,
          ),
    );
  }, []);

  const remove = useCallback((productId: string) => {
    setItems((current) => current.filter((item) => item.productId !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotalTzs = items.reduce((sum, item) => sum + item.priceTzs * item.quantity, 0);
    return { items, count, subtotalTzs, add, setQuantity, remove, clear };
  }, [items, add, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used inside CartProvider');
  }
  return context;
}
