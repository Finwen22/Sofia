"use client";

import { useActionState } from "react";
import { guardarMedida } from "../../actions";
import { FormError } from "@/components/FormError";
import { Submit } from "@/components/Submit";

function Medida({ name, label, unit, placeholder, decimal }: { name: string; label: string; unit: string; placeholder: string; decimal?: boolean }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="label">{label}</span>
      <span className="input flex items-center gap-2">
        <input name={name} inputMode={decimal ? "decimal" : "numeric"} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-faint" />
        <span className="text-sm text-muted">{unit}</span>
      </span>
    </label>
  );
}

export function MedidaForm({ hoy }: { hoy: string }) {
  const [state, action] = useActionState(guardarMedida, undefined);
  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="label">Fecha</span>
        <input name="measured_on" type="date" required max={hoy} defaultValue={hoy} className="input" />
      </label>
      <Medida name="weight_g" label="Peso" unit="g" placeholder="4250" />
      <Medida name="length_cm" label="Talla" unit="cm" placeholder="53,5" decimal />
      <Medida name="head_cm" label="Perímetro cefálico" unit="cm" placeholder="36" decimal />
      <label className="flex flex-col gap-1.5">
        <span className="label">Dónde o quién la midió</span>
        <input name="notes" placeholder="Control pediátrico, balanza de la farmacia…" className="input" />
      </label>
      <FormError message={state?.error} />
      <Submit>Guardar medida</Submit>
    </form>
  );
}
