import { LegalSections, StoreShell } from "@/components/storefront-db";

export default function LocalizedPrivacyPage() {
  return (
    <StoreShell>
      <LegalSections titleKey="Shell.privacy" />
    </StoreShell>
  );
}

