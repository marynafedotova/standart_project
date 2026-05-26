"use client";

import Link from "next/link";
import { LogoutButton } from "@/components/admin-forms";
import { EMPLOYEE_ROLE_OPTIONS, type EmployeeRecord, type EmployeeRole } from "@/lib/admin-workspace-shared";

type DepartmentGroup = {
  name: string;
  members: EmployeeRecord[];
};

const ROLE_ORDER: EmployeeRole[] = ["owner", "admin", "manager", "editor", "support", "viewer"];

function getRoleWeight(role: EmployeeRole) {
  const index = ROLE_ORDER.indexOf(role);
  return index === -1 ? ROLE_ORDER.length : index;
}

function getRoleLabel(role: EmployeeRole) {
  return EMPLOYEE_ROLE_OPTIONS.find((item) => item.value === role)?.label ?? role;
}

function buildDepartments(employees: EmployeeRecord[]) {
  const map = new Map<string, EmployeeRecord[]>();

  for (const employee of employees) {
    const key = employee.department.trim() || "Без відділу";
    const current = map.get(key) ?? [];
    current.push(employee);
    map.set(key, current);
  }

  return [...map.entries()]
    .map(([name, members]) => ({
      name,
      members: [...members].sort((a, b) => {
        const roleDiff = getRoleWeight(a.role) - getRoleWeight(b.role);
        if (roleDiff !== 0) {
          return roleDiff;
        }

        return `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, "uk");
      })
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "uk"));
}

export function AdminEmployeesStructureClient({ initialEmployees }: { initialEmployees: EmployeeRecord[] }) {
  const activeEmployees = initialEmployees.filter((employee) => employee.active);
  const leadership = activeEmployees.filter((employee) => employee.role === "owner" || employee.role === "admin");
  const departments = buildDepartments(activeEmployees);

  return (
    <section className="adminPage">
      <div className="adminHeader">
        <div>
          <span className="eyebrow">Команда</span>
          <h1>Структура компанії</h1>
          <p>Схема будується автоматично зі створених співробітників, їхніх ролей, посад і відділів.</p>
        </div>
        <LogoutButton />
      </div>

      <div className="panel orgHeroPanel">
        <div className="orgHeroHeader">
          <div>
            <span className="eyebrow">Оргструктура</span>
            <h2>Керівний рівень</h2>
          </div>
          <Link href="/admin/employees" className="button secondary">
            До співробітників
          </Link>
        </div>

        <div className="orgLeadershipGrid">
          {leadership.map((employee) => (
            <article key={employee.id} className="orgPersonCard orgLeaderCard">
              <span className="statusBadge statusActive">{getRoleLabel(employee.role)}</span>
              <h3>
                {employee.lastName} {employee.firstName}
              </h3>
              <p>{employee.position || "Посада не вказана"}</p>
              <div className="orgPersonMeta">
                <span>{employee.department || "Без відділу"}</span>
                <span>{employee.email}</span>
                {employee.phone ? <span>{employee.phone}</span> : null}
              </div>
            </article>
          ))}

          {leadership.length === 0 ? <p>Поки що не додано активних керівників або адміністраторів.</p> : null}
        </div>
      </div>

      <div className="orgDepartmentGrid">
        {departments.map((department) => (
          <section key={department.name} className="panel orgDepartmentCard">
            <div className="orgDepartmentHeader">
              <div>
                <span className="eyebrow">Відділ</span>
                <h2>{department.name}</h2>
              </div>
              <span className="statusBadge statusMuted">{department.members.length} співробітників</span>
            </div>

            <div className="orgMembersGrid">
              {department.members.map((employee) => (
                <article key={employee.id} className="orgPersonCard">
                  <div className="orgPersonTop">
                    <strong>
                      {employee.lastName} {employee.firstName}
                    </strong>
                    <span className={`statusBadge ${employee.active ? "statusActive" : "statusMuted"}`}>{getRoleLabel(employee.role)}</span>
                  </div>

                  <p>{employee.position || "Посада не вказана"}</p>

                  <div className="orgPersonMeta">
                    <span>Логін: {employee.login}</span>
                    <span>Email: {employee.email}</span>
                    {employee.phone ? <span>Телефон: {employee.phone}</span> : null}
                    {employee.birthDate ? <span>Дата народження: {employee.birthDate}</span> : null}
                  </div>

                  {employee.notes ? <p className="orgNotes">{employee.notes}</p> : null}
                </article>
              ))}
            </div>
          </section>
        ))}

        {departments.length === 0 ? <p>Поки що немає активних співробітників для побудови структури.</p> : null}
      </div>
    </section>
  );
}
