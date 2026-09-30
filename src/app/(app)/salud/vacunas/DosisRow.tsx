"use client";

import { useActionState, useState } from "react";
import { aplicarVacuna, desmarcarVacuna } from "../actions";
import { FormError } from "@/components/FormError";
import { Icon } from "@/components/Icon";
import { Submit } from "@/components/Submit";
import type { EstadoDosis } from "@/lib/vacunas";

const ESTILO: Record<EstadoDosis, { texto: string; clase: string }> = {
  aplicada: { texto: "Aplicada", clase: "bg-soft text-soft-ink" },
  atrasada: { texto: "Atrasada", clase: "bg-alert-bg text-alert" },
  proxima: { texto: "Próxima", clase: "border border-accent/60 text-accent" },
  futura: { texto: "Más adelante", clase: "text-faint" },
};

type Props = {
  code: string;
  vacuna: string;
  dosis: string;
  nota?: string;
  estado: EstadoDosis;
  aplicadaEl: string | null;
  lote: string | null;
  hoy: string;
};

export function DosisRow({ code, vacuna, dosis, nota, estado, aplicadaEl, lote, hoy }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [state, action] = useActionState(aplicarVacuna, undefined);
  const e = ESTILO[estado];

  return (
    <li className="flex flex-col gap-2 border-b border-line py-3 last:border-0">
      <div className="flex items-center gap-3">
        <span className="flex flex-1 flex-col gap-0.5">
          <span className="text-[15px] font-semibold">{vacuna}</span>
          <span className="text-[13px] text-muted">
            {dosis}
            {aplicadaEl ? ` · ${aplicadaEl}` : ""}
            {lote ? ` · lote ${lote}` : ""}
          </span>
          {nota && estado !== "aplicada" && <span className="text-[13px] text-faint">{nota}</span>}
        </span>
        {estado === "aplicada" ? (
          <form
            action={desmarcarVacuna}
            onSubmit={(ev) => {
              if (!window.confirm(`¿Desmarcar ${vacuna} (${dosis})?`)) ev.preventDefault();
            }}
          >
            <input type="hidden" name="vaccine_code" value={code} />
            <button aria-label={`Desmarcar ${vacuna}`} className={`flex h-9 items-center gap-1 rounded-full px-3 text-[13px] font-semibold ${e.clase}`}>
              <Icon name="check" size={16} stroke={2} /> {e.texto}
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAbierto((a) => !a)}
            aria-expanded={abierto}
            className={`h-9 rounded-full px-3 text-[13px] font-semibold ${e.clase}`}
          >
            {abierto ? "Cancelar" : e.texto}
          </button>
        )}
      </div>
      {abierto && estado !== "aplicada" && (
        <form action={action} className="flex flex-col gap-2.5 rounded-2xl bg-bg p-3">
          <input type="hidden" name="vaccine_code" value={code} />
          <div className="flex gap-2">
            <label className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="label">Se aplicó el</span>
              <input name="applied_on" type="date" required max={hoy} defaultValue={hoy} className="input px-3" />
            </label>
            <label className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="label">Lote</span>
              <input name="lot" className="input px-3" />
            </label>
          </div>
          <label className="flex flex-col gap-1">
            <span className="label">Dónde</span>
            <input name="place" className="input px-3" />
          </label>
          <FormError message={state?.error} />
          <Submit className="btn-primary h-12 text-[15px]">Marcar aplicada</Submit>
        </form>
      )}
    </li>
  );
}
