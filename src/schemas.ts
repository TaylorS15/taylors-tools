import { z } from "zod";
import { LucideIcon, ImageOff } from "lucide-react";

export const toolSchema = z.object({
  name: z.string().min(0).max(50),
  title: z.string().min(0).max(150),
  url: z.string().min(0).max(50),
  color: z.string().min(7).max(7),
  description: z.string().min(1).max(250),
  Logo: z.custom<LucideIcon>(),
  pricing: z.object({
    single: z.number(),
    credits: z.number(),
  }),
  cta: z.string().min(0).max(50),
});

export const AVAILABLE_TOOLS: z.infer<typeof toolSchema>[] = [
  {
    name: "Image(s) to PDF",
    title: "Convert your images to a single PDF",
    url: "img-to-pdf",
    color: "#af1d1d",
    description:
      "Easily drop in images and have them converted to a single, multi-page, PDF file. Automatically sorted based on filename for zero effort conversions.",
    Logo: ImageOff,
    pricing: {
      single: 1,
      credits: 7,
    },
    cta: "Convert your images now",
  },
  {
    name: "Image(s) to PDF",
    title: "Convert your images to a single PDF",
    url: "img-to-pdf",
    color: "#af1d1d",
    description:
      "Easily drop in images and have them converted to a single, multi-page, PDF file. Automatically sorted based on filename for zero effort conversions.",
    Logo: ImageOff,
    pricing: {
      single: 1,
      credits: 7,
    },
    cta: "Convert your images now",
  },
  {
    name: "Image(s) to PDF",
    title: "Convert your images to a single PDF",
    url: "img-to-pdf",
    color: "#af1d1d",
    description:
      "Easily drop in images and have them converted to a single, multi-page, PDF file. Automatically sorted based on filename for zero effort conversions.",
    Logo: ImageOff,
    pricing: {
      single: 1,
      credits: 7,
    },
    cta: "Convert your images now",
  },
  {
    name: "Image(s) to PDF",
    title: "Convert your images to a single PDF",
    url: "img-to-pdf",
    color: "#af1d1d",
    description:
      "Easily drop in images and have them converted to a single, multi-page, PDF file. Automatically sorted based on filename for zero effort conversions.",
    Logo: ImageOff,
    pricing: {
      single: 1,
      credits: 7,
    },
    cta: "Convert your images now",
  },
  {
    name: "Image(s) to PDF",
    title: "Convert your images to a single PDF",
    url: "img-to-pdf",
    color: "#af1d1d",
    description:
      "Easily drop in images and have them converted to a single, multi-page, PDF file. Automatically sorted based on filename for zero effort conversions.",
    Logo: ImageOff,
    pricing: {
      single: 1,
      credits: 7,
    },
    cta: "Convert your images now",
  },
];
