"use client";

import { useEffect, useState } from "react";
import { duracion } from "@/lib/time";

/**
 * "hace 1 h 40" / "Duerme hace 38 min" que se mantiene al día solo.
 * `extraMin` suma minutos ya cerrados (ej. siestas anteriores del día).
 * Mientras carga muestra `inicial`, el valor calculado en el servidor.
 */
export function LiveDuration({ since, extraMin = 0, prefix = "", inicial, className }: { since: string; extraMin?: number; prefix?: string; inicial: string; className?: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const t = setInterval(tick, 15_000);
    const alVolver = () => document.visibilityState === "visible" && tick();
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      clearTimeout(first);
      clearInterval(t);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, []);
  if (now === null) return <span className={className}>{inicial}</span>;
  const min = extraMin + (now - new Date(since).getTime()) / 60000;
  const texto = prefix === "hace " && min < 1 ? "recién" : `${prefix}${duracion(min)}`;
  return <span className={className}>{texto}</span>;
}
