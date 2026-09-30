import { fromLocalInput } from "@/lib/time";

export type ActionState = { error?: string; ok?: boolean } | undefined;

export function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
}

export function num(fd: FormData, key: string): number | null {
  const v = str(fd, key);
  if (v === null) return null;
  const n = Number(v.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/** Para decimales como 49,5 cm (no saca puntos de miles). */
export function dec(fd: FormData, key: string): number | null {
  const v = str(fd, key);
  if (v === null) return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export function bool(fd: FormData, key: string): boolean {
  const v = fd.get(key);
  return v === "on" || v === "true" || v === "1";
}

export function triBool(fd: FormData, key: string): boolean | null {
  const v = str(fd, key);
  if (v === "si") return true;
  if (v === "no") return false;
  return null;
}

export function when(fd: FormData, key: string): Date {
  const v = str(fd, key);
  return (v && fromLocalInput(v)) || new Date();
}

export function oneOf<T extends string>(v: string | null, options: readonly T[]): T | null {
  return v && (options as readonly string[]).includes(v) ? (v as T) : null;
}
