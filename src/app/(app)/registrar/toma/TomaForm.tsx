"use client";

import { useActionState, useState } from "react";
import { empezarToma, guardarToma } from "../actions";
import { FormError } from "@/components/FormError";
import { Icon } from "@/components/Icon";
import { Submit } from "@/components/Submit";

type Props = {
  inicial: "pecho" | "mamadera";
  sugerido: "izquierdo" | "derecho" | null;
  ahora: string;
  mlSugerido: number | null;
  lecheSugerida: "materna" | "formula";
};

export function TomaForm({ inicial, sugerido, ahora, mlSugerido, lecheSugerida }: Props) {
  const [tipo, setTipo] = useState(inicial);
  const [manual, setManual] = useState(false);
  const [ml, setMl] = useState<string>(mlSugerido ? String(mlSugerido) : "");
  const [state, action] = useActionState(guardarToma, undefined);

  return (
    <div className="flex flex-col gap-5">
      <div role="tablist" className="flex gap-1.5 rounded-[20px] bg-soft p-1">
        {(["pecho", "mamadera"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            type="button"
            aria-selected={tipo === t}
            onClick={() => setTipo(t)}
            className={`h-12 flex-1 rounded-2xl text-[15px] font-semibold ${tipo === t ? "bg-surface text-ink shadow" : "text-soft-ink"}`}
          >
            {t === "pecho" ? "Pecho" : "Mamadera"}
          </button>
        ))}
      </div>

      {tipo === "pecho" && !manual && (
        <>
          {sugerido && (
            <p className="text-[15px] text-muted">
              Según la última toma, le toca empezar por el <strong className="text-ink">{sugerido}</strong>.
            </p>
          )}
          <form action={empezarToma} className="grid grid-cols-2 gap-2.5">
            {(["izquierdo", "derecho"] as const).map((lado) => (
              <button
                key={lado}
                name="side"
                value={lado}
                className={`flex h-36 flex-col items-center justify-center gap-2 rounded-[20px] text-[17px] font-semibold ${sugerido === lado ? "bg-accent text-on-accent" : "border border-line bg-surface text-ink"}`}
              >
                <Icon name="play" size={26} />
                {lado === "izquierdo" ? "Izquierdo" : "Derecho"}
                <span className="text-[13px] font-medium opacity-80">Empezar ahora</span>
              </button>
            ))}
          </form>
          <p className="text-[13px] leading-relaxed text-faint">Arranca un cronómetro. Si cambiás de pecho, volvé acá, tocá el otro y el anterior se corta solo.</p>
          <button type="button" onClick={() => setManual(true)} className="btn-ghost">
            Cargar una toma que ya pasó
          </button>
        </>
      )}

      {(tipo === "mamadera" || manual) && (
        <form action={action} className="flex flex-col gap-4">
          <input type="hidden" name="kind" value={tipo} />
          <label className="flex flex-col gap-1.5">
            <span className="label">Hora</span>
            <input name="started_at" type="datetime-local" defaultValue={ahora} className="input" />
          </label>

          {tipo === "pecho" ? (
            <>
              <fieldset className="flex flex-col gap-2">
                <legend className="label mb-2">Lado</legend>
                <div className="flex gap-2">
                  {(["izquierdo", "derecho", "ambos"] as const).map((l) => (
                    <label key={l} className="opt flex-1">
                      <input type="radio" name="side" value={l} defaultChecked={l === (sugerido ?? "izquierdo")} className="sr-only" />
                      {l.charAt(0).toUpperCase() + l.slice(1)}
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="flex flex-col gap-1.5">
                <span className="label">Duración</span>
                <span className="input flex items-center gap-2">
                  <input name="minutes" inputMode="numeric" placeholder="15" className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-faint" />
                  <span className="text-sm text-muted">min</span>
                </span>
              </label>
            </>
          ) : (
            <>
              <fieldset className="flex flex-col gap-2">
                <legend className="label mb-2">Cantidad</legend>
                <div className="grid grid-cols-5 gap-2">
                  {[30, 60, 90, 120, 150].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setMl(String(v))}
                      aria-pressed={ml === String(v)}
                      className={`h-12 rounded-2xl border text-[15px] font-semibold ${ml === String(v) ? "border-accent bg-soft text-ink" : "border-line bg-surface text-muted"}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <span className="input mt-1 flex items-center gap-2">
                  <input
                    name="amount_ml"
                    inputMode="numeric"
                    value={ml}
                    onChange={(e) => setMl(e.target.value.replace(/\D/g, ""))}
                    placeholder="Otra cantidad"
                    aria-label="Mililitros"
                    className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-faint"
                  />
                  <span className="text-sm text-muted">ml</span>
                </span>
              </fieldset>
              <fieldset className="flex flex-col gap-2">
                <legend className="label mb-2">Leche</legend>
                <div className="flex gap-2">
                  <label className="opt flex-1">
                    <input type="radio" name="milk" value="materna" defaultChecked={lecheSugerida === "materna"} className="sr-only" />
                    Materna
                  </label>
                  <label className="opt flex-1">
                    <input type="radio" name="milk" value="formula" defaultChecked={lecheSugerida === "formula"} className="sr-only" />
                    Fórmula
                  </label>
                </div>
              </fieldset>
            </>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="label">Observaciones</span>
            <input name="notes" placeholder="Opcional: regurgitó, se durmió…" className="input" />
          </label>
          <FormError message={state?.error} />
          <Submit>Guardar toma</Submit>
          {manual && (
            <button type="button" onClick={() => setManual(false)} className="py-2 text-[15px] font-semibold text-accent">
              Volver al cronómetro
            </button>
          )}
        </form>
      )}
    </div>
  );
}
