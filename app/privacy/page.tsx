import { LegalSections, StoreShell } from "@/components/storefront-db-v2";

export default function PrivacyPage() {
  return (
    <StoreShell>
      <LegalSections titleKey="Shell.privacy" />
    </StoreShell>
  );
}

