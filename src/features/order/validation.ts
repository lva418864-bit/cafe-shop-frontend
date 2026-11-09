import { z } from 'zod';

import { ORDER_STATUSES } from '@/types/enums';

export const orderItemSchema = z.object({
  product_id: z.coerce
    .number({ invalid_type_error: 'Select a product' })
    .int()
    .positive('Select a product'),
  quantity: z.coerce
    .number({ invalid_type_error: 'Enter a whole number' })
    .int('Must be a whole number')
    .positive('Quantity must be greater than 0'),
});

export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'Add at least one item'),
});
export type CreateOrderFormValues = z.infer<typeof createOrderSchema>;

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});
export type UpdateOrderStatusFormValues = z.infer<typeof updateOrderStatusSchema>;
