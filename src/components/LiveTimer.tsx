"use client";

import { useEffect, useState } from "react";

/** Minutos:segundos desde `since`, actualizándose cada segundo. */
export function LiveTimer({ since, className }: { since: string; className?: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const t = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, []);
  if (now === null) return <span className={className}>—</span>;
  const s = Math.max(0, Math.floor((now - new Date(since).getTime()) / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return (
    <span className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`}
    </span>
  );
}
