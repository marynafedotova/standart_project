import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ShopStateProvider } from "@/components/shop-state";

export const metadata: Metadata = {
  title: "Standard Shop Template",
  description: "Адаптируемый шаблон интернет-магазина на React и Next.js."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="uk">
      <body>
        <ShopStateProvider>{children}</ShopStateProvider>
      </body>
    </html>
  );
}
