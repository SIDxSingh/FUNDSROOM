export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'sales' | 'warehouse' | 'accounts';
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  businessName?: string;
  gstNumber?: string;
  customerType: 'retail' | 'wholesale' | 'distributor';
  address?: string;
  status: 'lead' | 'active' | 'inactive';
  followUpDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: { name: string };
  followUps?: CustomerFollowUp[];
}

export interface CustomerFollowUp {
  id: string;
  customerId: string;
  note: string;
  createdAt: string;
  createdBy?: { name: string };
}

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  categoryId?: string;
  category?: Category;
  unitPrice: number | string;
  currentStock: number;
  minStockAlert: number;
  location?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: { name: string };
  stockMovements?: StockMovement[];
}

export interface StockMovement {
  id: string;
  productId: string;
  product?: { name: string; sku: string };
  quantityChanged: number;
  movementType: 'IN' | 'OUT';
  reason: string;
  createdAt: string;
  createdBy?: { name: string };
}

export interface ChallanItem {
  id: string;
  challanId: string;
  productId: string;
  product?: { id: string; name: string; sku: string };
  productSnapshot: {
    id: string;
    name: string;
    sku: string;
    unitPrice: number;
  };
  quantity: number;
  unitPrice: number | string;
  amount: number | string;
}

export interface Challan {
  id: string;
  challanNumber: string;
  customerId: string;
  customer?: { id: string; name: string; mobile: string; businessName?: string };
  customerSnapshot: Record<string, unknown>;
  status: 'draft' | 'confirmed' | 'cancelled';
  totalQuantity: number;
  totalAmount: number | string;
  createdAt: string;
  updatedAt: string;
  createdBy?: { name: string };
  items: ChallanItem[];
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: Pagination;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface DashboardStats {
  customers: { total: number; active: number };
  products: { total: number; lowStock: number };
  challans: { total: number; confirmed: number; draft: number; revenue: number | string };
  recentChallans: Challan[];
}
