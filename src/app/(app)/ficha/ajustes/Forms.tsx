"use client";

import { useActionState, useEffect, useRef } from "react";
import { cambiarMiNombre, invitar } from "../actions";
import { FormError } from "@/components/FormError";
import { Submit } from "@/components/Submit";

export function InvitarForm() {
  const [state, action] = useActionState(invitar, undefined);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) form.current?.reset();
  }, [state]);

  return (
    <form ref={form} action={action} className="flex flex-col gap-3">
      <input name="email" type="email" required placeholder="email@ejemplo.com" aria-label="Email" className="input" />
      <div className="flex gap-2">
        <label className="opt flex-1">
          <input type="radio" name="role" value="miembro" defaultChecked className="sr-only" />
          Miembro
        </label>
        <label className="opt flex-1">
          <input type="radio" name="role" value="admin" className="sr-only" />
          Admin
        </label>
      </div>
      <p className="text-[13px] text-faint">Un admin además puede invitar y quitar personas.</p>
      <FormError message={state?.error} />
      {state?.ok && <p role="status" className="text-[14px] text-accent">Listo. Avisale que se registre con ese email.</p>}
      <Submit className="btn-primary h-12 text-[15px]">Invitar</Submit>
    </form>
  );
}

export function MiNombreForm({ nombre }: { nombre: string }) {
  const [state, action] = useActionState(cambiarMiNombre, undefined);
  return (
    <form action={action} className="flex flex-col gap-2">
      <label className="flex flex-col gap-1.5">
        <span className="label">Cómo te ven los demás</span>
        <input name="display_name" required defaultValue={nombre} className="input" />
      </label>
      <FormError message={state?.error} />
      {state?.ok && <p role="status" className="text-[14px] text-accent">Guardado.</p>}
      <Submit className="btn-ghost h-12 text-[15px]">Guardar nombre</Submit>
    </form>
  );
}
