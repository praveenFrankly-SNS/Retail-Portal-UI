// ============================================================
// Retail AI Portal — Customer API
// Gateway for active switcher personas and context tracking.
// ============================================================

import apiClient from './client';
import type { Customer, CustomerProfile, CustomerAIContext } from '../types/customer';
import { MOCK_DEMO_CUSTOMERS, MOCK_ACTIVE_CUSTOMER, MOCK_AI_CONTEXT } from '../mocks/customers';

const LIVE_API = import.meta.env.VITE_ENABLE_LIVE_API === 'true';

export async function getCustomers(): Promise<Customer[]> {
  if (LIVE_API) {
    try {
      const { data } = await apiClient.get<{ customers: Customer[] }>('/api/v1/customers');
      return data.customers;
    } catch (err) {
      console.warn("Failed to fetch customers list, falling back to mock:", err);
    }
  }
  return MOCK_DEMO_CUSTOMERS;
}

export async function getCustomerProfile(customerId: string): Promise<CustomerProfile> {
  if (LIVE_API) {
    try {
      const { data } = await apiClient.get<CustomerProfile>(`/api/v1/customers/${customerId}/profile`);
      return data;
    } catch (err) {
      console.warn(`Failed to fetch profile for customer ${customerId}, falling back to mock:`, err);
    }
  }
  return { ...MOCK_ACTIVE_CUSTOMER, customer_id: customerId };
}

export async function getCustomerContext(customerId: string): Promise<CustomerAIContext> {
  if (LIVE_API) {
    try {
      const { data } = await apiClient.get<CustomerAIContext>(`/api/v1/customers/${customerId}/context`);
      return data;
    } catch (err) {
      console.warn(`Failed to fetch AI context for customer ${customerId}, falling back to mock:`, err);
    }
  }
  return MOCK_AI_CONTEXT;
}

// ── Event Logging ─────────────────────────────────────────

export async function logCustomerEvent(
  customerId: string,
  eventType: 'SEARCH' | 'PRODUCT_VIEW' | 'RECOMMENDATION_VIEW' | 'RECOMMENDATION_CLICK' | 'ADD_TO_CART' | 'REMOVE_FROM_CART',
  productId?: string,
  query?: string
): Promise<void> {
  if (LIVE_API) {
    try {
      await apiClient.post('/api/v1/events', {
        customer_id: customerId,
        event_type: eventType,
        product_id: productId || null,
        query: query || null
      });
    } catch (err) {
      console.warn("Event logging failed:", err);
    }
  } else {
    console.log(`[Event Logged Mock] customer=${customerId} | type=${eventType} | product=${productId} | query=${query}`);
  }
}
