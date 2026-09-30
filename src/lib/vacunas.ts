// Calendario Nacional de Vacunación de Argentina (primeros años).
// Referencia orientativa: la libreta y el pediatra mandan. El Ministerio de
// Salud lo actualiza; revisar cada tanto contra la versión oficial vigente.

export type Dosis = {
  code: string;
  vacuna: string;
  dosis: string;
  meses: number; // edad recomendada en meses (0 = al nacer)
  nota?: string;
};

export const CALENDARIO: Dosis[] = [
  { code: "bcg", vacuna: "BCG", dosis: "Única", meses: 0, nota: "Antes del alta de la maternidad." },
  { code: "hb-rn", vacuna: "Hepatitis B", dosis: "Neonatal", meses: 0, nota: "En las primeras 12 horas de vida." },

  { code: "neumo-1", vacuna: "Neumococo conjugada", dosis: "1.ª dosis", meses: 2 },
  { code: "quintuple-1", vacuna: "Quíntuple (pentavalente)", dosis: "1.ª dosis", meses: 2 },
  { code: "ipv-1", vacuna: "Salk (IPV)", dosis: "1.ª dosis", meses: 2 },
  { code: "rota-1", vacuna: "Rotavirus", dosis: "1.ª dosis", meses: 2, nota: "Tiene edad máxima para aplicarse: no la dejes pasar." },

  { code: "menin-1", vacuna: "Meningococo", dosis: "1.ª dosis", meses: 3 },

  { code: "neumo-2", vacuna: "Neumococo conjugada", dosis: "2.ª dosis", meses: 4 },
  { code: "quintuple-2", vacuna: "Quíntuple (pentavalente)", dosis: "2.ª dosis", meses: 4 },
  { code: "ipv-2", vacuna: "Salk (IPV)", dosis: "2.ª dosis", meses: 4 },
  { code: "rota-2", vacuna: "Rotavirus", dosis: "2.ª dosis", meses: 4 },

  { code: "menin-2", vacuna: "Meningococo", dosis: "2.ª dosis", meses: 5 },

  { code: "quintuple-3", vacuna: "Quíntuple (pentavalente)", dosis: "3.ª dosis", meses: 6 },
  { code: "ipv-3", vacuna: "Salk (IPV)", dosis: "3.ª dosis", meses: 6 },
  { code: "gripe-1", vacuna: "Antigripal", dosis: "1.ª dosis", meses: 6, nota: "En temporada; la primera vez son 2 dosis separadas 4 semanas." },
  { code: "gripe-2", vacuna: "Antigripal", dosis: "2.ª dosis", meses: 7 },

  { code: "neumo-r", vacuna: "Neumococo conjugada", dosis: "Refuerzo", meses: 12 },
  { code: "triple-viral-1", vacuna: "Triple viral", dosis: "1.ª dosis", meses: 12 },
  { code: "hepa", vacuna: "Hepatitis A", dosis: "Única", meses: 12 },

  { code: "menin-r", vacuna: "Meningococo", dosis: "Refuerzo", meses: 15 },
  { code: "varicela-1", vacuna: "Varicela", dosis: "1.ª dosis", meses: 15 },

  { code: "quintuple-r", vacuna: "Quíntuple (pentavalente)", dosis: "Refuerzo", meses: 15, nota: "Entre los 15 y 18 meses." },
  { code: "fa", vacuna: "Fiebre amarilla", dosis: "1.ª dosis", meses: 18, nota: "Solo en zonas de riesgo o si viajan a una." },

  { code: "triple-viral-2", vacuna: "Triple viral", dosis: "2.ª dosis", meses: 60, nota: "Ingreso escolar (5 años)." },
  { code: "dtp-r", vacuna: "Triple bacteriana celular", dosis: "Refuerzo", meses: 60, nota: "Ingreso escolar (5 años)." },
  { code: "ipv-r", vacuna: "Salk (IPV)", dosis: "Refuerzo", meses: 60, nota: "Ingreso escolar (5 años)." },
  { code: "varicela-2", vacuna: "Varicela", dosis: "2.ª dosis", meses: 60, nota: "Ingreso escolar (5 años)." },
];

export function etiquetaEdad(meses: number): string {
  if (meses === 0) return "Al nacer";
  if (meses < 24) return `${meses} ${meses === 1 ? "mes" : "meses"}`;
  return `${Math.floor(meses / 12)} años`;
}

export type EstadoDosis = "aplicada" | "atrasada" | "proxima" | "futura";
