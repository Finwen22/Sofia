import { PageHeader } from "@/components/PageHeader";
import { requireBaby } from "@/lib/session";
import { toDateInput } from "@/lib/time";
import { RecuerdoForm } from "../RecuerdoForm";

export const metadata = { title: "Nuevo recuerdo · Sofía" };

export default async function Page({ searchParams }: PageProps<"/diario/nuevo">) {
  const { supabase, baby } = await requireBaby();
  const { hito } = await searchParams;
  const { data } = await supabase.from("diary_entries").select("milestone").eq("baby_id", baby.id).not("milestone", "is", null);
  return (
    <>
      <PageHeader eyebrow="Diario" title="Nuevo recuerdo" back="/diario" />
      <RecuerdoForm
        familyId={baby.family_id}
        hoy={toDateInput()}
        nacio={toDateInput(new Date(baby.birth_at))}
        hitoInicial={typeof hito === "string" ? hito : null}
        hitosUsados={(data ?? []).map((d) => d.milestone as string)}
      />
    </>
  );
}
