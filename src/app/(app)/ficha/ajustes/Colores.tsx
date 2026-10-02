"use client";

import { useState, useTransition } from "react";
import { guardarTema } from "../actions";
import { aplicarTema } from "@/components/TemaSync";
import { Icon } from "@/components/Icon";
import { TEMAS } from "@/lib/temas";

/** Elige el color de la app; se ve al instante y se guarda en el perfil. */
export function Colores({ actual }: { actual: string }) {
  const [elegido, setElegido] = useState(actual);
  const [error, setError] = useState<string>();
  const [, startTransition] = useTransition();

  function elegir(code: string) {
    const anterior = elegido;
    setElegido(code);
    setError(undefined);
    aplicarTema(code);
    startTransition(async () => {
      const r = await guardarTema(code);
      if (r?.error) {
        setError(r.error);
        setElegido(anterior);
        aplicarTema(anterior);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div role="radiogroup" aria-label="Color de la app" className="grid grid-cols-3 gap-2">
        {TEMAS.map((t) => {
          const on = t.code === elegido;
          return (
            <button
              key={t.code}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => elegir(t.code)}
              className={`flex flex-col items-center gap-2 rounded-2xl border p-3 text-[13px] font-semibold ${on ? "border-accent" : "border-line"}`}
              style={{ background: t.colores.bg, color: t.colores.ink }}
            >
              <span className="flex items-center gap-1">
                <span className="size-6 rounded-full" style={{ background: t.colores.accent }} />
                <span className="size-6 rounded-full" style={{ background: t.colores.soft, border: `1px solid ${t.colores.line}` }} />
              </span>
              <span className="flex items-center gap-1">
                {on && <Icon name="check" size={14} stroke={2.4} />}
                {t.nombre}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-[13px] text-faint">Es solo para vos: cada persona de la familia elige el suyo.</p>
      {error && <p role="alert" className="text-[13px] text-alert">{error}</p>}
    </div>
  );
}
