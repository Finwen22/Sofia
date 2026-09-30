"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import { agregarItem } from "./actions";
import { CATEGORIAS } from "./categorias";
import { FormError } from "@/components/FormError";
import { Icon } from "@/components/Icon";

export function AgregarItem({ sugerencias }: { sugerencias: { name: string; category: string }[] }) {
  const [state, action, pending] = useActionState(agregarItem, undefined);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) form.current?.reset();
  }, [state]);

  function rapido(s: { name: string; category: string }) {
    const fd = new FormData();
    fd.set("name", s.name);
    fd.set("category", s.category);
    startTransition(() => action(fd));
  }

  return (
    <div className="flex flex-col gap-3">
      <form ref={form} action={action} className="card flex flex-col gap-2.5 p-3">
        <div className="flex gap-2">
          <input name="name" required placeholder="Qué hay que comprar" aria-label="Producto" className="input flex-1" />
          <button disabled={pending} aria-label="Agregar" className="flex size-[52px] shrink-0 items-center justify-center rounded-2xl bg-accent text-on-accent disabled:opacity-60">
            <Icon name="plus" size={24} stroke={2} />
          </button>
        </div>
        <div className="flex gap-2">
          <input name="quantity" placeholder="Cantidad (opcional)" aria-label="Cantidad" className="input h-11 flex-1 px-3 text-[15px]" />
          <select name="category" defaultValue="higiene" aria-label="Categoría" className="input h-11 flex-1 px-3 text-[15px]">
            {CATEGORIAS.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
        </div>
        <FormError message={state?.error} />
      </form>
      {sugerencias.length > 0 && (
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
          {sugerencias.map((s) => (
            <button
              key={s.name}
              type="button"
              disabled={pending}
              onClick={() => rapido(s)}
              className="flex h-10 shrink-0 items-center gap-1 rounded-full border border-line bg-surface px-3.5 text-[14px] font-semibold text-muted"
            >
              <Icon name="plus" size={14} stroke={2} /> {s.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
