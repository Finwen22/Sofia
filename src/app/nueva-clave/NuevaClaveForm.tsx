"use client";

import { useActionState } from "react";
import { nuevaClave } from "@/app/(auth)/actions";
import { FormError } from "@/components/FormError";
import { Submit } from "@/components/Submit";

export function NuevaClaveForm() {
  const [state, action] = useActionState(nuevaClave, undefined);
  return (
    <form action={action} className="flex flex-col gap-4">
      <FormError message={state?.error} />
      <label className="flex flex-col gap-1.5">
        <span className="label">Contraseña nueva</span>
        <input name="password" type="password" autoComplete="new-password" minLength={8} required className="input" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="label">Repetila</span>
        <input name="password2" type="password" autoComplete="new-password" minLength={8} required className="input" />
      </label>
      <Submit pendingText="Guardando…">Guardar y entrar</Submit>
    </form>
  );
}
