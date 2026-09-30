"use client";

import { Icon } from "./Icon";

/** Botón de borrar con confirmación (evita borrados por un toque dormido). */
export function DeleteButton({
  action,
  fields,
  pregunta = "¿Borrar?",
  label = "Borrar",
}: {
  action: (fd: FormData) => void | Promise<void>;
  fields: Record<string, string>;
  pregunta?: string;
  label?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(pregunta)) e.preventDefault();
      }}
    >
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <button aria-label={label} className="flex size-11 items-center justify-center rounded-xl text-faint hover:text-alert">
        <Icon name="trash" size={18} />
      </button>
    </form>
  );
}
