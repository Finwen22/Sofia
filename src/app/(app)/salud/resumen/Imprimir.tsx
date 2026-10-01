"use client";

import { Icon } from "@/components/Icon";

/** En el celular, "Imprimir" deja guardar como PDF o mandarlo por WhatsApp/mail. */
export function Imprimir() {
  return (
    <button type="button" onClick={() => window.print()} className="btn-primary h-12 text-[15px] print:hidden">
      <Icon name="share" size={18} /> Guardar PDF o compartir
    </button>
  );
}
