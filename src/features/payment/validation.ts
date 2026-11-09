import { z } from 'zod';

import { PAYMENT_CURRENCIES, PAYMENT_METHODS } from '@/types/enums';

export const createPaymentSchema = z.object({
  method: z.enum(PAYMENT_METHODS),
  currency: z.enum(PAYMENT_CURRENCIES).default('USD'),
});
export type CreatePaymentFormValues = z.infer<typeof createPaymentSchema>;
