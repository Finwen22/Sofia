import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/DeleteButton";
import { PageHeader } from "@/components/PageHeader";
import { requireBaby } from "@/lib/session";
import { fechaCorta, hhmm, toDateInput, toLocalInput } from "@/lib/time";
import type { Medication, MedicationDose } from "@/lib/types";
import { borrarDosis, borrarMedicamento, cambiarActivo } from "../actions";
import { DosisOtraHora } from "./DosisOtraHora";
import { MedForm } from "../MedForm";

export const metadata = { title: "Medicamento · Sofía" };

export default async function Page({ params }: PageProps<"/salud/medicamentos/[id]">) {
  const { id } = await params;
  const { supabase, baby } = await requireBaby();
  const [{ data: med }, { data: doses }, { data: miembros }] = await Promise.all([
    supabase.from("medications").select("*").eq("id", id).eq("baby_id", baby.id).maybeSingle<Medication>(),
    supabase.from("medication_doses").select("*").eq("medication_id", id).order("given_at", { ascending: false }).limit(30).returns<MedicationDose[]>(),
    supabase.from("family_members").select("user_id, display_name").eq("family_id", baby.family_id),
  ]);
  if (!med) notFound();
  const nombres: Record<string, string> = Object.fromEntries((miembros ?? []).map((m) => [m.user_id, m.display_name]));

  return (
    <>
      <PageHeader eyebrow="Medicamento" title={med.name} back="/salud/medicamentos" />

      <section className="flex flex-col gap-2">
        <h2 className="eyebrow">Dosis dadas</h2>
        <DosisOtraHora medId={med.id} ahora={toLocalInput()} />
        {(doses ?? []).length === 0 ? (
          <p className="text-[15px] text-muted">Todavía no hay dosis registradas.</p>
        ) : (
          <ul className="card px-4">
            {(doses ?? []).map((d) => (
              <li key={d.id} className="flex items-center gap-3 border-b border-line py-1.5 last:border-0">
                <span className="flex flex-1 flex-col">
                  <span className="text-[15px] font-semibold">{fechaCorta(d.given_at)} · {hhmm(d.given_at)}</span>
                  {d.created_by && nombres[d.created_by] && <span className="text-[13px] text-muted">{nombres[d.created_by]}</span>}
                </span>
                <DeleteButton action={borrarDosis} fields={{ id: d.id }} pregunta="¿Borrar esta dosis?" />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="eyebrow mt-4">Datos</h2>
        <MedForm med={med} hoy={toDateInput()} />
      </section>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <form action={cambiarActivo}>
          <input type="hidden" name="id" value={med.id} />
          <input type="hidden" name="active" value={med.active ? "0" : "1"} />
          <button className="btn-ghost h-12 text-[15px]">{med.active ? "Pausar" : "Reactivar"}</button>
        </form>
        <DeleteButton
          action={borrarMedicamento}
          fields={{ id: med.id }}
          pregunta={`¿Borrar ${med.name} y todo su historial de dosis? Si solo terminó el tratamiento, mejor pausalo.`}
          className="h-12 w-full rounded-2xl text-[15px] font-semibold text-alert"
        >
          Borrar
        </DeleteButton>
      </div>
    </>
  );
}
