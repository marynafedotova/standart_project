import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { EmployeeRecord, EmployeeRole, KnowledgeArticleRecord, KnowledgeArticleStatus } from "@/lib/admin-workspace-shared";

type AdminWorkspaceData = {
  employees: EmployeeRecord[];
  knowledgeArticles: KnowledgeArticleRecord[];
};

const STORAGE_DIR = process.env.VERCEL ? join(tmpdir(), "standard-shop-admin") : join(process.cwd(), "data");
const STORAGE_PATH = join(STORAGE_DIR, "admin-workspace.json");

const DEFAULT_DATA: AdminWorkspaceData = {
  employees: [],
  knowledgeArticles: []
};

async function ensureStorage() {
  await mkdir(STORAGE_DIR, { recursive: true });

  try {
    await readFile(STORAGE_PATH, "utf8");
  } catch {
    await writeFile(STORAGE_PATH, JSON.stringify(DEFAULT_DATA, null, 2), "utf8");
  }
}

async function readWorkspace(): Promise<AdminWorkspaceData> {
  await ensureStorage();
  const raw = await readFile(STORAGE_PATH, "utf8");

  try {
    const parsed = JSON.parse(raw) as Partial<AdminWorkspaceData>;
    return {
      employees: Array.isArray(parsed.employees) ? parsed.employees : [],
      knowledgeArticles: Array.isArray(parsed.knowledgeArticles) ? parsed.knowledgeArticles : []
    };
  } catch {
    return DEFAULT_DATA;
  }
}

async function writeWorkspace(data: AdminWorkspaceData) {
  await ensureStorage();
  await writeFile(STORAGE_PATH, JSON.stringify(data, null, 2), "utf8");
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

export async function getEmployees() {
  const data = await readWorkspace();
  return [...data.employees].sort((a, b) => a.name.localeCompare(b.name, "uk"));
}

export async function saveEmployee(input: Partial<EmployeeRecord> & Pick<EmployeeRecord, "name" | "email" | "role">) {
  const data = await readWorkspace();
  const timestamp = nowIso();
  const id = input.id ?? randomUUID();

  const nextRecord: EmployeeRecord = {
    id,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    role: input.role,
    department: input.department?.trim() ?? "",
    notes: input.notes?.trim() ?? "",
    active: input.active ?? true,
    createdAt: data.employees.find((item) => item.id === id)?.createdAt ?? timestamp,
    updatedAt: timestamp
  };

  data.employees = [...data.employees.filter((item) => item.id !== id), nextRecord];
  await writeWorkspace(data);
  return nextRecord;
}

export async function deleteEmployee(id: string) {
  const data = await readWorkspace();
  data.employees = data.employees.filter((item) => item.id !== id);
  await writeWorkspace(data);
}

export async function getKnowledgeArticles() {
  const data = await readWorkspace();
  return [...data.knowledgeArticles].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function saveKnowledgeArticle(
  input: Partial<KnowledgeArticleRecord> &
    Pick<KnowledgeArticleRecord, "title" | "content" | "category" | "status"> & {
      audience?: EmployeeRole[];
      updatedBy?: string;
    }
) {
  const data = await readWorkspace();
  const timestamp = nowIso();
  const id = input.id ?? randomUUID();

  const nextRecord: KnowledgeArticleRecord = {
    id,
    title: input.title.trim(),
    slug: slugifyArticle(input.slug?.trim() || input.title),
    category: input.category.trim(),
    summary: input.summary?.trim() ?? "",
    content: input.content.trim(),
    status: input.status,
    audience:
      input.audience && input.audience.length > 0
        ? input.audience
        : ["owner", "admin", "manager", "editor", "support", "viewer"],
    updatedBy: input.updatedBy?.trim() || "admin",
    createdAt: data.knowledgeArticles.find((item) => item.id === id)?.createdAt ?? timestamp,
    updatedAt: timestamp
  };

  data.knowledgeArticles = [...data.knowledgeArticles.filter((item) => item.id !== id), nextRecord];
  await writeWorkspace(data);
  return nextRecord;
}

export async function deleteKnowledgeArticle(id: string) {
  const data = await readWorkspace();
  data.knowledgeArticles = data.knowledgeArticles.filter((item) => item.id !== id);
  await writeWorkspace(data);
}

export async function getAdminWorkspaceSnapshot() {
  return readWorkspace();
}
