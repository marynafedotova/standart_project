import { LegalSections, StoreShell } from "@/components/storefront-db-v2";

export default function LocalizedPrivacyPage() {
  return (
    <StoreShell>
      <LegalSections titleKey="Shell.privacy" />
    </StoreShell>
  );
}

