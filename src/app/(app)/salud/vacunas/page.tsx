import { PageHeader } from "@/components/PageHeader";
import { requireBaby } from "@/lib/session";
import { estadoVacunas } from "@/lib/resumen";
import { fechaDia, toDateInput } from "@/lib/time";
import type { VaccineDose } from "@/lib/types";
import { etiquetaEdad } from "@/lib/vacunas";
import { DosisRow } from "./DosisRow";

export const metadata = { title: "Vacunas · Sofía" };

export default async function Page() {
  const { supabase, baby } = await requireBaby();
  const { data } = await supabase.from("vaccine_doses").select("*").eq("baby_id", baby.id).returns<VaccineDose[]>();
  const lista = estadoVacunas(baby.birth_at, data ?? []);
  const grupos = [...new Set(lista.map((d) => d.meses))].map((m) => ({ meses: m, dosis: lista.filter((d) => d.meses === m) }));
  const hoy = toDateInput();

  return (
    <>
      <PageHeader eyebrow="Salud" title="Vacunas" back="/salud" />
      <p className="text-[14px] leading-relaxed text-muted">
        Calendario Nacional de Vacunación de Argentina. Es una guía: la libreta sanitaria y el pediatra mandan, y el calendario oficial puede cambiar.
      </p>
      {grupos.map((g) => (
        <section key={g.meses} className="flex flex-col gap-2">
          <div className="mt-3 flex items-baseline justify-between">
            <h2 className="eyebrow">{etiquetaEdad(g.meses)}</h2>
            <span className="text-[13px] text-faint">{fechaDia(g.dosis[0].fecha)}</span>
          </div>
          <ul className="card flex flex-col px-4">
            {g.dosis.map((d) => (
              <DosisRow
                key={d.code}
                code={d.code}
                vacuna={d.vacuna}
                dosis={d.dosis}
                nota={d.nota}
                estado={d.estado}
                aplicadaEl={d.aplicada ? fechaDia(d.aplicada.applied_on) : null}
                lote={d.aplicada?.lot ?? null}
                hoy={hoy}
              />
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
