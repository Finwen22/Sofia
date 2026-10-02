"use client";

import { useActionState, useState } from "react";
import { guardarTurno } from "../actions";
import { FormError } from "@/components/FormError";
import { Submit } from "@/components/Submit";
import type { Appointment } from "@/lib/types";

const TIPOS = [
  "Control pediátrico",
  "Control de los 15 días",
  "Vacunación",
  "Ecografía de caderas",
  "Otoemisiones (audición)",
  "Pesquisa neonatal",
  "Oftalmología",
  "Consulta de lactancia",
  "Guardia",
];

export function TurnoForm({ turno, fechaInicial, pediatra }: { turno?: Appointment; fechaInicial: string; pediatra: string | null }) {
  const [state, action] = useActionState(guardarTurno, undefined);
  const [hecho, setHecho] = useState(turno?.done ?? false);

  return (
    <form action={action} className="flex flex-col gap-4">
      {turno && <input type="hidden" name="id" value={turno.id} />}
      <label className="flex flex-col gap-1.5">
        <span className="label">Qué turno es</span>
        <input name="kind" list="tipos-turno" required defaultValue={turno?.kind} placeholder="Control pediátrico" className="input" />
        <datalist id="tipos-turno">
          {TIPOS.map((t) => <option key={t} value={t} />)}
        </datalist>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="label">Fecha y hora</span>
        <input name="scheduled_at" type="datetime-local" required defaultValue={fechaInicial} className="input" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="label">Profesional</span>
        <input name="professional" defaultValue={turno?.professional ?? pediatra ?? ""} className="input" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="label">Lugar</span>
        <input name="place" defaultValue={turno?.place ?? ""} placeholder="Consultorio, dirección" className="input" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="label">Qué llevar o recordar</span>
        <textarea name="notes" rows={2} defaultValue={turno?.notes ?? ""} placeholder="Libreta sanitaria, credencial, DNI…" className="input" />
      </label>

      {turno && (
        <>
          <label className="opt justify-start px-4">
            <input type="checkbox" name="done" checked={hecho} onChange={(e) => setHecho(e.target.checked)} className="size-5 accent-accent" />
            Ya fuimos
          </label>
          {hecho && (
            <>
              <label className="flex flex-col gap-1.5">
                <span className="label">Qué dijo el profesional</span>
                <textarea name="outcome" rows={4} defaultValue={turno.outcome ?? ""} placeholder="Indicaciones, medicación, próximo control…" className="input" />
              </label>
              <fieldset className="flex flex-col gap-2">
                <legend className="label mb-2">Si la pesaron o midieron</legend>
                <div className="grid grid-cols-3 gap-2">
                  <input name="weight_g" inputMode="numeric" placeholder="Peso g" aria-label="Peso en gramos" className="input px-3" />
                  <input name="length_cm" inputMode="decimal" placeholder="Talla cm" aria-label="Talla en centímetros" className="input px-3" />
                  <input name="head_cm" inputMode="decimal" placeholder="PC cm" aria-label="Perímetro cefálico en centímetros" className="input px-3" />
                </div>
              </fieldset>
            </>
          )}
        </>
      )}

      <FormError message={state?.error} />
      <Submit>{turno ? "Guardar cambios" : "Agendar turno"}</Submit>
    </form>
  );
}
