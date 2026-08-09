import { z } from 'zod';

export const challanItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
});

export const createChallanSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  items: z.array(challanItemSchema).min(1, 'At least one item is required'),
  status: z.enum(['draft', 'confirmed']).default('draft'),
});

export const updateChallanSchema = z.object({
  customerId: z.string().optional(),
  items: z.array(challanItemSchema).min(1).optional(),
});

export const challanQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  status: z.enum(['draft', 'confirmed', 'cancelled']).optional(),
  customerId: z.string().optional(),
  search: z.string().optional(),
});

export type CreateChallanInput = z.infer<typeof createChallanSchema>;
export type UpdateChallanInput = z.infer<typeof updateChallanSchema>;
