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
          <span className="eyebrow">Клиенты</span>
          <h1>База клиентов магазина</h1>
        </div>
        <div className="actions">
          <a href={exportUi.allHref} className="button secondary">Excel: все</a>
          <a
            href={exportUi.hasSelection ? exportUi.selectedHref : undefined}
            className="button secondary"
            aria-disabled={!exportUi.hasSelection}
          >
            Excel: выбранные
          </a>
        </div>
      </div>

      <div className="panel toolbar">
        <label className="checkbox">
          <input type="checkbox" checked={exportUi.allSelected} onChange={() => exportUi.toggleAll()} />
          <span>Выбрать все</span>
        </label>
        {exportUi.hasSelection ? <span>{exportUi.selectedIds.length} выбрано</span> : <span>Можно выбрать отдельных клиентов</span>}
      </div>

      <div className="panel tableWrap">
        <table>
          <thead>
            <tr>
              <th />
              <th>Клиент</th>
              <th>Телефон</th>
              <th>Email</th>
              <th>Заказов</th>
              <th>Номера заказов</th>
              <th>Потрачено</th>
              <th>Детали</th>
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
                    aria-label={`Выбрать клиента ${client.name}`}
                  />
                </td>
                <td>{client.name}</td>
                <td>{client.phone}</td>
                <td>{client.email}</td>
                <td>{client.orderIds.length}</td>
                <td>{client.orderNumbers.map((number) => `#${number}`).join(", ") || "—"}</td>
                <td>{client.totalSpent} грн</td>
                <td>
                  <Link href={`/admin/clients/${client.id}`}>Открыть</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {clients.length === 0 ? <p>Клиентов пока нет.</p> : null}
      </div>
    </section>
  );
}
