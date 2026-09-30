// Toda la app piensa en hora de Argentina (UTC-3, sin horario de verano),
// sin importar dónde corra el servidor.
export const TZ = "America/Argentina/Buenos_Aires";
const OFFSET = "-03:00";

/** "2026-09-30T14:05" (input datetime-local) → Date en hora argentina. */
export function fromLocalInput(value: string): Date | null {
  if (!value) return null;
  const d = new Date(`${value.length === 16 ? value + ":00" : value}${OFFSET}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Date → "2026-09-30T14:05" para precargar un input datetime-local. */
export function toLocalInput(d: Date = new Date()): string {
  const p = partsAR(d);
  return `${p.y}-${p.m}-${p.d}T${p.hh}:${p.mm}`;
}

/** Date → "2026-09-30" en hora argentina. */
export function toDateInput(d: Date = new Date()): string {
  const p = partsAR(d);
  return `${p.y}-${p.m}-${p.d}`;
}

function partsAR(d: Date) {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(d);
  const g = (t: string) => f.find((x) => x.type === t)!.value;
  return { y: g("year"), m: g("month"), d: g("day"), hh: g("hour"), mm: g("minute") };
}

/** Comienzo del día de hoy (00:00 en Argentina). */
export function startOfTodayAR(now: Date = new Date()): Date {
  return new Date(`${toDateInput(now)}T00:00:00${OFFSET}`);
}

export function hhmm(d: Date | string): string {
  return new Intl.DateTimeFormat("es-AR", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(d));
}

export function fechaLarga(d: Date | string = new Date()): string {
  const s = new Intl.DateTimeFormat("es-AR", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" }).format(new Date(d));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function fechaCorta(d: Date | string): string {
  return new Intl.DateTimeFormat("es-AR", { timeZone: TZ, weekday: "short", day: "numeric", month: "short" }).format(new Date(d));
}

export function fechaDia(d: Date | string): string {
  // Para columnas `date` ("2026-09-30") no hay que correr zona horaria.
  const date = typeof d === "string" && d.length === 10 ? new Date(`${d}T12:00:00${OFFSET}`) : new Date(d);
  return new Intl.DateTimeFormat("es-AR", { timeZone: TZ, day: "numeric", month: "short", year: "numeric" }).format(date);
}

/** Duración en minutos → "1 h 40" / "25 min". */
export function duracion(min: number): string {
  const m = Math.max(0, Math.round(min));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h} h ${r}` : `${h} h`;
}

export function minutosEntre(a: Date | string, b: Date | string = new Date()): number {
  return (new Date(b).getTime() - new Date(a).getTime()) / 60000;
}

export function haceCuanto(d: Date | string, now: Date = new Date()): string {
  const m = minutosEntre(d, now);
  if (m < 1) return "recién";
  return `hace ${duracion(m)}`;
}

/** Edad de la bebé: "12 días", "5 semanas", "3 meses y 4 días". */
export function edad(birth: Date | string, now: Date = new Date()): string {
  const b = new Date(birth);
  const dias = Math.floor((now.getTime() - b.getTime()) / 86400000);
  if (dias < 1) return "recién nacida";
  if (dias < 28) return dias === 1 ? "1 día" : `${dias} días`;
  const meses = mesesCumplidos(b, now);
  if (meses < 2) {
    const semanas = Math.floor(dias / 7);
    return `${semanas} semanas`;
  }
  const ref = sumarMeses(b, meses);
  const resto = Math.floor((now.getTime() - ref.getTime()) / 86400000);
  if (meses < 24) return resto ? `${meses} meses y ${resto} ${resto === 1 ? "día" : "días"}` : `${meses} meses`;
  const anios = Math.floor(meses / 12);
  const m = meses % 12;
  return m ? `${anios} años y ${m} ${m === 1 ? "mes" : "meses"}` : `${anios} años`;
}

export function mesesCumplidos(birth: Date, now: Date = new Date()): number {
  let m = 0;
  while (sumarMeses(birth, m + 1) <= now) m++;
  return m;
}

export function sumarMeses(d: Date, meses: number): Date {
  const r = new Date(d);
  const day = r.getUTCDate();
  r.setUTCDate(1);
  r.setUTCMonth(r.getUTCMonth() + meses);
  const last = new Date(Date.UTC(r.getUTCFullYear(), r.getUTCMonth() + 1, 0)).getUTCDate();
  r.setUTCDate(Math.min(day, last));
  return r;
}

export function diasDesde(d: Date | string, now: Date = new Date()): number {
  return Math.floor((now.getTime() - new Date(d).getTime()) / 86400000);
}
