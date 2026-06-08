export type AdminSectionPermission =
  | "dashboard"
  | "products"
  | "orders"
  | "clients"
  | "content"
  | "team"
  | "knowledge"
  | "settings";

export type EmployeeRole = "owner" | "admin" | "manager" | "editor" | "support" | "viewer";
export type KnowledgeArticleStatus = "draft" | "published";

export type EmployeeRecord = {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  birthDate: string;
  phone: string;
  email: string;
  login: string;
  passwordHash?: string;
  role: EmployeeRole;
  department: string;
  notes: string;
  permissions: AdminSectionPermission[];
  isManager: boolean;
  managerId: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type KnowledgeArticleRecord = {
  id: string;
  title: string;
  slug: string;
  category: string;
  summary: string;
  content: string;
  status: KnowledgeArticleStatus;
  audience: EmployeeRole[];
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};

export const ADMIN_PERMISSION_OPTIONS: Array<{ value: AdminSectionPermission; label: string }> = [
  { value: "dashboard", label: "Головна" },
  { value: "products", label: "Товари" },
  { value: "orders", label: "Замовлення" },
  { value: "clients", label: "Клієнти" },
  { value: "content", label: "Контент" },
  { value: "team", label: "Співробітники" },
  { value: "knowledge", label: "База знань" },
  { value: "settings", label: "Налаштування" }
];

export const EMPLOYEE_ROLE_OPTIONS: Array<{
  value: EmployeeRole;
  label: string;
  description: string;
  defaultPermissions: AdminSectionPermission[];
}> = [
  {
    value: "owner",
    label: "Власник",
    description: "Повний доступ до всіх розділів і налаштувань.",
    defaultPermissions: ["dashboard", "products", "orders", "clients", "content", "team", "knowledge", "settings"]
  },
  {
    value: "admin",
    label: "Адміністратор",
    description: "Керує операційною роботою та співробітниками.",
    defaultPermissions: ["dashboard", "products", "orders", "clients", "content", "team", "knowledge"]
  },
  {
    value: "manager",
    label: "Менеджер",
    description: "Працює з товарами, замовленнями та клієнтами.",
    defaultPermissions: ["dashboard", "products", "orders", "clients", "knowledge"]
  },
  {
    value: "editor",
    label: "Контент",
    description: "Редагує товари, новини та базу знань.",
    defaultPermissions: ["dashboard", "products", "content", "knowledge"]
  },
  {
    value: "support",
    label: "Підтримка",
    description: "Працює із замовленнями, клієнтами та інструкціями.",
    defaultPermissions: ["dashboard", "orders", "clients", "knowledge"]
  },
  {
    value: "viewer",
    label: "Перегляд",
    description: "Має доступ лише до перегляду та навчальних матеріалів.",
    defaultPermissions: ["dashboard", "knowledge"]
  }
];
