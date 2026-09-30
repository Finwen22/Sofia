"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ingresar } from "../actions";
import { FormError } from "@/components/FormError";
import { Submit } from "@/components/Submit";

export function IngresarForm({ aviso, info }: { aviso?: string; info?: string }) {
  const [state, action] = useActionState(ingresar, undefined);
  return (
    <form action={action} className="flex flex-col gap-4">
      {info && !state?.error && (
        <p role="status" className="rounded-2xl bg-soft px-4 py-3 text-[15px] text-soft-ink">{info}</p>
      )}
      <FormError message={state?.error ?? aviso} />
      <label className="flex flex-col gap-1.5">
        <span className="label">Email</span>
        <input name="email" type="email" autoComplete="email" required className="input" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="label">Contraseña</span>
        <input name="password" type="password" autoComplete="current-password" required className="input" />
      </label>
      <div className="mt-2 flex flex-col items-center gap-3">
        <Submit pendingText="Ingresando…">Ingresar</Submit>
        <Link href="/crear-cuenta" className="px-3 py-2 text-[15px] font-semibold text-accent">
          Crear una cuenta
        </Link>
        <Link href="/recuperar" className="px-3 py-1 text-[14px] text-muted">
          Me olvidé la contraseña
        </Link>
      </div>
    </form>
  );
}
