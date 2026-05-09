import { createAttributeRoute } from "@/lib/admin-attribute-route";

const route = createAttributeRoute({
  key: "colors",
  label: "цвет",
  isUsed: (product, name) => product.colors.includes(name),
  replaceInProduct: (product, currentName, nextName) => ({
    ...product,
    colors: product.colors.map((item) => (item === currentName ? nextName : item))
  })
});

export const GET = route.GET;
export const POST = route.POST;
export const PATCH = route.PATCH;
export const DELETE = route.DELETE;
