import { z } from 'zod';

export const stripeCartSchema = z.object({
  market: z.enum(['GLOBAL']).default('GLOBAL'),
  items: z.array(
    z.object({
      product_id: z.string().uuid(),
      variant_id: z.string().uuid().nullable().optional(),
      quantity: z.number().positive(),
      unit_type: z.string().optional()
    })
  ),
  customer: z.object({
    user_id: z.string().uuid().nullable().optional(),
    email: z.string().email(),
    first_name: z.string(),
    last_name: z.string(),
    phone: z.string().optional()
  }),
  shipping_address: z.object({
    address: z.string(),
    city: z.string(),
    zipCode: z.string().optional(),
    country: z.string().default('United States')
  }),
  billing_address: z
    .object({
      address: z.string(),
      city: z.string(),
      zipCode: z.string().optional(),
      country: z.string().default('United States')
    })
    .optional(),
  currency: z.enum(['USD', 'EUR']).default('USD'),
  success_url: z.string().url(),
  cancel_url: z.string().url()
});
