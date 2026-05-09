import { createAttributeRoute } from "@/lib/admin-attribute-route";
import { replaceMultiValue } from "@/lib/multi-value";

const route = createAttributeRoute({
  key: "seasons",
  label: "сезон",
  isUsed: (product, name) => product.season.split("|").some((item) => item.trim() === name),
  replaceInProduct: (product, currentName, nextName) => ({
    ...product,
    season: replaceMultiValue(product.season, currentName, nextName)
  })
});

export const GET = route.GET;
export const POST = route.POST;
export const PATCH = route.PATCH;
export const DELETE = route.DELETE;
