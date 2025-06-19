import axios from "axios";
import type { AxiosInstance } from "axios";
import type { WalletClient } from "viem";
import { withPaymentInterceptor } from "x402-axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Base axios instance without payment interceptor
const baseApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// This will be dynamically set based on wallet connection
let apiClient: AxiosInstance = baseApiClient;

// Update the API client with a wallet and auth token
export function updateApiClient(walletClient: WalletClient | null, authToken: string | null) {
  if (walletClient && walletClient.account && authToken) {
    // Create new base client with auth token
    const authClient = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`,
      },
    });

    // Add x402 payment interceptor
    apiClient = withPaymentInterceptor(authClient, walletClient as any);

    // Fix x402-axios bug: remove the incorrectly added request header
    apiClient.interceptors.request.use(
      (config) => {
        // Remove the header that x402-axios incorrectly adds
        if (config.headers && 'Access-Control-Expose-Headers' in config.headers) {
          delete config.headers['Access-Control-Expose-Headers'];
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    console.log("💳 API client updated with wallet:", walletClient.account.address);
  } else if (authToken) {
    // Just auth, no wallet
    apiClient = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`,
      },
    });
    console.log("🔐 API client updated with auth token only");
  } else {
    // No wallet or auth connected - reset to base client
    apiClient = baseApiClient;
    console.log("⚠️ API client reset - no wallet or auth");
  }
}

// Types for API responses
export interface SearchSource {
  title: string;
  url: string;
  snippet: string;
}

export interface SearchProviderResult {
  provider: string;
  answer: string;
  sources: SearchSource[];
  error?: string;
}

export interface SearchResult {
  id: string;
  query: string;
  results: SearchProviderResult[];
  summary: string;
  timestamp: string;
}

export interface ScheduledQuery {
  id: string;
  query: string;
  scheduledFor: string;
  createdAt: string;
  status: string;
}

export interface QueryHistory {
  id: string;
  query: string;
  executedAt: string;
  createdAt: string;
  status: string;
  summary: string;
  sources: SearchProviderResult[] | null;
  error: string | null;
}

// API endpoints
export const api = {
  // Search endpoints
  searchNow: async (query: string): Promise<SearchResult> => {
    console.log("🔍 Performing search:", query);
    const response = await apiClient.post("/api/search/answer", { query });
    console.log("✅ Search completed");
    return response.data;
  },

  scheduleSearch: async (query: string, scheduleFor: string, userEmail?: string): Promise<any> => {
    console.log("📅 Scheduling search:", { query, scheduleFor, userEmail });
    const requestBody: any = {
      query,
      scheduleFor
    };
    // Only include userEmail if provided
    if (userEmail) {
      requestBody.userEmail = userEmail;
    }
    const response = await apiClient.post("/api/search/answer", requestBody);
    console.log("✅ Search scheduled");
    return response.data;
  },

  // Query management
  getPendingQueries: async (): Promise<{ queries: ScheduledQuery[] }> => {
    const response = await apiClient.get("/api/queries/pending");
    return response.data;
  },

  getQueryHistory: async (limit: number = 50): Promise<{ queries: QueryHistory[] }> => {
    const response = await apiClient.get(`/api/queries/history?limit=${limit}`);
    return response.data;
  },

  getQueryById: async (id: string): Promise<QueryHistory> => {
    const response = await apiClient.get(`/api/queries/${id}`);
    return response.data;
  },

  deleteQuery: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/queries/${id}`);
  },

  // Admin endpoint for testing
  executeScheduledQueries: async (): Promise<any> => {
    const response = await apiClient.post("/api/admin/execute-scheduled");
    return response.data;
  },
}; 