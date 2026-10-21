"use client"
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  type: string;
  imageUrl?: string | null;
}

export interface AppliedCoupon {
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  discountAmount: number;
  minOrderAmount?: number;
}

interface CartState {
  items: CartItem[];
  appliedCoupon: AppliedCoupon | null;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (coupon: AppliedCoupon | null) => void;
  totalItems: () => number;
  totalPrice: () => number;
  discountAmount: () => number;
  grandTotal: () => number;
}

const dummyStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      appliedCoupon: null,
      addItem: (item) => {
        const { items } = get();
        const existing = items.find((i) => i.productId === item.productId);
        if (existing) {
          set({
            items: items.map((i) => 
              i.productId === item.productId ? { ...i, quantity: i.quantity + item.quantity } : i
            )
          });
        } else {
          set({ items: [...items, item] });
        }
      },
      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) });
      },
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          )
        });
      },
      clearCart: () => set({ items: [], appliedCoupon: null }),
      applyCoupon: (coupon) => set({ appliedCoupon: coupon }),
      totalItems: () => get().items.reduce((acc, item) => acc + item.quantity, 0),
      totalPrice: () => get().items.reduce((acc, item) => acc + (item.price * item.quantity), 0),
      discountAmount: () => {
        const coupon = get().appliedCoupon;
        if (!coupon) return 0;
        const subtotal = get().totalPrice();
        if (coupon.type === 'PERCENTAGE') {
          return Math.round((subtotal * coupon.value) / 100);
        }
        return Math.min(coupon.value, subtotal);
      },
      grandTotal: () => {
        const subtotal = get().totalPrice();
        const discount = get().discountAmount();
        return Math.max(0, subtotal - discount);
      },
    }),
    {
      name: 'businessos_cart',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? window.localStorage : dummyStorage)),
    }
  )
);
