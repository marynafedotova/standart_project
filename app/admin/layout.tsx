import { AdminShell } from "@/components/admin-ui";
import type { ReactNode } from "react";

export default function AdminLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return <AdminShell>{children}</AdminShell>;
}
