import { createAttributeRoute } from "@/lib/admin-attribute-route";

const route = createAttributeRoute({
  key: "brands",
  label: "бренд",
  isUsed: (product, name) => product.brand === name,
  replaceInProduct: (product, currentName, nextName) => ({
    ...product,
    brand: product.brand === currentName ? nextName : product.brand
  })
});

export const GET = route.GET;
export const POST = route.POST;
export const PATCH = route.PATCH;
export const DELETE = route.DELETE;
