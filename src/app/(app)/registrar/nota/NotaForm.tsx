"use client";

import { useActionState } from "react";
import { guardarNota } from "../actions";
import { FormError } from "@/components/FormError";
import { Submit } from "@/components/Submit";

export function NotaForm({ paraPediatra }: { paraPediatra: boolean }) {
  const [state, action] = useActionState(guardarNota, undefined);
  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="label">Qué pasó o qué querés preguntar</span>
        <textarea name="body" rows={5} required autoFocus placeholder="Ej.: hipo después de cada toma, ¿es normal?" className="input" />
      </label>
      <label className="opt justify-start px-4">
        <input type="checkbox" name="for_doctor" defaultChecked={paraPediatra} className="size-5 accent-accent" />
        Es una pregunta para el próximo control
      </label>
      <FormError message={state?.error} />
      <Submit>Guardar nota</Submit>
    </form>
  );
}
