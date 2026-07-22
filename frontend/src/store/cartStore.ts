// ============================================================
// Retail AI Portal — Cart Store (Zustand)
// Client-side cart with localStorage persistence.
// Emits ADD_TO_CART / REMOVE_FROM_CART events for future
// integration with customer event tracking.
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, CartEvent } from '../types/customer';

interface CartState {
  items: CartItem[];
  recentEvent: CartEvent | null;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getSubtotal: () => number;
  getTotalSavings: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      recentEvent: null,

      addItem: (item: CartItem) => {
        const event: CartEvent = { type: 'ADD_TO_CART', product_id: item.product_id, product_name: item.product_name };
        set((state) => {
          const existing = state.items.find((i) => i.product_id === item.product_id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.product_id === item.product_id
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
              recentEvent: event,
            };
          }
          return { items: [...state.items, { ...item, quantity: 1 }], recentEvent: event };
        });
      },

      removeItem: (productId: string) => {
        const event: CartEvent = { type: 'REMOVE_FROM_CART', product_id: productId };
        set((state) => ({
          items: state.items.filter((i) => i.product_id !== productId),
          recentEvent: event,
        }));
      },

      updateQuantity: (productId: string, quantity: number) => {
        const event: CartEvent = { type: 'UPDATE_QUANTITY', product_id: productId, quantity };
        set((state) => ({
          items: quantity <= 0
            ? state.items.filter((i) => i.product_id !== productId)
            : state.items.map((i) =>
                i.product_id === productId ? { ...i, quantity } : i
              ),
          recentEvent: event,
        }));
      },

      clearCart: () => set({ items: [], recentEvent: null }),

      getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      getSubtotal: () =>
        get().items.reduce(
          (sum, i) => sum + (i.discounted_price ?? i.price) * i.quantity,
          0
        ),

      getTotalSavings: () =>
        get().items.reduce(
          (sum, i) =>
            sum + (i.price - (i.discounted_price ?? i.price)) * i.quantity,
          0
        ),
    }),
    { name: 'retail-ai-cart' }
  )
);
