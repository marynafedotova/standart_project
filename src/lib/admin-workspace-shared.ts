export type EmployeeRole = "owner" | "admin" | "manager" | "editor" | "support" | "viewer";
export type KnowledgeArticleStatus = "draft" | "published";

export type EmployeeRecord = {
  id: string;
  name: string;
  email: string;
  role: EmployeeRole;
  department: string;
  notes: string;
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

export const EMPLOYEE_ROLE_OPTIONS: Array<{
  value: EmployeeRole;
  label: string;
  description: string;
}> = [
  { value: "owner", label: "Власник", description: "Повний доступ до всіх розділів і налаштувань." },
  { value: "admin", label: "Адміністратор", description: "Керує операційною роботою та співробітниками." },
  { value: "manager", label: "Менеджер", description: "Працює з товарами, замовленнями та клієнтами." },
  { value: "editor", label: "Контент", description: "Редагує товари, новини та базу знань." },
  { value: "support", label: "Підтримка", description: "Працює із замовленнями, клієнтами та інструкціями." },
  { value: "viewer", label: "Перегляд", description: "Має доступ лише до перегляду та навчальних матеріалів." }
];
