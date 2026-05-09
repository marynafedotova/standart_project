"use client";

import Link from "next/link";
import type { DbClient } from "@/lib/json-db";
import { useSelectableExport } from "@/components/export-actions";

export function AdminClientsClient({ clients }: { clients: DbClient[] }) {
  const exportUi = useSelectableExport(
    clients.map((client) => client.id),
    "clients"
  );

  return (
    <section className="adminPage">
      <div className="adminHeader">
        <div>
          <span className="eyebrow">Клієнти</span>
          <h1>База клієнтів магазину</h1>
        </div>
        <div className="actions">
          <a href={exportUi.allHref} className="button secondary">Excel: усі</a>
          <a
            href={exportUi.hasSelection ? exportUi.selectedHref : undefined}
            className="button secondary"
            aria-disabled={!exportUi.hasSelection}
          >
            Excel: вибрані
          </a>
        </div>
      </div>

      <div className="panel toolbar">
        <label className="checkbox">
          <input type="checkbox" checked={exportUi.allSelected} onChange={() => exportUi.toggleAll()} />
          <span>Вибрати всі</span>
        </label>
        {exportUi.hasSelection ? <span>Вибрано: {exportUi.selectedIds.length}</span> : <span>Можна вибрати окремих клієнтів для експорту</span>}
      </div>

      <div className="panel tableWrap">
        <table>
          <thead>
            <tr>
              <th />
              <th>Клієнт</th>
              <th>Телефон</th>
              <th>Email</th>
              <th>Замовлень</th>
              <th>Номери замовлень</th>
              <th>Витрачено</th>
              <th>Деталі</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={exportUi.selectedIds.includes(client.id)}
                    onChange={() => exportUi.toggleOne(client.id)}
                    aria-label={`Вибрати клієнта ${client.name}`}
                  />
                </td>
                <td>{client.name}</td>
                <td>{client.phone}</td>
                <td>{client.email}</td>
                <td>{client.orderIds.length}</td>
                <td>{client.orderNumbers.map((number) => `#${number}`).join(", ") || "—"}</td>
                <td>{client.totalSpent} грн</td>
                <td>
                  <Link href={`/admin/clients/${client.id}`}>Відкрити</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {clients.length === 0 ? <p>Клієнтів поки немає.</p> : null}
      </div>
    </section>
  );
}
