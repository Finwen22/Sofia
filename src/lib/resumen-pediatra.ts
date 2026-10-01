import type { Diaper, Feeding, Sleep } from "@/lib/types";
import { avisoColor } from "@/lib/panal";
import { sesionesDeToma, minutosDeSueno, duracionToma } from "@/lib/resumen";
import { diasDesde, minutosEntre, toDateInput } from "@/lib/time";

export type DiaResumen = {
  dia: string; // "2026-10-01"
  tomas: number; // sesiones (los dos pechos seguidos cuentan como una)
  minPecho: number;
  ml: number;
  pis: number;
  caca: number;
  suenoMin: number;
};

export type Resumen = {
  dias: DiaResumen[];
  diasConDatos: number;
  promedio: { tomas: number; minPecho: number; ml: number; pis: number; caca: number; suenoMin: number };
  intervaloMin: number | null;
  mayorPausa: { min: number; desde: Date } | null;
  siestaMasLarga: number | null;
  colores: Record<string, number>;
  llamativos: Diaper[];
};

const diaAR = (d: string | Date) => toDateInput(new Date(d));

function diasEntre(desde: Date, hasta: Date): string[] {
  const out: string[] = [];
  const fin = diaAR(hasta);
  let d = new Date(`${diaAR(desde)}T12:00:00-03:00`);
  while (diaAR(d) <= fin) {
    out.push(diaAR(d));
    d = new Date(d.getTime() + 86400_000);
  }
  return out;
}

export function resumirPeriodo(opts: { desde: Date; hasta: Date; birthAt: string; feedings: Feeding[]; diapers: Diaper[]; sleeps: Sleep[] }): Resumen {
  const { desde, hasta, birthAt, feedings, diapers, sleeps } = opts;
  const sesiones = sesionesDeToma(feedings).filter((s) => s >= desde && s <= hasta);

  const dias: DiaResumen[] = diasEntre(desde, hasta)
    .map((dia) => {
      const ini = new Date(`${dia}T00:00:00-03:00`);
      const fin = new Date(Math.min(ini.getTime() + 86400_000, hasta.getTime()));
      const tomasDia = feedings.filter((f) => diaAR(f.started_at) === dia);
      const panalesDia = diapers.filter((p) => diaAR(p.changed_at) === dia);
      return {
        dia,
        tomas: sesiones.filter((s) => diaAR(s) === dia).length,
        minPecho: Math.round(tomasDia.filter((f) => f.kind === "pecho" && f.ended_at).reduce((a, f) => a + duracionToma(f), 0)),
        ml: tomasDia.reduce((a, f) => a + (f.amount_ml ?? 0), 0),
        pis: panalesDia.filter((p) => p.pee).length,
        caca: panalesDia.filter((p) => p.poop).length,
        suenoMin: Math.round(minutosDeSueno(sleeps, ini, fin)),
      };
    })
    .reverse();

  // Para los promedios solo cuentan los días con algo cargado (si empezaron a
  // usar la app a mitad del período, no se subestima).
  const conDatos = dias.filter((d) => d.tomas || d.pis || d.caca || d.suenoMin);
  const n = conDatos.length || 1;
  const prom = (k: keyof Omit<DiaResumen, "dia">) => conDatos.reduce((a, d) => a + d[k], 0) / n;

  let intervaloMin: number | null = null;
  let mayorPausa: Resumen["mayorPausa"] = null;
  if (sesiones.length >= 2) {
    let total = 0;
    for (let i = 1; i < sesiones.length; i++) {
      const gap = minutosEntre(sesiones[i - 1], sesiones[i]);
      total += gap;
      if (!mayorPausa || gap > mayorPausa.min) mayorPausa = { min: gap, desde: sesiones[i - 1] };
    }
    intervaloMin = total / (sesiones.length - 1);
  }

  const terminadas = sleeps.filter((s) => s.ended_at && new Date(s.started_at) >= desde);
  const siestaMasLarga = terminadas.length ? Math.max(...terminadas.map((s) => minutosEntre(s.started_at, s.ended_at!))) : null;

  const colores: Record<string, number> = {};
  for (const p of diapers) if (p.poop && p.poop_color) colores[p.poop_color] = (colores[p.poop_color] ?? 0) + 1;
  const llamativos = diapers.filter((p) => p.poop && avisoColor(p.poop_color, diasDesde(birthAt, new Date(p.changed_at))));

  return {
    dias,
    diasConDatos: conDatos.length,
    promedio: { tomas: prom("tomas"), minPecho: prom("minPecho"), ml: prom("ml"), pis: prom("pis"), caca: prom("caca"), suenoMin: prom("suenoMin") },
    intervaloMin,
    mayorPausa,
    siestaMasLarga,
    colores,
    llamativos,
  };
}
