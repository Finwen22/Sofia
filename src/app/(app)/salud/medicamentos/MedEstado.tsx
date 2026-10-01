import Link from "next/link";
import { Icon } from "@/components/Icon";
import { describirPauta, estadoMed } from "@/lib/medicamentos";
import { hhmm } from "@/lib/time";
import type { Medication, MedicationDose } from "@/lib/types";
import { DarDosis } from "./DarDosis";

/** Tarjeta de un medicamento con lo que toca hoy y el botón para darlo. */
export function MedEstado({ med, doses, nombres, compacto = false }: { med: Medication; doses: MedicationDose[]; nombres: Record<string, string>; compacto?: boolean }) {
  const e = estadoMed(med, doses);
  const quien = (d?: MedicationDose) => (d?.created_by && nombres[d.created_by]) || "";

  let linea: React.ReactNode;
  let urgente = false;
  if (e.kind === "diaria") {
    urgente = e.pendiente;
    linea = (
      <span className="flex flex-wrap gap-1.5">
        {e.slots.map((s) => (
          <span
            key={s.hora}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-semibold ${
              s.estado === "dada" ? "bg-soft text-soft-ink" : s.estado === "pendiente" ? "bg-alert-bg text-alert" : "border border-line text-muted"
            }`}
          >
            {s.estado === "dada" && <Icon name="check" size={14} stroke={2.4} />}
            {s.hora}
            {s.dada && <span className="font-normal">· {hhmm(s.dada.given_at)}{quien(s.dada) ? ` ${quien(s.dada)}` : ""}</span>}
          </span>
        ))}
      </span>
    );
  } else if (e.kind === "intervalo") {
    urgente = e.atrasada;
    linea = e.terminado
      ? "Tratamiento terminado"
      : !e.ultima
        ? "Registrá la primera dosis y la app calcula las siguientes"
        : `Última ${hhmm(e.ultima.given_at)}${quien(e.ultima) ? ` (${quien(e.ultima)})` : ""} · ${e.atrasada ? "tocaba" : "toca"} a las ${hhmm(e.proxima!)}`;
  } else {
    linea = e.ultima
      ? `Última ${hhmm(e.ultima.given_at)}${quien(e.ultima) ? ` (${quien(e.ultima)})` : ""}${e.desde ? ` · no antes de las ${hhmm(e.desde)}` : ""}`
      : "Sin dosis registradas";
  }

  const mostrarBoton = !(e.kind === "diaria" && (e.terminado || e.slots.every((s) => s.estado === "dada"))) && !(e.kind === "intervalo" && e.terminado);

  return (
    <div className={`card flex flex-col gap-2.5 p-4 ${urgente ? "border-alert/60" : ""}`}>
      <Link href={`/salud/medicamentos/${med.id}`} className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-soft text-soft-ink">
          <Icon name="pill" size={20} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[15px] font-semibold">
            {med.name}
            {med.dose && <span className="font-normal text-muted"> · {med.dose}</span>}
          </span>
          {!compacto && <span className="text-[13px] text-faint">{describirPauta(med)}</span>}
        </span>
        <Icon name="chev" size={18} className="mt-1 text-muted" />
      </Link>
      <div className="text-[13px] leading-snug text-muted">{linea}</div>
      {mostrarBoton && <DarDosis medId={med.id} compacto={compacto} />}
    </div>
  );
}
