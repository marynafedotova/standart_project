import { unstable_noStore as noStore } from "next/cache";

export async function getProducts() {
  noStore();
  const { readDb } = await import("@/lib/json-db");
  const db = await readDb();
  return [...db.products].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getFeaturedProducts() {
  noStore();
  const products = await getProducts();
  return products.slice(0, 3);
}

export async function getProductBySlug(slug: string) {
  noStore();
  const products = await getProducts();
  return products.find((item) => item.slug === slug) ?? null;
}

export async function getProductById(id: string) {
  noStore();
  const products = await getProducts();
  return products.find((item) => item.id === id) ?? null;
}

export async function getCategories() {
  noStore();
  const { readDb } = await import("@/lib/json-db");
  const db = await readDb();
  return db.categories;
}

export async function getBrands() {
  noStore();
  const { readDb } = await import("@/lib/json-db");
  const db = await readDb();
  return db.brands;
}

export async function getSeasons() {
  noStore();
  const { readDb } = await import("@/lib/json-db");
  const db = await readDb();
  return db.seasons;
}

export async function getOrdersForAdmin() {
  noStore();
  const { readDb } = await import("@/lib/json-db");
  const db = await readDb();
  return db.orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getOrderById(id: string) {
  noStore();
  const { readDb } = await import("@/lib/json-db");
  const db = await readDb();
  return db.orders.find((item) => item.id === id) ?? null;
}

export async function getClientsForAdmin() {
  noStore();
  const { readDb } = await import("@/lib/json-db");
  const db = await readDb();
  return db.clients.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getClientById(id: string) {
  noStore();
  const { readDb } = await import("@/lib/json-db");
  const db = await readDb();
  return db.clients.find((item) => item.id === id) ?? null;
}

export async function getPosts() {
  noStore();
  const { readDb } = await import("@/lib/json-db");
  const db = await readDb();
  return db.posts
    .filter((item) => item.published)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((item) => ({ ...item, createdAt: new Date(item.createdAt) }));
}

export async function getAdminPosts() {
  noStore();
  const { readDb } = await import("@/lib/json-db");
  const db = await readDb();
  return db.posts
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((item) => ({ ...item, createdAt: new Date(item.createdAt) }));
}

export async function getPostById(id: string) {
  noStore();
  const { readDb } = await import("@/lib/json-db");
  const db = await readDb();
  const post = db.posts.find((item) => item.id === id);
  return post ? { ...post, createdAt: new Date(post.createdAt) } : null;
}

export async function getPostBySlug(slug: string) {
  noStore();
  const { readDb } = await import("@/lib/json-db");
  const db = await readDb();
  const post = db.posts.find((item) => item.slug === slug && item.published);
  return post ? { ...post, createdAt: new Date(post.createdAt) } : null;
}
