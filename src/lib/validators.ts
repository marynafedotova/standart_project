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
const translationMapSchema = z
  .object({
    uk: z.string().trim().optional(),
    ru: z.string().trim().optional(),
    en: z.string().trim().optional()
  })
  .optional()
  .transform((value) => {
    if (!value) return undefined;
    const normalized = Object.fromEntries(Object.entries(value).filter(([, item]) => item && item.trim().length > 0));
    return Object.keys(normalized).length > 0 ? normalized : undefined;
  });
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
const warehouseStockSchema = z
  .array(
    z.object({
      warehouse: z.string().trim().min(1),
      quantity: z.coerce.number().int().nonnegative()
    })
  )
  .optional()
  .default([])
  .transform((value) =>
    value
      .map((item) => ({
        warehouse: item.warehouse.trim(),
        quantity: Math.max(0, Math.trunc(item.quantity))
      }))
      .filter((item) => item.warehouse.length > 0)
  );

const productAttributeListSchema = z
  .union([stringList, z.string().trim().optional().default("")])
  .transform((value) =>
    Array.isArray(value)
      ? Array.from(new Set(value.map((item) => item.trim()).filter(Boolean)))
      : value
          .split("\n")
          .flatMap((item) => item.split("|"))
          .map((item) => item.trim())
          .filter(Boolean)
  );

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const productSchema = z.object({
  name: z.string().min(2),
  code: optionalText,
  group: optionalText,
  variantColor: optionalText,
  slug: z.string().min(2).default("product"),
  status: z.enum(["Активен", "Черновик", "Нет в наличии", "Брак"]).default("Активен"),
  nameI18n: translationMapSchema,
  category: multiValueSchema,
  brand: optionalText,
  size: optionalText,
  sizes: productAttributeListSchema.optional().default([]),
  centimeters: optionalText,
  ageGroup: optionalText,
  audience: optionalText,
  season: optionalMultiValueSchema,
  price: z.coerce.number().nonnegative(),
  oldPrice: z.union([z.coerce.number().nonnegative(), z.null()]).optional(),
  stock: z.coerce.number().int().nonnegative(),
  material: optionalText,
  materials: productAttributeListSchema.optional().default([]),
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
  descriptionI18n: translationMapSchema,
  warehouseStock: warehouseStockSchema,
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
  titleI18n: translationMapSchema,
  excerpt: z.string().min(10),
  excerptI18n: translationMapSchema,
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
