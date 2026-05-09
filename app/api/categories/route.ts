import { createAttributeRoute } from "@/lib/admin-attribute-route";
import { replaceMultiValue } from "@/lib/multi-value";

const route = createAttributeRoute({
  key: "categories",
  label: "категорія",
  isUsed: (product, name) => product.category.split("|").some((item) => item.trim() === name),
  replaceInProduct: (product, currentName, nextName) => ({
    ...product,
    category: replaceMultiValue(product.category, currentName, nextName)
  })
});

export const GET = route.GET;
export const POST = route.POST;
export const PATCH = route.PATCH;
export const DELETE = route.DELETE;
