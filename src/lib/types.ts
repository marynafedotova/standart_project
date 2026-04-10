export type ProductInput = {
  name: string;
  slug: string;
  category: string;
  price: number;
  oldPrice?: number | null;
  stock: number;
  material: string;
  color: string;
  badge?: string | null;
  description: string;
  image: string;
  features: string[];
};

export type PostInput = {
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  cover: string;
  content: string[];
  published: boolean;
};
