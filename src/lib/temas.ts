// Combinaciones de color de la app. Todas sobre fondo oscuro (se usa mucho de
// noche) con un acento pastel; el color de alerta es el mismo en todas para
// que nunca se confunda con el acento. Cada persona elige la suya.

export type Tema = {
  code: string;
  nombre: string;
  colores: Record<"bg" | "surface" | "surface-2" | "line" | "ink" | "muted" | "faint" | "accent" | "on-accent" | "soft" | "soft-ink", string>;
};

export const TEMAS: Tema[] = [
  {
    code: "arena",
    nombre: "Arena",
    colores: { bg: "#221d19", surface: "#2d2621", "surface-2": "#362e27", line: "#3f352d", ink: "#f0e6d8", muted: "#b9aa97", faint: "#a19280", accent: "#d8b389", "on-accent": "#2a211a", soft: "#3a2f26", "soft-ink": "#e6cba8" },
  },
  {
    code: "celeste",
    nombre: "Celeste",
    colores: { bg: "#1a1f24", surface: "#222a31", "surface-2": "#2a333b", line: "#34404a", ink: "#e6eef4", muted: "#a8b6c1", faint: "#86959f", accent: "#a9d2ef", "on-accent": "#142230", soft: "#26323c", "soft-ink": "#c4e0f3" },
  },
  {
    code: "durazno",
    nombre: "Durazno",
    colores: { bg: "#241c19", surface: "#2f2521", "surface-2": "#382c27", line: "#44352e", ink: "#f6e7df", muted: "#c4ab9e", faint: "#a58f83", accent: "#f5c3a3", "on-accent": "#2e1b12", soft: "#3d2d26", "soft-ink": "#f7d3bd" },
  },
  {
    code: "lavanda",
    nombre: "Lavanda",
    colores: { bg: "#1e1b24", surface: "#27232f", "surface-2": "#2f2a38", line: "#3a3445", ink: "#ece6f5", muted: "#b3aac3", faint: "#91889f", accent: "#cdbcf0", "on-accent": "#1f1830", soft: "#2f2840", "soft-ink": "#ddd1f5" },
  },
  {
    code: "salvia",
    nombre: "Salvia",
    colores: { bg: "#1b201c", surface: "#232a25", "surface-2": "#2b332d", line: "#354038", ink: "#e6f0e8", muted: "#aab9ae", faint: "#89988d", accent: "#b6dcbf", "on-accent": "#16271b", soft: "#28342c", "soft-ink": "#cde8d4" },
  },
  {
    code: "rosa",
    nombre: "Rosa",
    colores: { bg: "#241b1f", surface: "#2f2328", "surface-2": "#382a30", line: "#44333a", ink: "#f6e6ec", muted: "#c4aab5", faint: "#9e8792", accent: "#f3c1d3", "on-accent": "#2e1620", soft: "#3d2a32", "soft-ink": "#f6d2df" },
  },
];

export const TEMA_POR_DEFECTO = "arena";

export function temaValido(code: string | null | undefined): string {
  return TEMAS.some((t) => t.code === code) ? (code as string) : TEMA_POR_DEFECTO;
}

export const colorFondo = (code: string) => (TEMAS.find((t) => t.code === code) ?? TEMAS[0]).colores.bg;

/** CSS de todas las combinaciones: [data-tema="x"] { --color-…: … }. */
export function cssTemas(): string {
  return TEMAS.map((t) => `[data-tema="${t.code}"]{${Object.entries(t.colores).map(([k, v]) => `--color-${k}:${v}`).join(";")}}`).join("\n");
}
