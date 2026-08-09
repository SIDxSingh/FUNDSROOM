import { z } from 'zod';

export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  mobile: z.string().regex(/^\d{10}$/, 'Mobile must be 10 digits'),
  email: z.string().email().optional().or(z.literal('')),
  businessName: z.string().optional(),
  gstNumber: z.string().optional(),
  customerType: z.enum(['retail', 'wholesale', 'distributor']),
  address: z.string().optional(),
  status: z.enum(['lead', 'active', 'inactive']).default('lead'),
  followUpDate: z.string().datetime().optional().or(z.literal('')),
  notes: z.string().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const followUpSchema = z.object({
  note: z.string().min(1, 'Note is required'),
});

export const customerQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  search: z.string().optional(),
  status: z.enum(['lead', 'active', 'inactive']).optional(),
  customerType: z.enum(['retail', 'wholesale', 'distributor']).optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type FollowUpInput = z.infer<typeof followUpSchema>;
