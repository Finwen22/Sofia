// Temperatura y síntomas: orientación general de qué hacer, según la edad.
// La app NO diagnostica: ordena la información y dice cuándo consultar.
// Criterios generales de pediatría (fiebre ≥ 38 °C; en menores de 3 meses es
// motivo de consulta inmediata). Ante la duda, siempre consultar.

export type Nivel = "urgente" | "hoy" | "atencion" | "ok";

export type Sintoma = { code: string; label: string; nivel?: Nivel; texto?: string };

export const SINTOMAS: Sintoma[] = [
  { code: "respirar", label: "Le cuesta respirar", nivel: "urgente", texto: "Respira con esfuerzo, se le hunden las costillas o hace ruido al respirar" },
  { code: "azul", label: "Labios o piel azulados", nivel: "urgente" },
  { code: "manchas", label: "Manchas que no se van al apretar", nivel: "urgente" },
  { code: "convulsion", label: "Convulsión o movimientos raros", nivel: "urgente" },
  { code: "decaida", label: "Muy decaída, cuesta despertarla", nivel: "urgente" },
  { code: "no_come", label: "Rechaza varias tomas seguidas", nivel: "hoy" },
  { code: "vomitos", label: "Vómitos (no regurgitación)", nivel: "hoy", texto: "Si son en chorro, verdes o con sangre, es urgente" },
  { code: "diarrea", label: "Diarrea", nivel: "hoy" },
  { code: "amarilla", label: "Piel u ojos amarillos", nivel: "hoy" },
  { code: "cordon", label: "Cordón con olor, pus o piel roja alrededor", nivel: "hoy" },
  { code: "llanto", label: "Llanto que no se calma", nivel: "atencion" },
  { code: "mocos", label: "Mocos o nariz tapada" },
  { code: "tos", label: "Tos" },
  { code: "sarpullido", label: "Granitos o sarpullido" },
  { code: "lagañas", label: "Ojos con lagañas" },
];

export const METODOS = [
  { code: "axilar", label: "Axila" },
  { code: "rectal", label: "Rectal" },
  { code: "oido", label: "Oído" },
  { code: "frente", label: "Frente" },
] as const;

export type Evaluacion = { nivel: Nivel; titulo: string; texto: string };

const ORDEN: Record<Nivel, number> = { urgente: 3, hoy: 2, atencion: 1, ok: 0 };

export function evaluarTemperatura(temp: number | null, diasDeVida: number): Evaluacion | null {
  if (temp === null || Number.isNaN(temp)) return null;
  if (temp < 36)
    return { nivel: "hoy", titulo: "Temperatura baja", texto: "Abrigala, ponela piel con piel y volvé a medir en 20 minutos. Si sigue por debajo de 36 °C, consultá al pediatra." };
  if (temp < 37.5) return { nivel: "ok", titulo: "Temperatura normal", texto: "Está dentro de lo esperable." };
  if (temp < 38)
    return { nivel: "atencion", titulo: "Febrícula", texto: "Sacale una capa de ropa y volvé a medir en 30 minutos. Si llega a 38 °C, consultá al pediatra." };
  if (diasDeVida < 90 || temp >= 40)
    return {
      nivel: "urgente",
      titulo: "Fiebre: consultá ya",
      texto:
        diasDeVida < 90
          ? "En bebés de menos de 3 meses, 38 °C o más es motivo de consulta inmediata: andá a la guardia o llamá al pediatra ahora. No le des antitérmicos sin indicación."
          : "40 °C o más: andá a la guardia o llamá al pediatra ahora.",
    };
  if (diasDeVida < 180)
    return { nivel: "hoy", titulo: "Fiebre", texto: "Entre 3 y 6 meses, la fiebre se consulta en el día: llamá al pediatra hoy." };
  return {
    nivel: "atencion",
    titulo: "Fiebre",
    texto: "Volvé a medir en una hora. Si dura más de 24 h, pasa de 39 °C o la ves decaída, consultá al pediatra.",
  };
}

export function evaluarSintomas(codes: string[]): Evaluacion | null {
  const lista = SINTOMAS.filter((s) => codes.includes(s.code) && s.nivel);
  if (!lista.length) return null;
  const peor = lista.reduce((a, b) => (ORDEN[b.nivel!] > ORDEN[a.nivel!] ? b : a));
  if (peor.nivel === "urgente")
    return { nivel: "urgente", titulo: "Síntoma de alarma", texto: `${peor.label}: andá a la guardia o llamá al pediatra ahora.` };
  if (peor.nivel === "hoy")
    return { nivel: "hoy", titulo: "Para consultar hoy", texto: `${lista.filter((s) => s.nivel === "hoy").map((s) => s.label.toLowerCase()).join(", ")}: llamá al pediatra hoy.` };
  return { nivel: "atencion", titulo: "Para tener en cuenta", texto: "Si no se calma o se suma otro síntoma, consultá al pediatra." };
}

/** La más importante entre temperatura y síntomas. */
export function evaluar(temp: number | null, codes: string[], diasDeVida: number): Evaluacion | null {
  const a = evaluarTemperatura(temp, diasDeVida);
  const b = evaluarSintomas(codes);
  if (!a) return b;
  if (!b) return a;
  return ORDEN[b.nivel] > ORDEN[a.nivel] ? b : a;
}

export const etiquetaSintoma = (code: string) => SINTOMAS.find((s) => s.code === code)?.label ?? code;

export const formatoTemp = (t: number) => `${t.toLocaleString("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} °C`;
