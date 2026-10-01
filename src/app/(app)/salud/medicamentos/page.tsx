import Link from "next/link";
import { Icon } from "@/components/Icon";
import { PageHeader } from "@/components/PageHeader";
import { requireBaby } from "@/lib/session";
import { toDateInput } from "@/lib/time";
import { cargarMedicamentos } from "./datos";
import { MedEstado } from "./MedEstado";

export const metadata = { title: "Medicamentos · Sofía" };

export default async function Page() {
  const { supabase, baby } = await requireBaby();
  const { meds, porMed, nombres } = await cargarMedicamentos(supabase, baby.id, baby.family_id, { soloActivos: false });
  const hoy = toDateInput();
  const vigentes = meds.filter((m) => m.active && (!m.ends_on || m.ends_on >= hoy));
  const anteriores = meds.filter((m) => !vigentes.includes(m));

  return (
    <>
      <PageHeader
        eyebrow="Salud"
        title="Medicamentos"
        back="/salud"
        action={
          <Link href="/salud/medicamentos/nuevo" aria-label="Agregar medicamento" className="mb-1 flex size-11 items-center justify-center rounded-2xl bg-accent text-on-accent">
            <Icon name="plus" size={22} stroke={2} />
          </Link>
        }
      />
      {vigentes.length === 0 ? (
        <div className="card flex flex-col gap-3 p-5">
          <p className="text-[15px] text-muted">
            Cargá lo que indicó el pediatra (por ejemplo, la vitamina D diaria) y la app les avisa a los dos cuando toca y muestra quién se la dio.
          </p>
          <Link href="/salud/medicamentos/nuevo" className="btn-primary h-12 text-[15px]">Agregar medicamento</Link>
        </div>
      ) : (
        vigentes.map((m) => <MedEstado key={m.id} med={m} doses={porMed(m.id)} nombres={nombres} />)
      )}

      {anteriores.length > 0 && (
        <details className="card px-4 py-3">
          <summary className="cursor-pointer text-[14px] font-semibold text-muted">Terminados o pausados ({anteriores.length})</summary>
          <ul className="mt-2 flex flex-col">
            {anteriores.map((m) => (
              <li key={m.id}>
                <Link href={`/salud/medicamentos/${m.id}`} className="flex items-center justify-between border-t border-line py-2.5 text-[15px]">
                  {m.name}
                  <span className="text-[13px] text-muted">{m.active ? "Terminado" : "Pausado"}</span>
                </Link>
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  );
}
