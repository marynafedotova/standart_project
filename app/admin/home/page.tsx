import { AdminHomeHeroClient } from "@/components/admin-home-hero-client";
import { requireAdmin } from "@/lib/auth";
import { getHeroSettings } from "@/lib/store";

export default async function AdminHomePage() {
  await requireAdmin();
  const heroSettings = await getHeroSettings();

  return <AdminHomeHeroClient initialSettings={heroSettings} />;
}
