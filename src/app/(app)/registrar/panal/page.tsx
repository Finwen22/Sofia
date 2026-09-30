import { PageHeader } from "@/components/PageHeader";
import { requireBaby } from "@/lib/session";
import { diasDesde, toLocalInput } from "@/lib/time";
import { PanalForm } from "./PanalForm";

export const metadata = { title: "Pañal · Sofía" };

export default async function Page() {
  const { baby } = await requireBaby();
  return (
    <>
      <PageHeader eyebrow="Pañal" title="Cambio de pañal" back="/" />
      <PanalForm familyId={baby.family_id} ahora={toLocalInput()} diasDeVida={diasDesde(baby.birth_at)} />
    </>
  );
}
