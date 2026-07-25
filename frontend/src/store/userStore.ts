// ============================================================
// Retail AI Portal — User & Session Context Store (Zustand)
// Manages the active switcher customer and current session
// context tracking (views, searches, cart items) passed into
// recommendation requests for instant responsiveness.
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Customer } from '../types/customer';
import { logCustomerEvent } from '../api/customerApi';

interface UserState {
  activeCustomer: Customer;
  sessionContext: {
    recent_searches: string[];
    recent_views: string[];
    cart_product_ids: string[];
  };
  setActiveCustomer: (customer: Customer) => void;
  addSearchEvent: (query: string) => void;
  addViewEvent: (productId: string) => void;
  setCartItems: (productIds: string[]) => void;
  clearActivityHistory: () => void;
  clearSessionContext: () => void;
}

const DEFAULT_CUSTOMER: Customer = {
  customer_id: 'CUST-FRANK-001',
  customer_name: 'Frank',
  persona_label: 'Tech Enthusiast',
  city: 'Bengaluru',
  avatar_url: '',
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      activeCustomer: DEFAULT_CUSTOMER,
      sessionContext: {
        recent_searches: [],
        recent_views: [],
        cart_product_ids: [],
      },

      setActiveCustomer: (customer: Customer) => {
        set({
          activeCustomer: customer,
          sessionContext: {
            recent_searches: [],
            recent_views: [],
            cart_product_ids: [],
          }
        });
      },

      addSearchEvent: (query: string) => {
        const customerId = get().activeCustomer.customer_id;
        
        // Log to backend event store
        logCustomerEvent(customerId, 'SEARCH', undefined, query);
        
        set((state) => {
          const searches = [query, ...state.sessionContext.recent_searches.filter(q => q !== query)].slice(0, 10);
          return {
            sessionContext: {
              ...state.sessionContext,
              recent_searches: searches
            }
          };
        });
      },

      addViewEvent: (productId: string) => {
        const customerId = get().activeCustomer.customer_id;
        
        // Log to backend event store
        logCustomerEvent(customerId, 'PRODUCT_VIEW', productId);
        
        set((state) => {
          const views = [productId, ...state.sessionContext.recent_views.filter(id => id !== productId)].slice(0, 10);
          return {
            sessionContext: {
              ...state.sessionContext,
              recent_views: views
            }
          };
        });
      },

      setCartItems: (productIds: string[]) => {
        set((state) => ({
          sessionContext: {
            ...state.sessionContext,
            cart_product_ids: productIds
          }
        }));
      },

      clearActivityHistory: () => {
        const customerId = get().activeCustomer.customer_id;
        import('../api/customerApi').then(m => m.clearCustomerHistory(customerId)).catch(() => {});
        set((state) => ({
          sessionContext: {
            ...state.sessionContext,
            recent_searches: [],
            recent_views: [],
          }
        }));
      },

      clearSessionContext: () => {
        set({
          sessionContext: {
            recent_searches: [],
            recent_views: [],
            cart_product_ids: [],
          }
        });
      }
    }),
    { name: 'retail-ai-user-session' }
  )
);
