"use client";

import { useActionState, useState } from "react";
import { guardarSalud } from "../actions";
import { FormError } from "@/components/FormError";
import { Icon } from "@/components/Icon";
import { Submit } from "@/components/Submit";
import { evaluar, METODOS, SINTOMAS, type Nivel } from "@/lib/sintomas";
import type { HealthLog } from "@/lib/types";

const ESTILO: Record<Nivel, string> = {
  urgente: "bg-alert-bg text-alert border border-alert/60",
  hoy: "bg-alert-bg text-alert",
  atencion: "bg-soft text-soft-ink",
  ok: "bg-soft text-soft-ink",
};

type Props = { ahora: string; diasDeVida: number; registro?: HealthLog; telPediatra?: string | null };

export function TempForm({ ahora, diasDeVida, registro, telPediatra }: Props) {
  const [state, action] = useActionState(guardarSalud, undefined);
  const [temp, setTemp] = useState(registro?.temperature_c != null ? String(registro.temperature_c).replace(".", ",") : "");
  const [sintomas, setSintomas] = useState<string[]>(registro?.symptoms ?? []);

  const valor = temp.trim() === "" ? null : Number(temp.replace(",", "."));
  const ev = evaluar(valor, sintomas, diasDeVida);

  function sumar(d: number) {
    const base = valor ?? 37;
    const n = Math.min(43, Math.max(34, Math.round((base + d) * 10) / 10));
    setTemp(n.toFixed(1).replace(".", ","));
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      {registro && <input type="hidden" name="id" value={registro.id} />}
      <label className="flex flex-col gap-1.5">
        <span className="label">Hora</span>
        <input name="observed_at" type="datetime-local" defaultValue={ahora} className="input" />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="label mb-2">Temperatura</legend>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => sumar(-0.1)} aria-label="Bajar una décima" className="flex size-14 items-center justify-center rounded-2xl border border-line bg-surface text-2xl font-semibold">−</button>
          <span className="input flex h-16 flex-1 items-center justify-center gap-1">
            <input
              name="temperature_c"
              inputMode="decimal"
              value={temp}
              onChange={(e) => setTemp(e.target.value.replace(/[^\d.,]/g, ""))}
              placeholder="37,0"
              aria-label="Temperatura en grados"
              className="display w-24 bg-transparent text-center text-4xl outline-none placeholder:text-faint"
            />
            <span className="text-lg text-muted">°C</span>
          </span>
          <button type="button" onClick={() => sumar(0.1)} aria-label="Subir una décima" className="flex size-14 items-center justify-center rounded-2xl border border-line bg-surface text-2xl font-semibold">+</button>
        </div>
        <div className="flex gap-2">
          {METODOS.map((m) => (
            <label key={m.code} className="opt h-10 min-h-10 flex-1 text-[14px]">
              <input type="radio" name="method" value={m.code} defaultChecked={(registro?.method ?? "axilar") === m.code} className="sr-only" />
              {m.label}
            </label>
          ))}
        </div>
      </fieldset>

      {ev && (
        <div role={ev.nivel === "urgente" ? "alert" : "status"} className={`flex flex-col gap-2 rounded-2xl px-4 py-3 ${ESTILO[ev.nivel]}`}>
          <p className="flex items-start gap-2 text-[15px] leading-snug">
            <Icon name={ev.nivel === "ok" ? "check" : "alert"} size={18} className="mt-0.5 shrink-0" />
            <span>
              <strong>{ev.titulo}.</strong> {ev.texto}
            </span>
          </p>
          {(ev.nivel === "urgente" || ev.nivel === "hoy") && telPediatra && (
            <a href={`tel:${telPediatra.replace(/[^\d+]/g, "")}`} className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-alert text-[15px] font-semibold text-on-accent">
              <Icon name="phone" size={18} /> Llamar al pediatra
            </a>
          )}
        </div>
      )}

      <fieldset className="flex flex-col gap-2">
        <legend className="label mb-2">Síntomas (opcional)</legend>
        <div className="flex flex-wrap gap-2">
          {SINTOMAS.map((s) => (
            <label key={s.code} className="opt min-h-10 px-3 text-[14px]">
              <input
                type="checkbox"
                name="symptoms"
                value={s.code}
                checked={sintomas.includes(s.code)}
                onChange={(e) => setSintomas((xs) => (e.target.checked ? [...xs, s.code] : xs.filter((x) => x !== s.code)))}
                className="sr-only"
              />
              {s.label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-1.5">
        <span className="label">Detalles</span>
        <textarea name="notes" rows={2} defaultValue={registro?.notes ?? ""} placeholder="Opcional: desde cuándo, qué le diste, cómo la ves…" className="input" />
      </label>

      {!registro && (
        <label className="flex flex-col gap-1.5">
          <span className="label">Recordarnos volver a medir</span>
          <select name="remedir" defaultValue={valor !== null && valor >= 37.5 ? "30" : "0"} key={valor !== null && valor >= 37.5 ? "f" : "n"} className="input">
            <option value="0">No</option>
            <option value="30">En 30 minutos</option>
            <option value="60">En 1 hora</option>
            <option value="120">En 2 horas</option>
          </select>
        </label>
      )}

      <p className="text-[13px] leading-relaxed text-faint">
        Es una guía general, no un diagnóstico. Si la ves mal, no esperes: consultá al pediatra o andá a la guardia.
      </p>
      <FormError message={state?.error} />
      <Submit>{registro ? "Guardar cambios" : "Guardar"}</Submit>
    </form>
  );
}
