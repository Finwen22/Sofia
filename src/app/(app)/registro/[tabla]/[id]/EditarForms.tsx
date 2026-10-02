"use client";

import { useActionState } from "react";
import { editarNota, editarSueno, editarToma } from "../../../registrar/actions";
import { FormError } from "@/components/FormError";
import { Submit } from "@/components/Submit";
import type { Feeding, Note } from "@/lib/types";

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1.5">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

export function EditarToma({ toma, inicio, minutos }: { toma: Feeding; inicio: string; minutos: number | null }) {
  const [state, action] = useActionState(editarToma, undefined);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={toma.id} />
      <Campo label="Hora">
        <input name="started_at" type="datetime-local" defaultValue={inicio} className="input" />
      </Campo>
      {toma.kind === "pecho" ? (
        <>
          <fieldset className="flex flex-col gap-2">
            <legend className="label mb-2">Lado</legend>
            <div className="flex gap-2">
              {(["izquierdo", "derecho", "ambos"] as const).map((l) => (
                <label key={l} className="opt flex-1">
                  <input type="radio" name="side" value={l} defaultChecked={toma.side === l} className="sr-only" />
                  {l.charAt(0).toUpperCase() + l.slice(1)}
                </label>
              ))}
            </div>
          </fieldset>
          <Campo label={toma.ended_at ? "Duración (min)" : "Duración (min) — vacío si sigue tomando"}>
            <input name="minutes" inputMode="numeric" defaultValue={minutos ?? ""} className="input" />
          </Campo>
        </>
      ) : (
        <>
          <Campo label="Cantidad (ml)">
            <input name="amount_ml" inputMode="numeric" required defaultValue={toma.amount_ml ?? ""} className="input" />
          </Campo>
          <fieldset className="flex flex-col gap-2">
            <legend className="label mb-2">Leche</legend>
            <div className="flex gap-2">
              <label className="opt flex-1">
                <input type="radio" name="milk" value="materna" defaultChecked={toma.milk === "materna"} className="sr-only" /> Materna
              </label>
              <label className="opt flex-1">
                <input type="radio" name="milk" value="formula" defaultChecked={toma.milk === "formula"} className="sr-only" /> Fórmula
              </label>
            </div>
          </fieldset>
        </>
      )}
      <Campo label="Observaciones">
        <input name="notes" defaultValue={toma.notes ?? ""} className="input" />
      </Campo>
      <FormError message={state?.error} />
      <Submit>Guardar cambios</Submit>
    </form>
  );
}

export function EditarSueno({ id, inicio, fin }: { id: string; inicio: string; fin: string | null }) {
  const [state, action] = useActionState(editarSueno, undefined);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={id} />
      <div className="flex gap-3">
        <Campo label="Se durmió">
          <input name="started_at" type="datetime-local" defaultValue={inicio} className="input px-3 text-[15px]" />
        </Campo>
        <Campo label="Se despertó">
          <input name="ended_at" type="datetime-local" defaultValue={fin ?? ""} className="input px-3 text-[15px]" />
        </Campo>
      </div>
      {!fin && <p className="text-[13px] text-faint">Dejá “Se despertó” vacío si sigue durmiendo.</p>}
      <FormError message={state?.error} />
      <Submit>Guardar cambios</Submit>
    </form>
  );
}

export function EditarNota({ nota }: { nota: Note }) {
  const [state, action] = useActionState(editarNota, undefined);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={nota.id} />
      <Campo label="Nota">
        <textarea name="body" rows={5} required defaultValue={nota.body} className="input" />
      </Campo>
      <label className="opt justify-start px-4">
        <input type="checkbox" name="for_doctor" defaultChecked={nota.for_doctor} className="size-5 accent-accent" />
        Es una pregunta para el próximo control
      </label>
      <FormError message={state?.error} />
      <Submit>Guardar cambios</Submit>
    </form>
  );
}
