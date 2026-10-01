"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registrarse } from "../actions";
import { FormError } from "@/components/FormError";
import { Submit } from "@/components/Submit";

export function RegistroForm({ email }: { email?: string }) {
  const [state, action] = useActionState(registrarse, undefined);

  if (state?.ok) {
    return (
      <div className="card flex flex-col gap-2 p-5">
        <h2 className="display text-2xl">Revisá tu email</h2>
        <p className="text-[15px] leading-relaxed text-muted">Te mandamos un link para confirmar la cuenta. Después volvé acá e ingresá.</p>
        <Link href="/ingresar" className="btn-primary mt-3">Ir a ingresar</Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <FormError message={state?.error} />
      <label className="flex flex-col gap-1.5">
        <span className="label">Tu nombre</span>
        <input name="nombre" autoComplete="given-name" required className="input" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="label">Email</span>
        <input name="email" type="email" autoComplete="email" required defaultValue={email} className="input" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="label">Contraseña</span>
        <input name="password" type="password" autoComplete="new-password" minLength={8} required className="input" />
        <span className="text-[13px] text-faint">Mínimo 8 caracteres.</span>
      </label>
      <p className="text-[13px] leading-relaxed text-muted">Si te invitaron, registrate con el mismo email de la invitación y entrás directo a la familia.</p>
      <div className="mt-2 flex flex-col items-center gap-3">
        <Submit pendingText="Creando…">Crear cuenta</Submit>
        <Link href="/ingresar" className="px-3 py-2 text-[15px] font-semibold text-accent">
          Ya tengo cuenta
        </Link>
      </div>
    </form>
  );
}
