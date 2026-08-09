import api from './client';
import type {
  Customer, CustomerFollowUp, Product, StockMovement, Challan,
  Category, DashboardStats, PaginatedResponse, ApiResponse,
} from '../types';

// ─── Auth ──────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<{ token: string; user: { id: string; name: string; email: string; role: string } }>>('/auth/login', { email, password }),
  me: () => api.get<ApiResponse<{ userId: string; email: string; role: string; name: string }>>('/auth/me'),
};

// ─── Dashboard ────────────────────────────────────────────────
export const dashboardApi = {
  getStats: () => api.get<ApiResponse<DashboardStats>>('/dashboard/stats'),
};

// ─── Customers ────────────────────────────────────────────────
export const customersApi = {
  list: (params?: Record<string, string>) =>
    api.get<PaginatedResponse<Customer>>('/customers', { params }),
  get: (id: string) => api.get<ApiResponse<Customer>>(`/customers/${id}`),
  create: (data: Partial<Customer>) => api.post<ApiResponse<Customer>>('/customers', data),
  update: (id: string, data: Partial<Customer>) => api.put<ApiResponse<Customer>>(`/customers/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse<null>>(`/customers/${id}`),
  addFollowUp: (id: string, note: string) =>
    api.post<ApiResponse<CustomerFollowUp>>(`/customers/${id}/followups`, { note }),
  getFollowUps: (id: string) =>
    api.get<ApiResponse<CustomerFollowUp[]>>(`/customers/${id}/followups`),
};

// ─── Products ─────────────────────────────────────────────────
export const productsApi = {
  list: (params?: Record<string, string>) =>
    api.get<PaginatedResponse<Product>>('/products', { params }),
  get: (id: string) => api.get<ApiResponse<Product>>(`/products/${id}`),
  create: (data: Partial<Product>) => api.post<ApiResponse<Product>>('/products', data),
  update: (id: string, data: Partial<Product>) => api.put<ApiResponse<Product>>(`/products/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse<null>>(`/products/${id}`),
  getLowStock: () => api.get<ApiResponse<Product[]>>('/products/low-stock'),

  // Categories
  getCategories: () => api.get<ApiResponse<Category[]>>('/products/categories'),
  createCategory: (name: string) => api.post<ApiResponse<Category>>('/products/categories', { name }),

  // Stock movements
  getMovements: (params?: Record<string, string>) =>
    api.get<PaginatedResponse<StockMovement>>('/products/stock-movements', { params }),
  createMovement: (data: { productId: string; quantityChanged: number; movementType: 'IN' | 'OUT'; reason: string }) =>
    api.post<ApiResponse<StockMovement>>('/products/stock-movements', data),
};

// ─── Challans ─────────────────────────────────────────────────
export const challansApi = {
  list: (params?: Record<string, string>) =>
    api.get<PaginatedResponse<Challan>>('/challans', { params }),
  get: (id: string) => api.get<ApiResponse<Challan>>(`/challans/${id}`),
  create: (data: { customerId: string; items: { productId: string; quantity: number }[]; status?: string }) =>
    api.post<ApiResponse<Challan>>('/challans', data),
  update: (id: string, data: Partial<{ customerId: string; items: { productId: string; quantity: number }[] }>) =>
    api.put<ApiResponse<Challan>>(`/challans/${id}`, data),
  confirm: (id: string) => api.patch<ApiResponse<Challan>>(`/challans/${id}/confirm`),
  cancel: (id: string) => api.patch<ApiResponse<Challan>>(`/challans/${id}/cancel`),
};
