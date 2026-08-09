import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  categoryId: z.string().optional(),
  unitPrice: z.number().positive('Unit price must be positive'),
  currentStock: z.number().int().min(0).default(0),
  minStockAlert: z.number().int().min(0).default(10),
  location: z.string().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  lowStock: z.string().optional(),
});

export const stockMovementSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantityChanged: z.number().int().positive('Quantity must be positive'),
  movementType: z.enum(['IN', 'OUT']),
  reason: z.string().min(1, 'Reason is required'),
});

export const stockMovementQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  productId: z.string().optional(),
  movementType: z.enum(['IN', 'OUT']).optional(),
});

export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type StockMovementInput = z.infer<typeof stockMovementSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
