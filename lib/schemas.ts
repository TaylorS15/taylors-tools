import { z } from "zod";

export const toolSchema = z.object({
  name: z.string().min(1).max(255),
  title: z.string().min(1).max(255),
  url: z.string().min(1).max(255),
  color: z.string().min(7).max(7),
  description: z.string().min(1).max(255),
  logo: z.string().min(0).max(1500),
  pricing_single: z.number(),
  pricing_credits: z.number(),
  cta: z.string().min(1).max(255),
  stripe_price_id: z.string().min(1).max(255).nullish(),
});

export const userTotalOperationsSchema = z.object({
  user_id: z.string().min(1).max(255),
  total_operations: z.number(),
});

export const userOperationsSchema = z.object({
  user_id: z.string().min(1).max(255),
  name: z.string().min(1).max(255),
  tool: z.string().min(1).max(255),
  created_at: z.string().min(1).max(255),
});
