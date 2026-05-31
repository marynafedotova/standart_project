"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogoutButton } from "@/components/admin-forms";
import {
  ADMIN_PERMISSION_OPTIONS,
  EMPLOYEE_ROLE_OPTIONS,
  type AdminSectionPermission,
  type EmployeeRecord,
  type EmployeeRole
} from "@/lib/admin-workspace-shared";

type EmployeeFormState = {
  id?: string;
  firstName: string;
  lastName: string;
  position: string;
  birthDate: string;
  phone: string;
  email: string;
  login: string;
  password: string;
  role: EmployeeRole;
  department: string;
  notes: string;
  permissions: AdminSectionPermission[];
  active: boolean;
};

const EMPTY_FORM: EmployeeFormState = {
  firstName: "",
  lastName: "",
  position: "",
  birthDate: "",
  phone: "",
  email: "",
  login: "",
  password: "",
  role: "viewer",
  department: "",
  notes: "",
  permissions: ["dashboard", "knowledge"],
  active: true
};

export function AdminEmployeesClient({
  initialEmployees,
  editEmployeeId
}: {
  initialEmployees: EmployeeRecord[];
  editEmployeeId?: string;
}) {
  const [employees, setEmployees] = useState(initialEmployees);
  const [form, setForm] = useState<EmployeeFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const response = await fetch("/api/admin/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Не вдалося зберегти співробітника.");
      setSaving(false);
      return;
    }

    setEmployees(data.employees);
    setForm(EMPTY_FORM);
    setMessage("Співробітника збережено.");
    setSaving(false);
  }

  async function handleDelete(id: string) {
    const response = await fetch(`/api/admin/employees?id=${id}`, { method: "DELETE" });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Не вдалося видалити співробітника.");
      return;
    }

    setEmployees(data.employees);
    if (form.id === id) setForm(EMPTY_FORM);
    setMessage("Співробітника видалено.");
  }

  function handleEdit(employee: EmployeeRecord) {
    setForm({
      id: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      position: employee.position,
      birthDate: employee.birthDate,
      phone: employee.phone,
      email: employee.email,
      login: employee.login,
      password: "",
      role: employee.role,
      department: employee.department,
      notes: employee.notes,
      permissions: employee.permissions,
      active: employee.active !== false
    });
  }

  useEffect(() => {
    if (!editEmployeeId) {
      return;
    }

    const employee = employees.find((item) => item.id === editEmployeeId);
    if (employee) {
      handleEdit(employee);
    }
  }, [editEmployeeId, employees]);

  function togglePermission(permission: AdminSectionPermission) {
    setForm((current) => ({
      ...current,
      permissions: current.permissions.includes(permission)
        ? current.permissions.filter((item) => item !== permission)
        : [...current.permissions, permission]
    }));
  }

  function changeRole(role: EmployeeRole) {
    const defaults = EMPLOYEE_ROLE_OPTIONS.find((item) => item.value === role)?.defaultPermissions ?? ["dashboard", "knowledge"];
    setForm((current) => ({ ...current, role, permissions: defaults }));
  }

  return (
    <section className="adminPage">
      <div className="adminHeader">
        <div>
          <span className="eyebrow">Команда</span>
          <h1>Співробітники та доступ до адмінки</h1>
        </div>
        <div className="actions">
          <Link href="/admin/employees/list" className="button secondary">
            Список співробітників
          </Link>
          <Link href="/admin/employees/structure" className="button secondary">
            Структура компанії
          </Link>
          <LogoutButton />
        </div>
      </div>

      <div className="splitAdminLayout">
        <form className="panel formGrid" onSubmit={handleSubmit}>
          <div>
            <span className="eyebrow">Профіль</span>
            <h2>{form.id ? "Редагування співробітника" : "Новий співробітник"}</h2>
          </div>

          <div className="splitGrid">
            <label className="formField">
              <span>Ім'я</span>
              <input value={form.firstName} onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))} required />
            </label>
            <label className="formField">
              <span>Прізвище</span>
              <input value={form.lastName} onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))} required />
            </label>
          </div>

          <div className="splitGrid">
            <label className="formField">
              <span>Посада</span>
              <input value={form.position} onChange={(event) => setForm((current) => ({ ...current, position: event.target.value }))} />
            </label>
            <label className="formField">
              <span>Дата народження</span>
              <input type="date" value={form.birthDate} onChange={(event) => setForm((current) => ({ ...current, birthDate: event.target.value }))} />
            </label>
          </div>

          <div className="splitGrid">
            <label className="formField">
              <span>Телефон</span>
              <input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
            </label>
            <label className="formField">
              <span>Email</span>
              <input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
            </label>
          </div>

          <div className="splitGrid">
            <label className="formField">
              <span>Логін</span>
              <input value={form.login} onChange={(event) => setForm((current) => ({ ...current, login: event.target.value }))} required />
            </label>
            <label className="formField">
              <span>{form.id ? "Новий пароль" : "Пароль"}</span>
              <input type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} placeholder={form.id ? "Залишити пустим, щоб не змінювати" : ""} required={!form.id} />
            </label>
          </div>

          <div className="splitGrid">
            <label className="formField">
              <span>Роль</span>
              <select value={form.role} onChange={(event) => changeRole(event.target.value as EmployeeRole)}>
                {EMPLOYEE_ROLE_OPTIONS.map((role) => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </label>
            <label className="formField">
              <span>Відділ</span>
              <input value={form.department} onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))} />
            </label>
          </div>

          <div className="formField">
            <span>Доступ до розділів</span>
            <div className="chips adminMultiChips">
              {ADMIN_PERMISSION_OPTIONS.map((permission) => (
                <button
                  key={permission.value}
                  type="button"
                  className={`chip ${form.permissions.includes(permission.value) ? "active" : ""}`}
                  onClick={() => togglePermission(permission.value)}
                >
                  {permission.label}
                </button>
              ))}
            </div>
          </div>

          <label className="formField">
            <span>Нотатки</span>
            <textarea rows={5} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
          </label>

          <label className="checkboxRow">
            <input type="checkbox" checked={form.active} onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))} />
            <span>Доступ активний</span>
          </label>

          {error ? <p className="errorText">{error}</p> : null}
          {message ? <p className="successText">{message}</p> : null}

          <div className="actions">
            <button type="submit" className="button primary" disabled={saving}>
              {saving ? "Зберігаємо..." : form.id ? "Оновити співробітника" : "Додати співробітника"}
            </button>
            {form.id ? <button type="button" className="button secondary" onClick={() => setForm(EMPTY_FORM)}>Скасувати</button> : null}
          </div>
        </form>

        <div className="panel">
          <div className="adminHeader">
            <div>
              <span className="eyebrow">Список</span>
              <h2>Команда</h2>
            </div>
          </div>

          <div className="stackList">
            {employees.map((employee) => {
              const roleMeta = EMPLOYEE_ROLE_OPTIONS.find((item) => item.value === employee.role);
              return (
                <article key={employee.id} className="panel softPanel">
                  <div className="adminHeader">
                    <div>
                      <h3>{employee.lastName} {employee.firstName}</h3>
                      <p>{employee.position || "Без посади"} · {employee.login}</p>
                    </div>
                    <span className={`statusBadge ${employee.active ? "statusActive" : "statusMuted"}`}>
                      {employee.active ? "Активний" : "Вимкнено"}
                    </span>
                  </div>
                  <p><strong>{roleMeta?.label ?? employee.role}</strong> · {employee.department || "Без відділу"}</p>
                  <p>{employee.email}{employee.phone ? ` · ${employee.phone}` : ""}</p>
                  <p>Доступи: {employee.permissions.map((permission) => ADMIN_PERMISSION_OPTIONS.find((item) => item.value === permission)?.label ?? permission).join(", ")}</p>
                  {employee.notes ? <p>{employee.notes}</p> : null}
                  <div className="actions">
                    <button type="button" className="button secondary" onClick={() => handleEdit(employee)}>Редагувати</button>
                    <button type="button" className="button ghostDanger" onClick={() => handleDelete(employee.id)}>Видалити</button>
                  </div>
                </article>
              );
            })}
            {employees.length === 0 ? <p>Поки що співробітників не додано.</p> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
