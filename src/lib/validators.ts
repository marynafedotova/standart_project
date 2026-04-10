import { z } from "zod";
import { joinMultiValue } from "@/lib/multi-value";
import { DEFAULT_PRODUCT_IMAGE } from "@/lib/product-defaults";

const stringList = z.array(z.string().trim().min(1)).min(1);
const optionalText = z.string().trim().optional().default("");
const multiValueSchema = z.union([stringList, z.string().trim().min(1)]).transform((value) => joinMultiValue(value));
const optionalMultiValueSchema = z
  .union([stringList, z.string().trim().optional().default("")])
  .transform((value) => joinMultiValue(value));
const imagePathSchema = z
  .string()
  .trim()
  .refine((value) => value.startsWith("/") || /^https?:\/\//.test(value), "Image must be a root-relative path or absolute URL");
const imageValueSchema = z
  .string()
  .trim()
  .optional()
  .default(DEFAULT_PRODUCT_IMAGE)
  .refine(
    (value) => !value || value.startsWith("/") || /^https?:\/\//.test(value),
    "Image must be a root-relative path or absolute URL"
  )
  .transform((value) => value || DEFAULT_PRODUCT_IMAGE);

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const productSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).default("product"),
  status: z.enum(["Активен", "Черновик", "Нет в наличии"]).default("Активен"),
  category: multiValueSchema,
  brand: optionalText,
  size: optionalText,
  centimeters: optionalText,
  ageGroup: optionalText,
  audience: optionalText,
  season: optionalMultiValueSchema,
  price: z.coerce.number().nonnegative(),
  oldPrice: z.union([z.coerce.number().nonnegative(), z.null()]).optional(),
  stock: z.coerce.number().int().nonnegative(),
  material: optionalText,
  colors: z.union([stringList, z.string().trim().optional().default("")]).transform((value) =>
    Array.isArray(value)
      ? value
      : value
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean)
  ),
  badge: z.string().optional().nullable(),
  description: optionalText,
  image: imageValueSchema,
  images: z
    .union([stringList, z.string().trim().optional().default("")])
    .transform((value) =>
      Array.isArray(value)
        ? value
        : value
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean)
    )
    .optional()
    .default([]),
  features: z.union([stringList, z.string().trim().optional().default("")]).transform((value) =>
    Array.isArray(value)
      ? value
      : value
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean)
  )
});

export const postSchema = z.object({
  title: z.string().min(4),
  slug: z.string().min(2),
  category: z.string().min(2),
  excerpt: z.string().min(10),
  cover: imagePathSchema,
  content: z.union([stringList, z.string().min(1)]).transform((value) =>
    Array.isArray(value)
      ? value
      : value
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean)
  ),
  contentBlocks: z
    .array(
      z.object({
        id: z.string().min(1),
        type: z.enum(["paragraph", "heading", "image", "list", "quote", "richText"]),
        text: optionalText,
        items: z.array(z.string().trim()).optional().default([]),
        src: optionalText,
        alt: optionalText,
        href: optionalText,
        html: optionalText,
        level: z.union([z.literal(2), z.literal(3)]).optional(),
        align: z.enum(["left", "center", "wide"]).optional()
      })
    )
    .optional()
    .default([]),
  published: z.coerce.boolean().default(true)
});
