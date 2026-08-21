import { z } from "zod";

export const searchInputSchema = z.object({
  title: z.string().trim().min(3).max(100),
  prompt: z.string().trim().min(10).max(2000),
  category: z.string().trim().min(2).max(80).default("pañales"),
  size: z.string().trim().max(40).nullable().optional(),
  brand: z.string().trim().max(80).nullable().optional(),
  minimumQuantity: z.number().int().positive().max(10000).nullable().optional(),
  maxPriceCents: z.number().int().positive().max(100000).nullable().optional(),
  preferredStores: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
});

export type SearchInput = z.infer<typeof searchInputSchema>;
