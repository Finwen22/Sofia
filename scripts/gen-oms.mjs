// Genera src/lib/oms-datos.ts con los parámetros LMS de los Patrones de
// Crecimiento Infantil de la OMS (0 a 24 meses, día por día).
// Fuente: github.com/WorldHealthOrganization/anthro (data-raw/growthstandards),
// copiados en scripts/oms/. Uso: node scripts/gen-oms.mjs
import { readFileSync, writeFileSync } from "node:fs";

const MAX_DIAS = 731;
const fuentes = { peso: "weianthro", talla: "lenanthro", pc: "hcanthro" };
const out = {};
for (const [ind, file] of Object.entries(fuentes)) {
  const filas = readFileSync(new URL(`./oms/${file}.txt`, import.meta.url), "utf8").trim().split(/\r?\n/).slice(1);
  out[ind] = { m: [], f: [] };
  for (const fila of filas) {
    const [sex, age, l, m, s] = fila.split("\t");
    const dia = Number(age);
    if (dia >= MAX_DIAS) continue;
    out[ind][sex === "1" ? "m" : "f"][dia] = [Number(l), Number(m), Number(s)];
  }
  for (const k of ["m", "f"]) if (out[ind][k].length !== MAX_DIAS || out[ind][k].some((x) => !x)) throw new Error(`faltan días en ${ind}/${k}`);
}
const ts = `// GENERADO por scripts/gen-oms.mjs — no editar a mano.
// Patrones de Crecimiento Infantil de la OMS (2006), parámetros LMS por día de vida (0-730).
// Fuente: github.com/WorldHealthOrganization/anthro
import "server-only";

export type LMS = [number, number, number];
export const OMS: Record<"peso" | "talla" | "pc", Record<"m" | "f", LMS[]>> = ${JSON.stringify(out)};
`;
writeFileSync(new URL("../src/lib/oms-datos.ts", import.meta.url), ts);
console.log("ok", (ts.length / 1024).toFixed(0), "KB");
