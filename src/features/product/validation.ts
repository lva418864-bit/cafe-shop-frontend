import { z } from 'zod';

// Mirrors operation_service's Pydantic Field constraints exactly (Step 1):
// name 1-255, description max 1000, price strictly > 0, quantities >= 0.
// z.coerce.number() is used because native <input type="number"> values
// arrive as strings through React Hook Form's register().

export const customizationOptionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  extra_price: z.coerce.number().min(0, 'Must be positive'),
});

export const customizationGroupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  is_required: z.boolean(),
  selection_type: z.enum(['single', 'multiple']),
  options: z.array(customizationOptionSchema).min(1, 'At least one option required'),
});

export const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be at most 255 characters'),
  description: z
    .string()
    .max(1000, 'Description must be at most 1000 characters')
    .optional()
    .or(z.literal('')),
  price: z.coerce
    .number({ invalid_type_error: 'Enter a valid price' })
    .gt(0, 'Price must be greater than 0'),
  initial_stock: z.coerce
    .number({ invalid_type_error: 'Enter a whole number' })
    .int('Must be a whole number')
    .min(0, 'Cannot be negative')
    .optional(),
  category_id: z.coerce.number().int().gt(0, 'Category is required'),
  customization_groups: z.array(customizationGroupSchema).optional(),
});
export type CreateProductFormValues = z.infer<typeof createProductSchema>;

export const updateProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be at most 255 characters'),
  description: z
    .string()
    .max(1000, 'Description must be at most 1000 characters')
    .optional()
    .or(z.literal('')),
  price: z.coerce
    .number({ invalid_type_error: 'Enter a valid price' })
    .gt(0, 'Price must be greater than 0'),
  is_active: z.boolean(),
  category_id: z.coerce.number().int().gt(0, 'Category is required'),
  customization_groups: z.array(customizationGroupSchema).optional(),
});
export type UpdateProductFormValues = z.infer<typeof updateProductSchema>;

export const adjustStockSchema = z.object({
  change_quantity: z.coerce
    .number({ invalid_type_error: 'Enter a whole number' })
    .int('Must be a whole number')
    .refine((value) => value !== 0, 'Quantity change cannot be zero'),
  reason: z.enum(['restock', 'adjustment']),
  reference: z
    .string()
    .max(255, 'Reference must be at most 255 characters')
    .optional()
    .or(z.literal('')),
});
export type AdjustStockFormValues = z.infer<typeof adjustStockSchema>;
