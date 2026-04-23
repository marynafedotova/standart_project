import { LegalSections, StoreShell } from "@/components/storefront-db-v2";

export default function LocalizedOfferPage() {
  return (
    <StoreShell>
      <LegalSections titleKey="Shell.offer" />
    </StoreShell>
  );
}

