import "server-only";
import { OMS, type LMS } from "@/lib/oms-datos";

export type Indicador = "peso" | "talla" | "pc";
export type Sexo = "m" | "f";

export const INDICADORES: Record<Indicador, { label: string; unidad: string; corto: string }> = {
  peso: { label: "Peso", unidad: "kg", corto: "Peso" },
  talla: { label: "Talla (largo)", unidad: "cm", corto: "Talla" },
  pc: { label: "Perímetro cefálico", unidad: "cm", corto: "PC" },
};

// Percentiles que dibujan las curvas de la OMS y su z equivalente.
export const PERCENTILES = [
  { p: 3, z: -1.88079 },
  { p: 15, z: -1.03643 },
  { p: 50, z: 0 },
  { p: 85, z: 1.03643 },
  { p: 97, z: 1.88079 },
];

export const MAX_DIAS = 730;

/** Parámetros LMS para una edad (en días, con decimales), interpolando entre días. */
function lms(ind: Indicador, sexo: Sexo, dias: number): LMS | null {
  if (dias < 0 || dias > MAX_DIAS) return null;
  const t = OMS[ind][sexo];
  const a = Math.floor(dias);
  const b = Math.min(a + 1, MAX_DIAS);
  const f = dias - a;
  return [0, 1, 2].map((i) => t[a][i] + (t[b][i] - t[a][i]) * f) as LMS;
}

function valorEnZ([L, M, S]: LMS, z: number) {
  return L === 0 ? M * Math.exp(S * z) : M * Math.pow(1 + L * S * z, 1 / L);
}

/** Valor de la curva de la OMS para un z dado (ej. z=0 → mediana). */
export function curva(ind: Indicador, sexo: Sexo, dias: number, z: number): number | null {
  const p = lms(ind, sexo, dias);
  return p ? valorEnZ(p, z) : null;
}

/**
 * Puntaje z de una medición. Para el peso se aplica el ajuste de la OMS más
 * allá de ±3 DE (como hace WHO Anthro), que evita exagerar los extremos.
 */
export function puntajeZ(ind: Indicador, sexo: Sexo, dias: number, valor: number): number | null {
  const p = lms(ind, sexo, dias);
  if (!p || !(valor > 0)) return null;
  const [L, M, S] = p;
  let z = L === 0 ? Math.log(valor / M) / S : (Math.pow(valor / M, L) - 1) / (L * S);
  if (ind === "peso" && Math.abs(z) > 3) {
    const signo = Math.sign(z);
    const sd3 = valorEnZ(p, 3 * signo);
    const sd23 = Math.abs(sd3 - valorEnZ(p, 2 * signo));
    z = signo * 3 + (valor - sd3) / sd23;
  }
  return z;
}

// Función de distribución normal (Abramowitz y Stegun 7.1.26; error < 1e-7).
function normal(z: number) {
  const t = 1 / (1 + 0.3275911 * (Math.abs(z) / Math.SQRT2));
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(z * z) / 2);
  return z >= 0 ? (1 + y) / 2 : (1 - y) / 2;
}

/** Percentil (0-100) de un puntaje z. */
export function percentil(z: number) {
  return normal(z) * 100;
}

export function textoPercentil(z: number) {
  const p = percentil(z);
  if (p < 0.1) return "< P0,1";
  if (p > 99.9) return "> P99,9";
  return `P${p < 1 || p > 99 ? p.toFixed(1).replace(".", ",") : Math.round(p)}`;
}

/**
 * Edad para las curvas, en días. Bebés prematuros (< 37 semanas) usan edad
 * corregida (se descuentan las semanas que faltaron hasta las 40).
 */
export function edadParaCurva(birthAt: string, fecha: Date | string, semanasGestacion: number | null) {
  const dias = (new Date(fecha).getTime() - new Date(birthAt).getTime()) / 86400_000;
  const correccion = semanasGestacion && semanasGestacion < 37 ? (40 - semanasGestacion) * 7 : 0;
  return { dias: Math.max(0, dias - correccion), corregida: correccion > 0 };
}
