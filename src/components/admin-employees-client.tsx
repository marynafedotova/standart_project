"use client";

import { useState } from "react";
import { LogoutButton } from "@/components/admin-forms";
import { EMPLOYEE_ROLE_OPTIONS, type EmployeeRecord, type EmployeeRole } from "@/lib/admin-workspace-shared";

type EmployeeFormState = {
  id?: string;
  name: string;
  email: string;
  role: EmployeeRole;
  department: string;
  notes: string;
  active: boolean;
};

const EMPTY_FORM: EmployeeFormState = {
  name: "",
  email: "",
  role: "viewer",
  department: "",
  notes: "",
  active: true
};

export function AdminEmployeesClient({ initialEmployees }: { initialEmployees: EmployeeRecord[] }) {
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
    setError("");
    setMessage("");

    const response = await fetch(`/api/admin/employees?id=${id}`, { method: "DELETE" });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Не вдалося видалити співробітника.");
      return;
    }

    setEmployees(data.employees);
    if (form.id === id) {
      setForm(EMPTY_FORM);
    }
    setMessage("Співробітника видалено.");
  }

  function handleEdit(employee: EmployeeRecord) {
    setForm({
      id: employee.id,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      department: employee.department,
      notes: employee.notes,
      active: employee.active
    });
    setMessage("");
    setError("");
  }

  return (
    <section className="adminPage">
      <div className="adminHeader">
        <div>
          <span className="eyebrow">Команда</span>
          <h1>Співробітники та рівні доступу</h1>
        </div>
        <LogoutButton />
      </div>

      <div className="splitAdminLayout">
        <form className="panel formGrid" onSubmit={handleSubmit}>
          <div>
            <span className="eyebrow">Ролі</span>
            <h2>{form.id ? "Редагування співробітника" : "Новий співробітник"}</h2>
          </div>

          <label className="formField">
            <span>Ім'я</span>
            <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
          </label>

          <label className="formField">
            <span>Email</span>
            <input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
          </label>

          <label className="formField">
            <span>Рівень доступу</span>
            <select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as EmployeeRole }))}>
              {EMPLOYEE_ROLE_OPTIONS.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </label>

          <label className="formField">
            <span>Відділ</span>
            <input value={form.department} onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))} />
          </label>

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
            {form.id ? (
              <button type="button" className="button secondary" onClick={() => setForm(EMPTY_FORM)}>
                Скасувати редагування
              </button>
            ) : null}
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
                      <h3>{employee.name}</h3>
                      <p>{employee.email}</p>
                    </div>
                    <span className={`statusBadge ${employee.active ? "statusActive" : "statusMuted"}`}>
                      {employee.active ? "Активний" : "Вимкнено"}
                    </span>
                  </div>

                  <p>
                    <strong>{roleMeta?.label ?? employee.role}</strong> · {employee.department || "Без відділу"}
                  </p>
                  <p>{roleMeta?.description}</p>
                  {employee.notes ? <p>{employee.notes}</p> : null}

                  <div className="actions">
                    <button type="button" className="button secondary" onClick={() => handleEdit(employee)}>
                      Редагувати
                    </button>
                    <button type="button" className="button ghostDanger" onClick={() => handleDelete(employee.id)}>
                      Видалити
                    </button>
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
