"use client";

import Link from "next/link";
import { LogoutButton } from "@/components/admin-forms";
import { EMPLOYEE_ROLE_OPTIONS, type EmployeeRecord, type EmployeeRole } from "@/lib/admin-workspace-shared";

const ROLE_ORDER: EmployeeRole[] = ["owner", "admin", "manager", "editor", "support", "viewer"];

function getRoleWeight(role: EmployeeRole) {
  const index = ROLE_ORDER.indexOf(role);
  return index === -1 ? ROLE_ORDER.length : index;
}

function getRoleLabel(role: EmployeeRole) {
  return EMPLOYEE_ROLE_OPTIONS.find((item) => item.value === role)?.label ?? role;
}

function sortEmployees(employees: EmployeeRecord[]) {
  return [...employees].sort((a, b) => {
    const roleDiff = getRoleWeight(a.role) - getRoleWeight(b.role);
    if (roleDiff !== 0) {
      return roleDiff;
    }

    return `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, "uk");
  });
}

function groupReports(employees: EmployeeRecord[]) {
  const map = new Map<string, EmployeeRecord[]>();

  for (const employee of employees) {
    if (!employee.managerId) {
      continue;
    }

    const current = map.get(employee.managerId) ?? [];
    current.push(employee);
    map.set(employee.managerId, current);
  }

  for (const [managerId, reports] of map.entries()) {
    map.set(managerId, sortEmployees(reports));
  }

  return map;
}

export function AdminEmployeesStructureClient({ initialEmployees }: { initialEmployees: EmployeeRecord[] }) {
  const visibleEmployees = sortEmployees(initialEmployees.filter((employee) => employee.active !== false));
  const employeeById = new Map(visibleEmployees.map((employee) => [employee.id, employee]));
  const reportsByManagerId = groupReports(visibleEmployees);
  const roots = visibleEmployees.filter((employee) => !employee.managerId || !employeeById.has(employee.managerId));
  const rootEmployees = roots.length > 0 ? roots : visibleEmployees;

  function renderEmployeeNode(employee: EmployeeRecord, depth = 0, trail = new Set<string>()) {
    const reports = reportsByManagerId.get(employee.id) ?? [];
    const hasCycle = trail.has(employee.id);
    const nextTrail = new Set(trail);
    nextTrail.add(employee.id);

    return (
      <article key={`${employee.id}-${depth}`} className="orgPersonCard" style={{ marginLeft: depth ? Math.min(depth * 28, 84) : 0 }}>
        <div className="orgPersonTop">
          <strong>
            {employee.lastName} {employee.firstName}
          </strong>
          <span className={`statusBadge ${employee.isManager ? "statusActive" : "statusMuted"}`}>
            {employee.isManager ? "Керівник" : "Співробітник"}
          </span>
        </div>

        <p>{employee.position || "Посада не вказана"}</p>

        <div className="orgPersonMeta">
          <span>Роль: {getRoleLabel(employee.role)}</span>
          <span>Відділ: {employee.department || "Без відділу"}</span>
          <span>Email: {employee.email}</span>
          {employee.phone ? <span>Телефон: {employee.phone}</span> : null}
          {employee.birthDate ? <span>Дата народження: {employee.birthDate}</span> : null}
        </div>

        <div className="actions">
          <Link href={`/admin/employees?edit=${employee.id}`} className="button secondary">
            Редагувати
          </Link>
        </div>

        {hasCycle ? <p className="errorText">У структурі знайдено циклічне підпорядкування.</p> : null}

        {!hasCycle && reports.length > 0 ? (
          <div className="stackList">
            {reports.map((report) => renderEmployeeNode(report, depth + 1, nextTrail))}
          </div>
        ) : null}
      </article>
    );
  }

  return (
    <section className="adminPage">
      <div className="adminHeader">
        <div>
          <span className="eyebrow">Команда</span>
          <h1>Структура компанії</h1>
          <p>Схема будується з реального підпорядкування: у картці співробітника вкажіть, чи може він бути керівником, і виберіть безпосереднього керівника.</p>
        </div>
        <LogoutButton />
      </div>

      <div className="panel orgHeroPanel">
        <div className="orgHeroHeader">
          <div>
            <span className="eyebrow">Оргструктура</span>
            <h2>Керівники та підлеглі</h2>
          </div>
          <div className="actions">
            <Link href="/admin/employees/list" className="button secondary">
              Список співробітників
            </Link>
            <Link href="/admin/employees" className="button secondary">
              Додати співробітника
            </Link>
          </div>
        </div>

        <div className="stackList">
          {rootEmployees.map((employee) => renderEmployeeNode(employee))}
          {visibleEmployees.length === 0 ? <p>Поки що немає співробітників для побудови структури.</p> : null}
        </div>
      </div>
    </section>
  );
}
