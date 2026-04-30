import { LegalSections, StoreShell } from "@/components/storefront-db";

export default function LocalizedOfferPage() {
  return (
    <StoreShell>
      <LegalSections titleKey="Shell.offer" />
    </StoreShell>
  );
}

