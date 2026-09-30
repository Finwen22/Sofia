import type { Diaper, Feeding, Sleep, VaccineDose } from "@/lib/types";
import { CALENDARIO, type Dosis, type EstadoDosis } from "@/lib/vacunas";
import { avisoColor } from "@/lib/panal";
import { diasDesde, minutosEntre, sumarMeses } from "@/lib/time";

/** Tomas que empiezan con menos de 45 min de diferencia cuentan como una sola (ej. un pecho y después el otro). */
export function sesionesDeToma(feedings: Feeding[]): Date[] {
  const starts = feedings.map((f) => new Date(f.started_at)).sort((a, b) => a.getTime() - b.getTime());
  const out: Date[] = [];
  for (const s of starts) {
    const prev = out[out.length - 1];
    if (!prev || minutosEntre(prev, s) >= 45) out.push(s);
  }
  return out;
}

/** Promedio en minutos entre tomas (necesita al menos 3 sesiones). */
export function intervaloPromedio(feedings: Feeding[]): number | null {
  const s = sesionesDeToma(feedings);
  if (s.length < 3) return null;
  let total = 0;
  for (let i = 1; i < s.length; i++) total += minutosEntre(s[i - 1], s[i]);
  return total / (s.length - 1);
}

export function duracionToma(f: Feeding, now = new Date()): number {
  return minutosEntre(f.started_at, f.ended_at ?? now);
}

/** Minutos de sueño que caen dentro de [desde, hasta]. */
export function minutosDeSueno(sleeps: Sleep[], desde: Date, hasta = new Date()): number {
  let total = 0;
  for (const s of sleeps) {
    const a = Math.max(new Date(s.started_at).getTime(), desde.getTime());
    const b = Math.min(new Date(s.ended_at ?? hasta).getTime(), hasta.getTime());
    if (b > a) total += (b - a) / 60000;
  }
  return total;
}

/**
 * Lado sugerido para empezar. Si la última toma usó un solo pecho, el otro;
 * si usó los dos, el último (terminó ahí y quedó menos vaciado el que no).
 */
export function ladoSugerido(feedings: Feeding[]): "izquierdo" | "derecho" | null {
  const pechos = feedings.filter((f) => f.kind === "pecho" && (f.side === "izquierdo" || f.side === "derecho"));
  const ult = pechos[0];
  if (!ult) return null;
  const previa = pechos[1];
  const mismaSesion = previa && previa.side !== ult.side && minutosEntre(previa.started_at, ult.started_at) < 45;
  if (mismaSesion) return ult.side as "izquierdo" | "derecho";
  return ult.side === "izquierdo" ? "derecho" : "izquierdo";
}

export type DosisConEstado = Dosis & { estado: EstadoDosis; fecha: Date; aplicada?: VaccineDose };

export function estadoVacunas(birthAt: string, doses: VaccineDose[], now = new Date()): DosisConEstado[] {
  const birth = new Date(birthAt);
  return CALENDARIO.map((d) => {
    const fecha = d.meses === 0 ? birth : sumarMeses(birth, d.meses);
    const aplicada = doses.find((x) => x.vaccine_code === d.code);
    let estado: EstadoDosis;
    if (aplicada) estado = "aplicada";
    else if (diasDesde(fecha, now) > 14) estado = "atrasada";
    else if (diasDesde(fecha, now) > -45) estado = "proxima";
    else estado = "futura";
    return { ...d, fecha, estado, aplicada };
  });
}

export type Aviso = { texto: string; href?: string };

export function avisos(opts: {
  birthAt: string;
  feedings: Feeding[];
  diapers24: Diaper[];
  primerPanal: string | null;
  vacunas: DosisConEstado[];
  now?: Date;
}): Aviso[] {
  const now = opts.now ?? new Date();
  const dias = diasDesde(opts.birthAt, now);
  const out: Aviso[] = [];

  // Pañales mojados: desde el 5.º día se esperan 6 o más por día.
  const conPis = opts.diapers24.filter((d) => d.pee).length;
  const hayHistorial = opts.primerPanal && minutosEntre(opts.primerPanal, now) > 20 * 60;
  if (dias >= 5 && hayHistorial && conPis < 6) {
    out.push({ texto: `${conPis} pañales con pis en las últimas 24 h. A esta edad se esperan 6 o más: si sigue así, consultá al pediatra.`, href: "/registro" });
  }

  // Colores de deposición que conviene consultar (últimas 24 h).
  const raro = opts.diapers24.find((d) => d.poop && avisoColor(d.poop_color, diasDesde(opts.birthAt, new Date(d.changed_at))));
  if (raro) out.push({ texto: avisoColor(raro.poop_color, diasDesde(opts.birthAt, new Date(raro.changed_at)))!, href: "/registro" });

  // Recién nacidos: no más de ~3 h entre tomas.
  const ultima = opts.feedings[0];
  if (dias < 30 && ultima && !opts.feedings.some((f) => !f.ended_at) && minutosEntre(ultima.started_at, now) > 180) {
    out.push({ texto: "Pasaron más de 3 horas desde la última toma registrada." });
  }

  const atrasadas = opts.vacunas.filter((v) => v.estado === "atrasada");
  if (atrasadas.length) {
    out.push({ texto: `${atrasadas.length === 1 ? "Hay 1 vacuna atrasada" : `Hay ${atrasadas.length} vacunas atrasadas`} según el calendario.`, href: "/salud/vacunas" });
  }
  return out;
}
