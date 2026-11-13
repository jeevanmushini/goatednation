import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartItem, CouponDiscount } from '../types/cart';
import { COUPONS } from '../data/products';

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  appliedCoupon: CouponDiscount | null;
  couponError: string | null;

  // Actions
  addItem: (item: Omit<CartItem, 'id'>, openDrawer?: boolean) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  setQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;

  // Computed values
  getSubtotal: () => number;
  getDiscount: () => number;
  getShipping: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      appliedCoupon: null,
      couponError: null,

      addItem: (item, openDrawer = true) => {
        const id = `${item.productId}-${item.size}-${item.color}`;
        const existingIndex = get().items.findIndex((i) => i.id === id);

        if (existingIndex > -1) {
          const updatedItems = [...get().items];
          updatedItems[existingIndex].quantity += item.quantity;
          set({ items: updatedItems, isOpen: openDrawer ? true : get().isOpen });
        } else {
          set({
            items: [...get().items, { ...item, id }],
            isOpen: openDrawer ? true : get().isOpen,
          });
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) });
      },

      updateQuantity: (id, delta) => {
        const updatedItems = get().items
          .map((item) => {
            if (item.id === id) {
              const newQuantity = item.quantity + delta;
              return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
            }
            return item;
          })
          .filter(Boolean) as CartItem[];

        set({ items: updatedItems });
      },

      setQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        const updatedItems = get().items.map((item) =>
          item.id === id ? { ...item, quantity } : item
        );
        set({ items: updatedItems });
      },

      clearCart: () => set({ items: [], appliedCoupon: null }),

      openDrawer: () => set({ isOpen: true }),
      closeDrawer: () => set({ isOpen: false }),
      toggleDrawer: () => set({ isOpen: !get().isOpen }),

      applyCoupon: (code: string) => {
        const normalized = code.trim().toUpperCase();
        const found = COUPONS.find((c) => c.code === normalized);

        if (found) {
          set({ appliedCoupon: found, couponError: null });
          return true;
        } else {
          set({ couponError: 'Invalid coupon code. Try WELCOME10 or CULT15' });
          return false;
        }
      },

      removeCoupon: () => set({ appliedCoupon: null, couponError: null }),

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },

      getDiscount: () => {
        const subtotal = get().getSubtotal();
        const coupon = get().appliedCoupon;
        if (!coupon) return 0;
        return Math.round((subtotal * coupon.discountPercentage) / 100);
      },

      getShipping: () => {
        const subtotal = get().getSubtotal();
        if (subtotal === 0) return 0;
        // Free shipping on orders over ₹999
        return subtotal >= 999 ? 0 : 99;
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        if (subtotal === 0) return 0;
        const discount = get().getDiscount();
        const shipping = get().getShipping();
        return Math.max(0, subtotal - discount + shipping);
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: 'goatednation-cart-storage',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      })),
      partialize: (state) => ({
        items: state.items,
        appliedCoupon: state.appliedCoupon,
      }),
    }
  )
);
