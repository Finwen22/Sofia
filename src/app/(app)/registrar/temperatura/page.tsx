import { PageHeader } from "@/components/PageHeader";
import { requireBaby } from "@/lib/session";
import { diasDesde, toLocalInput } from "@/lib/time";
import { cargarMedicamentos } from "../../salud/medicamentos/datos";
import { MedEstado } from "../../salud/medicamentos/MedEstado";
import { TempForm } from "./TempForm";

export const metadata = { title: "Temperatura · Sofía" };

export default async function Page() {
  const { supabase, baby } = await requireBaby();
  const { meds, porMed, nombres } = await cargarMedicamentos(supabase, baby.id, baby.family_id);
  // Antitérmicos y otros "si hace falta": cuándo fue la última y desde cuándo se puede repetir.
  const siHaceFalta = meds.filter((m) => m.kind === "si_hace_falta");

  return (
    <>
      <PageHeader eyebrow="Salud" title="Temperatura y síntomas" back="/" />
      <TempForm ahora={toLocalInput()} diasDeVida={diasDesde(baby.birth_at)} telPediatra={baby.pediatrician_phone} />
      {siHaceFalta.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="eyebrow mt-4">Medicamentos “si hace falta”</h2>
          <p className="text-[13px] text-faint">Dáselos solo con indicación del pediatra.</p>
          {siHaceFalta.map((m) => (
            <MedEstado key={m.id} med={m} doses={porMed(m.id)} nombres={nombres} compacto />
          ))}
        </section>
      )}
    </>
  );
}
