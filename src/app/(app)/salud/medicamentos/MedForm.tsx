"use client";

import { useActionState, useState } from "react";
import { guardarMedicamento } from "./actions";
import { FormError } from "@/components/FormError";
import { Icon } from "@/components/Icon";
import { Submit } from "@/components/Submit";
import type { Medication } from "@/lib/types";

const TIPOS = [
  { code: "diaria", label: "Todos los días", ayuda: "A horario fijo. Ej.: vitamina D a las 9." },
  { code: "intervalo", label: "Cada X horas", ayuda: "Ej.: un antibiótico cada 8 h por 7 días." },
  { code: "si_hace_falta", label: "Si hace falta", ayuda: "Ej.: paracetamol si tiene fiebre. Sin aviso." },
] as const;

const SUGERENCIAS = ["Vitamina D", "Hierro", "Paracetamol", "Ibuprofeno", "Probióticos", "Antibiótico"];

export function MedForm({ med, hoy }: { med?: Medication; hoy: string }) {
  const [state, action] = useActionState(guardarMedicamento, undefined);
  const [kind, setKind] = useState<Medication["kind"]>(med?.kind ?? "diaria");
  const [horas, setHoras] = useState<string[]>(med?.times.length ? med.times.map((t) => t.slice(0, 5)) : ["09:00"]);

  return (
    <form action={action} className="flex flex-col gap-4">
      {med && <input type="hidden" name="id" value={med.id} />}
      <label className="flex flex-col gap-1.5">
        <span className="label">Medicamento o suplemento</span>
        <input name="name" required list="sugerencias-med" defaultValue={med?.name} className="input" />
        <datalist id="sugerencias-med">
          {SUGERENCIAS.map((s) => <option key={s} value={s} />)}
        </datalist>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="label">Dosis indicada</span>
        <input name="dose" defaultValue={med?.dose ?? ""} placeholder="Tal cual la indicó el pediatra: 1 gota, 2,5 ml…" className="input" />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="label mb-2">Cada cuánto</legend>
        {TIPOS.map((t) => (
          <label key={t.code} className="opt flex-col items-start gap-0.5 px-4 py-2.5 text-left">
            <input type="radio" name="kind" value={t.code} checked={kind === t.code} onChange={() => setKind(t.code)} className="sr-only" />
            <span>{t.label}</span>
            <span className="text-[13px] font-normal text-muted">{t.ayuda}</span>
          </label>
        ))}
      </fieldset>

      {kind === "diaria" && (
        <fieldset className="flex flex-col gap-2">
          <legend className="label mb-2">Horarios</legend>
          {horas.map((h, i) => (
            <div key={i} className="flex gap-2">
              <input
                name="times"
                type="time"
                required
                value={h}
                onChange={(e) => setHoras((xs) => xs.map((x, j) => (j === i ? e.target.value : x)))}
                aria-label={`Horario ${i + 1}`}
                className="input flex-1"
              />
              {horas.length > 1 && (
                <button type="button" aria-label="Quitar horario" onClick={() => setHoras((xs) => xs.filter((_, j) => j !== i))} className="flex size-[52px] items-center justify-center rounded-2xl border border-line text-muted">
                  <Icon name="close" size={18} />
                </button>
              )}
            </div>
          ))}
          {horas.length < 6 && (
            <button type="button" onClick={() => setHoras((xs) => [...xs, "21:00"])} className="flex h-11 items-center justify-center gap-1 rounded-2xl border border-dashed border-line text-[14px] font-semibold text-accent">
              <Icon name="plus" size={16} /> Agregar horario
            </button>
          )}
        </fieldset>
      )}

      {kind !== "diaria" && (
        <label className="flex flex-col gap-1.5">
          <span className="label">{kind === "intervalo" ? "Cada cuántas horas" : "Mínimo entre dosis (opcional)"}</span>
          <span className="input flex items-center gap-2">
            <input
              name="interval_hours"
              inputMode="decimal"
              required={kind === "intervalo"}
              defaultValue={med?.interval_hours ?? (kind === "intervalo" ? 8 : "")}
              className="min-w-0 flex-1 bg-transparent outline-none"
            />
            <span className="text-sm text-muted">horas</span>
          </span>
        </label>
      )}

      <div className="flex gap-3">
        <label className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="label">Desde</span>
          <input name="starts_on" type="date" defaultValue={med?.starts_on ?? hoy} className="input px-3" />
        </label>
        <label className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="label">Hasta (opcional)</span>
          <input name="ends_on" type="date" defaultValue={med?.ends_on ?? ""} className="input px-3" />
        </label>
      </div>

      {kind !== "si_hace_falta" && (
        <label className="opt justify-between px-4">
          <span>Avisarnos por notificación cuando toca</span>
          <input type="checkbox" name="reminders" defaultChecked={med?.reminders ?? true} className="size-5 accent-accent" />
        </label>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="label">Indicado por</span>
        <input name="prescribed_by" defaultValue={med?.prescribed_by ?? ""} placeholder="Pediatra" className="input" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="label">Notas</span>
        <textarea name="notes" rows={2} defaultValue={med?.notes ?? ""} placeholder="Con la comida, agitar antes de usar…" className="input" />
      </label>

      <p className="text-[13px] leading-relaxed text-faint">Sofía no indica dosis: cargá lo que indicó el pediatra. Ante cualquier duda, consultá al pediatra.</p>
      <FormError message={state?.error} />
      <Submit>{med ? "Guardar cambios" : "Agregar medicamento"}</Submit>
    </form>
  );
}
