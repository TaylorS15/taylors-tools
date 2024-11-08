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
});

