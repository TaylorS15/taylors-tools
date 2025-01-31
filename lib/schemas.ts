import { z } from "zod";

export const toolSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(255),
  title: z.string().min(1).max(255),
  url: z.string().min(1).max(255),
  description: z.string().min(1).max(255),
  logo: z.string().min(0).max(1500),
  pricing_single: z.number(),
  pricing_credits: z.number(),
  cta: z.string().min(1).max(255),
  stripe_price_id: z.string().min(1).max(255).nullish(),
  adjustable_pricing: z.number().int().min(0).max(1),
});

export const userSchema = z.object({
  id: z.number().int().positive(),
  user_id: z.string().min(1).max(255),
  credits: z.number(),
  total_operations: z.number(),
});

export const userOperationsSchema = z.object({
  id: z.number().int().positive(),
  user_id: z.string().min(1).max(255),
  name: z.string().min(1).max(255),
  tool: z.string().min(1).max(255),
  download_code: z.string().min(6).max(6),
  created_at: z.string().min(1).max(255),
  temporary: z.number().int().min(0).max(1),
});

export const stripeClientSecretOptionsSchema = z
  .object({
    fileDurationMinutes: z.number().min(0).optional(),
  })
  .optional();

export const imgToPdfRequestSchema = z.object({
  clientSecret: z.string().max(255).optional(),
  files: z.array(z.instanceof(File)),
  options: z.object({
    type: z.literal("img-to-pdf"),
    saveToProfile: z.boolean(),
    title: z.string().max(255),
    selectedImageFit: z.union([
      z.literal("FIT"),
      z.literal("STRETCH"),
      z.literal("FILL"),
    ]),
  }),
});

export const audioToTranscriptRequestSchema = z.object({
  clientSecret: z.string().max(255).optional(),
  files: z.array(z.instanceof(File)),
  options: z.object({
    type: z.literal("audio-to-transcript"),
    saveToProfile: z.boolean(),
    title: z.string().max(255),
    language: z.string().min(2).max(2),
  }),
});
