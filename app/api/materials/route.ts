import { createAttributeRoute } from "@/lib/admin-attribute-route";

const route = createAttributeRoute({
  key: "materials",
  label: "материал",
  isUsed: (product, name) => product.materials.includes(name),
  replaceInProduct: (product, currentName, nextName) => ({
    ...product,
    materials: product.materials.map((item) => (item === currentName ? nextName : item)),
    material: product.materials.map((item) => (item === currentName ? nextName : item)).join(", ")
  })
});

export const GET = route.GET;
export const POST = route.POST;
export const PATCH = route.PATCH;
export const DELETE = route.DELETE;
