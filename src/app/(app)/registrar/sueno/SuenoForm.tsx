"use client";

import { useActionState } from "react";
import { guardarSueno } from "../actions";
import { FormError } from "@/components/FormError";
import { Submit } from "@/components/Submit";

export function SuenoForm({ desde, hasta }: { desde: string; hasta: string }) {
  const [state, action] = useActionState(guardarSueno, undefined);
  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex gap-3">
        <label className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="label">Se durmió</span>
          <input name="started_at" type="datetime-local" defaultValue={desde} className="input px-3 text-[15px]" />
        </label>
        <label className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="label">Se despertó</span>
          <input name="ended_at" type="datetime-local" defaultValue={hasta} className="input px-3 text-[15px]" />
        </label>
      </div>
      <FormError message={state?.error} />
      <Submit className="btn-ghost">Guardar siesta</Submit>
    </form>
  );
}
