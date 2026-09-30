// Colores de deposición y qué hacer con cada uno. Solo orientativo: la app
// no diagnostica, avisa para consultar.

export type Color = {
  code: string;
  label: string;
  hex: string;
  aviso?: string;
  /** Solo es esperable los primeros días de vida. */
  soloPrimerosDias?: boolean;
};

export const COLORES: Color[] = [
  { code: "meconio", label: "Meconio", hex: "#2F3526", soloPrimerosDias: true },
  { code: "amarillo", label: "Amarillo mostaza", hex: "#D8B040" },
  { code: "verde", label: "Verde", hex: "#7A8A3A" },
  { code: "marron", label: "Marrón", hex: "#8A5A2E" },
  { code: "naranja", label: "Naranja", hex: "#D9822B" },
  { code: "rojo", label: "Rojo o con sangre", hex: "#B03A2E", aviso: "Con sangre o roja: consultá al pediatra hoy." },
  { code: "negro", label: "Negro", hex: "#141210", aviso: "Negra después de los primeros días: consultá al pediatra." },
  { code: "blanco", label: "Blanca o gris", hex: "#DAD6CC", aviso: "Blanca, gris o muy pálida: consultá al pediatra cuanto antes." },
];

export const CONSISTENCIAS = [
  { code: "liquida", label: "Líquida" },
  { code: "blanda", label: "Blanda" },
  { code: "pastosa", label: "Pastosa" },
  { code: "grumosa", label: "Con grumos" },
  { code: "dura", label: "Dura" },
] as const;

export function color(code: string | null | undefined): Color | undefined {
  return COLORES.find((c) => c.code === code);
}

/** Aviso a mostrar para un color según la edad en días. */
export function avisoColor(code: string | null | undefined, diasDeVida: number): string | null {
  const c = color(code);
  if (!c) return null;
  if (c.code === "negro" && diasDeVida < 4) return null; // puede ser meconio
  if (c.code === "meconio" && diasDeVida > 5) return "Meconio después de la primera semana: comentáselo al pediatra.";
  return c.aviso ?? null;
}
