import { createAttributeRoute } from "@/lib/admin-attribute-route";

const route = createAttributeRoute({
  key: "sizes",
  label: "размер",
  isUsed: (product, name) => product.sizes.includes(name),
  replaceInProduct: (product, currentName, nextName) => ({
    ...product,
    sizes: product.sizes.map((item) => (item === currentName ? nextName : item)),
    size: product.sizes.map((item) => (item === currentName ? nextName : item)).join(" | ")
  })
});

export const GET = route.GET;
export const POST = route.POST;
export const PATCH = route.PATCH;
export const DELETE = route.DELETE;
