"use client";

import Link from "next/link";
import { LogoutButton } from "@/components/admin-forms";
import {
  ADMIN_PERMISSION_OPTIONS,
  EMPLOYEE_ROLE_OPTIONS,
  type AdminSectionPermission,
  type EmployeeRecord,
  type EmployeeRole
} from "@/lib/admin-workspace-shared";

function getRoleLabel(role: EmployeeRole) {
  return EMPLOYEE_ROLE_OPTIONS.find((item) => item.value === role)?.label ?? role;
}

function getPermissionLabel(permission: AdminSectionPermission) {
  return ADMIN_PERMISSION_OPTIONS.find((item) => item.value === permission)?.label ?? permission;
}

function csvCell(value: string | number | boolean | null | undefined) {
  const normalized = String(value ?? "").replace(/\r?\n/g, " ").trim();
  return `"${normalized.replace(/"/g, '""')}"`;
}

function buildEmployeesCsv(employees: EmployeeRecord[]) {
  const header = [
    "Прізвище",
    "Ім'я",
    "Посада",
    "Відділ",
    "Роль",
    "Телефон",
    "Email",
    "Логін",
    "Дата народження",
    "Статус",
    "Доступи"
  ];

  const rows = employees.map((employee) => [
    employee.lastName,
    employee.firstName,
    employee.position,
    employee.department,
    getRoleLabel(employee.role),
    employee.phone,
    employee.email,
    employee.login,
    employee.birthDate,
    employee.active === false ? "Вимкнено" : "Активний",
    employee.permissions.map(getPermissionLabel).join(", ")
  ]);

  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

export function AdminEmployeesListClient({ employees }: { employees: EmployeeRecord[] }) {
  function handleExport() {
    const csv = buildEmployeesCsv(employees);
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `employees-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="adminPage">
      <div className="adminHeader">
        <div>
          <span className="eyebrow">Команда</span>
          <h1>Список співробітників</h1>
          <p>Повний перелік співробітників з переходом до редагування та вивантаженням у CSV.</p>
        </div>
        <div className="actions">
          <button type="button" className="button secondary" onClick={handleExport} disabled={employees.length === 0}>
            Вивантажити список
          </button>
          <LogoutButton />
        </div>
      </div>

      <div className="adminHeader">
        <div className="actions">
          <Link href="/admin/employees" className="button secondary">
            Додати співробітника
          </Link>
          <Link href="/admin/employees/structure" className="button secondary">
            Структура компанії
          </Link>
        </div>
      </div>

      <div className="panel tableWrap">
        <table>
          <thead>
            <tr>
              <th>Співробітник</th>
              <th>Посада</th>
              <th>Відділ</th>
              <th>Роль</th>
              <th>Контакти</th>
              <th>Статус</th>
              <th>Дія</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.id}>
                <td>
                  <strong>
                    {employee.lastName} {employee.firstName}
                  </strong>
                  <br />
                  <span>{employee.login}</span>
                </td>
                <td>{employee.position || "Без посади"}</td>
                <td>{employee.department || "Без відділу"}</td>
                <td>{getRoleLabel(employee.role)}</td>
                <td>
                  {employee.email}
                  {employee.phone ? (
                    <>
                      <br />
                      {employee.phone}
                    </>
                  ) : null}
                </td>
                <td>
                  <span className={`statusBadge ${employee.active === false ? "statusMuted" : "statusActive"}`}>
                    {employee.active === false ? "Вимкнено" : "Активний"}
                  </span>
                </td>
                <td>
                  <Link href={`/admin/employees?edit=${employee.id}`} className="button secondary">
                    Редагувати
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {employees.length === 0 ? <p>Поки що співробітників не додано.</p> : null}
      </div>
    </section>
  );
}
