import { z } from 'zod';

export const pricingRuleSchema = z.object({
  product_id: z.string().uuid(),
  pricing_type: z.enum(['unit', 'meter', 'area', 'custom_formula']),
  base_price: z.number().nonnegative(),
  currency: z.string().default('TRY'),
  min_quantity: z.number().positive().default(1),
  step: z.number().positive().default(1)
});

export const customPricingSchema = z.object({
  product_id: z.string().uuid(),
  sewing_cost: z.number().nonnegative().default(0),
  accessory_cost: z.number().nonnegative().default(0),
  wastage_ratio: z.number().nonnegative().default(0),
  fullness_ratio_default: z.number().nonnegative().default(1),
  currency: z.string().default('TRY')
});
