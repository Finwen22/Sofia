"use client";

import Link from "next/link";
import { useActionState } from "react";
import { recuperar } from "../actions";
import { FormError } from "@/components/FormError";
import { Submit } from "@/components/Submit";

export function RecuperarForm({ aviso }: { aviso?: string }) {
  const [state, action] = useActionState(recuperar, undefined);
  if (state?.ok) {
    return (
      <div className="card flex flex-col gap-2 p-5">
        <h2 className="display text-2xl">Revisá tu email</h2>
        <p className="text-[15px] leading-relaxed text-muted">
          Si ese email tiene cuenta, te llegó un link para elegir una contraseña nueva. Revisá también la carpeta de spam.
        </p>
        <Link href="/ingresar" className="btn-ghost mt-3">Volver</Link>
      </div>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-4">
      <h2 className="display text-2xl">Recuperar contraseña</h2>
      <FormError message={state?.error ?? aviso} />
      <label className="flex flex-col gap-1.5">
        <span className="label">Email</span>
        <input name="email" type="email" autoComplete="email" required className="input" />
      </label>
      <div className="mt-2 flex flex-col items-center gap-3">
        <Submit pendingText="Enviando…">Mandarme un link</Submit>
        <Link href="/ingresar" className="px-3 py-2 text-[15px] font-semibold text-accent">Volver a ingresar</Link>
      </div>
    </form>
  );
}
