"use client";

import { useActionState, useState } from "react";
import { darDosis } from "../actions";
import { DarDosis } from "../DarDosis";

/** "Dar ahora" + la opción de anotar una dosis que se dio antes. */
export function DosisOtraHora({ medId, ahora }: { medId: string; ahora: string }) {
  const [abierto, setAbierto] = useState(false);
  const [state, action, pending] = useActionState(darDosis, undefined);

  return (
    <div className="flex flex-col gap-2">
      <DarDosis medId={medId} />
      {!abierto ? (
        <button type="button" onClick={() => setAbierto(true)} className="py-1 text-[14px] font-semibold text-accent">
          Se la dieron a otra hora
        </button>
      ) : (
        <form action={action} className="card flex flex-col gap-2.5 p-3">
          <input type="hidden" name="medication_id" value={medId} />
          <input type="hidden" name="forzar" value="1" />
          <label className="flex flex-col gap-1">
            <span className="label">¿A qué hora?</span>
            <input name="given_at" type="datetime-local" defaultValue={ahora} className="input" />
          </label>
          {state?.error && <p role="alert" className="text-[13px] text-alert">{state.error}</p>}
          {state?.ok && <p role="status" className="text-[13px] text-accent">Registrada.</p>}
          <button disabled={pending} className="btn-primary h-12 text-[15px]">{pending ? "Guardando…" : "Registrar dosis"}</button>
        </form>
      )}
    </div>
  );
}
