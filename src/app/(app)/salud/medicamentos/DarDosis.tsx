"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { darDosis } from "./actions";
import { Icon } from "@/components/Icon";

/** "Dar ahora" de un toque; si hubo otra dosis reciente, pide confirmar. */
export function DarDosis({ medId, label = "Dar ahora", compacto = false }: { medId: string; label?: string; compacto?: boolean }) {
  const [state, action, pending] = useActionState(darDosis, undefined);
  const [cancelado, setCancelado] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const forzar = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (forzar.current) forzar.current.value = "";
  }, [state]);

  const aviso = state?.aviso && !cancelado ? state.aviso : null;
  const boton = compacto
    ? "h-10 rounded-full bg-accent px-4 text-[14px] font-semibold text-on-accent disabled:opacity-60"
    : "btn-primary h-12 text-[15px]";

  return (
    <form ref={form} action={(fd) => { setCancelado(false); return action(fd); }} className="flex flex-col gap-2">
      <input type="hidden" name="medication_id" value={medId} />
      <input ref={forzar} type="hidden" name="forzar" defaultValue="" />
      {aviso ? (
        <div role="alertdialog" className="flex flex-col gap-2 rounded-2xl bg-alert-bg p-3 text-[14px] text-alert">
          <p className="flex items-start gap-2">
            <Icon name="alert" size={18} className="mt-0.5 shrink-0" />
            {aviso}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setCancelado(true)} className="h-10 rounded-full border border-line text-[14px] font-semibold text-ink">
              No, cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              onClick={() => { if (forzar.current) forzar.current.value = "1"; }}
              className="h-10 rounded-full bg-alert px-3 text-[14px] font-semibold text-on-accent"
            >
              Sí, registrar
            </button>
          </div>
        </div>
      ) : (
        <button type="submit" disabled={pending} className={boton}>
          {pending ? "Registrando…" : label}
        </button>
      )}
      {state?.error && <p role="alert" className="text-[13px] text-alert">{state.error}</p>}
    </form>
  );
}
