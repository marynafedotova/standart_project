import { LegalSections, StoreShell } from "@/components/storefront-db";

export default function PrivacyPage() {
  return (
    <StoreShell>
      <LegalSections titleKey="Shell.privacy" />
    </StoreShell>
  );
}

