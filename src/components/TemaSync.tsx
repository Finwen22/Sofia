"use client";

import { useEffect } from "react";
import { colorFondo } from "@/lib/temas";

/** Guarda el tema elegido en una cookie de este celular y lo aplica. */
export function aplicarTema(tema: string) {
  document.documentElement.dataset.tema = tema;
  document.cookie = `tema=${tema}; path=/; max-age=31536000; samesite=lax`;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", colorFondo(tema));
}

/**
 * El tema vive en el perfil de cada persona; la cookie es solo para pintarlo
 * desde el primer instante. Si entra en otro celular, acá se sincroniza.
 */
export function TemaSync({ tema }: { tema: string }) {
  useEffect(() => {
    if (document.documentElement.dataset.tema !== tema) aplicarTema(tema);
  }, [tema]);
  return null;
}
