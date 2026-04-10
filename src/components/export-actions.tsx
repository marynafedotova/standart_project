"use client";

import { useMemo, useState } from "react";

export function useSelectableExport(ids: string[], entity: "products" | "orders" | "clients") {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const allSelected = ids.length > 0 && selectedIds.length === ids.length;
  const hasSelection = selectedIds.length > 0;

  const selectedHref = useMemo(() => {
    const params = new URLSearchParams({ mode: "selected" });
    selectedIds.forEach((id) => params.append("id", id));
    return `/api/export/${entity}?${params.toString()}`;
  }, [entity, selectedIds]);

  return {
    selectedIds,
    allSelected,
    hasSelection,
    toggleOne(id: string) {
      setSelectedIds((current) =>
        current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
      );
    },
    toggleAll() {
      setSelectedIds((current) => (current.length === ids.length ? [] : [...ids]));
    },
    clear() {
      setSelectedIds([]);
    },
    allHref: `/api/export/${entity}?mode=all`,
    selectedHref
  };
}
