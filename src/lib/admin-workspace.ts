import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  EMPLOYEE_ROLE_OPTIONS,
  type AdminSectionPermission,
  type EmployeeRecord,
  type EmployeeRole,
  type KnowledgeArticleRecord,
  type KnowledgeArticleStatus
} from "@/lib/admin-workspace-shared";

function uniquePermissions(permissions: AdminSectionPermission[]) {
  return Array.from(new Set(permissions));
}

function nowIso() {
  return new Date().toISOString();
}

function slugifyArticle(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

function employeeFromRow(row: {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  birthDate: string;
  phone: string;
  email: string;
  login: string;
  passwordHash: string | null;
  role: string;
  department: string;
  notes: string;
  permissions: unknown;
  isManager: boolean;
  managerId: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}): EmployeeRecord {
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    position: row.position,
    birthDate: row.birthDate,
    phone: row.phone,
    email: row.email,
    login: row.login,
    passwordHash: row.passwordHash ?? undefined,
    role: row.role as EmployeeRole,
    department: row.department,
    notes: row.notes,
    permissions: Array.isArray(row.permissions) ? (row.permissions as AdminSectionPermission[]) : [],
    isManager: row.isManager,
    managerId: row.managerId ?? "",
    active: row.active,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function knowledgeArticleFromRow(row: {
  id: string;
  title: string;
  slug: string;
  category: string;
  summary: string;
  content: string;
  status: string;
  audience: unknown;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}): KnowledgeArticleRecord {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    category: row.category,
    summary: row.summary,
    content: row.content,
    status: row.status as KnowledgeArticleStatus,
    audience: Array.isArray(row.audience)
      ? (row.audience as EmployeeRole[])
      : ["owner", "admin", "manager", "editor", "support", "viewer"],
    updatedBy: row.updatedBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

async function createUniqueArticleSlug(title: string, currentId?: string, preferredSlug?: string) {
  const base = slugifyArticle(preferredSlug || title) || `article-${Date.now()}`;
  let candidate = base;
  let index = 2;

  while (true) {
    const existing = await prisma.knowledgeArticle.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === currentId) {
      return candidate;
    }

    candidate = `${base}-${index}`;
    index += 1;
  }
}

export async function getEmployees() {
  const rows = await prisma.employee.findMany({
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }]
  });
  return rows.map(employeeFromRow);
}

export async function saveEmployee(
  input: Partial<EmployeeRecord> &
    Pick<EmployeeRecord, "firstName" | "lastName" | "email" | "login" | "role"> & {
      password?: string;
      permissions?: AdminSectionPermission[];
    }
) {
  const timestamp = nowIso();
  const id = input.id ?? randomUUID();
  const existing = input.id ? await prisma.employee.findUnique({ where: { id } }) : null;
  const roleDefaults = EMPLOYEE_ROLE_OPTIONS.find((item) => item.value === input.role)?.defaultPermissions ?? [
    "dashboard",
    "knowledge"
  ];
  const existingPermissions = existing && Array.isArray(existing.permissions) ? (existing.permissions as AdminSectionPermission[]) : [];
  const permissions = uniquePermissions(
    input.permissions && input.permissions.length > 0 ? input.permissions : existingPermissions.length > 0 ? existingPermissions : roleDefaults
  );
  const managerId = input.managerId?.trim() && input.managerId.trim() !== id ? input.managerId.trim() : "";

  const nextRecord: EmployeeRecord = {
    id,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    position: input.position?.trim() ?? "",
    birthDate: input.birthDate?.trim() ?? "",
    phone: input.phone?.trim() ?? "",
    email: input.email.trim().toLowerCase(),
    login: input.login.trim().toLowerCase(),
    passwordHash: input.password ? await bcrypt.hash(input.password, 10) : existing?.passwordHash ?? undefined,
    role: input.role,
    department: input.department?.trim() ?? "",
    notes: input.notes?.trim() ?? "",
    permissions,
    isManager: input.isManager ?? existing?.isManager ?? false,
    managerId,
    active: input.active ?? true,
    createdAt: existing?.createdAt.toISOString() ?? timestamp,
    updatedAt: timestamp
  };

  await prisma.employee.upsert({
    where: { id },
    update: {
      firstName: nextRecord.firstName,
      lastName: nextRecord.lastName,
      position: nextRecord.position,
      birthDate: nextRecord.birthDate,
      phone: nextRecord.phone,
      email: nextRecord.email,
      login: nextRecord.login,
      passwordHash: nextRecord.passwordHash,
      role: nextRecord.role,
      department: nextRecord.department,
      notes: nextRecord.notes,
      permissions: nextRecord.permissions,
      isManager: nextRecord.isManager,
      managerId: nextRecord.managerId || null,
      active: nextRecord.active
    },
    create: {
      id: nextRecord.id,
      firstName: nextRecord.firstName,
      lastName: nextRecord.lastName,
      position: nextRecord.position,
      birthDate: nextRecord.birthDate,
      phone: nextRecord.phone,
      email: nextRecord.email,
      login: nextRecord.login,
      passwordHash: nextRecord.passwordHash,
      role: nextRecord.role,
      department: nextRecord.department,
      notes: nextRecord.notes,
      permissions: nextRecord.permissions,
      isManager: nextRecord.isManager,
      managerId: nextRecord.managerId || null,
      active: nextRecord.active
    }
  });

  return nextRecord;
}

export async function deleteEmployee(id: string) {
  await prisma.employee.delete({ where: { id } });
}

export async function findEmployeeByLogin(loginOrEmail: string) {
  const normalized = loginOrEmail.trim().toLowerCase();
  const row = await prisma.employee.findFirst({
    where: {
      active: true,
      OR: [{ login: normalized }, { email: normalized }]
    }
  });
  return row ? employeeFromRow(row) : null;
}

export async function findEmployeeById(id: string) {
  const row = await prisma.employee.findUnique({ where: { id } });
  return row && row.active ? employeeFromRow(row) : null;
}

export async function getKnowledgeArticles() {
  const rows = await prisma.knowledgeArticle.findMany({
    orderBy: { updatedAt: "desc" }
  });
  return rows.map(knowledgeArticleFromRow);
}

export async function getKnowledgeArticleBySlug(slug: string) {
  const row = await prisma.knowledgeArticle.findUnique({ where: { slug } });
  return row ? knowledgeArticleFromRow(row) : null;
}

export async function saveKnowledgeArticle(
  input: Partial<KnowledgeArticleRecord> &
    Pick<KnowledgeArticleRecord, "title" | "content" | "category" | "status"> & {
      audience?: EmployeeRole[];
      updatedBy?: string;
    }
) {
  const timestamp = nowIso();
  const id = input.id ?? randomUUID();
  const existing = input.id ? await prisma.knowledgeArticle.findUnique({ where: { id } }) : null;
  const slug = await createUniqueArticleSlug(input.title, id, input.slug?.trim() || existing?.slug || input.title);

  const nextRecord: KnowledgeArticleRecord = {
    id,
    title: input.title.trim(),
    slug,
    category: input.category.trim(),
    summary: input.summary?.trim() ?? "",
    content: input.content.trim(),
    status: input.status,
    audience:
      input.audience && input.audience.length > 0
        ? input.audience
        : ["owner", "admin", "manager", "editor", "support", "viewer"],
    updatedBy: input.updatedBy?.trim() || "admin",
    createdAt: existing?.createdAt.toISOString() ?? timestamp,
    updatedAt: timestamp
  };

  await prisma.knowledgeArticle.upsert({
    where: { id },
    update: {
      title: nextRecord.title,
      slug: nextRecord.slug,
      category: nextRecord.category,
      summary: nextRecord.summary,
      content: nextRecord.content,
      status: nextRecord.status,
      audience: nextRecord.audience,
      updatedBy: nextRecord.updatedBy
    },
    create: {
      id: nextRecord.id,
      title: nextRecord.title,
      slug: nextRecord.slug,
      category: nextRecord.category,
      summary: nextRecord.summary,
      content: nextRecord.content,
      status: nextRecord.status,
      audience: nextRecord.audience,
      updatedBy: nextRecord.updatedBy
    }
  });

  return nextRecord;
}

export async function deleteKnowledgeArticle(id: string) {
  await prisma.knowledgeArticle.delete({ where: { id } });
}

export async function getAdminWorkspaceSnapshot() {
  const [employees, knowledgeArticles] = await Promise.all([getEmployees(), getKnowledgeArticles()]);
  return { employees, knowledgeArticles };
}
