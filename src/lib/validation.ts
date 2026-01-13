import { z } from 'zod';

export const materialSchema = z.object({
  name: z.string().min(1),
  composition: z.string().optional(),
  width_cm: z.number().int().positive(),
  weight_gsm: z.number().int().positive().optional(),
  shrinkage_ratio: z.number().optional(),
  supplier: z.string().optional(),
  usable_for: z.array(z.string()).optional()
});

export const productSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  product_type: z.enum(['fabric', 'curtain', 'pillow', 'tablecloth', 'runner']),
  sales_model: z.enum(['unit', 'meter', 'custom']),
  base_material_id: z.string().uuid().nullable().optional(),
  description: z.string().optional(),
  care_instructions: z.string().optional(),
  is_active: z.boolean().optional(),
  has_variants: z.boolean().optional()
});
