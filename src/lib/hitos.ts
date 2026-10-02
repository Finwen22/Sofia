// "Primeras veces" para el diario. Sin edades esperadas a propósito: es un
// álbum, no un control del desarrollo (eso lo mira el pediatra).

export type Hito = { code: string; label: string };

export const HITOS: Hito[] = [
  { code: "llegada_casa", label: "Llegada a casa" },
  { code: "primer_bano", label: "Primer baño" },
  { code: "primera_salida", label: "Primera salida" },
  { code: "primera_sonrisa", label: "Primera sonrisa" },
  { code: "sostiene_cabeza", label: "Sostiene la cabeza" },
  { code: "primera_carcajada", label: "Primera carcajada" },
  { code: "agarra_objetos", label: "Agarra un juguete" },
  { code: "se_da_vuelta", label: "Se da vuelta sola" },
  { code: "duerme_toda_noche", label: "Primera noche de corrido" },
  { code: "primera_papilla", label: "Primera comida" },
  { code: "primer_diente", label: "Primer diente" },
  { code: "se_sienta", label: "Se sienta sola" },
  { code: "gatea", label: "Gatea" },
  { code: "primera_palabra", label: "Primera palabra" },
  { code: "se_para", label: "Se para sola" },
  { code: "primeros_pasos", label: "Primeros pasos" },
  { code: "primer_corte_pelo", label: "Primer corte de pelo" },
  { code: "primer_viaje", label: "Primer viaje" },
  { code: "primer_cumple", label: "Primer cumpleaños" },
];

export const etiquetaHito = (code: string | null) => HITOS.find((h) => h.code === code)?.label ?? null;

export const MAX_FOTOS = 6;
