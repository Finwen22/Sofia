import type { Medication, MedicationDose } from "@/lib/types";
import { fromLocalInput, hhmm, toDateInput } from "@/lib/time";

// Una dosis cuenta para un horario si se dio desde 3 h antes (igual que en la base).
const VENTANA_MS = 3 * 3600_000;

export type Slot = { hora: string; due: Date; dada?: MedicationDose; estado: "dada" | "pendiente" | "mas-tarde" };

export type EstadoMed =
  | { kind: "diaria"; slots: Slot[]; pendiente: boolean; terminado: boolean }
  | { kind: "intervalo"; ultima?: MedicationDose; proxima?: Date; atrasada: boolean; terminado: boolean }
  | { kind: "si_hace_falta"; ultima?: MedicationDose; desde?: Date };

/** Dosis ordenadas de más nueva a más vieja. */
export function estadoMed(m: Medication, doses: MedicationDose[], now = new Date()): EstadoMed {
  const hoy = toDateInput(now);
  const terminado = !!m.ends_on && hoy > m.ends_on;
  const ultima = doses[0];

  if (m.kind === "diaria") {
    const usadas = new Set<string>();
    const slots: Slot[] = [...m.times].sort().map((t) => {
      const hora = t.slice(0, 5);
      const due = fromLocalInput(`${hoy}T${hora}`)!;
      // La dosis más vieja dentro de la ventana que no se usó en otro horario.
      const dada = [...doses].reverse().find((d) => !usadas.has(d.id) && new Date(d.given_at).getTime() >= due.getTime() - VENTANA_MS && toDateInput(new Date(d.given_at)) === hoy);
      if (dada) usadas.add(dada.id);
      const estado: Slot["estado"] = dada ? "dada" : now >= due ? "pendiente" : "mas-tarde";
      return { hora, due, dada, estado };
    });
    return { kind: "diaria", slots, pendiente: !terminado && slots.some((s) => s.estado === "pendiente"), terminado };
  }

  const intervalo = (m.interval_hours ?? 0) * 3600_000;
  if (m.kind === "intervalo") {
    const proxima = ultima ? new Date(new Date(ultima.given_at).getTime() + intervalo) : undefined;
    return { kind: "intervalo", ultima, proxima, atrasada: !terminado && !!proxima && now >= proxima, terminado };
  }

  const desde = ultima && intervalo ? new Date(new Date(ultima.given_at).getTime() + intervalo) : undefined;
  return { kind: "si_hace_falta", ultima, desde: desde && desde > now ? desde : undefined };
}

/** Si hay una dosis demasiado reciente, el texto para pedir confirmación. */
export function avisoDosisReciente(m: Medication, doses: MedicationDose[], nombres: Record<string, string>, now = new Date()): string | null {
  const ultima = doses[0];
  if (!ultima) return null;
  const desde = now.getTime() - new Date(ultima.given_at).getTime();
  const minimo = m.kind === "diaria" ? VENTANA_MS : (m.interval_hours ?? 0) * 3600_000;
  if (desde >= minimo) return null;
  const quien = (ultima.created_by && nombres[ultima.created_by]) || "alguien";
  return `${quien} ya le dio ${m.name} a las ${hhmm(ultima.given_at)}. ¿Registrar otra dosis igual?`;
}

export function describirPauta(m: Medication): string {
  if (m.kind === "diaria") return `Todos los días a las ${[...m.times].sort().map((t) => t.slice(0, 5)).join(", ")}`;
  if (m.kind === "intervalo") return `Cada ${String(m.interval_hours).replace(".", ",")} h`;
  return m.interval_hours ? `Si hace falta, con al menos ${String(m.interval_hours).replace(".", ",")} h entre dosis` : "Si hace falta";
}
